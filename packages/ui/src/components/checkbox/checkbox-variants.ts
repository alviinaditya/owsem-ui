// No "use client": a Checkbox's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxVariantProps {
  /** Button's fonts, and the box is the font size plus 6px: 19, 20, or 22 px. @default "md" */
  size?: CheckboxSize | undefined;
}

const sizeClass: Record<CheckboxSize, string> = {
  sm: "ow-checkbox--sm",
  md: "ow-checkbox--md",
  lg: "ow-checkbox--lg",
};

/** The root's classes. */
export function checkboxVariants({ size = "md" }: CheckboxVariantProps = {}): string {
  return cn("ow-checkbox", sizeClass[size]);
}

/** The classes of the inner parts. */
export const checkboxSlots = {
  indicator: "ow-checkbox__indicator",
  stroke: "ow-checkbox__stroke",
} as const;
