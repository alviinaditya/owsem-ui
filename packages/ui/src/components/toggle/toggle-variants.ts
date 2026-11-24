// No "use client": a Toggle's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type ToggleSize = "sm" | "md" | "lg";

export type ToggleVariant = "soft" | "solid";

export interface ToggleVariantProps {
  /** Button's sizes: 32, 40, or 48 px tall. @default "md" */
  size?: ToggleSize | undefined;
  /** While on: a tint of the accent, or the primary Button's fill. @default "soft" */
  variant?: ToggleVariant | undefined;
}

const variantClass: Record<ToggleVariant, string> = {
  soft: "ow-toggle--soft",
  solid: "ow-toggle--solid",
};

const sizeClass: Record<ToggleSize, string> = {
  sm: "ow-toggle--sm",
  md: "ow-toggle--md",
  lg: "ow-toggle--lg",
};

/** The root's classes. */
export function toggleVariants({ size = "md", variant = "soft" }: ToggleVariantProps = {}): string {
  return cn("ow-toggle", variantClass[variant], sizeClass[size]);
}

/** The classes of the inner parts. */
export const toggleSlots = { icon: "ow-toggle__icon" } as const;
