// The Tailwind CSS v4 twin of tabs-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type TabsSize = "sm" | "md" | "lg";

export interface TabsListVariantProps {
  /** Font size and padding of the tabs. @default "md" */
  size?: TabsSize | undefined;
}

// The list above the panel, or beside it when vertical.
const root = ["flex flex-col gap-[0.75em] min-w-0", "data-[orientation=vertical]:flex-row"];

// The list is segmented, as in Toggle Group: a tint of the text color with no shadow. It is as big
// as its tabs, and no bigger than its parent: past that, it scrolls without a scrollbar. It is
// also Glide's container, so it holds the highlight behind the tabs (relative isolate).
const list = [
  "group/ow-tabs-list",
  "[--_well:color-mix(in_oklab,var(--ow-fg)_6%,transparent)]",
  // The tabs' and the indicator's radius: the well's, --ow-radius, less its padding.
  "[--_radius:max(0px,var(--ow-radius)_-_var(--_inset))] [--_inset:4px]",
  // How far a held tab presses in, scaled by the motion intensity.
  "[--_press:calc(1_-_0.03_*_var(--ow-motion-scale))]",
  // Box. A layer like the indicator's, so both snap to device pixels alike and its gaps to the
  // well stay even at a fractional zoom.
  "relative isolate flex gap-[2px] box-border w-fit max-w-full h-fit max-h-full p-(--_inset)",
  "rounded-[calc(var(--_radius)_+_var(--_inset))] bg-(color:--_well) will-change-transform",
  // The panel's height never squeezes the list out of the root.
  "shrink-0",
  // Past its parent it scrolls, and a tab brought in by focus keeps the well's gap to the edge.
  "overflow-x-auto overflow-y-hidden scroll-p-(--_inset) [scrollbar-width:none]",
  "data-[orientation=vertical]:flex-col data-[orientation=vertical]:overflow-x-hidden",
  "data-[orientation=vertical]:overflow-y-auto",
  // Glide's highlight takes the tabs' corners.
  "[&>[data-slot=glide]]:[--_radius:max(0px,var(--ow-radius)_-_4px)]",
  // The well's edge shows.
  "forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-transparent",
];

const sizeStyles = {
  sm: "text-[13px]",
  md: "text-[14px]",
  lg: "text-[16px]",
};

const variants = cva(list, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The list's classes. */
export function tabsListVariants({ size }: TabsListVariantProps = {}): string {
  return cn(variants({ size }));
}

// The indicator reaches out to the well's edges and keeps the well's padding as a clear border. Its
// edges then round to the same pixels as the well's, and both border widths round alike, so it sits
// as far from the well above as below at any zoom. thumb.ts lays it out on the active tab's box
// (--_x, --_y, --_w, --_h) and slides it there by --_dx, --_dy, --_sx, --_sy, which end at none; its
// key (the ::before) stretches along the travel.
const indicator = [
  // The accent over the list, opaque so the indicator hides nothing it should not.
  "[--_key:color-mix(in_oklab,var(--ow-accent)_14%,var(--ow-raised-bg))]",
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
  "before:bg-(color:--_key) before:will-change-transform",
  "data-visible:opacity-100",
  // Pressed in quickly, released with the settle spring.
  "data-held:scale-(--_press)",
  "data-held:duration-[var(--ow-spring-travel-duration),var(--ow-spring-travel-duration),90ms,150ms]",
  "data-held:ease-[var(--ow-spring-travel),var(--ow-spring-travel),var(--ow-ease-out),ease]",
  // The indicator does not slide or press; it only fades. A held tab dims instead.
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

// Each part reads its own tokens, so one set on a part changes that part and what is inside it.
// The list is 40px tall: the tab, 32px, inside the inset.
const tab = [
  "[--_fg:var(--ow-fg)] [--_muted:var(--ow-muted)] [--_focus:var(--ow-focus)]",
  // The accent text leans toward the text color, to read on its own tint in both themes.
  "[--_on:color-mix(in_oklab,var(--ow-accent)_70%,var(--ow-fg))]",
  "[--_key:color-mix(in_oklab,var(--ow-accent)_14%,var(--ow-raised-bg))]",
  "[--py:0.5179em] [--_py:max(var(--py),(24px_-_1lh)_/_2)]",
  "[--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)] [--icon:calc(1em_+_2px)]",
  "group-data-[size=sm]/ow-tabs-list:[--py:0.3em]",
  "group-data-[size=lg]/ow-tabs-list:[--py:0.625em]",
  // Box. An icon alone is shorter than a line: the tab keeps the height of the others.
  "relative isolate inline-flex flex-none items-center justify-center gap-[0.5em] box-border m-0",
  "py-(--_py) px-(--px) min-h-[calc(2_*_var(--_py)_+_1lh)] border-0 rounded-(--_radius)",
  "data-[orientation=vertical]:justify-start",
  // Invisible here, the tab's edge in forced colors.
  "outline-1 -outline-offset-1 outline-transparent bg-transparent",
  // Type.
  "text-(color:--_muted) leading-[1.25] whitespace-nowrap",
  "cursor-pointer touch-manipulation will-change-[scale]",
  "transition-[color,scale] duration-[150ms,var(--ow-spring-settle-duration)]",
  "ease-[ease,var(--ow-spring-settle)]",
  // Lit by Glide, or active: the text color; active, the accent leaning toward it.
  "data-glide-active:not-data-active:text-(color:--_fg) data-active:text-(color:--_on)",
  // The active tab as a key of its own before the script places the indicator (server HTML).
  "group-not-data-thumb/ow-tabs-list:data-active:bg-(color:--_key)",
  "data-held:scale-(--_press) data-held:duration-[150ms,90ms] data-held:ease-[ease,var(--ow-ease-out)]",
  // Inside the tab, so the scrolling list never cuts it.
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--_focus)",
  // Disabled is the last word on the text, also when active.
  "[--_dim:color-mix(in_oklab,var(--_muted)_50%,transparent)] data-disabled:cursor-not-allowed",
  "data-disabled:text-(color:--_dim) data-disabled:data-active:text-(color:--_dim)",
  // The icon is the font size plus 2px, as far from the edge as from the top. With both margins,
  // a tab with only an icon is square.
  "[&>:where(svg)]:flex-none [&>:where(svg)]:size-(--icon)",
  "[&>:where(svg:first-child)]:ms-[calc((1cap_-_var(--icon))_/_2)]",
  "[&>:where(svg:last-child)]:me-[calc((1cap_-_var(--icon))_/_2)]",
  // No pressing in; the material still changes.
  "motion-reduce:scale-none motion-reduce:data-held:scale-none",
  "motion-reduce:transition-[color] motion-reduce:duration-150 motion-reduce:ease-[ease]",
  "motion-reduce:data-held:duration-150 motion-reduce:data-held:ease-[ease]",
  // The active tab is filled with the system highlight, and a disabled one stays gray.
  "forced-colors:data-active:forced-color-adjust-none",
  "forced-colors:data-active:text-[HighlightText]",
  "forced-colors:group-not-data-thumb/ow-tabs-list:data-active:forced-color-adjust-none",
  "forced-colors:group-not-data-thumb/ow-tabs-list:data-active:bg-[Highlight]",
  "forced-colors:focus-visible:outline-[Highlight] forced-colors:data-disabled:text-[GrayText]",
  "forced-colors:data-disabled:data-active:text-[GrayText]",
];

// Room for glyphs whose ink passes their advance (a monospace "m"), without changing the width.
const label = ["min-w-0 -mx-[0.125em] px-[0.125em] overflow-hidden text-ellipsis"];

// No padding of its own: what it holds decides. Base UI keeps a panel a frame after its tab is
// left, for an exit animation; it has none, so it goes at once and two panels never stack.
const panel = [
  "[--_fg:var(--ow-fg)] [--_focus:var(--ow-focus)]",
  "flex-1 min-w-0 rounded-(--ow-radius) text-(color:--_fg)",
  "data-ending-style:hidden",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  "forced-colors:focus-visible:outline-[Highlight]",
];

/** The classes of the other parts. */
export const tabsSlots: Record<"root" | "indicator" | "tab" | "label" | "panel", string> = {
  root: root.join(" "),
  indicator: indicator.join(" "),
  tab: tab.join(" "),
  label: label.join(" "),
  panel: panel.join(" "),
};
