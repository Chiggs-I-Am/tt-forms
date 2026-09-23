// Pilot-form catalog for #34. Static data: the three official forms this demo
// is modeled on, plus the swap-in alternate. Sources are the real government
// pages and PDFs the questions come from (spec user story 1). Cards link to
// the full applicant fill view; answers stay local until sign-in (#36).

export interface PilotForm {
  slug: string
  name: string
  agency: string
  sourceLabel: string
  sourceUrl: string
  summary: string
  sections: string[]
  keywords: string[]
  alternate?: boolean
}

export const pilotForms: PilotForm[] = [
  {
    slug: "certificate-of-character",
    name: "Certificate of Character",
    agency: "Trinidad and Tobago Police Service",
    sourceLabel: "TTPS Certificate of Character portal",
    sourceUrl: "https://services.ttps.gov.tt/coc",
    summary:
      "Police clearance for employment and travel. Personal details, ID type and number, a photo, and an appointment date with station choice.",
    sections: [
      "Personal details",
      "ID type and number",
      "Photo upload",
      "Appointment date and station",
    ],
    keywords: [
      "police",
      "clearance",
      "coc",
      "character",
      "record",
      "employment",
    ],
  },
  {
    slug: "adult-passport-renewal",
    name: "Adult passport renewal (16+)",
    agency: "Immigration Division",
    sourceLabel: "Official renewal form (PDF)",
    sourceUrl:
      "https://foreign.gov.tt/documents/1752/ADULT_RENEWAL_APPLICATION_FORM_FOR_TRINIDAD_AND_TOBAGO_PASSPORT.pdf",
    summary:
      "Renewal for nationals 16 and over. A long multi-section form with conditional questions, exactly two references, and a declaration.",
    sections: [
      "Personal details",
      "Conditional follow-ups",
      "Two references",
      "Declaration",
    ],
    keywords: ["passport", "renewal", "travel", "immigration", "references"],
  },
  {
    slug: "computerized-birth-certificate",
    name: "Computerized birth certificate (RGD 14A)",
    agency: "Registrar General's Department",
    sourceLabel: "Official application form (PDF)",
    sourceUrl:
      "https://foreign.gov.tt/documents/361/Application_for_Computerized_Birth_Certificate.pdf",
    summary:
      "Request a computerized birth certificate, including third-party applications. ID-type select and a stated purpose.",
    sections: [
      "Applicant details",
      "Third-party application",
      "ID type and purpose",
    ],
    keywords: ["birth", "certificate", "rgd", "registrar", "14a"],
  },
  {
    slug: "nis-ni4",
    name: "NIS registration (NI 4)",
    agency: "National Insurance Board",
    sourceLabel: "Official NI 4 form (PDF)",
    sourceUrl: "https://www.nibtt.net/NI_4.pdf",
    summary:
      "Register as an employed person. Held as the swap-in alternate if one of the three pilots proves awkward to model.",
    sections: ["Employment details", "Personal details", "Declaration"],
    keywords: ["nis", "nib", "insurance", "employed", "ni4"],
    alternate: true,
  },
]

export function getForm(slug: string): PilotForm | undefined {
  return pilotForms.find((form) => form.slug === slug)
}
