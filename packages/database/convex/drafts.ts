import { ConvexError, v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import type { DatabaseReader } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireUserId } from "./authz"
import { answersValidator } from "./formModel"
import { rateLimiter } from "./rateLimits"

// Applicant draft lifecycle for #36. One active draft per owner and form,
// autosaved from the browser after sign-in, expiring 30 days after the last
// edit. The server pins each draft to its starting version.
// Cross-version moves never migrate silently: replaceDraft retires the old
// draft only on explicit confirm, and only after checking the latest version
// accepts new drafts.
//
// Convex has no true unique constraint, so the composite owner_form index
// plus check-and-reuse inside every write-path mutation is the enforcement.
// Correct under normal use, soft under concurrent duplicate inserts;
// accepted for a demo.

export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000

// One active draft per owner and form, addressed by this key.
export interface DraftKey {
  ownerId: Id<"users">
  formId: Id<"forms">
}

async function latestVersion(ctx: { db: DatabaseReader }, formId: Id<"forms">) {
  return await ctx.db
    .query("formVersions")
    .withIndex("form", (q) => q.eq("formId", formId))
    .order("desc")
    .first()
}

async function activeDraftsFor(
  ctx: { db: DatabaseReader },
  key: DraftKey
) {
  const rows = await ctx.db
    .query("drafts")
    .withIndex("owner_form", (q) =>
      q.eq("ownerId", key.ownerId).eq("formId", key.formId)
    )
    .collect()
  const now = Date.now()
  return rows
    .filter((d) => d.status === "active" && d.expiresAt >= now)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

// Authenticated owner's draft for one form. Returns null when there is no
// active draft, when it expired, or when it left active status (submitted by
// #37, retired by replaceDraft). The query denies anonymous callers and never
// gives them a row. The pinned version detail rides along so the UI can tell
// same-version conflicts from cross-version picks.
export const getDraft = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx)
    const [draft] = await activeDraftsFor(ctx, { ownerId, formId: args.formId })
    if (!draft) {
      return null
    }
    const version = await ctx.db.get(draft.formVersionId)
    return {
      _id: draft._id,
      formId: draft.formId,
      formVersionId: draft.formVersionId,
      answers: draft.answers,
      status: draft.status,
      expiresAt: draft.expiresAt,
      updatedAt: draft.updatedAt,
      version: version
        ? {
            versionId: version._id,
            version: version.version,
            status: version.status,
            withdrawReason: version.withdrawReason,
          }
        : null,
    }
  },
})

// Autosave entry point. Reuses the owner's active draft and keeps its pinned
// version; creates on the latest ACTIVE version when none exists. When
// baseUpdatedAt is given and differs from the stored updatedAt, the save is
// rejected so the client re-merges instead of silently overwriting.
export const saveDraft = mutation({
  args: {
    formId: v.id("forms"),
    answers: answersValidator,
    baseUpdatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx)
    await rateLimiter.limit(ctx, "draftSave", { key: ownerId, throws: true })
    const now = Date.now()
    const [existing] = await activeDraftsFor(ctx, {
      ownerId,
      formId: args.formId,
    })
    if (existing) {
      if (
        args.baseUpdatedAt !== undefined &&
        args.baseUpdatedAt !== existing.updatedAt
      ) {
        throw new ConvexError(
          "Draft changed elsewhere. Reload the latest draft and merge before saving."
        )
      }
      await ctx.db.patch(existing._id, {
        answers: args.answers,
        updatedAt: now,
        expiresAt: now + DRAFT_TTL_MS,
      })
      return existing._id
    }
    const latest = await latestVersion(ctx, args.formId)
    if (!latest) {
      throw new ConvexError(
        "No published version for this form. New drafts are blocked."
      )
    }
    if (latest.status !== "active") {
      throw new ConvexError(
        `New drafts are blocked: version ${latest.version} is ${latest.status}.`
      )
    }
    return await ctx.db.insert("drafts", {
      ownerId,
      formId: args.formId,
      formVersionId: latest._id,
      answers: args.answers,
      status: "active",
      expiresAt: now + DRAFT_TTL_MS,
      updatedAt: now,
    })
  },
})

// Version-pick path for the applicant UI: retire the caller's active draft
// pinned to retireVersionId and start a fresh draft on the latest active
// version with the given answers. Requires explicit confirm; nothing is
// discarded silently. Ownership is checked: another owner's draft id or
// version never retires here.
export const replaceDraft = mutation({
  args: {
    formId: v.id("forms"),
    answers: answersValidator,
    retireVersionId: v.id("formVersions"),
    confirm: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx)
    await rateLimiter.limit(ctx, "draftReplace", { key: ownerId, throws: true })
    if (args.confirm !== true) {
      throw new ConvexError("Replacing a draft needs explicit confirmation.")
    }
    const rows = await ctx.db
      .query("drafts")
      .withIndex("owner_form", (q) =>
        q.eq("ownerId", ownerId).eq("formId", args.formId)
      )
      .collect()
    const old = rows.find(
      (d) => d.formVersionId === args.retireVersionId && d.status === "active"
    )
    if (!old) {
      throw new ConvexError("Draft to retire was not found for this account.")
    }
    // Check the target first: when the latest version no longer accepts new
    // drafts, the call fails here and the caller's active draft is untouched.
    const latest = await latestVersion(ctx, args.formId)
    if (!latest) {
      throw new ConvexError(
        "No published version for this form. New drafts are blocked."
      )
    }
    if (latest.status !== "active") {
      throw new ConvexError(
        `New drafts are blocked: version ${latest.version} is ${latest.status}.`
      )
    }
    const now = Date.now()
    await ctx.db.patch(old._id, { status: "retired" })
    return await ctx.db.insert("drafts", {
      ownerId,
      formId: args.formId,
      formVersionId: latest._id,
      answers: args.answers,
      status: "active",
      expiresAt: now + DRAFT_TTL_MS,
      updatedAt: now,
    })
  },
})

// Daily expiry sweep. Deletes each expired ACTIVE draft plus its file rows
// and storage blobs explicitly, since Convex has no cascade delete or
// built-in expiry. Submitted drafts are untouched, so submission file refs
// (#37) never dangle: their files survive with the submitted draft. This is
// the contract the #38 uploads track relies on: every files row under an
// expired active draft goes away and each storageId blob is deleted. Returns
// the number of drafts removed.
export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const rows = await ctx.db.query("drafts").collect()
    const expired = rows
      .filter((d) => d.status === "active" && d.expiresAt < now)
      .slice(0, 100)
    for (const draft of expired) {
      const files = await ctx.db
        .query("files")
        .withIndex("draft", (q) => q.eq("draftId", draft._id))
        .collect()
      for (const file of files) {
        await ctx.storage.delete(file.storageId)
        await ctx.db.delete(file._id)
      }
      await ctx.db.delete(draft._id)
    }
    return expired.length
  },
})
