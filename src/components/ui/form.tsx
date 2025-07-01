"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import type { Path } from "react-hook-form";
import {
	Controller,
	FormProvider,
	useFormContext,
	type ControllerProps,
	type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

function useFormField<TFieldValues extends FieldValues = FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>() {
  const fieldContext = React.useContext(
    FormFieldContext as React.Context<FormFieldContextValue<TFieldValues, TName> | undefined>
  );
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext<TFieldValues>();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  const id = itemContext?.id;

  return {
    id,
    name: fieldContext.name,
    formItemId: id,
    formDescriptionId: id ? `${id}-form-item-description` : undefined,
    formMessageId: id ? `${id}-form-item-message` : undefined,
    ...fieldState,
  };
}

function FormField<TFieldValues extends FieldValues = FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>(
  props: ControllerProps<TFieldValues> & {
    name: TName;
    render: ControllerProps<TFieldValues>["render"];
  }
) {
  const { name, render, ...controllerProps } = props;
  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller name={name} {...controllerProps} render={render} />
    </FormFieldContext.Provider>
  );
}

interface FormItemContextValue {
	id: string;
}

const FormItemContext = React.createContext<FormItemContextValue | undefined>(undefined);

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	const id = React.useId();
	return (
		<FormItemContext.Provider value={{ id }}>
			<div className={cn("space-y-2", className)} {...props} />
		</FormItemContext.Provider>
	);
}

function FormLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
	const { error, formItemId } = useFormField();
	return (
		<LabelPrimitive.Root
			className={cn(error && "text-error", className)}
			htmlFor={formItemId}
			{...props}
		/>
	);
}

function FormControl(props: React.ComponentPropsWithoutRef<typeof Slot>) {
	const { formItemId } = useFormField();
	return <Slot id={formItemId} {...props} />;
}

function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	const { formDescriptionId } = useFormField();
	return (
		<p
			className={cn("text-on-surface-variant text-sm", className)} // MD3 muted/secondary
			id={formDescriptionId}
			{...props}
		/>
	);
}

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
	children?: React.ReactNode;
}

function FormMessage({ className, children, ...props }: FormMessageProps) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message) : children;
	if (!body) return null;
	return (
		<p
			className={cn("text-error font-medium", className)} // MD3 error color and emphasis
			id={formMessageId}
			{...props}
		>
			{body}
		</p>
	);
}

export {
	Form, FormControl,
	FormDescription, FormField,
	FormItem,
	FormLabel, FormMessage,
	useFormField
};

