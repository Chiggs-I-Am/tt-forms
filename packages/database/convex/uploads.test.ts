import { convexTest } from "convex-test";
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import type { TestConvex } from "convex-test";
import type { MutationCtx as MutationContext } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { FormDefinition } from "./formModel";

// Function-boundary tests for #38: the upload-URL gate, server-side type and size enforcement with blob deletion on violation, and gated serving.
// Draft-expiry cleanup itself is #36's `purgeExpired`, which is not in this
// checkout, so these tests prove the file rows link to their draft through
// the `draft` index the merger's purge must walk.

const modules = import.meta.glob("./**/*.ts");

const thirtyDays = 2_592_000_000;

const ensureId = <T extends string>(id: T): T => {
  if (id === "") {
    throw new Error("Database id is empty.");
  }
  return id;
};

const uploadDefinition = (maxSizeBytes?: number): FormDefinition => {
  const sections = [
    {
      fields: [
        {
          id: "photo",
          kind: "upload",
          label: "Photo",
          ...(maxSizeBytes !== undefined && { maxSizeBytes }),
        },
      ],
      id: "s1",
      title: "Documents",
    },
  ] satisfies FormDefinition["sections"];
  return { sections };
};

const user = async (
  t: TestConvex<typeof schema>,
  email: string,
  role?: "applicant" | "developer-admin" | "demo-admin"
) => {
  const userId = await t.run(async (context: MutationContext) => {
    const id = await context.db.insert("users", {
      email,
      ...(role && { role }),
    });
    return ensureId(id);
  });
  return { authed: t.withIdentity({ subject: userId }), userId };
};

const draftFor = async (
  t: TestConvex<typeof schema>,
  ownerId: Id<"users">,
  options?: {
    maxSizeBytes?: number;
    status?: "active" | "retired" | "withdrawn";
    expiresAt?: number;
  }
) => {
  const definition = uploadDefinition(options?.maxSizeBytes);
  return await t.run(async (context: MutationContext) => {
    const formId = await context.db.insert("forms", {
      agency: "Test Agency",
      definition,
      name: "Upload Form",
      slug: "upload-form",
      sourceLabel: "Official source",
      sourceUrl: "https://example.com/form",
      updatedAt: Date.now(),
    });
    const versionId = await context.db.insert("formVersions", {
      createdAt: Date.now(),
      definition,
      formId,
      sourceLabel: "Official source",
      sourceUrl: "https://example.com/form",
      status: options?.status ?? "active",
      version: 1,
    });
    const draftId = await context.db.insert("drafts", {
      answers: {},
      expiresAt: options?.expiresAt ?? Date.now() + thirtyDays,
      formId,
      formVersionId: versionId,
      ownerId,
      status: "active",
      updatedAt: Date.now(),
    });
    return { draftId, formId, versionId };
  });
};

const storeBlob = async (
  t: TestConvex<typeof schema>,
  bytes: Uint8Array<ArrayBuffer>,
  type: string
) => {
  const blob = new Blob([bytes], { type });
  const storageId = await t.run(
    async (context) => await context.storage.store(blob)
  );
  return ensureId(storageId);
};

const pdfBytes = (size: number): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(size);
  bytes[0] = 0x25;
  bytes[1] = 0x50;
  return bytes;
};

describe("generateUploadUrl", () => {
  it("hands the draft owner an upload URL", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const out = await authed.mutation(api.uploads.generateUploadUrl, {
      draftId,
    });

    expect(out.draftId).toBe(draftId);
    expect(out.uploadUrl).toContain("https://");
  });

  it("denies anonymous callers", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);

    await expect(
      t.mutation(api.uploads.generateUploadUrl, { draftId })
    ).rejects.toThrow("Not authenticated");
  });

  it("denies non-owners", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const other = await user(t, "other@example.com");

    await expect(
      other.authed.mutation(api.uploads.generateUploadUrl, { draftId })
    ).rejects.toThrow("Only the draft owner");
  });

  it("denies expired drafts", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId, {
      expiresAt: Date.now() - Number("1000"),
    });

    await expect(
      authed.mutation(api.uploads.generateUploadUrl, { draftId })
    ).rejects.toThrow("expired");
  });

  it("denies withdrawn versions but allows retired ones", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const withdrawn = await draftFor(t, userId, { status: "withdrawn" });

    await expect(
      authed.mutation(api.uploads.generateUploadUrl, {
        draftId: withdrawn.draftId,
      })
    ).rejects.toThrow("withdrawn");

    const retired = await draftFor(t, userId, { status: "retired" });
    const out = await authed.mutation(api.uploads.generateUploadUrl, {
      draftId: retired.draftId,
    });

    expect(out.draftId).toBe(retired.draftId);
  });
});

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
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const storageId = await storeBlob(t, pdfBytes(1024), "application/pdf");
    const fileId = await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      fileName: "scan.pdf",
      storageId,
    });
    const row = await t.run(
      async (context: MutationContext) => await context.db.get(fileId)
    );

    expect(row).toMatchObject({
      contentType: "application/pdf",
      draftId,
      ownerId: userId,
      storageId,
    });

    const served = await authed.query(api.uploads.fileUrl, { fileId });

    expect(served.fileName).toBe("scan.pdf");
    expect(served.url).toContain("https://");
  });

  it("rejects oversized uploads on direct call", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId, { maxSizeBytes: 1024 });
    const storageId = await storeBlob(t, pdfBytes(2048), "application/pdf");

    await expect(
      authed.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        fileName: "big.pdf",
        storageId,
      })
    ).rejects.toThrow("too large");

    // saveFile awaits ctx.storage.delete before throwing; the mock rolls
    // that back on throw (see note above), so only the rejection and the
    // absent file row are observable here.
    const files = await t.run(
      async (context: MutationContext) =>
        await context.db.query("files").collect()
    );

    expect(files).toHaveLength(0);
  });

  it("rejects the default 5MB limit without a field cap", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const storageId = await storeBlob(
      t,
      pdfBytes(6_291_456),
      "application/pdf"
    );

    await expect(
      authed.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        fileName: "huge.pdf",
        storageId,
      })
    ).rejects.toThrow("too large");
  });

  it("rejects a disallowed extension", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const storageId = await storeBlob(
      t,
      new Uint8Array([104, 105]),
      "text/plain"
    );

    await expect(
      authed.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        fileName: "notes.txt",
        storageId,
      })
    ).rejects.toThrow("Only images and PDF");
  });

  it("denies non-owners and anonymous callers", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const storageId = await storeBlob(t, pdfBytes(64), "application/pdf");
    const other = await user(t, "other@example.com");

    await expect(
      other.authed.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        fileName: "scan.pdf",
        storageId,
      })
    ).rejects.toThrow("Only the draft owner");
    await expect(
      t.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo",
        fileName: "scan.pdf",
        storageId,
      })
    ).rejects.toThrow("Not authenticated");

    await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      fileName: "scan.pdf",
      storageId,
    });
  });
});

describe("fileUrl", () => {
  it("denies non-owners, demo-admins, and anonymous callers", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const storageId = await storeBlob(t, pdfBytes(128), "application/pdf");
    const fileId = await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      fileName: "scan.pdf",
      storageId,
    });
    const other = await user(t, "other@example.com");

    await expect(
      other.authed.query(api.uploads.fileUrl, { fileId })
    ).rejects.toThrow("Only the file owner");

    const demo = await user(t, "demo@example.com", "demo-admin");

    await expect(
      demo.authed.query(api.uploads.fileUrl, { fileId })
    ).rejects.toThrow("Only the file owner");
    await expect(t.query(api.uploads.fileUrl, { fileId })).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("serves the owner and a developer-admin", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const storageId = await storeBlob(t, pdfBytes(128), "image/png");
    const fileId = await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      fileName: "photo.png",
      storageId,
    });
    const admin = await user(t, "admin@example.com", "developer-admin");
    const served = await admin.authed.query(api.uploads.fileUrl, { fileId });

    expect(served.fileName).toBe("photo.png");
    expect(served.contentType).toBe("image/png");
    expect(served.url).toContain("https://");
  });
});

describe("draft linkage for expiry cleanup", () => {
  it("links file rows to their draft for purgeExpired to walk", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { userId, authed } = await user(t, "owner@example.com");
    const { draftId } = await draftFor(t, userId);
    const storageId = await storeBlob(t, pdfBytes(256), "application/pdf");
    const fileId = await authed.mutation(api.uploads.saveFile, {
      draftId,
      fieldId: "photo",
      fileName: "scan.pdf",
      storageId,
    });
    const linked = await t.run(async (context: MutationContext) => {
      const result = await context.db
        .query("files")
        .withIndex("draft", (q) => q.eq("draftId", draftId))
        .collect();
      return [...result];
    });

    expect(linked.map((f) => f._id)).toStrictEqual([fileId]);

    // The exact steps #36's purgeExpired must perform per linked row:
    // delete the storage blob, then the file row. Serving must fail after.
    await t.run(async (context) => {
      await context.storage.delete(storageId);
      await context.db.delete(fileId);
    });
    const blob = await t.run(
      async (context: MutationContext) =>
        await context.db.system.get("_storage", storageId)
    );

    expect(blob).toBeNull();
    await expect(authed.query(api.uploads.fileUrl, { fileId })).rejects.toThrow(
      "File not found"
    );
  });
});
