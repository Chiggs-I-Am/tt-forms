import { internalMutation } from "./_generated/server"
import { validateDefinition } from "./formModel"
import { pilotSeeds } from "./pilotDefinitions"

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
      // Same gate as publish: seed data must pass the publish checks.
      const problems = validateDefinition(seed.definition)
      if (problems.length > 0) {
        throw new Error(
          `Seed "${seed.slug}" fails publish checks: ${problems.join(" ")}`
        )
      }
      if (!seed.sourceLabel || !seed.sourceUrl) {
        throw new Error(
          `Seed "${seed.slug}" has incomplete source information.`
        )
      }
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
