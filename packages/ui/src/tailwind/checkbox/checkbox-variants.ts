// Generated from components/checkbox by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of checkbox-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-label-hover, ow-checkbox-on, and
// ow-checkbox-held variants.

import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxVariantProps {
  /** Button's fonts, and the box is the font size plus 6px: 19, 20, or 22 px. @default "md" */
  size?: CheckboxSize | undefined;
}

// A box a little bigger than an icon, in em, so font-size scales it. Off it is a tint of the text
// color with no shadow, which reads on the page and on a white card alike; checked or indeterminate
// it is the primary material. Fills change at once; the press and the glyphs move.
const root = [
  // Box. Half the surface radius, a rounded square.
  "relative box-border inline-flex flex-none size-(--icon) rounded-[calc(var(--ow-radius)_/_2)]",
  "[--icon:calc(1em_+_6px)]",
  // The motion scale decides how far a press, a glyph leaving, and the minus move.
  "[--_press:calc(1_-_0.03_*_var(--ow-motion-scale))] [--_glyph-out:calc(1_-_0.2_*_var(--ow-motion-scale))]",
  // The minus grows from nothing to its width.
  "[--_minus-out:calc(1_-_var(--ow-motion-scale))]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "bg-[color-mix(in_oklab,var(--ow-fg)_10%,transparent)] [--_held:color-mix(in_oklab,var(--ow-fg)_16%,transparent)]",
  // Type. A glyph on its way out shows on the well; the middle of the text, in any state, since a
  // baseline would follow the glyphs.
  "text-(color:--ow-fg) align-middle",
  // Touch, and its own layer so it lands without a pixel jump.
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] will-change-transform",
  // A press lets go on the settle spring.
  "transition-[transform] duration-(--ow-spring-settle-duration) ease-(--ow-spring-settle)",
  // A 24px target around a smaller box, adding no layout.
  "after:absolute after:inset-[min(0px,(100%_-_24px)_/_2)] after:content-['']",
  // Checked or mixed: the primary material, and a deeper fill when held. Black darkens any fill.
  "ow-checkbox-on:bg-(color:--ow-accent) ow-checkbox-on:shadow-(shadow:--ow-primary-shadow)",
  "ow-checkbox-on:text-(color:--ow-on-accent)",
  "ow-checkbox-on:[--_held:color-mix(in_oklab,var(--ow-accent),black_10%)]",
  // A label and its box are one control, so pointing at the text counts.
  "ow-label-hover:not-data-disabled:not-data-readonly:not-ow-checkbox-on:bg-[color-mix(in_oklab,var(--ow-fg)_13%,transparent)]",
  "ow-label-hover:ow-checkbox-on:not-data-disabled:not-data-readonly:bg-[linear-gradient(var(--ow-hover)_0_0)]",
  // In to 0.97 within 90 ms, on a deeper fill.
  "ow-checkbox-held:bg-(color:--_held) ow-checkbox-held:bg-none",
  "ow-checkbox-held:transform-[scale(var(--_press))] ow-checkbox-held:duration-90",
  "ow-checkbox-held:ease-(--ow-ease-out)",
  // 2px outside the box.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-readonly:not-data-disabled:cursor-default",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  // The fills still change and the glyphs still fade; nothing moves or draws.
  "motion-reduce:[--_press:1] motion-reduce:[--_glyph-out:1] motion-reduce:[--_minus-out:1]",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  "contrast-more:ow-checkbox-on:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  // The materials are gone, so the outline is the edge and a system color the fill.
  "forced-colors:ow-checkbox-on:bg-[Highlight] forced-colors:ow-checkbox-on:text-[HighlightText]",
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:outline-[GrayText] forced-colors:data-disabled:opacity-100",
  "forced-colors:data-disabled:ow-checkbox-on:bg-[GrayText] forced-colors:data-disabled:ow-checkbox-on:text-[Canvas]",
];

const sizeStyles = {
  sm: "text-[0.8125rem]",
  md: "text-[0.875rem]",
  lg: "text-[1rem]",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The root's classes. */
export function checkboxVariants({ size }: CheckboxVariantProps = {}): string {
  return cn(variants({ size }));
}

// Fills the box, with its glyphs stacked. Base UI waits for this fade before it unmounts.
const indicator = [
  "group/ow-checkbox-indicator grid place-items-center size-full",
  "transition-[opacity] duration-120 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-unchecked:opacity-0",
  "[&>*]:[grid-area:1/1] [&>*]:will-change-transform",
  "[&>*]:transition-[opacity,transform] [&>*]:duration-[120ms,var(--ow-spring-settle-duration)]",
  "[&>*]:ease-[var(--ow-ease-out),var(--ow-spring-settle)]",
  "[&>:where(svg,img)]:block [&>:where(svg,img)]:size-full",
  // Out on the way in and out, and a marked glyph is out unless the state names it.
  "[&:where([data-starting-style],[data-unchecked])>*]:opacity-0",
  "[&:where([data-starting-style],[data-unchecked])>*]:transform-[scale(var(--_glyph-out))]",
  "[&:not([data-checked])>[data-glyph=check]]:opacity-0",
  "[&:not([data-checked])>[data-glyph=check]]:transform-[scale(var(--_glyph-out))]",
  "[&:not([data-indeterminate])>[data-glyph=minus]]:opacity-0",
  "[&:not([data-indeterminate])>[data-glyph=minus]]:transform-[scaleX(var(--_minus-out))]",
];

// Kinetic, as Copy Button's check: the check draws in from its short stroke as it arrives, and the
// minus grows from its middle. Leaving, both only fade, so nothing is undrawn.
const stroke = [
  "[[data-glyph=check]>&]:[stroke-dasharray:1] [[data-glyph=check]>&]:[stroke-dashoffset:0]",
  "[[data-glyph=check]>&]:transition-[stroke-dashoffset] [[data-glyph=check]>&]:duration-260",
  "[[data-glyph=check]>&]:delay-30 [[data-glyph=check]>&]:ease-(--ow-ease-out)",
  "motion-safe:group-data-starting-style/ow-checkbox-indicator:group-not-data-indeterminate/ow-checkbox-indicator:[[data-glyph=check]>&]:[stroke-dashoffset:-1]",
  "motion-safe:group-data-starting-style/ow-checkbox-indicator:group-not-data-indeterminate/ow-checkbox-indicator:[[data-glyph=check]>&]:[transition:none]",
  // Mixed: the check fades out whole, then is reset to draw in again.
  "motion-safe:group-data-indeterminate/ow-checkbox-indicator:[[data-glyph=check]>&]:[stroke-dashoffset:-1]",
  "motion-safe:group-data-indeterminate/ow-checkbox-indicator:[[data-glyph=check]>&]:[transition:stroke-dashoffset_0s_120ms]",
  "motion-reduce:[[data-glyph=check]>&]:[stroke-dashoffset:0] motion-reduce:[[data-glyph=check]>&]:[transition:none]",
];

/** The classes of the inner parts. */
export const checkboxSlots: Record<"indicator" | "stroke", string> = {
  indicator: indicator.join(" "),
  stroke: stroke.join(" "),
};
