// No "use client": a Number Field's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type NumberFieldSize = "sm" | "md" | "lg";

export interface NumberFieldVariantProps {
  /** Button's fonts and Input's heights: the field is 32, 40, or 48 px tall. @default "md" */
  size?: NumberFieldSize | undefined;
}

const sizeClass: Record<NumberFieldSize, string> = {
  sm: "ow-number-field--sm",
  md: "ow-number-field--md",
  lg: "ow-number-field--lg",
};

/** The root's classes: the size's font and --py, which every part reads. */
export function numberFieldVariants({ size = "md" }: NumberFieldVariantProps = {}): string {
  return cn("ow-number-field", sizeClass[size]);
}

/** The classes of the parts. */
export const numberFieldSlots = {
  group: "ow-number-field__group",
  input: "ow-number-field__input",
  decrement: "ow-number-field__stepper ow-number-field__decrement",
  increment: "ow-number-field__stepper ow-number-field__increment",
  scrubArea: "ow-number-field__scrub-area",
  scrubAreaCursor: "ow-number-field__scrub-cursor",
} as const;
