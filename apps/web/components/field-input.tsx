"use client"

import { Controller, type Control } from "react-hook-form"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Textarea } from "@workspace/ui/components/textarea"
import type { FieldDef } from "@/lib/form-answers"

function RequiredMark({ required }: { required?: boolean }) {
  if (!required) {
    return null
  }
  return <span className="text-muted-foreground"> (required)</span>
}

// One shadcn field per structured kind, wired through Controller.
// Validation comes from the zod schema (see lib/form-schema.ts); the server
// re-checks everything at submit time (#37).
export function FormFieldInput({
  control,
  name,
  field,
  id,
}: {
  control: Control<Record<string, unknown>>
  name: string
  field: FieldDef
  id: string
}) {
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
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={id}>
                {field.label}
                <RequiredMark required={field.required} />
              </FieldLabel>
              <Input
                {...controller}
                id={id}
                type={type}
                value={(controller.value as string) ?? ""}
                placeholder={field.placeholder}
                maxLength={
                  field.kind === "short_text" ? field.maxLength : undefined
                }
                aria-invalid={fieldState.invalid}
                aria-required={field.required || undefined}
              />
              {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )
    }
    case "long_text":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={id}>
                {field.label}
                <RequiredMark required={field.required} />
              </FieldLabel>
              <Textarea
                {...controller}
                id={id}
                rows={3}
                value={(controller.value as string) ?? ""}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                aria-invalid={fieldState.invalid}
                aria-required={field.required || undefined}
              />
              {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )
    case "number":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={id}>
                {field.label}
                <RequiredMark required={field.required} />
              </FieldLabel>
              <Input
                id={id}
                type="number"
                value={
                  controller.value === undefined || controller.value === null
                    ? ""
                    : String(controller.value)
                }
                min={field.min}
                max={field.max}
                onChange={(event) =>
                  controller.onChange(
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value)
                  )
                }
                onBlur={controller.onBlur}
                name={controller.name}
                ref={controller.ref}
                aria-invalid={fieldState.invalid}
                aria-required={field.required || undefined}
              />
              {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )
    case "date":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={id}>
                {field.label}
                <RequiredMark required={field.required} />
              </FieldLabel>
              <Input
                {...controller}
                id={id}
                type="date"
                value={(controller.value as string) ?? ""}
                min={field.min}
                max={field.max}
                aria-invalid={fieldState.invalid}
                aria-required={field.required || undefined}
              />
              {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )
    case "single_choice":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                {field.label}
                <RequiredMark required={field.required} />
              </FieldLabel>
              <RadioGroup
                name={controller.name}
                value={(controller.value as string) ?? ""}
                onValueChange={controller.onChange}
                aria-invalid={fieldState.invalid}
              >
                {field.options.map((option, index) => (
                  <div key={option} className="flex items-center gap-2">
                    <RadioGroupItem value={option} id={`${id}-${index}`} />
                    <FieldLabel
                      htmlFor={`${id}-${index}`}
                      className="text-sm font-normal tracking-normal normal-case"
                    >
                      {option}
                    </FieldLabel>
                  </div>
                ))}
              </RadioGroup>
              {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )
    case "multiple_choice": {
      const selected = (value: unknown): string[] =>
        Array.isArray(value) ? (value as string[]) : []
      return (
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                {field.label}
                <RequiredMark required={field.required} />
              </FieldLabel>
              <div className="flex flex-col gap-2">
                {field.options.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <Checkbox
                      id={`${id}-${option}`}
                      name={controller.name}
                      aria-invalid={fieldState.invalid}
                      checked={selected(controller.value).includes(option)}
                      onCheckedChange={(checked) => {
                        const current = selected(controller.value)
                        controller.onChange(
                          checked
                            ? [...current, option]
                            : current.filter((item) => item !== option)
                        )
                      }}
                    />
                    <FieldLabel
                      htmlFor={`${id}-${option}`}
                      className="text-sm font-normal tracking-normal normal-case"
                    >
                      {option}
                    </FieldLabel>
                  </div>
                ))}
              </div>
              {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )
    }
    case "yes_no":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                {field.label}
                <RequiredMark required={field.required} />
              </FieldLabel>
              <RadioGroup
                name={controller.name}
                value={
                  controller.value === true
                    ? "yes"
                    : controller.value === false
                      ? "no"
                      : ""
                }
                onValueChange={(value) => controller.onChange(value === "yes")}
                aria-invalid={fieldState.invalid}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id={`${id}-yes`} />
                  <FieldLabel
                    htmlFor={`${id}-yes`}
                    className="text-sm font-normal tracking-normal normal-case"
                  >
                    Yes
                  </FieldLabel>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id={`${id}-no`} />
                  <FieldLabel
                    htmlFor={`${id}-no`}
                    className="text-sm font-normal tracking-normal normal-case"
                  >
                    No
                  </FieldLabel>
                </div>
              </RadioGroup>
              {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )
    case "upload": {
      const maxMb = field.maxSizeBytes
        ? Math.round(field.maxSizeBytes / (1024 * 1024))
        : 5
      return (
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => {
            const files = Array.isArray(controller.value)
              ? (controller.value as File[])
              : []
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={id}>
                  {field.label}
                  <RequiredMark required={field.required} />
                </FieldLabel>
                <Input
                  id={id}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(event) =>
                    controller.onChange(Array.from(event.target.files ?? []))
                  }
                  onBlur={controller.onBlur}
                  name={controller.name}
                  ref={controller.ref}
                  aria-invalid={fieldState.invalid}
                  aria-required={field.required || undefined}
                  className="h-auto py-2"
                />
                {files.length > 0 && (
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {files.map((file) => (
                      <li key={`${file.name}-${file.size}`}>
                        {file.name} · {(file.size / 1024).toFixed(0)} KB
                      </li>
                    ))}
                  </ul>
                )}
                <FieldDescription>
                  {field.hint ??
                    `Images and PDF only, about ${maxMb} MB max. Files stay on this device until you sign in.`}
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )
          }}
        />
      )
    }
    case "declaration":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field: controller, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id={id}
                name={controller.name}
                aria-invalid={fieldState.invalid}
                aria-required={field.required || undefined}
                checked={controller.value === true}
                onCheckedChange={(checked) =>
                  controller.onChange(checked === true)
                }
              />
              <FieldLabel htmlFor={id}>
                {field.label}
                <RequiredMark required={field.required} />
              </FieldLabel>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )
  }
}
