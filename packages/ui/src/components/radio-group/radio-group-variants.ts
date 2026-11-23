// No "use client": a Radio Group's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type RadioGroupSize = "sm" | "md" | "lg";

export interface RadioGroupVariantProps {
  /** Button's fonts and row heights: 32, 40, or 48 px tall. @default "md" */
  size?: RadioGroupSize | undefined;
}

const sizeClass: Record<RadioGroupSize, string> = {
  sm: "ow-radio-group--sm",
  md: "ow-radio-group--md",
  lg: "ow-radio-group--lg",
};

/** The group's classes. */
export function radioGroupVariants({ size = "md" }: RadioGroupVariantProps = {}): string {
  return cn("ow-radio-group", sizeClass[size]);
}

/** The classes of the inner parts. */
export const radioGroupSlots = {
  radio: "ow-radio-group__radio",
  indicator: "ow-radio-group__indicator",
} as const;
