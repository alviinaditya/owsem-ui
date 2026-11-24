// Generated from components/number-field by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of number-field-variants.ts: the same exports, with the styles as
// utility classes. Needs tokens.css, and from the bridge (tailwind.css) the ow-number-field-shake
// and ow-number-field-blink keyframes.

import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

export type NumberFieldSize = "sm" | "md" | "lg";

export interface NumberFieldVariantProps {
  /** Button's fonts and Input's heights: the field is 32, 40, or 48 px tall. @default "md" */
  size?: NumberFieldSize | undefined;
}

// The Root's size is its font and --py, which every part inherits.
const root = ["flex flex-col gap-[0.5em] w-[11em] max-w-full min-w-0", "text-(color:--ow-fg)"];

const sizeStyles = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The root's classes: the size's font and --py, which every part reads. */
export function numberFieldVariants({ size }: NumberFieldVariantProps = {}): string {
  return cn(variants({ size }));
}

// The field: a 6% tint of the text color, 9% on hover, critical when invalid, dim when disabled. It
// is as tall as an Input of the size, and the steppers are the height less the inset on both sides.
const group = [
  "[--_py:max(var(--py),(24px_-_1lh)_/_2)] [--_inset:4px]",
  // Input's height, and the steppers' side: that less the inset on both sides.
  "[--_height:calc(2_*_var(--_py)_+_1lh)] [--_stepper:calc(var(--_height)_-_2_*_var(--_inset))]",
  // Box.
  "flex items-center box-border w-full min-w-0 h-(--_height) p-(--_inset) rounded-(--ow-radius)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // The face: the tint deepens on hover, and turns critical when invalid.
  "bg-(color:--_bg) [--_bg:color-mix(in_oklab,var(--ow-fg)_6%,transparent)]",
  "pointer-fine:hover:not-data-disabled:not-data-invalid:[--_bg:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "data-invalid:[--_bg:color-mix(in_oklab,var(--ow-critical)_14%,transparent)]",
  // Rejects once when it becomes invalid; data-armed is set while it is valid (core/shake.ts), so a
  // field invalid from the start stays still. A Form re-plays it with data-shake="off".
  "data-invalid:data-armed:not-data-[shake=off]:will-change-transform",
  "data-invalid:data-armed:not-data-[shake=off]:animate-[ow-number-field-shake_320ms_var(--ow-ease-out)]",
  "motion-reduce:data-invalid:data-armed:not-data-[shake=off]:animate-[ow-number-field-blink_160ms_var(--ow-ease-out)]",
  // The ring is the Group's, while the input has focus.
  "has-[[data-slot=number-field-input]:focus-visible]:outline-2",
  "has-[[data-slot=number-field-input]:focus-visible]:outline-offset-2",
  "has-[[data-slot=number-field-input]:focus-visible]:outline-(color:--ow-focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
  // The steppers of a disabled field are as dim as the field is; no more.
  "data-disabled:[&>[data-slot=number-field-decrement]]:opacity-100",
  "data-disabled:[&>[data-slot=number-field-increment]]:opacity-100",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  // The transparent outline is the edge; invalid thickens it, since its color is gone.
  "forced-colors:data-invalid:outline-2 forced-colors:data-invalid:-outline-offset-2",
  "forced-colors:has-[[data-slot=number-field-input]:focus-visible]:outline-[Highlight]",
  "forced-colors:has-[[data-slot=number-field-input]:focus-visible]:outline-offset-2",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

// The input takes no look of its own, and centers its digits. The Group draws the ring.
const input = [
  "flex-[1_1_0] self-stretch box-border min-w-0 m-0 py-0 px-[0.5em] border-0 bg-none",
  "text-inherit font-[family-name:inherit] font-[weight:inherit] text-center tabular-nums",
  "outline-none",
  "data-disabled:cursor-not-allowed disabled:cursor-not-allowed",
];

// Flat squares inset from the field's ends, tinted under the pointer, the pressed material while
// held. At the min or the max, or read only, they dim.
const stepper = [
  "[--icon:calc(1em_+_2px)] [--_radius:max(0px,var(--ow-radius)_-_var(--_inset))]",
  "[--_press:calc(1_-_0.03_*_var(--ow-motion-scale))]",
  // Box.
  "inline-grid flex-none place-items-center box-border size-(--_stepper) m-0 p-0 border-0",
  "rounded-(--_radius) bg-transparent text-(color:--ow-muted) font-[family-name:inherit]",
  "font-[weight:inherit]",
  "[&>:where(svg,img)]:block [&>:where(svg,img)]:size-(--icon)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent]",
  // Its own layer, so it lands without a pixel jump. A press lets go on the settle spring.
  "will-change-transform transition-[transform] duration-(--ow-spring-settle-duration)",
  "ease-(--ow-spring-settle)",
  "hover:not-data-disabled:not-disabled:not-data-readonly:bg-(color:--ow-hover) hover:not-data-disabled:not-disabled:not-data-readonly:text-(color:--ow-fg)",
  // Held down: in to 0.97 and the pressed material within 90 ms.
  "active:not-data-disabled:not-disabled:not-data-readonly:bg-(color:--ow-pressed-bg) active:not-data-disabled:not-disabled:not-data-readonly:text-(color:--ow-fg)",
  "active:not-data-disabled:not-disabled:not-data-readonly:transform-[scale(var(--_press))]",
  "active:not-data-disabled:not-disabled:not-data-readonly:duration-90 active:not-data-disabled:not-disabled:not-data-readonly:ease-(--ow-ease-out)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
  "disabled:cursor-not-allowed disabled:opacity-45",
  // Read only: the same as Input, so the steppers only do nothing.
  "data-readonly:cursor-default",
  // The press only changes the material.
  "motion-reduce:[--_press:1]",
  "forced-colors:hover:not-data-disabled:not-disabled:not-data-readonly:outline-[Highlight]",
  "forced-colors:active:not-data-disabled:not-disabled:not-data-readonly:outline-[Highlight]",
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
  "forced-colors:disabled:text-[GrayText] forced-colors:disabled:opacity-100",
];

// Wraps the label, and takes only its width.
const scrubArea = [
  "self-start cursor-ew-resize select-none",
  "data-[direction=vertical]:cursor-ns-resize",
  "data-disabled:cursor-default data-readonly:cursor-default",
];

// Takes the pointer's place, a 1.5rem box centered on it; it is in a portal, so it reads tokens.
const scrubCursor = [
  "block size-[1.5rem] text-(color:--ow-fg)",
  "[&>:where(svg,img)]:block [&>:where(svg,img)]:size-full",
];

/** The classes of the parts. */
export const numberFieldSlots: Record<
  "group" | "input" | "decrement" | "increment" | "scrubArea" | "scrubAreaCursor",
  string
> = {
  group: group.join(" "),
  input: input.join(" "),
  decrement: stepper.join(" "),
  increment: stepper.join(" "),
  scrubArea: scrubArea.join(" "),
  scrubAreaCursor: scrubCursor.join(" "),
};
