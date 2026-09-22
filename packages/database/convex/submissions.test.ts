import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import type { FormDefinition } from "./formModel"
import schema from "./schema"

// Function-boundary tests for #37: server-confirmed submit with validation,
// hidden-answer exclusion, retire versus withdraw, double-submit rejection,
// post-submit fresh drafts, ownership isolation, and read-only submissions.

const modules = import.meta.glob("./**/*.ts")

function definition(): FormDefinition {
  return {
    sections: [
      {
        id: "s1",
        title: "First",
        fields: [
          { id: "name", kind: "short_text", label: "Name", required: true },
          {
            id: "contact",
            kind: "single_choice",
            label: "Contact",
            options: ["Email", "Phone"],
          },
          {
            id: "phone",
            kind: "phone",
            label: "Phone",
            condition: {
              mode: "any",
              rules: [{ fieldId: "contact", values: ["Phone"] }],
            },
          },
        ],
      },
      {
        id: "refs",
        title: "Refs",
        repeat: { min: 1, max: 2 },
        repeatFields: ["who"],
        fields: [
          { id: "who", kind: "short_text", label: "Ref name", required: true },
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

async function devAdmin(t: TestConvex<typeof schema>) {
  return await user(t, "dev@example.com", "developer-admin")
}

async function publishedForm(
  t: TestConvex<typeof schema>,
  slug: string,
  name: string
) {
  const dev = await devAdmin(t)
  await dev.authed.mutation(api.forms.saveWorkingCopy, {
    slug,
    name,
    agency: "Test Agency",
    sourceLabel: "Official source",
    sourceUrl: "https://example.com/form",
    definition: definition(),
  })
  const versionId = await dev.authed.mutation(api.forms.publish, { slug })
  const form = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .first()
  })
  return { dev, versionId, formId: form!._id }
}

const goodAnswers = {
  name: "Anya",
  contact: "Email",
  refs: [{ who: "Ravi" }],
}

describe("submitDraft validation", () => {
  it("rejects invalid answers listing errors, then succeeds when fixed", async () => {
    const t = convexTest(schema, modules)
    const { formId } = await publishedForm(t, "test-form", "Test Form")
    const a = await user(t, "a@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { contact: "Email", refs: [{ who: "Ravi" }] },
    })
    await expect(
      a.authed.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow(/name.*required/i)
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: goodAnswers,
    })
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    )
    expect(submissionId).toBeDefined()
    const detail = await a.authed.query(api.submissions.getSubmission, {
      submissionId,
    })
    expect(detail.answers).toEqual(goodAnswers)
    expect(detail.labels).toMatchObject({
      name: "Name",
      contact: "Contact",
      who: "Ref name",
    })
    expect(detail.definition.sections).toHaveLength(2)
  })

  it("excludes hidden answers from the snapshot but keeps them in the draft", async () => {
    const t = convexTest(schema, modules)
    const { formId } = await publishedForm(t, "test-form", "Test Form")
    const a = await user(t, "a@example.com")
    // "not-a-phone" would fail validation while visible; hidden it is skipped.
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { ...goodAnswers, phone: "not-a-phone" },
    })
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    )
    const detail = await a.authed.query(api.submissions.getSubmission, {
      submissionId,
    })
    expect(detail.answers).not.toHaveProperty("phone")
    expect(detail.labels).not.toHaveProperty("phone")
    const draft = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db
        .query("drafts")
        .withIndex("owner_form", (q) =>
          q.eq("ownerId", a.userId).eq("formId", formId)
        )
        .first()
    })
    expect(draft?.answers).toHaveProperty("phone", "not-a-phone")
  })
})

describe("retire versus withdraw", () => {
  it("blocks withdrawn versions with the reason", async () => {
    const t = convexTest(schema, modules)
    const { dev, formId, versionId } = await publishedForm(
      t,
      "test-form",
      "Test Form"
    )
    const a = await user(t, "a@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: goodAnswers,
    })
    await dev.authed.mutation(api.forms.withdraw, {
      versionId,
      reason: "Urgent takedown for review.",
    })
    await expect(
      a.authed.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow(/withdrawn.*Urgent takedown for review/s)
    // Answers stay readable to the owner.
    const draft = await a.authed.query(api.drafts.getDraft, { formId })
    expect(draft?.answers).toEqual(goodAnswers)
  })

  it("lets retired versions submit", async () => {
    const t = convexTest(schema, modules)
    const { dev, formId, versionId } = await publishedForm(
      t,
      "test-form",
      "Test Form"
    )
    const a = await user(t, "a@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: goodAnswers,
    })
    await dev.authed.mutation(api.forms.retire, { versionId })
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    )
    expect(submissionId).toBeDefined()
  })
})

describe("submit lifecycle", () => {
  it("rejects double-submit but allows a fresh post-submit draft", async () => {
    const t = convexTest(schema, modules)
    const { formId } = await publishedForm(t, "test-form", "Test Form")
    const a = await user(t, "a@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: goodAnswers,
    })
    await a.authed.mutation(api.submissions.submitDraft, { formId })
    await expect(
      a.authed.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow("already submitted")
    const fresh = await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: { ...goodAnswers, name: "Anya Two" },
    })
    expect(fresh).toBeDefined()
    const draft = await a.authed.query(api.drafts.getDraft, { formId })
    expect(draft?.answers).toMatchObject({ name: "Anya Two" })
  })

  it("lists the owner's submissions newest-first", async () => {
    const t = convexTest(schema, modules)
    const first = await publishedForm(t, "form-one", "Form One")
    const second = await publishedForm(t, "form-two", "Form Two")
    const a = await user(t, "a@example.com")
    const ids: Id<"submissions">[] = []
    for (const { formId } of [first, second]) {
      await a.authed.mutation(api.drafts.saveDraft, {
        formId,
        answers: goodAnswers,
      })
      const { submissionId } = await a.authed.mutation(
        api.submissions.submitDraft,
        { formId }
      )
      ids.push(submissionId)
    }
    // Same-millisecond submits share a timestamp, so pin an older time on
    // the first submission to prove the list sorts newest-first.
    await t.run(async (ctx: MutationCtx) => {
      await ctx.db.patch(ids[0]!, { submittedAt: Date.now() - 1000 })
    })
    const list = await a.authed.query(api.submissions.mySubmissions, {})
    expect(list).toHaveLength(2)
    expect(list[0]!.formName).toBe("Form Two")
    expect(list[1]!.formName).toBe("Form One")
    expect(list[0]).toMatchObject({ version: 1, versionStatus: "active" })
  })
})

describe("ownership and read-only", () => {
  it("denies anonymous callers on every path", async () => {
    const t = convexTest(schema, modules)
    const { formId } = await publishedForm(t, "test-form", "Test Form")
    const a = await user(t, "a@example.com")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: goodAnswers,
    })
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    )
    await expect(
      t.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow("Not authenticated")
    await expect(t.query(api.submissions.mySubmissions, {})).rejects.toThrow(
      "Not authenticated"
    )
    await expect(
      t.query(api.submissions.getSubmission, { submissionId })
    ).rejects.toThrow("Not authenticated")
  })

  it("isolates submissions per owner but lets developer-admin read", async () => {
    const t = convexTest(schema, modules)
    const { dev, formId } = await publishedForm(t, "test-form", "Test Form")
    const a = await user(t, "a@example.com")
    const b = await user(t, "b@example.com")
    const demo = await user(t, "demo@example.com", "demo-admin")
    await a.authed.mutation(api.drafts.saveDraft, {
      formId,
      answers: goodAnswers,
    })
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    )
    expect(await b.authed.query(api.submissions.mySubmissions, {})).toEqual([])
    await expect(
      b.authed.query(api.submissions.getSubmission, { submissionId })
    ).rejects.toThrow()
    await expect(
      demo.authed.query(api.submissions.getSubmission, { submissionId })
    ).rejects.toThrow()
    const detail = await dev.authed.query(api.submissions.getSubmission, {
      submissionId,
    })
    expect(detail.answers).toEqual(goodAnswers)
  })

  it("exposes no update or delete path", async () => {
    const exported = await import("./submissions")
    expect(Object.keys(exported).sort()).toEqual([
      "getSubmission",
      "mySubmissions",
      "submitDraft",
    ])
  })
})
