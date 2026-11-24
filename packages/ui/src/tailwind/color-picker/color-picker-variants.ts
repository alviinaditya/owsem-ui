// Generated from components/color-picker by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of color-picker-variants.ts: the same exports, with the styles as utility
// classes. Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

export type ColorPickerSize = "sm" | "md" | "lg";

export type ColorPickerVariant = "field" | "swatch";

export interface ColorPickerVariantProps {
  /** The trigger's type scale and height: 13, 14, or 16px. @default "md" */
  size?: ColorPickerSize | undefined;
  /** `"field"` shows the color and its value; `"swatch"` is a square of the color. @default "field" */
  variant?: ColorPickerVariant | undefined;
}

// The private variables of the picker and its trigger. The colors being picked are painted inline;
// the rest are theme tokens, apart from the literals that must read on any color.
const vars = [
  "[--_fg:var(--ow-fg)] [--_muted:var(--ow-muted)] [--_focus:var(--ow-focus)]",
  "[--_radius:var(--ow-radius)] [--_bg:var(--ow-panel)] [--_panel-shadow:var(--ow-surface-shadow)]",
  "[--_surface:color-mix(in_oklab,var(--ow-fg)_6%,transparent)]",
  // literal: a color's own 1px edge, darker than the color under it in any theme
  "[--_color-edge:inset_0_0_0_1px_rgb(0_0_0_/_0.2)]",
  // Translucent colors sit on a checkerboard of the panel and the line color.
  "[--_checker:var(--ow-line)]",
  "[--_checkers:repeating-conic-gradient(var(--_checker)_0_25%,var(--_bg)_0_50%)]",
  // A press compacts by up to 12%, scaled by the motion intensity.
  "[--_press:calc(1_-_0.12_*_var(--ow-motion-scale))]",
  "[--_ease-out:var(--ow-ease-out)] [--_settle:var(--ow-spring-settle)]",
  "[--_settle-duration:var(--ow-spring-settle-duration)]",
  "[--_mono:var(--ow-font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace)]",
  "[-webkit-tap-highlight-color:transparent]",
];

// The width and the area's height are layout: change them with className. Each slider is a 24px
// target around its track.
const root = [
  ...vars,
  "[--_pad:10px] [--_track:12px] [--_slider:24px]",
  // Box.
  "flex flex-col gap-(--_pad) box-border w-[256px] max-w-full p-(--_pad)",
  // One radius outside; the controls inside keep theirs, past a wide padding.
  "rounded-(--_radius) bg-(color:--_bg) shadow-(shadow:--_panel-shadow)",
  // Type.
  "text-(color:--_fg) text-[13px] leading-[1.25]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // States.
  "[&[data-disabled]>*]:opacity-50",
];

// Saturation from the start edge, brightness from the bottom; the hue is painted inline. The
// gradients are literal: the same over the hue in every theme.
const area = [
  "group/ow-color-picker-area",
  // Box.
  "relative flex-none h-[160px] rounded-(--_radius) shadow-(shadow:--_color-edge)",
  "bg-[image:linear-gradient(to_top,#000,transparent),linear-gradient(to_right,#fff,transparent)]",
  "[&:dir(rtl)]:bg-[image:linear-gradient(to_top,#000,transparent),linear-gradient(to_left,#fff,transparent)]",
  // Touch.
  "cursor-crosshair touch-none forced-color-adjust-none",
  // States.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  // An outline is the edge in forced colors; focus uses the system color.
  "forced-colors:outline-1 forced-colors:outline-offset-0 forced-colors:outline-[CanvasText]",
  "forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2",
  "forced-colors:focus-visible:outline-[Highlight]",
];

// A ring around the color with a 1px dark edge outside and a faint one inside, so it shows on every
// color. It compacts while pressed and springs back; its edges stay the same.
const thumb = [
  // Box. A white ring, so the thumb reads on any color in either theme (literal).
  "absolute box-border size-[16px] rounded-[50%] border-2 border-[#ffffff]",
  // literal: its dark edges, so the ring also reads on light colors
  "shadow-[0_0_0_1px_rgb(0_0_0_/_0.4),inset_0_0_0_1px_rgb(0_0_0_/_0.12)]",
  "forced-color-adjust-none",
  // Motion. Its own layer, so it lands without a pixel jump.
  "will-change-transform transition-[scale] duration-(--_settle-duration) ease-(--_settle)",
  // Pressed: it compacts.
  "data-dragging:scale-(--_press) data-dragging:duration-120 data-dragging:ease-(--_ease-out)",
  // Base UI focuses the range input inside the thumb.
  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
  "has-focus-visible:outline-(color:--_focus)",
  // Media. No compacting.
  "motion-reduce:data-dragging:scale-none",
  "forced-colors:has-focus-visible:outline-[Highlight]",
];

// The thumb of the area sits on its color, centered, and never takes the pointer.
const areaThumb = [
  ...thumb,
  "pointer-events-none [translate:-50%_-50%] [&:dir(rtl)]:[translate:50%_-50%]",
  "group-data-dragging/ow-color-picker-area:scale-(--_press)",
  "group-data-dragging/ow-color-picker-area:duration-120",
  "group-data-dragging/ow-color-picker-area:ease-(--_ease-out)",
  "motion-reduce:group-data-dragging/ow-color-picker-area:scale-none",
];

// The eye dropper, the sliders, and the preview, as tall as the two tracks together.
const tools = [
  "[--_tool:var(--_slider)] data-stack:[--_tool:calc(var(--_slider)_+_var(--_track))]",
  "flex items-center gap-(--_pad)",
];

// Room for a thumb at either end, and its focus ring.
const sliders = ["flex-1 min-w-0 px-[6px]"];

// Names the group the track reads its channel from.
const slider = ["group/ow-color-picker-slider"];

const control = ["flex items-center h-(--_slider) cursor-pointer touch-none"];

// The hue spectrum and the alpha ramp over a checkerboard; the hue is literal, the same in every
// theme.
const track = [
  "relative flex-1 h-(--_track) rounded-[calc(var(--_track)_/_2)] shadow-(shadow:--_color-edge)",
  "forced-color-adjust-none",
  "group-data-[channel=hue]/ow-color-picker-slider:bg-[image:linear-gradient(to_right,#f00_0%,#ff0_16.667%,#0f0_33.333%,#0ff_50%,#00f_66.667%,#f0f_83.333%,#f00_100%)]",
  "group-data-[channel=hue]/ow-color-picker-slider:[&:dir(rtl)]:bg-[image:linear-gradient(to_left,#f00_0%,#ff0_16.667%,#0f0_33.333%,#0ff_50%,#00f_66.667%,#f0f_83.333%,#f00_100%)]",
  "group-data-[channel=alpha]/ow-color-picker-slider:bg-[image:linear-gradient(to_right,transparent,var(--_alpha)),var(--_checkers)]",
  "group-data-[channel=alpha]/ow-color-picker-slider:[&:dir(rtl)]:bg-[image:linear-gradient(to_left,transparent,var(--_alpha)),var(--_checkers)]",
  "group-data-[channel=alpha]/ow-color-picker-slider:bg-size-[100%_100%,8px_8px]",
  "forced-colors:outline-1 forced-colors:outline-offset-0 forced-colors:outline-[CanvasText]",
];

// One element paints the color over the checkerboard, so no light edge shows at the corners.
const preview = [
  "flex-none size-(--_tool) rounded-(--_radius) shadow-(shadow:--_color-edge)",
  "bg-transparent bg-[image:linear-gradient(var(--_color),var(--_color)),var(--_checkers)]",
  "bg-size-[100%_100%,8px_8px] forced-color-adjust-none",
  "forced-colors:outline-1 forced-colors:outline-offset-0 forced-colors:outline-[CanvasText]",
];

// An icon is the font size plus 2px.
const icon = [
  "flex-none size-[calc(1em_+_2px)] fill-none stroke-current stroke-2",
  "[stroke-linecap:round] [stroke-linejoin:round]",
];

// Keys: tints of the text color; a deeper tint on hover, deeper while held. The tool and the format
// switch share them.
const key = [
  "[--_key:var(--_surface)] [--_key-hover:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "[--_key-held:color-mix(in_oklab,var(--ow-fg)_13%,transparent)]",
  // Box.
  "inline-flex flex-none items-center justify-center box-border m-0 border-0 rounded-(--_radius)",
  "bg-(color:--_key) text-(color:--_fg) cursor-pointer",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Motion.
  "will-change-transform transition-[scale] duration-(--_settle-duration) ease-(--_settle)",
  // Hover steps the fill up; held presses in.
  "pointer-fine:hover:not-disabled:bg-(color:--_key-hover)",
  "held:not-disabled:bg-(color:--_key-held) held:not-disabled:scale-97",
  "held:not-disabled:duration-90 held:not-disabled:ease-(--_ease-out)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  // Media. No compacting.
  "motion-reduce:held:not-disabled:scale-none",
  "forced-colors:focus-visible:outline-[Highlight]",
];

const tool = [...key, "size-(--_tool) p-0 font-[family-name:inherit] font-[weight:inherit]"];

// Fields and the format switch: one-line controls on the --py rule, sm size.
const oneLine = [
  "[--py:0.6058em] [--_py:max(var(--py),(24px_-_1lh)_/_2)]",
  "[--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  // Firefox grows a field to its font's own line height when that is taller; pin both.
  "box-border h-[calc(1lh_+_2_*_var(--_py))] py-(--_py)",
  "font-[family-name:var(--_mono)] text-[13px] leading-[1.25]",
];

const inputs = ["flex items-start gap-[6px]"];

const format = [
  ...key,
  ...oneLine,
  "gap-[2px] ps-(--px) pe-[calc(var(--px)_-_4px)] font-semibold",
  "[&>svg]:me-[calc((1cap_-_(1em_+_2px))_/_2)] [&>svg]:text-(color:--_muted)",
];

const field = ["flex flex-[1_1_0] flex-col gap-[4px] min-w-0 data-wide:grow-3"];

const input = [
  ...oneLine,
  // A tint of the text color, with no edge or shadow.
  "[--_field:var(--_surface)] w-full min-w-0 m-0 px-[2px] border-0 rounded-(--_radius)",
  "bg-(color:--_field) text-(color:--_fg) tabular-nums text-center",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // The fill takes a faint tint on hover.
  "pointer-fine:hover:not-disabled:[--_field:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  // Media. More contrast asked for: the edge comes back at 3:1.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  "forced-colors:focus-visible:outline-[Highlight]",
];

const label = ["text-(color:--_muted) text-[11px] tracking-[0.04em] text-center"];

// Swatches under a hairline.
const swatches = [
  "grid grid-cols-[repeat(auto-fill,minmax(24px,1fr))] gap-[6px] pt-(--_pad)",
  "border-t border-t-(color:--ow-line)",
];

const swatch = [
  // Box. The check is literal: it contrasts with the swatch's own color, not with the theme.
  "grid place-items-center aspect-[1] m-0 p-0 border-0 rounded-[calc(var(--_radius)_-_2px)]",
  "text-[#fff] data-light:text-[#000] text-[13px] cursor-pointer",
  // The swatch is the color, over the checkerboard when it is translucent.
  "flex-none bg-(color:--_color) shadow-(shadow:--_color-edge) forced-color-adjust-none",
  "data-alpha:bg-transparent",
  "data-alpha:bg-[image:linear-gradient(var(--_color),var(--_color)),var(--_checkers)]",
  "data-alpha:bg-size-[100%_100%,8px_8px]",
  // The swatch of the current color carries a check.
  "[&:not([data-pressed])>svg]:invisible",
  // Motion.
  "will-change-transform transition-[scale] duration-(--_settle-duration) ease-(--_settle)",
  "held:not-disabled:scale-90 held:not-disabled:duration-100",
  "held:not-disabled:ease-(--_ease-out)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  // Media. No compacting; edges, the selected swatch, and focus use system colors.
  "motion-reduce:held:not-disabled:scale-none",
  "forced-colors:outline-1 forced-colors:outline-offset-0 forced-colors:outline-[CanvasText]",
  // Focus is the last word on the width.
  "forced-colors:data-pressed:outline-[Highlight] forced-colors:data-pressed:not-focus-visible:outline-3",
  "forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2",
  "forced-colors:focus-visible:outline-[Highlight]",
];

// The color is the leading icon: as far from the edges as from the top and bottom.
const chip = [
  "flex-none size-(--icon) ms-[calc((1cap_-_var(--icon))_/_2)] rounded-[calc(var(--_radius)_/_2)]",
  "bg-(color:--_color) shadow-(shadow:--_color-edge) forced-color-adjust-none",
  "data-alpha:bg-transparent",
  "data-alpha:bg-[image:linear-gradient(var(--_color),var(--_color)),var(--_checkers)]",
  "data-alpha:bg-size-[100%_100%,8px_8px]",
  "forced-colors:outline-1 forced-colors:outline-offset-0 forced-colors:outline-[CanvasText]",
];

const value = ["font-[family-name:var(--_mono)] tabular-nums whitespace-nowrap"];

// The trigger: a tint that shows the color and its value, or a square of the color.
const trigger = [
  ...vars,
  "[--_py:max(var(--py),(24px_-_1lh)_/_2)] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)]",
  // Box.
  "inline-flex items-center gap-[0.5em] box-border m-0 py-(--_py) px-(--px) border-0",
  "rounded-(--_radius) bg-(color:--_surface)",
  // Type.
  "text-(color:--_fg) font-[family-name:inherit] font-[weight:inherit]",
  // Invisible until forced colors draw it as the edge.
  "cursor-pointer outline-1 -outline-offset-1 outline-transparent",
  // Motion.
  "will-change-transform transition-[scale] duration-(--_settle-duration) ease-(--_settle)",
  "held:not-disabled:scale-97 held:not-disabled:duration-90",
  "held:not-disabled:ease-(--_ease-out)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  // Media. No compacting.
  "motion-reduce:held:not-disabled:scale-none",
  "forced-colors:focus-visible:outline-[Highlight]",
];

// The line height sits next to each size, so a user's text size takes both.
const sizeStyles = {
  sm: "[--py:0.6058em] text-[13px] leading-[1.25]",
  md: "[--py:0.8036em] text-[14px] leading-[1.25]",
  lg: "[--py:0.875em] text-[16px] leading-[1.25]",
};

const variantStyles = {
  field: "",
  // A square as tall as the field, filled with the color.
  swatch: [
    "justify-center size-[calc(2_*_var(--_py)_+_1lh)] p-0 bg-transparent bg-none shadow-none",
    "[&>[data-slot=color-picker-chip]]:size-full [&>[data-slot=color-picker-chip]]:m-0",
    "[&>[data-slot=color-picker-chip]]:rounded-[inherit]",
  ],
};

const variants = cva(trigger, {
  variants: { size: sizeStyles, variant: variantStyles },
  defaultVariants: { size: "md", variant: "field" },
});

/** The popover trigger's classes. */
export function colorPickerTriggerVariants({
  size,
  variant,
}: ColorPickerVariantProps = {}): string {
  return cn(variants({ size, variant }));
}

// The popup fades in place. It is large, so even a 0.96 scale moved its far edges 10 to 14px, which
// read as the panel shifting as it opened. The picker inside gets the popup's shadow.
const popup = [
  "transition-opacity duration-150 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-100",
  // Opened from the keyboard, or dismissed: no motion (Base UI's data-instant).
  "data-instant:[transition:none]",
  "[&>[data-slot=color-picker]]:[--_panel-shadow:var(--ow-popup-shadow)]",
  // More contrast asked for: the popup gets a ring.
  "contrast-more:[&>[data-slot=color-picker]]:[--_panel-shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
];

/** The classes of the other parts. The positioner has no look of its own. */
export const colorPickerSlots: Record<
  | "root"
  | "area"
  | "thumb"
  | "areaThumb"
  | "tools"
  | "tool"
  | "sliders"
  | "slider"
  | "control"
  | "track"
  | "preview"
  | "inputs"
  | "format"
  | "field"
  | "input"
  | "label"
  | "swatches"
  | "swatch"
  | "icon"
  | "chip"
  | "value"
  | "positioner"
  | "popup",
  string
> = {
  root: root.join(" "),
  area: area.join(" "),
  thumb: thumb.join(" "),
  areaThumb: areaThumb.join(" "),
  tools: tools.join(" "),
  tool: tool.join(" "),
  sliders: sliders.join(" "),
  slider: slider.join(" "),
  control: control.join(" "),
  track: track.join(" "),
  preview: preview.join(" "),
  inputs: inputs.join(" "),
  format: format.join(" "),
  field: field.join(" "),
  input: input.join(" "),
  label: label.join(" "),
  swatches: swatches.join(" "),
  swatch: swatch.join(" "),
  icon: icon.join(" "),
  chip: chip.join(" "),
  value: value.join(" "),
  positioner: "",
  popup: popup.join(" "),
};
