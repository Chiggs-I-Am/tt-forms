import { getAuthUserId } from "@convex-dev/auth/server"
import { internalMutation, query } from "./_generated/server"

// Who the caller is, or null when anonymous. Client components use this for
// UI gating only; enforcement always lives in mutations via requireUserId.
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }
    return await ctx.db.get(userId)
  },
})

// One-off bootstrap for the first developer-admin (#34). Run from the Convex
// dashboard (or `npx convex run`) AFTER signing in once with the deploy email,
// with DEVELOPER_ADMIN_EMAIL set on the deployment. Refuses to run without
// the env var, and all further admins come via invites (#39). There is no
// public mutation that writes the role flag.
export const seedDeveloperAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const email = process.env.DEVELOPER_ADMIN_EMAIL
    if (!email) {
      throw new Error("DEVELOPER_ADMIN_EMAIL is not set on this deployment.")
    }
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first()
    if (user === null) {
      throw new Error(
        `No user found for ${email}. Sign in with that address first, then seed.`
      )
    }
    if (user.role !== "developer-admin") {
      await ctx.db.patch(user._id, { role: "developer-admin" })
    }
    return user._id
  },
})
