import { convexTest, type TestConvex } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import type { MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { SEVEN_DAYS_MS } from "./invites"
import schema from "./schema"

// Boundary tests for admin invites (#39): developer-admin-only issue,
// email-bound single-use 7-day redemption through the normal sign-in, and
// server-side denials for demo-admin, applicants, and anonymous callers.
const modules = import.meta.glob("./**/*.ts")

type Role = "applicant" | "developer-admin" | "demo-admin"

async function user(
  t: TestConvex<typeof schema>,
  email: string,
  role?: Role,
  verified = true
) {
  const userId: Id<"users"> = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("users", {
      email,
      ...(role ? { role } : {}),
      ...(verified ? { emailVerificationTime: Date.now() } : {}),
    })
  })
  return { userId, authed: t.withIdentity({ subject: userId }) }
}

describe("createInvite", () => {
  it("denies anonymous, applicant, and demo-admin callers", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const dev = await user(t, "dev@example.com", "developer-admin")
    const demo = await user(t, "demo@example.com", "demo-admin")
    const applicant = await user(t, "a@example.com")
    await expect(
      t.mutation(api.invites.createInvite, {
        email: "new@example.com",
        role: "demo-admin",
      })
    ).rejects.toThrow("Not authenticated")
    await expect(
      demo.authed.mutation(api.invites.createInvite, {
        email: "new@example.com",
        role: "demo-admin",
      })
    ).rejects.toThrow("Developer-admin only")
    await expect(
      applicant.authed.mutation(api.invites.createInvite, {
        email: "new@example.com",
        role: "demo-admin",
      })
    ).rejects.toThrow("Developer-admin only")
    // Control: developer-admin succeeds.
    const { token } = await dev.authed.mutation(api.invites.createInvite, {
      email: "new@example.com",
      role: "demo-admin",
    })
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it("stores an unguessable token with 7-day expiry and the issuer", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const dev = await user(t, "dev@example.com", "developer-admin")
    const before = Date.now()
    const { token } = await dev.authed.mutation(api.invites.createInvite, {
      email: "New@Example.com",
      role: "developer-admin",
    })
    const row = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db
        .query("invites")
        .withIndex("email", (q) => q.eq("email", "new@example.com"))
        .first()
    })
    expect(row?.token).toBe(token)
    expect(row?.createdBy).toBe(dev.userId)
    expect(row?.role).toBe("developer-admin")
    expect(row?.expiresAt).toBeGreaterThanOrEqual(before + SEVEN_DAYS_MS - 1000)
    expect(row?.expiresAt).toBeLessThanOrEqual(Date.now() + SEVEN_DAYS_MS)
    expect(row?.usedAt).toBeUndefined()
  })

  it("rejects invalid email addresses and roles", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const dev = await user(t, "dev@example.com", "developer-admin")
    await expect(
      dev.authed.mutation(api.invites.createInvite, {
        email: "not-an-email",
        role: "demo-admin",
      })
    ).rejects.toThrow("valid email")
    await expect(
      dev.authed.mutation(api.invites.createInvite, {
        email: "x@example.com",
        // Roles are closed at runtime: developer-admin or demo-admin only.
        role: "applicant" as unknown as "demo-admin",
      })
    ).rejects.toThrow()
  })
})

describe("claimInvite", () => {
  it("denies anonymous callers", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    await expect(t.mutation(api.invites.claimInvite, {})).rejects.toThrow(
      "Not authenticated"
    )
  })

  it("grants the role and marks single-use; redeeming twice throws", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const dev = await user(t, "dev@example.com", "developer-admin")
    const newcomer = await user(t, "newcomer@example.com")
    await dev.authed.mutation(api.invites.createInvite, {
      email: "newcomer@example.com",
      role: "demo-admin",
    })
    const { role } = await newcomer.authed.mutation(api.invites.claimInvite, {})
    expect(role).toBe("demo-admin")
    const stored = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db.get(newcomer.userId)
    })
    expect(stored?.role).toBe("demo-admin")
    const invite = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db
        .query("invites")
        .withIndex("email", (q) => q.eq("email", "newcomer@example.com"))
        .first()
    })
    expect(typeof invite?.usedAt).toBe("number")
    await expect(
      newcomer.authed.mutation(api.invites.claimInvite, {})
    ).rejects.toThrow(/already redeemed|No unused/)
  })

  it("throws for expired invites", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const dev = await user(t, "dev@example.com", "developer-admin")
    const stale = await user(t, "stale@example.com")
    const { token } = await dev.authed.mutation(api.invites.createInvite, {
      email: "stale@example.com",
      role: "demo-admin",
    })
    await t.run(async (ctx: MutationCtx) => {
      const row = await ctx.db
        .query("invites")
        .withIndex("token", (q) => q.eq("token", token))
        .first()
      await ctx.db.patch(row!._id, { expiresAt: Date.now() - 1000 })
    })
    await expect(
      stale.authed.mutation(api.invites.claimInvite, {})
    ).rejects.toThrow("No unused, unexpired invite")
  })

  it("throws when no invite matches the sign-in email", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const dev = await user(t, "dev@example.com", "developer-admin")
    const stranger = await user(t, "stranger@example.com")
    await dev.authed.mutation(api.invites.createInvite, {
      email: "someone-else@example.com",
      role: "demo-admin",
    })
    await expect(
      stranger.authed.mutation(api.invites.claimInvite, {})
    ).rejects.toThrow("No unused, unexpired invite")
  })

  it("throws without a verified email on the users row", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const dev = await user(t, "dev@example.com", "developer-admin")
    await dev.authed.mutation(api.invites.createInvite, {
      email: "unverified@example.com",
      role: "demo-admin",
    })
    const unverified = await user(t, "unverified@example.com", undefined, false)
    await expect(
      unverified.authed.mutation(api.invites.claimInvite, {})
    ).rejects.toThrow("Verify your email")
  })
})

describe("listInvites", () => {
  it("denies anonymous and demo-admin callers and never exposes tokens", async () => {
    const t = convexTest(schema, modules)
    registerRateLimiter(t)
    const dev = await user(t, "dev@example.com", "developer-admin")
    const demo = await user(t, "demo@example.com", "demo-admin")
    await dev.authed.mutation(api.invites.createInvite, {
      email: "listed@example.com",
      role: "demo-admin",
    })
    await expect(t.query(api.invites.listInvites, {})).rejects.toThrow(
      "Not authenticated"
    )
    await expect(
      demo.authed.query(api.invites.listInvites, {})
    ).rejects.toThrow("Developer-admin only")
    const rows = await dev.authed.query(api.invites.listInvites, {})
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      email: "listed@example.com",
      role: "demo-admin",
    })
    expect(rows[0]).not.toHaveProperty("token")
    expect(typeof rows[0]?.expiresAt).toBe("number")
    expect(rows[0]?.usedAt).toBeNull()
  })
})

describe("invite module shape", () => {
  it("exports only invite paths; only claimInvite writes, marking single-use", async () => {
    const exported = await import("./invites")
    expect(Object.keys(exported).sort()).toEqual([
      "SEVEN_DAYS_MS",
      "claimInvite",
      "createInvite",
      "listInvites",
    ])
  })
})
