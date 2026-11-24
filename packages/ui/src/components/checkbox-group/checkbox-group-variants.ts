// No "use client": a Checkbox Group's classes can be used from Server Components.

import type { CheckboxGroupSize } from "../../core/checkbox-group-size";
import { cn } from "../../core/cn";

export type { CheckboxGroupSize };

export interface CheckboxGroupVariantProps {
  /** Button's fonts and row heights: 32, 40, or 48 px tall. The Checkboxes in it take it. @default "md" */
  size?: CheckboxGroupSize | undefined;
}

const sizeClass: Record<CheckboxGroupSize, string> = {
  sm: "ow-checkbox-group--sm",
  md: "ow-checkbox-group--md",
  lg: "ow-checkbox-group--lg",
};

/** The group's classes. */
export function checkboxGroupVariants({ size = "md" }: CheckboxGroupVariantProps = {}): string {
  return cn("ow-checkbox-group", sizeClass[size]);
}
