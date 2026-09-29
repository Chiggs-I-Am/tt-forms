import type { Answers, FormDefinition } from "./formModel";

// Shared field-id to label map for stored answers. Labels live on the
// definition, not on the row, so row fields share the same map. Used by the
// submit path and the seeded-example path so the printable view renders names
// without re-reading the definition.
const labelsById = (definition: FormDefinition): Map<string, string> => {
  const byId = new Map<string, string>();
  for (const section of definition.sections) {
    for (const field of section.fields) {
      byId.set(field.id, field.label);
    }
  }
  return byId;
};

const addRowLabels = (
  value: Answers[string],
  byId: Map<string, string>,
  labels: Record<string, string>
): void => {
  if (!Array.isArray(value)) {
    return;
  }
  for (const row of value) {
    if (typeof row !== "object" || Array.isArray(row)) {
      continue;
    }
    for (const fieldId of Object.keys(row)) {
      const fieldLabel = byId.get(fieldId);
      if (fieldLabel !== undefined && !Object.hasOwn(labels, fieldId)) {
        labels[fieldId] = fieldLabel;
      }
    }
  }
};

export const labelsFor = (
  definition: FormDefinition,
  snapshot: Answers
): Record<string, string> => {
  const byId = labelsById(definition);
  const labels: Record<string, string> = {};
  for (const [key, value] of Object.entries(snapshot)) {
    const label = byId.get(key);
    if (label !== undefined) {
      labels[key] = label;
    }
    addRowLabels(value, byId, labels);
  }
  return labels;
};
