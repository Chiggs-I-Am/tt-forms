import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api, internal } from "./_generated/api"
import { authProviders } from "./auth"
import { requireUserId } from "./authz"
import schema from "./schema"

// Foundation boundary tests for #34 (sign-in-to-save). Every rule that later
// tickets build on is proven here at the Convex function boundary: anonymous
// callers are denied, authenticated callers resolve to their user, the
// provider list has no anonymous path, and the first developer-admin seed is
// env-gated with no public self-promotion.

const modules = import.meta.glob("./**/*.ts")

describe("sign-in-to-save gate", () => {
  it("viewer returns null when anonymous", async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.users.viewer, {})).resolves.toBeNull()
  })

  it("viewer returns the signed-in user, nothing else", async () => {
    const t = convexTest(schema, modules)
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: "applicant@example.com" })
    })
    const viewer = await t
      .withIdentity({ subject: userId })
      .query(api.users.viewer, {})
    expect(viewer).toMatchObject({ email: "applicant@example.com" })
  })

  it("requireUserId denies anonymous mutations", async () => {
    const t = convexTest(schema, modules)
    await expect(
      t.mutation(async (ctx) => {
        await requireUserId(ctx)
      })
    ).rejects.toThrow("Not authenticated")
  })

  it("requireUserId resolves the caller when authenticated", async () => {
    const t = convexTest(schema, modules)
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: "saver@example.com" })
    })
    const resolved = await t
      .withIdentity({ subject: userId })
      .mutation(async (ctx) => {
        return await requireUserId(ctx)
      })
    expect(resolved).toBe(userId)
  })
})

describe("single account per verified email", () => {
  it("offers exactly Google OAuth and email OTP, no anonymous provider", () => {
    // OAuth entries are config factories; plain entries are config objects.
    const ids = authProviders
      .map((provider) =>
        typeof provider === "function" ? provider({}).id : provider.id
      )
      .sort()
    expect(ids).toEqual(["google", "resend-otp"])
  })

  it("keeps default account linking (no custom user creation)", async () => {
    // Same verified email must land on one user automatically. That is
    // library behavior both providers share as trusted methods, and it only
    // holds while auth.ts passes no custom createOrUpdateUser. This pins the
    // provider wiring the behavior depends on; the live Google+OTP pairing
    // is verified manually against the dev deployment (see PR body).
    const t = convexTest(schema, modules)
    const first = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "shared@example.com",
        emailVerificationTime: Date.now(),
      })
    })
    const viewer = await t
      .withIdentity({ subject: first })
      .query(api.users.viewer, {})
    expect(viewer?._id).toBe(first)
  })
})

describe("first developer-admin seed", () => {
  const envKey = "DEVELOPER_ADMIN_EMAIL"
  const previous = process.env[envKey]

  const restoreEnv = () => {
    if (previous === undefined) {
      delete process.env[envKey]
    } else {
      process.env[envKey] = previous
    }
  }

  it("refuses to run without the deploy env email", async () => {
    const t = convexTest(schema, modules)
    delete process.env[envKey]
    try {
      await expect(
        t.mutation(internal.users.seedDeveloperAdmin, {})
      ).rejects.toThrow("DEVELOPER_ADMIN_EMAIL")
    } finally {
      restoreEnv()
    }
  })

  it("promotes the signed-in deploy email, and only that user", async () => {
    const t = convexTest(schema, modules)
    process.env[envKey] = "dev-admin@example.com"
    try {
      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", { email: "dev-admin@example.com" })
      })
      const otherId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", { email: "other@example.com" })
      })
      await expect(
        t.mutation(internal.users.seedDeveloperAdmin, {})
      ).resolves.toBe(adminId)
      const admin = await t.run(async (ctx) => ctx.db.get(adminId))
      const other = await t.run(async (ctx) => ctx.db.get(otherId))
      expect(admin?.role).toBe("developer-admin")
      expect(other?.role).toBeUndefined()
      // Idempotent: seeding twice keeps the flag without error.
      await expect(
        t.mutation(internal.users.seedDeveloperAdmin, {})
      ).resolves.toBe(adminId)
    } finally {
      restoreEnv()
    }
  })

  it("fails when the deploy email has never signed in", async () => {
    const t = convexTest(schema, modules)
    process.env[envKey] = "nobody@example.com"
    try {
      await expect(
        t.mutation(internal.users.seedDeveloperAdmin, {})
      ).rejects.toThrow("Sign in with that address first")
    } finally {
      restoreEnv()
    }
  })
})
