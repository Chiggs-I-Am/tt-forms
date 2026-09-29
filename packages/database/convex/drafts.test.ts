import { convexTest } from "convex-test";
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { TestConvex } from "convex-test";
import type { MutationCtx as MutationContext } from "./_generated/server";
import type { FormDefinition } from "./formModel";

// Function-boundary tests for #36: ownership isolation, one-active-draft
// reuse with version pinning, optimistic-concurrency no-silent-overwrite,
// replaceDraft confirm plus retire, expiry filtering plus purge (drafts and
// files), and submitted drafts not blocking new saves.

const modules = import.meta.glob("./**/*.ts");

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

const applicant = async (t: TestConvex<typeof schema>, email: string) => {
  const userId = await t.run(
    async (context: MutationContext) =>
      await context.db.insert("users", { email })
  );
  return { authed: t.withIdentity({ subject: userId }), userId };
};

const publishedForm = async (t: TestConvex<typeof schema>) => {
  const development = await developmentAdmin(t);
  await development.mutation(api.forms.saveWorkingCopy, workingCopy);
  const versionId = await development.mutation(api.forms.publish, {
    slug: "test-form",
  });
  const form = await t.run(async (context: MutationContext) => {
    const result = await context.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", "test-form"))
      .first();
    if (result === null) {
      return null;
    }
    return result;
  });
  if (!form) {
    throw new Error("Published form is missing.");
  }
  return { dev: development, formId: form._id, versionId };
};

describe("draft ownership", () => {
  it("denies anonymous reads and writes", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId, versionId } = await publishedForm(t);

    await expect(t.query(api.drafts.getDraft, { formId })).rejects.toThrow(
      "Not authenticated"
    );
    await expect(
      t.mutation(api.drafts.saveDraft, { answers: {}, formId })
    ).rejects.toThrow("Not authenticated");
    await expect(
      t.mutation(api.drafts.replaceDraft, {
        answers: {},
        confirm: true,
        formId,
        retireVersionId: versionId,
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("isolates drafts per owner", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId } = await publishedForm(t);
    const a = await applicant(t, "a@example.com");
    const b = await applicant(t, "b@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Anya" },
      formId,
    });

    await expect(
      b.authed.query(api.drafts.getDraft, { formId })
    ).resolves.toBeNull();

    await b.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Brian" },
      formId,
    });
    const again = await a.authed.query(api.drafts.getDraft, { formId });

    expect(again?.answers).toStrictEqual({ name: "Anya" });

    const other = await b.authed.query(api.drafts.getDraft, { formId });

    expect(other?.answers).toStrictEqual({ name: "Brian" });
  });
});

describe("one active draft", () => {
  it("reuses the draft and keeps the pinned version", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { dev, formId, versionId } = await publishedForm(t);
    const a = await applicant(t, "a@example.com");
    const first = await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "One" },
      formId,
    });
    const second = await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Two" },
      formId,
    });

    expect(second).toStrictEqual(first);

    const draft = await a.authed.query(api.drafts.getDraft, { formId });

    expect(draft).toMatchObject({
      answers: { name: "Two" },
      formVersionId: versionId,
      version: { status: "active", version: 1 },
    });

    // Publish v2: the existing draft stays pinned to v1.
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy);
    await dev.mutation(api.forms.publish, { slug: "test-form" });
    const third = await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Three" },
      formId,
    });

    expect(third).toStrictEqual(first);

    const still = await a.authed.query(api.drafts.getDraft, { formId });

    expect(still).toMatchObject({
      formVersionId: versionId,
      version: { version: 1 },
    });
  });

  it("blocks new drafts when the latest version is not active", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { dev, formId, versionId } = await publishedForm(t);
    await dev.mutation(api.forms.retire, { versionId });
    const a = await applicant(t, "a@example.com");

    await expect(
      a.authed.mutation(api.drafts.saveDraft, {
        answers: { name: "Late" },
        formId,
      })
    ).rejects.toThrow(/blocked/u);
  });
});

describe("optimistic concurrency", () => {
  it("rejects stale bases instead of silently overwriting", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId } = await publishedForm(t);
    const a = await applicant(t, "a@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "One" },
      formId,
    });
    const loaded = await a.authed.query(api.drafts.getDraft, { formId });
    if (!loaded) {
      throw new Error("Loaded draft is missing.");
    }
    // Simulate a concurrent edit landing first: bump the stored timestamp
    // directly so the stale base below must be rejected. (Date.now() can
    // repeat within one test tick, so two plain saves may share updatedAt.)
    await t.run(async (context) => {
      const rows = await context.db
        .query("drafts")
        .withIndex("owner_form", (q) =>
          q.eq("ownerId", a.userId).eq("formId", formId)
        )
        .collect();
      const [row] = rows;
      if (!row) {
        throw new Error("Draft row is missing.");
      }
      await context.db.patch(row._id, {
        answers: { name: "Two" },
        updatedAt: loaded.updatedAt + 1000,
      });
    });

    await expect(
      a.authed.mutation(api.drafts.saveDraft, {
        answers: { name: "Stale" },
        baseUpdatedAt: loaded.updatedAt,
        formId,
      })
    ).rejects.toThrow("Draft changed elsewhere");

    const kept = await a.authed.query(api.drafts.getDraft, { formId });

    expect(kept?.answers).toStrictEqual({ name: "Two" });
  });
});

describe("replaceDraft", () => {
  it("requires confirm and retires the old pinned draft", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { dev, formId, versionId } = await publishedForm(t);
    const a = await applicant(t, "a@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Old" },
      formId,
    });
    await dev.mutation(api.forms.saveWorkingCopy, workingCopy);
    const v2 = await dev.mutation(api.forms.publish, { slug: "test-form" });

    await expect(
      a.authed.mutation(api.drafts.replaceDraft, {
        answers: { name: "Mine" },
        confirm: false,
        formId,
        retireVersionId: versionId,
      })
    ).rejects.toThrow("explicit confirmation");

    const fresh = await a.authed.mutation(api.drafts.replaceDraft, {
      answers: { name: "Mine" },
      confirm: true,
      formId,
      retireVersionId: versionId,
    });

    expect(fresh).toBeDefined();

    const current = await a.authed.query(api.drafts.getDraft, { formId });

    expect(current?.formVersionId).toStrictEqual(v2);
    expect(current?.answers).toStrictEqual({ name: "Mine" });

    const oldRow = await t.run(async (context: MutationContext) => {
      const rows = await context.db
        .query("drafts")
        .withIndex("owner_form", (q) =>
          q.eq("ownerId", a.userId).eq("formId", formId)
        )
        .collect();
      return rows.find((d) => d.formVersionId === versionId);
    });

    expect(oldRow?.status).toBe("retired");
  });

  it("keeps the old draft when the latest version no longer accepts drafts", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { dev, formId, versionId } = await publishedForm(t);
    const a = await applicant(t, "a@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Old" },
      formId,
    });
    const latest = await t.run(async (context: MutationContext) => {
      const result = await context.db
        .query("formVersions")
        .withIndex("form", (q) => q.eq("formId", formId))
        .order("desc")
        .first();
      if (result === null) {
        return null;
      }
      return result;
    });
    if (!latest) {
      throw new Error("Latest form version is missing.");
    }
    await dev.mutation(api.forms.retire, { versionId: latest._id });

    await expect(
      a.authed.mutation(api.drafts.replaceDraft, {
        answers: { name: "Mine" },
        confirm: true,
        formId,
        retireVersionId: versionId,
      })
    ).rejects.toThrow("New drafts are blocked");

    const kept = await a.authed.query(api.drafts.getDraft, { formId });

    expect(kept?.formVersionId).toStrictEqual(versionId);
    expect(kept?.answers).toStrictEqual({ name: "Old" });
  });

  it("refuses to retire another owner's draft", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId, versionId } = await publishedForm(t);
    const a = await applicant(t, "a@example.com");
    const b = await applicant(t, "b@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Anya" },
      formId,
    });

    await expect(
      b.authed.mutation(api.drafts.replaceDraft, {
        answers: { name: "Brian" },
        confirm: true,
        formId,
        retireVersionId: versionId,
      })
    ).rejects.toThrow("not found");
  });
});

describe("expiry", () => {
  it("filters expired drafts and purges them with their files", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId } = await publishedForm(t);
    const a = await applicant(t, "a@example.com");
    const draftId = await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Old" },
      formId,
    });
    const blobId = await t.run(async (context) => {
      const storageId = await context.storage.store(new Blob(["fake"]));
      await context.db.insert("files", {
        contentType: "image/png",
        createdAt: Date.now(),
        draftId,
        fileName: "photo.png",
        ownerId: a.userId,
        size: 4,
        storageId,
      });
      return storageId;
    });
    await t.run(async (context: MutationContext) => {
      await context.db.patch(draftId, {
        expiresAt: Date.now() - Number("1000"),
      });
    });

    await expect(
      a.authed.query(api.drafts.getDraft, { formId })
    ).resolves.toBeNull();

    const removed = await t.mutation(internal.drafts.purgeExpired, {});

    expect(removed).toBe(1);

    const leftover = await t.run(async (context) => {
      const blob = await context.storage.get(blobId);
      const draft = await context.db.get(draftId);
      const files = await context.db.query("files").collect();
      return { blob, draft, files };
    });

    expect(leftover.draft).toBeNull();
    expect(leftover.files).toStrictEqual([]);
    expect(leftover.blob).toBeNull();
  });
});

describe("submitted drafts", () => {
  it("lets a new save start after submission", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId } = await publishedForm(t);
    const a = await applicant(t, "a@example.com");
    const draftId = await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Sent" },
      formId,
    });
    await t.run(async (context: MutationContext) => {
      await context.db.patch(draftId, { status: "submitted" });
    });

    await expect(
      a.authed.query(api.drafts.getDraft, { formId })
    ).resolves.toBeNull();

    const next = await a.authed.mutation(api.drafts.saveDraft, {
      answers: { name: "Again" },
      formId,
    });

    expect(next).not.toStrictEqual(draftId);

    const current = await a.authed.query(api.drafts.getDraft, { formId });

    expect(current?.answers).toStrictEqual({ name: "Again" });
    expect(current?.status).toBe("active");
  });
});
