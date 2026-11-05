"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { type ForwardRefExoticComponent, forwardRef, type RefAttributes } from "react";
import { withClassName } from "../../core/class-name";
import "./field.css";

const cls = {
  root: "ow-field",
  label: "ow-field__label",
  description: "ow-field__description",
  error: "ow-field__error",
  item: "ow-field__item",
} as const;

export type FieldRootProps = Omit<BaseField.Root.Props, "ref">;

/** A label, a control, and its messages in one column, tied together by Base UI. */
export const FieldRoot: ForwardRefExoticComponent<FieldRootProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, FieldRootProps>(function FieldRoot({ className, ...props }, ref) {
    return <BaseField.Root ref={ref} className={withClassName(cls.root, className)} {...props} />;
  });

export type FieldLabelProps = Omit<BaseField.Label.Props, "ref">;

/** Names the control; a click on it moves focus there. */
export const FieldLabel: ForwardRefExoticComponent<FieldLabelProps & RefAttributes<HTMLElement>> =
  forwardRef<HTMLElement, FieldLabelProps>(function FieldLabel({ className, ...props }, ref) {
    return <BaseField.Label ref={ref} className={withClassName(cls.label, className)} {...props} />;
  });

export type FieldDescriptionProps = Omit<BaseField.Description.Props, "ref">;

/** Muted help text, read out with the control through `aria-describedby`. */
export const FieldDescription: ForwardRefExoticComponent<
  FieldDescriptionProps & RefAttributes<HTMLParagraphElement>
> = forwardRef<HTMLParagraphElement, FieldDescriptionProps>(function FieldDescription(
  { className, ...props },
  ref,
) {
  return (
    <BaseField.Description
      ref={ref}
      className={withClassName(cls.description, className)}
      {...props}
    />
  );
});

export type FieldErrorProps = Omit<BaseField.Error.Props, "ref">;

/**
 * Shows while the field is invalid: your children, or the browser's message without any. `match`
 * picks one validity state, and `match` alone (true) keeps it up for a state you control.
 */
export const FieldError: ForwardRefExoticComponent<
  FieldErrorProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, FieldErrorProps>(function FieldError({ className, ...props }, ref) {
  return <BaseField.Error ref={ref} className={withClassName(cls.error, className)} {...props} />;
});

export type FieldItemProps = Omit<BaseField.Item.Props, "ref">;

/** One option in a checkbox or radio group: its control and label in a row. */
export const FieldItem: ForwardRefExoticComponent<FieldItemProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, FieldItemProps>(function FieldItem({ className, ...props }, ref) {
    return <BaseField.Item ref={ref} className={withClassName(cls.item, className)} {...props} />;
  });

export type FieldValidityProps = BaseField.Validity.Props;

/** Renders from the field's validity state; it draws nothing of its own. */
export const FieldValidity: typeof BaseField.Validity = BaseField.Validity;
