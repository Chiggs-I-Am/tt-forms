import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"
import { answersValidator, formDefinitionValidator } from "./formModel"

// Role flag for #34 (foundation). `undefined` means applicant: every signed-in
// user starts as an applicant and only the seed script (#34) or an admin
// invite (#39) can raise the flag. No public mutation may write this field.
export const userRoles = v.union(
  v.literal("applicant"),
  v.literal("developer-admin"),
  v.literal("demo-admin")
)

export const versionStatuses = v.union(
  v.literal("active"),
  v.literal("retired"),
  v.literal("withdrawn")
)

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(userRoles),
  }).index("email", ["email"]),

  // Working copies for #35. One editable draft definition per form slug;
  // editing never touches a published version. Only developer-admin writes.
  forms: defineTable({
    slug: v.string(),
    name: v.string(),
    agency: v.string(),
    sourceLabel: v.string(),
    sourceUrl: v.string(),
    definition: formDefinitionValidator,
    updatedAt: v.number(),
  }).index("slug", ["slug"]),

  // Immutable published snapshots for #35. The definition is frozen at
  // publish time; only `status`/`withdrawReason` move afterwards, through the
  // retire/withdraw mutations. Drafts and submissions pin `formVersionId`.
  formVersions: defineTable({
    formId: v.id("forms"),
    version: v.number(),
    status: versionStatuses,
    withdrawReason: v.optional(v.string()),
    definition: formDefinitionValidator,
    sourceLabel: v.string(),
    sourceUrl: v.string(),
    createdAt: v.number(),
  })
    .index("form", ["formId", "version"])
    .index("form_status", ["formId", "status"]),

  // One active draft per owner and form for #36. Convex has no true unique
  // constraint, so the composite index plus check-and-reuse inside every
  // write-path mutation is the enforcement. Correct under normal use, soft
  // under concurrent duplicate inserts; accepted for a demo.
  drafts: defineTable({
    ownerId: v.id("users"),
    formId: v.id("forms"),
    formVersionId: v.id("formVersions"),
    answers: answersValidator,
    status: v.union(v.literal("active")),
    expiresAt: v.number(),
    updatedAt: v.number(),
  })
    .index("owner_form", ["ownerId", "formId"])
    .index("owner", ["ownerId"]),

  // Denormalized submission snapshots for #37: answers plus the pinned
  // version, file refs, and rendered labels for the printable view.
  submissions: defineTable({
    ownerId: v.id("users"),
    formId: v.id("forms"),
    formVersionId: v.id("formVersions"),
    version: v.number(),
    answers: answersValidator,
    labels: v.record(v.string(), v.string()),
    fileIds: v.array(v.id("files")),
    submittedAt: v.number(),
  }).index("owner", ["ownerId"]),

  // File metadata for #38. Rows point at `_storage` ids and are linked to a
  // draft; draft-expiry cleanup deletes each file explicitly since there is
  // no built-in expiry or cascade delete.
  files: defineTable({
    ownerId: v.id("users"),
    draftId: v.optional(v.id("drafts")),
    storageId: v.id("_storage"),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    createdAt: v.number(),
  })
    .index("owner", ["ownerId"])
    .index("draft", ["draftId"]),

  // Email-bound, single-use, 7-day invites for #39. Redemption happens
  // through the same Google/OTP sign-in with the matching address.
  invites: defineTable({
    email: v.string(),
    role: v.union(v.literal("developer-admin"), v.literal("demo-admin")),
    token: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("token", ["token"])
    .index("email", ["email"]),
})

export default schema
