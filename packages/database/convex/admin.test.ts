import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import type { MutationCtx } from "./_generated/server"
import schema from "./schema"

// Boundary tests for listWorkingCopies (#35 slice): the builder index is
// developer-admin only. Anonymous callers and demo-admin are denied
// server-side; UI hiding is cosmetic and never the enforcement.
const modules = import.meta.glob("./**/*.ts")

async function devAdmin(t: TestConvex<typeof schema>) {
  const userId = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("users", {
      email: "dev@example.com",
      role: "developer-admin",
    })
  })
  return t.withIdentity({ subject: userId })
}

describe("listWorkingCopies", () => {
  it("denies anonymous callers", async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.forms.listWorkingCopies, {})).rejects.toThrow(
      "Not authenticated"
    )
  })

  it("denies demo-admin callers", async () => {
    const t = convexTest(schema, modules)
    const userId = await t.run(async (ctx: MutationCtx) => {
      return await ctx.db.insert("users", {
        email: "demo@example.com",
        role: "demo-admin",
      })
    })
    const demo = t.withIdentity({ subject: userId })
    await expect(demo.query(api.forms.listWorkingCopies, {})).rejects.toThrow(
      "Developer-admin only"
    )
  })

  it("returns copies with latest version state to developer-admin", async () => {
    const t = convexTest(schema, modules)
    const dev = await devAdmin(t)
    expect(await dev.query(api.forms.listWorkingCopies, {})).toEqual([])
    await dev.mutation(api.forms.saveWorkingCopy, {
      slug: "builder-form",
      name: "Builder Form",
      agency: "Test Agency",
      sourceLabel: "Official source",
      sourceUrl: "https://example.com/form",
      definition: {
        sections: [
          {
            id: "s1",
            title: "First",
            fields: [
              {
                id: "name",
                kind: "short_text",
                label: "Name",
                required: true,
              },
            ],
          },
        ],
      },
    })
    const copies = await dev.query(api.forms.listWorkingCopies, {})
    expect(copies).toHaveLength(1)
    expect(copies[0]).toMatchObject({
      slug: "builder-form",
      name: "Builder Form",
      agency: "Test Agency",
      latestVersion: null,
      latestStatus: null,
    })
    expect(typeof copies[0]?.updatedAt).toBe("number")
    await dev.mutation(api.forms.publish, { slug: "builder-form" })
    const after = await dev.query(api.forms.listWorkingCopies, {})
    expect(after[0]).toMatchObject({
      latestVersion: 1,
      latestStatus: "active",
    })
  })
})
