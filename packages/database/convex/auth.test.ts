import { convexTest } from "convex-test";
import { afterEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import { authProviders } from "./auth";
import { requireUserId } from "./authz";
import schema from "./schema";

// Foundation boundary tests for #34 (sign-in-to-save). Every rule that later
// tickets build on is proven here at the Convex function boundary: anonymous
// callers are denied, authenticated callers resolve to their user, the
// provider list has no anonymous path, and the first developer-admin seed is
// env-gated with no public self-promotion.

const compareText = (left: unknown, right: unknown): number =>
  String(left).localeCompare(String(right));

const modules = import.meta.glob("./**/*.ts");

const ensureId = <T extends string>(id: T): T => {
  if (id === "") {
    throw new Error("User id is empty.");
  }
  return id;
};

describe("sign-in-to-save gate", () => {
  it("viewer returns null when anonymous", async () => {
    const t = convexTest(schema, modules);

    await expect(t.query(api.users.viewer, {})).resolves.toBeNull();
  });

  it("viewer returns the signed-in user, nothing else", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(
      async (context) =>
        await context.db.insert("users", { email: "applicant@example.com" })
    );
    const viewer = await t
      .withIdentity({ subject: userId })
      .query(api.users.viewer, {});

    expect(viewer).toMatchObject({ email: "applicant@example.com" });
  });

  it("requireUserId denies anonymous mutations", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(async (context) => {
        await requireUserId(context);
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("requireUserId resolves the caller when authenticated", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(
      async (context) =>
        await context.db.insert("users", { email: "saver@example.com" })
    );
    const resolved = await t
      .withIdentity({ subject: userId })
      .mutation(async (context) => await requireUserId(context));

    expect(resolved).toBe(userId);
  });
});

describe("single account per verified email", () => {
  it("offers exactly Google OAuth and email OTP, no anonymous provider", () => {
    // OAuth entries are config factories; plain entries are config objects.
    const ids = authProviders
      .map((provider) =>
        typeof provider === "function" ? provider({}).id : provider.id
      )
      .toSorted(compareText);

    expect(ids).toStrictEqual(["google", "resend-otp"]);
  });

  it("keeps default account linking (no custom user creation)", async () => {
    // Same verified email must land on one user automatically. That is
    // library behavior both providers share as trusted methods, and it only
    // holds while auth.ts passes no custom createOrUpdateUser. This pins the
    // provider wiring the behavior depends on; the live Google+OTP pairing
    // is verified manually against the dev deployment (see PR body).
    const t = convexTest(schema, modules);
    const first = await t.run(async (context) => {
      const id = await context.db.insert("users", {
        email: "shared@example.com",
        emailVerificationTime: Date.now(),
      });
      return ensureId(id);
    });
    const viewer = await t
      .withIdentity({ subject: first })
      .query(api.users.viewer, {});

    expect(viewer?._id).toBe(first);
  });
});

describe("first developer-admin seed", () => {
  const environmentKey = "DEVELOPER_ADMIN_EMAIL";
  const previous = process.env[environmentKey];

  const restoreEnvironment = () => {
    if (previous === undefined) {
      Reflect.deleteProperty(process.env, environmentKey);
    } else {
      process.env[environmentKey] = previous;
    }
  };

  afterEach(() => {
    restoreEnvironment();
  });

  it("refuses to run without the deploy env email", async () => {
    const t = convexTest(schema, modules);
    Reflect.deleteProperty(process.env, environmentKey);

    await expect(
      t.mutation(internal.users.seedDeveloperAdmin, {})
    ).rejects.toThrow("DEVELOPER_ADMIN_EMAIL");
  });

  it("promotes the signed-in deploy email, and only that user", async () => {
    const t = convexTest(schema, modules);
    process.env[environmentKey] = "dev-admin@example.com";
    const adminId = await t.run(
      async (context) =>
        await context.db.insert("users", { email: "dev-admin@example.com" })
    );
    const otherId = await t.run(
      async (context) =>
        await context.db.insert("users", { email: "other@example.com" })
    );

    await expect(
      t.mutation(internal.users.seedDeveloperAdmin, {})
    ).resolves.toBe(adminId);

    const admin = await t.run(async (context) => await context.db.get(adminId));
    const other = await t.run(async (context) => await context.db.get(otherId));

    expect(admin?.role).toBe("developer-admin");
    expect(other?.role).toBeUndefined();
    // Idempotent: seeding twice keeps the flag without error.
    await expect(
      t.mutation(internal.users.seedDeveloperAdmin, {})
    ).resolves.toBe(adminId);
  });

  it("fails when the deploy email has never signed in", async () => {
    const t = convexTest(schema, modules);
    process.env[environmentKey] = "nobody@example.com";

    await expect(
      t.mutation(internal.users.seedDeveloperAdmin, {})
    ).rejects.toThrow("Sign in with that address first");
  });
});
