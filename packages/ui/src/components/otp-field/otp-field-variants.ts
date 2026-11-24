// No "use client": an OTP Field's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type OTPFieldSize = "sm" | "md" | "lg";

export interface OTPFieldVariantProps {
  /** Button's fonts and Input's heights: each slot is a 32, 40, or 48 px square. @default "md" */
  size?: OTPFieldSize | undefined;
}

const sizeClass: Record<OTPFieldSize, string> = {
  sm: "ow-otp-field--sm",
  md: "ow-otp-field--md",
  lg: "ow-otp-field--lg",
};

/** The root's classes: the size's font and --py, which every slot reads. */
export function otpFieldVariants({ size = "md" }: OTPFieldVariantProps = {}): string {
  return cn("ow-otp-field", sizeClass[size]);
}

/** The classes of the slots. */
export const otpFieldSlots = {
  input: "ow-otp-field__input",
} as const;
