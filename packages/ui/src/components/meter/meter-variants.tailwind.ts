// The Tailwind CSS v4 twin of meter-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type MeterSize = "sm" | "md" | "lg";

export type MeterTone = "accent" | "good" | "warning" | "critical";

export interface MeterVariantProps {
  /** A 4, 8, or 12 px track, with Button's font sizes for the label. @default "md" */
  size?: MeterSize | undefined;
  /** The fill's color. Never the only signal: keep the value or an aria-valuetext. @default "accent" */
  tone?: MeterTone | undefined;
}

// A label at the start and the value at the end above a pill track: the track is a 10% tint of the
// text color and the fill is the accent, or the tone the page picks.
const root = [
  // Box. The group of the parts below that read the whole, such as the rest after the segments.
  "group/ow-meter grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-[12px]",
  "[--_track:color-mix(in_oklab,var(--ow-fg)_10%,transparent)]",
  // Type.
  "text-(color:--ow-fg)",
];

const sizeStyles = {
  sm: "[--_height:4px] text-[0.8125rem] leading-[1.25]",
  md: "[--_height:8px] text-[0.875rem] leading-[1.25]",
  lg: "[--_height:12px] text-[1rem] leading-[1.25]",
};

const toneStyles = {
  accent: "[--_fill:var(--ow-accent)]",
  good: "[--_fill:var(--ow-good)]",
  warning: "[--_fill:var(--ow-warning)]",
  critical: "[--_fill:var(--ow-critical)]",
};

const variants = cva(root, {
  variants: { size: sizeStyles, tone: toneStyles },
  defaultVariants: { size: "md", tone: "accent" },
});

/** The root's classes. */
export function meterVariants({ size, tone }: MeterVariantProps = {}): string {
  return cn(variants({ size, tone }));
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
  // With segments: a row of pills, 3px apart, with no groove behind them.
  "ow-meter-parts:flex ow-meter-parts:gap-[3px] ow-meter-parts:overflow-visible",
  "ow-meter-parts:rounded-none ow-meter-parts:outline-none ow-meter-parts:bg-transparent",
  // The rest of the range is one more pill after the last, from the Root's value; gone when full.
  "ow-meter-parts:after:content-[''] ow-meter-parts:after:grow-[calc(100_-_var(--_value,0))]",
  "ow-meter-parts:after:basis-0 ow-meter-parts:after:min-w-(--_height)",
  "ow-meter-parts:after:rounded-[999px] ow-meter-parts:after:bg-(color:--_track)",
  "ow-meter-parts:after:[print-color-adjust:exact]",
  "ow-meter-parts:after:outline-1 ow-meter-parts:after:-outline-offset-1",
  "ow-meter-parts:after:outline-transparent",
  "contrast-more:ow-meter-parts:after:outline-(color:--ow-edge)",
  "group-data-full/ow-meter:ow-meter-parts:after:hidden",
];

// As wide as the track, moved left by what is not filled; it ends in a pill, so the head is round.
// The part leaves out the width and height Base UI would set inline.
const indicator = [
  // Box.
  "w-full h-full rounded-[inherit] bg-(color:--_fill) [print-color-adjust:exact]",
  "[--_dir:1] [&:dir(rtl)]:[--_dir:-1]",
  "[translate:calc(var(--_dir)_*_(var(--_value,0)_-_100)_*_1%)_0]",
  "transition-[translate] duration-(--ow-spring-glide-duration) ease-(--ow-spring-glide) will-change-[translate]",
  // No fade or travel: the fill goes to its place.
  "motion-reduce:transition-none",
  // The fill is the system's highlight, tone or not.
  "forced-colors:bg-[Highlight]",
];

// From the accent toward the text color by position, so each part reads on the page in both
// themes. A tone sets the color itself, through --_tone.
const position = [
  "[--_step:0%]",
  "[--_color:var(--_tone,color-mix(in_oklab,var(--ow-accent),var(--ow-fg)_var(--_step)))]",
  "nth-[5n+2]:[--_step:22%] nth-[5n+3]:[--_step:44%]",
  "nth-[5n+4]:[--_step:66%] nth-[5n+5]:[--_step:88%]",
];

const toneColors = {
  accent: "[--_tone:var(--ow-accent)]",
  good: "[--_tone:var(--ow-good)]",
  warning: "[--_tone:var(--ow-warning)]",
  critical: "[--_tone:var(--ow-critical)]",
};

// Its width is its share of the range; a part of nothing is not drawn. One part shown, by the
// pointer or the legend, and the others step back.
const segment = [
  ...position,
  // Box.
  "grow-(--_share) basis-0 min-w-(--_height) rounded-[999px] bg-(color:--_color)",
  "[print-color-adjust:exact]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "transition-opacity duration-180 ease-(--ow-ease-out)",
  "data-empty:hidden data-dimmed:opacity-38",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:outline-(color:--ow-edge)",
  // A part is the text color, the shown one the highlight, the others gray.
  "forced-colors:bg-[CanvasText] forced-colors:data-active:bg-[Highlight]",
  "forced-colors:data-dimmed:bg-[GrayText] forced-colors:data-dimmed:opacity-100",
];

const segmentVariants = cva(segment, { variants: { tone: toneColors } });

/** A part of a whole. Without a tone it takes its color from its position. */
export function meterSegmentVariants({ tone }: { tone?: MeterTone | undefined } = {}): string {
  return cn(segmentVariants({ tone }));
}

// The buttons below the bar, in a wrapping row. The items' padding hangs outside, so the first dot
// lines up with the bar's start.
const legendSizes = {
  sm: "text-[0.75rem] leading-[1.25]",
  md: "text-[0.8125rem] leading-[1.25]",
  lg: "text-[0.875rem] leading-[1.25]",
};

const legendVariants = cva("flex flex-wrap gap-[2px] mt-[12px] -mx-[0.75em]", {
  variants: { size: legendSizes },
  defaultVariants: { size: "md" },
});

/** The legend's classes, at a size. */
export function meterLegendVariants({ size }: { size?: MeterSize | undefined } = {}): string {
  return cn(legendVariants({ size }));
}

// A flat button that stays tinted while pressed, as a Toggle that is on.
const legendItem = [
  "group/ow-meter-item",
  ...position,
  "[--_on-fg:color-mix(in_oklab,var(--ow-accent)_70%,var(--ow-fg))]",
  // Box.
  "m-0 box-border inline-flex items-center gap-[0.6em] min-h-[24px]",
  "border-0 rounded-[999px] bg-transparent py-[0.55em] ps-[0.75em] pe-[0.9em]",
  // The dot, in the part's color.
  "before:content-[''] before:flex-none before:size-[0.6em] before:rounded-[50%]",
  "before:bg-(color:--_color) before:[print-color-adjust:exact]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "font-[family-name:inherit] font-medium text-(color:--ow-muted)",
  // Touch, and its own layer so it lands without a pixel jump.
  "cursor-pointer touch-manipulation will-change-transform",
  // A press lets go on the settle spring; held, it is in within 90 ms.
  "transition-[transform] duration-(--ow-spring-settle-duration) ease-(--ow-spring-settle)",
  "active:not-data-disabled:transform-[scale(0.97)] active:not-data-disabled:duration-90",
  "active:not-data-disabled:ease-(--ow-ease-out)",
  // Pressed: a tint of the accent with accent text leaning toward the text color.
  "aria-pressed:bg-[color-mix(in_oklab,var(--ow-accent)_14%,transparent)]",
  "aria-pressed:text-(color:--_on-fg)",
  // Off, hovered: flat and tinted. Pressed, hovered: the tint steps up a little.
  "hover:not-aria-pressed:not-data-disabled:not-active:bg-(--ow-hover)",
  "hover:not-aria-pressed:not-data-disabled:not-active:text-(color:--ow-fg)",
  "hover:aria-pressed:not-data-disabled:not-active:bg-[color-mix(in_oklab,var(--ow-accent)_18%,transparent)]",
  // Held down, pressed or not: the deepest tint.
  "active:not-data-disabled:bg-[color-mix(in_oklab,var(--ow-accent)_22%,transparent)]",
  "active:not-data-disabled:text-(color:--_on-fg)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
  // No movement; the material still changes.
  "motion-reduce:active:not-data-disabled:transform-none",
  // The tint is gone, so pressed is the system's highlight; a disabled one stays gray.
  "forced-colors:before:bg-[CanvasText]",
  "forced-colors:aria-pressed:bg-[Highlight] forced-colors:aria-pressed:before:bg-[HighlightText]",
  "forced-colors:aria-pressed:not-data-disabled:text-[HighlightText]",
  "forced-colors:aria-pressed:hover:not-data-disabled:not-active:bg-[Highlight]",
  "forced-colors:aria-pressed:hover:not-data-disabled:not-active:text-[HighlightText]",
  "forced-colors:aria-pressed:active:not-data-disabled:bg-[Highlight]",
  "forced-colors:aria-pressed:active:not-data-disabled:text-[HighlightText]",
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

const legendItemVariants = cva(legendItem, { variants: { tone: toneColors } });

/** A legend item. Give it the tone of its segment, or none to match a segment by position. */
export function meterLegendItemVariants({ tone }: { tone?: MeterTone | undefined } = {}): string {
  return cn(legendItemVariants({ tone }));
}

const value = ["[grid-area:1_/_2] mb-[8px] text-(color:--ow-muted) tabular-nums"];

const label = ["[grid-area:1_/_1] mb-[8px] font-medium"];

// Muted and tabular; in a pressed item it takes the item's color.
const legendValue = [
  "text-(color:--ow-muted) font-normal tabular-nums group-aria-pressed/ow-meter-item:text-inherit",
];

/** The classes of the inner parts. */
export const meterSlots: Record<"track" | "indicator" | "value" | "label" | "legendValue", string> =
  {
    track: track.join(" "),
    indicator: indicator.join(" "),
    value: value.join(" "),
    label: label.join(" "),
    legendValue: legendValue.join(" "),
  };
