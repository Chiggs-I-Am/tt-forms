import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { pilotSeeds } from "./pilotDefinitions";
import type { MutationCtx as MutationContext } from "./_generated/server";

// Boundary suite for #40 (safeguards). Two pins in one place:
//
// 1. Sign-in-before-write denial across every rate-limited mutation. The
//    rate limiter itself is a live component (registered per-suite in
//    drafts/submissions/uploads/invites tests via the shipped
//    @convex-dev/rate-limiter/test helper); here the wiring is asserted
//    statically instead: each intended mutation exists, and anonymous
//    callers are denied before any limit or row is touched.
// 2. Guided-fake-input on the pilot seeds: every short_text field whose id
//    or label names an identity document carries an invent-a-number hint
//    (plus a placeholder example). No format validation, masking, or
//    blocking lives anywhere near these fields.
const modules = import.meta.glob("./**/*.ts");
const thirtyDaysMs = 2_592_000_000;

const ensureId = <T extends string>(id: T): T => {
  if (id === "") {
    throw new Error("Database id is empty.");
  }
  return id;
};

type PilotField =
  (typeof pilotSeeds)[number]["definition"]["sections"][number]["fields"][number];

const idLike = /id|passport|permit|certificate|NI/iu;
const numberLike = /\b(?:number|numbers|no|num)\b/iu;

const isMissingGuidedField = (field: PilotField): boolean => {
  if (field.kind !== "short_text") {
    return false;
  }
  const haystack = `${field.id} ${field.label}`;
  if (!idLike.test(haystack) || !numberLike.test(haystack)) {
    return false;
  }
  const hint = field.hint ?? "";
  return (
    !/invent/iu.test(hint) ||
    field.placeholder === undefined ||
    field.placeholder.length === 0
  );
};

const missingGuidedFields = (): string[] => {
  const missing: string[] = [];
  for (const seed of pilotSeeds) {
    for (const section of seed.definition.sections) {
      for (const field of section.fields) {
        if (isMissingGuidedField(field)) {
          missing.push(`${seed.slug}/${section.id}/${field.id}`);
        }
      }
    }
  }
  return missing;
};

const publishedFormIds = async (t: ReturnType<typeof convexTest>) => {
  const formId = await t.run(async (context: MutationContext) => {
    const id = await context.db.insert("forms", {
      agency: "Probe Agency",
      definition: { sections: [] },
      name: "Safeguard Probe",
      slug: "safeguard-probe",
      sourceLabel: "Probe source",
      sourceUrl: "https://example.com/probe",
      updatedAt: Date.now(),
    });
    return ensureId(id);
  });
  const versionId = await t.run(async (context: MutationContext) => {
    const id = await context.db.insert("formVersions", {
      createdAt: Date.now(),
      definition: { sections: [] },
      formId,
      sourceLabel: "Probe source",
      sourceUrl: "https://example.com/probe",
      status: "active",
      version: 1,
    });
    return ensureId(id);
  });
  const draftId = await t.run(async (context: MutationContext) => {
    const ownerId = await context.db.insert("users", {
      email: "probe-owner@example.com",
    });
    const createdDraftId = await context.db.insert("drafts", {
      answers: {},
      expiresAt: Date.now() + thirtyDaysMs,
      formId,
      formVersionId: versionId,
      ownerId,
      status: "active",
      updatedAt: Date.now(),
    });
    return ensureId(createdDraftId);
  });
  return { draftId, formId, versionId };
};

const storedBlobId = async (t: ReturnType<typeof convexTest>) => {
  const storageId = await t.run(
    async (context) =>
      await context.storage.store(new Blob(["stand-in"], { type: "image/png" }))
  );
  return ensureId(storageId);
};

describe("sign-in-before-write denial on guarded mutations", () => {
  it("denies anonymous callers on drafts and submissions", async () => {
    const t = convexTest(schema, modules);
    const { formId, versionId } = await publishedFormIds(t);

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
    await expect(
      t.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow("Not authenticated");
  });

  it("denies anonymous callers on uploads and invites", async () => {
    const t = convexTest(schema, modules);
    const { draftId } = await publishedFormIds(t);
    const storageId = await storedBlobId(t);

    await expect(
      t.mutation(api.uploads.generateUploadUrl, { draftId })
    ).rejects.toThrow("Not authenticated");
    await expect(
      t.mutation(api.uploads.saveFile, {
        draftId,
        fieldId: "photo_upload",
        fileName: "stand-in.png",
        storageId,
      })
    ).rejects.toThrow("Not authenticated");
    await expect(
      t.mutation(api.invites.createInvite, {
        email: "new-admin@example.com",
        role: "demo-admin",
      })
    ).rejects.toThrow("Not authenticated");
    await expect(t.mutation(api.invites.claimInvite, {})).rejects.toThrow(
      "Not authenticated"
    );
  });
});

describe("guided-fake-input on pilot seed ID fields", () => {
  it("carries an invent-a-number hint and placeholder on every ID-number field", () => {
    expect(missingGuidedFields()).toStrictEqual([]);
  });
});
