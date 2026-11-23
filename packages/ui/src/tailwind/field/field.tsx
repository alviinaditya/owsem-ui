// Generated from components/field by scripts/build-tailwind.ts; do not edit.
"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { ReactElement } from "react";
import { cn } from "../lib/cn";
import { fieldSlots } from "./field-variants";

export interface FieldRootProps extends Omit<BaseField.Root.Props, "className"> {
  className?: string | undefined;
}

/** A label, a control, and its messages in one column, tied together by Base UI. */
export function FieldRoot({ className, ...props }: FieldRootProps): ReactElement {
  return <BaseField.Root data-slot="field" {...props} className={cn(fieldSlots.root, className)} />;
}

export interface FieldLabelProps extends Omit<BaseField.Label.Props, "className"> {
  className?: string | undefined;
}

/** Names the control; a click on it moves focus there. */
export function FieldLabel({ className, ...props }: FieldLabelProps): ReactElement {
  return (
    <BaseField.Label
      data-slot="field-label"
      {...props}
      className={cn(fieldSlots.label, className)}
    />
  );
}

export interface FieldDescriptionProps extends Omit<BaseField.Description.Props, "className"> {
  className?: string | undefined;
}

/** Muted help text, read out with the control through `aria-describedby`. */
export function FieldDescription({ className, ...props }: FieldDescriptionProps): ReactElement {
  return (
    <BaseField.Description
      data-slot="field-description"
      {...props}
      className={cn(fieldSlots.description, className)}
    />
  );
}

export interface FieldErrorProps extends Omit<BaseField.Error.Props, "className"> {
  className?: string | undefined;
}

/**
 * Shows while the field is invalid: your children, or the browser's message without any. `match`
 * picks one validity state, and `match` alone (true) keeps it up for a state you control.
 */
export function FieldError({ className, ...props }: FieldErrorProps): ReactElement {
  return (
    <BaseField.Error
      data-slot="field-error"
      {...props}
      className={cn(fieldSlots.error, className)}
    />
  );
}

export interface FieldItemProps extends Omit<BaseField.Item.Props, "className"> {
  className?: string | undefined;
}

/** One option in a checkbox or radio group: its control and label in a row. */
export function FieldItem({ className, ...props }: FieldItemProps): ReactElement {
  return (
    <BaseField.Item data-slot="field-item" {...props} className={cn(fieldSlots.item, className)} />
  );
}

export type FieldValidityProps = BaseField.Validity.Props;

/** Renders from the field's validity state; it draws nothing of its own. */
export const FieldValidity: typeof BaseField.Validity = BaseField.Validity;
