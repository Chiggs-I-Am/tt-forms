import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import { api, internal } from "./_generated/api"
import type { MutationCtx } from "./_generated/server"
import type { FormDefinition } from "./formModel"
import schema from "./schema"

// Function-boundary tests for #35: publish checks, version immutability and
// pinning, retire versus withdraw, and server-side demo-admin denials.

const modules = import.meta.glob("./**/*.ts")

const workingCopy = {
  slug: "test-form",
  name: "Test Form",
  agency: "Test Agency",
  sourceLabel: "Official source",
  sourceUrl: "https://example.com/form",
  definition: {
    sections: [
      {
        id: "s1",
        title: "First",
        fields: [
          { id: "name", kind: "short_text", label: "Name", required: true },
        ],
      },
    ],
  } satisfies FormDefinition,
}

async function devAdmin(t: TestConvex<typeof schema>) {
  const userId = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("users", {
      email: "dev@example.com",
      role: "developer-admin",
    })
  })
  return t.withIdentity({ subject: userId })
}

async function demoAdmin(t: TestConvex<typeof schema>) {
  const userId = await t.run(async (ctx: MutationCtx) => {
    return await ctx.db.insert("users", {
      email: "demo@example.com",
      role: "demo-admin",
    })
  })
  return t.withIdentity({ subject: userId })
}

describe("publish", () => {
  it("denies anonymous and demo-admin publishers", async () => {
    const t = convexTest(schema, modules)
    await expect(t.mutation(api.forms.publish, { slug: "x" })).rejects.toThrow(
      "Not authenticated"
    )
    const demo = await demoAdmin(t)
    await expect(
      demo.mutation(api.forms.publish, { slug: "x" })
    ).rejects.toThrow("Developer-admin only")
  })

  it("blocks publish on failed checks and incomplete sources", async () => {
    const t = convexTest(schema, modules)
    const dev = await devAdmin(t)
    await dev.mutation(api.forms.saveWorkingCopy, {
      ...workingCopy,
      sourceUrl: "",
      definition: {
        sections: [
          {
            id: "s",
            title: "S",
            fields: [
              { id: "c", kind: "single_choice", label: "", options: ["A"] },
            ],
          },
        ],
      },
    })
    await expect(
      dev.mutation(api.forms.publish, { slug: "test-form" })
    ).rejects.toThrow(/source information|needs a label|two non-empty options/)
  })

  it("snapshots v1 and keeps it frozen while the copy evolves", async () => {
    const t = convexTest(schema, modules)
    const dev = await devAdmin(t)
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy)
    const v1 = await dev.mutation(api.forms.publish, { slug: "test-form" })
    const first = await t.query(api.forms.getVersion, { versionId: v1 })
    expect(first?.version).toBe(1)
    expect(first?.status).toBe("active")

    // Evolve the copy and publish v2: v1 must read back unchanged (pinning).
    await dev.mutation(api.forms.saveWorkingCopy, {
      ...workingCopy,
      definition: {
        sections: [
          {
            id: "s1",
            title: "First (revised)",
            fields: [
              { id: "name", kind: "short_text", label: "Name", required: true },
              { id: "extra", kind: "short_text", label: "Extra" },
            ],
          },
        ],
      },
    })
    const v2 = await dev.mutation(api.forms.publish, { slug: "test-form" })
    const reread = await t.query(api.forms.getVersion, { versionId: v1 })
    expect(reread?.definition).toEqual(first?.definition)
    const second = await t.query(api.forms.getVersion, { versionId: v2 })
    expect(second?.version).toBe(2)
    expect(second?.definition.sections[0]?.fields).toHaveLength(2)
  })
})

describe("retire versus withdraw", () => {
  async function published(t: TestConvex<typeof schema>) {
    const dev = await devAdmin(t)
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy)
    const versionId = await dev.mutation(api.forms.publish, {
      slug: "test-form",
    })
    return { dev, versionId }
  }

  it("retires without a reason and keeps submissions open", async () => {
    const t = convexTest(schema, modules)
    const { dev, versionId } = await published(t)
    await dev.mutation(api.forms.retire, { versionId })
    const gate = await dev.query(api.forms.versionGate, { versionId })
    expect(gate.status).toBe("retired")
    expect(gate.newDrafts).toBe(false)
    expect(gate.submissions).toBe(true)
  })

  it("withdraws only with a reason and blocks submissions", async () => {
    const t = convexTest(schema, modules)
    const { dev, versionId } = await published(t)
    await expect(
      dev.mutation(api.forms.withdraw, { versionId, reason: "  " })
    ).rejects.toThrow("readable explanation")
    await dev.mutation(api.forms.withdraw, {
      versionId,
      reason: "Error on the paper form.",
    })
    const gate = await dev.query(api.forms.versionGate, { versionId })
    expect(gate.status).toBe("withdrawn")
    expect(gate.withdrawReason).toBe("Error on the paper form.")
    expect(gate.newDrafts).toBe(false)
    expect(gate.submissions).toBe(false)
  })

  it("guards transitions and denies demo-admin", async () => {
    const t = convexTest(schema, modules)
    const { dev, versionId } = await published(t)
    const demo = await demoAdmin(t)
    await expect(
      demo.mutation(api.forms.retire, { versionId })
    ).rejects.toThrow("Developer-admin only")
    await expect(
      demo.mutation(api.forms.withdraw, { versionId, reason: "x" })
    ).rejects.toThrow("Developer-admin only")
    await dev.mutation(api.forms.retire, { versionId })
    await expect(dev.mutation(api.forms.retire, { versionId })).rejects.toThrow(
      "Only active versions retire"
    )
    // A retired version can still be emergency-withdrawn; withdrawing twice
    // throws.
    await dev.mutation(api.forms.withdraw, { versionId, reason: "x" })
    await expect(
      dev.mutation(api.forms.withdraw, { versionId, reason: "x" })
    ).rejects.toThrow("already withdrawn")
  })

  it("withdraws a retired version directly", async () => {
    const t = convexTest(schema, modules)
    const { dev, versionId } = await published(t)
    await dev.mutation(api.forms.retire, { versionId })
    await dev.mutation(api.forms.withdraw, {
      versionId,
      reason: "Urgent takedown.",
    })
    const gate = await dev.query(api.forms.versionGate, { versionId })
    expect(gate.status).toBe("withdrawn")
    expect(gate.submissions).toBe(false)
  })

  it("denies anonymous versionGate reads", async () => {
    const t = convexTest(schema, modules)
    const { versionId } = await published(t)
    await expect(t.query(api.forms.versionGate, { versionId })).rejects.toThrow(
      "Not authenticated"
    )
  })
})

describe("catalog", () => {
  it("lists active latest versions and hides retired ones", async () => {
    const t = convexTest(schema, modules)
    expect(await t.query(api.forms.listPublished, {})).toEqual([])
    const { dev, versionId } = await (async () => {
      const dev = await devAdmin(t)
      await dev.mutation(api.forms.saveWorkingCopy, workingCopy)
      const versionId = await dev.mutation(api.forms.publish, {
        slug: "test-form",
      })
      return { dev, versionId }
    })()
    expect(await t.query(api.forms.listPublished, {})).toHaveLength(1)
    await dev.mutation(api.forms.retire, { versionId })
    expect(await t.query(api.forms.listPublished, {})).toEqual([])
    // Routine replacement: publishing again brings the form back.
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy)
    await dev.mutation(api.forms.publish, { slug: "test-form" })
    expect(await t.query(api.forms.listPublished, {})).toHaveLength(1)
  })

  it("serves the latest version detail by slug", async () => {
    const t = convexTest(schema, modules)
    expect(
      await t.query(api.forms.getLatestVersion, { slug: "nope" })
    ).toBeNull()
    const dev = await devAdmin(t)
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy)
    const v1 = await dev.mutation(api.forms.publish, { slug: "test-form" })
    const detail = await t.query(api.forms.getLatestVersion, {
      slug: "test-form",
    })
    expect(detail?.versionId).toEqual(v1)
    expect(detail?.version).toBe(1)
    expect(detail?.status).toBe("active")
    expect(detail?.definition.sections).toHaveLength(1)
    expect(detail?.form.slug).toBe("test-form")
  })
})

describe("seedSync", () => {
  it("converges code-managed pilots without rewriting history", async () => {
    const t = convexTest(schema, modules)
    // Fresh database: sync seeds and publishes v1 like seedPilots.
    const first = await t.mutation(internal.seed.seedSync, {})
    expect(first).toHaveLength(4)
    expect(first.every((r: { version: number }) => r.version === 1)).toBe(true)
    // No drift: second run publishes nothing.
    expect(await t.mutation(internal.seed.seedSync, {})).toEqual([])
    // A builder-published v2 with custom content: sync preserves it and
    // publishes v3 converging back to the code-managed seed.
    const dev = await devAdmin(t)
    await dev.mutation(api.forms.saveWorkingCopy, {
      slug: "certificate-of-character",
      name: "Certificate of Character",
      agency: "TTPS",
      sourceLabel: "Portal",
      sourceUrl: "https://example.com/coc",
      definition: {
        sections: [
          {
            id: "s1",
            title: "Changed",
            fields: [{ id: "a", kind: "short_text", label: "A" }],
          },
        ],
      } satisfies FormDefinition,
    })
    const v2 = await dev.mutation(api.forms.publish, {
      slug: "certificate-of-character",
    })
    const synced = await t.mutation(internal.seed.seedSync, {})
    expect(synced.map((r: { slug: string }) => r.slug)).toEqual([
      "certificate-of-character",
    ])
    expect(synced[0]?.version).toBe(3)
    const kept = await t.query(api.forms.getVersion, { versionId: v2 })
    expect(kept?.definition.sections[0]?.id).toBe("s1")
    const latest = await t.query(api.forms.getLatestVersion, {
      slug: "certificate-of-character",
    })
    expect(latest?.version).toBe(3)
    expect(await t.mutation(internal.seed.seedSync, {})).toEqual([])
  })
})

describe("seedPilots", () => {
  it("publishes the four 1:1 pilots and skips on re-run", async () => {
    const t = convexTest(schema, modules)
    const first = await t.mutation(internal.seed.seedPilots, {})
    expect(first.map((r: { slug: string }) => r.slug).sort()).toEqual([
      "adult-passport-renewal",
      "certificate-of-character",
      "computerized-birth-certificate",
      "nis-ni4",
    ])
    expect(await t.query(api.forms.listPublished, {})).toHaveLength(4)
    const second = await t.mutation(internal.seed.seedPilots, {})
    expect(second).toEqual([])
    expect(await t.query(api.forms.listPublished, {})).toHaveLength(4)
  })
})
