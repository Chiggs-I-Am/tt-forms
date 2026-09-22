import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { DatabaseReader } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireDeveloperAdmin, requireUserId } from "./authz"
import { formDefinitionValidator, validateDefinition } from "./formModel"

// Versioned form core for #35. Working copies are editable drafts that never
// touch live forms; publish snapshots an immutable version; retire and
// emergency-withdraw move only the lifecycle status. Drafts and submissions
// (#36/#37) pin formVersionId and stay on their version's rules. The server
// is the authority on applicability, immutability, ownership, and pinning.

async function latestVersion(ctx: { db: DatabaseReader }, formId: Id<"forms">) {
  return await ctx.db
    .query("formVersions")
    .withIndex("form", (q) => q.eq("formId", formId))
    .order("desc")
    .first()
}

async function versionDetail(
  ctx: { db: DatabaseReader },
  versionId: Id<"formVersions"> | undefined
) {
  if (!versionId) {
    return null
  }
  const version = await ctx.db.get(versionId)
  if (!version) {
    return null
  }
  const form = await ctx.db.get(version.formId)
  if (!form) {
    return null
  }
  return {
    versionId: version._id,
    version: version.version,
    status: version.status,
    withdrawReason: version.withdrawReason,
    definition: version.definition,
    sourceLabel: version.sourceLabel,
    sourceUrl: version.sourceUrl,
    form: { slug: form.slug, name: form.name, agency: form.agency },
  }
}

// Public catalog: forms whose latest version is active. Retired forms stop
// new drafts (hidden here); withdrawn forms additionally block submission of
// existing drafts (#37) while staying readable to their owners.
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const forms = await ctx.db.query("forms").collect()
    const out = []
    for (const form of forms) {
      const version = await latestVersion(ctx, form._id)
      if (version?.status === "active") {
        out.push({
          formId: form._id,
          slug: form.slug,
          name: form.name,
          agency: form.agency,
          sourceLabel: form.sourceLabel,
          sourceUrl: form.sourceUrl,
          versionId: version._id,
          version: version.version,
        })
      }
    }
    return out
  },
})

// Public version detail for rendering an applicant-style preview and the
// pinned definition behind drafts and submissions. Anonymous browsing is
// allowed; saving is not (no mutation here).
export const getVersion = query({
  args: { versionId: v.id("formVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId)
    return await versionDetail(ctx, version?._id)
  },
})

// Public latest-version detail by slug. Powers the applicant fill view: one
// anonymous query returns everything the renderer needs. Returns null when
// the form or version does not exist.
export const getLatestVersion = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const form = await ctx.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first()
    if (!form) {
      return null
    }
    const version = await latestVersion(ctx, form._id)
    return await versionDetail(ctx, version?._id)
  },
})

// Working copy for the builder UI (developer-admin only). The builder itself
// arrives after the data slice; this mutation is its save path.
export const saveWorkingCopy = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    agency: v.string(),
    sourceLabel: v.string(),
    sourceUrl: v.string(),
    definition: formDefinitionValidator,
  },
  handler: async (ctx, args) => {
    await requireDeveloperAdmin(ctx)
    const existing = await ctx.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        agency: args.agency,
        sourceLabel: args.sourceLabel,
        sourceUrl: args.sourceUrl,
        definition: args.definition,
        updatedAt: Date.now(),
      })
      return existing._id
    }
    return await ctx.db.insert("forms", {
      slug: args.slug,
      name: args.name,
      agency: args.agency,
      sourceLabel: args.sourceLabel,
      sourceUrl: args.sourceUrl,
      definition: args.definition,
      updatedAt: Date.now(),
    })
  },
})

// Explicit publish with checks: invalid rules, missing labels or options,
// and incomplete source information all block the snapshot. Publishing never
// mutates the working copy or any prior version; it appends version max+1.
export const publish = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    await requireDeveloperAdmin(ctx)
    const form = await ctx.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first()
    if (!form) {
      throw new ConvexError(`No working copy for "${args.slug}".`)
    }
    if (!form.sourceLabel || !form.sourceUrl) {
      throw new ConvexError(
        "Publish blocked: source information is incomplete."
      )
    }
    const problems = validateDefinition(form.definition)
    if (problems.length > 0) {
      throw new ConvexError(`Publish blocked: ${problems.join(" ")}`)
    }
    const latest = await latestVersion(ctx, form._id)
    return await ctx.db.insert("formVersions", {
      formId: form._id,
      version: (latest?.version ?? 0) + 1,
      status: "active",
      definition: form.definition,
      sourceLabel: form.sourceLabel,
      sourceUrl: form.sourceUrl,
      createdAt: Date.now(),
    })
  },
})

// Retirement stops new drafts; existing drafts stay submittable until expiry
// (#37) and submitted applications are untouched.
export const retire = mutation({
  args: { versionId: v.id("formVersions") },
  handler: async (ctx, args) => {
    await requireDeveloperAdmin(ctx)
    const version = await ctx.db.get(args.versionId)
    if (!version) {
      throw new ConvexError("Version not found.")
    }
    if (version.status !== "active") {
      throw new ConvexError(
        `Only active versions retire (now ${version.status}).`
      )
    }
    await ctx.db.patch(version._id, { status: "retired" })
    return version._id
  },
})

// Emergency withdrawal additionally blocks submission of existing drafts
// (#37), keeps answers readable until expiry, and records the explanation.
// Like retire, it never deletes submitted applications.
export const withdraw = mutation({
  args: { versionId: v.id("formVersions"), reason: v.string() },
  handler: async (ctx, args) => {
    await requireDeveloperAdmin(ctx)
    if (!args.reason.trim()) {
      throw new ConvexError("Withdrawal needs a readable explanation.")
    }
    const version = await ctx.db.get(args.versionId)
    if (!version) {
      throw new ConvexError("Version not found.")
    }
    if (version.status !== "active") {
      throw new ConvexError(
        `Only active versions withdraw (now ${version.status}).`
      )
    }
    await ctx.db.patch(version._id, {
      status: "withdrawn",
      withdrawReason: args.reason.trim(),
    })
    return version._id
  },
})

// Builder index for #35 (developer-admin only). Lists every working copy
// with its slug, name, agency, sources, editable definition, and updatedAt,
// plus the latest version number and status for the per-form state line on
// /admin/forms. The editor loads its copy from this one query. Demo-admin
// gets nothing here; preview-only access lives elsewhere. Denial is
// server-side; UI hiding is cosmetic.
export const listWorkingCopies = query({
  args: {},
  handler: async (ctx) => {
    await requireDeveloperAdmin(ctx)
    const forms = await ctx.db.query("forms").collect()
    const out = []
    for (const form of forms) {
      const version = await latestVersion(ctx, form._id)
      out.push({
        formId: form._id,
        slug: form.slug,
        name: form.name,
        agency: form.agency,
        sourceLabel: form.sourceLabel,
        sourceUrl: form.sourceUrl,
        definition: form.definition,
        updatedAt: form.updatedAt,
        latestVersion: version ? version.version : null,
        latestStatus: version ? version.status : null,
      })
    }
    return out
  },
})

// Authenticated status line for the applicant flow (#36): which lifecycle
// state governs a given version for new drafts and submissions.
export const versionGate = query({
  args: { versionId: v.id("formVersions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const version = await ctx.db.get(args.versionId)
    if (!version) {
      throw new ConvexError("Version not found.")
    }
    return {
      userId,
      status: version.status,
      withdrawReason: version.withdrawReason,
      newDrafts: version.status === "active",
      submissions: version.status === "active" || version.status === "retired",
    }
  },
})
