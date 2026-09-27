import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { TestConvex } from "convex-test";
import type { MutationCtx as MutationContext } from "./_generated/server";
import type { FormDefinition } from "./formModel";

// Function-boundary tests for #35: publish checks, version immutability and pinning, retire versus withdraw, and server-side demo-admin denials.

const compareText = (left: unknown, right: unknown): number =>
  String(left).localeCompare(String(right));

const modules = import.meta.glob("./**/*.ts");

const ensureId = <T extends string>(id: T): T => {
  if (id === "") {
    throw new Error("User id is empty.");
  }
  return id;
};

const workingCopy = {
  agency: "Test Agency",
  definition: {
    sections: [
      {
        fields: [
          { id: "name", kind: "short_text", label: "Name", required: true },
        ],
        id: "s1",
        title: "First",
      },
    ],
  } satisfies FormDefinition,
  name: "Test Form",
  slug: "test-form",
  sourceLabel: "Official source",
  sourceUrl: "https://example.com/form",
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

const demoAdmin = async (t: TestConvex<typeof schema>) => {
  const userId = await t.run(async (context: MutationContext) => {
    const id = await context.db.insert("users", {
      email: "demo@example.com",
      role: "demo-admin",
    });
    return ensureId(id);
  });
  return t.withIdentity({ subject: userId });
};

describe("publish", () => {
  it("denies anonymous and demo-admin publishers", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.forms.publish, { slug: "x" })).rejects.toThrow(
      "Not authenticated"
    );

    const demo = await demoAdmin(t);

    await expect(
      demo.mutation(api.forms.publish, { slug: "x" })
    ).rejects.toThrow("Developer-admin only");
  });

  it("blocks publish on failed checks and incomplete sources", async () => {
    const t = convexTest(schema, modules);
    const development = await developmentAdmin(t);
    await development.mutation(api.forms.saveWorkingCopy, {
      ...workingCopy,
      definition: {
        sections: [
          {
            fields: [
              { id: "c", kind: "single_choice", label: "", options: ["A"] },
            ],
            id: "s",
            title: "S",
          },
        ],
      },
      sourceUrl: "",
    });

    await expect(
      development.mutation(api.forms.publish, { slug: "test-form" })
    ).rejects.toThrow(
      /source information|needs a label|two non-empty options/u
    );
  });

  it("snapshots v1 and keeps it frozen while the copy evolves", async () => {
    const t = convexTest(schema, modules);
    const development = await developmentAdmin(t);
    await development.mutation(api.forms.saveWorkingCopy, workingCopy);
    const v1 = await development.mutation(api.forms.publish, {
      slug: "test-form",
    });
    const first = await t.query(api.forms.getVersion, { versionId: v1 });

    expect(first?.version).toBe(1);
    expect(first?.status).toBe("active");

    // Evolve the copy and publish v2: v1 must read back unchanged (pinning).
    await development.mutation(api.forms.saveWorkingCopy, {
      ...workingCopy,
      definition: {
        sections: [
          {
            fields: [
              { id: "name", kind: "short_text", label: "Name", required: true },
              { id: "extra", kind: "short_text", label: "Extra" },
            ],
            id: "s1",
            title: "First (revised)",
          },
        ],
      },
    });
    const v2 = await development.mutation(api.forms.publish, {
      slug: "test-form",
    });
    const reread = await t.query(api.forms.getVersion, { versionId: v1 });

    expect(reread?.definition).toStrictEqual(first?.definition);

    const second = await t.query(api.forms.getVersion, { versionId: v2 });

    expect(second?.version).toBe(2);
    expect(second?.definition.sections[0]?.fields).toHaveLength(2);
  });
});

const published = async (t: TestConvex<typeof schema>) => {
  const development = await developmentAdmin(t);
  await development.mutation(api.forms.saveWorkingCopy, workingCopy);
  const versionId = await development.mutation(api.forms.publish, {
    slug: "test-form",
  });
  return { dev: development, versionId };
};

describe("retire versus withdraw", () => {
  it("retires without a reason and keeps submissions open", async () => {
    const t = convexTest(schema, modules);
    const { dev, versionId } = await published(t);
    await dev.mutation(api.forms.retire, { versionId });
    const gate = await dev.query(api.forms.versionGate, { versionId });

    expect(gate.status).toBe("retired");
    expect(gate.newDrafts).toBeFalsy();
    expect(gate.submissions).toBeTruthy();
  });

  it("withdraws only with a reason and blocks submissions", async () => {
    const t = convexTest(schema, modules);
    const { dev, versionId } = await published(t);

    await expect(
      dev.mutation(api.forms.withdraw, { reason: "  ", versionId })
    ).rejects.toThrow("readable explanation");

    await dev.mutation(api.forms.withdraw, {
      reason: "Error on the paper form.",
      versionId,
    });
    const gate = await dev.query(api.forms.versionGate, { versionId });

    expect(gate.status).toBe("withdrawn");
    expect(gate.withdrawReason).toBe("Error on the paper form.");
    expect(gate.newDrafts).toBeFalsy();
    expect(gate.submissions).toBeFalsy();
  });

  it("guards transitions and denies demo-admin", async () => {
    const t = convexTest(schema, modules);
    const { dev, versionId } = await published(t);
    const demo = await demoAdmin(t);

    await expect(
      demo.mutation(api.forms.retire, { versionId })
    ).rejects.toThrow("Developer-admin only");
    await expect(
      demo.mutation(api.forms.withdraw, { reason: "x", versionId })
    ).rejects.toThrow("Developer-admin only");

    await dev.mutation(api.forms.retire, { versionId });

    await expect(dev.mutation(api.forms.retire, { versionId })).rejects.toThrow(
      "Only active versions retire"
    );

    // A retired version can still be emergency-withdrawn; withdrawing twice
    // throws.
    await dev.mutation(api.forms.withdraw, { reason: "x", versionId });

    await expect(
      dev.mutation(api.forms.withdraw, { reason: "x", versionId })
    ).rejects.toThrow("already withdrawn");
  });

  it("withdraws a retired version directly", async () => {
    const t = convexTest(schema, modules);
    const { dev, versionId } = await published(t);
    await dev.mutation(api.forms.retire, { versionId });
    await dev.mutation(api.forms.withdraw, {
      reason: "Urgent takedown.",
      versionId,
    });
    const gate = await dev.query(api.forms.versionGate, { versionId });

    expect(gate.status).toBe("withdrawn");
    expect(gate.submissions).toBeFalsy();
  });

  it("denies anonymous versionGate reads", async () => {
    const t = convexTest(schema, modules);
    const { versionId } = await published(t);

    await expect(t.query(api.forms.versionGate, { versionId })).rejects.toThrow(
      "Not authenticated"
    );
  });
});

describe("catalog", () => {
  it("lists active latest versions and hides retired ones", async () => {
    const t = convexTest(schema, modules);

    await expect(t.query(api.forms.listPublished, {})).resolves.toStrictEqual(
      []
    );

    const { dev, versionId } = await (async () => {
      const development = await developmentAdmin(t);
      await development.mutation(api.forms.saveWorkingCopy, workingCopy);
      const publishedVersionId = await development.mutation(api.forms.publish, {
        slug: "test-form",
      });
      return { dev: development, versionId: publishedVersionId };
    })();

    await expect(t.query(api.forms.listPublished, {})).resolves.toHaveLength(1);

    await dev.mutation(api.forms.retire, { versionId });

    await expect(t.query(api.forms.listPublished, {})).resolves.toStrictEqual(
      []
    );

    // Routine replacement: publishing again brings the form back.
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy);
    await dev.mutation(api.forms.publish, { slug: "test-form" });

    await expect(t.query(api.forms.listPublished, {})).resolves.toHaveLength(1);
  });

  it("serves the latest version detail by slug", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.forms.getLatestVersion, { slug: "nope" })
    ).resolves.toBeNull();

    const development = await developmentAdmin(t);
    await development.mutation(api.forms.saveWorkingCopy, workingCopy);
    const v1 = await development.mutation(api.forms.publish, {
      slug: "test-form",
    });
    const detail = await t.query(api.forms.getLatestVersion, {
      slug: "test-form",
    });

    expect(detail).toMatchObject({
      form: { slug: "test-form" },
      status: "active",
      version: 1,
      versionId: v1,
    });
    expect(detail?.definition.sections).toHaveLength(1);
  });
});

describe("seedSync", () => {
  it("converges code-managed pilots without rewriting history", async () => {
    const t = convexTest(schema, modules);
    // Fresh database: sync seeds and publishes v1 like seedPilots.
    const first = await t.mutation(internal.seed.seedSync, {});

    expect({
      allV1: first.every((r: { version: number }) => r.version === 1),
      count: first.length,
    }).toStrictEqual({ allV1: true, count: 4 });
    // No drift: second run publishes nothing.
    await expect(t.mutation(internal.seed.seedSync, {})).resolves.toStrictEqual(
      []
    );

    // A builder-published v2 with custom content: sync preserves it and
    // publishes v3 converging back to the code-managed seed.
    const development = await developmentAdmin(t);
    await development.mutation(api.forms.saveWorkingCopy, {
      agency: "TTPS",
      definition: {
        sections: [
          {
            fields: [{ id: "a", kind: "short_text", label: "A" }],
            id: "s1",
            title: "Changed",
          },
        ],
      } satisfies FormDefinition,
      name: "Certificate of Character",
      slug: "certificate-of-character",
      sourceLabel: "Portal",
      sourceUrl: "https://example.com/coc",
    });
    const v2 = await development.mutation(api.forms.publish, {
      slug: "certificate-of-character",
    });
    const synced = await t.mutation(internal.seed.seedSync, {});

    expect({
      slugs: synced.map((r: { slug: string }) => r.slug),
      version: synced[0]?.version,
    }).toStrictEqual({
      slugs: ["certificate-of-character"],
      version: 3,
    });

    const kept = await t.query(api.forms.getVersion, { versionId: v2 });

    expect(kept?.definition.sections[0]?.id).toBe("s1");

    const latest = await t.query(api.forms.getLatestVersion, {
      slug: "certificate-of-character",
    });
    const finalSync = await t.mutation(internal.seed.seedSync, {});

    expect({ finalSync, latestVersion: latest?.version }).toStrictEqual({
      finalSync: [],
      latestVersion: 3,
    });
  });
});

describe("seedPilots", () => {
  it("publishes the four 1:1 pilots and skips on re-run", async () => {
    const t = convexTest(schema, modules);
    const first = await t.mutation(internal.seed.seedPilots, {});

    expect(
      first.map((row: { slug: string }) => row.slug).toSorted(compareText)
    ).toStrictEqual([
      "adult-passport-renewal",
      "certificate-of-character",
      "computerized-birth-certificate",
      "nis-ni4",
    ]);
    await expect(t.query(api.forms.listPublished, {})).resolves.toHaveLength(4);

    const second = await t.mutation(internal.seed.seedPilots, {});

    expect(second).toStrictEqual([]);
    await expect(t.query(api.forms.listPublished, {})).resolves.toHaveLength(4);
  });
});
