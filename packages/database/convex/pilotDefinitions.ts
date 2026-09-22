import type { FormDefinition } from "./formModel"

// 1:1 transcriptions of the official paper/portal forms for #35. Every
// question below appears on the official form with the same meaning; online
// rewrites are limited to hints and help text. Identity-number fields use
// guided-fake-input (placeholder examples plus helper text, no format
// validation). Anything the demo cannot model yet (handwritten signatures,
// employer stamps, official station lists) is an optional field or an
// explicit note, never a required step.

const FAKE_ID_HINT =
  "Invent a number. Never type a real ID, passport, or permit number."
const FIVE_MB = 5 * 1024 * 1024

export interface PilotSeed {
  slug: string
  name: string
  agency: string
  sourceLabel: string
  sourceUrl: string
  definition: FormDefinition
}

// Certificate of Character (TTPS portal, https://services.ttps.gov.tt/coc).
// Portal fields per research: names, address, contact, ID type + number,
// occupation, purpose, photo upload, appointment date and station choice.
// The portal's station dropdown is a free-text field here until the station
// list is modeled; the section note says so.
const certificateOfCharacter: PilotSeed = {
  slug: "certificate-of-character",
  name: "Certificate of Character",
  agency: "Trinidad and Tobago Police Service",
  sourceLabel: "TTPS Certificate of Character portal",
  sourceUrl: "https://services.ttps.gov.tt/coc",
  definition: {
    sections: [
      {
        id: "personal",
        title: "Personal details",
        helpText: "Fee TT$50, processing takes about 2-3 weeks.",
        fields: [
          {
            id: "first_name",
            kind: "short_text",
            label: "First name",
            required: true,
            maxLength: 60,
          },
          {
            id: "last_name",
            kind: "short_text",
            label: "Last name",
            required: true,
            maxLength: 60,
          },
          {
            id: "home_address",
            kind: "long_text",
            label: "Home address",
            required: true,
            maxLength: 500,
          },
          {
            id: "phone",
            kind: "phone",
            label: "Telephone number",
            required: true,
          },
          {
            id: "email",
            kind: "email",
            label: "Email address",
            required: true,
          },
        ],
      },
      {
        id: "identification",
        title: "Identification",
        fields: [
          {
            id: "id_type",
            kind: "single_choice",
            label: "ID type",
            required: true,
            options: ["National ID", "Passport", "Driver's Permit"],
          },
          {
            id: "id_number",
            kind: "short_text",
            label: "ID number",
            required: true,
            maxLength: 40,
            hint: FAKE_ID_HINT,
          },
        ],
      },
      {
        id: "background",
        title: "Background",
        fields: [
          {
            id: "occupation",
            kind: "short_text",
            label: "Occupation",
            required: true,
            maxLength: 120,
          },
          {
            id: "purpose",
            kind: "long_text",
            label: "Purpose for the certificate",
            required: true,
            maxLength: 1000,
          },
        ],
      },
      {
        id: "photo",
        title: "Photograph",
        helpText:
          "Upload a stand-in image. Images and PDF only, about 5MB max.",
        fields: [
          {
            id: "photo_upload",
            kind: "upload",
            label: "Recent photograph",
            required: true,
            maxSizeBytes: FIVE_MB,
            hint: "Never upload a real ID photo. Any image stands in.",
          },
        ],
      },
      {
        id: "appointment",
        title: "Appointment",
        helpText:
          "The portal offers a station list; until it is modeled, type the station name.",
        fields: [
          {
            id: "appointment_date",
            kind: "date",
            label: "Appointment date",
            required: true,
          },
          {
            id: "police_station",
            kind: "short_text",
            label: "Police station",
            required: true,
            maxLength: 120,
            hint: 'As listed on the portal, e.g. "Port of Spain".',
          },
        ],
      },
    ],
  },
}

// Adult passport renewal, 16 and over (Immigration Division print form).
// Sections 1-8 follow the paper numbering; the official-use block at the top
// (receipt, passport number, dates) is filled by officers, not applicants.
const passportRenewal: PilotSeed = {
  slug: "adult-passport-renewal",
  name: "Adult passport renewal (16 and over)",
  agency: "Immigration Division",
  sourceLabel: "Official renewal application form (PDF)",
  sourceUrl:
    "https://foreign.gov.tt/documents/1752/ADULT_RENEWAL_APPLICATION_FORM_FOR_TRINIDAD_AND_TOBAGO_PASSPORT.pdf",
  definition: {
    sections: [
      {
        id: "names",
        title: "1. Names",
        fields: [
          {
            id: "surname",
            kind: "short_text",
            label: "Surname",
            required: true,
            maxLength: 60,
          },
          {
            id: "first_name",
            kind: "short_text",
            label: "First name",
            required: true,
            maxLength: 60,
          },
          {
            id: "middle_names",
            kind: "short_text",
            label: "Middle names",
            maxLength: 120,
          },
          {
            id: "maiden_name",
            kind: "short_text",
            label: "Maiden name (surname at birth)",
            maxLength: 60,
          },
          {
            id: "former_surname",
            kind: "short_text",
            label: "Former name: surname",
            maxLength: 60,
          },
          {
            id: "former_first",
            kind: "short_text",
            label: "Former name: first",
            maxLength: 60,
          },
        ],
      },
      {
        id: "personal",
        title: "2. Personal information",
        helpText:
          "Answer as it appears on your official documents. Every answer here must still be invented.",
        fields: [
          {
            id: "date_of_birth",
            kind: "date",
            label: "Date of birth",
            required: true,
          },
          {
            id: "sex",
            kind: "single_choice",
            label: "Sex",
            required: true,
            options: ["Male", "Female"],
          },
          {
            id: "height_cm",
            kind: "number",
            label: "Height (cm)",
            min: 50,
            max: 250,
          },
          {
            id: "place_of_birth",
            kind: "short_text",
            label: "Place of birth",
            required: true,
            maxLength: 120,
          },
          {
            id: "country_of_birth",
            kind: "short_text",
            label: "Country of birth",
            required: true,
            maxLength: 120,
          },
          {
            id: "eye_colour",
            kind: "short_text",
            label: "Colour of eyes",
            maxLength: 40,
          },
          {
            id: "hair_colour",
            kind: "short_text",
            label: "Hair colour",
            maxLength: 40,
          },
          {
            id: "marital_status",
            kind: "single_choice",
            label: "Marital status",
            required: true,
            options: [
              "Single",
              "Married",
              "Widowed",
              "Divorced",
              "Separated",
              "Other",
            ],
          },
          {
            id: "occupation",
            kind: "short_text",
            label: "Occupation / profession",
            maxLength: 120,
          },
          {
            id: "home_address",
            kind: "long_text",
            label: "Home address",
            required: true,
            maxLength: 1000,
          },
          {
            id: "mailing_address",
            kind: "long_text",
            label: "Mailing address",
            hint: "If different from home address.",
            maxLength: 1000,
          },
          {
            id: "work_address",
            kind: "long_text",
            label: "Work address",
            hint: "If resident abroad, give a local address instead.",
            maxLength: 1000,
          },
          {
            id: "firm_name",
            kind: "short_text",
            label: "Name of firm / organization",
            maxLength: 120,
          },
          { id: "home_tel", kind: "phone", label: "Home telephone number" },
          { id: "mobile", kind: "phone", label: "Mobile number" },
          { id: "office_tel", kind: "phone", label: "Office telephone number" },
          { id: "email_address", kind: "email", label: "Email address" },
        ],
      },
      {
        id: "married_women",
        title: "3. Married women",
        helpText: "This section appears for married women only.",
        condition: {
          mode: "all",
          rules: [
            { fieldId: "marital_status", values: ["Married"] },
            { fieldId: "sex", values: ["Female"] },
          ],
        },
        fields: [
          {
            id: "present_marriage_date",
            kind: "date",
            label: "Present marriage: date of marriage",
          },
          {
            id: "marriage_place",
            kind: "short_text",
            label: "Present marriage: place of marriage",
            maxLength: 120,
          },
          {
            id: "husband_surname",
            kind: "short_text",
            label: "Husband's surname",
            maxLength: 60,
          },
          {
            id: "husband_first",
            kind: "short_text",
            label: "Husband's first name",
            maxLength: 60,
          },
          {
            id: "husband_nationality",
            kind: "short_text",
            label: "Husband's nationality",
            maxLength: 60,
          },
        ],
      },
      {
        id: "previous_marriages",
        title: "3b. Previous marriages",
        helpText: "One entry per previous marriage, up to three.",
        condition: {
          mode: "all",
          rules: [
            { fieldId: "marital_status", values: ["Married"] },
            { fieldId: "sex", values: ["Female"] },
          ],
        },
        repeat: { min: 0, max: 3 },
        fields: [
          {
            id: "pm_date",
            kind: "date",
            label: "Date of marriage (day/month/year)",
          },
          {
            id: "pm_husband",
            kind: "short_text",
            label: "Husband's name in full",
            maxLength: 120,
          },
          {
            id: "pm_place",
            kind: "short_text",
            label: "Place of marriage",
            maxLength: 120,
          },
          {
            id: "pm_nationality",
            kind: "short_text",
            label: "Husband's nationality",
            maxLength: 60,
          },
        ],
      },
      {
        id: "passport_particulars",
        title: "4. Particulars of passport to be renewed",
        fields: [
          {
            id: "passport_number",
            kind: "short_text",
            label: "Passport number",
            required: true,
            maxLength: 40,
            hint: FAKE_ID_HINT,
          },
          {
            id: "passport_issue_date",
            kind: "date",
            label: "Date of issue (day/month/year)",
            required: true,
          },
          {
            id: "passport_issue_place",
            kind: "short_text",
            label: "Place of issue",
            required: true,
            maxLength: 120,
          },
        ],
      },
      {
        id: "citizenship",
        title: "5. Citizenship information",
        fields: [
          {
            id: "other_citizenship",
            kind: "yes_no",
            label:
              "Are you now or have you ever been a citizen of any country other than the Republic of Trinidad and Tobago?",
            required: true,
          },
        ],
      },
      {
        id: "citizenship_details",
        title: "5b. Other citizenship details",
        condition: {
          mode: "any",
          rules: [{ fieldId: "other_citizenship", values: ["true"] }],
        },
        repeat: { min: 1, max: 4 },
        fields: [
          {
            id: "country",
            kind: "short_text",
            label: "Country",
            required: true,
            maxLength: 120,
          },
          {
            id: "citizenship_by",
            kind: "short_text",
            label: "Citizenship by",
            hint: "Birth, descent, naturalization, and so on.",
            maxLength: 120,
          },
          {
            id: "certificate_no",
            kind: "short_text",
            label: "Certificate number",
            maxLength: 40,
            hint: FAKE_ID_HINT,
          },
          {
            id: "cert_issue_date",
            kind: "date",
            label: "Issue date (day/month/year)",
          },
        ],
      },
      {
        id: "age_band",
        title: "6. Age band",
        helpText:
          "Applicants under 18 need a parent or legal guardian's permission. Choose explicitly; the demo never checks your date of birth.",
        fields: [
          {
            id: "under_18",
            kind: "single_choice",
            label: "Are you under 18 years of age?",
            required: true,
            options: ["Yes, I am under 18", "No, I am 18 or over"],
          },
        ],
      },
      {
        id: "guardian",
        title: "6b. Permission from parent / legal guardian",
        condition: {
          mode: "any",
          rules: [{ fieldId: "under_18", values: ["Yes, I am under 18"] }],
        },
        fields: [
          {
            id: "parent_first",
            kind: "short_text",
            label: "Parent / guardian first name",
            required: true,
            maxLength: 60,
          },
          {
            id: "parent_surname",
            kind: "short_text",
            label: "Parent / guardian surname",
            required: true,
            maxLength: 60,
          },
          {
            id: "relationship",
            kind: "short_text",
            label: "Relationship to applicant",
            hint: "Completes “I am the ___ of the applicant”, e.g. mother, father, legal guardian.",
            required: true,
            maxLength: 60,
          },
          {
            id: "applicant_first",
            kind: "short_text",
            label: "Applicant first name",
            required: true,
            maxLength: 60,
          },
          {
            id: "applicant_surname",
            kind: "short_text",
            label: "Applicant surname",
            required: true,
            maxLength: 60,
          },
          {
            id: "parent_id_number",
            kind: "short_text",
            label: "I.D. / Passport number of parent / legal guardian",
            required: true,
            maxLength: 40,
            hint: FAKE_ID_HINT,
          },
          {
            id: "parent_id_issue_date",
            kind: "date",
            label: "Parent ID date of issue",
          },
          {
            id: "guardian_dated",
            kind: "date",
            label: "Dated",
            required: true,
          },
        ],
      },
      {
        id: "references",
        title: "7. References",
        helpText:
          "Exactly two persons who are not relatives and have known you for at least three years. They may be contacted to confirm your identity.",
        repeat: { min: 2, max: 2 },
        fields: [
          {
            id: "ref_name",
            kind: "short_text",
            label: "Name",
            required: true,
            maxLength: 120,
          },
          {
            id: "ref_tel",
            kind: "phone",
            label: "Telephone contact",
            required: true,
          },
        ],
      },
      {
        id: "declaration",
        title: "8. Declaration of applicant",
        helpText:
          "You declare you are a citizen of Trinidad and Tobago, the statements are true, the photo is a true likeness, and you will report citizenship changes. False statements are an offence punishable by fine and imprisonment. In this demo every detail must still be invented.",
        fields: [
          {
            id: "declarant_name",
            kind: "short_text",
            label: "Full name of declarant",
            required: true,
            maxLength: 120,
          },
          {
            id: "accept",
            kind: "declaration",
            label: "I solemnly make the declaration above",
            required: true,
          },
          { id: "dated", kind: "date", label: "Dated", required: true },
          {
            id: "decl_id_number",
            kind: "short_text",
            label: "I.D. / Passport number",
            required: true,
            maxLength: 40,
            hint: FAKE_ID_HINT,
          },
          {
            id: "decl_id_issue_date",
            kind: "date",
            label: "I.D. date of issue",
            required: true,
          },
          {
            id: "marriage_cert_no",
            kind: "short_text",
            label: "Marriage certificate number",
            maxLength: 40,
          },
          {
            id: "marriage_entry_no",
            kind: "short_text",
            label: "Marriage entry number",
            maxLength: 40,
          },
          {
            id: "marriage_cert_issue_date",
            kind: "date",
            label: "Marriage certificate issue date",
          },
          {
            id: "deed_poll_no",
            kind: "short_text",
            label: "Deed poll number",
            maxLength: 40,
          },
          { id: "deed_poll_dated", kind: "date", label: "Deed poll dated" },
          {
            id: "sworn_declaration",
            kind: "short_text",
            label: "Sworn declaration reference",
            maxLength: 80,
          },
          { id: "sworn_dated", kind: "date", label: "Sworn declaration dated" },
          {
            id: "other_info",
            kind: "long_text",
            label: "Other information (where necessary)",
            maxLength: 2000,
          },
        ],
      },
    ],
  },
}

// Application for Computerized Birth Certificate, RGD 14A (Registrar General).
// Part I is the applicant, Part II the birth record. The official-use block
// (registration and certificate numbers) is filled by officers, not applicants.
const birthCertificate: PilotSeed = {
  slug: "computerized-birth-certificate",
  name: "Computerized birth certificate (RGD 14A)",
  agency: "Registrar General's Department",
  sourceLabel: "Official application form (PDF)",
  sourceUrl:
    "https://foreign.gov.tt/documents/361/Application_for_Computerized_Birth_Certificate.pdf",
  definition: {
    sections: [
      {
        id: "applicant",
        title: "Part I. Applicant information",
        helpText:
          "One free birth certificate per person. Mail-in is for the first free certificate only and must include a photocopy of a valid government-issued ID. If the certificate is not yours or your child's, attach the owner's authorization letter and a copy of their ID.",
        fields: [
          {
            id: "first_name",
            kind: "short_text",
            label: "First name",
            required: true,
            maxLength: 60,
          },
          {
            id: "surname",
            kind: "short_text",
            label: "Surname",
            required: true,
            maxLength: 60,
          },
          {
            id: "address",
            kind: "long_text",
            label: "Address",
            required: true,
            maxLength: 500,
          },
          {
            id: "service_type",
            kind: "single_choice",
            label: "Type of service",
            required: true,
            options: ["Mail In", "Walk In"],
            hint: "Mail In covers home or office delivery; Walk In is collected in person.",
          },
          {
            id: "telephone",
            kind: "phone",
            label: "Telephone number",
            required: true,
            hint: "Reachable between 8:00 am and 4:00 pm.",
          },
          {
            id: "own_certificate",
            kind: "yes_no",
            label: "Are you applying for your own birth certificate?",
            required: true,
          },
          {
            id: "relationship",
            kind: "short_text",
            label: "Relationship to the certificate owner",
            required: true,
            maxLength: 120,
            hint: "Only when the certificate is not yours.",
            condition: {
              mode: "any",
              rules: [{ fieldId: "own_certificate", values: ["false"] }],
            },
          },
          {
            id: "purpose",
            kind: "long_text",
            label: "Purpose for which the certificate is required",
            required: true,
            maxLength: 500,
          },
          {
            id: "id_type",
            kind: "single_choice",
            label: "Type of identification",
            required: true,
            options: ["ID", "DP", "PP"],
            hint: "ID is the national ID card, DP the driver's permit, PP a passport.",
          },
          {
            id: "id_number",
            kind: "short_text",
            label: "Identification number",
            required: true,
            maxLength: 40,
            hint: FAKE_ID_HINT,
          },
        ],
      },
      {
        id: "birth_record",
        title: "Part II. Birth certificate information as registered at birth",
        helpText:
          "Write in capital letters. The certificate cannot issue if the information is incomplete or inaccurate.",
        fields: [
          {
            id: "child_first",
            kind: "short_text",
            label: "First name",
            required: true,
            maxLength: 60,
          },
          {
            id: "child_middle",
            kind: "short_text",
            label: "Middle names",
            maxLength: 120,
          },
          {
            id: "sex",
            kind: "single_choice",
            label: "Sex",
            required: true,
            options: ["Male", "Female"],
          },
          {
            id: "date_of_birth",
            kind: "date",
            label: "Date of birth (day / month / year)",
            required: true,
          },
          {
            id: "place_of_birth",
            kind: "short_text",
            label: "Place of birth",
            hint: "Full address or name of hospital.",
            required: true,
            maxLength: 200,
          },
          {
            id: "mother_first",
            kind: "short_text",
            label: "Mother's first name",
            required: true,
            maxLength: 60,
          },
          {
            id: "mother_surname",
            kind: "short_text",
            label: "Mother's current surname",
            required: true,
            maxLength: 60,
          },
          {
            id: "mother_maiden",
            kind: "short_text",
            label: "Mother's maiden name",
            required: true,
            maxLength: 60,
          },
          {
            id: "father_first",
            kind: "short_text",
            label: "Father's first name",
            required: true,
            maxLength: 60,
          },
          {
            id: "father_surname",
            kind: "short_text",
            label: "Father's surname",
            required: true,
            maxLength: 60,
          },
          {
            id: "application_date",
            kind: "date",
            label: "Date of application",
            required: true,
          },
          {
            id: "certify",
            kind: "declaration",
            label:
              "I certify I am legally entitled to, or authorized to apply for, this certificate",
            required: true,
          },
        ],
      },
    ],
  },
}

// NI 4, register as an employed person (NIBTT). Held as the swap-in
// alternate. Question numbers follow the paper. The employer block at the end
// is completed by the employer on paper; here its fields are optional.
const nisRegistration: PilotSeed = {
  slug: "nis-ni4",
  name: "NIS registration as an employed person (NI 4)",
  agency: "National Insurance Board",
  sourceLabel: "Official NI 4 form (PDF)",
  sourceUrl: "https://www.nibtt.net/NI_Forms/NI4.pdf",
  definition: {
    sections: [
      {
        id: "identity",
        title: "Identity",
        helpText:
          "Type or write in block letters. If you do not know your father's name or mother's maiden name, write “not known”. Employers must register new staff within 14 days.",
        fields: [
          {
            id: "surname",
            kind: "short_text",
            label: "Surname",
            required: true,
            maxLength: 60,
          },
          {
            id: "first_name",
            kind: "short_text",
            label: "First name",
            required: true,
            maxLength: 60,
          },
          {
            id: "middle_name",
            kind: "short_text",
            label: "Middle name",
            maxLength: 60,
          },
          {
            id: "birth_name",
            kind: "short_text",
            label: "Name at birth, if different",
            hint: "Changed by deed poll or marriage.",
            maxLength: 120,
          },
          {
            id: "other_names",
            kind: "short_text",
            label: "Other names by which known",
            maxLength: 120,
          },
          {
            id: "apprentice",
            kind: "yes_no",
            label: "Are you an apprentice?",
            required: true,
          },
          {
            id: "gender",
            kind: "single_choice",
            label: "Gender",
            required: true,
            options: ["Male", "Female"],
          },
          {
            id: "home_address",
            kind: "long_text",
            label: "Home address",
            required: true,
            maxLength: 500,
          },
          { id: "telephone", kind: "phone", label: "Telephone number" },
          {
            id: "date_of_birth",
            kind: "date",
            label: "Date of birth",
            required: true,
          },
          {
            id: "place_of_birth",
            kind: "short_text",
            label: "Place of birth",
            required: true,
            maxLength: 120,
          },
          {
            id: "multiple_birth",
            kind: "yes_no",
            label: "Multiple birth?",
            required: true,
          },
        ],
      },
      {
        id: "siblings",
        title: "Multiple-birth siblings",
        condition: {
          mode: "any",
          rules: [{ fieldId: "multiple_birth", values: ["true"] }],
        },
        repeat: { min: 1, max: 2 },
        fields: [
          {
            id: "sib_surname",
            kind: "short_text",
            label: "Sibling surname",
            required: true,
            maxLength: 60,
          },
          {
            id: "sib_other_names",
            kind: "short_text",
            label: "Sibling other names",
            maxLength: 120,
          },
        ],
      },
      {
        id: "same_name",
        title: "Family members with the same name",
        fields: [
          {
            id: "same_name",
            kind: "yes_no",
            label: "Any family members with the same name?",
            required: true,
          },
        ],
      },
      {
        id: "same_name_details",
        title: "Same-name details",
        condition: {
          mode: "any",
          rules: [{ fieldId: "same_name", values: ["true"] }],
        },
        repeat: { min: 1, max: 2 },
        fields: [
          {
            id: "rel_relationship",
            kind: "short_text",
            label: "Relationship",
            required: true,
            maxLength: 60,
          },
          {
            id: "rel_dob",
            kind: "date",
            label: "Date of birth",
            required: true,
          },
        ],
      },
      {
        id: "parents_id",
        title: "Parents and identification",
        fields: [
          {
            id: "father_name",
            kind: "short_text",
            label: "Father's name",
            required: true,
            maxLength: 120,
          },
          {
            id: "mother_maiden",
            kind: "short_text",
            label: "Mother's maiden name",
            required: true,
            maxLength: 120,
          },
          {
            id: "id_document",
            kind: "single_choice",
            label: "Valid identification document (one only)",
            required: true,
            options: [
              "Electoral Identification Card",
              "Driver's Permit",
              "Passport",
            ],
          },
          {
            id: "id_expiry",
            kind: "date",
            label: "ID expiry date",
            required: true,
          },
          {
            id: "marital_status",
            kind: "single_choice",
            label: "Marital status",
            required: true,
            options: [
              "Single",
              "Married",
              "Widowed",
              "Divorced",
              "Separated",
              "Common Law",
            ],
          },
          {
            id: "spouse_surname",
            kind: "short_text",
            label: "Common-law spouse surname",
            required: true,
            maxLength: 60,
            condition: {
              mode: "any",
              rules: [{ fieldId: "marital_status", values: ["Common Law"] }],
            },
          },
          {
            id: "spouse_first",
            kind: "short_text",
            label: "Common-law spouse first name",
            required: true,
            maxLength: 60,
            condition: {
              mode: "any",
              rules: [{ fieldId: "marital_status", values: ["Common Law"] }],
            },
          },
        ],
      },
      {
        id: "employment",
        title: "Employment",
        fields: [
          {
            id: "employer_name",
            kind: "short_text",
            label: "Business name of employer",
            required: true,
            maxLength: 120,
          },
          {
            id: "employer_address",
            kind: "long_text",
            label: "Address of employer",
            required: true,
            maxLength: 500,
          },
          {
            id: "occupation",
            kind: "short_text",
            label: "Occupation",
            required: true,
            maxLength: 120,
          },
          {
            id: "pay_frequency",
            kind: "single_choice",
            label: "Pay frequency",
            required: true,
            options: ["Weekly", "Fortnightly", "Monthly", "Daily"],
          },
          {
            id: "first_employment",
            kind: "date",
            label: "First date of employment",
            required: true,
          },
          {
            id: "prev_registered",
            kind: "yes_no",
            label: "Have you been previously registered?",
            required: true,
          },
          {
            id: "ni_number",
            kind: "short_text",
            label: "N.I. number",
            required: true,
            maxLength: 40,
            hint: FAKE_ID_HINT,
            condition: {
              mode: "any",
              rules: [{ fieldId: "prev_registered", values: ["true"] }],
            },
          },
          {
            id: "employed_elsewhere",
            kind: "yes_no",
            label: "Are you currently employed elsewhere?",
            required: true,
          },
          {
            id: "other_employer_name",
            kind: "short_text",
            label: "Other employer business name",
            required: true,
            maxLength: 120,
            condition: {
              mode: "any",
              rules: [{ fieldId: "employed_elsewhere", values: ["true"] }],
            },
          },
          {
            id: "other_employer_address",
            kind: "long_text",
            label: "Other employer address",
            required: true,
            maxLength: 500,
            condition: {
              mode: "any",
              rules: [{ fieldId: "employed_elsewhere", values: ["true"] }],
            },
          },
        ],
      },
      {
        id: "declaration",
        title: "Declaration",
        helpText:
          "False statements carry a fine of $3,000 and up to two years' imprisonment under the NI Act. In this demo every detail must still be invented.",
        fields: [
          {
            id: "accept",
            kind: "declaration",
            label:
              "I solemnly and sincerely declare I am the applicant named here and these particulars are true",
            required: true,
          },
          { id: "declared_date", kind: "date", label: "Date declared" },
        ],
      },
      {
        id: "employer",
        title: "Employer verification",
        helpText:
          "On paper the employer verifies, signs, and stamps here. In this demo these fields are optional.",
        fields: [
          {
            id: "employer_verified",
            kind: "yes_no",
            label: "Was information verified by employer?",
          },
          {
            id: "employer_reg_no",
            kind: "short_text",
            label: "Employer's registration number",
            maxLength: 40,
          },
          {
            id: "designation",
            kind: "short_text",
            label: "Designation",
            maxLength: 120,
          },
        ],
      },
    ],
  },
}

export const pilotSeeds: PilotSeed[] = [
  certificateOfCharacter,
  passportRenewal,
  birthCertificate,
  nisRegistration,
]
