import { v } from "convex/values";
import type { Infer } from "convex/values";

// Structured form model for #35. Predefined field types with built-in rules only: required answers, length and range limits, date bounds, repeat counts. No custom scripts, no arbitrary layouts, no regex editor. The server decides applicability and validity; browser checks are cosmetic.

// A condition reads an earlier choice answer. `values` holds the answers
// that satisfy one rule; `mode` combines rules ("any" matches when one rule
// matches, "all" needs every rule). yes_no answers compare as "true"/"false".
export const conditionValidator = v.object({
  mode: v.union(v.literal("all"), v.literal("any")),
  rules: v.array(
    v.object({ fieldId: v.string(), values: v.array(v.string()) })
  ),
});

const baseField = {
  condition: v.optional(conditionValidator),
  hint: v.optional(v.string()),
  id: v.string(),
  label: v.string(),
  // Guided-fake-input placeholder for #40: an invented example shown inside
  // the input (e.g. "e.g. FAKE-482913"). Optional and cosmetic; the server
  // never validates answer shape against it, and real-looking numbers are
  // never blocked or masked.
  placeholder: v.optional(v.string()),
  required: v.optional(v.boolean()),
};

export const fieldDefinitionValidator = v.union(
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
    max: v.optional(v.number()),
    min: v.optional(v.number()),
  }),
  v.object({
    ...baseField,
    kind: v.literal("date"),
    max: v.optional(v.string()),
    min: v.optional(v.string()),
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
);
export { fieldDefinitionValidator as fieldDefValidator };

export const sectionDefinitionValidator = v.object({
  condition: v.optional(conditionValidator),
  fields: v.array(fieldDefinitionValidator),
  helpText: v.optional(v.string()),
  id: v.string(),
  repeat: v.optional(v.object({ max: v.number(), min: v.number() })),
  // Subset of field ids that repeat per row. Absent with repeat means every
  // field repeats; the rest are asked once above the rows (e.g. present
  // marriage details with a previous-marriages table below).
  repeatFields: v.optional(v.array(v.string())),
  title: v.string(),
});
export { sectionDefinitionValidator as sectionDefValidator };

export const formDefinitionValidator = v.object({
  sections: v.array(sectionDefinitionValidator),
});

export type Condition = Infer<typeof conditionValidator>;
type FieldDefinition = Infer<typeof fieldDefinitionValidator>;
type SectionDefinition = Infer<typeof sectionDefinitionValidator>;
export type FormDefinition = Infer<typeof formDefinitionValidator>;
export type { FieldDefinition as FieldDef, SectionDefinition as SectionDef };

// Answers key field ids to values. Fields inside a repeated section live
// under the section id as an array of per-row objects. Upload answers hold
// file storage ids as strings; the saving mutation (#38) enforces type and
// size by reading the storage row.
export const answerScalarValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.array(v.string())
);
export const answersValidator = v.record(
  v.string(),
  v.union(
    answerScalarValidator,
    v.array(v.record(v.string(), answerScalarValidator))
  )
);
export type Answers = Infer<typeof answersValidator>;
type Scalar = string | number | boolean | string[];

const isScalar = (value: unknown): value is Scalar => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
};

const isAnswerRow = (value: unknown): value is Record<string, Scalar> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const choiceKinds = new Set(["single_choice", "multiple_choice", "yes_no"]);

const isRuleMatch = (
  rule: { fieldId: string; values: string[] },
  getAnswer: (fieldId: string) => Scalar | undefined
): boolean => {
  const answer = getAnswer(rule.fieldId);
  if (answer === undefined) {
    return false;
  }
  const values = new Set(rule.values);
  if (Array.isArray(answer)) {
    return answer.some((item) => values.has(item));
  }
  return values.has(String(answer));
};

// Visibility of one field or section against top-level answers. Conditions
// may only reference top-level (non-repeated) choice fields; row-local
// conditions are not supported (one repeat level only). This is the canonical
// copy: apps/web/lib/form-answers.ts mirrors it for cosmetic client checks,
// and the server re-decides at submit time.
export const isVisible = (
  condition: Condition | undefined,
  getAnswer: (fieldId: string) => Scalar | undefined
): boolean => {
  if (!condition) {
    return true;
  }
  const results = condition.rules.map((rule) => isRuleMatch(rule, getAnswer));
  return condition.mode === "all"
    ? results.every(Boolean)
    : results.some(Boolean);
};

export const topLevelAnswer = (
  answers: Answers,
  fieldId: string
): Scalar | undefined => {
  const value = answers[fieldId];
  return isScalar(value) ? value : undefined;
};

const isEmpty = (value: Scalar | undefined): boolean => {
  if (value === undefined || value === "") {
    return true;
  }
  return Array.isArray(value) && value.length === 0;
};

export interface AnswerError {
  path: string;
  message: string;
}

const emailPattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u;

const isEmail = (value: string): boolean => emailPattern.test(value);
const shortPhoneDigitCounts = new Set([0, 1, 2, 3, 4, 5, 6]);

const isLongerThan = (text: string | undefined, maximum: number): boolean =>
  Boolean(text?.slice(maximum));

const digitCount = (phone: string | undefined): number =>
  (phone?.replaceAll(/\D/gu, "") ?? "").length;

interface CheckContext {
  errors: AnswerError[];
  path: string;
  value: Scalar | undefined;
}

const checkText = (
  field: Extract<
    FieldDefinition,
    { kind: "short_text" } | { kind: "long_text" }
  >,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  if (typeof value !== "string") {
    errors.push({ message: `${field.label} must be text.`, path });
    return;
  }
  const text = value;
  if (field.maxLength !== undefined && isLongerThan(text, field.maxLength)) {
    errors.push({
      message: `${field.label} must be at most ${field.maxLength} characters.`,
      path,
    });
  }
};

const checkNumber = (
  field: Extract<FieldDefinition, { kind: "number" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push({ message: `${field.label} must be a number.`, path });
  } else {
    if (field.min !== undefined && value < field.min) {
      errors.push({
        message: `${field.label} must be at least ${field.min}.`,
        path,
      });
    }
    if (field.max !== undefined && value > field.max) {
      errors.push({
        message: `${field.label} must be at most ${field.max}.`,
        path,
      });
    }
  }
};

const checkDate = (
  field: Extract<FieldDefinition, { kind: "date" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    errors.push({ message: `${field.label} must be a valid date.`, path });
  } else {
    if (field.min !== undefined && value < field.min) {
      errors.push({
        message: `${field.label} must be on or after ${field.min}.`,
        path,
      });
    }
    if (field.max !== undefined && value > field.max) {
      errors.push({
        message: `${field.label} must be on or before ${field.max}.`,
        path,
      });
    }
  }
};

const checkEmail = (
  field: Extract<FieldDefinition, { kind: "email" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  if (typeof value !== "string" || !isEmail(value)) {
    errors.push({
      message: `${field.label} must be a valid email address.`,
      path,
    });
  }
};

const checkPhone = (
  field: Extract<FieldDefinition, { kind: "phone" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  if (typeof value !== "string") {
    errors.push({
      message: `${field.label} must be a valid phone number.`,
      path,
    });
    return;
  }
  const digits = Number(digitCount(value).toString());
  if (shortPhoneDigitCounts.has(digits)) {
    errors.push({
      message: `${field.label} must be a valid phone number.`,
      path,
    });
  }
};

const checkSingleChoice = (
  field: Extract<FieldDefinition, { kind: "single_choice" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  const options = new Set(field.options);
  if (typeof value !== "string" || !options.has(value)) {
    errors.push({
      message: `${field.label} must be one of the listed options.`,
      path,
    });
  }
};

const checkMultipleChoice = (
  field: Extract<FieldDefinition, { kind: "multiple_choice" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  const options = new Set(field.options);
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || !options.has(item))
  ) {
    errors.push({
      message: `${field.label} must only use the listed options.`,
      path,
    });
  }
};

const checkYesNo = (
  field: Extract<FieldDefinition, { kind: "yes_no" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  if (typeof value !== "boolean") {
    errors.push({ message: `${field.label} must be yes or no.`, path });
  }
};

const checkUpload = (
  field: Extract<FieldDefinition, { kind: "upload" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push({
      message: `${field.label} holds invalid file references.`,
      path,
    });
  }
};

const checkDeclaration = (
  field: Extract<FieldDefinition, { kind: "declaration" }>,
  context: CheckContext
): void => {
  const { errors, path, value } = context;
  if (value !== true) {
    errors.push({ message: `${field.label} must be accepted.`, path });
  }
};

const checkScalar = (field: FieldDefinition, context: CheckContext): void => {
  const { errors, path, value } = context;
  if (field.required === true && isEmpty(value)) {
    errors.push({ message: `${field.label} is required.`, path });
    return;
  }
  if (isEmpty(value)) {
    return;
  }
  switch (field.kind) {
    case "short_text":
    case "long_text": {
      checkText(field, { errors, path, value });
      break;
    }
    case "number": {
      checkNumber(field, { errors, path, value });
      break;
    }
    case "date": {
      checkDate(field, { errors, path, value });
      break;
    }
    case "email": {
      checkEmail(field, { errors, path, value });
      break;
    }
    case "phone": {
      checkPhone(field, { errors, path, value });
      break;
    }
    case "single_choice": {
      checkSingleChoice(field, { errors, path, value });
      break;
    }
    case "multiple_choice": {
      checkMultipleChoice(field, { errors, path, value });
      break;
    }
    case "yes_no": {
      checkYesNo(field, { errors, path, value });
      break;
    }
    case "upload": {
      checkUpload(field, { errors, path, value });
      break;
    }
    case "declaration": {
      checkDeclaration(field, { errors, path, value });
      break;
    }
    default: {
      break;
    }
  }
};

// Splits a repeated section into once-asked fields (top-level answers) and
// per-row fields. Without repeatFields every field repeats.
export const splitSection = (
  section: SectionDefinition
): {
  once: FieldDefinition[];
  rows: FieldDefinition[];
} => {
  if (!section.repeat) {
    return { once: section.fields, rows: [] };
  }
  if (!section.repeatFields) {
    return { once: [], rows: section.fields };
  }
  const repeating = new Set(section.repeatFields);
  return {
    once: section.fields.filter((field) => !repeating.has(field.id)),
    rows: section.fields.filter((field) => repeating.has(field.id)),
  };
};

type GetAnswer = (fieldId: string) => Scalar | undefined;

interface ValidationState {
  errors: AnswerError[];
  getAnswer: GetAnswer;
  visible: string[];
}

interface RepeatedSectionData {
  rowFields: FieldDefinition[];
  rows: unknown[];
  section: SectionDefinition;
}

const validateOnceFields = (
  fields: FieldDefinition[],
  state: ValidationState
): void => {
  for (const field of fields) {
    if (!isVisible(field.condition, state.getAnswer)) {
      continue;
    }
    state.visible.push(field.id);
    checkScalar(field, {
      errors: state.errors,
      path: field.id,
      value: state.getAnswer(field.id),
    });
  }
};

const validateAnswerRow = (
  data: RepeatedSectionData,
  entry: [number, unknown],
  state: ValidationState
): void => {
  const [index, row] = entry;
  if (isAnswerRow(row)) {
    for (const field of data.rowFields) {
      const path = `${data.section.id}[${index}].${field.id}`;
      state.visible.push(path);
      checkScalar(field, {
        errors: state.errors,
        path,
        value: row[field.id],
      });
    }
  } else {
    state.errors.push({
      message: `${data.section.title} entry ${index + 1} is invalid.`,
      path: `${data.section.id}[${index}]`,
    });
  }
};

const validateRepeatedRows = (
  data: RepeatedSectionData,
  state: ValidationState
): void => {
  for (const entry of data.rows.entries()) {
    validateAnswerRow(data, entry, state);
  }
};

const validateSection = (
  section: SectionDefinition,
  answers: Answers,
  state: ValidationState
): void => {
  if (!isVisible(section.condition, state.getAnswer)) {
    return;
  }
  if (section.repeat) {
    const { once, rows: rowFields } = splitSection(section);
    validateOnceFields(once, state);
    const rows = answers[section.id];
    const list: unknown[] = Array.isArray(rows) ? rows : [];
    if (list.length < section.repeat.min) {
      state.errors.push({
        message: `${section.title} needs at least ${section.repeat.min} ${section.repeat.min === 1 ? "entry" : "entries"}.`,
        path: section.id,
      });
    }
    if (list.length > section.repeat.max) {
      state.errors.push({
        message: `${section.title} allows at most ${section.repeat.max} ${section.repeat.max === 1 ? "entry" : "entries"}.`,
        path: section.id,
      });
    }
    validateRepeatedRows({ rowFields, rows: list, section }, state);
    return;
  }
  validateOnceFields(section.fields, state);
};

// Server-side answer validation. The validator skips hidden answers entirely: they stay in the saved draft but never block progress and never reach the submission while hidden. Repeated sections validate their once-asked fields from top-level answers and their row fields per entry.
// Returns every error plus the visible field paths.
export const validateAnswers = (
  definition: FormDefinition,
  answers: Answers
): { errors: AnswerError[]; visible: string[] } => {
  const state: ValidationState = {
    errors: [],
    getAnswer: (fieldId) => topLevelAnswer(answers, fieldId),
    visible: [],
  };
  for (const section of definition.sections) {
    validateSection(section, answers, state);
  }
  return { errors: state.errors, visible: state.visible };
};

// Publish checks for #35: invalid rules, missing labels or options, broken
// conditions, and duplicate ids. Source completeness is checked from the form
// doc at publish time, not here.
interface DefinitionState {
  problems: string[];
  seenIds: Set<string>;
}

const validateFieldDefinition = (
  field: FieldDefinition,
  sectionTitle: string,
  state: DefinitionState
): void => {
  if (!field.id) {
    state.problems.push(`A field in "${sectionTitle}" needs an id.`);
    return;
  }
  if (state.seenIds.has(`field:${field.id}`)) {
    state.problems.push(`Duplicate field id "${field.id}".`);
  } else {
    state.seenIds.add(`field:${field.id}`);
  }
  if (!field.label) {
    state.problems.push(`Field "${field.id}" needs a label.`);
  }
  const fieldName = field.label || field.id;
  if (
    (field.kind === "single_choice" || field.kind === "multiple_choice") &&
    (field.options.length < 2 || field.options.some((option) => !option))
  ) {
    state.problems.push(
      `Choice field "${fieldName}" needs at least two non-empty options.`
    );
  }
  if (
    (field.kind === "short_text" || field.kind === "long_text") &&
    field.maxLength !== undefined &&
    field.maxLength < 1
  ) {
    state.problems.push(`Field "${fieldName}" has an impossible length limit.`);
  }
  if (
    field.kind === "number" &&
    field.min !== undefined &&
    field.max !== undefined &&
    field.min > field.max
  ) {
    state.problems.push(
      `Field "${fieldName}" has a minimum above its maximum.`
    );
  }
  if (
    field.kind === "upload" &&
    field.maxSizeBytes !== undefined &&
    field.maxSizeBytes < 1
  ) {
    state.problems.push(
      `Upload field "${fieldName}" has an impossible size limit.`
    );
  }
};

const validateSectionIdentity = (
  section: SectionDefinition,
  state: DefinitionState
): void => {
  if (!section.id) {
    state.problems.push("Every section needs an id.");
  } else if (state.seenIds.has(`section:${section.id}`)) {
    state.problems.push(`Duplicate section id "${section.id}".`);
  } else {
    state.seenIds.add(`section:${section.id}`);
  }
  if (!section.title) {
    state.problems.push(`Section "${section.id || "?"}" needs a title.`);
  }
};

const validateSectionRepeat = (
  section: SectionDefinition,
  state: DefinitionState
): void => {
  if (section.repeat) {
    if (section.repeat.min < 0 || section.repeat.max < 1) {
      state.problems.push(
        `Section "${section.title}" has an impossible repeat count.`
      );
    }
    if (section.repeat.min > section.repeat.max) {
      state.problems.push(
        `Section "${section.title}" repeats a minimum more times than its maximum.`
      );
    }
    if (section.repeatFields) {
      if (section.repeatFields.length === 0) {
        state.problems.push(
          `Section "${section.title}" names no repeating fields.`
        );
      }
      const fieldIds = new Set(section.fields.map((field) => field.id));
      for (const id of section.repeatFields) {
        if (!fieldIds.has(id)) {
          state.problems.push(
            `Section "${section.title}" repeats unknown field "${id}".`
          );
        }
      }
    }
  } else if (section.repeatFields) {
    state.problems.push(
      `Section "${section.title}" names repeating fields without a repeat count.`
    );
  }
};

const validateSectionFields = (
  section: SectionDefinition,
  state: DefinitionState
): void => {
  if (section.fields.length === 0) {
    state.problems.push(`Section "${section.title}" has no fields.`);
  }
  for (const field of section.fields) {
    validateFieldDefinition(field, section.title, state);
  }
  const { rows: rowFields } = splitSection(section);
  for (const field of rowFields) {
    if (field.condition) {
      state.problems.push(
        `Row field "${field.label || field.id}" cannot carry its own condition; gate the section instead.`
      );
    }
  }
};

const validateDefinitionSection = (
  section: SectionDefinition,
  state: DefinitionState
): void => {
  validateSectionIdentity(section, state);
  validateSectionRepeat(section, state);
  validateSectionFields(section, state);
};

interface ConditionState {
  available: Map<string, FieldDefinition>;
  problems: string[];
}

const validateCondition = (
  target: Condition | undefined,
  owner: string,
  state: ConditionState
): void => {
  if (!target) {
    return;
  }
  if (target.rules.length === 0) {
    state.problems.push(`A condition on "${owner}" has no rules.`);
  }
  for (const rule of target.rules) {
    if (!state.available.has(rule.fieldId)) {
      state.problems.push(
        `Condition on "${owner}" reads "${rule.fieldId}", which is not an earlier choice field.`
      );
    } else if (rule.values.length === 0) {
      state.problems.push(`Condition on "${owner}" matches no answers.`);
    }
  }
};

const validateDefinitionConditions = (
  definition: FormDefinition,
  problems: string[]
): void => {
  const state: ConditionState = {
    available: new Map<string, FieldDefinition>(),
    problems,
  };
  for (const section of definition.sections) {
    validateCondition(section.condition, section.title, state);
    for (const field of section.fields) {
      validateCondition(field.condition, field.label || section.title, state);
      if (choiceKinds.has(field.kind) && !section.repeat) {
        state.available.set(field.id, field);
      }
    }
  }
};

export const validateDefinition = (definition: FormDefinition): string[] => {
  const state: DefinitionState = {
    problems: [],
    seenIds: new Set<string>(),
  };
  for (const section of definition.sections) {
    validateDefinitionSection(section, state);
  }
  validateDefinitionConditions(definition, state.problems);
  return state.problems;
};
