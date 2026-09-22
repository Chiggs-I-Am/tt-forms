import { internalMutation } from "./_generated/server"
import { validateDefinition } from "./formModel"
import { pilotSeeds, type PilotSeed } from "./pilotDefinitions"

// Same gate as publish: seed data must pass the publish checks.
function checkSeed(seed: PilotSeed) {
  const problems = validateDefinition(seed.definition)
  if (problems.length > 0) {
    throw new Error(
      `Seed "${seed.slug}" fails publish checks: ${problems.join(" ")}`
    )
  }
  if (!seed.sourceLabel || !seed.sourceUrl) {
    throw new Error(`Seed "${seed.slug}" has incomplete source information.`)
  }
}

// Canonical comparison: Convex normalizes object key order on write, so
// plain JSON.stringify of a stored snapshot never matches the source.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
    return `{${entries.join(",")}}`
  }
  return JSON.stringify(value) ?? "null"
}

// One-off seed for #35: writes each pilot working copy from the 1:1
// definitions and publishes immutable v1. Idempotent per slug: forms already
// present are skipped, so re-running never duplicates or rewrites history.
// Run from the dashboard (or `npx convex run`) after the #34 admin seed;
// the applicant flow (#36) drafts against these versions.
export const seedPilots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const published = []
    for (const seed of pilotSeeds) {
      const existing = await ctx.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", seed.slug))
        .first()
      if (existing) {
        continue
      }
      checkSeed(seed)
      const formId = await ctx.db.insert("forms", {
        slug: seed.slug,
        name: seed.name,
        agency: seed.agency,
        sourceLabel: seed.sourceLabel,
        sourceUrl: seed.sourceUrl,
        definition: seed.definition,
        updatedAt: Date.now(),
      })
      const versionId = await ctx.db.insert("formVersions", {
        formId,
        version: 1,
        status: "active",
        definition: seed.definition,
        sourceLabel: seed.sourceLabel,
        sourceUrl: seed.sourceUrl,
        createdAt: Date.now(),
      })
      published.push({ slug: seed.slug, formId, versionId, version: 1 })
    }
    return published
  },
})

// Deploy sync for definition fixes (e.g. numbering corrections): upserts
// each working copy and publishes a new immutable version wherever the
// latest snapshot drifted from code. History is preserved, so in-flight
// drafts stay pinned to their version's rules. Pilot definitions are
// code-managed: if a builder-published version holds custom content, sync
// preserves it and converges the next version back to code.
export const seedSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const published = []
    for (const seed of pilotSeeds) {
      checkSeed(seed)
      const existing = await ctx.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", seed.slug))
        .first()
      const formId =
        existing?._id ??
        (await ctx.db.insert("forms", {
          slug: seed.slug,
          name: seed.name,
          agency: seed.agency,
          sourceLabel: seed.sourceLabel,
          sourceUrl: seed.sourceUrl,
          definition: seed.definition,
          updatedAt: Date.now(),
        }))
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: seed.name,
          agency: seed.agency,
          sourceLabel: seed.sourceLabel,
          sourceUrl: seed.sourceUrl,
          definition: seed.definition,
          updatedAt: Date.now(),
        })
      }
      const latest = await ctx.db
        .query("formVersions")
        .withIndex("form", (q) => q.eq("formId", formId))
        .order("desc")
        .first()
      if (
        latest &&
        stableStringify(latest.definition) === stableStringify(seed.definition)
      ) {
        continue
      }
      const versionId = await ctx.db.insert("formVersions", {
        formId,
        version: (latest?.version ?? 0) + 1,
        status: "active",
        definition: seed.definition,
        sourceLabel: seed.sourceLabel,
        sourceUrl: seed.sourceUrl,
        createdAt: Date.now(),
      })
      published.push({
        slug: seed.slug,
        formId,
        versionId,
        version: (latest?.version ?? 0) + 1,
      })
    }
    return published
  },
})
