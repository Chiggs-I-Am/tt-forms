import type { FormDefinition } from "./formModel";

// 1:1 transcriptions of the official paper/portal forms for #35. Every
// question below appears on the official form with the same meaning; online
// rewrites are limited to hints and help text. Identity-number fields use
// guided-fake-input (placeholder examples plus helper text, no format
// validation). Anything the demo cannot model yet (handwritten signatures,
// employer stamps, official station lists) is an optional field or an
// explicit note, never a required step.

const fakeIdHint =
  "Invent a number. Never type a real ID, passport, or permit number.";
const fiveMb = 5_242_880;
const firstNameLabel = "First name";
const homeAddressLabel = "Home address";
const emailAddressLabel = "Email address";
const telephoneLabel = "Telephone number";
const dateOfBirthLabel = "Date of birth";
const placeOfBirthLabel = "Place of birth";
const commonLaw = "Common Law";

export interface PilotSeed {
  slug: string;
  name: string;
  agency: string;
  sourceLabel: string;
  sourceUrl: string;
  definition: FormDefinition;
}

// Certificate of Character (TTPS portal, https://services.ttps.gov.tt/coc).
// Portal fields per research: names, address, contact, ID type + number, occupation, purpose, photo upload, appointment date and station choice.
// The portal's station dropdown is a free-text field here until the station
// list is modeled; the section note says so.
const certificateOfCharacter: PilotSeed = {
  agency: "Trinidad and Tobago Police Service",
  definition: {
    sections: [
      {
        fields: [
          {
            id: "first_name",
            kind: "short_text",
            label: firstNameLabel,
            maxLength: 60,
            required: true,
          },
          {
            id: "last_name",
            kind: "short_text",
            label: "Last name",
            maxLength: 60,
            required: true,
          },
          {
            id: "home_address",
            kind: "long_text",
            label: homeAddressLabel,
            maxLength: 500,
            required: true,
          },
          {
            id: "phone",
            kind: "phone",
            label: telephoneLabel,
            required: true,
          },
          {
            id: "email",
            kind: "email",
            label: emailAddressLabel,
            required: true,
          },
        ],
        helpText: "Fee TT$50, processing takes about 2-3 weeks.",
        id: "personal",
        title: "Personal details",
      },
      {
        fields: [
          {
            id: "id_type",
            kind: "single_choice",
            label: "ID type",
            options: ["National ID", "Passport", "Driver's Permit"],
            required: true,
          },
          {
            hint: fakeIdHint,
            id: "id_number",
            kind: "short_text",
            label: "ID number",
            maxLength: 40,
            placeholder: "e.g. FAKE-482913",
            required: true,
          },
        ],
        id: "identification",
        title: "Identification",
      },
      {
        fields: [
          {
            id: "occupation",
            kind: "short_text",
            label: "Occupation",
            maxLength: 120,
            required: true,
          },
          {
            id: "purpose",
            kind: "long_text",
            label: "Purpose for the certificate",
            maxLength: 1000,
            required: true,
          },
        ],
        id: "background",
        title: "Background",
      },
      {
        fields: [
          {
            hint: "Never upload a real ID photo. Any image stands in.",
            id: "photo_upload",
            kind: "upload",
            label: "Recent photograph",
            maxSizeBytes: fiveMb,
            required: true,
          },
        ],
        helpText:
          "Upload a stand-in image. Images and PDF only, about 5MB max.",
        id: "photo",
        title: "Photograph",
      },
      {
        fields: [
          {
            id: "appointment_date",
            kind: "date",
            label: "Appointment date",
            required: true,
          },
          {
            hint: 'As listed on the portal, e.g. "Port of Spain".',
            id: "police_station",
            kind: "short_text",
            label: "Police station",
            maxLength: 120,
            required: true,
          },
        ],
        helpText:
          "The portal offers a station list; until it is modeled, type the station name.",
        id: "appointment",
        title: "Appointment",
      },
    ],
  },
  name: "Certificate of Character",
  slug: "certificate-of-character",
  sourceLabel: "TTPS Certificate of Character portal",
  sourceUrl: "https://services.ttps.gov.tt/coc",
};

// Adult passport renewal, 16 and over (Immigration Division print form).
// Sections 1-8 follow the paper numbering; the official-use block at the top
// (receipt, passport number, dates) is filled by officers, not applicants.
const passportRenewal: PilotSeed = {
  agency: "Immigration Division",
  definition: {
    sections: [
      {
        fields: [
          {
            id: "surname",
            kind: "short_text",
            label: "Surname",
            maxLength: 60,
            required: true,
          },
          {
            id: "first_name",
            kind: "short_text",
            label: firstNameLabel,
            maxLength: 60,
            required: true,
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
        id: "names",
        title: "1. Names",
      },
      {
        fields: [
          {
            id: "date_of_birth",
            kind: "date",
            label: dateOfBirthLabel,
            required: true,
          },
          {
            id: "sex",
            kind: "single_choice",
            label: "Sex",
            options: ["Male", "Female"],
            required: true,
          },
          {
            id: "height_cm",
            kind: "number",
            label: "Height (cm)",
            max: 250,
            min: 50,
          },
          {
            id: "place_of_birth",
            kind: "short_text",
            label: placeOfBirthLabel,
            maxLength: 120,
            required: true,
          },
          {
            id: "country_of_birth",
            kind: "short_text",
            label: "Country of birth",
            maxLength: 120,
            required: true,
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
            options: [
              "Single",
              "Married",
              "Widowed",
              "Divorced",
              "Separated",
              "Other",
            ],
            required: true,
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
            label: homeAddressLabel,
            maxLength: 1000,
            required: true,
          },
          {
            hint: "If different from home address.",
            id: "mailing_address",
            kind: "long_text",
            label: "Mailing address",
            maxLength: 1000,
          },
          {
            hint: "If resident abroad, give a local address instead.",
            id: "work_address",
            kind: "long_text",
            label: "Work address",
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
          { id: "email_address", kind: "email", label: emailAddressLabel },
        ],
        helpText:
          "Answer as it appears on your official documents. Every answer here must still be invented.",
        id: "personal",
        title: "2. Personal information",
      },
      {
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
          {
            id: "pm_date",
            kind: "date",
            label: "Previous marriage: date of marriage (day/month/year)",
          },
          {
            id: "pm_husband",
            kind: "short_text",
            label: "Previous marriage: husband's name in full",
            maxLength: 120,
          },
          {
            id: "pm_place",
            kind: "short_text",
            label: "Previous marriage: place of marriage",
            maxLength: 120,
          },
          {
            id: "pm_nationality",
            kind: "short_text",
            label: "Previous marriage: husband's nationality",
            maxLength: 60,
          },
        ],
        helpText:
          "This section appears for married women only. Previous marriages follow below, one entry each, up to three.",
        id: "married_women",
        repeat: { max: 3, min: 0 },
        repeatFields: ["pm_date", "pm_husband", "pm_place", "pm_nationality"],
        title: "3. Married women",
      },
      {
        fields: [
          {
            hint: fakeIdHint,
            id: "passport_number",
            kind: "short_text",
            label: "Passport number",
            maxLength: 40,
            placeholder: "e.g. FAKE-T482913",
            required: true,
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
            maxLength: 120,
            required: true,
          },
        ],
        id: "passport_particulars",
        title: "4. Particulars of passport to be renewed",
      },
      {
        fields: [
          {
            id: "other_citizenship",
            kind: "yes_no",
            label:
              "Are you now or have you ever been a citizen of any country other than the Republic of Trinidad and Tobago?",
            required: true,
          },
        ],
        id: "citizenship",
        title: "5. Citizenship information",
      },
      {
        condition: {
          mode: "any",
          rules: [{ fieldId: "other_citizenship", values: ["true"] }],
        },
        fields: [
          {
            id: "country",
            kind: "short_text",
            label: "Country",
            maxLength: 120,
            required: true,
          },
          {
            hint: "Birth, descent, naturalization, and so on.",
            id: "citizenship_by",
            kind: "short_text",
            label: "Citizenship by",
            maxLength: 120,
          },
          {
            hint: fakeIdHint,
            id: "certificate_no",
            kind: "short_text",
            label: "Certificate number",
            maxLength: 40,
            placeholder: "e.g. FAKE-C771204",
          },
          {
            id: "cert_issue_date",
            kind: "date",
            label: "Issue date (day/month/year)",
          },
        ],
        helpText:
          "Part of paper section 5. Appears only when other citizenship is declared, one entry per country.",
        id: "citizenship_details",
        repeat: { max: 4, min: 1 },
        title: "5. Citizenship details (continued)",
      },
      {
        fields: [
          {
            id: "under_18",
            kind: "single_choice",
            label: "Are you under 18 years of age?",
            options: ["Yes, I am under 18", "No, I am 18 or over"],
            required: true,
          },
        ],
        helpText:
          "Demo gate, not a paper section: the paper has no such question and officers check age from documents. Applicants under 18 need a parent or legal guardian's permission, so choose explicitly; the demo never checks your date of birth.",
        id: "age_band",
        title: "Age check",
      },
      {
        condition: {
          mode: "any",
          rules: [{ fieldId: "under_18", values: ["Yes, I am under 18"] }],
        },
        fields: [
          {
            id: "parent_first",
            kind: "short_text",
            label: "Parent / guardian first name",
            maxLength: 60,
            required: true,
          },
          {
            id: "parent_surname",
            kind: "short_text",
            label: "Parent / guardian surname",
            maxLength: 60,
            required: true,
          },
          {
            hint: "Completes “I am the ___ of the applicant”, e.g. mother, father, legal guardian.",
            id: "relationship",
            kind: "short_text",
            label: "Relationship to applicant",
            maxLength: 60,
            required: true,
          },
          {
            id: "applicant_first",
            kind: "short_text",
            label: "Applicant first name",
            maxLength: 60,
            required: true,
          },
          {
            id: "applicant_surname",
            kind: "short_text",
            label: "Applicant surname",
            maxLength: 60,
            required: true,
          },
          {
            hint: fakeIdHint,
            id: "parent_id_number",
            kind: "short_text",
            label: "I.D. / Passport number of parent / legal guardian",
            maxLength: 40,
            placeholder: "e.g. FAKE-905517",
            required: true,
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
        helpText: "Appears for applicants under 18 only.",
        id: "guardian",
        title: "6. Permission from parent / legal guardian",
      },
      {
        fields: [
          {
            id: "ref_name",
            kind: "short_text",
            label: "Name",
            maxLength: 120,
            required: true,
          },
          {
            id: "ref_tel",
            kind: "phone",
            label: "Telephone contact",
            required: true,
          },
        ],
        helpText:
          "Exactly two persons who are not relatives and have known you for at least three years. They may be contacted to confirm your identity.",
        id: "references",
        repeat: { max: 2, min: 2 },
        title: "7. References",
      },
      {
        fields: [
          {
            id: "declarant_name",
            kind: "short_text",
            label: "Full name of declarant",
            maxLength: 120,
            required: true,
          },
          {
            id: "accept",
            kind: "declaration",
            label: "I solemnly make the declaration above",
            required: true,
          },
          { id: "dated", kind: "date", label: "Dated", required: true },
          {
            hint: fakeIdHint,
            id: "decl_id_number",
            kind: "short_text",
            label: "I.D. / Passport number",
            maxLength: 40,
            placeholder: "e.g. FAKE-318840",
            required: true,
          },
          {
            id: "decl_id_issue_date",
            kind: "date",
            label: "I.D. date of issue",
            required: true,
          },
          {
            hint: fakeIdHint,
            id: "marriage_cert_no",
            kind: "short_text",
            label: "Marriage certificate number",
            maxLength: 40,
            placeholder: "e.g. FAKE-M552010",
          },
          {
            hint: fakeIdHint,
            id: "marriage_entry_no",
            kind: "short_text",
            label: "Marriage entry number",
            maxLength: 40,
            placeholder: "e.g. FAKE-E209874",
          },
          {
            id: "marriage_cert_issue_date",
            kind: "date",
            label: "Marriage certificate issue date",
          },
          {
            hint: fakeIdHint,
            id: "deed_poll_no",
            kind: "short_text",
            label: "Deed poll number",
            maxLength: 40,
            placeholder: "e.g. FAKE-D664102",
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
        helpText:
          "You declare you are a citizen of Trinidad and Tobago, the statements are true, the photo is a true likeness, and you will report citizenship changes. False statements are an offence punishable by fine and imprisonment. In this demo every detail must still be invented.",
        id: "declaration",
        title: "8. Declaration of applicant",
      },
    ],
  },
  name: "Adult passport renewal (16 and over)",
  slug: "adult-passport-renewal",
  sourceLabel: "Official renewal application form (PDF)",
  sourceUrl:
    "https://foreign.gov.tt/documents/1752/ADULT_RENEWAL_APPLICATION_FORM_FOR_TRINIDAD_AND_TOBAGO_PASSPORT.pdf",
};

// Application for Computerized Birth Certificate, RGD 14A (Registrar General).
// Part I is the applicant, Part II the birth record. The official-use block
// (registration and certificate numbers) is filled by officers, not applicants.
const birthCertificate: PilotSeed = {
  agency: "Registrar General's Department",
  definition: {
    sections: [
      {
        fields: [
          {
            id: "first_name",
            kind: "short_text",
            label: firstNameLabel,
            maxLength: 60,
            required: true,
          },
          {
            id: "surname",
            kind: "short_text",
            label: "Surname",
            maxLength: 60,
            required: true,
          },
          {
            id: "address",
            kind: "long_text",
            label: "Address",
            maxLength: 500,
            required: true,
          },
          {
            hint: "Mail In covers home or office delivery; Walk In is collected in person.",
            id: "service_type",
            kind: "single_choice",
            label: "Type of service",
            options: ["Mail In", "Walk In"],
            required: true,
          },
          {
            hint: "Reachable between 8:00 am and 4:00 pm.",
            id: "telephone",
            kind: "phone",
            label: telephoneLabel,
            required: true,
          },
          {
            id: "own_certificate",
            kind: "yes_no",
            label: "Are you applying for your own birth certificate?",
            required: true,
          },
          {
            condition: {
              mode: "any",
              rules: [{ fieldId: "own_certificate", values: ["false"] }],
            },
            hint: "Only when the certificate is not yours.",
            id: "relationship",
            kind: "short_text",
            label: "Relationship to the certificate owner",
            maxLength: 120,
            required: true,
          },
          {
            id: "purpose",
            kind: "long_text",
            label: "Purpose for which the certificate is required",
            maxLength: 500,
            required: true,
          },
          {
            hint: "ID is the national ID card, DP the driver's permit, PP a passport.",
            id: "id_type",
            kind: "single_choice",
            label: "Type of identification",
            options: ["ID", "DP", "PP"],
            required: true,
          },
          {
            hint: fakeIdHint,
            id: "id_number",
            kind: "short_text",
            label: "Identification number",
            maxLength: 40,
            placeholder: "e.g. FAKE-730195",
            required: true,
          },
        ],
        helpText:
          "One free birth certificate per person. Mail-in is for the first free certificate only and must include a photocopy of a valid government-issued ID. If the certificate is not yours or your child's, attach the owner's authorization letter and a copy of their ID.",
        id: "applicant",
        title: "Part I. Applicant information",
      },
      {
        fields: [
          {
            id: "child_first",
            kind: "short_text",
            label: firstNameLabel,
            maxLength: 60,
            required: true,
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
            options: ["Male", "Female"],
            required: true,
          },
          {
            id: "date_of_birth",
            kind: "date",
            label: "Date of birth (day / month / year)",
            required: true,
          },
          {
            hint: "Full address or name of hospital.",
            id: "place_of_birth",
            kind: "short_text",
            label: placeOfBirthLabel,
            maxLength: 200,
            required: true,
          },
          {
            id: "mother_first",
            kind: "short_text",
            label: "Mother's first name",
            maxLength: 60,
            required: true,
          },
          {
            id: "mother_surname",
            kind: "short_text",
            label: "Mother's current surname",
            maxLength: 60,
            required: true,
          },
          {
            id: "mother_maiden",
            kind: "short_text",
            label: "Mother's maiden name",
            maxLength: 60,
            required: true,
          },
          {
            id: "father_first",
            kind: "short_text",
            label: "Father's first name",
            maxLength: 60,
            required: true,
          },
          {
            id: "father_surname",
            kind: "short_text",
            label: "Father's surname",
            maxLength: 60,
            required: true,
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
        helpText:
          "Write in capital letters. The certificate cannot issue if the information is incomplete or inaccurate.",
        id: "birth_record",
        title: "Part II. Birth certificate information as registered at birth",
      },
    ],
  },
  name: "Computerized birth certificate (RGD 14A)",
  slug: "computerized-birth-certificate",
  sourceLabel: "Official application form (PDF)",
  sourceUrl:
    "https://foreign.gov.tt/documents/361/Application_for_Computerized_Birth_Certificate.pdf",
};

// NI 4, register as an employed person (NIBTT). Held as the swap-in
// alternate. Question numbers follow the paper. The employer block at the end
// is completed by the employer on paper; here its fields are optional.
const nisRegistration: PilotSeed = {
  agency: "National Insurance Board",
  definition: {
    sections: [
      {
        fields: [
          {
            id: "surname",
            kind: "short_text",
            label: "Surname",
            maxLength: 60,
            required: true,
          },
          {
            id: "first_name",
            kind: "short_text",
            label: firstNameLabel,
            maxLength: 60,
            required: true,
          },
          {
            id: "middle_name",
            kind: "short_text",
            label: "Middle name",
            maxLength: 60,
          },
          {
            hint: "Changed by deed poll or marriage.",
            id: "birth_name",
            kind: "short_text",
            label: "Name at birth, if different",
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
            options: ["Male", "Female"],
            required: true,
          },
          {
            id: "home_address",
            kind: "long_text",
            label: homeAddressLabel,
            maxLength: 500,
            required: true,
          },
          { id: "telephone", kind: "phone", label: telephoneLabel },
          {
            id: "date_of_birth",
            kind: "date",
            label: dateOfBirthLabel,
            required: true,
          },
          {
            id: "place_of_birth",
            kind: "short_text",
            label: placeOfBirthLabel,
            maxLength: 120,
            required: true,
          },
          {
            id: "multiple_birth",
            kind: "yes_no",
            label: "Multiple birth?",
            required: true,
          },
        ],
        helpText:
          "Type or write in block letters. If you do not know your father's name or mother's maiden name, write “not known”. Employers must register new staff within 14 days.",
        id: "identity",
        title: "Identity",
      },
      {
        condition: {
          mode: "any",
          rules: [{ fieldId: "multiple_birth", values: ["true"] }],
        },
        fields: [
          {
            id: "sib_surname",
            kind: "short_text",
            label: "Sibling surname",
            maxLength: 60,
            required: true,
          },
          {
            id: "sib_other_names",
            kind: "short_text",
            label: "Sibling other names",
            maxLength: 120,
          },
        ],
        helpText: "Appears for multiple births only, one entry per sibling.",
        id: "siblings",
        repeat: { max: 2, min: 1 },
        title: "Multiple-birth siblings",
      },
      {
        fields: [
          {
            id: "same_name",
            kind: "yes_no",
            label: "Any family members with the same name?",
            required: true,
          },
        ],
        id: "same_name",
        title: "Family members with the same name",
      },
      {
        condition: {
          mode: "any",
          rules: [{ fieldId: "same_name", values: ["true"] }],
        },
        fields: [
          {
            id: "rel_relationship",
            kind: "short_text",
            label: "Relationship",
            maxLength: 60,
            required: true,
          },
          {
            id: "rel_dob",
            kind: "date",
            label: dateOfBirthLabel,
            required: true,
          },
        ],
        helpText: "Appears only when a family member shares your name.",
        id: "same_name_details",
        repeat: { max: 2, min: 1 },
        title: "Same-name details",
      },
      {
        fields: [
          {
            id: "father_name",
            kind: "short_text",
            label: "Father's name",
            maxLength: 120,
            required: true,
          },
          {
            id: "mother_maiden",
            kind: "short_text",
            label: "Mother's maiden name",
            maxLength: 120,
            required: true,
          },
          {
            id: "id_document",
            kind: "single_choice",
            label: "Valid identification document (one only)",
            options: [
              "Electoral Identification Card",
              "Driver's Permit",
              "Passport",
            ],
            required: true,
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
            options: [
              "Single",
              "Married",
              "Widowed",
              "Divorced",
              "Separated",
              commonLaw,
            ],
            required: true,
          },
          {
            condition: {
              mode: "any",
              rules: [{ fieldId: "marital_status", values: [commonLaw] }],
            },
            id: "spouse_surname",
            kind: "short_text",
            label: "Common-law spouse surname",
            maxLength: 60,
            required: true,
          },
          {
            condition: {
              mode: "any",
              rules: [{ fieldId: "marital_status", values: [commonLaw] }],
            },
            id: "spouse_first",
            kind: "short_text",
            label: "Common-law spouse first name",
            maxLength: 60,
            required: true,
          },
        ],
        id: "parents_id",
        title: "Parents and identification",
      },
      {
        fields: [
          {
            id: "employer_name",
            kind: "short_text",
            label: "Business name of employer",
            maxLength: 120,
            required: true,
          },
          {
            id: "employer_address",
            kind: "long_text",
            label: "Address of employer",
            maxLength: 500,
            required: true,
          },
          {
            id: "occupation",
            kind: "short_text",
            label: "Occupation",
            maxLength: 120,
            required: true,
          },
          {
            id: "pay_frequency",
            kind: "single_choice",
            label: "Pay frequency",
            options: ["Weekly", "Fortnightly", "Monthly", "Daily"],
            required: true,
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
            condition: {
              mode: "any",
              rules: [{ fieldId: "prev_registered", values: ["true"] }],
            },
            hint: fakeIdHint,
            id: "ni_number",
            kind: "short_text",
            label: "N.I. number",
            maxLength: 40,
            placeholder: "e.g. FAKE-NI884201",
            required: true,
          },
          {
            id: "employed_elsewhere",
            kind: "yes_no",
            label: "Are you currently employed elsewhere?",
            required: true,
          },
          {
            condition: {
              mode: "any",
              rules: [{ fieldId: "employed_elsewhere", values: ["true"] }],
            },
            id: "other_employer_name",
            kind: "short_text",
            label: "Other employer business name",
            maxLength: 120,
            required: true,
          },
          {
            condition: {
              mode: "any",
              rules: [{ fieldId: "employed_elsewhere", values: ["true"] }],
            },
            id: "other_employer_address",
            kind: "long_text",
            label: "Other employer address",
            maxLength: 500,
            required: true,
          },
        ],
        id: "employment",
        title: "Employment",
      },
      {
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
        helpText:
          "False statements carry a fine of $3,000 and up to two years' imprisonment under the NI Act. In this demo every detail must still be invented.",
        id: "declaration",
        title: "Declaration",
      },
      {
        fields: [
          {
            id: "employer_verified",
            kind: "yes_no",
            label: "Was information verified by employer?",
          },
          {
            hint: fakeIdHint,
            id: "employer_reg_no",
            kind: "short_text",
            label: "Employer's registration number",
            maxLength: 40,
            placeholder: "e.g. FAKE-R110987",
          },
          {
            id: "designation",
            kind: "short_text",
            label: "Designation",
            maxLength: 120,
          },
        ],
        helpText:
          "On paper the employer verifies, signs, and stamps here. In this demo these fields are optional.",
        id: "employer",
        title: "Employer verification",
      },
    ],
  },
  name: "NIS registration as an employed person (NI 4)",
  slug: "nis-ni4",
  sourceLabel: "Official NI 4 form (PDF)",
  sourceUrl: "https://www.nibtt.net/NI_Forms/NI4.pdf",
};

export const pilotSeeds: PilotSeed[] = [
  certificateOfCharacter,
  passportRenewal,
  birthCertificate,
  nisRegistration,
];
