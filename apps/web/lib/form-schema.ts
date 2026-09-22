import * as z from "zod"
import type { FieldDef, SectionDef } from "@/lib/form-answers"

// Zod schemas built from the structured definitions, per the shadcn
// React Hook Form pattern (useForm + zodResolver + Controller + Field*).
// Cosmetic only: hidden fields are never triggered, and the server
// re-validates everything at submit time (#37).

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value)

function textSchema(field: FieldDef) {
  let schema = z.preprocess(emptyToUndefined, z.string())
  if (field.required) {
    schema = z.preprocess(
      emptyToUndefined,
      z.string().min(1, `${field.label} is required.`)
    )
  }
  if (
    (field.kind === "short_text" || field.kind === "long_text") &&
    field.maxLength !== undefined
  ) {
    const max = field.maxLength
    schema = schema.refine(
      (value) => value === undefined || value.length <= max,
      `${field.label} must be at most ${max} characters.`
    )
  }
  return schema
}

function scalarSchema(field: FieldDef): z.ZodTypeAny {
  switch (field.kind) {
    case "short_text":
    case "long_text":
      return textSchema(field)
    case "number": {
      const base = z.preprocess(
        (value) =>
          value === "" || value === undefined ? undefined : Number(value),
        z.number({ error: `${field.label} must be a number.` })
      )
      let schema: z.ZodTypeAny = field.required ? base : base.optional()
      if (field.min !== undefined) {
        const min = field.min
        schema = schema.refine(
          (value: unknown) =>
            value === undefined || (typeof value === "number" && value >= min),
          `${field.label} must be at least ${min}.`
        )
      }
      if (field.max !== undefined) {
        const max = field.max
        schema = schema.refine(
          (value: unknown) =>
            value === undefined || (typeof value === "number" && value <= max),
          `${field.label} must be at most ${max}.`
        )
      }
      return schema
    }
    case "date": {
      const base = z.preprocess(
        emptyToUndefined,
        z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, `${field.label} must be a valid date.`)
      )
      return field.required
        ? z.preprocess(
            emptyToUndefined,
            z
              .string()
              .min(1, `${field.label} is required.`)
              .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                `${field.label} must be a valid date.`
              )
          )
        : base.optional()
    }
    case "email": {
      const base = z.preprocess(
        emptyToUndefined,
        z.string().email(`${field.label} must be a valid email address.`)
      )
      return field.required
        ? z.preprocess(
            emptyToUndefined,
            z
              .string()
              .min(1, `${field.label} is required.`)
              .email(`${field.label} must be a valid email address.`)
          )
        : base.optional()
    }
    case "phone": {
      const digits = (value: unknown) =>
        typeof value === "string" && value.replace(/\D/g, "").length >= 7
      const base = z.preprocess(
        emptyToUndefined,
        z
          .string()
          .refine(digits, `${field.label} must be a valid phone number.`)
      )
      return field.required
        ? z.preprocess(
            emptyToUndefined,
            z
              .string()
              .min(1, `${field.label} is required.`)
              .refine(digits, `${field.label} must be a valid phone number.`)
          )
        : base.optional()
    }
    case "single_choice": {
      const options = field.options
      const base = z.preprocess(
        emptyToUndefined,
        z
          .string()
          .refine(
            (value) => value === undefined || options.includes(value),
            `${field.label} must be one of the listed options.`
          )
      )
      return field.required
        ? z.preprocess(
            emptyToUndefined,
            z
              .string()
              .min(1, `${field.label} is required.`)
              .refine(
                (value) => options.includes(value),
                `${field.label} must be one of the listed options.`
              )
          )
        : base.optional()
    }
    case "multiple_choice": {
      const options = field.options
      let schema = z
        .array(z.string())
        .refine(
          (value) => value.every((item) => options.includes(item)),
          `${field.label} must only use the listed options.`
        )
      if (field.required) {
        schema = schema.min(1, `${field.label} is required.`)
      }
      return field.required ? schema : schema.optional()
    }
    case "yes_no":
      return field.required
        ? z.boolean({ error: `${field.label} must be yes or no.` })
        : z.boolean().optional()
    case "upload": {
      let schema = z
        .array(z.custom<File>())
        .refine(
          (files) =>
            field.maxSizeBytes === undefined ||
            files.every((file) => file.size <= (field.maxSizeBytes as number)),
          `Files must stay under the size limit.`
        )
      if (field.required) {
        schema = schema.min(1, `${field.label} needs a file.`)
      }
      return field.required ? schema : schema.optional()
    }
    case "declaration":
      return field.required
        ? z
            .boolean()
            .refine(
              (value) => value === true,
              `${field.label} must be accepted.`
            )
        : z.boolean().optional()
  }
}

function rowShape(fields: FieldDef[]) {
  return z.object(
    Object.fromEntries(fields.map((field) => [field.id, scalarSchema(field)]))
  )
}

// Full-form schema: top-level fields plus one array per repeated section.
// Sections validate through trigger() on visible paths only, so hidden
// fields never block progress.
export function buildFormSchema(sections: SectionDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const section of sections) {
    if (!section.repeat) {
      for (const field of section.fields) {
        shape[field.id] = scalarSchema(field)
      }
      continue
    }
    const repeating = section.repeatFields
      ? new Set(section.repeatFields)
      : null
    for (const field of section.fields) {
      if (!repeating || !repeating.has(field.id)) {
        shape[field.id] = scalarSchema(field)
      }
    }
    const rowFields = repeating
      ? section.fields.filter((field) => repeating.has(field.id))
      : section.fields
    let rows: z.ZodTypeAny = z.array(rowShape(rowFields))
    if (section.repeat.min > 0) {
      const min = section.repeat.min
      rows = rows.refine(
        (value: unknown) => !Array.isArray(value) || value.length >= min,
        `${section.title} needs at least ${min} ${min === 1 ? "entry" : "entries"}.`
      )
    }
    const max = section.repeat.max
    rows = rows.refine(
      (value: unknown) => !Array.isArray(value) || value.length <= max,
      `${section.title} allows at most ${max} ${max === 1 ? "entry" : "entries"}.`
    )
    shape[section.id] = rows
  }
  return z.object(shape)
}
