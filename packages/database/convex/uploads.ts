import { ConvexError, v } from "convex/values"
import type { Auth } from "convex/server"
import { mutation, query } from "./_generated/server"
import type { DatabaseReader } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireUserId } from "./authz"
import type { FormDefinition } from "./formModel"

// Uploads for #38. Standard three-step flow: `generateUploadUrl` is the
// who-may-upload gate, the client POSTs bytes to that URL, then `saveFile`
// reads the `_storage` row and deletes plus rejects on any type or size
// violation. Client `accept` and size pre-checks are cosmetic and never
// trusted. Generated file URLs are bearer tokens: `fileUrl` gates who
// receives them, and deleting the blob revokes access.
//
// File rows link to their draft via `draftId`. Draft-expiry cleanup is #36's
// `purgeExpired` internal mutation, which deletes each expired draft's file
// rows and storage blobs explicitly. Uploads are never seeded.

export const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
])

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "pdf"])

// Storage rows always carry a contentType in production; the convex-test
// mock does not, so the extension is the fallback there, never the bypass.
const EXTENSION_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".")
  if (dot < 0) {
    return ""
  }
  return fileName.slice(dot + 1).toLowerCase()
}

function limitForField(definition: FormDefinition, fieldId: string): number {
  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (field.id === fieldId && field.kind === "upload") {
        return field.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES
      }
    }
  }
  return DEFAULT_MAX_SIZE_BYTES
}

async function loadOwnedDraft(
  ctx: { auth: Auth; db: DatabaseReader },
  userId: Id<"users">,
  draftId: Id<"drafts">
) {
  const draft = await ctx.db.get(draftId)
  if (!draft) {
    throw new ConvexError("Draft not found.")
  }
  if (draft.ownerId !== userId) {
    throw new ConvexError("Only the draft owner may upload files.")
  }
  if (draft.status !== "active") {
    throw new ConvexError("This draft is no longer active.")
  }
  if (draft.expiresAt <= Date.now()) {
    throw new ConvexError("This draft has expired.")
  }
  const version = await ctx.db.get(draft.formVersionId)
  if (!version) {
    throw new ConvexError("The pinned form version is missing.")
  }
  if (version.status === "withdrawn") {
    throw new ConvexError(
      "Uploads are blocked: this form version was withdrawn."
    )
  }
  return { draft, version }
}

// Who-may-upload gate. Only the owner of an active, unexpired draft pinned
// to a non-withdrawn version gets an upload URL. Retired versions still
// allow uploads: existing drafts stay submittable until expiry.
export const generateUploadUrl = mutation({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    await loadOwnedDraft(ctx, userId, args.draftId)
    const uploadUrl = await ctx.storage.generateUploadUrl()
    return { uploadUrl, draftId: args.draftId }
  },
})

// Saving mutation. Reads the `_storage` row and enforces the pinned
// version's per-field limit plus images/PDF-only. Any violation deletes the
// blob first so a bypassed client can never leave a disallowed file behind.
export const saveFile = mutation({
  args: {
    draftId: v.id("drafts"),
    fieldId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const { version } = await loadOwnedDraft(ctx, userId, args.draftId)
    const row = await ctx.db.system.get("_storage", args.storageId)
    if (!row) {
      throw new ConvexError("Upload not found. Post the file bytes first.")
    }
    const limit = limitForField(version.definition, args.fieldId)
    const contentType = (row as { contentType?: string }).contentType
    const extension = extensionOf(args.fileName)
    const typeOk =
      (contentType !== undefined
        ? ALLOWED_CONTENT_TYPES.has(contentType.toLowerCase())
        : true) && ALLOWED_EXTENSIONS.has(extension)
    if (!typeOk) {
      await ctx.storage.delete(args.storageId)
      throw new ConvexError("Only images and PDF files may be uploaded.")
    }
    if (row.size > limit) {
      await ctx.storage.delete(args.storageId)
      throw new ConvexError(
        `File is too large: the limit is ${Math.round(limit / 1024 / 1024)}MB.`
      )
    }
    return await ctx.db.insert("files", {
      ownerId: userId,
      draftId: args.draftId,
      storageId: args.storageId,
      fileName: args.fileName,
      contentType:
        contentType ?? EXTENSION_MIME[extension] ?? "application/octet-stream",
      size: row.size,
      createdAt: Date.now(),
    })
  },
})

// Gated serving. Only the file owner or a developer-admin receives the URL.
// Demo-admin and applicant non-owners plus anonymous callers get a denial.
export const fileUrl = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      throw new ConvexError("File not found.")
    }
    if (file.ownerId !== userId) {
      const user = await ctx.db.get(userId)
      if (user?.role !== "developer-admin") {
        throw new ConvexError("Only the file owner may open this file.")
      }
    }
    const url = await ctx.storage.getUrl(file.storageId)
    if (!url) {
      throw new ConvexError("File not found.")
    }
    return { url, fileName: file.fileName, contentType: file.contentType }
  },
})
