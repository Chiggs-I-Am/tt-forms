import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import type { TestConvex } from "convex-test";
import type { MutationCtx as MutationContext } from "./_generated/server";

// Boundary tests for listWorkingCopies (#35 slice): the builder index is
// developer-admin only. Anonymous callers and demo-admin are denied
// server-side; UI hiding is cosmetic and never the enforcement.
const modules = import.meta.glob("./**/*.ts");

const ensureId = <T extends string>(id: T): T => {
  if (id === "") {
    throw new Error("User id is empty.");
  }
  return id;
};

const developmentAdmin = async (t: TestConvex<typeof schema>) => {
  const userId = await t.run(async (context: MutationContext) => {
    const id = await context.db.insert("users", {
      email: "dev@example.com",
      role: "developer-admin",
    });
    return ensureId(id);
  });
  return t.withIdentity({ subject: userId });
};

describe("listWorkingCopies", () => {
  it("denies anonymous callers", async () => {
    const t = convexTest(schema, modules);

    await expect(t.query(api.forms.listWorkingCopies, {})).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("denies demo-admin callers", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (context: MutationContext) => {
      const id = await context.db.insert("users", {
        email: "demo@example.com",
        role: "demo-admin",
      });
      return ensureId(id);
    });
    const demo = t.withIdentity({ subject: userId });

    await expect(demo.query(api.forms.listWorkingCopies, {})).rejects.toThrow(
      "Developer-admin only"
    );
  });

  it("returns copies with latest version state to developer-admin", async () => {
    const t = convexTest(schema, modules);
    const development = await developmentAdmin(t);

    await expect(
      development.query(api.forms.listWorkingCopies, {})
    ).resolves.toStrictEqual([]);

    await development.mutation(api.forms.saveWorkingCopy, {
      agency: "Test Agency",
      definition: {
        sections: [
          {
            fields: [
              {
                id: "name",
                kind: "short_text",
                label: "Name",
                required: true,
              },
            ],
            id: "s1",
            title: "First",
          },
        ],
      },
      name: "Builder Form",
      slug: "builder-form",
      sourceLabel: "Official source",
      sourceUrl: "https://example.com/form",
    });
    const copies = await development.query(api.forms.listWorkingCopies, {});

    expect(copies).toHaveLength(1);
    expect(copies[0]).toMatchObject({
      agency: "Test Agency",
      latestStatus: null,
      latestVersion: null,
      name: "Builder Form",
      slug: "builder-form",
    });
    expect(copies[0]?.updatedAt).toBeTypeOf("number");

    await development.mutation(api.forms.publish, { slug: "builder-form" });
    const after = await development.query(api.forms.listWorkingCopies, {});

    expect(after[0]).toMatchObject({
      latestStatus: "active",
      latestVersion: 1,
    });
  });
});
