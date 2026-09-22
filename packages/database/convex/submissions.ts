import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { DatabaseReader } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireUserId } from "./authz"
import { splitSection, validateAnswers } from "./formModel"
import type { Answers } from "./formModel"

// Applicant submission lifecycle for #37. `submitDraft` pins the draft's
// starting version, re-validates server-side, snapshots only visible answers
// with rendered labels and file refs, then marks the draft submitted.
// Submitted applications are read-only: this module exports no update or
// delete path (view-only administration is #39).

async function ownedDrafts(
  ctx: { db: DatabaseReader },
  ownerId: Id<"users">,
  formId: Id<"forms">
) {
  const rows = await ctx.db
    .query("drafts")
    .withIndex("owner_form", (q) =>
      q.eq("ownerId", ownerId).eq("formId", formId)
    )
    .collect()
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)
}

// Snapshot keeps only visible answers. Hidden answers stay in the draft row
// but never reach the submission while hidden; the server decides from the
// pinned definition, never from browser state.
function visibleSnapshot(
  definition: Parameters<typeof validateAnswers>[0],
  draftAnswers: Answers,
  visible: string[]
): Answers {
  const seen = new Set(visible)
  const out: Answers = {}
  for (const section of definition.sections) {
    if (section.repeat) {
      const { once, rows: rowFields } = splitSection(section)
      for (const field of once) {
        const value = draftAnswers[field.id]
        if (seen.has(field.id) && value !== undefined) {
          out[field.id] = value
        }
      }
      const list = draftAnswers[section.id]
      if (Array.isArray(list)) {
        const kept = (list as Record<string, unknown>[]).map((row, index) => {
          const cell: Record<string, unknown> = {}
          if (row !== null && typeof row === "object" && !Array.isArray(row)) {
            for (const field of rowFields) {
              if (
                seen.has(`${section.id}[${index}].${field.id}`) &&
                (row as Record<string, unknown>)[field.id] !== undefined
              ) {
                cell[field.id] = (row as Record<string, unknown>)[field.id]
              }
            }
          }
          return cell
        })
        if (kept.some((row) => Object.keys(row).length > 0)) {
          out[section.id] = kept as Answers[string]
        }
      }
      continue
    }
    for (const field of section.fields) {
      const value = draftAnswers[field.id]
      if (seen.has(field.id) && value !== undefined) {
        out[field.id] = value
      }
    }
  }
  return out
}

// Field id to label for every stored answer. Row fields share the label map
// since labels live on the definition, not on the row.
function labelsFor(
  definition: Parameters<typeof validateAnswers>[0],
  snapshot: Answers
): Record<string, string> {
  const byId = new Map<string, string>()
  for (const section of definition.sections) {
    for (const field of section.fields) {
      byId.set(field.id, field.label)
    }
  }
  const labels: Record<string, string> = {}
  for (const [key, value] of Object.entries(snapshot)) {
    if (byId.has(key)) {
      labels[key] = byId.get(key)!
    }
    if (Array.isArray(value)) {
      for (const row of value) {
        if (row !== null && typeof row === "object" && !Array.isArray(row)) {
          for (const fieldId of Object.keys(row as Record<string, unknown>)) {
            if (byId.has(fieldId) && !(fieldId in labels)) {
              labels[fieldId] = byId.get(fieldId)!
            }
          }
        }
      }
    }
  }
  return labels
}

// Submit the caller's active, unexpired draft for one form. Retired versions
// stay submittable until expiry; withdrawn versions block with their reason.
// Success returns only after the snapshot commits and the draft flips.
export const submitDraft = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx)
    const now = Date.now()
    const rows = await ownedDrafts(ctx, ownerId, args.formId)
    const draft = rows.find((d) => d.status === "active" && d.expiresAt >= now)
    if (!draft) {
      const submitted = rows.find((d) => d.status === "submitted")
      if (submitted) {
        throw new ConvexError("This draft was already submitted.")
      }
      throw new ConvexError("No active draft to submit for this form.")
    }
    const version = await ctx.db.get(draft.formVersionId)
    if (!version) {
      throw new ConvexError("The pinned form version is missing.")
    }
    if (version.status === "withdrawn") {
      throw new ConvexError(
        `Submission blocked: this version was withdrawn. ${version.withdrawReason ?? "No reason was recorded."} Your answers stay readable until the draft expires.`
      )
    }
    const { errors, visible } = validateAnswers(
      version.definition,
      draft.answers
    )
    if (errors.length > 0) {
      const listed = errors.map((e) => `${e.path}: ${e.message}`).join("; ")
      throw new ConvexError(
        `Submission blocked by ${errors.length === 1 ? "an invalid answer" : "invalid answers"}: ${listed}`
      )
    }
    const snapshot = visibleSnapshot(version.definition, draft.answers, visible)
    const files = await ctx.db
      .query("files")
      .withIndex("draft", (q) => q.eq("draftId", draft._id))
      .collect()
    // File rows stay linked to the draft; the submission records their ids.
    const submissionId = await ctx.db.insert("submissions", {
      ownerId,
      formId: args.formId,
      formVersionId: draft.formVersionId,
      version: version.version,
      answers: snapshot,
      labels: labelsFor(version.definition, snapshot),
      fileIds: files.map((f) => f._id),
      submittedAt: now,
    })
    await ctx.db.patch(draft._id, { status: "submitted" })
    return { submissionId }
  },
})

// Owner's submissions, newest first, with the form name, slug, version, and
// lifecycle status behind each row for list display.
export const mySubmissions = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx)
    const rows = await ctx.db
      .query("submissions")
      .withIndex("owner", (q) => q.eq("ownerId", ownerId))
      .collect()
    rows.sort((a, b) => b.submittedAt - a.submittedAt)
    const out = []
    for (const row of rows) {
      const [form, version] = await Promise.all([
        ctx.db.get(row.formId),
        ctx.db.get(row.formVersionId),
      ])
      out.push({
        submissionId: row._id,
        formId: row.formId,
        formName: form?.name ?? "Unknown form",
        formSlug: form?.slug ?? "",
        version: row.version,
        versionStatus: version?.status ?? "active",
        submittedAt: row.submittedAt,
      })
    }
    return out
  },
})

// Submission detail: the denormalized snapshot plus the pinned definition it
// was validated against. Owner or developer-admin only; demo-admin,
// applicant non-owners, and anonymous callers are denied.
export const getSubmission = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const row = await ctx.db.get(args.submissionId)
    if (!row) {
      throw new ConvexError("Submission not found.")
    }
    if (row.ownerId !== userId) {
      const user = await ctx.db.get(userId)
      if (user?.role !== "developer-admin") {
        throw new ConvexError("Only the applicant who submitted may open this.")
      }
    }
    const [form, version] = await Promise.all([
      ctx.db.get(row.formId),
      ctx.db.get(row.formVersionId),
    ])
    if (!version) {
      throw new ConvexError("The pinned form version is missing.")
    }
    const files = []
    for (const fileId of row.fileIds) {
      const file = await ctx.db.get(fileId)
      if (file) {
        files.push({
          fileId: file._id,
          fileName: file.fileName,
          contentType: file.contentType,
          size: file.size,
        })
      }
    }
    return {
      submissionId: row._id,
      answers: row.answers,
      labels: row.labels,
      submittedAt: row.submittedAt,
      version: row.version,
      versionStatus: version.status,
      definition: version.definition,
      sourceLabel: version.sourceLabel,
      sourceUrl: version.sourceUrl,
      formName: form?.name ?? "Unknown form",
      formSlug: form?.slug ?? "",
      files,
    }
  },
})
