import { z } from "zod";
import type { FieldDefinition, SectionDefinition } from "@/lib/form-answers";

// Zod schemas built from the structured definitions, per the shadcn
// React Hook Form pattern (useForm + zodResolver + Controller + Field*).
// Cosmetic only: hidden fields are never triggered, and the server
// re-validates everything at submit time (#37).

type TextField =
  | Extract<FieldDefinition, { kind: "short_text" }>
  | Extract<FieldDefinition, { kind: "long_text" }>;
type NumberField = Extract<FieldDefinition, { kind: "number" }>;
type DateField = Extract<FieldDefinition, { kind: "date" }>;
type EmailField = Extract<FieldDefinition, { kind: "email" }>;
type PhoneField = Extract<FieldDefinition, { kind: "phone" }>;
type SingleChoiceField = Extract<FieldDefinition, { kind: "single_choice" }>;
type MultipleChoiceField = Extract<
  FieldDefinition,
  { kind: "multiple_choice" }
>;
type YesNoField = Extract<FieldDefinition, { kind: "yes_no" }>;
type UploadField = Extract<FieldDefinition, { kind: "upload" }>;
type DeclarationField = Extract<FieldDefinition, { kind: "declaration" }>;

type FormSchema = z.ZodType;

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const isAtLeast = (value: unknown, minimum: number): boolean => {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== "number") {
    return false;
  }
  const numericValue: number = value;
  return Math.max(minimum, numericValue) === numericValue;
};

const isAtMost = (value: unknown, maximum: number): boolean => {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== "number") {
    return false;
  }
  const numericValue: number = value;
  return Math.min(maximum, numericValue) === numericValue;
};

const hasAtLeastEntries = (value: unknown, minimum: number): boolean => {
  if (!Array.isArray(value)) {
    return true;
  }
  return value.length >= minimum;
};

const hasAtMostEntries = (value: unknown, maximum: number): boolean => {
  if (!Array.isArray(value)) {
    return true;
  }
  return value.length <= maximum;
};

const isLengthAtMost = (text: string, maximum: number): boolean => {
  const { length } = text;
  return Math.min(length, maximum) === length;
};

const isLengthAtLeast = (text: string, minimum: number): boolean => {
  const { length } = text;
  return Math.max(length, minimum) === length;
};

const isValidTextLength = (value: unknown, maximum: number): boolean => {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }
  return isLengthAtMost(value, maximum);
};

const isListedOption = (
  value: unknown,
  options: ReadonlySet<string>
): boolean => typeof value === "string" && options.has(value);

const textSchema = function textSchema(field: TextField): FormSchema {
  let schema: FormSchema =
    field.required === true
      ? z.preprocess(
          emptyToUndefined,
          z.string().min(1, `${field.label} is required.`)
        )
      : z.preprocess(emptyToUndefined, z.string().optional());
  if (field.maxLength !== undefined) {
    const maximum = field.maxLength;
    schema = schema.refine(
      (value) => isValidTextLength(value, maximum),
      `${field.label} must be at most ${maximum} characters.`
    );
  }
  return schema;
};

const numberSchema = function numberSchema(field: NumberField): FormSchema {
  const base = z.preprocess(
    (value) =>
      value === "" || value === undefined ? undefined : Number(value),
    z.number({ error: `${field.label} must be a number.` })
  );
  let schema: FormSchema = field.required === true ? base : base.optional();
  if (field.min !== undefined) {
    const minimum = field.min;
    schema = schema.refine(
      (value: unknown) => isAtLeast(value, minimum),
      `${field.label} must be at least ${minimum}.`
    );
  }
  if (field.max !== undefined) {
    const maximum = field.max;
    schema = schema.refine(
      (value: unknown) => isAtMost(value, maximum),
      `${field.label} must be at most ${maximum}.`
    );
  }
  return schema;
};

const dateSchema = function dateSchema(field: DateField): FormSchema {
  const base = z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/u, `${field.label} must be a valid date.`)
  );
  return field.required === true
    ? z.preprocess(
        emptyToUndefined,
        z
          .string()
          .min(1, `${field.label} is required.`)
          .regex(/^\d{4}-\d{2}-\d{2}$/u, `${field.label} must be a valid date.`)
      )
    : base.optional();
};

const emailSchema = function emailSchema(field: EmailField): FormSchema {
  const base = z.preprocess(
    emptyToUndefined,
    z.email({ error: `${field.label} must be a valid email address.` })
  );
  return field.required === true
    ? z.preprocess(
        emptyToUndefined,
        z
          .email({ error: `${field.label} must be a valid email address.` })
          .min(1, `${field.label} is required.`)
      )
    : base.optional();
};

const isStringValue = (value: unknown): value is string =>
  typeof value === "string";

const stripNonDigits = (text: string | null | undefined): string => {
  const replaced = text?.replaceAll(/\D/gu, "");
  return replaced ?? "";
};

const isValidPhone = (value: unknown): boolean => {
  if (!isStringValue(value)) {
    return false;
  }
  return isLengthAtLeast(stripNonDigits(value), 7);
};

const phoneSchema = function phoneSchema(field: PhoneField): FormSchema {
  const base = z.preprocess(
    emptyToUndefined,
    z
      .string()
      .refine(isValidPhone, `${field.label} must be a valid phone number.`)
  );
  return field.required === true
    ? z.preprocess(
        emptyToUndefined,
        z
          .string()
          .min(1, `${field.label} is required.`)
          .refine(isValidPhone, `${field.label} must be a valid phone number.`)
      )
    : base.optional();
};

const singleChoiceSchema = function singleChoiceSchema(
  field: SingleChoiceField
): FormSchema {
  const { options } = field;
  const optionSet = new Set(options);
  const base = z.preprocess(
    emptyToUndefined,
    z
      .string()
      .refine(
        (value) => isListedOption(value, optionSet),
        `${field.label} must be one of the listed options.`
      )
  );
  return field.required === true
    ? z.preprocess(
        emptyToUndefined,
        z
          .string()
          .min(1, `${field.label} is required.`)
          .refine(
            (value) => isListedOption(value, optionSet),
            `${field.label} must be one of the listed options.`
          )
      )
    : base.optional();
};

const multipleChoiceSchema = function multipleChoiceSchema(
  field: MultipleChoiceField
): FormSchema {
  const { options } = field;
  const optionSet = new Set(options);
  let schema = z
    .array(z.string())
    .refine(
      (value) => value.every((item) => optionSet.has(item)),
      `${field.label} must only use the listed options.`
    );
  if (field.required === true) {
    schema = schema.min(1, `${field.label} is required.`);
  }
  return field.required === true ? schema : schema.optional();
};

const yesNoSchema = function yesNoSchema(field: YesNoField): FormSchema {
  return field.required === true
    ? z.boolean({ error: `${field.label} must be yes or no.` })
    : z.boolean().optional();
};

const uploadSchema = function uploadSchema(field: UploadField): FormSchema {
  const maximum = field.maxSizeBytes;
  let schema = z
    .array(z.custom<File>())
    .refine(
      (files) =>
        maximum === undefined || files.every((file) => file.size <= maximum),
      "Files must stay under the size limit."
    );
  if (field.required === true) {
    schema = schema.min(1, `${field.label} needs a file.`);
  }
  return field.required === true ? schema : schema.optional();
};

const declarationSchema = function declarationSchema(
  field: DeclarationField
): FormSchema {
  return field.required === true
    ? z.boolean().refine((value) => value, `${field.label} must be accepted.`)
    : z.boolean().optional();
};

const scalarSchema = (field: FieldDefinition): FormSchema => {
  switch (field.kind) {
    case "short_text":
    case "long_text": {
      return textSchema(field);
    }
    case "number": {
      return numberSchema(field);
    }
    case "date": {
      return dateSchema(field);
    }
    case "email": {
      return emailSchema(field);
    }
    case "phone": {
      return phoneSchema(field);
    }
    case "single_choice": {
      return singleChoiceSchema(field);
    }
    case "multiple_choice": {
      return multipleChoiceSchema(field);
    }
    case "yes_no": {
      return yesNoSchema(field);
    }
    case "upload": {
      return uploadSchema(field);
    }
    case "declaration": {
      return declarationSchema(field);
    }
    default: {
      return z.never();
    }
  }
};

const rowShape = function rowShape(fields: FieldDefinition[]) {
  return z.object(
    Object.fromEntries(fields.map((field) => [field.id, scalarSchema(field)]))
  );
};

type RepeatSettings = NonNullable<SectionDefinition["repeat"]>;

const addSectionFields = (
  shape: Record<string, FormSchema>,
  section: SectionDefinition,
  repeating: ReadonlySet<string> | null
): void => {
  for (const field of section.fields) {
    if (repeating?.has(field.id) !== true) {
      shape[field.id] = scalarSchema(field);
    }
  }
};

const repeatedRowsSchema = (
  section: SectionDefinition,
  repeat: RepeatSettings,
  repeating: ReadonlySet<string> | null
): FormSchema => {
  const rowFields =
    repeating === null
      ? section.fields
      : section.fields.filter((field) => repeating.has(field.id));
  let rows: FormSchema = z.array(rowShape(rowFields));
  if (repeat.min > 0) {
    const minimum = repeat.min;
    rows = rows.refine(
      (value) => hasAtLeastEntries(value, minimum),
      `${section.title} needs at least ${minimum} ${minimum === 1 ? "entry" : "entries"}.`
    );
  }
  const maximum = repeat.max;
  rows = rows.refine(
    (value) => hasAtMostEntries(value, maximum),
    `${section.title} allows at most ${maximum} ${maximum === 1 ? "entry" : "entries"}.`
  );
  return rows;
};

const addSectionToShape = (
  shape: Record<string, FormSchema>,
  section: SectionDefinition
): void => {
  if (section.repeat === undefined) {
    addSectionFields(shape, section, null);
    return;
  }
  const repeating =
    section.repeatFields === undefined ? null : new Set(section.repeatFields);
  addSectionFields(shape, section, repeating);
  shape[section.id] = repeatedRowsSchema(section, section.repeat, repeating);
};

// Full-form schema: top-level fields plus one array per repeated section.
// Sections validate through trigger() on visible paths only, so hidden
// fields never block progress.
export const buildFormSchema = (sections: SectionDefinition[]) => {
  const shape: Record<string, FormSchema> = {};
  for (const section of sections) {
    addSectionToShape(shape, section);
  }
  return z.object(shape);
};
