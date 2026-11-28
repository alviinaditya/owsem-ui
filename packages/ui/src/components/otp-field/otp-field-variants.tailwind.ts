// The Tailwind CSS v4 twin of otp-field-variants.ts: the same exports, with the styles as utility
// classes. Needs tokens.css, and from the bridge (tailwind.css) the ow-otp-field-shake and
// ow-otp-field-blink keyframes.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type OTPFieldSize = "sm" | "md" | "lg";

export interface OTPFieldVariantProps {
  /** Button's fonts and Input's heights: each slot is a 32, 40, or 48 px square. @default "md" */
  size?: OTPFieldSize | undefined;
}

// A row of slots from the start edge, 0.5em apart. The Root's size is its font and --py, which
// every slot reads.
const root = [
  "flex items-center justify-start gap-[0.5em] max-w-full min-w-0",
  "text-(color:--ow-fg)",
  // Rejects once when it becomes invalid; data-armed is set while it is valid (core/shake.ts), so a
  // field invalid from the start stays still. A Form re-plays it with data-shake="off".
  "data-invalid:data-armed:not-data-[shake=off]:will-change-transform",
  "data-invalid:data-armed:not-data-[shake=off]:animate-[ow-otp-field-shake_320ms_var(--ow-ease-out)]",
  "motion-reduce:data-invalid:data-armed:not-data-[shake=off]:animate-[ow-otp-field-blink_160ms_var(--ow-ease-out)]",
];

const sizeStyles = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The root's classes: the size's font and --py, which every slot reads. */
export function otpFieldVariants({ size }: OTPFieldVariantProps = {}): string {
  return cn(variants({ size }));
}

// A square on Input's height; narrower only when the row does not fit its parent. The face: a 6%
// tint of the text color, 9% on hover, critical when invalid, dim when disabled.
const input = [
  "[--_py:max(var(--py),(24px_-_1lh)_/_2)] [--_side:calc(2_*_var(--_py)_+_1lh)]",
  // Box.
  "box-border flex-[0_1_auto] w-(--_side) h-(--_side) min-w-0 m-0 p-0 border-0",
  "rounded-(--ow-radius)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--ow-fg) font-[family-name:inherit] font-[weight:inherit] tabular-nums text-center",
  "bg-(color:--_bg) [--_bg:color-mix(in_oklab,var(--ow-fg)_6%,transparent)]",
  "pointer-fine:hover:not-data-disabled:not-disabled:not-ow-input-readonly:not-data-invalid:not-aria-invalid:[--_bg:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "data-invalid:[--_bg:color-mix(in_oklab,var(--ow-critical)_14%,transparent)]",
  "aria-invalid:[--_bg:color-mix(in_oklab,var(--ow-critical)_14%,transparent)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  "disabled:cursor-not-allowed disabled:opacity-50",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  // The transparent outline is the edge; invalid thickens it, since its color is gone.
  "forced-colors:data-invalid:outline-2 forced-colors:data-invalid:-outline-offset-2",
  "forced-colors:aria-invalid:outline-2 forced-colors:aria-invalid:-outline-offset-2",
  "forced-colors:focus-visible:outline-[Highlight] forced-colors:focus-visible:outline-offset-2",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
  "forced-colors:disabled:text-[GrayText] forced-colors:disabled:opacity-100",
];

/** The classes of the slots. */
export const otpFieldSlots: Record<"input", string> = {
  input: input.join(" "),
};
