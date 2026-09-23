import { ConvexError } from "convex/values"
import type { Condition, FieldDef, SectionDef } from "@/lib/form-answers"

// Draft shape the editor holds. It matches the working-copy definition the
// server stores, so Save passes it straight to saveWorkingCopy and Preview
// passes it straight to FormFiller. The server owns every check.
export interface BuilderDraft {
  name: string
  agency: string
  sourceLabel: string
  sourceUrl: string
  sections: SectionDef[]
}

export type FieldKind = FieldDef["kind"]

export const FIELD_KINDS: { kind: FieldKind; label: string }[] = [
  { kind: "short_text", label: "Short text" },
  { kind: "long_text", label: "Long text" },
  { kind: "number", label: "Number" },
  { kind: "date", label: "Date" },
  { kind: "email", label: "Email" },
  { kind: "phone", label: "Phone" },
  { kind: "single_choice", label: "Single choice" },
  { kind: "multiple_choice", label: "Multiple choice" },
  { kind: "yes_no", label: "Yes / no" },
  { kind: "upload", label: "Upload" },
  { kind: "declaration", label: "Declaration" },
]

let counter = 0

export function freshId(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter}`
}

export function blankSection(): SectionDef {
  return { id: freshId("section"), title: "New section", fields: [] }
}

export function blankField(kind: FieldKind): FieldDef {
  const base = { id: freshId("field"), label: "New question" }
  switch (kind) {
    case "single_choice":
    case "multiple_choice":
      return { ...base, kind, options: ["Option 1", "Option 2"] }
    default:
      return { ...base, kind }
  }
}

export interface ChoiceOption {
  id: string
  label: string
  options: string[]
}

function isChoice(field: FieldDef): boolean {
  return (
    field.kind === "single_choice" ||
    field.kind === "multiple_choice" ||
    field.kind === "yes_no"
  )
}

function choiceOptions(field: FieldDef): string[] {
  if (field.kind === "single_choice" || field.kind === "multiple_choice") {
    return field.options
  }
  return ["true", "false"]
}

// Earlier top-level choice fields a condition may read, per the server rule:
// document order, non-repeated sections only. `upto` bounds the same-section
// prefix for field-level conditions; section-level conditions pass none.
export function earlierChoices(
  sections: SectionDef[],
  sectionIndex: number,
  upto?: number
): ChoiceOption[] {
  const out: ChoiceOption[] = []
  sections.forEach((section, i) => {
    if (i > sectionIndex || section.repeat) {
      return
    }
    const fields =
      i === sectionIndex && upto !== undefined
        ? section.fields.slice(0, upto)
        : section.fields
    for (const field of fields) {
      if (isChoice(field)) {
        out.push({
          id: field.id,
          label: field.label || field.id,
          options: choiceOptions(field),
        })
      }
    }
  })
  return out
}

// Readable text for a Convex denial or publish block. The server message is
// the check result, so it renders verbatim.
export function errorText(error: unknown): string {
  if (error instanceof ConvexError) {
    return String(error.data ?? error.message)
  }
  return error instanceof Error ? error.message : "Something went wrong."
}

export type { Condition, FieldDef, SectionDef }
