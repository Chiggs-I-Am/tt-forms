import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireDeveloperAdmin } from "./authz";
import { validateAnswers } from "./formModel";
import { labelsFor } from "./labels";
import { pilotSeeds } from "./pilotDefinitions";
import { mapSequentially } from "./sequential";
import type { Answers } from "./formModel";
import type { Id } from "./_generated/dataModel";

// View-only administration for #39. Applicants and submissions are listed but never written here: this module exports no patch, delete, or impersonation path. Manual cleanup stays out-of-band in the Convex dashboard. Detail reuses the existing submissions.getSubmission; it is not duplicated.

// Applicant list: real sign-in emails plus submission counts. Developer-admin
// only; demo-admin is drafts-and-preview only, and viewing real emails is an
// admin power, so demo-admin is denied here too. Capped at 200 rows.
export const listApplicants = query({
  args: {},
  handler: async (context) => {
    await requireDeveloperAdmin(context);
    const users = await context.db.query("users").collect();
    return await mapSequentially(users.slice(0, 200), async (user) => {
      const submissions = await context.db
        .query("submissions")
        .withIndex("owner", (q) => q.eq("ownerId", user._id))
        .collect();
      return {
        email: user.email ?? null,
        role: user.role ?? "applicant",
        submissionCount: submissions.length,
        userId: user._id,
      };
    });
  },
});

// Submission index, newest first, optionally filtered to one form slug.
// Developer-admin only. Each row carries the pinned version number; the fake
// answers themselves render through submissions.getSubmission on the detail
// view. Capped at 200 rows.
export const listSubmissions = query({
  args: { formSlug: v.optional(v.string()) },
  handler: async (context, requestArguments) => {
    await requireDeveloperAdmin(context);
    let wantedFormId: Id<"forms"> | null = null;
    const { formSlug } = requestArguments;
    if (formSlug !== undefined) {
      const form = await context.db
        .query("forms")
        .withIndex("slug", (q) => q.eq("slug", formSlug))
        .first();
      if (!form) {
        throw new ConvexError(`No form found for "${formSlug}".`);
      }
      wantedFormId = form._id;
    }
    const rows = await context.db.query("submissions").collect();
    const kept = (
      wantedFormId ? rows.filter((row) => row.formId === wantedFormId) : rows
    ).toSorted((a, b) => b.submittedAt - a.submittedAt);
    return await mapSequentially(kept.slice(0, 200), async (row) => {
      const form = await context.db.get(row.formId);
      const owner = await context.db.get(row.ownerId);
      return {
        formName: form?.name ?? "Unknown form",
        formSlug: form?.slug ?? "",
        ownerEmail: owner?.email ?? "unknown",
        submissionId: row._id,
        submittedAt: row.submittedAt,
        version: row.version,
      };
    });
  },
});

// Seeded demo applicants. These addresses look like real sign-in emails
// because the applicant list shows real emails; they are clearly marked demo
// seeds here and nowhere else. Verified timestamps keep them shaped like
// genuine Google/OTP sign-ins.
const seedApplicantEmails = [
  "seeded-applicant-1@example.com",
  "seeded-applicant-2@example.com",
];

// Placeholder that satisfies a required upload answer without storing a file.
// Uploads are never part of seeded examples: fileIds stays empty and no files
// rows are written. The printable renderer skips upload-kind fields, so this
// string never displays; it only keeps validateAnswers clean on definitions
// with a required upload (Certificate of Character).
const seedUploadPlaceholder = "seeded-example-no-file";

const valueAt = <T>(values: readonly T[], index: number): T => {
  const value = values[index];
  if (value === undefined) {
    throw new Error(`No seeded value at index ${index}.`);
  }
  return value;
};

const portOfSpain = "Port of Spain";
const seedAgeMilliseconds = [
  [0, 3_600_000],
  [7_200_000, 10_800_000],
  [14_400_000, 18_000_000],
  [21_600_000, 25_200_000],
];

const adultPassportRenewalKey = "adult-passport-renewal";
const certificateOfCharacterKey = "certificate-of-character";
const computerizedBirthCertificateKey = "computerized-birth-certificate";
const nisNi4Key = "nis-ni4";

// Minimal but valid fake answers per pilot slug, variant 0 or 1. Conditionals
// stay hidden (single marital status, no second citizenship, adult age band)
// except where a variant exercises a visible branch. Every row must pass
// validateAnswers on the latest active version; seedExamples throws otherwise.
const seedBuilders: Record<string, (variantIndex: 0 | 1) => Answers> = {
  [adultPassportRenewalKey]: (variantIndex) => {
    const index = variantIndex === 0 ? 0 : 1;
    return {
      accept: true,
      country_of_birth: "Trinidad and Tobago",
      date_of_birth: valueAt(["1990-05-14", "1987-09-30"], index),
      dated: "2026-02-20",
      decl_id_issue_date: "2015-06-01",
      decl_id_number: valueAt(["FAKE-200001", "FAKE-200002"], index),
      declarant_name: valueAt(["Devi Maraj", "Andre Quashie"], index),
      first_name: valueAt(["Devi", "Andre"], index),
      home_address: valueAt(
        ["7 Palmiste Road, San Fernando", "3 Sierra Vista, Diego Martin"],
        index
      ),
      marital_status: valueAt(["Single", "Married"], index),
      other_citizenship: false,
      passport_issue_date: "2016-02-01",
      passport_issue_place: portOfSpain,
      passport_number: valueAt(["FAKE-T200001", "FAKE-T200002"], index),
      place_of_birth: valueAt(["San Fernando", portOfSpain], index),
      references: [
        { ref_name: "Ravi Persad", ref_tel: "868-555-0111" },
        { ref_name: "Anya Ali", ref_tel: "868-555-0122" },
      ],
      sex: valueAt(["Female", "Male"], index),
      surname: valueAt(["Maraj", "Quashie"], index),
      under_18: "No, I am 18 or over",
    };
  },
  [certificateOfCharacterKey]: (variantIndex) => {
    const index = variantIndex === 0 ? 0 : 1;
    return {
      appointment_date: "2026-03-10",
      email: valueAt(
        ["keston.reyes@example.com", "marlene.belfon@example.com"],
        index
      ),
      first_name: valueAt(["Keston", "Marlene"], index),
      home_address: valueAt(
        ["14 Hibiscus Drive, San Fernando", "8 Palm Road, Arima"],
        index
      ),
      id_number: valueAt(["FAKE-100001", "FAKE-100002"], index),
      id_type: valueAt(["National ID", "Driver's Permit"], index),
      last_name: valueAt(["Reyes", "Belfon"], index),
      occupation: valueAt(["Bus driver", "Primary school teacher"], index),
      phone: valueAt(["868-555-0142", "868-555-0188"], index),
      photo_upload: [seedUploadPlaceholder],
      police_station: valueAt([portOfSpain, "San Fernando"], index),
      purpose: valueAt(
        ["Job application screening", "Volunteer onboarding check"],
        index
      ),
    };
  },
  [computerizedBirthCertificateKey]: (variantIndex): Answers => {
    if (variantIndex === 0) {
      return {
        address: "21 Green Street, Tunapuna",
        application_date: "2026-01-15",
        certify: true,
        child_first: "Asha",
        date_of_birth: "1998-11-02",
        father_first: "Raj",
        father_surname: "Gopaul",
        first_name: "Asha",
        id_number: "FAKE-300001",
        id_type: "ID",
        mother_first: "Kamala",
        mother_maiden: "Singh",
        mother_surname: "Gopaul",
        own_certificate: true,
        place_of_birth: "Port of Spain General Hospital",
        purpose: "Passport application",
        service_type: "Walk In",
        sex: "Female",
        surname: "Gopaul",
        telephone: "868-555-0177",
      };
    }
    return {
      address: "5 La Retreat Road, Tobago",
      application_date: "2026-01-18",
      certify: true,
      child_first: "Jayden",
      date_of_birth: "2018-04-25",
      father_first: "Kurt",
      father_surname: "Forde",
      first_name: "Michelle",
      id_number: "FAKE-300002",
      id_type: "PP",
      mother_first: "Michelle",
      mother_maiden: "Baptiste",
      mother_surname: "Forde",
      own_certificate: false,
      place_of_birth: "Scarborough Hospital, Tobago",
      purpose: "School registration for my child",
      relationship: "Mother",
      service_type: "Mail In",
      sex: "Male",
      surname: "Forde",
      telephone: "868-555-0160",
    };
  },
  [nisNi4Key]: (variantIndex) => {
    const index = variantIndex === 0 ? 0 : 1;
    return {
      accept: true,
      apprentice: false,
      date_of_birth: valueAt(["1995-08-20", "1993-12-05"], index),
      employed_elsewhere: false,
      employer_address: valueAt(
        ["44 Independence Square, Port of Spain", "18 Main Road, Chaguanas"],
        index
      ),
      employer_name: valueAt(
        ["Harbour View Stores", "Central Print Shop"],
        index
      ),
      father_name: valueAt(["Ian Baptiste", "Yusuf Hosein"], index),
      first_employment: "2022-06-01",
      first_name: valueAt(["Keron", "Farah"], index),
      gender: valueAt(["Male", "Female"], index),
      home_address: valueAt(
        ["9 Morvant Road, Port of Spain", "12 Cane Farm Road, Chaguanas"],
        index
      ),
      id_document: "Passport",
      id_expiry: "2030-01-01",
      marital_status: "Single",
      mother_maiden: valueAt(["Clarke", "Ali"], index),
      multiple_birth: false,
      occupation: valueAt(["Cashier", "Clerk"], index),
      pay_frequency: valueAt(["Fortnightly", "Monthly"], index),
      place_of_birth: portOfSpain,
      prev_registered: false,
      same_name: false,
      surname: valueAt(["Baptiste", "Hosein"], index),
    };
  },
};

const seedAnswers = (slug: string, variant: 0 | 1): Answers => {
  const build = seedBuilders[slug];
  if (!build) {
    throw new Error(`No seeded answers for "${slug}".`);
  }
  return build(variant);
};

// Example submissions so admin views are never empty during demos: 1 to 2 per pilot form, attributed to the dedicated demo applicants above.
//
// Skip rule: seeding skips a (demo owner, form) pair when that owner already
// has a submission for that form. Real applicant submissions never block
// seeding because the rule only reads rows owned by the demo addresses, and
// re-running stays a no-op once every pair exists. Forms without an active
// latest version are skipped; run seedPilots first. Site demo context carries
// the meaning, so no per-record stamp is written.
export const seedExamples = internalMutation({
  args: {},
  handler: async (context) => {
    const now = Date.now();
    const batches = await mapSequentially(
      pilotSeeds.map((seed, formIndex) => [formIndex, seed] as const),
      async ([formIndex, seed]) => {
        const form = await context.db
          .query("forms")
          .withIndex("slug", (q) => q.eq("slug", seed.slug))
          .first();
        if (!form) {
          return [];
        }
        const versions = await context.db
          .query("formVersions")
          .withIndex("form", (q) => q.eq("formId", form._id))
          .order("desc")
          .collect();
        const active = versions.find((row) => row.status === "active");
        if (!active) {
          return [];
        }
        return await mapSequentially(
          seedApplicantEmails.map(
            (email, ownerIndex) => [ownerIndex, email] as const
          ),
          async ([ownerIndex, email]) => {
            const existingUser = await context.db
              .query("users")
              .withIndex("email", (q) => q.eq("email", email))
              .first();
            const ownerId =
              existingUser?._id ??
              (await context.db.insert("users", {
                email,
                emailVerificationTime: now,
              }));
            const owned = await context.db
              .query("submissions")
              .withIndex("owner", (q) => q.eq("ownerId", ownerId))
              .collect();
            if (owned.some((row) => row.formId === form._id)) {
              return [];
            }
            const variant: 0 | 1 = ownerIndex === 0 ? 0 : 1;
            const answers = seedAnswers(seed.slug, variant);
            const { errors } = validateAnswers(active.definition, answers);
            if (errors.length > 0) {
              const details = errors
                .map((error) => `${error.path}: ${error.message}`)
                .join("; ");
              throw new Error(
                `Seeded answers for "${seed.slug}" fail validation: ${details}`
              );
            }
            const ageMilliseconds = valueAt(
              valueAt(seedAgeMilliseconds, formIndex),
              ownerIndex
            );
            await context.db.insert("submissions", {
              answers,
              fileIds: [],
              formId: form._id,
              formVersionId: active._id,
              labels: labelsFor(active.definition, answers),
              ownerId,
              submittedAt: now - ageMilliseconds,
              version: active.version,
            });
            return [{ owner: email, slug: seed.slug }];
          }
        );
      }
    );
    return batches.flat().flat();
  },
});
