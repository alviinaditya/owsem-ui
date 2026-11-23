// No "use client": a Switch's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchVariantProps {
  /** Follows Button's font sizes: 13, 14, or 16 px. @default "md" */
  size?: SwitchSize | undefined;
}

const sizeClass: Record<SwitchSize, string> = {
  sm: "ow-switch--sm",
  md: "ow-switch--md",
  lg: "ow-switch--lg",
};

/** The root's classes. */
export function switchVariants({ size = "md" }: SwitchVariantProps = {}): string {
  return cn("ow-switch", sizeClass[size]);
}

/** The classes of the inner parts. */
export const switchSlots = { thumb: "ow-switch__thumb" } as const;
