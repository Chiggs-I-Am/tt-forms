import { Infer, v } from "convex/values"

// Structured form model for #35. Predefined field types with built-in rules
// only: required answers, length and range limits, date bounds, repeat
// counts. No custom scripts, no arbitrary layouts, no regex editor. The
// server decides applicability and validity; browser checks are cosmetic.

// A condition reads an earlier choice answer. `values` holds the answers
// that satisfy one rule; `mode` combines rules ("any" matches when one rule
// matches, "all" needs every rule). yes_no answers compare as "true"/"false".
export const conditionValidator = v.object({
  mode: v.union(v.literal("all"), v.literal("any")),
  rules: v.array(
    v.object({ fieldId: v.string(), values: v.array(v.string()) })
  ),
})

const baseField = {
  id: v.string(),
  label: v.string(),
  hint: v.optional(v.string()),
  required: v.optional(v.boolean()),
  condition: v.optional(conditionValidator),
}

export const fieldDefValidator = v.union(
  v.object({
    ...baseField,
    kind: v.literal("short_text"),
    maxLength: v.optional(v.number()),
  }),
  v.object({
    ...baseField,
    kind: v.literal("long_text"),
    maxLength: v.optional(v.number()),
  }),
  v.object({
    ...baseField,
    kind: v.literal("number"),
    min: v.optional(v.number()),
    max: v.optional(v.number()),
  }),
  v.object({
    ...baseField,
    kind: v.literal("date"),
    min: v.optional(v.string()),
    max: v.optional(v.string()),
  }),
  v.object({ ...baseField, kind: v.literal("email") }),
  v.object({ ...baseField, kind: v.literal("phone") }),
  v.object({
    ...baseField,
    kind: v.literal("single_choice"),
    options: v.array(v.string()),
  }),
  v.object({
    ...baseField,
    kind: v.literal("multiple_choice"),
    options: v.array(v.string()),
  }),
  v.object({ ...baseField, kind: v.literal("yes_no") }),
  v.object({
    ...baseField,
    kind: v.literal("upload"),
    maxSizeBytes: v.optional(v.number()),
  }),
  v.object({ ...baseField, kind: v.literal("declaration") })
)

export const sectionDefValidator = v.object({
  id: v.string(),
  title: v.string(),
  helpText: v.optional(v.string()),
  condition: v.optional(conditionValidator),
  repeat: v.optional(v.object({ min: v.number(), max: v.number() })),
  // Subset of field ids that repeat per row. Absent with repeat means every
  // field repeats; the rest are asked once above the rows (e.g. present
  // marriage details with a previous-marriages table below).
  repeatFields: v.optional(v.array(v.string())),
  fields: v.array(fieldDefValidator),
})

export const formDefinitionValidator = v.object({
  sections: v.array(sectionDefValidator),
})

export type Condition = Infer<typeof conditionValidator>
export type FieldDef = Infer<typeof fieldDefValidator>
export type SectionDef = Infer<typeof sectionDefValidator>
export type FormDefinition = Infer<typeof formDefinitionValidator>

// Answers key field ids to values. Fields inside a repeated section live
// under the section id as an array of per-row objects. Upload answers hold
// file storage ids as strings; the saving mutation (#38) enforces type and
// size by reading the storage row.
export const answerScalarValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.array(v.string())
)
export const answersValidator = v.record(
  v.string(),
  v.union(
    answerScalarValidator,
    v.array(v.record(v.string(), answerScalarValidator))
  )
)
export type Answers = Infer<typeof answersValidator>
type Scalar = string | number | boolean | string[]

const CHOICE_KINDS = new Set(["single_choice", "multiple_choice", "yes_no"])

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

// Visibility of one field or section against top-level answers. Conditions
// may only reference top-level (non-repeated) choice fields; row-local
// conditions are not supported (one repeat level only).
export function isVisible(
  condition: Condition | undefined,
  getAnswer: (fieldId: string) => Scalar | undefined
): boolean {
  if (!condition) {
    return true
  }
  const results = condition.rules.map((rule) => ruleMatches(rule, getAnswer))
  return condition.mode === "all"
    ? results.every(Boolean)
    : results.some(Boolean)
}

export function topLevelAnswer(
  answers: Answers,
  fieldId: string
): Scalar | undefined {
  const value = answers[fieldId]
  return Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object"
    ? undefined
    : (value as Scalar | undefined)
}

function isEmpty(value: Scalar | undefined): boolean {
  return (
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
}

export interface AnswerError {
  path: string
  message: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function checkScalar(
  field: FieldDef,
  value: Scalar | undefined,
  path: string,
  errors: AnswerError[]
): void {
  if (field.required && isEmpty(value)) {
    errors.push({ path, message: `${field.label} is required.` })
    return
  }
  if (isEmpty(value)) {
    return
  }
  switch (field.kind) {
    case "short_text":
    case "long_text":
      if (typeof value !== "string") {
        errors.push({ path, message: `${field.label} must be text.` })
      } else if (
        field.maxLength !== undefined &&
        value.length > field.maxLength
      ) {
        errors.push({
          path,
          message: `${field.label} must be at most ${field.maxLength} characters.`,
        })
      }
      break
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push({ path, message: `${field.label} must be a number.` })
      } else {
        if (field.min !== undefined && value < field.min) {
          errors.push({
            path,
            message: `${field.label} must be at least ${field.min}.`,
          })
        }
        if (field.max !== undefined && value > field.max) {
          errors.push({
            path,
            message: `${field.label} must be at most ${field.max}.`,
          })
        }
      }
      break
    case "date":
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        errors.push({ path, message: `${field.label} must be a valid date.` })
      } else {
        if (field.min !== undefined && value < field.min) {
          errors.push({
            path,
            message: `${field.label} must be on or after ${field.min}.`,
          })
        }
        if (field.max !== undefined && value > field.max) {
          errors.push({
            path,
            message: `${field.label} must be on or before ${field.max}.`,
          })
        }
      }
      break
    case "email":
      if (typeof value !== "string" || !EMAIL_RE.test(value)) {
        errors.push({
          path,
          message: `${field.label} must be a valid email address.`,
        })
      }
      break
    case "phone":
      if (typeof value !== "string" || value.replace(/\D/g, "").length < 7) {
        errors.push({
          path,
          message: `${field.label} must be a valid phone number.`,
        })
      }
      break
    case "single_choice":
      if (typeof value !== "string" || !field.options.includes(value)) {
        errors.push({
          path,
          message: `${field.label} must be one of the listed options.`,
        })
      }
      break
    case "multiple_choice":
      if (
        !Array.isArray(value) ||
        value.some((item) => !field.options.includes(item))
      ) {
        errors.push({
          path,
          message: `${field.label} must only use the listed options.`,
        })
      }
      break
    case "yes_no":
      if (typeof value !== "boolean") {
        errors.push({ path, message: `${field.label} must be yes or no.` })
      }
      break
    case "upload":
      if (
        !Array.isArray(value) ||
        value.some((item) => typeof item !== "string")
      ) {
        errors.push({
          path,
          message: `${field.label} holds invalid file references.`,
        })
      }
      break
    case "declaration":
      if (value !== true) {
        errors.push({ path, message: `${field.label} must be accepted.` })
      }
      break
  }
}

// Server-side answer validation. Hidden answers are skipped entirely: they
// stay in the saved draft but never block progress and never reach the
// submission while hidden. Repeated sections validate their once-asked fields
// from top-level answers and their row fields per entry. Returns every error
// plus the visible field paths.
export function validateAnswers(
  definition: FormDefinition,
  answers: Answers
): { errors: AnswerError[]; visible: string[] } {
  const errors: AnswerError[] = []
  const visible: string[] = []
  const getAnswer = (fieldId: string) => topLevelAnswer(answers, fieldId)

  for (const section of definition.sections) {
    if (!isVisible(section.condition, getAnswer)) {
      continue
    }
    if (section.repeat) {
      const { once, rows: rowFields } = splitSection(section)
      for (const field of once) {
        if (!isVisible(field.condition, getAnswer)) {
          continue
        }
        visible.push(field.id)
        checkScalar(field, getAnswer(field.id), field.id, errors)
      }
      const rows = answers[section.id]
      const list = Array.isArray(rows) ? rows : []
      if (list.length < section.repeat.min) {
        errors.push({
          path: section.id,
          message: `${section.title} needs at least ${section.repeat.min} ${section.repeat.min === 1 ? "entry" : "entries"}.`,
        })
      }
      if (list.length > section.repeat.max) {
        errors.push({
          path: section.id,
          message: `${section.title} allows at most ${section.repeat.max} ${section.repeat.max === 1 ? "entry" : "entries"}.`,
        })
      }
      list.forEach((row, index) => {
        if (row === null || typeof row !== "object" || Array.isArray(row)) {
          errors.push({
            path: `${section.id}[${index}]`,
            message: `${section.title} entry ${index + 1} is invalid.`,
          })
          return
        }
        for (const field of rowFields) {
          const path = `${section.id}[${index}].${field.id}`
          visible.push(path)
          checkScalar(
            field,
            (row as Record<string, Scalar>)[field.id],
            path,
            errors
          )
        }
      })
      continue
    }
    for (const field of section.fields) {
      if (!isVisible(field.condition, getAnswer)) {
        continue
      }
      visible.push(field.id)
      checkScalar(field, getAnswer(field.id), field.id, errors)
    }
  }
  return { errors, visible }
}

// Splits a repeated section into once-asked fields (top-level answers) and
// per-row fields. Without repeatFields every field repeats.
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

// Publish checks for #35: invalid rules, missing labels or options, broken
// conditions, and duplicate ids. Source completeness is checked from the form
// doc at publish time, not here.
export function validateDefinition(definition: FormDefinition): string[] {
  const problems: string[] = []
  const seenIds = new Set<string>()

  for (const section of definition.sections) {
    if (!section.id) {
      problems.push("Every section needs an id.")
    } else if (seenIds.has(`section:${section.id}`)) {
      problems.push(`Duplicate section id "${section.id}".`)
    } else {
      seenIds.add(`section:${section.id}`)
    }
    if (!section.title) {
      problems.push(`Section "${section.id || "?"}" needs a title.`)
    }
    if (section.repeat) {
      if (section.repeat.min < 0 || section.repeat.max < 1) {
        problems.push(
          `Section "${section.title}" has an impossible repeat count.`
        )
      }
      if (section.repeat.min > section.repeat.max) {
        problems.push(
          `Section "${section.title}" repeats a minimum more times than its maximum.`
        )
      }
      if (section.repeatFields) {
        if (section.repeatFields.length === 0) {
          problems.push(`Section "${section.title}" names no repeating fields.`)
        }
        const fieldIds = new Set(section.fields.map((f) => f.id))
        for (const id of section.repeatFields) {
          if (!fieldIds.has(id)) {
            problems.push(
              `Section "${section.title}" repeats unknown field "${id}".`
            )
          }
        }
      }
    } else if (section.repeatFields) {
      problems.push(
        `Section "${section.title}" names repeating fields without a repeat count.`
      )
    }
    if (section.fields.length === 0) {
      problems.push(`Section "${section.title}" has no fields.`)
    }
    for (const field of section.fields) {
      if (!field.id) {
        problems.push(`A field in "${section.title}" needs an id.`)
        continue
      }
      if (seenIds.has(`field:${field.id}`)) {
        problems.push(`Duplicate field id "${field.id}".`)
      } else {
        seenIds.add(`field:${field.id}`)
      }
      if (!field.label) {
        problems.push(`Field "${field.id}" needs a label.`)
      }
      if (
        (field.kind === "single_choice" || field.kind === "multiple_choice") &&
        (field.options.length < 2 || field.options.some((o) => !o))
      ) {
        problems.push(
          `Choice field "${field.label || field.id}" needs at least two non-empty options.`
        )
      }
      if (
        (field.kind === "short_text" || field.kind === "long_text") &&
        field.maxLength !== undefined &&
        field.maxLength < 1
      ) {
        problems.push(
          `Field "${field.label || field.id}" has an impossible length limit.`
        )
      }
      if (
        field.kind === "number" &&
        field.min !== undefined &&
        field.max !== undefined &&
        field.min > field.max
      ) {
        problems.push(
          `Field "${field.label || field.id}" has a minimum above its maximum.`
        )
      }
      if (field.kind === "upload") {
        if (field.maxSizeBytes !== undefined && field.maxSizeBytes < 1) {
          problems.push(
            `Upload field "${field.label || field.id}" has an impossible size limit.`
          )
        }
      }
    }
    const { rows: rowFields } = splitSection(section)
    for (const field of rowFields) {
      if (field.condition) {
        problems.push(
          `Row field "${field.label || field.id}" cannot carry its own condition; gate the section instead.`
        )
      }
    }
  }

  // Conditions resolve against earlier top-level choice fields only.
  // Sections walk in document order so a condition can never read a later
  // field. Row-local conditions are rejected: repeated-section fields never
  // enter the available set.
  const available = new Map<string, FieldDef>()
  const checkCondition = (target: Condition | undefined, owner: string) => {
    if (!target) {
      return
    }
    if (target.rules.length === 0) {
      problems.push(`A condition on "${owner}" has no rules.`)
    }
    for (const rule of target.rules) {
      if (!available.get(rule.fieldId)) {
        problems.push(
          `Condition on "${owner}" reads "${rule.fieldId}", which is not an earlier choice field.`
        )
      } else if (rule.values.length === 0) {
        problems.push(`Condition on "${owner}" matches no answers.`)
      }
    }
  }
  for (const section of definition.sections) {
    checkCondition(section.condition, section.title)
    for (const field of section.fields) {
      checkCondition(field.condition, field.label || section.title)
      if (CHOICE_KINDS.has(field.kind) && !section.repeat) {
        available.set(field.id, field)
      }
    }
  }
  return problems
}
