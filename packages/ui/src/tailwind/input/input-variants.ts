// Generated from components/input by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of input-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-input-invalid and ow-input-disabled
// variants and the ow-input-shake and ow-input-blink keyframes.

import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

export type InputSize = "sm" | "md" | "lg";

export interface InputVariantProps {
  /** Button's sizes: 32, 40, or 48 px tall. @default "md" */
  size?: InputSize | undefined;
}

// Button's geometry: --py is the one input, and the icons need it too. They measure in the same
// font, so the input and its wrapper share these. An icon sits as far from the edge as from the top
// and bottom.
const metrics = [
  "[--_py:max(var(--py),calc((24px_-_1lh)_/_2))] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)] [--_inset:calc(var(--px)_+_(1cap_-_var(--icon))_/_2)]",
];

const sizeStyles = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

// A tint of the text color, with no edge or shadow. The padding on each side comes from --_ps and
// --_pe, which an icon beside the input raises, so a user's padding utility still wins.
const root = [
  ...metrics,
  // Box. Firefox grows a field to its font's own line height when that is taller; pin both.
  "box-border w-full min-w-0 m-0 border-0 rounded-(--ow-radius) h-(--_h) min-h-(--_min-h)",
  "py-(--_py) ps-(--_ps) pe-(--_pe) [--_ps:var(--px)] [--_pe:var(--px)]",
  "[--_h:calc(2_*_var(--_py)_+_1lh)] [--_min-h:auto]",
  // A control passed to `render` that takes more than one line. Only a textarea can be resized.
  "[&:where(textarea)]:[--_h:auto] [&:where(textarea)]:[--_min-h:calc(2_*_var(--_py)_+_2lh)]",
  "resize-y",
  // Clear of an icon by Button's gap.
  "peer-data-[side=start]/ow-icon:[--_ps:calc(var(--_inset)_+_var(--icon)_+_0.5em)]",
  "has-[+[data-slot=input-icon][data-side=end]]:[--_pe:calc(var(--_inset)_+_var(--icon)_+_0.5em)]",
  // The face: the tint deepens on hover, and turns critical when invalid.
  "bg-(color:--_bg) [--_bg:color-mix(in_oklab,var(--ow-fg)_6%,transparent)]",
  "pointer-fine:hover:not-data-disabled:not-disabled:not-ow-input-invalid:[--_bg:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "ow-input-invalid:[--_bg:color-mix(in_oklab,var(--ow-critical)_14%,transparent)]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "font-[family-name:inherit] text-(color:--ow-fg) placeholder:text-(color:--ow-muted)",
  "placeholder:opacity-100",
  // Rejects once when it becomes invalid; data-armed is set while it is valid (core/shake.ts), so a
  // field invalid from the start stays still. A Form re-plays it with data-shake="off".
  "ow-input-invalid:data-armed:not-data-[shake=off]:will-change-transform",
  "ow-input-invalid:data-armed:not-data-[shake=off]:animate-[ow-input-shake_320ms_var(--ow-ease-out)]",
  "motion-reduce:ow-input-invalid:data-armed:not-data-[shake=off]:animate-[ow-input-blink_160ms_var(--ow-ease-out)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "ow-input-disabled:cursor-not-allowed ow-input-disabled:opacity-45",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  // The transparent outline is the edge; invalid thickens it, since its color is gone.
  "forced-colors:ow-input-invalid:outline-2 forced-colors:ow-input-invalid:-outline-offset-2",
  "forced-colors:focus-visible:outline-[Highlight] forced-colors:focus-visible:outline-offset-2",
  "forced-colors:ow-input-disabled:text-[GrayText] forced-colors:ow-input-disabled:opacity-100",
];

const inputStyles = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The input's classes. */
export function inputVariants({ size }: InputVariantProps = {}): string {
  return cn(inputStyles({ size }));
}

// Only places the icons.
const wrapper = [...metrics, "group/ow-input flex items-center w-full min-w-0"];

const wrapperStyles = cva(wrapper, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The classes of the wrapper that holds the icons. */
export function inputWrapperVariants({ size }: InputVariantProps = {}): string {
  return cn(wrapperStyles({ size }));
}

// Over the input's padding, taking no room, so a click lands on the input.
const icon = [
  "peer/ow-icon relative inline-flex flex-none size-(--icon) text-(color:--ow-muted) whitespace-nowrap",
  "pointer-events-none",
  "data-[side=start]:ms-(--_inset) data-[side=start]:me-[calc(-1_*_(var(--_inset)_+_var(--icon)))]",
  "data-[side=end]:ms-[calc(-1_*_(var(--_inset)_+_var(--icon)))] data-[side=end]:me-(--_inset)",
  "[&>:where(svg,img)]:block [&>:where(svg,img)]:size-full",
  // Disabled with its input.
  "group-has-[>:is([data-disabled],:disabled)]/ow-input:opacity-45",
  "forced-colors:group-has-[>:is([data-disabled],:disabled)]/ow-input:text-[GrayText]",
  "forced-colors:group-has-[>:is([data-disabled],:disabled)]/ow-input:opacity-100",
];

/** The classes of the inner parts. */
export const inputSlots: Record<"icon", string> = { icon: icon.join(" ") };
