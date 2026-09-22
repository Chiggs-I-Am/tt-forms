import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import { api, internal } from "./_generated/api"
import type { MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { validateAnswers } from "./formModel"
import { pilotSeeds } from "./pilotDefinitions"
import schema from "./schema"

// Boundary tests for admin views (#39): view-only applicant and submission
// lists denied to demo-admin and anonymous callers, plus seeded examples that
// stay valid against their pinned versions. Detail reuses
// submissions.getSubmission, so demo-admin denial there is asserted once here
// against a real seeded row.
const modules = import.meta.glob("./**/*.ts")

type Role = "applicant" | "developer-admin" | "demo-admin"

async function user(t: TestConvex<typeof schema>, email: string, role?: Role) {
  const userId: Id<"users"> = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("users", {
      email,
      emailVerificationTime: Date.now(),
      ...(role ? { role } : {}),
    })
  })
  return { userId, authed: t.withIdentity({ subject: userId }) }
}

async function publishPilots(t: TestConvex<typeof schema>) {
  const dev = await user(t, "dev@example.com", "developer-admin")
  for (const seed of pilotSeeds) {
    await dev.authed.mutation(api.forms.saveWorkingCopy, {
      slug: seed.slug,
      name: seed.name,
      agency: seed.agency,
      sourceLabel: seed.sourceLabel,
      sourceUrl: seed.sourceUrl,
      definition: seed.definition,
    })
    await dev.authed.mutation(api.forms.publish, { slug: seed.slug })
  }
  return dev
}

describe("listApplicants", () => {
  it("denies anonymous and demo-admin callers", async () => {
    const t = convexTest(schema, modules)
    const demo = await user(t, "demo@example.com", "demo-admin")
    await expect(t.query(api.admin.listApplicants, {})).rejects.toThrow(
      "Not authenticated"
    )
    await expect(
      demo.authed.query(api.admin.listApplicants, {})
    ).rejects.toThrow("Developer-admin only")
  })

  it("returns view-only rows with submission counts", async () => {
    const t = convexTest(schema, modules)
    const dev = await publishPilots(t)
    const a = await user(t, "a@example.com")
    const form = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", "certificate-of-character"))
        .first()
    })
    const version = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db
        .query("formVersions")
        .withIndex("form", (q) => q.eq("formId", form!._id))
        .order("desc")
        .first()
    })
    await t.run(async (ctx: MutationCtx) => {
      await ctx.db.insert("submissions", {
        ownerId: a.userId,
        formId: form!._id,
        formVersionId: version!._id,
        version: 1,
        answers: {},
        labels: {},
        fileIds: [],
        submittedAt: Date.now(),
      })
    })
    const rows = await dev.authed.query(api.admin.listApplicants, {})
    const byEmail = new Map(rows.map((row) => [row.email, row]))
    expect(byEmail.get("a@example.com")).toMatchObject({
      role: "applicant",
      submissionCount: 1,
    })
    expect(byEmail.get("dev@example.com")).toMatchObject({
      role: "developer-admin",
      submissionCount: 0,
    })
    for (const row of rows) {
      expect(typeof row.userId).toBe("string")
    }
  })
})

describe("listSubmissions", () => {
  it("denies anonymous and demo-admin callers", async () => {
    const t = convexTest(schema, modules)
    await publishPilots(t)
    const demo = await user(t, "demo@example.com", "demo-admin")
    await expect(t.query(api.admin.listSubmissions, {})).rejects.toThrow(
      "Not authenticated"
    )
    await expect(
      demo.authed.query(api.admin.listSubmissions, {})
    ).rejects.toThrow("Developer-admin only")
  })

  it("lists newest-first with an optional form filter", async () => {
    const t = convexTest(schema, modules)
    const dev = await publishPilots(t)
    const created = await t.mutation(internal.admin.seedExamples, {})
    expect(created).toHaveLength(8)
    const all = await dev.authed.query(api.admin.listSubmissions, {})
    expect(all).toHaveLength(8)
    for (let i = 1; i < all.length; i += 1) {
      expect(all[i - 1]!.submittedAt).toBeGreaterThanOrEqual(
        all[i]!.submittedAt
      )
    }
    expect(all[0]).toMatchObject({ version: 1 })
    expect(typeof all[0]?.ownerEmail).toBe("string")
    const filtered = await dev.authed.query(api.admin.listSubmissions, {
      formSlug: "nis-ni4",
    })
    expect(filtered).toHaveLength(2)
    expect(filtered.every((row) => row.formSlug === "nis-ni4")).toBe(true)
    expect(filtered[0]?.formName).toContain("NIS")
    await expect(
      dev.authed.query(api.admin.listSubmissions, { formSlug: "nope" })
    ).rejects.toThrow('No form found for "nope"')
  })

  it("denies demo-admin on the reused getSubmission detail", async () => {
    const t = convexTest(schema, modules)
    const dev = await publishPilots(t)
    const demo = await user(t, "demo@example.com", "demo-admin")
    await t.mutation(internal.admin.seedExamples, {})
    const [first] = await dev.authed.query(api.admin.listSubmissions, {})
    await expect(
      demo.authed.query(api.submissions.getSubmission, {
        submissionId: first!.submissionId,
      })
    ).rejects.toThrow()
    const detail = await dev.authed.query(api.submissions.getSubmission, {
      submissionId: first!.submissionId,
    })
    expect(detail.submissionId).toBe(first!.submissionId)
  })
})

describe("seedExamples", () => {
  it("seeds two valid fileless submissions per pilot form and stays idempotent", async () => {
    const t = convexTest(schema, modules)
    await publishPilots(t)
    const first = await t.mutation(internal.admin.seedExamples, {})
    expect(first).toHaveLength(8)
    const slugs = first.map((row) => row.slug).sort()
    for (const seed of pilotSeeds) {
      expect(slugs.filter((slug) => slug === seed.slug)).toHaveLength(2)
    }
    const stored = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db.query("submissions").collect()
    })
    expect(stored).toHaveLength(8)
    for (const row of stored) {
      expect(row.fileIds).toEqual([])
      const version = await t.run(async (ctx: MutationCtx) => {
        return await ctx.db.get(row.formVersionId)
      })
      const { errors } = validateAnswers(version!.definition, row.answers)
      expect(errors).toEqual([])
      expect(Object.keys(row.labels).length).toBeGreaterThan(0)
      const owner = await t.run(async (ctx: MutationCtx) => {
        return await ctx.db.get(row.ownerId)
      })
      expect(owner?.email).toMatch(/^seeded-applicant-[12]@example\.com$/)
    }
    const second = await t.mutation(internal.admin.seedExamples, {})
    expect(second).toEqual([])
    const after = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db.query("submissions").collect()
    })
    expect(after).toHaveLength(8)
  })

  it("skips forms without an active version", async () => {
    const t = convexTest(schema, modules)
    const created = await t.mutation(internal.admin.seedExamples, {})
    expect(created).toEqual([])
  })
})

describe("admin module shape", () => {
  it("exports only view and seed paths; nothing patches applicants or submissions", async () => {
    const exported = await import("./admin")
    expect(Object.keys(exported).sort()).toEqual([
      "listApplicants",
      "listSubmissions",
      "seedExamples",
    ])
  })
})
