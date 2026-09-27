import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import { validateAnswers } from "./formModel";
import { pilotSeeds } from "./pilotDefinitions";
import schema from "./schema";
import { mapSequentially } from "./sequential";
import type { Id } from "./_generated/dataModel";
import type { TestConvex } from "convex-test";
import type { MutationCtx as MutationContext } from "./_generated/server";

// Boundary tests for admin views (#39): view-only applicant and submission
// lists denied to demo-admin and anonymous callers, plus seeded examples that
// stay valid against their pinned versions. Detail reuses
// submissions.getSubmission, so demo-admin denial there is asserted once here
// against a real seeded row.
const compareText = (left: unknown, right: unknown): number =>
  String(left).localeCompare(String(right));

const modules = import.meta.glob("./**/*.ts");

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

const user = async (
  t: TestConvex<typeof schema>,
  email: string,
  role?: Role
) => {
  const userId: Id<"users"> = await t.run(async (context: MutationContext) => {
    const id = await context.db.insert("users", {
      email,
      emailVerificationTime: Date.now(),
      ...(role && { role }),
    });
    return ensureId(id);
  });
  return { authed: t.withIdentity({ subject: userId }), userId };
};

const publishPilots = async (t: TestConvex<typeof schema>) => {
  const development = await user(t, "dev@example.com", "developer-admin");
  await mapSequentially(pilotSeeds, async (seed) => {
    await development.authed.mutation(api.forms.saveWorkingCopy, {
      agency: seed.agency,
      definition: seed.definition,
      name: seed.name,
      slug: seed.slug,
      sourceLabel: seed.sourceLabel,
      sourceUrl: seed.sourceUrl,
    });
    await development.authed.mutation(api.forms.publish, { slug: seed.slug });
  });
  return development;
};

describe("listApplicants", () => {
  it("denies anonymous and demo-admin callers", async () => {
    const t = convexTest(schema, modules);
    const demo = await user(t, "demo@example.com", "demo-admin");

    await expect(t.query(api.admin.listApplicants, {})).rejects.toThrow(
      "Not authenticated"
    );
    await expect(
      demo.authed.query(api.admin.listApplicants, {})
    ).rejects.toThrow("Developer-admin only");
  });

  it("returns view-only rows with submission counts", async () => {
    const t = convexTest(schema, modules);
    const development = await publishPilots(t);
    const a = await user(t, "a@example.com");
    const form = await t.run(async (context: MutationContext) => {
      const result = await context.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", "certificate-of-character"))
        .first();
      if (result === null) {
        return null;
      }
      return result;
    });
    if (!form) {
      throw new Error("Certificate form is missing.");
    }
    const version = await t.run(async (context: MutationContext) => {
      const result = await context.db
        .query("formVersions")
        .withIndex("form", (q) => q.eq("formId", form._id))
        .order("desc")
        .first();
      if (result === null) {
        return null;
      }
      return result;
    });
    if (!version) {
      throw new Error("Certificate version is missing.");
    }
    await t.run(async (context: MutationContext) => {
      await context.db.insert("submissions", {
        answers: {},
        fileIds: [],
        formId: form._id,
        formVersionId: version._id,
        labels: {},
        ownerId: a.userId,
        submittedAt: Date.now(),
        version: 1,
      });
    });
    const rows = await development.authed.query(api.admin.listApplicants, {});
    const byEmail = new Map(rows.map((row) => [row.email, row]));

    expect(byEmail.get("a@example.com")).toMatchObject({
      role: "applicant",
      submissionCount: 1,
    });
    expect(byEmail.get("dev@example.com")).toMatchObject({
      role: "developer-admin",
      submissionCount: 0,
    });

    for (const row of rows) {
      expect(row.userId).toBeTypeOf("string");
    }
  });
});

describe("listSubmissions", () => {
  it("denies anonymous and demo-admin callers", async () => {
    const t = convexTest(schema, modules);
    await publishPilots(t);
    const demo = await user(t, "demo@example.com", "demo-admin");

    await expect(t.query(api.admin.listSubmissions, {})).rejects.toThrow(
      "Not authenticated"
    );
    await expect(
      demo.authed.query(api.admin.listSubmissions, {})
    ).rejects.toThrow("Developer-admin only");
  });

  it("lists newest-first with an optional form filter", async () => {
    const t = convexTest(schema, modules);
    const development = await publishPilots(t);
    const created = await t.mutation(internal.admin.seedExamples, {});

    expect(created).toHaveLength(8);

    const all = await development.authed.query(api.admin.listSubmissions, {});

    expect(all).toHaveLength(8);

    for (const [index, current] of all.slice(1).entries()) {
      const previous = all[index];
      if (!previous) {
        throw new Error("Submission ordering row is missing.");
      }

      expect(previous.submittedAt).toBeGreaterThanOrEqual(current.submittedAt);
    }

    expect(all[0]).toMatchObject({ version: 1 });
    expect(all[0]?.ownerEmail).toBeTypeOf("string");
  });

  it("filters submissions by form slug", async () => {
    const t = convexTest(schema, modules);
    const development = await publishPilots(t);
    await t.mutation(internal.admin.seedExamples, {});

    const filtered = await development.authed.query(api.admin.listSubmissions, {
      formSlug: "nis-ni4",
    });

    expect(filtered).toHaveLength(2);
    expect(filtered.every((row) => row.formSlug === "nis-ni4")).toBeTruthy();
    expect(filtered[0]?.formName).toContain("NIS");
    await expect(
      development.authed.query(api.admin.listSubmissions, { formSlug: "nope" })
    ).rejects.toThrow('No form found for "nope"');
  });

  it("denies demo-admin on the reused getSubmission detail", async () => {
    const t = convexTest(schema, modules);
    const development = await publishPilots(t);
    const demo = await user(t, "demo@example.com", "demo-admin");
    await t.mutation(internal.admin.seedExamples, {});
    const [first] = await development.authed.query(
      api.admin.listSubmissions,
      {}
    );
    if (!first) {
      throw new Error("Seeded submission is missing.");
    }

    await expect(
      demo.authed.query(api.submissions.getSubmission, {
        submissionId: first.submissionId,
      })
    ).rejects.toThrow("Only the applicant");

    const detail = await development.authed.query(
      api.submissions.getSubmission,
      {
        submissionId: first.submissionId,
      }
    );

    expect(detail.submissionId).toBe(first.submissionId);
  });
});

describe("seedExamples", () => {
  it("seeds two valid fileless submissions per pilot form and stays idempotent", async () => {
    const t = convexTest(schema, modules);
    await publishPilots(t);
    const first = await t.mutation(internal.admin.seedExamples, {});

    const slugs = first.map((row) => row.slug).toSorted(compareText);
    for (const seed of pilotSeeds) {
      expect(slugs.filter((slug) => slug === seed.slug)).toHaveLength(2);
    }
    const stored = await t.run(
      async (context: MutationContext) =>
        await context.db.query("submissions").collect()
    );

    await mapSequentially(stored, async (row) => {
      expect(row.fileIds).toStrictEqual([]);

      const version = await t.run(
        async (context: MutationContext) =>
          await context.db.get(row.formVersionId)
      );
      if (!version) {
        throw new Error("Seeded form version is missing.");
      }
      const { errors } = validateAnswers(version.definition, row.answers);

      expect({
        errors,
        hasLabels: Object.keys(row.labels).length > 0,
      }).toStrictEqual({ errors: [], hasLabels: true });

      const owner = await t.run(
        async (context: MutationContext) => await context.db.get(row.ownerId)
      );

      expect(owner?.email).toMatch(/^seeded-applicant-[12]@example\.com$/u);
    });
    const second = await t.mutation(internal.admin.seedExamples, {});
    const after = await t.run(
      async (context: MutationContext) =>
        await context.db.query("submissions").collect()
    );

    expect({ after: after.length, second }).toStrictEqual({
      after: 8,
      second: [],
    });
  });

  it("skips forms without an active version", async () => {
    const t = convexTest(schema, modules);
    const created = await t.mutation(internal.admin.seedExamples, {});

    expect(created).toStrictEqual([]);
  });
});

describe("admin module shape", () => {
  it("exports only view and seed paths; nothing patches applicants or submissions", async () => {
    const adminModule = await loadModule("./admin.ts");

    expect(Object.keys(adminModule).toSorted(compareText)).toStrictEqual([
      "listApplicants",
      "listSubmissions",
      "seedExamples",
    ]);
  });
});
