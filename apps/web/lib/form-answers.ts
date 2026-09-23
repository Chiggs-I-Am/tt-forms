import type { Doc } from "@workspace/database/data-model"

// Client-side answer model for the applicant fill view. Mirrors the server
// shape in convex/formModel.ts: scalars per field, row arrays under repeated
// section ids. Uploads live outside this model as File objects in memory;
// only names persist to the localStorage backup.
//
// Visibility here is cosmetic. The server re-decides applicability at submit
// time (#37) and never trusts these answers.

export type Scalar = string | number | boolean | string[]
export type Row = Record<string, Scalar | File[]>
export type StoredRow = Record<string, Scalar>
export type Answers = Record<string, Scalar | StoredRow[] | File[]>

export type VersionDefinition = Doc<"formVersions">["definition"]
export type SectionDef = VersionDefinition["sections"][number]
export type FieldDef = SectionDef["fields"][number]
export type Condition = NonNullable<SectionDef["condition"]>

// Mirrors topLevelAnswer in convex/formModel.ts for cosmetic client checks;
// the server re-decides applicability at submit time (#37) and never trusts
// these answers.
export function topLevelAnswer(
  answers: Answers,
  fieldId: string
): Scalar | undefined {
  const value = answers[fieldId]
  if (value === undefined) {
    return undefined
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return undefined
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return []
    }
    // Row arrays and File arrays are not top-level answers.
    if (value.some((item) => typeof item === "object")) {
      return undefined
    }
    return value as Scalar
  }
  return value
}

// Mirrors ruleMatches in convex/formModel.ts.
function ruleMatches(
  rule: { fieldId: string; values: string[] },
  getAnswer: (fieldId: string) => Scalar | undefined
): boolean {
  const answer = getAnswer(rule.fieldId)
  if (answer === undefined) {
    return false
  }
  if (Array.isArray(answer)) {
    return answer.some((item) => rule.values.includes(item))
  }
  return rule.values.includes(String(answer))
}

export function isVisible(
  condition: Condition | undefined,
  answers: Answers
): boolean {
  if (!condition) {
    return true
  }
  const getAnswer = (fieldId: string) => topLevelAnswer(answers, fieldId)
  const results = condition.rules.map((rule) => ruleMatches(rule, getAnswer))
  return condition.mode === "all"
    ? results.every(Boolean)
    : results.some(Boolean)
}

export function visibleSections(
  definition: VersionDefinition,
  answers: Answers
): SectionDef[] {
  return definition.sections.filter((section) =>
    isVisible(section.condition, answers)
  )
}

// Display titles strip paper numbering ("1. Names", "Part I. ...").
// Numbering stays in the Convex definitions (the 1:1 record); the UI shows
// plain names plus a position progress bar.
export function displayTitle(title: string): string {
  return title
    .replace(/^\d+\.\s*/, "")
    .replace(/^Part\s+[IVXLCDM]+\.?\s*/i, "")
    .replace(/^Section\s+\d+\s*[:.-]?\s*/i, "")
    .trim()
}
// Sections hidden by their condition, shown locked in the nav so paper
// numbering never jumps. The section help text doubles as the reason.
export function hiddenSections(
  definition: VersionDefinition,
  answers: Answers
): SectionDef[] {
  return definition.sections.filter(
    (section) => !isVisible(section.condition, answers)
  )
}

export function sectionReason(section: SectionDef): string {
  return section.helpText ?? "Answer earlier questions to reveal it."
}

export function visibleFields(
  section: SectionDef,
  answers: Answers
): FieldDef[] {
  return section.fields.filter((field) => isVisible(field.condition, answers))
}

// Mirrors splitSection in convex/formModel.ts (duplicated because the web
// app cannot import Convex server modules; the server re-checks everything).
export function splitSection(section: SectionDef): {
  once: FieldDef[]
  rows: FieldDef[]
} {
  if (!section.repeat) {
    return { once: section.fields, rows: [] }
  }
  if (!section.repeatFields) {
    return { once: [], rows: section.fields }
  }
  const repeating = new Set(section.repeatFields)
  return {
    once: section.fields.filter((f) => !repeating.has(f.id)),
    rows: section.fields.filter((f) => repeating.has(f.id)),
  }
}

// Rows a repeated section must hold: pad with empty rows up to the minimum.
// Never mutates the answers object; returns a fresh array.
export function ensureRows(answers: Answers, section: SectionDef): StoredRow[] {
  const current = answers[section.id]
  const rows: StoredRow[] =
    Array.isArray(current) &&
    current.every((row) => typeof row === "object" && !(row instanceof File))
      ? (current as StoredRow[]).map((row) => ({ ...row }))
      : []
  if (!section.repeat) {
    return rows
  }
  while (rows.length < section.repeat.min) {
    rows.push({})
  }
  return rows.slice(0, Math.max(rows.length, section.repeat.min))
}

// Strip File objects before the localStorage backup; uploads stay in memory
// for the session and are flagged as such in the UI.
export function serialize(answers: Answers): string {
  const clean: Record<string, Scalar | StoredRow[]> = {}
  for (const [key, value] of Object.entries(answers)) {
    if (value instanceof File) {
      continue
    }
    if (Array.isArray(value)) {
      clean[key] = value.filter(
        (row): row is StoredRow =>
          typeof row === "object" && !(row instanceof File)
      )
    } else {
      clean[key] = value as Scalar
    }
  }
  return JSON.stringify(clean)
}

export function deserialize(raw: string | null): Answers {
  if (!raw) {
    return {}
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Answers
    }
  } catch {
    // Corrupt backup: start fresh rather than crash.
  }
  return {}
}
