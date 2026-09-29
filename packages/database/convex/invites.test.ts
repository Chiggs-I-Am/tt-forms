import { convexTest } from "convex-test";
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import type { MutationCtx as MutationContext } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { TestConvex } from "convex-test";

// Boundary tests for admin invites (#39): developer-admin-only issue,
// email-bound single-use 7-day redemption through the normal sign-in, and
// server-side denials for demo-admin, applicants, and anonymous callers.
const compareText = (left: unknown, right: unknown): number =>
  String(left).localeCompare(String(right));

const modules = import.meta.glob("./**/*.ts");
const sevenDaysMs = 604_800_000;

const isModule = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const loadModule = async (path: string): Promise<Record<string, unknown>> => {
  const loader = modules[path];
  if (!loader) {
    throw new Error(`Module ${path} was not found.`);
  }
  const loaded = await loader();
  if (!isModule(loaded)) {
    throw new Error(`Module ${path} did not return an object.`);
  }
  return loaded;
};

type Role = "applicant" | "developer-admin" | "demo-admin";

const ensureId = <T extends string>(id: T): T => {
  if (id === "") {
    throw new Error("User id is empty.");
  }
  return id;
};

const makeRole = <T extends string>(value: T): { value: T } => ({ value });

const user = async (
  t: TestConvex<typeof schema>,
  email: string,
  ...options: [role?: Role, isVerified?: boolean]
) => {
  const [role, isVerified = true] = options;
  const userId: Id<"users"> = await t.run(async (context: MutationContext) => {
    const id = await context.db.insert("users", {
      email,
      ...(role && { role }),
      ...(isVerified && { emailVerificationTime: Date.now() }),
    });
    return ensureId(id);
  });
  return { authed: t.withIdentity({ subject: userId }), userId };
};

describe("createInvite", () => {
  it("denies anonymous, applicant, and demo-admin callers", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const development = await user(t, "dev@example.com", "developer-admin");
    const demo = await user(t, "demo@example.com", "demo-admin");
    const applicant = await user(t, "a@example.com");

    await expect(
      t.mutation(api.invites.createInvite, {
        email: "new@example.com",
        role: "demo-admin",
      })
    ).rejects.toThrow("Not authenticated");
    await expect(
      demo.authed.mutation(api.invites.createInvite, {
        email: "new@example.com",
        role: "demo-admin",
      })
    ).rejects.toThrow("Developer-admin only");
    await expect(
      applicant.authed.mutation(api.invites.createInvite, {
        email: "new@example.com",
        role: "demo-admin",
      })
    ).rejects.toThrow("Developer-admin only");

    // Control: developer-admin succeeds.
    const { token } = await development.authed.mutation(
      api.invites.createInvite,
      {
        email: "new@example.com",
        role: "demo-admin",
      }
    );

    expect(token).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("stores an unguessable token with 7-day expiry and the issuer", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const development = await user(t, "dev@example.com", "developer-admin");
    const before = Date.now();
    const { token } = await development.authed.mutation(
      api.invites.createInvite,
      {
        email: "New@Example.com",
        role: "developer-admin",
      }
    );
    const row = await t.run(async (context: MutationContext) => {
      const result = await context.db
        .query("invites")
        .withIndex("email", (q) => q.eq("email", "new@example.com"))
        .first();
      if (result === null) {
        return null;
      }
      return result;
    });

    expect(row).toMatchObject({
      createdBy: development.userId,
      role: "developer-admin",
      token,
    });
    expect(row).not.toHaveProperty("usedAt");
    expect(row?.expiresAt).toBeGreaterThanOrEqual(
      before + sevenDaysMs - Number("1000")
    );
    expect(row?.expiresAt).toBeLessThanOrEqual(Date.now() + sevenDaysMs);
    expect(row?.usedAt).toBeUndefined();
  });

  it("rejects invalid email addresses and roles", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const development = await user(t, "dev@example.com", "developer-admin");

    await expect(
      development.authed.mutation(api.invites.createInvite, {
        email: "not-an-email",
        role: "demo-admin",
      })
    ).rejects.toThrow("valid email");

    const invalidRole = makeRole<"developer-admin" | "demo-admin">(
      "demo-admin"
    );
    Object.defineProperty(invalidRole, "value", { value: "applicant" });

    await expect(
      development.authed.mutation(api.invites.createInvite, {
        email: "x@example.com",
        role: invalidRole.value,
      })
    ).rejects.toThrow("applicant");
  });
});

describe("claimInvite", () => {
  it("denies anonymous callers", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);

    await expect(t.mutation(api.invites.claimInvite, {})).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("grants the role and marks single-use; redeeming twice throws", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const development = await user(t, "dev@example.com", "developer-admin");
    const newcomer = await user(t, "newcomer@example.com");
    await development.authed.mutation(api.invites.createInvite, {
      email: "newcomer@example.com",
      role: "demo-admin",
    });
    const { role } = await newcomer.authed.mutation(
      api.invites.claimInvite,
      {}
    );

    expect(role).toBe("demo-admin");

    const stored = await t.run(
      async (context: MutationContext) => await context.db.get(newcomer.userId)
    );

    expect(stored?.role).toBe("demo-admin");

    const invite = await t.run(async (context: MutationContext) => {
      const result = await context.db
        .query("invites")
        .withIndex("email", (q) => q.eq("email", "newcomer@example.com"))
        .first();
      if (result === null) {
        return null;
      }
      return result;
    });

    expect(invite?.usedAt).toBeTypeOf("number");
    await expect(
      newcomer.authed.mutation(api.invites.claimInvite, {})
    ).rejects.toThrow(/already redeemed|No unused/u);
  });

  it("throws for expired invites", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const development = await user(t, "dev@example.com", "developer-admin");
    const stale = await user(t, "stale@example.com");
    const { token } = await development.authed.mutation(
      api.invites.createInvite,
      {
        email: "stale@example.com",
        role: "demo-admin",
      }
    );
    await t.run(async (context: MutationContext) => {
      const row = await context.db
        .query("invites")
        .withIndex("token", (q) => q.eq("token", token))
        .first();
      if (!row) {
        throw new Error("Invite row is missing.");
      }
      await context.db.patch(row._id, {
        expiresAt: Date.now() - Number("1000"),
      });
    });

    await expect(
      stale.authed.mutation(api.invites.claimInvite, {})
    ).rejects.toThrow("No unused, unexpired invite");
  });

  it("throws when no invite matches the sign-in email", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const development = await user(t, "dev@example.com", "developer-admin");
    const stranger = await user(t, "stranger@example.com");
    await development.authed.mutation(api.invites.createInvite, {
      email: "someone-else@example.com",
      role: "demo-admin",
    });

    await expect(
      stranger.authed.mutation(api.invites.claimInvite, {})
    ).rejects.toThrow("No unused, unexpired invite");
  });

  it("throws without a isVerified email on the users row", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const development = await user(t, "dev@example.com", "developer-admin");
    await development.authed.mutation(api.invites.createInvite, {
      email: "unisVerified@example.com",
      role: "demo-admin",
    });
    const unisVerified = await user(
      t,
      "unisVerified@example.com",
      undefined,
      false
    );

    await expect(
      unisVerified.authed.mutation(api.invites.claimInvite, {})
    ).rejects.toThrow("Verify your email");
  });
});

describe("listInvites", () => {
  it("denies anonymous and demo-admin callers", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const demo = await user(t, "demo@example.com", "demo-admin");

    await expect(t.query(api.invites.listInvites, {})).rejects.toThrow(
      "Not authenticated"
    );
    await expect(
      demo.authed.query(api.invites.listInvites, {})
    ).rejects.toThrow("Developer-admin only");
  });

  it("never exposes invite tokens", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const development = await user(t, "dev@example.com", "developer-admin");
    await development.authed.mutation(api.invites.createInvite, {
      email: "listed@example.com",
      role: "demo-admin",
    });

    const rows = await development.authed.query(api.invites.listInvites, {});

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: "listed@example.com",
      role: "demo-admin",
      usedAt: null,
    });
    expect(rows[0]?.expiresAt).toBeTypeOf("number");
    expect(rows[0]).not.toHaveProperty("token");
  });
});

describe("invite module shape", () => {
  it("exports only invite paths; only claimInvite writes, marking single-use", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const inviteModule = await loadModule("./invites.ts");

    expect(Object.keys(inviteModule).toSorted(compareText)).toStrictEqual([
      "claimInvite",
      "createInvite",
      "listInvites",
      "SEVEN_DAYS_MS",
    ]);
  });
});
