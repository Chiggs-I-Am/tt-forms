"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import type { FieldDef } from "./builder-types"

function num(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

// Small labeled inputs shared by the kind-specific rule rows: numeric
// limits, date bounds, upload size, and the choice option list.
// Only the rule inputs a kind supports: length for text, range for
// numbers, bounds for dates, options for choices, size for uploads.
export function KindRules({
  field,
  onChange,
}: {
  field: FieldDef
  onChange: (patch: Partial<FieldDef>) => void
}) {
  if (field.kind === "short_text" || field.kind === "long_text") {
    return (
      <RuleInput
        id={`${field.id}-maxlen`}
        label="Maximum length, optional"
        value={field.maxLength?.toString() ?? ""}
        onChange={(v) => onChange({ maxLength: num(v) })}
      />
    )
  }
  if (field.kind === "number") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <RuleInput
          id={`${field.id}-min`}
          label="Minimum, optional"
          value={field.min?.toString() ?? ""}
          onChange={(v) => onChange({ min: num(v) })}
        />
        <RuleInput
          id={`${field.id}-max`}
          label="Maximum, optional"
          value={field.max?.toString() ?? ""}
          onChange={(v) => onChange({ max: num(v) })}
        />
      </div>
    )
  }
  if (field.kind === "date") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <RuleInput
          id={`${field.id}-mindate`}
          label="Earliest date, optional"
          placeholder="YYYY-MM-DD"
          value={field.min ?? ""}
          onChange={(v) => onChange({ min: v || undefined })}
        />
        <RuleInput
          id={`${field.id}-maxdate`}
          label="Latest date, optional"
          placeholder="YYYY-MM-DD"
          value={field.max ?? ""}
          onChange={(v) => onChange({ max: v || undefined })}
        />
      </div>
    )
  }
  if (field.kind === "single_choice" || field.kind === "multiple_choice") {
    return (
      <OptionsEditor
        options={field.options}
        onChange={(options) => onChange({ options })}
      />
    )
  }
  if (field.kind === "upload") {
    return (
      <RuleInput
        id={`${field.id}-maxsize`}
        label="Size limit in MB, optional"
        hint="Blank means the server default. Photos and PDFs cap near 5 MB."
        value={
          field.maxSizeBytes === undefined
            ? ""
            : (field.maxSizeBytes / 1048576).toString()
        }
        onChange={(v) => {
          const mb = num(v)
          onChange({
            maxSizeBytes:
              mb === undefined ? undefined : Math.round(mb * 1048576),
          })
        }}
      />
    )
  }
  return null
}

export function RuleInput({
  id,
  label,
  value,
  hint,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  value: string
  hint?: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function OptionsEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (options: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Options, at least two</Label>
      {options.map((option, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            aria-label={`Option ${i + 1}`}
            value={option}
            onChange={(e) =>
              onChange(options.map((o, j) => (j === i ? e.target.value : o)))
            }
            autoComplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={options.length <= 1}
            onClick={() => onChange(options.filter((_, j) => j !== i))}
          >
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...options, `Option ${options.length + 1}`])}
        >
          Add option
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Publish blocks choice questions with fewer than two non-empty options.
      </p>
    </div>
  )
}
