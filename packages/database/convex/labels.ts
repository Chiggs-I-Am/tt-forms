import type { Answers, FormDefinition } from "./formModel"

// Shared field-id to label map for stored answers. Labels live on the
// definition, not on the row, so row fields share the same map. Used by the
// submit path and the seeded-example path so the printable view renders names
// without re-reading the definition.
export function labelsFor(
  definition: FormDefinition,
  snapshot: Answers
): Record<string, string> {
  const byId = new Map<string, string>()
  for (const section of definition.sections) {
    for (const field of section.fields) {
      byId.set(field.id, field.label)
    }
  }
  const labels: Record<string, string> = {}
  for (const [key, value] of Object.entries(snapshot)) {
    if (byId.has(key)) {
      labels[key] = byId.get(key)!
    }
    if (Array.isArray(value)) {
      for (const row of value) {
        if (row !== null && typeof row === "object" && !Array.isArray(row)) {
          for (const fieldId of Object.keys(row as Record<string, unknown>)) {
            if (byId.has(fieldId) && !(fieldId in labels)) {
              labels[fieldId] = byId.get(fieldId)!
            }
          }
        }
      }
    }
  }
  return labels
}
