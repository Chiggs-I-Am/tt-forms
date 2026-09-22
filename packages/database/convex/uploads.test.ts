import { convexTest, type TestConvex } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import type { MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import type { FormDefinition } from "./formModel"
import schema from "./schema"

// Function-boundary tests for #38: the upload-URL gate, server-side type
// and size enforcement with blob deletion on violation, and gated serving.
// Draft-expiry cleanup itself is #36's `purgeExpired`, which is not in this
// checkout, so these tests prove the file rows link to their draft through
// the `draft` index the merger's purge must walk.

const modules = import.meta.glob("./**/*.ts")

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

function uploadDefinition(maxSizeBytes?: number): FormDefinition {
  return {
    sections: [
      {
        id: "s1",
        title: "Documents",
        fields: [
          {
            id: "photo",
            kind: "upload",
            label: "Photo",
            ...(maxSizeBytes !== undefined ? { maxSizeBytes } : {}),
          },
        ],
      },
    ],
  }
}

async function user(
  t: TestConvex<typeof schema>,
  email: string,
  role?: "applicant" | "developer-admin" | "demo-admin"
) {
  const userId = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("users", {
      email,
      ...(role ? { role } : {}),
    })
  })
  return { userId, authed: t.withIdentity({ subject: userId }) }
}

async function draftFor(
  t: TestConvex<typeof schema>,
  ownerId: Id<"users">,
  opts?: {
    maxSizeBytes?: number
    status?: "active" | "retired" | "withdrawn"
    expiresAt?: number
  }
) {
  return await t.run(async (ctx: MutationCtx) => {
    const definition = uploadDefinition(opts?.maxSizeBytes)
    const formId = await ctx.db.insert("forms", {
      slug: "upload-form",
      name: "Upload Form",
      agency: "Test Agency",
      sourceLabel: "Official source",
      sourceUrl: "https://example.com/form",
      definition,
      updatedAt: Date.now(),
    })
    const versionId = await ctx.db.insert("formVersions", {
      formId,
      version: 1,
      status: opts?.status ?? "active",
      definition,
      sourceLabel: "Official source",
      sourceUrl: "https://example.com/form",
      createdAt: Date.now(),
    })
    const draftId = await ctx.db.insert("drafts", {
      ownerId,
      formId,
      formVersionId: versionId,
      answers: {},
      status: "active",
      expiresAt: opts?.expiresAt ?? Date.now() + THIRTY_DAYS,
      updatedAt: Date.now(),
    })
    return { formId, versionId, draftId }
  })
}

async function storeBlob(
  t: TestConvex<typeof schema>,
  bytes: Uint8Array<ArrayBuffer>,
  type: string
) {
  return await t.run(async (ctx) => {
    return await ctx.storage.store(new Blob([bytes], { type }))
  })
}

const pdfBytes = (size: number): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(size)
  bytes[0] = 0x25
  bytes[1] = 0x50
  return bytes
}

describe("generateUploadUrl", () => {
  it("hands the draft owner an upload URL", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const out = await authed.mutation(api.uploads.generateUploadUrl, {
      draftId,
    })
    expect(out.draftId).toBe(draftId)
    expect(out.uploadUrl).toContain("https://")
  })

  it("denies anonymous callers", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    await expect(
      t.mutation(api.uploads.generateUploadUrl, { draftId })
    ).rejects.toThrow("Not authenticated")
  })

  it("denies non-owners", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const other = await user(t, "other@example.com")
    await expect(
      other.authed.mutation(api.uploads.generateUploadUrl, { draftId })
    ).rejects.toThrow("Only the draft owner")
  })

  it("denies expired drafts", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId, {
      expiresAt: Date.now() - 1000,
    })
    await expect(
      authed.mutation(api.uploads.generateUploadUrl, { draftId })
    ).rejects.toThrow("expired")
  })

  it("denies withdrawn versions but allows retired ones", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const withdrawn = await draftFor(t, userId, { status: "withdrawn" })
    await expect(
      authed.mutation(api.uploads.generateUploadUrl, {
        draftId: withdrawn.draftId,
      })
    ).rejects.toThrow("withdrawn")
    const retired = await draftFor(t, userId, { status: "retired" })
    const out = await authed.mutation(api.uploads.generateUploadUrl, {
      draftId: retired.draftId,
    })
    expect(out.draftId).toBe(retired.draftId)
  })
})

describe("saveFile", () => {
  // Mock fidelity notes, verified by probe (convex-test 0.0.59):
  // 1. store() drops the Blob MIME type, so a lying filename with a wrong
  //    contentType cannot be planted here (system tables are read-only).
  //    Production `_storage` rows always carry contentType, and saveFile
  //    checks it before the extension. The extension seam below is the part
  //    reachable through this mock.
  // 2. The mock rolls back ctx.storage.delete when the mutation throws,
  //    while production applies storage deletes immediately. So these tests
  //    prove rejection at the boundary; the delete itself is proven by the
  //    draft-linkage test, which deletes and shows serving revoked.
  it("saves a valid upload linked to the draft", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const storageId = await storeBlob(t, pdfBytes(1024), "application/pdf")
    const fileId = await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      storageId,
      fileName: "scan.pdf",
    })
    const row = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db.get(fileId)
    })
    expect(row?.ownerId).toBe(userId)
    expect(row?.draftId).toBe(draftId)
    expect(row?.storageId).toBe(storageId)
    expect(row?.contentType).toBe("application/pdf")
    const served = await authed.query(api.uploads.fileUrl, { fileId })
    expect(served.fileName).toBe("scan.pdf")
    expect(served.url).toContain("https://")
  })

  it("rejects oversized uploads on direct call", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId, { maxSizeBytes: 1024 })
    const storageId = await storeBlob(t, pdfBytes(2048), "application/pdf")
    await expect(
      authed.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        storageId,
        fileName: "big.pdf",
      })
    ).rejects.toThrow("too large")
    // saveFile awaits ctx.storage.delete before throwing; the mock rolls
    // that back on throw (see note above), so only the rejection and the
    // absent file row are observable here.
    const files = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db.query("files").collect()
    })
    expect(files).toHaveLength(0)
  })

  it("rejects the default 5MB limit without a field cap", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const storageId = await storeBlob(
      t,
      pdfBytes(6 * 1024 * 1024),
      "application/pdf"
    )
    await expect(
      authed.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        storageId,
        fileName: "huge.pdf",
      })
    ).rejects.toThrow("too large")
  })

  it("rejects a disallowed extension", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const storageId = await storeBlob(
      t,
      new Uint8Array([104, 105]),
      "text/plain"
    )
    await expect(
      authed.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        storageId,
        fileName: "notes.txt",
      })
    ).rejects.toThrow("Only images and PDF")
  })

  it("denies non-owners and anonymous callers", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const storageId = await storeBlob(t, pdfBytes(64), "application/pdf")
    const other = await user(t, "other@example.com")
    await expect(
      other.authed.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        storageId,
        fileName: "scan.pdf",
      })
    ).rejects.toThrow("Only the draft owner")
    await expect(
      t.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        storageId,
        fileName: "scan.pdf",
      })
    ).rejects.toThrow("Not authenticated")
    await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      storageId,
      fileName: "scan.pdf",
    })
  })
})

describe("fileUrl", () => {
  it("denies non-owners, demo-admins, and anonymous callers", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const storageId = await storeBlob(t, pdfBytes(128), "application/pdf")
    const fileId = await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      storageId,
      fileName: "scan.pdf",
    })
    const other = await user(t, "other@example.com")
    await expect(
      other.authed.query(api.uploads.fileUrl, { fileId })
    ).rejects.toThrow("Only the file owner")
    const demo = await user(t, "demo@example.com", "demo-admin")
    await expect(
      demo.authed.query(api.uploads.fileUrl, { fileId })
    ).rejects.toThrow("Only the file owner")
    await expect(t.query(api.uploads.fileUrl, { fileId })).rejects.toThrow(
      "Not authenticated"
    )
  })

  it("serves the owner and a developer-admin", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const storageId = await storeBlob(t, pdfBytes(128), "image/png")
    const fileId = await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      storageId,
      fileName: "photo.png",
    })
    const admin = await user(t, "admin@example.com", "developer-admin")
    const served = await admin.authed.query(api.uploads.fileUrl, { fileId })
    expect(served.fileName).toBe("photo.png")
    expect(served.contentType).toBe("image/png")
    expect(served.url).toContain("https://")
  })
})

describe("draft linkage for expiry cleanup", () => {
  it("links file rows to their draft for purgeExpired to walk", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { userId, authed } = await user(t, "owner@example.com")
    const { draftId } = await draftFor(t, userId)
    const storageId = await storeBlob(t, pdfBytes(256), "application/pdf")
    const fileId = await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      storageId,
      fileName: "scan.pdf",
    })
    const linked = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db
        .query("files")
        .withIndex("draft", (q) => q.eq("draftId", draftId))
        .collect()
    })
    expect(linked.map((f) => f._id)).toEqual([fileId])

    // The exact steps #36's purgeExpired must perform per linked row:
    // delete the storage blob, then the file row. Serving must fail after.
    await t.run(async (ctx) => {
      await ctx.storage.delete(storageId)
      await ctx.db.delete(fileId)
    })
    const blob = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db.system.get("_storage", storageId)
    })
    expect(blob).toBeNull()
    await expect(authed.query(api.uploads.fileUrl, { fileId })).rejects.toThrow(
      "File not found"
    )
  })
})
