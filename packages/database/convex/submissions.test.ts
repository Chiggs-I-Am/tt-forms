import { convexTest } from "convex-test";
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { mapSequentially } from "./sequential";
import type { TestConvex } from "convex-test";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx as MutationContext } from "./_generated/server";
import type { FormDefinition } from "./formModel";

// Function-boundary tests for #37: server-confirmed submit with validation, hidden-answer exclusion, retire versus withdraw, double-submit rejection, post-submit fresh drafts, ownership isolation, and read-only submissions.

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

const ensureId = <T extends string>(id: T): T => {
  if (id === "") {
    throw new Error("User id is empty.");
  }
  return id;
};

const definition = (): FormDefinition => {
  const sections = [
    {
      fields: [
        { id: "name", kind: "short_text", label: "Name", required: true },
        {
          id: "contact",
          kind: "single_choice",
          label: "Contact",
          options: ["Email", "Phone"],
        },
        {
          condition: {
            mode: "any",
            rules: [{ fieldId: "contact", values: ["Phone"] }],
          },
          id: "phone",
          kind: "phone",
          label: "Phone",
        },
      ],
      id: "s1",
      title: "First",
    },
    {
      fields: [
        { id: "who", kind: "short_text", label: "Ref name", required: true },
      ],
      id: "refs",
      repeat: { max: 2, min: 1 },
      repeatFields: ["who"],
      title: "Refs",
    },
  ] satisfies FormDefinition["sections"];
  return { sections };
};

const user = async (
  t: TestConvex<typeof schema>,
  email: string,
  role?: "applicant" | "developer-admin" | "demo-admin"
) => {
  const userId = await t.run(async (context: MutationContext) => {
    const id = await context.db.insert("users", {
      email,
      ...(role && { role }),
    });
    return ensureId(id);
  });
  return { authed: t.withIdentity({ subject: userId }), userId };
};

const developmentAdmin = async (t: TestConvex<typeof schema>) =>
  await user(t, "dev@example.com", "developer-admin");

const publishedForm = async (
  t: TestConvex<typeof schema>,
  slug: string,
  name: string
) => {
  const development = await developmentAdmin(t);
  await development.authed.mutation(api.forms.saveWorkingCopy, {
    agency: "Test Agency",
    definition: definition(),
    name,
    slug,
    sourceLabel: "Official source",
    sourceUrl: "https://example.com/form",
  });
  const versionId = await development.authed.mutation(api.forms.publish, {
    slug,
  });
  const form = await t.run(async (context: MutationContext) => {
    const result = await context.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", slug))
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

const goodAnswers = {
  contact: "Email",
  name: "Anya",
  refs: [{ who: "Ravi" }],
};

describe("submitDraft validation", () => {
  it("rejects invalid answers listing errors, then succeeds when fixed", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId } = await publishedForm(t, "test-form", "Test Form");
    const a = await user(t, "a@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: { contact: "Email", refs: [{ who: "Ravi" }] },
      formId,
    });

    await expect(
      a.authed.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow(/name.*required/iu);

    await a.authed.mutation(api.drafts.saveDraft, {
      answers: goodAnswers,
      formId,
    });
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    );

    expect(submissionId).toBeDefined();

    const detail = await a.authed.query(api.submissions.getSubmission, {
      submissionId,
    });

    expect(detail.answers).toStrictEqual(goodAnswers);
    expect(detail.labels).toMatchObject({
      contact: "Contact",
      name: "Name",
      who: "Ref name",
    });
    expect(detail.definition.sections).toHaveLength(2);
  });

  it("excludes hidden answers from the snapshot but keeps them in the draft", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId } = await publishedForm(t, "test-form", "Test Form");
    const a = await user(t, "a@example.com");
    // "not-a-phone" would fail validation while visible; hidden it is skipped.
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: { ...goodAnswers, phone: "not-a-phone" },
      formId,
    });
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    );
    const detail = await a.authed.query(api.submissions.getSubmission, {
      submissionId,
    });

    expect(detail.answers).not.toHaveProperty("phone");
    expect(detail.labels).not.toHaveProperty("phone");

    const draft = await t.run(async (context: MutationContext) => {
      const result = await context.db
        .query("drafts")
        .withIndex("owner_form", (q) =>
          q.eq("ownerId", a.userId).eq("formId", formId)
        )
        .first();
      if (result === null) {
        return null;
      }
      return result;
    });

    expect(draft?.answers).toHaveProperty("phone", "not-a-phone");
  });
});

describe("retire versus withdraw", () => {
  it("blocks withdrawn versions with the reason", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { dev, formId, versionId } = await publishedForm(
      t,
      "test-form",
      "Test Form"
    );
    const a = await user(t, "a@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: goodAnswers,
      formId,
    });
    await dev.authed.mutation(api.forms.withdraw, {
      reason: "Urgent takedown for review.",
      versionId,
    });

    await expect(
      a.authed.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow(/withdrawn.*Urgent takedown for review/su);

    // Answers stay readable to the owner.
    const draft = await a.authed.query(api.drafts.getDraft, { formId });

    expect(draft?.answers).toStrictEqual(goodAnswers);
  });

  it("lets retired versions submit", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { dev, formId, versionId } = await publishedForm(
      t,
      "test-form",
      "Test Form"
    );
    const a = await user(t, "a@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: goodAnswers,
      formId,
    });
    await dev.authed.mutation(api.forms.retire, { versionId });
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    );

    expect(submissionId).toBeDefined();
  });
});

describe("submit lifecycle", () => {
  it("rejects double-submit but allows a fresh post-submit draft", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId } = await publishedForm(t, "test-form", "Test Form");
    const a = await user(t, "a@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: goodAnswers,
      formId,
    });
    await a.authed.mutation(api.submissions.submitDraft, { formId });

    await expect(
      a.authed.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow("already submitted");

    const fresh = await a.authed.mutation(api.drafts.saveDraft, {
      answers: { ...goodAnswers, name: "Anya Two" },
      formId,
    });

    expect(fresh).toBeDefined();

    const draft = await a.authed.query(api.drafts.getDraft, { formId });

    expect(draft?.answers).toMatchObject({ name: "Anya Two" });
  });

  it("lists the owner's submissions newest-first", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const first = await publishedForm(t, "form-one", "Form One");
    const second = await publishedForm(t, "form-two", "Form Two");
    const a = await user(t, "a@example.com");
    const ids: Id<"submissions">[] = [];
    await mapSequentially([first, second], async ({ formId }) => {
      await a.authed.mutation(api.drafts.saveDraft, {
        answers: goodAnswers,
        formId,
      });
      const { submissionId } = await a.authed.mutation(
        api.submissions.submitDraft,
        { formId }
      );
      ids.push(submissionId);
    });
    // Same-millisecond submits share a timestamp, so pin an older time on
    // the first submission to prove the list sorts newest-first.
    await t.run(async (context: MutationContext) => {
      const [firstId] = ids;
      if (!firstId) {
        throw new Error("First submission id is missing.");
      }
      await context.db.patch(firstId, {
        submittedAt: Date.now() - Number("1000"),
      });
    });
    const list = await a.authed.query(api.submissions.mySubmissions, {});

    expect(list).toHaveLength(2);

    const [newest, oldest] = list;
    if (!newest || !oldest) {
      throw new Error("Submission list rows are missing.");
    }

    expect(newest.formName).toBe("Form Two");
    expect(oldest.formName).toBe("Form One");
    expect(newest).toMatchObject({ version: 1, versionStatus: "active" });
  });
});

describe("ownership and read-only", () => {
  it("denies anonymous callers on every path", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { formId } = await publishedForm(t, "test-form", "Test Form");
    const a = await user(t, "a@example.com");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: goodAnswers,
      formId,
    });
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    );

    await expect(
      t.mutation(api.submissions.submitDraft, { formId })
    ).rejects.toThrow("Not authenticated");
    await expect(t.query(api.submissions.mySubmissions, {})).rejects.toThrow(
      "Not authenticated"
    );
    await expect(
      t.query(api.submissions.getSubmission, { submissionId })
    ).rejects.toThrow("Not authenticated");
  });

  it("isolates submissions per owner but lets developer-admin read", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const { dev, formId } = await publishedForm(t, "test-form", "Test Form");
    const a = await user(t, "a@example.com");
    const b = await user(t, "b@example.com");
    const demo = await user(t, "demo@example.com", "demo-admin");
    await a.authed.mutation(api.drafts.saveDraft, {
      answers: goodAnswers,
      formId,
    });
    const { submissionId } = await a.authed.mutation(
      api.submissions.submitDraft,
      { formId }
    );

    await expect(
      b.authed.query(api.submissions.mySubmissions, {})
    ).resolves.toStrictEqual([]);
    await expect(
      b.authed.query(api.submissions.getSubmission, { submissionId })
    ).rejects.toThrow("Only the applicant");
    await expect(
      demo.authed.query(api.submissions.getSubmission, { submissionId })
    ).rejects.toThrow("Only the applicant");

    const detail = await dev.authed.query(api.submissions.getSubmission, {
      submissionId,
    });

    expect(detail.answers).toStrictEqual(goodAnswers);
  });

  it("exposes no update or delete path", async () => {
    const t = convexTest(schema, modules);
    registerRateLimiter(t);
    const submissionModule = await loadModule("./submissions.ts");

    expect(Object.keys(submissionModule).toSorted(compareText)).toStrictEqual([
      "getSubmission",
      "mySubmissions",
      "submitDraft",
    ]);
  });
});
