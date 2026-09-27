import type { Doc } from "@workspace/database/data-model";

// Client-side answer model for the applicant fill view. Mirrors the server shape in convex/formModel.ts: scalars per field, row arrays under repeated section ids. Uploads live outside this model as File objects in memory; only names persist to the localStorage backup.
//
// Visibility here is cosmetic. The server re-decides applicability at submit
// time (#37) and never trusts these answers.

export type Scalar = string | number | boolean | string[];
export type Row = Record<string, Scalar | File[]>;
export type StoredRow = Record<string, Scalar>;
export type Answers = Record<string, Scalar | StoredRow[] | File[]>;

export type VersionDefinition = Doc<"formVersions">["definition"];
export type SectionDefinition = VersionDefinition["sections"][number];
export type FieldDefinition = SectionDefinition["fields"][number];
export type Condition = NonNullable<SectionDefinition["condition"]>;

export type { FieldDefinition as FieldDef, SectionDefinition as SectionDef };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  const isObject = typeof value === "object" && value !== null;
  return isObject && !Array.isArray(value) && !(value instanceof File);
};

const isStringArray = (value: unknown[]): value is string[] =>
  value.every((item) => typeof item === "string");

const isPrimitiveScalar = (
  value: unknown
): value is string | number | boolean => {
  const isString = typeof value === "string";
  const isNumber = typeof value === "number";
  const isBoolean = typeof value === "boolean";
  return isString || isNumber || isBoolean;
};

const isScalar = (value: unknown): value is Scalar => {
  const isArrayScalar = Array.isArray(value) && isStringArray(value);
  return isPrimitiveScalar(value) || isArrayScalar;
};

const isStoredRow = (value: unknown): value is StoredRow =>
  isRecord(value) && Object.values(value).every(isScalar);

const isStoredAnswer = (value: unknown): value is Scalar | StoredRow[] =>
  isScalar(value) || (Array.isArray(value) && value.every(isStoredRow));

const isAnswers = (value: unknown): value is Answers =>
  isRecord(value) && Object.values(value).every(isStoredAnswer);

// Mirrors topLevelAnswer in convex/formModel.ts for cosmetic client checks;
// the server re-decides applicability at submit time (#37) and never trusts
// these answers.
export const topLevelAnswer = (
  answers: Answers,
  fieldId: string
): Scalar | undefined => {
  const value = answers[fieldId];
  let result: Scalar | null = null;
  if (Array.isArray(value)) {
    if (value.length === 0) {
      result = [];
    } else if (isStringArray(value)) {
      result = value;
    }
  } else if (value !== undefined && typeof value !== "object") {
    result = value;
  }
  return result ?? undefined;
};

// Mirrors ruleMatches in convex/formModel.ts.
const isRuleMatch = (
  rule: { fieldId: string; values: string[] },
  getAnswer: (fieldId: string) => Scalar | undefined
): boolean => {
  const answer = getAnswer(rule.fieldId);
  if (answer === undefined) {
    return false;
  }
  const allowedValues = new Set(rule.values);
  if (Array.isArray(answer)) {
    return answer.some(
      (item) => typeof item === "string" && allowedValues.has(item)
    );
  }
  return allowedValues.has(String(answer));
};

export const isVisible = (
  condition: Condition | undefined,
  answers: Answers
): boolean => {
  if (condition === undefined) {
    return true;
  }
  const getAnswer = (fieldId: string) => topLevelAnswer(answers, fieldId);
  const results = condition.rules.map((rule) => isRuleMatch(rule, getAnswer));
  return condition.mode === "all"
    ? results.every(Boolean)
    : results.some(Boolean);
};

export const visibleSections = function visibleSections(
  definition: VersionDefinition,
  answers: Answers
): SectionDefinition[] {
  return definition.sections.filter((section) =>
    isVisible(section.condition, answers)
  );
};

// Display titles strip paper numbering ("1. Names", "Part I. ...").
// Numbering stays in the Convex definitions (the 1:1 record); the UI shows
// plain names plus a position progress bar.
export const displayTitle = function displayTitle(
  title: string | null | undefined
): string {
  return (title ?? "")
    .replace(/^\d+\.\s*/u, "")
    .replace(/^Part\s+[IVXLCDM]+.?\s*/iu, "")
    .replace(/^Section\s+\d+\s*[:.-]?\s*/iu, "")
    .trim();
};

// Sections hidden by their condition, shown locked in the nav so paper
// numbering never jumps. The section help text doubles as the reason.
export const hiddenSections = function hiddenSections(
  definition: VersionDefinition,
  answers: Answers
): SectionDefinition[] {
  return definition.sections.filter(
    (section) => !isVisible(section.condition, answers)
  );
};

export const sectionReason = (section: SectionDefinition): string =>
  section.helpText ?? "Answer earlier questions to reveal it.";

export const visibleFields = function visibleFields(
  section: SectionDefinition,
  answers: Answers
): FieldDefinition[] {
  return section.fields.filter((field) => isVisible(field.condition, answers));
};

// Mirrors splitSection in convex/formModel.ts (duplicated because the web
// app cannot import Convex server modules; the server re-checks everything).
export const splitSection = (
  section: SectionDefinition
): {
  once: FieldDefinition[];
  rows: FieldDefinition[];
} => {
  if (section.repeat === undefined) {
    return { once: section.fields, rows: [] };
  }
  if (section.repeatFields === undefined) {
    return { once: [], rows: section.fields };
  }
  const repeating = new Set(section.repeatFields);
  return {
    once: section.fields.filter((field) => !repeating.has(field.id)),
    rows: section.fields.filter((field) => repeating.has(field.id)),
  };
};

// Rows a repeated section must hold: pad with empty rows up to the minimum.
// Never mutates the answers object; returns a fresh array.
export const ensureRows = (
  answers: Answers,
  section: SectionDefinition
): StoredRow[] => {
  const current = answers[section.id];
  const rows: StoredRow[] =
    Array.isArray(current) && current.every(isStoredRow)
      ? current.map((row) => ({ ...row }))
      : [];
  if (section.repeat === undefined) {
    return rows;
  }
  const minimum = section.repeat.min;
  while (rows.length < minimum) {
    rows.push({});
  }
  return rows.slice(0, Math.max(rows.length, minimum));
};

// Strip File objects before the localStorage backup; uploads stay in memory
// for the session and are flagged as such in the UI. Scalar arrays
// (multiple_choice string selections) are preserved as-is; only row arrays
// are filtered to object entries.
export const serialize = (answers: Answers): string => {
  const clean: Record<string, Scalar | StoredRow[]> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (!(value instanceof File)) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          clean[key] = [];
        } else if (value.every((item) => !(item instanceof File))) {
          clean[key] = isStringArray(value) ? value : value.filter(isStoredRow);
        }
      } else if (isScalar(value)) {
        clean[key] = value;
      }
    }
  }
  return JSON.stringify(clean);
};

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
};

export const deserialize = (raw: string | null): Answers => {
  if (raw === null || raw === "") {
    return {};
  }
  const parsed = parseJson(raw);
  return isAnswers(parsed) ? parsed : {};
};
