// No "use client": a Toggle Group's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type ToggleGroupSize = "sm" | "md" | "lg";

export type ToggleGroupVariant = "soft" | "solid";

export interface ToggleGroupVariantProps {
  /** Font size and padding of the items. @default "md" */
  size?: ToggleGroupSize | undefined;
  /**
   * The thumb and the pressed keys: a tint of the accent, or the primary Button's fill.
   * @default "soft"
   */
  variant?: ToggleGroupVariant | undefined;
}

const variantClass: Record<ToggleGroupVariant, string> = {
  soft: "ow-toggle-group--soft",
  solid: "ow-toggle-group--solid",
};

const sizeClass: Record<ToggleGroupSize, string> = {
  sm: "ow-toggle-group--sm",
  md: "ow-toggle-group--md",
  lg: "ow-toggle-group--lg",
};

/** The group's classes. */
export function toggleGroupVariants({
  size = "md",
  variant = "soft",
}: ToggleGroupVariantProps = {}): string {
  return cn("ow-toggle-group", variantClass[variant], sizeClass[size]);
}

/** The classes of the inner parts. */
export const toggleGroupSlots = {
  thumb: "ow-toggle-group__thumb",
  item: "ow-toggle-group__item",
  label: "ow-toggle-group__label",
} as const;
