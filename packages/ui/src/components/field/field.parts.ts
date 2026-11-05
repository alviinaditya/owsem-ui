// No "use client" here: the namespace object must be readable from Server Components (FR-5).

export type { InputProps as FieldControlProps } from "../input/input";
// The control is Input: its look, sizes, and icons, tied to the field by Base UI's context.
export { Input as Control } from "../input/input";
export type {
  FieldDescriptionProps,
  FieldErrorProps,
  FieldItemProps,
  FieldLabelProps,
  FieldRootProps,
  FieldValidityProps,
} from "./field";
export {
  FieldDescription as Description,
  FieldError as Error,
  FieldItem as Item,
  FieldLabel as Label,
  FieldRoot as Root,
  FieldValidity as Validity,
} from "./field";
