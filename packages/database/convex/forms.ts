import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDeveloperAdmin, requireUserId } from "./authz";
import { formDefinitionValidator, validateDefinition } from "./formModel";
import { mapSequentially } from "./sequential";
import type { DatabaseReader } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const versionNotFound = "Version not found.";

// Versioned form core for #35. Working copies are editable drafts that never
// touch live forms; publish snapshots an immutable version; retire and
// emergency-withdraw move only the lifecycle status. Drafts and submissions
// (#36/#37) pin formVersionId and stay on their version's rules. The server
// is the authority on applicability, immutability, ownership, and pinning.

const latestVersion = async (
  context: { db: DatabaseReader },
  formId: Id<"forms">
) => {
  const version = await context.db
    .query("formVersions")
    .withIndex("form", (q) => q.eq("formId", formId))
    .order("desc")
    .first();
  if (version === null) {
    return null;
  }
  return version;
};

const versionDetail = async (
  context: { db: DatabaseReader },
  versionId: Id<"formVersions"> | undefined
) => {
  if (!versionId) {
    return null;
  }
  const version = await context.db.get(versionId);
  if (!version) {
    return null;
  }
  const form = await context.db.get(version.formId);
  if (!form) {
    return null;
  }
  return {
    definition: version.definition,
    form: { agency: form.agency, name: form.name, slug: form.slug },
    formId: version.formId,
    sourceLabel: version.sourceLabel,
    sourceUrl: version.sourceUrl,
    status: version.status,
    version: version.version,
    versionId: version._id,
    withdrawReason: version.withdrawReason,
  };
};

// Public catalog: forms whose latest version is active. Retired forms stop
// new drafts (hidden here); withdrawn forms additionally block submission of
// existing drafts (#37) while staying readable to their owners.
export const listPublished = query({
  args: {},
  handler: async (context) => {
    const forms = await context.db.query("forms").collect();
    const rows = await mapSequentially(forms, async (form) => {
      const version = await latestVersion(context, form._id);
      return version?.status === "active"
        ? [
            {
              agency: form.agency,
              formId: form._id,
              name: form.name,
              slug: form.slug,
              sourceLabel: version.sourceLabel,
              sourceUrl: version.sourceUrl,
              version: version.version,
              versionId: version._id,
            },
          ]
        : [];
    });
    return rows.flat();
  },
});

// Public version detail for rendering an applicant-style preview and the
// pinned definition behind drafts and submissions. Anonymous browsing is
// allowed; saving is not (no mutation here).
const versionQuery = query({
  args: { versionId: v.id("formVersions") },
  handler: async (context, requestArguments) => {
    const version = await context.db.get(requestArguments.versionId);
    return await versionDetail(context, version?._id);
  },
});

// Public latest-version detail by slug. Powers the applicant fill view: one
// anonymous query returns everything the renderer needs. Returns null when
// the form or version does not exist.
const latestVersionQuery = query({
  args: { slug: v.string() },
  handler: async (context, requestArguments) => {
    const form = await context.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", requestArguments.slug))
      .first();
    if (!form) {
      return null;
    }
    const version = await latestVersion(context, form._id);
    return await versionDetail(context, version?._id);
  },
});

export { latestVersionQuery as getLatestVersion, versionQuery as getVersion };

// Working copy for the builder UI (developer-admin only). The builder itself
// arrives after the data slice; this mutation is its save path.
export const saveWorkingCopy = mutation({
  args: {
    agency: v.string(),
    definition: formDefinitionValidator,
    name: v.string(),
    slug: v.string(),
    sourceLabel: v.string(),
    sourceUrl: v.string(),
  },
  handler: async (context, requestArguments) => {
    await requireDeveloperAdmin(context);
    const existing = await context.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", requestArguments.slug))
      .first();
    if (existing) {
      await context.db.patch(existing._id, {
        agency: requestArguments.agency,
        definition: requestArguments.definition,
        name: requestArguments.name,
        sourceLabel: requestArguments.sourceLabel,
        sourceUrl: requestArguments.sourceUrl,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return await context.db.insert("forms", {
      agency: requestArguments.agency,
      definition: requestArguments.definition,
      name: requestArguments.name,
      slug: requestArguments.slug,
      sourceLabel: requestArguments.sourceLabel,
      sourceUrl: requestArguments.sourceUrl,
      updatedAt: Date.now(),
    });
  },
});

// Explicit publish with checks: invalid rules, missing labels or options,
// and incomplete source information all block the snapshot. Publishing never
// mutates the working copy or any prior version; it appends version max+1.
export const publish = mutation({
  args: { slug: v.string() },
  handler: async (context, requestArguments) => {
    await requireDeveloperAdmin(context);
    const form = await context.db
      .query("forms")
      .withIndex("slug", (q) => q.eq("slug", requestArguments.slug))
      .first();
    if (!form) {
      throw new ConvexError(`No working copy for "${requestArguments.slug}".`);
    }
    if (!form.sourceLabel || !form.sourceUrl) {
      throw new ConvexError(
        "Publish blocked: source information is incomplete."
      );
    }
    const problems = validateDefinition(form.definition);
    if (problems.length > 0) {
      throw new ConvexError(`Publish blocked: ${problems.join(" ")}`);
    }
    const latest = await latestVersion(context, form._id);
    return await context.db.insert("formVersions", {
      createdAt: Date.now(),
      definition: form.definition,
      formId: form._id,
      sourceLabel: form.sourceLabel,
      sourceUrl: form.sourceUrl,
      status: "active",
      version: (latest?.version ?? 0) + 1,
    });
  },
});

// Retirement stops new drafts; existing drafts stay submittable until expiry
// (#37) and submitted applications are untouched.
export const retire = mutation({
  args: { versionId: v.id("formVersions") },
  handler: async (context, requestArguments) => {
    await requireDeveloperAdmin(context);
    const version = await context.db.get(requestArguments.versionId);
    if (!version) {
      throw new ConvexError(versionNotFound);
    }
    if (version.status !== "active") {
      throw new ConvexError(
        `Only active versions retire (now ${version.status}).`
      );
    }
    await context.db.patch(version._id, { status: "retired" });
    return version._id;
  },
});

// Emergency withdrawal additionally blocks submission of existing drafts
// (#37), keeps answers readable until expiry, and records the explanation.
// A retired version can still be withdrawn: takedown must work whatever the
// lifecycle state. Like retire, it never deletes submitted applications.
export const withdraw = mutation({
  args: { reason: v.string(), versionId: v.id("formVersions") },
  handler: async (context, requestArguments) => {
    await requireDeveloperAdmin(context);
    if (!requestArguments.reason.trim()) {
      throw new ConvexError("Withdrawal needs a readable explanation.");
    }
    const version = await context.db.get(requestArguments.versionId);
    if (!version) {
      throw new ConvexError(versionNotFound);
    }
    if (version.status === "withdrawn") {
      throw new ConvexError("This version is already withdrawn.");
    }
    await context.db.patch(version._id, {
      status: "withdrawn",
      withdrawReason: requestArguments.reason.trim(),
    });
    return version._id;
  },
});

// Builder index for #35 (developer-admin only). Lists every working copy
// with its slug, name, agency, sources, editable definition, and updatedAt,
// plus the latest version number and status for the per-form state line on
// /admin/forms. The editor loads its copy from this one query. Demo-admin
// gets nothing here; preview-only access lives elsewhere. Denial is
// server-side; UI hiding is cosmetic.
export const listWorkingCopies = query({
  args: {},
  handler: async (context) => {
    await requireDeveloperAdmin(context);
    const forms = await context.db.query("forms").collect();
    return await mapSequentially(forms, async (form) => {
      const version = await latestVersion(context, form._id);
      return {
        agency: form.agency,
        definition: form.definition,
        formId: form._id,
        latestStatus: version ? version.status : null,
        latestVersion: version ? version.version : null,
        name: form.name,
        slug: form.slug,
        sourceLabel: form.sourceLabel,
        sourceUrl: form.sourceUrl,
        updatedAt: form.updatedAt,
      };
    });
  },
});

// Authenticated status line for the applicant flow (#36): which lifecycle
// state governs a given version for new drafts and submissions.
export const versionGate = query({
  args: { versionId: v.id("formVersions") },
  handler: async (context, requestArguments) => {
    const userId = await requireUserId(context);
    const version = await context.db.get(requestArguments.versionId);
    if (!version) {
      throw new ConvexError(versionNotFound);
    }
    return {
      newDrafts: version.status === "active",
      status: version.status,
      submissions: version.status === "active" || version.status === "retired",
      userId,
      withdrawReason: version.withdrawReason,
    };
  },
});
