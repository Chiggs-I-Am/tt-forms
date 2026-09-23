import { convexTest, type TestConvex } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api, internal } from "./_generated/api"
import type { MutationCtx } from "./_generated/server"
import type { FormDefinition } from "./formModel"
import schema from "./schema"

// Function-boundary tests for #36: ownership isolation, one-active-draft
// reuse with version pinning, optimistic-concurrency no-silent-overwrite,
// replaceDraft confirm plus retire, expiry filtering plus purge (drafts and
// files), and submitted drafts not blocking new saves.

const modules = import.meta.glob("./**/*.ts")

const workingCopy = {
  slug: "test-form",
  name: "Test Form",
  agency: "Test Agency",
  sourceLabel: "Official source",
  sourceUrl: "https://example.com/form",
  definition: {
    sections: [
      {
        id: "s1",
        title: "First",
        fields: [
          { id: "name", kind: "short_text", label: "Name", required: true },
        ],
      },
    ],
  } satisfies FormDefinition,
}

async function devAdmin(t: TestConvex<typeof schema>) {
  const userId = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("users", {
      email: "dev@example.com",
      role: "developer-admin",
    })
  })
  return t.withIdentity({ subject: userId })
}

async function applicant(t: TestConvex<typeof schema>, email: string) {
  const userId = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("users", { email })
  })
  return { userId, authed: t.withIdentity({ subject: userId }) }
}

async function publishedForm(t: TestConvex<typeof schema>) {
  const dev = await devAdmin(t)
  await dev.mutation(api.forms.saveWorkingCopy, workingCopy)
  const versionId = await dev.mutation(api.forms.publish, {
    slug: "test-form",
  })
  const form = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", "test-form"))
      .first()
  })
  return { dev, versionId, formId: form!._id }
}

describe("draft ownership", () => {
  it("denies anonymous reads and writes", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { formId, versionId } = await publishedForm(t)
    await expect(t.query(api.drafts.getDraft, { formId })).rejects.toThrow(
      "Not authenticated"
    )
    await expect(
      t.mutation(api.drafts.saveDraft, { formId, answers: {} })
    ).rejects.toThrow("Not authenticated")
    await expect(
      t.mutation(api.drafts.replaceDraft, {
        formId,
        answers: {},
        retireVersionId: versionId,
        confirm: true,
      })
    ).rejects.toThrow()
  })

  it("isolates drafts per owner", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { formId } = await publishedForm(t)
    const a = await applicant(t, "a@example.com")
    const b = await applicant(t, "b@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Anya" },
    })
    expect(await b.authed.query(api.drafts.getDraft, { formId })).toBeNull()
    await b.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Brian" },
    })
    const again = await a.authed.query(api.drafts.getDraft, { formId })
    expect(again?.answers).toEqual({ name: "Anya" })
    const other = await b.authed.query(api.drafts.getDraft, { formId })
    expect(other?.answers).toEqual({ name: "Brian" })
  })
})

describe("one active draft", () => {
  it("reuses the draft and keeps the pinned version", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { dev, formId, versionId } = await publishedForm(t)
    const a = await applicant(t, "a@example.com")
    const first = await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "One" },
    })
    const second = await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Two" },
    })
    expect(second).toEqual(first)
    const draft = await a.authed.query(api.drafts.getDraft, { formId })
    expect(draft?.answers).toEqual({ name: "Two" })
    expect(draft?.formVersionId).toEqual(versionId)
    expect(draft?.version?.version).toBe(1)
    expect(draft?.version?.status).toBe("active")

    // Publish v2: the existing draft stays pinned to v1.
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy)
    await dev.mutation(api.forms.publish, { slug: "test-form" })
    const third = await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Three" },
    })
    expect(third).toEqual(first)
    const still = await a.authed.query(api.drafts.getDraft, { formId })
    expect(still?.formVersionId).toEqual(versionId)
    expect(still?.version?.version).toBe(1)
  })

  it("blocks new drafts when the latest version is not active", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { dev, formId, versionId } = await publishedForm(t)
    await dev.mutation(api.forms.retire, { versionId })
    const a = await applicant(t, "a@example.com")
    await expect(
      a.authed.mutation(api.drafts.saveDraft, {
        formId,
        answers: { name: "Late" },
      })
    ).rejects.toThrow(/blocked/)
  })
})

describe("optimistic concurrency", () => {
  it("rejects stale bases instead of silently overwriting", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { formId } = await publishedForm(t)
    const a = await applicant(t, "a@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "One" },
    })
    const loaded = await a.authed.query(api.drafts.getDraft, { formId })
    // Simulate a concurrent edit landing first: bump the stored timestamp
    // directly so the stale base below must be rejected. (Date.now() can
    // repeat within one test tick, so two plain saves may share updatedAt.)
    await t.run(async (ctx) => {
      const rows = await ctx.db
        .query("drafts")
        .withIndex("owner_form", (q) =>
          q.eq("ownerId", a.userId).eq("formId", formId)
        )
        .collect()
      await ctx.db.patch(rows[0]!._id, {
        answers: { name: "Two" },
        updatedAt: loaded!.updatedAt + 1000,
      })
    })
    await expect(
      a.authed.mutation(api.drafts.saveDraft, {
        formId,
        answers: { name: "Stale" },
        baseUpdatedAt: loaded!.updatedAt,
      })
    ).rejects.toThrow("Draft changed elsewhere")
    const kept = await a.authed.query(api.drafts.getDraft, { formId })
    expect(kept?.answers).toEqual({ name: "Two" })
  })
})

describe("replaceDraft", () => {
  it("requires confirm and retires the old pinned draft", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { dev, formId, versionId } = await publishedForm(t)
    const a = await applicant(t, "a@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Old" },
    })
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy)
    const v2 = await dev.mutation(api.forms.publish, { slug: "test-form" })
    await expect(
      a.authed.mutation(api.drafts.replaceDraft, {
        formId,
        answers: { name: "Mine" },
        retireVersionId: versionId,
        confirm: false,
      })
    ).rejects.toThrow("explicit confirmation")
    const fresh = await a.authed.mutation(api.drafts.replaceDraft, {
      formId,
      answers: { name: "Mine" },
      retireVersionId: versionId,
      confirm: true,
    })
    expect(fresh).toBeDefined()
    const current = await a.authed.query(api.drafts.getDraft, { formId })
    expect(current?.formVersionId).toEqual(v2)
    expect(current?.answers).toEqual({ name: "Mine" })
    const oldRow = await t.run(async (ctx: MutationCtx) => {
      const rows = await ctx.db
        .query("drafts")
        .withIndex("owner_form", (q) =>
          q.eq("ownerId", a.userId).eq("formId", formId)
        )
        .collect()
      return rows.find((d) => d.formVersionId === versionId)
    })
    expect(oldRow?.status).toBe("retired")
  })

  it("keeps the old draft when the latest version no longer accepts drafts", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { dev, formId, versionId } = await publishedForm(t)
    const a = await applicant(t, "a@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Old" },
    })
    const latest = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db
        .query("formVersions")
        .withIndex("form", (q) => q.eq("formId", formId))
        .order("desc")
        .first()
    })
    await dev.mutation(api.forms.retire, { versionId: latest!._id })
    await expect(
      a.authed.mutation(api.drafts.replaceDraft, {
        formId,
        answers: { name: "Mine" },
        retireVersionId: versionId,
        confirm: true,
      })
    ).rejects.toThrow("New drafts are blocked")
    const kept = await a.authed.query(api.drafts.getDraft, { formId })
    expect(kept?.formVersionId).toEqual(versionId)
    expect(kept?.answers).toEqual({ name: "Old" })
  })

  it("refuses to retire another owner's draft", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { formId, versionId } = await publishedForm(t)
    const a = await applicant(t, "a@example.com")
    const b = await applicant(t, "b@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Anya" },
    })
    await expect(
      b.authed.mutation(api.drafts.replaceDraft, {
        formId,
        answers: { name: "Brian" },
        retireVersionId: versionId,
        confirm: true,
      })
    ).rejects.toThrow("not found")
  })
})

describe("expiry", () => {
  it("filters expired drafts and purges them with their files", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { formId } = await publishedForm(t)
    const a = await applicant(t, "a@example.com")
    const draftId = await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Old" },
    })
    const blobId = await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["fake"]))
      await ctx.db.insert("files", {
        ownerId: a.userId,
        draftId,
        storageId,
        fileName: "photo.png",
        contentType: "image/png",
        size: 4,
        createdAt: Date.now(),
      })
      return storageId
    })
    await t.run(async (ctx: MutationCtx) => {
      await ctx.db.patch(draftId, { expiresAt: Date.now() - 1000 })
    })
    expect(await a.authed.query(api.drafts.getDraft, { formId })).toBeNull()
    const removed = await t.mutation(internal.drafts.purgeExpired, {})
    expect(removed).toBe(1)
    const leftover = await t.run(async (ctx) => {
      return {
        draft: await ctx.db.get(draftId),
        files: await ctx.db.query("files").collect(),
        blob: await ctx.storage.get(blobId),
      }
    })
    expect(leftover.draft).toBeNull()
    expect(leftover.files).toEqual([])
    expect(leftover.blob).toBeNull()
  })
})

describe("submitted drafts", () => {
  it("lets a new save start after submission", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const { formId } = await publishedForm(t)
    const a = await applicant(t, "a@example.com")
    const draftId = await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Sent" },
    })
    await t.run(async (ctx: MutationCtx) => {
      await ctx.db.patch(draftId, { status: "submitted" })
    })
    expect(await a.authed.query(api.drafts.getDraft, { formId })).toBeNull()
    const next = await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { name: "Again" },
    })
    expect(next).not.toEqual(draftId)
    const current = await a.authed.query(api.drafts.getDraft, { formId })
    expect(current?.answers).toEqual({ name: "Again" })
    expect(current?.status).toBe("active")
  })
})
