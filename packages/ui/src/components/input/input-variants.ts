// No "use client": an Input's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type InputSize = "sm" | "md" | "lg";

export interface InputVariantProps {
  /** Button's sizes: 32, 40, or 48 px tall. @default "md" */
  size?: InputSize | undefined;
}

const sizeClass: Record<InputSize, string> = {
  sm: "ow-input--sm",
  md: "ow-input--md",
  lg: "ow-input--lg",
};

const wrapperSizeClass: Record<InputSize, string> = {
  sm: "ow-input__wrapper--sm",
  md: "ow-input__wrapper--md",
  lg: "ow-input__wrapper--lg",
};

/** The input's classes. */
export function inputVariants({ size = "md" }: InputVariantProps = {}): string {
  return cn("ow-input", sizeClass[size]);
}

/** The classes of the wrapper that holds the icons. */
export function inputWrapperVariants({ size = "md" }: InputVariantProps = {}): string {
  return cn("ow-input__wrapper", wrapperSizeClass[size]);
}

/** The classes of the inner parts. */
export const inputSlots = { icon: "ow-input__icon" } as const;
