// The Tailwind CSS v4 twin of progress-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-progress-travel keyframes.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressVariantProps {
  /** A 4, 8, or 12 px track, with Button's font sizes for the label. @default "md" */
  size?: ProgressSize | undefined;
}

// A label at the start and the value at the end above a pill track: the track is a 10% tint of the
// text color and the fill is the accent.
const root = [
  // Box.
  "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-[12px]",
  "[--_track:color-mix(in_oklab,var(--ow-fg)_10%,transparent)] [--_fill:var(--ow-accent)]",
  // Type.
  "text-(color:--ow-fg)",
];

const sizeStyles = {
  sm: "[--_height:4px] text-[0.8125rem] leading-[1.25]",
  md: "[--_height:8px] text-[0.875rem] leading-[1.25]",
  lg: "[--_height:12px] text-[1rem] leading-[1.25]",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The root's classes. */
export function progressVariants({ size }: ProgressVariantProps = {}): string {
  return cn(variants({ size }));
}

// Isolated, so the track clips the fill's own layer. Overflow hidden: the fill slides in from
// outside it, and the ends round it.
const track = [
  // Box.
  "isolate overflow-hidden rounded-[999px] h-(--_height) [grid-area:2_/_1_/_3_/_-1]",
  "bg-(color:--_track) [print-color-adjust:exact]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // More contrast asked for: the edge comes back at 3:1, over the fill too.
  "contrast-more:outline-(color:--ow-edge)",
];

// As wide as the track, moved left by what is not filled; it ends in a pill, so the head is round.
// The part leaves out the width and height Base UI would set inline. With no
// value it is a segment that travels the track, from before its start to past its end.
const indicator = [
  // Box.
  "w-full h-full rounded-[inherit] bg-(color:--_fill) [print-color-adjust:exact]",
  "[--_dir:1] [&:dir(rtl)]:[--_dir:-1]",
  // The fill is as wide as the track and moves with a transform.
  "[translate:calc(var(--_dir)_*_(var(--_value,0)_-_100)_*_1%)_0]",
  "transition-[translate] duration-(--ow-spring-glide-duration) ease-(--ow-spring-glide) will-change-[translate]",
  // No value.
  "data-indeterminate:w-[40%] data-indeterminate:[translate:calc(var(--_dir)_*_-100%)_0]",
  "data-indeterminate:animate-[ow-progress-travel_1.6s_var(--ow-ease-in-out)_infinite]",
  // No travel: the segment sits in the middle, which no value is.
  "motion-reduce:transition-none",
  "motion-reduce:data-indeterminate:[translate:calc(var(--_dir)_*_75%)_0]",
  "motion-reduce:data-indeterminate:animate-none",
  // The fill is the system's highlight.
  "forced-colors:bg-[Highlight]",
];

const value = ["[grid-area:1_/_2] mb-[8px] text-(color:--ow-muted) tabular-nums"];

const label = ["[grid-area:1_/_1] mb-[8px] font-medium"];

/** The classes of the inner parts. */
export const progressSlots: Record<"track" | "indicator" | "value" | "label", string> = {
  track: track.join(" "),
  indicator: indicator.join(" "),
  value: value.join(" "),
  label: label.join(" "),
};
