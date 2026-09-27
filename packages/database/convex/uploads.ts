import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./authz";
import { rateLimiter } from "./rateLimits";
import type { DatabaseReader } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { FormDefinition } from "./formModel";

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

const defaultMaxSizeBytes = 5_242_880;
const pngContentType = "image/png";
const jpegContentType = "image/jpeg";
const gifContentType = "image/gif";
export { defaultMaxSizeBytes as DEFAULT_MAX_SIZE_BYTES };

const allowedContentTypes = new Set([
  pngContentType,
  jpegContentType,
  gifContentType,
  "image/webp",
  "application/pdf",
]);

const allowedExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "pdf"]);

// Storage rows always carry a contentType in production; the convex-test
// mock does not, so the extension is the fallback there, never the bypass.
const extensionMime: Record<string, string> = {
  gif: gifContentType,
  jpeg: jpegContentType,
  jpg: jpegContentType,
  pdf: "application/pdf",
  png: pngContentType,
  webp: "image/webp",
};

const contentTypeOf = (row: unknown): string | undefined => {
  if (row === null || typeof row !== "object" || !("contentType" in row)) {
    return undefined;
  }
  return typeof row.contentType === "string" ? row.contentType : undefined;
};

const extensionOf = (fileName: string): string => {
  const match = /\.(?<extension>[^.]+)$/u.exec(fileName);
  return match?.groups?.extension?.toLowerCase() ?? "";
};

// Per-field size limit from the pinned definition. Every field lives in
// section.fields, including fields that repeat per row (repeatFields only
// selects which of them repeat), so this scan covers top-level and repeat-row
// upload fields alike.
const limitForField = (definition: FormDefinition, fieldId: string): number => {
  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (field.id === fieldId && field.kind === "upload") {
        return field.maxSizeBytes ?? defaultMaxSizeBytes;
      }
    }
  }
  return defaultMaxSizeBytes;
};

const loadOwnedDraft = async (
  context: { db: DatabaseReader },
  userId: Id<"users">,
  draftId: Id<"drafts">
) => {
  const draft = await context.db.get(draftId);
  if (!draft) {
    throw new ConvexError("Draft not found.");
  }
  if (draft.ownerId !== userId) {
    throw new ConvexError("Only the draft owner may upload files.");
  }
  if (draft.status !== "active") {
    throw new ConvexError("This draft is no longer active.");
  }
  if (draft.expiresAt <= Date.now()) {
    throw new ConvexError("This draft has expired.");
  }
  const version = await context.db.get(draft.formVersionId);
  if (!version) {
    throw new ConvexError("The pinned form version is missing.");
  }
  if (version.status === "withdrawn") {
    throw new ConvexError(
      "Uploads are blocked: this form version was withdrawn."
    );
  }
  return { draft, version };
};

// Who-may-upload gate. Only the owner of an active, unexpired draft pinned
// to a non-withdrawn version gets an upload URL. Retired versions still
// allow uploads: existing drafts stay submittable until expiry.
export const generateUploadUrl = mutation({
  args: { draftId: v.id("drafts") },
  handler: async (context, requestArguments) => {
    const userId = await requireUserId(context);
    await rateLimiter.limit(context, "uploadUrl", {
      key: userId,
      throws: true,
    });
    await loadOwnedDraft(context, userId, requestArguments.draftId);
    const uploadUrl = await context.storage.generateUploadUrl();
    return { draftId: requestArguments.draftId, uploadUrl };
  },
});

// Saving mutation. Reads the `_storage` row and enforces the pinned
// version's per-field limit plus images/PDF-only. Any violation deletes the
// blob first so a bypassed client can never leave a disallowed file behind.
export const saveFile = mutation({
  args: {
    draftId: v.id("drafts"),
    fieldId: v.string(),
    fileName: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (context, requestArguments) => {
    const userId = await requireUserId(context);
    await rateLimiter.limit(context, "saveFile", { key: userId, throws: true });
    const { version } = await loadOwnedDraft(
      context,
      userId,
      requestArguments.draftId
    );
    const row = await context.db.system.get(
      "_storage",
      requestArguments.storageId
    );
    if (!row) {
      throw new ConvexError("Upload not found. Post the file bytes first.");
    }
    const limit = limitForField(version.definition, requestArguments.fieldId);
    const contentType = contentTypeOf(row);
    const normalizedContentType = contentType?.toLowerCase() ?? "";
    const extension = extensionOf(requestArguments.fileName);
    const isTypeOk =
      (contentType === undefined ||
        allowedContentTypes.has(normalizedContentType)) &&
      allowedExtensions.has(extension);
    if (!isTypeOk) {
      await context.storage.delete(requestArguments.storageId);
      throw new ConvexError("Only images and PDF files may be uploaded.");
    }
    if (row.size > limit) {
      await context.storage.delete(requestArguments.storageId);
      throw new ConvexError(
        `File is too large: the limit is ${Math.round(Number(String(limit)) / Number("1048576"))}MB.`
      );
    }
    return await context.db.insert("files", {
      contentType:
        contentType ?? extensionMime[extension] ?? "application/octet-stream",
      createdAt: Date.now(),
      draftId: requestArguments.draftId,
      fileName: requestArguments.fileName,
      ownerId: userId,
      size: row.size,
      storageId: requestArguments.storageId,
    });
  },
});

// Gated serving. Only the file owner or a developer-admin receives the URL.
// Demo-admin and applicant non-owners plus anonymous callers get a denial.
export const fileUrl = query({
  args: { fileId: v.id("files") },
  handler: async (context, requestArguments) => {
    const userId = await requireUserId(context);
    const file = await context.db.get(requestArguments.fileId);
    if (!file) {
      throw new ConvexError("File not found.");
    }
    if (file.ownerId !== userId) {
      const user = await context.db.get(userId);
      if (user?.role !== "developer-admin") {
        throw new ConvexError("Only the file owner may open this file.");
      }
    }
    const url = await context.storage.getUrl(file.storageId);
    if (url === null) {
      throw new ConvexError("File not found.");
    }
    return { contentType: file.contentType, fileName: file.fileName, url };
  },
});
