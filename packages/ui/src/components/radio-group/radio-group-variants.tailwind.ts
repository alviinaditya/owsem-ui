// The Tailwind CSS v4 twin of radio-group-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-label-hover and ow-radio-group-held
// variants.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type RadioGroupSize = "sm" | "md" | "lg";

export interface RadioGroupVariantProps {
  /** Button's fonts and row heights: 32, 40, or 48 px tall. @default "md" */
  size?: RadioGroupSize | undefined;
}

// A row is a <label> holding a radio, with Button's geometry. --py comes from the group, or from
// the row's own style. The rows are matched from the group, as :where, so a user's class on a row
// is as specific as these.
const row = [
  "[&_:where(label:has([data-slot=radio-group-radio]))]:[--_py:max(var(--py),(24px_-_1lh)_/_2)]",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:[--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:flex",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:items-start",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:gap-[0.5em]",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:box-border",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:py-(--_py)",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:px-(--px)",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:cursor-pointer",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:touch-manipulation",
  "[&_:where(label:has([data-slot=radio-group-radio]))]:[-webkit-tap-highlight-color:transparent]",
  "[&_:where(label:has([data-slot=radio-group-radio][data-readonly]))]:cursor-default",
  "[&_:where(label:has([data-slot=radio-group-radio][data-disabled]))]:text-[color-mix(in_oklab,var(--_muted)_50%,transparent)]",
  "[&_:where(label:has([data-slot=radio-group-radio][data-disabled]))]:cursor-not-allowed",
  // The label turns gray with the system's disabled color.
  "forced-colors:[&_:where(label:has([data-slot=radio-group-radio][data-disabled]))]:text-[GrayText]",
];

// The group sets no width: it fits its rows, and a rule on className lays them out in a row or a
// grid. Glide's container, so it holds the highlight behind the rows.
const root = [
  "[--_fg:var(--ow-fg)] [--_muted:var(--ow-muted)]",
  "relative isolate inline-flex flex-col align-top",
  "text-(color:--_fg)",
  ...row,
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

/** The group's classes. */
export function radioGroupVariants({ size }: RadioGroupVariantProps = {}): string {
  return cn(variants({ size }));
}

// The icon rule, so the size is in em and --icon can be set through style. Off, a tint of the text
// color with no edge; on, the accent with the primary material's highlight. A radio is round at any
// radius token.
const radio = [
  "[--icon:calc(1em_+_6px)] [--_surface:color-mix(in_oklab,var(--ow-fg)_10%,transparent)]",
  "[--_accent:var(--ow-accent)] [--_accent-shadow:var(--ow-primary-shadow)]",
  "[--_focus:var(--ow-focus)] [--_press:calc(1_-_0.03_*_var(--ow-motion-scale))]",
  // The face, set per state.
  "[--_bg:var(--_surface)] [--_bg-held:color-mix(in_oklab,var(--ow-fg)_16%,transparent)]",
  "[--_shadow:none]",
  // Box.
  "relative inline-block flex-none box-border size-(--icon) m-0 p-0 border-0 rounded-[50%]",
  "bg-(color:--_bg) shadow-(shadow:--_shadow) align-middle",
  // In a row: on the first line of a label that wraps, and as far from the start as from the top.
  "[label>&]:my-[calc((1lh_-_var(--icon))_/_2)]",
  "[label>&:first-child]:ms-[calc((1cap_-_var(--icon))_/_2)]",
  // A 24px target around the circle, without changing the layout.
  "before:absolute before:content-[''] before:inset-[min(0px,(var(--icon)_-_24px)_/_2)]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent]",
  // Its own layer, so it lands without a pixel jump. A press lets go on the settle spring.
  "will-change-transform transition-[transform] duration-(--ow-spring-settle-duration)",
  "ease-(--ow-spring-settle)",
  "data-checked:[--_bg:var(--_accent)] data-checked:[--_shadow:var(--_accent-shadow)]",
  "data-checked:[--_bg-held:color-mix(in_oklab,var(--_accent),black_10%)]",
  // Off, the fill steps up on hover; the row counts too.
  "ow-label-hover:not-data-disabled:not-disabled:not-data-checked:[--_bg:color-mix(in_oklab,var(--ow-fg)_13%,transparent)]",
  // Held, or with its row held: in to 0.97 within 90 ms, with the pressed fill.
  "ow-radio-group-held:bg-(color:--_bg-held) ow-radio-group-held:transform-[scale(var(--_press))]",
  "ow-radio-group-held:duration-90 ow-radio-group-held:ease-(--ow-ease-out)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  "data-readonly:cursor-default",
  "data-disabled:opacity-50 data-disabled:cursor-not-allowed",
  // The fill still changes and the dot fades in; nothing moves.
  "motion-reduce:[--_press:1]",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:[--_shadow:inset_0_0_0_1px_var(--ow-edge)]",
  "contrast-more:data-checked:[--_shadow:inset_0_0_0_1px_var(--ow-edge)]",
  // The edge is the outline above; on is the system's highlight.
  "forced-colors:data-checked:[--_bg:Highlight] forced-colors:data-checked:[--_bg-held:Highlight]",
  "forced-colors:data-checked:[--_shadow:none] forced-colors:data-checked:forced-color-adjust-none",
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:outline-[GrayText] forced-colors:data-disabled:opacity-100",
  "forced-colors:data-disabled:data-checked:[--_bg:GrayText]",
  "forced-colors:data-disabled:data-checked:[--_bg-held:GrayText]",
];

// The circle's own box, so whatever it holds is centered in it at any zoom.
const indicator = [
  "[--_dot:var(--ow-on-accent)]",
  // Where the dot scales in from. A mark, not a surface, so it may start small.
  "[--_from:calc(1_-_0.5_*_var(--ow-motion-scale))]",
  "absolute inset-0 grid place-items-center rounded-[inherit] text-(color:--_dot)",
  // Its own layer, so it lands without a pixel jump.
  "will-change-transform transition-[transform,opacity]",
  "duration-[var(--ow-spring-settle-duration),100ms]",
  "ease-[var(--ow-spring-settle),var(--ow-ease-out)]",
  // The dot: a clear border inside the circle's box. The border widths round alike, so the dot
  // sits as far from the circle's edge on every side at a fractional zoom.
  "empty:box-border empty:border-[length:calc(var(--icon)_*_0.29)] empty:border-solid",
  "empty:border-transparent empty:bg-clip-padding empty:bg-current",
  "[&>:where(svg,img)]:block [&>:where(svg,img)]:size-full",
  "data-starting-style:opacity-0 data-starting-style:transform-[scale(var(--_from))]",
  "data-unchecked:opacity-0 data-unchecked:transform-[scale(var(--_from))]",
  // Gone with the fill, since a light dot does not belong on the well.
  "data-unchecked:[transition:none]",
  "motion-reduce:[--_from:1]",
  "forced-colors:[--_dot:HighlightText]",
];

/** The classes of the inner parts. */
export const radioGroupSlots: Record<"radio" | "indicator", string> = {
  radio: radio.join(" "),
  indicator: indicator.join(" "),
};
