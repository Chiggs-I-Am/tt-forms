"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { FieldInput } from "@/components/field-input"
import { useLocalAnswers } from "@/components/use-local-answers"
import {
  ensureRows,
  topAnswer,
  visibleFields,
  visibleSections,
  type Answers,
  type Scalar,
  type SectionDef,
  type VersionDefinition,
} from "@/lib/form-answers"

function isEmpty(value: Scalar | undefined): boolean {
  return (
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
}

// Missing required answers in one section (cosmetic check; the server
// re-validates at submit). Returns field paths with messages.
function sectionErrors(
  section: SectionDef,
  answers: Answers,
  files: Record<string, File[]>
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (section.repeat) {
    const rows = ensureRows(answers, section)
    if (rows.length < section.repeat.min) {
      errors[section.id] =
        `Add at least ${section.repeat.min} ${section.repeat.min === 1 ? "entry" : "entries"}.`
    }
    rows.forEach((row, index) => {
      for (const field of section.fields) {
        const missing = checkField(
          field,
          row[field.id],
          files[`${section.id}[${index}].${field.id}`]
        )
        if (missing) {
          errors[`${section.id}[${index}].${field.id}`] = missing
        }
      }
    })
    return errors
  }
  for (const field of visibleFields(section, answers)) {
    const missing = checkField(
      field,
      topAnswer(answers, field.id),
      files[field.id]
    )
    if (missing) {
      errors[field.id] = missing
    }
  }
  return errors
}

function checkField(
  field: { id: string; label: string; required?: boolean; kind: string },
  value: Scalar | undefined,
  fieldFiles: File[] | undefined
): string | undefined {
  if (!field.required || !isEmpty(value)) {
    if (
      field.kind === "upload" &&
      field.required &&
      (fieldFiles ?? []).length === 0
    ) {
      return `${field.label} needs a file.`
    }
    return undefined
  }
  if (field.kind === "declaration") {
    return `${field.label} must be accepted.`
  }
  return `${field.label} is required.`
}

function formatValue(value: Scalar | File[] | undefined): string {
  if (value === undefined) {
    return "—"
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—"
    }
    if (value.some((item) => typeof item === "object")) {
      return (value as File[]).map((f) => f.name).join(", ")
    }
    return (value as string[]).join(", ")
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  return String(value)
}

// Full 1:1 fill view. Renders every section of the live version one at a
// time with per-field hints, evaluates conditions locally (cosmetic), keeps
// hidden answers in the draft, and stores everything in this browser only.
// Server saving and submission arrive in #36/#37.
export function FormFiller({
  storageKey,
  definition,
}: {
  storageKey: string
  definition: VersionDefinition
}) {
  const { answers, setScalar, setCell, addRow, removeRow } = useLocalAnswers(
    storageKey,
    definition
  )
  const [files, setFiles] = useState<Record<string, File[]>>({})
  const [index, setIndex] = useState(0)
  const [reviewing, setReviewing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sections = useMemo(
    () => visibleSections(definition, answers),
    [definition, answers]
  )
  const clamped = Math.min(index, Math.max(sections.length - 1, 0))
  const section = sections[clamped]

  if (!section) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        This version has no visible sections.
      </p>
    )
  }

  function goNext() {
    if (!section) {
      return
    }
    const found = sectionErrors(section, answers, files)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      return
    }
    if (clamped === sections.length - 1) {
      setReviewing(true)
      return
    }
    setIndex(clamped + 1)
  }

  if (reviewing) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">Review your answers</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hidden answers are kept but never submitted while hidden. Server
            saving arrives in the next build; everything below lives in this
            browser only.
          </p>
        </div>
        {sections.map((s) => (
          <section
            key={s.id}
            aria-label={s.title}
            className="flex flex-col gap-2"
          >
            <h3 className="text-sm font-medium">{s.title}</h3>
            {s.repeat
              ? ensureRows(answers, s).map((row, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 border-l-2 border-border pl-3"
                  >
                    <p className="font-mono text-xs text-muted-foreground">
                      Entry {i + 1}
                    </p>
                    {s.fields.map((f) => (
                      <p key={f.id} className="text-sm">
                        <span className="text-muted-foreground">
                          {f.label}:{" "}
                        </span>
                        {formatValue(row[f.id])}
                      </p>
                    ))}
                  </div>
                ))
              : visibleFields(s, answers).map((f) => (
                  <p key={f.id} className="text-sm">
                    <span className="text-muted-foreground">{f.label}: </span>
                    {formatValue(topAnswer(answers, f.id))}
                  </p>
                ))}
          </section>
        ))}
        <div className="flex flex-col gap-2 border border-border bg-card p-4">
          <p className="text-sm leading-relaxed">
            Nothing has been sent anywhere. Sign in to keep these answers for
            the first server save.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/signin" className={cn(buttonVariants())}>
              Sign in to save
            </Link>
            <Button variant="outline" onClick={() => setReviewing(false)}>
              Back to editing
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const rows = section.repeat ? ensureRows(answers, section) : []

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Sections" className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Section {clamped + 1} of {sections.length}
        </p>
        <ol className="flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setErrors({})
                  setIndex(i)
                }}
                aria-current={i === clamped ? "step" : undefined}
                className={
                  i === clamped
                    ? "border border-primary px-2 py-1 text-xs font-medium"
                    : "border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary"
                }
              >
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section aria-labelledby="section-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="section-title" className="text-lg font-medium">
            {section.title}
          </h2>
          {section.helpText && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {section.helpText}
            </p>
          )}
          {section.repeat && (
            <p className="text-xs text-muted-foreground">
              {section.repeat.min === section.repeat.max
                ? `Exactly ${section.repeat.min} ${section.repeat.min === 1 ? "entry" : "entries"} required.`
                : `${section.repeat.min} to ${section.repeat.max} entries.`}
            </p>
          )}
          {errors[section.id] && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors[section.id]}
            </p>
          )}
        </div>

        {section.repeat ? (
          <div className="flex flex-col gap-5">
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex flex-col gap-4 border-l-2 border-border pl-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">
                    Entry {rowIndex + 1}
                  </p>
                  {rows.length > section.repeat!.min && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(section, rowIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {section.fields.map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    value={row[field.id] as Scalar | undefined}
                    files={files[`${section.id}[${rowIndex}].${field.id}`]}
                    onChange={(value) =>
                      setCell(section, rowIndex, field.id, value)
                    }
                    onFiles={(next) =>
                      setFiles((prev) => ({
                        ...prev,
                        [`${section.id}[${rowIndex}].${field.id}`]: next,
                      }))
                    }
                    error={errors[`${section.id}[${rowIndex}].${field.id}`]}
                    idPrefix={`${section.id}-${rowIndex}`}
                  />
                ))}
              </div>
            ))}
            {rows.length < section.repeat.max && (
              <Button variant="outline" onClick={() => addRow(section)}>
                Add entry
              </Button>
            )}
          </div>
        ) : (
          visibleFields(section, answers).map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={topAnswer(answers, field.id)}
              files={files[field.id]}
              onChange={(value) => setScalar(field.id, value)}
              onFiles={(next) =>
                setFiles((prev) => ({ ...prev, [field.id]: next }))
              }
              error={errors[field.id]}
              idPrefix={section.id}
            />
          ))
        )}

        <div className="flex gap-2">
          {clamped > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setErrors({})
                setIndex(clamped - 1)
              }}
            >
              Back
            </Button>
          )}
          <Button onClick={goNext}>
            {clamped === sections.length - 1 ? "Review answers" : "Continue"}
          </Button>
        </div>
      </section>
    </div>
  )
}
