import { internalMutation } from "./_generated/server";
import { validateDefinition } from "./formModel";
import { pilotSeeds } from "./pilotDefinitions";
import { mapSequentially } from "./sequential";
import type { PilotSeed } from "./pilotDefinitions";

// Same gate as publish: seed data must pass the publish checks.
const checkSeed = (seed: PilotSeed) => {
  const problems = validateDefinition(seed.definition);
  if (problems.length > 0) {
    throw new Error(
      `Seed "${seed.slug}" fails publish checks: ${problems.join(" ")}`
    );
  }
  if (!seed.sourceLabel || !seed.sourceUrl) {
    throw new Error(`Seed "${seed.slug}" has incomplete source information.`);
  }
};

// Canonical comparison: Convex normalizes object key order on write, so
// plain JSON.stringify of a stored snapshot never matches the source.
const compareEntries = (
  left: [string, unknown],
  right: [string, unknown]
): number => left[0].localeCompare(right[0]);

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value)
      .toSorted(compareEntries)
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(",")}}`;
  }
  const serialized = JSON.stringify(value);
  return typeof serialized === "string" ? serialized : "null";
};

// One-off seed for #35: writes each pilot working copy from the 1:1 definitions and publishes immutable v1. Idempotent per slug: forms already present are skipped, so re-running never duplicates or rewrites history.
// Run from the dashboard (or `npx convex run`) after the #34 admin seed;
// the applicant flow (#36) drafts against these versions.
export const seedPilots = internalMutation({
  args: {},
  handler: async (context) => {
    const published = await mapSequentially(pilotSeeds, async (seed) => {
      const existing = await context.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", seed.slug))
        .first();
      if (existing) {
        return [];
      }
      checkSeed(seed);
      const formId = await context.db.insert("forms", {
        agency: seed.agency,
        definition: seed.definition,
        name: seed.name,
        slug: seed.slug,
        sourceLabel: seed.sourceLabel,
        sourceUrl: seed.sourceUrl,
        updatedAt: Date.now(),
      });
      const versionId = await context.db.insert("formVersions", {
        createdAt: Date.now(),
        definition: seed.definition,
        formId,
        sourceLabel: seed.sourceLabel,
        sourceUrl: seed.sourceUrl,
        status: "active",
        version: 1,
      });
      return [{ formId, slug: seed.slug, version: 1, versionId }];
    });
    return published.flat();
  },
});

// Deploy sync for definition fixes (e.g. numbering corrections): upserts
// each working copy and publishes a new immutable version wherever the
// latest snapshot drifted from code. History is preserved, so in-flight
// drafts stay pinned to their version's rules. This is deploy maintenance
// for the code-managed pilot definitions only, run explicitly from the
// dashboard or CLI. It is not a publish path: custom builder content goes
// through the explicit publish mutation with its checks (#35), and sync
// converges the next version back to code.
export const seedSync = internalMutation({
  args: {},
  handler: async (context) => {
    const published = await mapSequentially(pilotSeeds, async (seed) => {
      checkSeed(seed);
      const existing = await context.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", seed.slug))
        .first();
      const formId =
        existing?._id ??
        (await context.db.insert("forms", {
          agency: seed.agency,
          definition: seed.definition,
          name: seed.name,
          slug: seed.slug,
          sourceLabel: seed.sourceLabel,
          sourceUrl: seed.sourceUrl,
          updatedAt: Date.now(),
        }));
      if (existing) {
        await context.db.patch(existing._id, {
          agency: seed.agency,
          definition: seed.definition,
          name: seed.name,
          sourceLabel: seed.sourceLabel,
          sourceUrl: seed.sourceUrl,
          updatedAt: Date.now(),
        });
      }
      const latest = await context.db
        .query("formVersions")
        .withIndex("form", (q) => q.eq("formId", formId))
        .order("desc")
        .first();
      if (
        latest &&
        stableStringify(latest.definition) === stableStringify(seed.definition)
      ) {
        return [];
      }
      const version = (latest?.version ?? 0) + 1;
      const versionId = await context.db.insert("formVersions", {
        createdAt: Date.now(),
        definition: seed.definition,
        formId,
        sourceLabel: seed.sourceLabel,
        sourceUrl: seed.sourceUrl,
        status: "active",
        version,
      });
      return [{ formId, slug: seed.slug, version, versionId }];
    });
    return published.flat();
  },
});
