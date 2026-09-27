import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireUserId } from "./authz";
import { answersValidator } from "./formModel";
import { rateLimiter } from "./rateLimits";
import { mapSequentially } from "./sequential";
import type { Id } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";

// Applicant draft lifecycle for #36. One active draft per owner and form, autosaved from the browser after sign-in, expiring 30 days after the last edit. The server pins each draft to its starting version.
// Cross-version moves never migrate silently: replaceDraft retires the old draft only on explicit confirm, and only after checking the latest version accepts new drafts.
//
// Convex has no true unique constraint, so the composite owner_form index
// plus check-and-reuse inside every write-path mutation is the enforcement.
// Correct under normal use, soft under concurrent duplicate inserts; accepted for a demo.

const draftTtlMs = 2_592_000_000;
export { draftTtlMs as DRAFT_TTL_MS };
const idKey = "_id";

// One active draft per owner and form, addressed by this key.
export interface DraftKey {
  ownerId: Id<"users">;
  formId: Id<"forms">;
}

const latestVersion = async (
  context: { db: DatabaseReader },
  formId: Id<"forms">
) => {
  const version = await context.db
    .query("formVersions")
    .withIndex("form", (q) => q.eq("formId", formId))
    .order("desc")
    .first();
  if (version === null) {
    return null;
  }
  return version;
};

const activeDraftsFor = async (
  context: { db: DatabaseReader },
  key: DraftKey
) => {
  const rows = await context.db
    .query("drafts")
    .withIndex("owner_form", (q) =>
      q.eq("ownerId", key.ownerId).eq("formId", key.formId)
    )
    .collect();
  const now = Date.now();
  return rows
    .filter((d) => d.status === "active" && d.expiresAt >= now)
    .toSorted((a, b) => b.updatedAt - a.updatedAt);
};

// Authenticated owner's draft for one form. Returns null when there is no
// active draft, when it expired, or when it left active status (submitted by
// #37, retired by replaceDraft). The query denies anonymous callers and never
// gives them a row. The pinned version detail rides along so the UI can tell
// same-version conflicts from cross-version picks.
const draftQuery = query({
  args: { formId: v.id("forms") },
  handler: async (context, requestArguments) => {
    const ownerId = await requireUserId(context);
    const [draft] = await activeDraftsFor(context, {
      formId: requestArguments.formId,
      ownerId,
    });
    if (!draft) {
      return null;
    }
    const version = await context.db.get(draft.formVersionId);
    return {
      answers: draft.answers,
      expiresAt: draft.expiresAt,
      formId: draft.formId,
      formVersionId: draft.formVersionId,
      [idKey]: draft._id,
      status: draft.status,
      updatedAt: draft.updatedAt,
      version: version
        ? {
            status: version.status,
            version: version.version,
            versionId: version._id,
            withdrawReason: version.withdrawReason,
          }
        : null,
    };
  },
});

export { draftQuery as getDraft };

// Autosave entry point. Reuses the owner's active draft and keeps its pinned
// version; creates on the latest ACTIVE version when none exists. When
// baseUpdatedAt is given and differs from the stored updatedAt, the save is
// rejected so the client re-merges instead of silently overwriting.
export const saveDraft = mutation({
  args: {
    answers: answersValidator,
    baseUpdatedAt: v.optional(v.number()),
    formId: v.id("forms"),
  },
  handler: async (context, requestArguments) => {
    const ownerId = await requireUserId(context);
    await rateLimiter.limit(context, "draftSave", {
      key: ownerId,
      throws: true,
    });
    const now = Date.now();
    const [existing] = await activeDraftsFor(context, {
      formId: requestArguments.formId,
      ownerId,
    });
    if (existing) {
      if (
        requestArguments.baseUpdatedAt !== undefined &&
        requestArguments.baseUpdatedAt !== existing.updatedAt
      ) {
        throw new ConvexError(
          "Draft changed elsewhere. Reload the latest draft and merge before saving."
        );
      }
      await context.db.patch(existing._id, {
        answers: requestArguments.answers,
        expiresAt: now + draftTtlMs,
        updatedAt: now,
      });
      return existing._id;
    }
    const latest = await latestVersion(context, requestArguments.formId);
    if (!latest) {
      throw new ConvexError(
        "No published version for this form. New drafts are blocked."
      );
    }
    if (latest.status !== "active") {
      throw new ConvexError(
        `New drafts are blocked: version ${latest.version} is ${latest.status}.`
      );
    }
    return await context.db.insert("drafts", {
      answers: requestArguments.answers,
      expiresAt: now + draftTtlMs,
      formId: requestArguments.formId,
      formVersionId: latest._id,
      ownerId,
      status: "active",
      updatedAt: now,
    });
  },
});

// Version-pick path for the applicant UI: retire the caller's active draft
// pinned to retireVersionId and start a fresh draft on the latest active
// version with the given answers. Requires explicit confirm; nothing is
// discarded silently. Ownership is checked: another owner's draft id or
// version never retires here.
export const replaceDraft = mutation({
  args: {
    answers: answersValidator,
    confirm: v.boolean(),
    formId: v.id("forms"),
    retireVersionId: v.id("formVersions"),
  },
  handler: async (context, requestArguments) => {
    const ownerId = await requireUserId(context);
    await rateLimiter.limit(context, "draftReplace", {
      key: ownerId,
      throws: true,
    });
    if (!requestArguments.confirm) {
      throw new ConvexError("Replacing a draft needs explicit confirmation.");
    }
    const rows = await context.db
      .query("drafts")
      .withIndex("owner_form", (q) =>
        q.eq("ownerId", ownerId).eq("formId", requestArguments.formId)
      )
      .collect();
    const { retireVersionId } = requestArguments;
    const old = rows.find(
      (d) => d.formVersionId === retireVersionId && d.status === "active"
    );
    if (!old) {
      throw new ConvexError("Draft to retire was not found for this account.");
    }
    // Check the target first: when the latest version no longer accepts new
    // drafts, the call fails here and the caller's active draft is untouched.
    const latest = await latestVersion(context, requestArguments.formId);
    if (!latest) {
      throw new ConvexError(
        "No published version for this form. New drafts are blocked."
      );
    }
    if (latest.status !== "active") {
      throw new ConvexError(
        `New drafts are blocked: version ${latest.version} is ${latest.status}.`
      );
    }
    const now = Date.now();
    await context.db.patch(old._id, { status: "retired" });
    return await context.db.insert("drafts", {
      answers: requestArguments.answers,
      expiresAt: now + draftTtlMs,
      formId: requestArguments.formId,
      formVersionId: latest._id,
      ownerId,
      status: "active",
      updatedAt: now,
    });
  },
});

// Daily expiry sweep. Deletes each expired ACTIVE draft plus its file rows
// and storage blobs explicitly, since Convex has no cascade delete or
// built-in expiry. Submitted drafts are untouched, so submission file refs
// (#37) never dangle: their files survive with the submitted draft. This is
// the contract the #38 uploads track relies on: every files row under an
// expired active draft goes away and each storageId blob is deleted. Returns
// the number of drafts removed.
export const purgeExpired = internalMutation({
  args: {},
  handler: async (context) => {
    const now = Date.now();
    const rows = await context.db.query("drafts").collect();
    const expired = rows
      .filter((d) => d.status === "active" && d.expiresAt < now)
      .slice(0, 100);
    await mapSequentially(expired, async (draft) => {
      const files = await context.db
        .query("files")
        .withIndex("draft", (q) => q.eq("draftId", draft._id))
        .collect();
      await mapSequentially(files, async (file) => {
        await context.storage.delete(file.storageId);
        await context.db.delete(file._id);
      });
      await context.db.delete(draft._id);
    });
    return expired.length;
  },
});
