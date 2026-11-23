// The Tailwind CSS v4 twin of toggle-group-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type ToggleGroupSize = "sm" | "md" | "lg";

export interface ToggleGroupVariantProps {
  /** Font size and padding of the items. @default "md" */
  size?: ToggleGroupSize | undefined;
}

// A track (a tint of the text color, no shadow) and a thumb that slides under the pressed item. It
// is also Glide's container, so it holds the highlight behind the items (relative isolate).
const root = [
  "group/ow-toggle-group",
  "[--_track:color-mix(in_oklab,var(--ow-fg)_6%,transparent)]",
  // The accent over the track, opaque so the thumb hides nothing it should not.
  "[--_thumb:color-mix(in_oklab,var(--ow-accent)_14%,var(--ow-raised-bg))]",
  // The accent text leans toward the text color, to read on its own tint in both themes.
  "[--_on:color-mix(in_oklab,var(--ow-accent)_70%,var(--ow-fg))]",
  // A key's fill with multiple selection: the thumb's, shifted a little on hover (in the item).
  "[--_key:var(--_thumb)] [--_fg:var(--ow-fg)] [--_muted:var(--ow-muted)] [--_focus:var(--ow-focus)]",
  // The items' and the thumb's radius: the track's, --ow-radius, less its padding.
  "[--_radius:max(0px,var(--ow-radius)_-_var(--_inset))] [--_inset:4px]",
  // How far a held item presses in, scaled by the motion intensity.
  "[--_press:calc(1_-_0.03_*_var(--ow-motion-scale))]",
  // Box. A layer like the thumb's, so both snap to device pixels alike and the thumb's gaps to
  // the track stay even at a fractional zoom.
  "relative isolate inline-flex gap-[2px] box-border p-(--_inset)",
  "rounded-[calc(var(--_radius)_+_var(--_inset))] bg-(color:--_track) align-middle",
  "will-change-transform",
  "data-[orientation=vertical]:flex-col",
  // Glide's highlight takes the items' corners.
  "[&>[data-slot=glide]]:[--_radius:max(0px,var(--ow-radius)_-_4px)]",
  // Equal columns: the widest item's width each, or equal shares once the group is stretched.
  "data-equal:inline-grid data-equal:auto-cols-[minmax(0,1fr)] data-equal:grid-flow-col",
  "data-equal:data-[orientation=vertical]:auto-rows-[minmax(0,1fr)]",
  "data-equal:data-[orientation=vertical]:grid-flow-row",
  // The track's edge shows.
  "forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-transparent",
];

const sizeStyles = {
  sm: "text-[13px]",
  md: "text-[14px]",
  lg: "text-[16px]",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The group's classes. */
export function toggleGroupVariants({ size }: ToggleGroupVariantProps = {}): string {
  return cn(variants({ size }));
}

// The thumb reaches out to the track's edges and keeps the track's padding as a clear border. Its
// edges then round to the same pixels as the track's, and both border widths round alike, so it
// sits as far from the track above as below at any zoom. thumb.ts lays it out on the pressed
// item's box (--_x, --_y, --_w, --_h) and slides it there by --_dx, --_dy, --_sx, --_sy, which end
// at none; its key (the ::before) stretches along the travel.
const thumb = [
  "absolute -z-1 box-border",
  // Physical edges: the script measures them.
  "top-[calc(var(--_y,0px)_-_var(--_inset))] left-[calc(var(--_x,0px)_-_var(--_inset))]",
  "w-[calc(var(--_w,0px)_+_2_*_var(--_inset))] h-[calc(var(--_h,0px)_+_2_*_var(--_inset))]",
  "border-(length:--_inset) border-solid border-transparent",
  "rounded-[calc(var(--_radius)_+_var(--_inset))] opacity-0 pointer-events-none",
  "[translate:var(--_dx,0)_var(--_dy,0)] transform-[scale(var(--_sx,1),var(--_sy,1))]",
  // Its own layer, so it lands without a pixel jump. It travels on the travel spring and scales
  // on the settle spring.
  "will-change-[translate,transform,scale] transition-[translate,transform,scale,opacity]",
  "duration-[var(--ow-spring-travel-duration),var(--ow-spring-travel-duration),var(--ow-spring-settle-duration),150ms]",
  "ease-[var(--ow-spring-travel),var(--ow-spring-travel),var(--ow-spring-settle),ease]",
  // The key, inside the clear border.
  "before:absolute before:content-[''] before:inset-0 before:rounded-(--_radius)",
  "before:bg-(color:--_thumb) before:will-change-transform",
  "data-visible:opacity-100",
  // Pressed in quickly, released with the settle spring.
  "data-held:scale-(--_press)",
  "data-held:duration-[var(--ow-spring-travel-duration),var(--ow-spring-travel-duration),90ms,150ms]",
  "data-held:ease-[var(--ow-spring-travel),var(--ow-spring-travel),var(--ow-ease-out),ease]",
  // The thumb does not slide or press; it only fades. A held item dims instead.
  "motion-reduce:scale-none motion-reduce:data-held:scale-none",
  "motion-reduce:transition-[opacity] motion-reduce:duration-150 motion-reduce:ease-[ease]",
  "motion-reduce:data-held:duration-150 motion-reduce:data-held:ease-[ease]",
  "motion-reduce:data-held:data-visible:opacity-80",
  // The label turns as the fill arrives, so the fill does not travel.
  "forced-colors:before:forced-color-adjust-none forced-colors:before:bg-[Highlight]",
  "forced-colors:not-data-held:transition-[opacity] forced-colors:not-data-held:duration-150",
  "forced-colors:not-data-held:ease-[ease]",
  // The first placement and every jump: nothing transitions.
  "data-instant:[transition:none] forced-colors:data-instant:[transition:none]",
];

// The group is 40px tall: the item, 32px, inside the inset.
const item = [
  "[--py:0.5179em] [--_py:max(var(--py),(24px_-_1lh)_/_2)]",
  "[--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)] [--icon:calc(1em_+_2px)]",
  "group-data-[size=sm]/ow-toggle-group:[--py:0.3em]",
  "group-data-[size=lg]/ow-toggle-group:[--py:0.625em]",
  // Box. An icon alone is shorter than a line: the item keeps the height of the others.
  "relative isolate inline-flex items-center justify-center gap-[0.5em] box-border min-w-0 m-0",
  "py-(--_py) px-(--px) min-h-[calc(2_*_var(--_py)_+_1lh)] border-0 rounded-(--_radius)",
  // Invisible here, the item's edge in forced colors.
  "outline-1 -outline-offset-1 outline-transparent bg-transparent",
  // Type.
  "text-(color:--_muted) leading-[1.25] whitespace-nowrap",
  "cursor-pointer touch-manipulation will-change-[scale]",
  "transition-[color,scale] duration-[150ms,var(--ow-spring-settle-duration)]",
  "ease-[ease,var(--ow-spring-settle)]",
  // Lit by Glide, or pressed: the text color; pressed, the accent leaning toward it.
  "data-glide-active:not-data-pressed:text-(color:--_fg) data-pressed:text-(color:--_on)",
  // A pressed item as a key of its own: with multiple selection, and before the script places the
  // thumb (server-rendered HTML). It changes with the state, at once.
  "group-not-data-thumb/ow-toggle-group:data-pressed:bg-(color:--_key)",
  "group-data-multiple/ow-toggle-group:data-pressed:bg-(color:--_key)",
  // A hovered key with multiple selection, which a click turns off: its fill moves 3% toward the
  // label color. The thumb is not an action, so it keeps its fill.
  "group-data-multiple/ow-toggle-group:data-glide-active:[--_key:color-mix(in_oklab,var(--_thumb),var(--_fg)_3%)]",
  "data-held:scale-(--_press) data-held:duration-[150ms,90ms] data-held:ease-[ease,var(--ow-ease-out)]",
  // Above its neighbors, so a raised one beside it never covers the ring.
  "focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-offset-2",
  "focus-visible:outline-(color:--_focus)",
  // Disabled is the last word on the text, also when pressed.
  "[--_dim:color-mix(in_oklab,var(--_muted)_50%,transparent)] disabled:cursor-not-allowed",
  "disabled:text-(color:--_dim) disabled:data-pressed:text-(color:--_dim)",
  // The icon is the font size plus 2px, as far from the edge as from the top. With both margins,
  // an item with only an icon is square.
  "[&>svg]:flex-none [&>svg]:size-(--icon)",
  "[&>svg:first-child]:ms-[calc((1cap_-_var(--icon))_/_2)]",
  "[&>svg:last-child]:me-[calc((1cap_-_var(--icon))_/_2)]",
  // No pressing in; the material still changes.
  "motion-reduce:scale-none motion-reduce:data-held:scale-none",
  "motion-reduce:transition-[color] motion-reduce:duration-150 motion-reduce:ease-[ease]",
  "motion-reduce:data-held:duration-150 motion-reduce:data-held:ease-[ease]",
  // The pressed items are filled with the system highlight, and a disabled one stays gray.
  "forced-colors:data-pressed:forced-color-adjust-none",
  "forced-colors:data-pressed:text-[HighlightText]",
  "forced-colors:group-not-data-thumb/ow-toggle-group:data-pressed:forced-color-adjust-none",
  "forced-colors:group-not-data-thumb/ow-toggle-group:data-pressed:bg-[Highlight]",
  "forced-colors:group-data-multiple/ow-toggle-group:data-pressed:forced-color-adjust-none",
  "forced-colors:group-data-multiple/ow-toggle-group:data-pressed:bg-[Highlight]",
  "forced-colors:focus-visible:outline-[Highlight] forced-colors:disabled:text-[GrayText]",
  "forced-colors:disabled:data-pressed:text-[GrayText]",
];

// Room for glyphs whose ink passes their advance (a monospace "m"), without changing the width.
const label = ["min-w-0 -mx-[0.125em] px-[0.125em] overflow-hidden text-ellipsis"];

/** The classes of the inner parts. */
export const toggleGroupSlots: Record<"thumb" | "item" | "label", string> = {
  thumb: thumb.join(" "),
  item: item.join(" "),
  label: label.join(" "),
};
