// No "use client": a Toggle's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type ToggleSize = "sm" | "md" | "lg";

export interface ToggleVariantProps {
  /** Button's sizes: 32, 40, or 48 px tall. @default "md" */
  size?: ToggleSize | undefined;
}

const sizeClass: Record<ToggleSize, string> = {
  sm: "ow-toggle--sm",
  md: "ow-toggle--md",
  lg: "ow-toggle--lg",
};

/** The root's classes. */
export function toggleVariants({ size = "md" }: ToggleVariantProps = {}): string {
  return cn("ow-toggle", sizeClass[size]);
}

/** The classes of the inner parts. */
export const toggleSlots = { icon: "ow-toggle__icon" } as const;
