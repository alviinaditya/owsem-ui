// The Tailwind CSS v4 twin of accordion-variants.ts: the same exports, with the styles as utility
// classes. Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type AccordionSize = "sm" | "md" | "lg";

export interface AccordionVariantProps {
  /** A 32, 40, or 48 px trigger, with Button's font sizes; the panel's text follows. @default "md" */
  size?: AccordionSize | undefined;
}

// Items told apart by one hairline between them, each a full-width row.
const root = [
  "group/ow-accordion flex flex-col text-(color:--ow-fg)",
  "data-[orientation=horizontal]:flex-row",
];

// The hairline sits between two items: none before the first or after the last. More contrast
// asked for: it comes back at 3:1.
const item = [
  "min-w-0 [[data-slot=accordion-item]+&]:border-t [[data-slot=accordion-item]+&]:border-(--ow-line)",
  "contrast-more:[[data-slot=accordion-item]+&]:border-(--ow-edge)",
  "data-[orientation=horizontal]:flex",
  "data-[orientation=horizontal]:[[data-slot=accordion-item]+&]:border-t-0",
  "data-[orientation=horizontal]:[[data-slot=accordion-item]+&]:border-s",
];

const header = [
  "m-0 font-[family-name:inherit] font-[weight:inherit]",
  "data-[orientation=horizontal]:flex-none",
];

// Button's geometry: one number, --py; the block padding never drops a target below 24px. Above
// the panel that follows it, so its focus ring is not painted over. A press changes nothing.
const trigger = [
  // Box. The side padding is the room a focus ring of the panel's content needs, so both align.
  "group/ow-accordion-trigger relative z-1 m-0 box-border flex w-full items-center justify-between",
  "gap-[0.5em] border-0 rounded-(--ow-radius) bg-transparent py-(--_py) px-[4px] text-start",
  "[--_py:max(var(--py),calc((24px_-_1lh)_/_2))] [--icon:calc(1em_+_2px)]",
  // Type.
  "font-[family-name:inherit] font-medium text-(color:--ow-fg)",
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent]",
  // 2px outside the row.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  "forced-colors:focus-visible:outline-[Highlight] forced-colors:data-disabled:text-[GrayText]",
  // Horizontal: as wide as its label.
  "data-[orientation=horizontal]:w-auto data-[orientation=horizontal]:px-[12px]",
  "data-[orientation=horizontal]:whitespace-nowrap",
];

const sizeStyles = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

const variants = cva(trigger, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The trigger's classes. */
export function accordionTriggerVariants({ size }: AccordionVariantProps = {}): string {
  return cn(variants({ size }));
}

// The box that moves: clipped, with its size from Base UI and the content fading with it.
// Horizontal, the width moves instead. Motion is scaled by the motion intensity, so at 0 the panel
// opens at once. Base UI measures whole pixels, so at a fractional zoom or content height the box
// would end up to half a pixel short of the content and jump to it as it lands. Where the browser
// can move to `auto`, it does, and ends on the exact size.
const panel = [
  "group/ow-accordion-panel [--_duration:calc(300ms_*_var(--ow-motion-scale))] h-(--accordion-panel-height) overflow-hidden",
  "supports-[interpolate-size:allow-keywords]:[interpolate-size:allow-keywords]",
  "supports-[interpolate-size:allow-keywords]:h-auto",
  "transition-[block-size,opacity] duration-[var(--_duration),calc(var(--_duration)_*_0.7)]",
  "ease-[var(--ow-ease-drawer),var(--ow-ease-out)]",
  "data-starting-style:h-0 data-starting-style:opacity-0",
  "data-ending-style:h-0 data-ending-style:opacity-0",
  "supports-[interpolate-size:allow-keywords]:data-starting-style:h-0",
  "supports-[interpolate-size:allow-keywords]:data-ending-style:h-0",
  "data-[orientation=horizontal]:h-auto",
  "data-[orientation=horizontal]:w-(--accordion-panel-width)",
  "supports-[interpolate-size:allow-keywords]:data-[orientation=horizontal]:w-auto",
  "data-[orientation=horizontal]:transition-[inline-size,opacity]",
  "data-[orientation=horizontal]:data-starting-style:h-auto",
  "data-[orientation=horizontal]:data-starting-style:w-0",
  "data-[orientation=horizontal]:data-ending-style:h-auto",
  "data-[orientation=horizontal]:data-ending-style:w-0",
  "supports-[interpolate-size:allow-keywords]:data-[orientation=horizontal]:data-starting-style:w-0",
  "supports-[interpolate-size:allow-keywords]:data-[orientation=horizontal]:data-ending-style:w-0",
  // No movement: the panel opens at once, with a short fade.
  "motion-reduce:transition-[opacity] motion-reduce:duration-[calc(120ms_*_var(--ow-motion-scale))]",
  "motion-reduce:ease-(--ow-ease-out)",
  "motion-reduce:data-starting-style:h-(--accordion-panel-height)",
  "motion-reduce:data-ending-style:h-(--accordion-panel-height)",
  "motion-reduce:data-[orientation=horizontal]:data-starting-style:h-auto",
  "motion-reduce:data-[orientation=horizontal]:data-ending-style:h-auto",
  "motion-reduce:data-[orientation=horizontal]:data-starting-style:w-(--accordion-panel-width)",
  "motion-reduce:data-[orientation=horizontal]:data-ending-style:w-(--accordion-panel-width)",
];

// The text under the trigger: the size's font. The side padding is the room a focus ring of the
// content needs (2px outside, 2px wide) inside the clip. Horizontal, the content keeps its width so
// it does not rewrap while the panel opens.
const content = [
  "pt-[0.25em] pr-[4px] pb-[1em] pl-[4px] text-(color:--ow-fg) font-normal",
  "group-data-[orientation=horizontal]/ow-accordion-panel:w-max",
];

const contentVariants = cva(content, {
  variants: {
    size: {
      sm: "text-[0.8125rem] leading-[1.5]",
      md: "text-[0.875rem] leading-[1.5]",
      lg: "text-[1rem] leading-[1.5]",
    },
  },
  defaultVariants: { size: "md" },
});

/** The content's classes: the size's text. */
export function accordionContentVariants({ size }: AccordionVariantProps = {}): string {
  return cn(contentVariants({ size }));
}

// Muted, then the text color on hover and while open; icon-sized, pulled toward the edge.
const icon = [
  "inline-grid size-(--icon) flex-none place-items-center me-[calc((1cap_-_var(--icon))_/_2)]",
  "[--_flip:0] group-data-panel-open/ow-accordion-trigger:[--_flip:1]",
  "text-(color:--ow-muted) group-data-panel-open/ow-accordion-trigger:text-(color:--ow-fg)",
  "pointer-fine:group-hover/ow-accordion-trigger:group-not-data-disabled/ow-accordion-trigger:text-(color:--ow-fg)",
  "transition-[color] duration-150 ease-(--ow-ease-out) motion-reduce:transition-none",
  "[&_:where(svg,img)]:block [&_:where(svg,img)]:size-full",
  // Horizontal: the chevron points toward the panel.
  "group-data-[orientation=horizontal]/ow-accordion-trigger:[&>svg]:-rotate-90",
  "group-data-[orientation=horizontal]/ow-accordion-trigger:[&>svg:dir(rtl)]:rotate-90",
];

// Each stroke turns a quarter about its own center: down, flat halfway, then up.
const stroke = [
  "[--_turn:-1] data-[side=end]:[--_turn:1] [transform-box:fill-box] origin-center",
  "rotate-[calc(var(--_flip)_*_var(--_turn)_*_90deg)] will-change-[rotate] transition-[rotate]",
  "duration-[calc(var(--ow-spring-settle-duration)_*_var(--ow-motion-scale))]",
  "ease-(--ow-spring-settle) motion-reduce:transition-none",
];

/** The classes of the other parts. */
export const accordionSlots: Record<
  "root" | "item" | "header" | "panel" | "icon" | "stroke",
  string
> = {
  root: root.join(" "),
  item: item.join(" "),
  header: header.join(" "),
  panel: panel.join(" "),
  icon: icon.join(" "),
  stroke: stroke.join(" "),
};
