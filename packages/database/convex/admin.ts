import { ConvexError, v } from "convex/values"
import { internalMutation, query } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireDeveloperAdmin } from "./authz"
import { validateAnswers } from "./formModel"
import { labelsFor } from "./labels"
import type { Answers } from "./formModel"
import { pilotSeeds } from "./pilotDefinitions"

// View-only administration for #39. Applicants and submissions are listed but
// never written here: this module exports no patch, delete, or impersonation
// path. Manual cleanup stays out-of-band in the Convex dashboard. Detail
// reuses the existing submissions.getSubmission; it is not duplicated.

// Applicant list: real sign-in emails plus submission counts. Developer-admin
// only; demo-admin is drafts-and-preview only, and viewing real emails is an
// admin power, so demo-admin is denied here too. Capped at 200 rows.
export const listApplicants = query({
  args: {},
  handler: async (ctx) => {
    await requireDeveloperAdmin(ctx)
    const users = await ctx.db.query("users").collect()
    const out = []
    for (const user of users.slice(0, 200)) {
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("owner", (q) => q.eq("ownerId", user._id))
        .collect()
      out.push({
        userId: user._id,
        email: user.email ?? null,
        role: user.role ?? "applicant",
        submissionCount: submissions.length,
      })
    }
    return out
  },
})

// Submission index, newest first, optionally filtered to one form slug.
// Developer-admin only. Each row carries the pinned version number; the fake
// answers themselves render through submissions.getSubmission on the detail
// view. Capped at 200 rows.
export const listSubmissions = query({
  args: { formSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireDeveloperAdmin(ctx)
    let wantedFormId: Id<"forms"> | null = null
    if (args.formSlug) {
      const form = await ctx.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", args.formSlug!))
        .first()
      if (!form) {
        throw new ConvexError(`No form found for "${args.formSlug}".`)
      }
      wantedFormId = form._id
    }
    const rows = await ctx.db.query("submissions").collect()
    const kept = (
      wantedFormId ? rows.filter((row) => row.formId === wantedFormId) : rows
    ).sort((a, b) => b.submittedAt - a.submittedAt)
    const out = []
    for (const row of kept.slice(0, 200)) {
      const [form, owner] = await Promise.all([
        ctx.db.get(row.formId),
        ctx.db.get(row.ownerId),
      ])
      out.push({
        submissionId: row._id,
        formSlug: form?.slug ?? "",
        formName: form?.name ?? "Unknown form",
        version: row.version,
        ownerEmail: owner?.email ?? "unknown",
        submittedAt: row.submittedAt,
      })
    }
    return out
  },
})

// Seeded demo applicants. These addresses look like real sign-in emails
// because the applicant list shows real emails; they are clearly marked demo
// seeds here and nowhere else. Verified timestamps keep them shaped like
// genuine Google/OTP sign-ins.
const SEED_APPLICANT_EMAILS = [
  "seeded-applicant-1@example.com",
  "seeded-applicant-2@example.com",
]

// Placeholder that satisfies a required upload answer without storing a file.
// Uploads are never part of seeded examples: fileIds stays empty and no files
// rows are written. The printable renderer skips upload-kind fields, so this
// string never displays; it only keeps validateAnswers clean on definitions
// with a required upload (Certificate of Character).
const SEED_UPLOAD_PLACEHOLDER = "seeded-example-no-file"

// Minimal but valid fake answers per pilot slug, variant 0 or 1. Conditionals
// stay hidden (single marital status, no second citizenship, adult age band)
// except where a variant exercises a visible branch. Every row must pass
// validateAnswers on the latest active version; seedExamples throws otherwise.
const SEED_BUILDERS: Record<string, (variantIndex: 0 | 1) => Answers> = {
  "certificate-of-character": (variantIndex) => {
    const pick = variantIndex === 0 ? 0 : 1
    return {
      first_name: ["Keston", "Marlene"][pick]!,
      last_name: ["Reyes", "Belfon"][pick]!,
      home_address: ["14 Hibiscus Drive, San Fernando", "8 Palm Road, Arima"][
        pick
      ]!,
      phone: ["868-555-0142", "868-555-0188"][pick]!,
      email: ["keston.reyes@example.com", "marlene.belfon@example.com"][pick]!,
      id_type: ["National ID", "Driver's Permit"][pick]!,
      id_number: ["FAKE-100001", "FAKE-100002"][pick]!,
      occupation: ["Bus driver", "Primary school teacher"][pick]!,
      purpose: ["Job application screening", "Volunteer onboarding check"][
        pick
      ]!,
      photo_upload: [SEED_UPLOAD_PLACEHOLDER],
      appointment_date: "2026-03-10",
      police_station: ["Port of Spain", "San Fernando"][pick]!,
    }
  },
  "adult-passport-renewal": (variantIndex) => {
    const pick = variantIndex === 0 ? 0 : 1
    return {
      surname: ["Maraj", "Quashie"][pick]!,
      first_name: ["Devi", "Andre"][pick]!,
      date_of_birth: ["1990-05-14", "1987-09-30"][pick]!,
      sex: ["Female", "Male"][pick]!,
      place_of_birth: ["San Fernando", "Port of Spain"][pick]!,
      country_of_birth: "Trinidad and Tobago",
      marital_status: ["Single", "Married"][pick]!,
      home_address: [
        "7 Palmiste Road, San Fernando",
        "3 Sierra Vista, Diego Martin",
      ][pick]!,
      passport_number: ["FAKE-T200001", "FAKE-T200002"][pick]!,
      passport_issue_date: "2016-02-01",
      passport_issue_place: "Port of Spain",
      other_citizenship: false,
      under_18: "No, I am 18 or over",
      references: [
        { ref_name: "Ravi Persad", ref_tel: "868-555-0111" },
        { ref_name: "Anya Ali", ref_tel: "868-555-0122" },
      ],
      declarant_name: ["Devi Maraj", "Andre Quashie"][pick]!,
      accept: true,
      dated: "2026-02-20",
      decl_id_number: ["FAKE-200001", "FAKE-200002"][pick]!,
      decl_id_issue_date: "2015-06-01",
    }
  },
  "computerized-birth-certificate": (variantIndex): Answers =>
    variantIndex === 0
      ? {
          first_name: "Asha",
          surname: "Gopaul",
          address: "21 Green Street, Tunapuna",
          service_type: "Walk In",
          telephone: "868-555-0177",
          own_certificate: true,
          purpose: "Passport application",
          id_type: "ID",
          id_number: "FAKE-300001",
          child_first: "Asha",
          sex: "Female",
          date_of_birth: "1998-11-02",
          place_of_birth: "Port of Spain General Hospital",
          mother_first: "Kamala",
          mother_surname: "Gopaul",
          mother_maiden: "Singh",
          father_first: "Raj",
          father_surname: "Gopaul",
          application_date: "2026-01-15",
          certify: true,
        }
      : {
          first_name: "Michelle",
          surname: "Forde",
          address: "5 La Retreat Road, Tobago",
          service_type: "Mail In",
          telephone: "868-555-0160",
          own_certificate: false,
          relationship: "Mother",
          purpose: "School registration for my child",
          id_type: "PP",
          id_number: "FAKE-300002",
          child_first: "Jayden",
          sex: "Male",
          date_of_birth: "2018-04-25",
          place_of_birth: "Scarborough Hospital, Tobago",
          mother_first: "Michelle",
          mother_surname: "Forde",
          mother_maiden: "Baptiste",
          father_first: "Kurt",
          father_surname: "Forde",
          application_date: "2026-01-18",
          certify: true,
        },
  "nis-ni4": (variantIndex) => {
    const pick = variantIndex === 0 ? 0 : 1
    return {
      surname: ["Baptiste", "Hosein"][pick]!,
      first_name: ["Keron", "Farah"][pick]!,
      apprentice: false,
      gender: ["Male", "Female"][pick]!,
      home_address: [
        "9 Morvant Road, Port of Spain",
        "12 Cane Farm Road, Chaguanas",
      ][pick]!,
      date_of_birth: ["1995-08-20", "1993-12-05"][pick]!,
      place_of_birth: "Port of Spain",
      multiple_birth: false,
      same_name: false,
      father_name: ["Ian Baptiste", "Yusuf Hosein"][pick]!,
      mother_maiden: ["Clarke", "Ali"][pick]!,
      id_document: "Passport",
      id_expiry: "2030-01-01",
      marital_status: "Single",
      employer_name: ["Harbour View Stores", "Central Print Shop"][pick]!,
      employer_address: [
        "44 Independence Square, Port of Spain",
        "18 Main Road, Chaguanas",
      ][pick]!,
      occupation: ["Cashier", "Clerk"][pick]!,
      pay_frequency: ["Fortnightly", "Monthly"][pick]!,
      first_employment: "2022-06-01",
      prev_registered: false,
      employed_elsewhere: false,
      accept: true,
    }
  },
}

function seedAnswers(slug: string, variant: 0 | 1): Answers {
  const build = SEED_BUILDERS[slug]
  if (!build) {
    throw new Error(`No seeded answers for "${slug}".`)
  }
  return build(variant)
}

// Example submissions so admin views are never empty during demos: 1 to 2 per
// pilot form, attributed to the dedicated demo applicants above.
//
// Skip rule: seeding skips a (demo owner, form) pair when that owner already
// has a submission for that form. Real applicant submissions never block
// seeding because the rule only reads rows owned by the demo addresses, and
// re-running stays a no-op once every pair exists. Forms without an active
// latest version are skipped; run seedPilots first. Site demo context carries
// the meaning, so no per-record stamp is written.
export const seedExamples = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const created = []
    for (let formIdx = 0; formIdx < pilotSeeds.length; formIdx += 1) {
      const seed = pilotSeeds[formIdx]!
      const form = await ctx.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", seed.slug))
        .first()
      if (!form) {
        continue
      }
      const versions = await ctx.db
        .query("formVersions")
        .withIndex("form", (q) => q.eq("formId", form._id))
        .order("desc")
        .collect()
      const active = versions.find((row) => row.status === "active")
      if (!active) {
        continue
      }
      for (
        let ownerIdx = 0;
        ownerIdx < SEED_APPLICANT_EMAILS.length;
        ownerIdx += 1
      ) {
        const email = SEED_APPLICANT_EMAILS[ownerIdx]!
        const existingUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first()
        const ownerId =
          existingUser?._id ??
          (await ctx.db.insert("users", {
            email,
            emailVerificationTime: now,
          }))
        const owned = await ctx.db
          .query("submissions")
          .withIndex("owner", (q) => q.eq("ownerId", ownerId))
          .collect()
        if (owned.some((row) => row.formId === form._id)) {
          continue
        }
        const answers = seedAnswers(seed.slug, ownerIdx as 0 | 1)
        const { errors } = validateAnswers(active.definition, answers)
        if (errors.length > 0) {
          throw new Error(
            `Seeded answers for "${seed.slug}" fail validation: ${errors.map((e) => `${e.path}: ${e.message}`).join("; ")}`
          )
        }
        await ctx.db.insert("submissions", {
          ownerId,
          formId: form._id,
          formVersionId: active._id,
          version: active.version,
          answers,
          labels: labelsFor(active.definition, answers),
          fileIds: [],
          submittedAt: now - (formIdx * 2 + ownerIdx) * 3_600_000,
        })
        created.push({ slug: seed.slug, owner: email })
      }
    }
    return created
  },
})
