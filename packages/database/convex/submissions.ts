import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./authz";
import { rateLimiter } from "./rateLimits";
import { splitSection, validateAnswers } from "./formModel";
import { labelsFor } from "./labels";
import { mapSequentially } from "./sequential";
import type { DatabaseReader } from "./_generated/server";
import type { Answers } from "./formModel";
import type { DraftKey } from "./drafts";

// Applicant submission lifecycle for #37. `submitDraft` pins the draft's
// starting version and re-validates server-side. It then snapshots only
// visible answers with rendered labels and file refs. The final step marks
// the draft submitted. Submitted applications are read-only: this module
// exports no update or delete path. View-only administration is #39.

const firstMatching = <T>(rows: T[], isMatch: (row: T) => boolean): T[] => {
  for (const row of rows) {
    if (isMatch(row)) {
      return [row];
    }
  }
  return [];
};

const ownedDrafts = async (context: { db: DatabaseReader }, key: DraftKey) => {
  const rows = await context.db
    .query("drafts")
    .withIndex("owner_form", (q) =>
      q.eq("ownerId", key.ownerId).eq("formId", key.formId)
    )
    .collect();
  return rows.toSorted((a, b) => b.updatedAt - a.updatedAt);
};

type AnswerScalar = string | number | boolean | string[];
type AnswerRow = Record<string, AnswerScalar>;

const isAnswerRow = (value: unknown): value is AnswerRow =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type SectionDefinition = Parameters<typeof splitSection>[0];

const snapshotRepeatedSection = ({
  draftAnswers,
  out,
  seen,
  section,
}: {
  draftAnswers: Answers;
  out: Answers;
  seen: Set<string>;
  section: SectionDefinition;
}): void => {
  const { once, rows: rowFields } = splitSection(section);
  for (const field of once) {
    const value = draftAnswers[field.id];
    if (value !== undefined && seen.has(field.id)) {
      out[field.id] = value;
    }
  }
  const list = draftAnswers[section.id];
  if (!Array.isArray(list)) {
    return;
  }
  const kept: AnswerRow[] = list.map((row, index): AnswerRow => {
    if (!isAnswerRow(row)) {
      return {};
    }
    const cell: AnswerRow = {};
    for (const field of rowFields) {
      const value = row[field.id];
      if (
        value !== undefined &&
        seen.has(`${section.id}[${index}].${field.id}`)
      ) {
        cell[field.id] = value;
      }
    }
    return cell;
  });
  if (kept.some((row) => Object.keys(row).length > 0)) {
    out[section.id] = kept;
  }
};

// Snapshot keeps only visible answers. Hidden answers stay in the draft row
// but never reach the submission while hidden; the server decides from the
// pinned definition, never from browser state.
const visibleSnapshot = (
  definition: Parameters<typeof validateAnswers>[0],
  draftAnswers: Answers,
  visible: string[]
): Answers => {
  const seen = new Set(visible);
  const out: Answers = {};
  for (const section of definition.sections) {
    if (section.repeat) {
      snapshotRepeatedSection({ draftAnswers, out, section, seen });
      continue;
    }
    for (const field of section.fields) {
      const value = draftAnswers[field.id];
      if (value !== undefined && seen.has(field.id)) {
        out[field.id] = value;
      }
    }
  }
  return out;
};

// Submit the caller's active, unexpired draft for one form. Retired versions stay submittable until expiry; withdrawn versions block with their reason.
// Success returns only after the snapshot commits and the draft flips.
export const submitDraft = mutation({
  args: { formId: v.id("forms") },
  handler: async (context, requestArguments) => {
    const ownerId = await requireUserId(context);
    await rateLimiter.limit(context, "submit", { key: ownerId, throws: true });
    const now = Date.now();
    const rows = await ownedDrafts(context, {
      formId: requestArguments.formId,
      ownerId,
    });
    const draft = firstMatching(
      rows,
      (d) => d.status === "active" && d.expiresAt >= now
    ).at(0);
    if (!draft) {
      const submitted = firstMatching(rows, (d) => d.status === "submitted").at(
        0
      );
      if (submitted) {
        throw new ConvexError("This draft was already submitted.");
      }
      throw new ConvexError("No active draft to submit for this form.");
    }
    const version = await context.db.get(draft.formVersionId);
    if (!version) {
      throw new ConvexError("The pinned form version is missing.");
    }
    if (version.status === "withdrawn") {
      throw new ConvexError(
        `Submission blocked: this version was withdrawn. ${version.withdrawReason ?? "No reason was recorded."} Your answers stay readable until the draft expires.`
      );
    }
    const { errors, visible } = validateAnswers(
      version.definition,
      draft.answers
    );
    if (errors.length > 0) {
      const listed = errors
        .map((error) => `${error.path}: ${error.message}`)
        .join("; ");
      throw new ConvexError(
        `Submission blocked by ${errors.length === 1 ? "an invalid answer" : "invalid answers"}: ${listed}`
      );
    }
    const snapshot = visibleSnapshot(
      version.definition,
      draft.answers,
      visible
    );
    const files = await context.db
      .query("files")
      .withIndex("draft", (q) => q.eq("draftId", draft._id))
      .collect();
    // File rows stay linked to the draft; the submission records their ids.
    const submissionId = await context.db.insert("submissions", {
      answers: snapshot,
      fileIds: files.map((f) => f._id),
      formId: requestArguments.formId,
      formVersionId: draft.formVersionId,
      labels: labelsFor(version.definition, snapshot),
      ownerId,
      submittedAt: now,
      version: version.version,
    });
    await context.db.patch(draft._id, { status: "submitted" });
    return { submissionId };
  },
});

// Owner's submissions, newest first, with the form name, slug, version, and
// lifecycle status behind each row for list display.
export const mySubmissions = query({
  args: {},
  handler: async (context) => {
    const ownerId = await requireUserId(context);
    const rows = await context.db
      .query("submissions")
      .withIndex("owner", (q) => q.eq("ownerId", ownerId))
      .collect();
    const sortedRows = rows.toSorted((a, b) => b.submittedAt - a.submittedAt);
    return await mapSequentially(sortedRows, async (row) => {
      const form = await context.db.get(row.formId);
      const version = await context.db.get(row.formVersionId);
      return {
        formId: row.formId,
        formName: form?.name ?? "Unknown form",
        formSlug: form?.slug ?? "",
        submissionId: row._id,
        submittedAt: row.submittedAt,
        version: row.version,
        versionStatus: version?.status ?? "active",
      };
    });
  },
});

// Submission detail: the denormalized snapshot plus the pinned definition it
// was validated against. Owner or developer-admin only; demo-admin,
// applicant non-owners, and anonymous callers are denied.
const submissionQuery = query({
  args: { submissionId: v.id("submissions") },
  handler: async (context, requestArguments) => {
    const userId = await requireUserId(context);
    const row = await context.db.get(requestArguments.submissionId);
    if (!row) {
      throw new ConvexError("Submission not found.");
    }
    if (row.ownerId !== userId) {
      const user = await context.db.get(userId);
      if (user?.role !== "developer-admin") {
        throw new ConvexError(
          "Only the applicant who submitted may open this."
        );
      }
    }
    const form = await context.db.get(row.formId);
    const version = await context.db.get(row.formVersionId);
    if (!version) {
      throw new ConvexError("The pinned form version is missing.");
    }
    const fileGroups = await mapSequentially(row.fileIds, async (fileId) => {
      const file = await context.db.get(fileId);
      return file
        ? [
            {
              contentType: file.contentType,
              fileId: file._id,
              fileName: file.fileName,
              size: file.size,
            },
          ]
        : [];
    });
    const files = fileGroups.flat();
    return {
      answers: row.answers,
      definition: version.definition,
      files,
      formName: form?.name ?? "Unknown form",
      formSlug: form?.slug ?? "",
      labels: row.labels,
      sourceLabel: version.sourceLabel,
      sourceUrl: version.sourceUrl,
      submissionId: row._id,
      submittedAt: row.submittedAt,
      version: row.version,
      versionStatus: version.status,
    };
  },
});

export { submissionQuery as getSubmission };
