// No "use client": a Toggle Group's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type ToggleGroupSize = "sm" | "md" | "lg";

export interface ToggleGroupVariantProps {
  /** Font size and padding of the items. @default "md" */
  size?: ToggleGroupSize | undefined;
}

const sizeClass: Record<ToggleGroupSize, string> = {
  sm: "ow-toggle-group--sm",
  md: "ow-toggle-group--md",
  lg: "ow-toggle-group--lg",
};

/** The group's classes. */
export function toggleGroupVariants({ size = "md" }: ToggleGroupVariantProps = {}): string {
  return cn("ow-toggle-group", sizeClass[size]);
}

/** The classes of the inner parts. */
export const toggleGroupSlots = {
  thumb: "ow-toggle-group__thumb",
  item: "ow-toggle-group__item",
  label: "ow-toggle-group__label",
} as const;
