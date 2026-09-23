"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  FormProvider,
  useFieldArray,
  useForm,
  type Control,
  type FieldValues,
} from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
import type { Id } from "@workspace/database/data-model"
import { FormFieldInput } from "@/components/field-input"
import { DraftSync } from "@/components/draft-sync"
import { SubmitPanel } from "@/components/submit-panel"
import {
  deserialize,
  displayTitle,
  ensureRows,
  hiddenSections,
  isVisible,
  serialize,
  splitSection,
  topLevelAnswer,
  visibleFields,
  visibleSections,
  type Answers,
  type FieldDef,
  type Scalar,
  type SectionDef,
  type VersionDefinition,
} from "@/lib/form-answers"
import { buildFormSchema } from "@/lib/form-schema"

const STORAGE_PREFIX = "tt-forms:apply:"

function readBackup(key: string): Answers {
  try {
    return deserialize(window.localStorage.getItem(STORAGE_PREFIX + key))
  } catch {
    return {}
  }
}

// Structural defaults: empty scalars plus minimum rows per repeat section.
// The backup merges over this on mount.
function structuralDefaults(definition: VersionDefinition) {
  const out: Record<string, unknown> = {}
  for (const section of definition.sections) {
    if (section.repeat) {
      out[section.id] = Array.from({ length: section.repeat.min }, () => ({}))
    }
  }
  return out
}

function mergeBackup(
  definition: VersionDefinition,
  backup: Answers
): Record<string, unknown> {
  const merged: Answers = { ...backup }
  for (const section of definition.sections) {
    if (section.repeat) {
      merged[section.id] = ensureRows(merged, section)
    }
  }
  return merged
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "—"
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—"
    }
    if (value.some((item) => typeof item === "object")) {
      return (value as File[]).map((f) => f.name).join(", ")
    }
    return (value as Scalar[]).join(", ")
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  return String(value)
}

// Repeat group with add/remove bounded by the section min/max, per the
// shadcn useFieldArray pattern (field.id as key, Controller per item).
function RepeatGroup({
  control,
  section,
  rowFields,
}: {
  control: Control<FieldValues>
  section: SectionDef
  rowFields: SectionDef["fields"]
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: section.id,
  })
  const min = section.repeat?.min ?? 0
  const max = section.repeat?.max ?? fields.length

  return (
    <div className="flex flex-col gap-5">
      {fields.map((item, rowIndex) => (
        <div
          key={item.id}
          className="flex flex-col gap-4 border-l-2 border-border pl-4"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">Entry</p>
            {fields.length > min && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => remove(rowIndex)}
              >
                Remove
              </Button>
            )}
          </div>
          {rowFields.map((field) => (
            <FormFieldInput
              key={field.id}
              control={control}
              name={`${section.id}.${rowIndex}.${field.id}`}
              field={field}
              id={`${section.id}-${rowIndex}-${field.id}`}
            />
          ))}
        </div>
      ))}
      {fields.length < max && (
        <Button type="button" variant="outline" onClick={() => append({})}>
          Add entry
        </Button>
      )}
    </div>
  )
}

// Full 1:1 fill view on React Hook Form, per the shadcn pattern (useForm +
// zodResolver + Controller + Field primitives). Sections render one at a
// time; conditions evaluate locally (cosmetic); hidden answers stay in the
// draft. Answers persist to this browser, and signed-in applicants autosave
// to one server draft per form with merge prompts (#36).
export function FormFiller({
  storageKey,
  definition,
  formId,
  versionId,
}: {
  storageKey: string
  definition: VersionDefinition
  formId?: Id<"forms"> | null
  versionId?: Id<"formVersions"> | null
}) {
  const schema = useMemo(
    () => buildFormSchema(definition.sections),
    [definition]
  )
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(() => structuralDefaults(definition), [definition]),
  })
  const { control, reset, trigger, watch } = form
  const [index, setIndex] = useState(0)
  const [reviewing, setReviewing] = useState(false)
  const restoredRef = useRef(false)

  // Client-only restore: reading localStorage during render would split
  // server and client HTML.
  useEffect(() => {
    reset(mergeBackup(definition, readBackup(storageKey)))
    restoredRef.current = true
    // Restore once; later keystrokes are the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  useEffect(() => {
    const subscription = watch((values) => {
      if (!restoredRef.current) {
        return
      }
      try {
        window.localStorage.setItem(
          STORAGE_PREFIX + storageKey,
          serialize(values as Answers)
        )
      } catch {
        // Private mode or full storage: browser state still holds the answers.
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, storageKey])

  const values = watch()
  const answers = values as unknown as Answers
  const labels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const section of definition.sections) {
      for (const field of section.fields) {
        map[field.id] = field.label
      }
    }
    return map
  }, [definition])
  const sections = useMemo(
    () => visibleSections(definition, answers),
    // Recompute whenever any answer changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [definition, values]
  )
  const hidden = useMemo(
    () => hiddenSections(definition, answers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [definition, values]
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

  // Visible field paths for trigger(): top-level ids plus row cell paths.
  function visibleNames(target: SectionDef): string[] {
    const names: string[] = []
    const { once, rows: rowFields } = target.repeat
      ? splitSection(target)
      : { once: visibleFields(target, answers), rows: [] }
    for (const field of once) {
      if (isVisible(field.condition, answers)) {
        names.push(field.id)
      }
    }
    const rows = target.repeat ? ensureRows(answers, target) : []
    rows.forEach((_, rowIndex) => {
      for (const field of rowFields) {
        names.push(`${target.id}.${rowIndex}.${field.id}`)
      }
    })
    return names
  }

  async function goNext() {
    if (!section) {
      return
    }
    const valid = await trigger(visibleNames(section) as never[])
    if (!valid) {
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
            Demo submission. Nothing here reaches the government; every answer
            must be fake. Hidden answers are kept but never submitted while
            hidden. Signed-in applicants autosave to one draft per form;
            anonymous answers live in this browser only.
          </p>
        </div>
        {sections.map((s) => (
          <section
            key={s.id}
            aria-label={displayTitle(s.title)}
            className="flex flex-col gap-2"
          >
            <h3 className="text-sm font-medium">{displayTitle(s.title)}</h3>
            <SectionReview section={s} answers={answers} />
          </section>
        ))}
        <SubmitPanel
          formId={formId}
          localAnswers={answers}
          definition={definition}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setReviewing(false)}>
            Back to editing
          </Button>
        </div>
      </div>
    )
  }

  const split: { once: FieldDef[]; rows: FieldDef[] } = section.repeat
    ? splitSection(section)
    : { once: visibleFields(section, answers), rows: [] as FieldDef[] }
  const { once } = split
  const position =
    sections.length <= 1 ? 100 : (clamped / (sections.length - 1)) * 100

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <DraftSync
          formId={formId ?? null}
          versionId={versionId ?? null}
          localAnswers={answers}
          labels={labels}
          onApplyAnswers={(serverAnswers) =>
            reset(mergeBackup(definition, serverAnswers))
          }
        />
        <nav aria-label="Sections" className="flex flex-col gap-3">
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={Math.max(sections.length, 1)}
            aria-valuenow={clamped + 1}
            aria-label="Form progress"
            className="h-1 w-full bg-muted"
          >
            <div
              className="h-full bg-primary"
              style={{ width: `${position}%` }}
            />
          </div>
          <p className="sr-only">
            Section {clamped + 1} of {sections.length}
          </p>
          <ol className="flex flex-wrap gap-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === clamped ? "step" : undefined}
                  className={
                    i === clamped
                      ? "border border-primary px-2 py-1 text-xs font-medium"
                      : "border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary"
                  }
                >
                  {displayTitle(s.title)}
                </button>
              </li>
            ))}
            {hidden.map((s) => (
              <li key={s.id}>
                <span
                  aria-disabled="true"
                  title={s.helpText ?? "Answer earlier questions to reveal it."}
                  className="inline-block cursor-not-allowed border border-dashed border-border px-2 py-1 text-xs text-muted-foreground"
                >
                  {displayTitle(s.title)} · hidden
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <section
          aria-labelledby="section-title"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2 id="section-title" className="text-lg font-medium">
              {displayTitle(section.title)}
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
          </div>

          {section.repeat ? (
            <div className="flex flex-col gap-5">
              {once
                .filter((field) => isVisible(field.condition, answers))
                .map((field) => (
                  <FormFieldInput
                    key={field.id}
                    control={control}
                    name={field.id}
                    field={field}
                    id={`${section.id}-${field.id}`}
                  />
                ))}
              <RepeatGroup
                control={control}
                section={section}
                rowFields={splitSection(section).rows}
              />
            </div>
          ) : (
            once.map((field) => (
              <FormFieldInput
                key={field.id}
                control={control}
                name={field.id}
                field={field}
                id={`${section.id}-${field.id}`}
              />
            ))
          )}

          <div className="flex gap-2">
            {clamped > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIndex(clamped - 1)}
              >
                Back
              </Button>
            )}
            <Button type="button" onClick={goNext}>
              {clamped === sections.length - 1 ? "Review answers" : "Continue"}
            </Button>
          </div>
        </section>
      </div>
    </FormProvider>
  )
}

function SectionReview({
  section,
  answers,
}: {
  section: SectionDef
  answers: Answers
}) {
  if (!section.repeat) {
    return (
      <>
        {visibleFields(section, answers).map((f) => (
          <p key={f.id} className="text-sm">
            <span className="text-muted-foreground">{f.label}: </span>
            {formatValue(topLevelAnswer(answers, f.id))}
          </p>
        ))}
      </>
    )
  }
  const { once, rows: rowFields } = splitSection(section)
  return (
    <>
      {once
        .filter((f) => isVisible(f.condition, answers))
        .map((f) => (
          <p key={f.id} className="text-sm">
            <span className="text-muted-foreground">{f.label}: </span>
            {formatValue(topLevelAnswer(answers, f.id))}
          </p>
        ))}
      {ensureRows(answers, section).map((row, i) => (
        <div
          key={i}
          className="flex flex-col gap-1 border-l-2 border-border pl-3"
        >
          <p className="font-mono text-xs text-muted-foreground">Entry</p>
          {rowFields.map((f) => (
            <p key={f.id} className="text-sm">
              <span className="text-muted-foreground">{f.label}: </span>
              {formatValue(row[f.id])}
            </p>
          ))}
        </div>
      ))}
    </>
  )
}
