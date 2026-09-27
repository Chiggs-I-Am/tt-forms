// Pilot-form catalog for #34. Static data: the three official forms this demo
// is modeled on, plus the swap-in alternate. Sources are the real government
// pages and PDFs the questions come from (spec user story 1). Cards link to
// the full applicant fill view; answers stay local until sign-in (#36).

export interface PilotForm {
  slug: string;
  name: string;
  agency: string;
  sourceLabel: string;
  sourceUrl: string;
  summary: string;
  sections: string[];
  keywords: string[];
  alternate?: boolean;
}

const personalDetails = "Personal details";

export const pilotForms: PilotForm[] = [
  {
    agency: "Trinidad and Tobago Police Service",
    keywords: [
      "police",
      "clearance",
      "coc",
      "character",
      "record",
      "employment",
    ],
    name: "Certificate of Character",
    sections: [
      personalDetails,
      "ID type and number",
      "Photo upload",
      "Appointment date and station",
    ],
    slug: "certificate-of-character",
    sourceLabel: "TTPS Certificate of Character portal",
    sourceUrl: "https://services.ttps.gov.tt/coc",
    summary:
      "Police clearance for employment and travel. Personal details, ID type and number, a photo, and an appointment date with station choice.",
  },
  {
    agency: "Immigration Division",
    keywords: ["passport", "renewal", "travel", "immigration", "references"],
    name: "Adult passport renewal (16+)",
    sections: [
      personalDetails,
      "Conditional follow-ups",
      "Two references",
      "Declaration",
    ],
    slug: "adult-passport-renewal",
    sourceLabel: "Official renewal form (PDF)",
    sourceUrl:
      "https://foreign.gov.tt/documents/1752/ADULT_RENEWAL_APPLICATION_FORM_FOR_TRINIDAD_AND_TOBAGO_PASSPORT.pdf",
    summary:
      "Renewal for nationals 16 and over. A long multi-section form with conditional questions, exactly two references, and a declaration.",
  },
  {
    agency: "Registrar General's Department",
    keywords: ["birth", "certificate", "rgd", "registrar", "14a"],
    name: "Computerized birth certificate (RGD 14A)",
    sections: [
      "Applicant details",
      "Third-party application",
      "ID type and purpose",
    ],
    slug: "computerized-birth-certificate",
    sourceLabel: "Official application form (PDF)",
    sourceUrl:
      "https://foreign.gov.tt/documents/361/Application_for_Computerized_Birth_Certificate.pdf",
    summary:
      "Request a computerized birth certificate, including third-party applications. ID-type select and a stated purpose.",
  },
  {
    agency: "National Insurance Board",
    alternate: true,
    keywords: ["nis", "nib", "insurance", "employed", "ni4"],
    name: "NIS registration (NI 4)",
    sections: ["Employment details", personalDetails, "Declaration"],
    slug: "nis-ni4",
    sourceLabel: "Official NI 4 form (PDF)",
    sourceUrl: "https://www.nibtt.net/NI_4.pdf",
    summary:
      "Register as an employed person. Held as the swap-in alternate if one of the three pilots proves awkward to model.",
  },
];

export const getForm = (slug: string): PilotForm | undefined =>
  pilotForms.find((form) => form.slug === slug);
