import { ConvexError } from "convex/values";
import type { FieldDef, SectionDef } from "@/lib/form-answers";

// Draft shape the editor holds. It matches the working-copy definition the
// server stores, so Save passes it straight to saveWorkingCopy and Preview
// passes it straight to FormFiller. The server owns every check.
export interface BuilderDraft {
  name: string;
  agency: string;
  sourceLabel: string;
  sourceUrl: string;
  sections: SectionDef[];
}

export type FieldKind = FieldDef["kind"];

export const fieldKinds: { kind: FieldKind; label: string }[] = [
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
];

const freshId = (() => {
  let count = 0;
  return (prefix: string): string => {
    count += 1;
    return `${prefix}_${Date.now().toString(36)}${count}`;
  };
})();

export const blankSection = (): SectionDef => {
  const id = freshId("section");
  return { fields: [], id, title: "New section" };
};

export const blankField = (kind: FieldKind): FieldDef => {
  const base = { id: freshId("field"), label: "New question" };
  const field: FieldDef =
    kind === "single_choice" || kind === "multiple_choice"
      ? { ...base, kind, options: ["Option 1", "Option 2"] }
      : { ...base, kind };
  return field;
};

export interface ChoiceOption {
  id: string;
  label: string;
  options: string[];
}

const choiceKinds = new Set<FieldKind>([
  "single_choice",
  "multiple_choice",
  "yes_no",
]);

const isChoice = (field: FieldDef): boolean => choiceKinds.has(field.kind);

const choiceOptions = (field: FieldDef): string[] => {
  if (field.kind === "single_choice" || field.kind === "multiple_choice") {
    return field.options;
  }
  return ["true", "false"];
};

// Earlier top-level choice fields a condition may read, per the server rule:
// document order, non-repeated sections only. `upto` bounds the same-section
// prefix for field-level conditions; section-level conditions pass none.
export const earlierChoices = (
  sections: SectionDef[],
  sectionIndex: number,
  upto?: number
): ChoiceOption[] => {
  const out: ChoiceOption[] = [];
  const eligibleSections = sections.slice(0, sectionIndex + 1);
  for (const [index, section] of eligibleSections.entries()) {
    if (section.repeat) {
      continue;
    }
    const fields =
      index === sectionIndex && upto !== undefined
        ? section.fields.slice(0, upto)
        : section.fields;
    for (const field of fields) {
      if (isChoice(field)) {
        out.push({
          id: field.id,
          label: field.label || field.id,
          options: choiceOptions(field),
        });
      }
    }
  }
  return out;
};

const errorDataText = (data: unknown, fallback: string): string =>
  typeof data === "string" ? data : fallback;

// Readable text for a Convex denial or publish block. The server message is
// the check result, so it renders verbatim.
export const errorText = (error: unknown): string => {
  if (error instanceof ConvexError) {
    return errorDataText(error.data, error.message);
  }
  return Error.isError(error) ? error.message : "Something went wrong.";
};

export {
  type Condition,
  type SectionDef,
  type FieldDef,
} from "@/lib/form-answers";
