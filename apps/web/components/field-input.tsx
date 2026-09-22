"use client"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import type { FieldDef, Scalar } from "@/lib/form-answers"

const controlClass =
  "h-11 w-full rounded-none border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

function FieldLabel({ field, htmlFor }: { field: FieldDef; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {field.label}
      {field.required && (
        <span className="text-muted-foreground"> (required)</span>
      )}
    </label>
  )
}

function Hint({ text }: { text?: string }) {
  if (!text) {
    return null
  }
  return <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

// One input per structured field kind. Cosmetic validation only; the server
// re-checks everything at submit time (#37).
export function FieldInput({
  field,
  value,
  files,
  onChange,
  onFiles,
  error,
  idPrefix,
}: {
  field: FieldDef
  value: Scalar | undefined
  files: File[] | undefined
  onChange: (value: Scalar | undefined) => void
  onFiles: (files: File[]) => void
  error?: string
  idPrefix: string
}) {
  const id = `${idPrefix}-${field.id}`
  const invalid = error ? true : undefined

  switch (field.kind) {
    case "short_text":
    case "email":
    case "phone": {
      const type =
        field.kind === "email"
          ? "email"
          : field.kind === "phone"
            ? "tel"
            : "text"
      return (
        <div className="flex flex-col gap-1.5">
          <FieldLabel field={field} htmlFor={id} />
          <Input
            id={id}
            type={type}
            value={typeof value === "string" ? value : ""}
            maxLength={
              field.kind === "short_text" ? field.maxLength : undefined
            }
            onChange={(event) => onChange(event.target.value || undefined)}
            aria-invalid={invalid}
            aria-required={field.required || undefined}
          />
          <Hint text={field.hint} />
          <FieldError message={error} />
        </div>
      )
    }
    case "long_text":
      return (
        <div className="flex flex-col gap-1.5">
          <FieldLabel field={field} htmlFor={id} />
          <textarea
            id={id}
            rows={3}
            value={typeof value === "string" ? value : ""}
            maxLength={field.maxLength}
            onChange={(event) => onChange(event.target.value || undefined)}
            aria-invalid={invalid}
            aria-required={field.required || undefined}
            className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <Hint text={field.hint} />
          <FieldError message={error} />
        </div>
      )
    case "number":
      return (
        <div className="flex flex-col gap-1.5">
          <FieldLabel field={field} htmlFor={id} />
          <Input
            id={id}
            type="number"
            value={typeof value === "number" ? value : ""}
            min={field.min}
            max={field.max}
            onChange={(event) =>
              onChange(
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value)
              )
            }
            aria-invalid={invalid}
            aria-required={field.required || undefined}
          />
          <Hint text={field.hint} />
          <FieldError message={error} />
        </div>
      )
    case "date":
      return (
        <div className="flex flex-col gap-1.5">
          <FieldLabel field={field} htmlFor={id} />
          <Input
            id={id}
            type="date"
            value={typeof value === "string" ? value : ""}
            min={field.min}
            max={field.max}
            onChange={(event) => onChange(event.target.value || undefined)}
            aria-invalid={invalid}
            aria-required={field.required || undefined}
          />
          <Hint text={field.hint} />
          <FieldError message={error} />
        </div>
      )
    case "single_choice":
      return (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">
            {field.label}
            {field.required && (
              <span className="text-muted-foreground"> (required)</span>
            )}
          </legend>
          <div className="flex flex-col gap-1">
            {field.options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={id}
                  value={option}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  className="size-4 accent-primary"
                />
                {option}
              </label>
            ))}
          </div>
          <Hint text={field.hint} />
          <FieldError message={error} />
        </fieldset>
      )
    case "multiple_choice": {
      const selected = Array.isArray(value) ? value : []
      return (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">
            {field.label}
            {field.required && (
              <span className="text-muted-foreground"> (required)</span>
            )}
          </legend>
          <div className="flex flex-col gap-1">
            {field.options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selected, option]
                      : selected.filter((item) => item !== option)
                    onChange(next.length > 0 ? next : undefined)
                  }}
                  className="size-4 accent-primary"
                />
                {option}
              </label>
            ))}
          </div>
          <Hint text={field.hint} />
          <FieldError message={error} />
        </fieldset>
      )
    }
    case "yes_no": {
      const yesId = `${id}-yes`
      const noId = `${id}-no`
      return (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">
            {field.label}
            {field.required && (
              <span className="text-muted-foreground"> (required)</span>
            )}
          </legend>
          <div className="flex gap-4">
            <label htmlFor={yesId} className="flex items-center gap-2 text-sm">
              <input
                id={yesId}
                type="radio"
                name={id}
                checked={value === true}
                onChange={() => onChange(true)}
                className="size-4 accent-primary"
              />
              Yes
            </label>
            <label htmlFor={noId} className="flex items-center gap-2 text-sm">
              <input
                id={noId}
                type="radio"
                name={id}
                checked={value === false}
                onChange={() => onChange(false)}
                className="size-4 accent-primary"
              />
              No
            </label>
          </div>
          <Hint text={field.hint} />
          <FieldError message={error} />
        </fieldset>
      )
    }
    case "upload": {
      const maxMb = field.maxSizeBytes
        ? Math.round(field.maxSizeBytes / (1024 * 1024))
        : 5
      return (
        <div className="flex flex-col gap-1.5">
          <FieldLabel field={field} htmlFor={id} />
          <input
            id={id}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
            className={cn(controlClass, "h-auto py-2")}
          />
          {(files ?? []).length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
              {(files ?? []).map((file) => (
                <li key={`${file.name}-${file.size}`}>
                  {file.name} · {(file.size / 1024).toFixed(0)} KB
                  {field.maxSizeBytes && file.size > field.maxSizeBytes && (
                    <span className="font-medium text-destructive">
                      {" "}
                      exceeds the {maxMb} MB limit
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Hint
            text={
              field.hint ??
              `Images and PDF only, about ${maxMb} MB max. Files stay on this device until you sign in.`
            }
          />
          <FieldError message={error} />
        </div>
      )
    }
    case "declaration":
      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="flex items-start gap-2 text-sm">
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              onChange={(event) =>
                onChange(event.target.checked ? true : undefined)
              }
              aria-required={field.required || undefined}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              {field.label}
              {field.required && (
                <span className="text-muted-foreground"> (required)</span>
              )}
            </span>
          </label>
          <Hint text={field.hint} />
          <FieldError message={error} />
        </div>
      )
  }
}
