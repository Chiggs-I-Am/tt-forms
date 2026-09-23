import { ConvexError } from "convex/values"
import type { Auth } from "convex/server"
import type { Id } from "./_generated/dataModel"
import type { DatabaseReader } from "./_generated/server"

// Sign-in-to-save gate for #34. Every write-path mutation (drafts in #36,
// submissions in #37, uploads in #38, admin actions in #39) must call this
// first. Anonymous callers get a denial, never a row.
//
// Convex has no true unique constraint, so one-active-draft-per-owner-and-form
// (later tickets) is a composite index plus check-and-reuse inside each
// authenticated mutation. Correct under normal use, soft under concurrent
// duplicate inserts; accepted for a demo.
export async function requireUserId(ctx: { auth: Auth }): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) {
    throw new ConvexError("Not authenticated. Sign in to save.")
  }
  // Convex Auth sets the JWT subject to "<userId>|<sessionId>".
  const [userId] = identity.subject.split("|")
  return userId as Id<"users">
}

// Developer-admin gate for #35. Publish, retire, withdraw, and invite issue
// are developer-admin only; demo-admin is denied server-side in each
// mutation (UI hiding is cosmetic). No public path changes the role flag.
export async function requireDeveloperAdmin(ctx: {
  auth: Auth
  db: DatabaseReader
}): Promise<Id<"users">> {
  const userId = await requireUserId(ctx)
  const user = await ctx.db.get(userId)
  if (user?.role !== "developer-admin") {
    throw new ConvexError("Developer-admin only.")
  }
  return userId
}
