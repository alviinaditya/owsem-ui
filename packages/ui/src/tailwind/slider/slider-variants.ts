// Generated from components/slider by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of slider-variants.ts: the same exports, with the styles as utility
// classes. Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

export type SliderSize = "sm" | "md" | "lg";

export interface SliderVariantProps {
  /** A 4, 6, or 8 px track with a 16, 20, or 24 px thumb, and Button's fonts. @default "md" */
  size?: SliderSize | undefined;
}

// A label at the start and the value at the end above a pill track: the track is a 10% tint of the
// text color and the fill is the accent; the thumb is a white key with the surface shadow.
const root = [
  // Box.
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-[12px] min-w-0",
  "[--_track:color-mix(in_oklab,var(--ow-fg)_10%,transparent)] [--_fill:var(--ow-accent)]",
  "[--_key:var(--ow-on-accent)] [--_key-shadow:var(--ow-surface-shadow)]",
  "[--_focus:var(--ow-focus)]",
  // How much the thumb grows under the pointer, and while dragged.
  "[--_hover:calc(1_+_0.1_*_var(--ow-motion-scale))] [--_drag:calc(1_+_0.15_*_var(--ow-motion-scale))]",
  // Type.
  "text-(color:--ow-fg)",
  // Upright, it is a column as tall as its height, which is 12rem unless you set one.
  "data-[orientation=vertical]:inline-grid data-[orientation=vertical]:grid-cols-[auto]",
  "data-[orientation=vertical]:grid-rows-[auto_auto_minmax(0,1fr)]",
  "data-[orientation=vertical]:justify-items-center",
  "data-[orientation=vertical]:h-[12rem]",
];

const sizeStyles = {
  sm: "[--_track-size:4px] [--_thumb:16px] text-[0.8125rem] leading-[1.25]",
  md: "[--_track-size:6px] [--_thumb:20px] text-[0.875rem] leading-[1.25]",
  lg: "[--_track-size:8px] [--_thumb:24px] text-[1rem] leading-[1.25]",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The root's classes: the size's track, thumb, and font, which every part reads. */
export function sliderVariants({ size }: SliderVariantProps = {}): string {
  return cn(variants({ size }));
}

// On one baseline; the control does not take part.
const label = ["[grid-area:1_/_1] self-baseline mb-[8px] font-medium"];

const value = [
  "[grid-area:1_/_2] self-baseline mb-[8px] text-(color:--ow-muted) tabular-nums",
  "data-[orientation=vertical]:[grid-area:2_/_1]",
];

// At least 24px tall, and the pointer's: a press anywhere on it moves the nearest thumb.
const control = [
  // Box.
  "[grid-area:2_/_1_/_3_/_-1] flex items-center box-border h-[max(var(--_thumb),24px)] min-w-0",
  "px-[calc(var(--_thumb)_/_2)]",
  // A finger may pan the page across the control's other axis; Base UI keeps tracking it.
  "cursor-pointer [touch-action:pan-y] select-none [-webkit-tap-highlight-color:transparent]",
  "data-[orientation=vertical]:[grid-area:3_/_1] data-[orientation=vertical]:flex-col",
  "data-[orientation=vertical]:h-auto data-[orientation=vertical]:min-h-0",
  "data-[orientation=vertical]:w-[max(var(--_thumb),24px)] data-[orientation=vertical]:px-0",
  "data-[orientation=vertical]:py-[calc(var(--_thumb)_/_2)] data-[orientation=vertical]:[touch-action:pan-x]",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50 forced-colors:data-disabled:opacity-100",
];

// Base UI positions it, and the thumb and fill inside it. It is drawn half a thumb past each end,
// which is where the Control's padding puts the Slider's own edge: a transparent border that far
// with a negative margin the same, so the background and the outline reach the edge while the
// padding box, which the thumb is placed against, stays as long as the track.
const track = [
  // Box.
  "box-content flex-[1_1_0] min-w-0 h-(--_track-size) -mx-[calc(var(--_thumb)_/_2)]",
  "border-0 border-solid border-transparent border-x-[length:calc(var(--_thumb)_/_2)]",
  "data-[orientation=vertical]:h-auto data-[orientation=vertical]:w-(--_track-size)",
  "data-[orientation=vertical]:min-h-0 data-[orientation=vertical]:mx-0",
  "data-[orientation=vertical]:-my-[calc(var(--_thumb)_/_2)] data-[orientation=vertical]:border-x-0",
  "data-[orientation=vertical]:border-y-[length:calc(var(--_thumb)_/_2)]",
  // A pill, whatever the theme's radius.
  "rounded-[999px] bg-(color:--_track) [print-color-adjust:exact]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:outline-(color:--ow-edge)",
  // The transparent border would be drawn in a system color, as solid ends.
  "forced-colors:border-[Canvas] forced-colors:data-disabled:outline-[GrayText]",
];

// Base UI writes its inset and size inline; the part only rounds and colors it.
const indicator = [
  "rounded-[999px] bg-(color:--_fill) [print-color-adjust:exact]",
  // Drawn half a thumb longer at its start, to the groove's start; in a range that lies under the
  // thumb. Base UI sets only its inset and size, which stay the content.
  "box-content ms-[calc(var(--_thumb)_/_-2)] ps-[calc(var(--_thumb)_/_2)]",
  "data-[orientation=vertical]:ms-0 data-[orientation=vertical]:ps-0",
  "data-[orientation=vertical]:mb-[calc(var(--_thumb)_/_-2)]",
  "data-[orientation=vertical]:pb-[calc(var(--_thumb)_/_2)]",
  "data-invalid:[--_fill:var(--ow-critical-solid)]",
  // The fill is the system's highlight.
  "forced-colors:bg-[Highlight] forced-colors:data-disabled:bg-[GrayText]",
];

// A white round key. Base UI places it by inset and a translate; the scale is its own property, so
// growing never fights the placement. Only the thumb under the pointer grows, and the one being
// dragged (the one with focus; every thumb of a range has data-dragging).
const thumb = [
  // Box.
  "box-border size-(--_thumb) rounded-[50%] bg-(color:--_key) shadow-(--_key-shadow)",
  "[print-color-adjust:exact]",
  // The target is at least 24px each way.
  "before:content-[''] before:absolute before:inset-[min(0px,(100%_-_24px)_/_2)]",
  // Its own layer, so it lands without a pixel jump. Let go on the settle spring.
  "[--_scale:1] [scale:var(--_scale)] will-change-[scale] transition-[scale]",
  "duration-(--ow-spring-settle-duration) ease-(--ow-spring-settle)",
  "pointer-fine:hover:not-data-disabled:not-[[data-dragging]:has(:focus)]:[--_scale:var(--_hover)]",
  // Dragged: in within 120 ms.
  "data-dragging:has-[:focus]:[--_scale:var(--_drag)] data-dragging:has-[:focus]:duration-120",
  "data-dragging:has-[:focus]:ease-(--ow-ease-out)",
  // Base UI focuses the range input inside the thumb.
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
  "has-[:focus-visible]:outline-(color:--_focus)",
  "data-disabled:cursor-not-allowed",
  // No growing: the thumb stays its size.
  "motion-reduce:[scale:none] motion-reduce:transition-none",
  // More contrast asked for: the key gets an edge at 3:1.
  "contrast-more:shadow-[var(--_key-shadow),0_0_0_1px_var(--ow-edge)]",
  // The key is drawn solid, in the system's colors.
  "forced-colors:[forced-color-adjust:none] forced-colors:[border:2px_solid_CanvasText]",
  "forced-colors:bg-[Canvas] forced-colors:shadow-none",
  "forced-colors:has-[:focus-visible]:outline-[Highlight]",
  "forced-colors:data-disabled:border-[GrayText]",
];

/** The classes of the inner parts. */
export const sliderSlots: Record<
  "label" | "value" | "control" | "track" | "indicator" | "thumb",
  string
> = {
  label: label.join(" "),
  value: value.join(" "),
  control: control.join(" "),
  track: track.join(" "),
  indicator: indicator.join(" "),
  thumb: thumb.join(" "),
};
