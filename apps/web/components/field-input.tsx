"use client";

import { Controller, type Control } from "react-hook-form";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Textarea } from "@workspace/ui/components/textarea";
import type { FieldDefinition } from "@/lib/form-answers";

type TextField =
  | Extract<FieldDefinition, { kind: "short_text" }>
  | Extract<FieldDefinition, { kind: "email" }>
  | Extract<FieldDefinition, { kind: "phone" }>;
type LongTextField = Extract<FieldDefinition, { kind: "long_text" }>;
type NumberField = Extract<FieldDefinition, { kind: "number" }>;
type DateField = Extract<FieldDefinition, { kind: "date" }>;
type SingleChoiceField = Extract<FieldDefinition, { kind: "single_choice" }>;
type MultipleChoiceField = Extract<
  FieldDefinition,
  { kind: "multiple_choice" }
>;
type YesNoField = Extract<FieldDefinition, { kind: "yes_no" }>;
type UploadField = Extract<FieldDefinition, { kind: "upload" }>;
type DeclarationField = Extract<FieldDefinition, { kind: "declaration" }>;

interface ControllerProps<TField extends FieldDefinition> {
  readonly control: Control<Record<string, unknown>>;
  readonly field: TField;
  readonly id: string;
  readonly name: string;
}

const RequiredMark = ({ required }: { readonly required?: boolean }) => {
  if (required !== true) {
    return null;
  }
  return <span className="text-muted-foreground"> (required)</span>;
};

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const selectedValues = (value: unknown): string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];

const yesNoAnswer = (value: string): boolean => value === "yes";

const TextController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<TextField>) => {
  const type =
    field.kind === "email" ? "email" : field.kind === "phone" ? "tel" : "text";
  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onBlur: handleBlur, ...controller },
        fieldState,
      }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>
            {field.label}
            <RequiredMark required={field.required} />
          </FieldLabel>
          <Input
            {...controller}
            id={id}
            type={type}
            value={stringValue(controller.value)}
            placeholder={field.placeholder}
            maxLength={
              field.kind === "short_text" ? field.maxLength : undefined
            }
            aria-invalid={fieldState.invalid}
            aria-required={field.required === true || undefined}
            onBlur={handleBlur}
          />
          {field.hint ? (
            <FieldDescription>{field.hint}</FieldDescription>
          ) : null}
          {fieldState.invalid ? (
            <FieldError errors={[fieldState.error]} />
          ) : null}
        </Field>
      )}
    />
  );
};

const LongTextController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<LongTextField>) => (
  <Controller
    name={name}
    control={control}
    render={({ field: { onBlur: handleBlur, ...controller }, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={id}>
          {field.label}
          <RequiredMark required={field.required} />
        </FieldLabel>
        <Textarea
          {...controller}
          id={id}
          rows={3}
          value={stringValue(controller.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          aria-invalid={fieldState.invalid}
          aria-required={field.required === true || undefined}
          onBlur={handleBlur}
        />
        {field.hint ? <FieldDescription>{field.hint}</FieldDescription> : null}
        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
      </Field>
    )}
  />
);

const NumberController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<NumberField>) => (
  <Controller
    name={name}
    control={control}
    render={({
      field: { onBlur: handleBlur, onChange: handleChange, ...controller },
      fieldState,
    }) => (
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
            handleChange(
              event.target.value === "" ? undefined : Number(event.target.value)
            )
          }
          onBlur={handleBlur}
          name={controller.name}
          ref={controller.ref}
          aria-invalid={fieldState.invalid}
          aria-required={field.required === true || undefined}
        />
        {field.hint ? <FieldDescription>{field.hint}</FieldDescription> : null}
        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
      </Field>
    )}
  />
);

const DateController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<DateField>) => (
  <Controller
    name={name}
    control={control}
    render={({ field: { onBlur: handleBlur, ...controller }, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={id}>
          {field.label}
          <RequiredMark required={field.required} />
        </FieldLabel>
        <Input
          {...controller}
          id={id}
          type="date"
          value={stringValue(controller.value)}
          min={field.min}
          max={field.max}
          aria-invalid={fieldState.invalid}
          aria-required={field.required === true || undefined}
          onBlur={handleBlur}
        />
        {field.hint ? <FieldDescription>{field.hint}</FieldDescription> : null}
        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
      </Field>
    )}
  />
);

const SingleChoiceController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<SingleChoiceField>) => (
  <Controller
    name={name}
    control={control}
    render={({
      field: { onChange: handleValueChange, ...controller },
      fieldState,
    }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel>
          {field.label}
          <RequiredMark required={field.required} />
        </FieldLabel>
        <RadioGroup
          name={controller.name}
          value={stringValue(controller.value)}
          onValueChange={handleValueChange}
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
        {field.hint ? <FieldDescription>{field.hint}</FieldDescription> : null}
        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
      </Field>
    )}
  />
);

const MultipleChoiceController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<MultipleChoiceField>) => (
  <Controller
    name={name}
    control={control}
    render={({
      field: { onChange: handleChange, ...controller },
      fieldState,
    }) => {
      const selectedOptions = new Set(selectedValues(controller.value));
      return (
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
                  checked={selectedOptions.has(option)}
                  onCheckedChange={(checked) => {
                    const current = selectedValues(controller.value);
                    handleChange(
                      checked
                        ? [...current, option]
                        : current.filter((item) => item !== option)
                    );
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
          {field.hint ? (
            <FieldDescription>{field.hint}</FieldDescription>
          ) : null}
          {fieldState.invalid ? (
            <FieldError errors={[fieldState.error]} />
          ) : null}
        </Field>
      );
    }}
  />
);

const YesNoController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<YesNoField>) => (
  <Controller
    name={name}
    control={control}
    render={({
      field: { onChange: handleValueChange, ...controller },
      fieldState,
    }) => (
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
          onValueChange={(value) => handleValueChange(yesNoAnswer(value))}
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
        {field.hint ? <FieldDescription>{field.hint}</FieldDescription> : null}
        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
      </Field>
    )}
  />
);

const UploadController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<UploadField>) => {
  const maxMb =
    field.maxSizeBytes === undefined
      ? 5
      : Math.round(field.maxSizeBytes / (1024 * 1024));
  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onBlur: handleBlur, onChange: handleChange, ...controller },
        fieldState,
      }) => {
        const files = Array.isArray(controller.value)
          ? controller.value.filter(
              (file): file is File => file instanceof File
            )
          : [];
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
                handleChange(Array.from(event.target.files ?? []))
              }
              onBlur={handleBlur}
              name={controller.name}
              ref={controller.ref}
              aria-invalid={fieldState.invalid}
              aria-required={field.required === true || undefined}
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
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : null}
          </Field>
        );
      }}
    />
  );
};

const DeclarationController = ({
  control,
  field,
  id,
  name,
}: ControllerProps<DeclarationField>) => (
  <Controller
    name={name}
    control={control}
    render={({
      field: { onChange: handleChange, ...controller },
      fieldState,
    }) => (
      <Field orientation="horizontal" data-invalid={fieldState.invalid}>
        <Checkbox
          id={id}
          name={controller.name}
          aria-invalid={fieldState.invalid}
          aria-required={field.required === true || undefined}
          checked={controller.value === true}
          onCheckedChange={(checked) => handleChange(checked === true)}
        />
        <FieldLabel htmlFor={id}>
          {field.label}
          <RequiredMark required={field.required} />
        </FieldLabel>
        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
      </Field>
    )}
  />
);

// One shadcn field per structured kind, wired through Controller.
// Validation comes from the zod schema (see lib/form-schema.ts); the server
// re-checks everything at submit time (#37).
export const FormFieldInput = ({
  control,
  name,
  field,
  id,
}: ControllerProps<FieldDefinition>) => {
  switch (field.kind) {
    case "short_text":
    case "email":
    case "phone":
      return (
        <TextController control={control} field={field} id={id} name={name} />
      );
    case "long_text":
      return (
        <LongTextController
          control={control}
          field={field}
          id={id}
          name={name}
        />
      );
    case "number":
      return (
        <NumberController control={control} field={field} id={id} name={name} />
      );
    case "date":
      return (
        <DateController control={control} field={field} id={id} name={name} />
      );
    case "single_choice":
      return (
        <SingleChoiceController
          control={control}
          field={field}
          id={id}
          name={name}
        />
      );
    case "multiple_choice":
      return (
        <MultipleChoiceController
          control={control}
          field={field}
          id={id}
          name={name}
        />
      );
    case "yes_no":
      return (
        <YesNoController control={control} field={field} id={id} name={name} />
      );
    case "upload":
      return (
        <UploadController control={control} field={field} id={id} name={name} />
      );
    case "declaration":
      return (
        <DeclarationController
          control={control}
          field={field}
          id={id}
          name={name}
        />
      );
    default:
      return null;
  }
};
