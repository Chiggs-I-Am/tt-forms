import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import type { MutationCtx } from "./_generated/server"
import schema from "./schema"
import { pilotSeeds } from "./pilotDefinitions"

// Boundary suite for #40 (safeguards). Two pins in one place:
//
// 1. Sign-in-before-write denial across every rate-limited mutation. The
//    rate limiter itself is a live component (registered per-suite in
//    drafts/submissions/uploads/invites tests via the shipped
//    @convex-dev/rate-limiter/test helper); here the wiring is asserted
//    statically instead: each intended mutation exists, and anonymous
//    callers are denied before any limit or row is touched.
// 2. Guided-fake-input on the pilot seeds: every short_text field whose id
//    or label names an identity document carries an invent-a-number hint
//    (plus a placeholder example). No format validation, masking, or
//    blocking lives anywhere near these fields.
const modules = import.meta.glob("./**/*.ts")

async function publishedFormIds(t: ReturnType<typeof convexTest>) {
  const formId = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("forms", {
      slug: "safeguard-probe",
      name: "Safeguard Probe",
      agency: "Probe Agency",
      sourceLabel: "Probe source",
      sourceUrl: "https://example.com/probe",
      definition: { sections: [] },
      updatedAt: Date.now(),
    })
  })
  const versionId = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("formVersions", {
      formId,
      version: 1,
      status: "active",
      definition: { sections: [] },
      sourceLabel: "Probe source",
      sourceUrl: "https://example.com/probe",
      createdAt: Date.now(),
    })
  })
  const draftId = await t.run(async (ctx: MutationCtx) => {
    const ownerId = await ctx.db.insert("users", {
      email: "probe-owner@example.com",
    })
    return await ctx.db.insert("drafts", {
      ownerId,
      formId,
      formVersionId: versionId,
      answers: {},
      status: "active",
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    })
  })
  return { formId, versionId, draftId }
}

async function storedBlobId(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    return await ctx.storage.store(
      new Blob(["stand-in"], { type: "image/png" })
    )
  })
}

describe("sign-in-before-write denial on guarded mutations", () => {
  it("denies anonymous callers on drafts, submissions, uploads, invites", async () => {
    const t = convexTest(schema, modules)
    const { formId, versionId, draftId } = await publishedFormIds(t)
    const storageId = await storedBlobId(t)

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
    ).rejects.toThrow("Not authenticated")
    await expect(
      t.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow("Not authenticated")
    await expect(
      t.mutation(api.uploads.generateUploadUrl, { draftId })
    ).rejects.toThrow("Not authenticated")
    await expect(
      t.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo_upload",
        storageId,
        fileName: "stand-in.png",
      })
    ).rejects.toThrow("Not authenticated")
    await expect(
      t.mutation(api.invites.createInvite, {
        email: "new-admin@example.com",
        role: "demo-admin",
      })
    ).rejects.toThrow("Not authenticated")
    await expect(t.mutation(api.invites.claimInvite, {})).rejects.toThrow(
      "Not authenticated"
    )
  })
})

describe("guided-fake-input on pilot seed ID fields", () => {
  it("carries an invent-a-number hint and placeholder on every ID-number field", async () => {
    // Pin from #40: id/passport/permit/certificate/NI naming plus a number
    // token (number/no/num). The number token matters: the bare alternation
    // alone also catches "maiden", "middle", and "organization", which are
    // names, not numbers, and must never carry an invent-a-number hint.
    const idLike = /id|passport|permit|certificate|NI/i
    const numberLike = /\b(number|numbers|no|num)\b/i
    const missing: string[] = []
    for (const seed of pilotSeeds) {
      for (const section of seed.definition.sections) {
        for (const field of section.fields) {
          if (field.kind !== "short_text") {
            continue
          }
          const haystack = `${field.id} ${field.label}`
          if (!idLike.test(haystack) || !numberLike.test(haystack)) {
            continue
          }
          const hint = field.hint ?? ""
          if (!/invent/i.test(hint) || !field.placeholder) {
            missing.push(`${seed.slug}/${section.id}/${field.id}`)
          }
        }
      }
    }
    expect(missing).toEqual([])
  })
})
