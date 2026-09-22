import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireDeveloperAdmin, requireUserId } from "./authz"
import { rateLimiter } from "./rateLimits"

// Admin invites for #39. Growth stays invite-only: a developer-admin issues an
// email-bound, single-use, 7-day invite, and the recipient redeems it by
// signing in with the matching address through the same Google or OTP flow.
// No approval queue, no shared secret, no admin-only method or extra factor.
// Demo-admin cannot issue invites; the denial is server-side in createInvite.

const inviteRole = v.union(
  v.literal("developer-admin"),
  v.literal("demo-admin")
)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// Unguessable token: 32 random bytes as 64 hex chars. The token is returned
// once to the issuing admin for out-of-band delivery (email or chat) and is
// never logged or exposed elsewhere, including listInvites.
function newToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

// Issue one invite. Developer-admin only; demo-admin, applicants, and
// anonymous callers are denied. Returns the token once; the caller delivers
// it out-of-band.
export const createInvite = mutation({
  args: { email: v.string(), role: inviteRole },
  handler: async (ctx, args) => {
    const createdBy = await requireDeveloperAdmin(ctx)
    await rateLimiter.limit(ctx, "inviteCreate", {
      key: createdBy,
      throws: true,
    })
    const email = normalizeEmail(args.email)
    if (!EMAIL_RE.test(email)) {
      throw new ConvexError("Invite needs a valid email address.")
    }
    const token = newToken()
    const now = Date.now()
    await ctx.db.insert("invites", {
      email,
      role: args.role,
      token,
      expiresAt: now + SEVEN_DAYS_MS,
      createdBy,
    })
    return { token }
  },
})

// Redeem the caller's invite. The caller must be signed in with a verified
// email matching an unexpired, unused invite; the users row is the email
// source of truth, not the JWT. Single-use is enforced by setting usedAt in
// the same mutation (check-then-set: correct under normal use, soft under a
// truly concurrent double-claim since Convex has no unique constraint;
// accepted for a demo). Sets the caller's role and returns it. Redeeming
// twice throws, as do expired invites and wrong-email sign-ins.
export const claimInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    await rateLimiter.limit(ctx, "inviteClaim", { key: userId, throws: true })
    const user = await ctx.db.get(userId)
    const email = user?.email?.trim().toLowerCase()
    if (!email) {
      throw new ConvexError(
        "Sign in with an email address before claiming an invite."
      )
    }
    if (!user?.emailVerificationTime) {
      throw new ConvexError("Verify your email before claiming an invite.")
    }
    const now = Date.now()
    const candidates = await ctx.db
      .query("invites")
      .withIndex("email", (q) => q.eq("email", email))
      .collect()
    const invite = candidates
      .filter((row) => row.usedAt === undefined && row.expiresAt >= now)
      .sort((a, b) => b.expiresAt - a.expiresAt)[0]
    if (!invite) {
      throw new ConvexError(
        "No unused, unexpired invite matches this sign-in email."
      )
    }
    if (invite.usedAt !== undefined) {
      throw new ConvexError("This invite was already redeemed.")
    }
    await ctx.db.patch(invite._id, { usedAt: now })
    await ctx.db.patch(userId, { role: invite.role })
    return { role: invite.role }
  },
})

// Outstanding invites for the developer-admin invites page. Tokens are never
// returned here; the token is shown once by createInvite only.
export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    await requireDeveloperAdmin(ctx)
    const rows = await ctx.db.query("invites").collect()
    rows.sort((a, b) => b.expiresAt - a.expiresAt)
    return rows.slice(0, 200).map((row) => ({
      inviteId: row._id,
      email: row.email,
      role: row.role,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt ?? null,
      createdBy: row.createdBy,
    }))
  },
})
