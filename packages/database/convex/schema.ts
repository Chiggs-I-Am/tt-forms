import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

// Role flag for #34 (foundation). `undefined` means applicant: every signed-in
// user starts as an applicant and only the seed script (#34) or an admin
// invite (#39) can raise the flag. No public mutation may write this field.
export const userRoles = v.union(
  v.literal("applicant"),
  v.literal("developer-admin"),
  v.literal("demo-admin")
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
  // Drafts, submissions, form versions, files, and invites land in
  // tickets #35-#39. Every write-path mutation there must call
  // requireUserId from ./authz (sign-in-to-save); no anonymous writes.
})

export default schema
