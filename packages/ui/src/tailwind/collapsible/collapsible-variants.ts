// Generated from components/collapsible by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of collapsible-variants.ts: the same exports, with the styles as utility
// classes. Needs tokens.css, and nothing from the bridge (tailwind.css).

import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

export type CollapsibleSize = "sm" | "md" | "lg";

export interface CollapsibleVariantProps {
  /** A 32, 40, or 48 px trigger, with Button's font sizes; the panel's text follows. @default "md" */
  size?: CollapsibleSize | undefined;
}

// A quiet button like a ghost Button, with Button's geometry: one number, --py, and a block
// padding that never drops a target below 24px.
const trigger = [
  // Box.
  "group/ow-collapsible-trigger m-0 box-border flex w-full items-center justify-between gap-[0.5em]",
  "border-0 rounded-(--ow-radius) bg-transparent py-(--_py) px-(--px) text-start",
  "[--_py:max(var(--py),calc((24px_-_1lh)_/_2))] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)] [--_press:calc(1_-_0.03_*_var(--ow-motion-scale))]",
  // Type.
  "font-[family-name:inherit] font-medium text-(color:--ow-fg)",
  // Touch, and its own layer so it lands without a pixel jump.
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] will-change-[scale]",
  // Releasing settles with the Core spring; held, it is in within 90 ms, into the pressed fill.
  "transition-[scale] duration-(--ow-spring-settle-duration) ease-(--ow-spring-settle)",
  "pointer-fine:hover:not-active:not-data-disabled:bg-(color:--ow-hover)",
  "active:not-data-disabled:scale-(--_press) active:not-data-disabled:bg-(color:--ow-pressed-bg)",
  "active:not-data-disabled:duration-90 active:not-data-disabled:ease-(--ow-ease-out)",
  // 2px outside the face.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  // No movement; the press is the material alone.
  "motion-reduce:[--_press:1]",
  "forced-colors:focus-visible:outline-[Highlight] forced-colors:data-disabled:text-[GrayText]",
];

// The size: Button's --py and font size, one definition for the trigger and the content under it.
const sizeVars = {
  sm: "[--py:0.6058em] text-[0.8125rem]",
  md: "[--py:0.8036em] text-[0.875rem]",
  lg: "[--py:0.875em] text-[1rem]",
};

// The line height comes after the font size, which would otherwise reset it.
const variants = cva(trigger, {
  variants: {
    size: {
      sm: `${sizeVars.sm} leading-[1.25]`,
      md: `${sizeVars.md} leading-[1.25]`,
      lg: `${sizeVars.lg} leading-[1.25]`,
    },
  },
  defaultVariants: { size: "md" },
});

/** The trigger's classes. */
export function collapsibleTriggerVariants({ size }: CollapsibleVariantProps = {}): string {
  return cn(variants({ size }));
}

// The text under the trigger: the size's font, and side padding by the trigger's formula, so the two
// line up in any font. 1.25em stands for the trigger's 1lh. The padding also leaves the room a focus
// ring of the content needs (2px outside, 2px wide) inside the clip.
const content = [
  "[--_py:max(var(--py),calc((24px_-_1.25em)_/_2))] [--px:calc(var(--_py)_+_(1.25em_-_1cap)_/_2)]",
  "pt-[0.5em] pb-[1em] px-(--px) text-(color:--ow-fg) font-normal",
];

const contentVariants = cva(content, {
  variants: {
    size: {
      sm: `${sizeVars.sm} leading-[1.5]`,
      md: `${sizeVars.md} leading-[1.5]`,
      lg: `${sizeVars.lg} leading-[1.5]`,
    },
  },
  defaultVariants: { size: "md" },
});

/** The content's classes: the size's text, and side padding that lines up with the trigger's label. */
export function collapsibleContentVariants({ size }: CollapsibleVariantProps = {}): string {
  return cn(contentVariants({ size }));
}

// The box that moves: clipped, with the height from Base UI and the content fading with it.
// Motion is scaled by the motion intensity, so at 0 the panel opens at once.
const panel = [
  "[--_duration:calc(300ms_*_var(--ow-motion-scale))] h-(--collapsible-panel-height) overflow-hidden",
  "transition-[block-size,opacity] duration-[var(--_duration),calc(var(--_duration)_*_0.7)]",
  "ease-[var(--ow-ease-drawer),var(--ow-ease-out)]",
  "data-starting-style:h-0 data-starting-style:opacity-0",
  "data-ending-style:h-0 data-ending-style:opacity-0",
  // No movement: the panel opens at once, with a short fade.
  "motion-reduce:transition-[opacity] motion-reduce:duration-[calc(120ms_*_var(--ow-motion-scale))]",
  "motion-reduce:ease-(--ow-ease-out)",
  "motion-reduce:data-starting-style:h-(--collapsible-panel-height)",
  "motion-reduce:data-ending-style:h-(--collapsible-panel-height)",
];

// Icon-sized, pulled toward the edge so it sits as far from it as from the top.
const icon = [
  "inline-grid size-(--icon) flex-none place-items-center me-[calc((1cap_-_var(--icon))_/_2)]",
  "[--_flip:0] group-data-panel-open/ow-collapsible-trigger:[--_flip:1]",
  "[&_:where(svg,img)]:block [&_:where(svg,img)]:size-full",
];

// Each stroke turns a quarter about its own center: down, flat halfway, then up.
const stroke = [
  "[--_turn:-1] data-[side=end]:[--_turn:1] [transform-box:fill-box] origin-center",
  "rotate-[calc(var(--_flip)_*_var(--_turn)_*_90deg)] will-change-[rotate] transition-[rotate]",
  "duration-[calc(var(--ow-spring-settle-duration)_*_var(--ow-motion-scale))]",
  "ease-(--ow-spring-settle) motion-reduce:transition-none",
];

/** The classes of the other parts. */
export const collapsibleSlots: Record<"panel" | "icon" | "stroke", string> = {
  panel: panel.join(" "),
  icon: icon.join(" "),
  stroke: stroke.join(" "),
};
