import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { answersValidator, formDefinitionValidator } from "./formModel";

// Role flag for #34 (foundation). `undefined` means applicant: every signed-in
// user starts as an applicant and only the seed script (#34) or an admin
// invite (#39) can raise the flag. No public mutation may write this field.
export const userRoles = v.union(
  v.literal("applicant"),
  v.literal("developer-admin"),
  v.literal("demo-admin")
);

export const versionStatuses = v.union(
  v.literal("active"),
  v.literal("retired"),
  v.literal("withdrawn")
);

const schema = defineSchema({
  ...authTables,

  // One active draft per owner and form for #36. Convex has no true unique
  // constraint, so the composite index plus check-and-reuse inside every
  // write-path mutation is the enforcement. Correct under normal use, soft
  // under concurrent duplicate inserts; accepted for a demo.
  drafts: defineTable({
    answers: answersValidator,
    expiresAt: v.number(),
    formId: v.id("forms"),
    formVersionId: v.id("formVersions"),
    ownerId: v.id("users"),
    status: v.union(
      v.literal("active"),
      v.literal("submitted"),
      v.literal("retired")
    ),
    updatedAt: v.number(),
  })
    .index("owner_form", ["ownerId", "formId"])
    .index("owner", ["ownerId"]),

  // File metadata for #38. Rows point at `_storage` ids and are linked to a
  // draft; draft-expiry cleanup deletes each file explicitly since there is
  // no built-in expiry or cascade delete.
  files: defineTable({
    contentType: v.string(),
    createdAt: v.number(),
    draftId: v.optional(v.id("drafts")),
    fileName: v.string(),
    ownerId: v.id("users"),
    size: v.number(),
    storageId: v.id("_storage"),
  })
    .index("owner", ["ownerId"])
    .index("draft", ["draftId"]),

  // Immutable published snapshots for #35. The definition is frozen at
  // publish time; only `status`/`withdrawReason` move afterwards, through the
  // retire/withdraw mutations. Drafts and submissions pin `formVersionId`.
  formVersions: defineTable({
    createdAt: v.number(),
    definition: formDefinitionValidator,
    formId: v.id("forms"),
    sourceLabel: v.string(),
    sourceUrl: v.string(),
    status: versionStatuses,
    version: v.number(),
    withdrawReason: v.optional(v.string()),
  })
    .index("form", ["formId", "version"])
    .index("form_status", ["formId", "status"]),

  // Working copies for #35. One editable draft definition per form slug;
  // editing never touches a published version. Only developer-admin writes.
  forms: defineTable({
    agency: v.string(),
    definition: formDefinitionValidator,
    name: v.string(),
    slug: v.string(),
    sourceLabel: v.string(),
    sourceUrl: v.string(),
    updatedAt: v.number(),
  }).index("slug", ["slug"]),

  // Email-bound, single-use, 7-day invites for #39. Redemption happens
  // through the same Google/OTP sign-in with the matching address.
  invites: defineTable({
    createdBy: v.id("users"),
    email: v.string(),
    expiresAt: v.number(),
    role: v.union(v.literal("developer-admin"), v.literal("demo-admin")),
    token: v.string(),
    usedAt: v.optional(v.number()),
  })
    .index("token", ["token"])
    .index("email", ["email"]),

  // Denormalized submission snapshots for #37: answers plus the pinned
  // version, file refs, and rendered labels for the printable view.
  submissions: defineTable({
    answers: answersValidator,
    fileIds: v.array(v.id("files")),
    formId: v.id("forms"),
    formVersionId: v.id("formVersions"),
    labels: v.record(v.string(), v.string()),
    ownerId: v.id("users"),
    submittedAt: v.number(),
    version: v.number(),
  }).index("owner", ["ownerId"]),

  users: defineTable({
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    role: v.optional(userRoles),
  }).index("email", ["email"]),
});

export default schema;
