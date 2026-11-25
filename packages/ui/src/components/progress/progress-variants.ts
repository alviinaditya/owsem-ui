// No "use client": a Progress's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressVariantProps {
  /** A 4, 8, or 12 px track, with Button's font sizes for the label. @default "md" */
  size?: ProgressSize | undefined;
}

const sizeClass: Record<ProgressSize, string> = {
  sm: "ow-progress--sm",
  md: "ow-progress--md",
  lg: "ow-progress--lg",
};

/** The root's classes. */
export function progressVariants({ size = "md" }: ProgressVariantProps = {}): string {
  return cn("ow-progress", sizeClass[size]);
}

/** The classes of the inner parts. */
export const progressSlots = {
  track: "ow-progress__track",
  indicator: "ow-progress__indicator",
  value: "ow-progress__value",
  label: "ow-progress__label",
} as const;
