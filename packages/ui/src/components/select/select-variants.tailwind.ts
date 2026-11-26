// The Tailwind CSS v4 twin of select-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-input-invalid variant and the
// ow-select-shake and ow-select-blink keyframes.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectVariantProps {
  /** The trigger's and the items' type scale: 13, 14, or 16px. @default "md" */
  size?: SelectSize | undefined;
}

// A field that opens a list. The trigger is the Field material: a 6% tint of the text color with no
// shadow and no edge, as tall as a Button. It has no width of its own: it fits its value, and
// stretches when you set one. The block padding never drops a target below 24px.
const trigger = [
  // The theme tokens it reads.
  "[--_bg:color-mix(in_oklab,var(--ow-fg)_6%,transparent)] [--_fg:var(--ow-fg)]",
  "[--_focus:var(--ow-focus)] [--_critical:var(--ow-critical)]",
  "[--_py:max(var(--py),(24px_-_1lh)_/_2)] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)]",
  // Box.
  "inline-flex items-center gap-[0.5em] box-border max-w-full m-0 py-(--_py) px-(--px)",
  "border-0 rounded-(--ow-radius) bg-(color:--_bg) align-middle",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg) font-[family-name:inherit] font-[weight:inherit] text-start",
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent]",
  // The tint deepens on hover and while open, and turns critical when invalid.
  "pointer-fine:hover:not-data-disabled:not-disabled:not-ow-input-invalid:[--_bg:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "data-popup-open:not-ow-input-invalid:[--_bg:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "ow-input-invalid:[--_bg:color-mix(in_oklab,var(--_critical)_14%,transparent)]",
  // Rejects once when it becomes invalid. data-armed is set while it is valid (core/shake.ts), so a
  // field invalid from the start stays still; a Form re-plays it with data-shake="off" (a reflow).
  "ow-input-invalid:data-armed:not-data-[shake=off]:will-change-transform",
  "ow-input-invalid:data-armed:not-data-[shake=off]:animate-[ow-select-shake_320ms_var(--ow-ease-out)]",
  "motion-reduce:ow-input-invalid:data-armed:not-data-[shake=off]:animate-[ow-select-blink_160ms_var(--ow-ease-out)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
  // More contrast asked for: the edge comes back.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  // Forced colors: the ring takes the system color, and a disabled field stays gray.
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

const triggerSizes = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

const triggerVariants = cva(trigger, {
  variants: { size: triggerSizes },
  defaultVariants: { size: "md" },
});

/** The trigger's classes. */
export function selectTriggerVariants({ size }: SelectVariantProps = {}): string {
  return cn(triggerVariants({ size }));
}

// The popup is a raised fill with the popup shadow; Glide lights the item nearest the pointer or
// the one the keyboard reached. At sm the items' --py is the trigger's, so their inline padding
// gives up the popup's padding, and the text still lands on the trigger's.
const popup = [
  "group/ow-select-popup",
  // The theme tokens it reads.
  "[--_bg:var(--ow-raised-bg)] [--_popup-shadow:var(--ow-popup-shadow)] [--_fg:var(--ow-fg)]",
  "[--_pad:4px]",
  // One radius outside; the items follow its curve, less the padding.
  "[--_inner:max(0px,var(--ow-radius)_-_var(--_pad))]",
  // Box. A height set on it reaches the list, which scrolls. As wide as the trigger, and wider
  // only when an item would not fit, so no text is cut; the room Base UI leaves at the screen's
  // sides.
  "relative flex flex-col box-border min-w-(--anchor-width) max-w-[calc(100vw_-_10px)] overflow-hidden",
  "rounded-(--ow-radius) bg-(color:--_bg) shadow-(shadow:--_popup-shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg)",
  // Over the trigger, the selected text lands on the trigger's and the check sits at the end, where
  // the trigger's icon is, so the popup covers the trigger at its width. The text starts --_pad
  // plus --_py-less past the trigger's, so the popup is that much wider to end where it ends.
  "data-[side=none]:min-w-[calc(var(--anchor-width)_+_var(--_pad)_+_var(--_py-less))]",
  // Beside the trigger, it grows from it. Over the trigger, it only fades: growing would move the
  // text that is meant to stay put, and the layer growing needs lands that text a device pixel off
  // the trigger's at a fractional zoom.
  "transition-[opacity] duration-180 ease-(--ow-ease-out)",
  "not-data-[side=none]:origin-(--transform-origin) not-data-[side=none]:will-change-transform",
  "not-data-[side=none]:transition-[opacity,transform]",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
  "motion-safe:not-data-[side=none]:data-starting-style:transform-[scale(0.96)]",
  "motion-safe:not-data-[side=none]:data-ending-style:transform-[scale(0.96)]",
  // Leaving is quicker than arriving, after a beat that lets a pick's check land.
  "data-ending-style:duration-140 data-ending-style:delay-60",
  // Used from the keyboard, or shut with Escape: no animation.
  "data-instant:[transition:none]",
  // More contrast asked for: a ring around the popup.
  "contrast-more:[--_popup-shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
];

const popupSizes = {
  sm: "[--_py-less:calc(-1_*_var(--_pad))] text-[0.8125rem] leading-[1.25]",
  md: "[--_py-less:-0.25em] text-[0.875rem] leading-[1.25]",
  lg: "[--_py-less:-0.25em] text-[1rem] leading-[1.25]",
};

const popupVariants = cva(popup, {
  variants: { size: popupSizes },
  defaultVariants: { size: "md" },
});

/** The popup's classes. */
export function selectPopupVariants({ size }: SelectVariantProps = {}): string {
  return cn(popupVariants({ size }));
}

// Its padding, not a margin, sets it apart from the trigger below.
const label = [
  "[--_fg:var(--ow-fg)] block pb-[0.375em] text-(color:--_fg) text-[0.875rem] font-medium",
  "leading-[1.25]",
];

// A modal select's backdrop: clear, it takes a press outside, so that press only shuts it.
const backdrop = ["fixed inset-0"];

// It takes the room there is, so the icon stays at the end; empty, it still holds a line.
const value = [
  "[--_muted:var(--ow-muted)] block flex-auto min-w-0 min-h-[1lh] overflow-hidden text-ellipsis",
  "whitespace-nowrap data-placeholder:text-(color:--_muted)",
];

// As far from the edge as from the top and bottom.
const icon = [
  "[--_muted:var(--ow-muted)] inline-flex flex-none size-(--icon) me-[calc((1cap_-_var(--icon))_/_2)]",
  "text-(color:--_muted) [&>:where(svg)]:size-full",
];

// Strips over the list's ends, inside the popup's edge.
const scrollArrow = [
  "[--icon:calc(1em_+_2px)] [--_bg:var(--ow-raised-bg)] [--_muted:var(--ow-muted)]",
  // The popup's corners, less the edge.
  "[--_corner:calc(var(--ow-radius)_-_1px)]",
  "z-1 flex items-center justify-center inset-x-px h-[24px] bg-(color:--_bg) text-(color:--_muted)",
  "cursor-default [&>svg]:size-(--icon)",
];

const scrollUpArrow = [...scrollArrow, "top-px rounded-ss-(--_corner) rounded-se-(--_corner)"];
const scrollDownArrow = [...scrollArrow, "bottom-px rounded-es-(--_corner) rounded-ee-(--_corner)"];

// The scrolling list holds Glide's highlight, so it scrolls with the items, and the highlight takes
// their corners. The keyboard's item stays clear of the scroll arrows. The last two lines are
// Base UI's rule for a list with arrows, for apps that turn style elements off.
const list = [
  "relative isolate flex-auto box-border min-h-0 max-h-(--available-height) p-(--_pad)",
  "overflow-y-auto overscroll-contain scroll-py-[24px]",
  "[&>[data-slot=glide]]:[--_radius:var(--_inner)]",
  "[&.base-ui-disable-scrollbar]:[scrollbar-width:none]",
  "[&.base-ui-disable-scrollbar::-webkit-scrollbar]:hidden",
];

// Items: Button's geometry rule, --py the only input; the indicator first.
const item = [
  "[--py:0.5536em] [--_py:max(var(--py),(24px_-_1lh)_/_2)] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)] [--_fg:var(--ow-fg)] [--_focus:var(--ow-focus)]",
  "group-data-[size=sm]/ow-select-popup:[--py:0.6058em]",
  "group-data-[size=sm]/ow-select-popup:px-[calc(var(--px)_-_var(--_pad))]",
  // 40px at lg, so the popup covers the 48px trigger even with its first item selected.
  "group-data-[size=lg]/ow-select-popup:[--py:0.625em]",
  // Box.
  "flex items-center gap-[0.5em] box-border py-(--_py) px-(--px) rounded-(--_inner)",
  // Type.
  "text-(color:--_fg) whitespace-nowrap cursor-default",
  // A 2px ring, inside the item so the popup does not clip it.
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2",
  "focus-visible:outline-(color:--_focus)",
  "data-disabled:opacity-45",
  // Icons sit as far from the edge as from the top and bottom.
  "[&>:where(svg)]:inline-flex [&>:where(svg)]:flex-none [&>:where(svg)]:size-(--icon)",
  "[&>:where(svg:first-child)]:ms-[calc((1cap_-_var(--icon))_/_2)]",
  "[&>:where(svg:last-child)]:me-[calc((1cap_-_var(--icon))_/_2)]",
  // Forced colors: the ring takes the system color, and a disabled item stays gray.
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

// Positioned, so axe reads its contrast over Glide's highlight.
const itemText = [
  "relative flex-auto min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
  // An icon among plain children, centered on the capitals as in a control.
  "[&>:where(svg)]:inline-block [&>:where(svg)]:size-(--icon) [&>:where(svg)]:me-[0.5em]",
  "[&>:where(svg)]:align-[calc((1cap_-_var(--icon))_/_2)]",
];

// Unselected, the indicator keeps its room, so the labels stay in line. A pick's check pops in on
// the settle spring.
const itemIndicator = [
  "inline-flex flex-none size-(--icon) first:ms-[calc((1cap_-_var(--icon))_/_2)]",
  "last:me-[calc((1cap_-_var(--icon))_/_2)] [&>:where(svg)]:size-full",
  "[&>*]:will-change-transform [&>*]:transition-[opacity,transform]",
  "[&>*]:duration-[120ms,var(--ow-spring-settle-duration)]",
  "[&>*]:ease-[var(--ow-ease-out),var(--ow-spring-settle)]",
  "not-data-selected:[&>*]:opacity-0",
  "not-data-selected:[&>*]:transform-[scale(calc(1_-_0.4_*_var(--ow-motion-scale)))]",
  "motion-reduce:not-data-selected:[&>*]:transform-none",
];

// A heading, not a choice: smaller than the items (12px of 14), in capitals with tracking, as
// Sidebar's group label. Their inline padding: the item's --px in its em.
const groupLabel = [
  "[--_muted:var(--ow-muted)] pt-[0.6em] pb-[0.3em] px-[calc((0.5em_+_(1.25em_-_1cap)_/_2)_/_0.8571)]",
  "text-(color:--_muted) text-[0.8571em] font-medium leading-[1.25]",
  "tracking-[0.06em] uppercase",
];

// A hairline, as a border for forced colors.
const separator = ["my-(--_pad) border-0 border-solid border-t border-(color:--ow-line)"];

/** The classes of the other parts. */
export const selectSlots: Record<
  | "backdrop"
  | "label"
  | "value"
  | "icon"
  | "positioner"
  | "scrollUpArrow"
  | "scrollDownArrow"
  | "list"
  | "item"
  | "itemText"
  | "itemIndicator"
  | "groupLabel"
  | "separator",
  string
> = {
  backdrop: backdrop.join(" "),
  label: label.join(" "),
  value: value.join(" "),
  icon: icon.join(" "),
  positioner: "",
  scrollUpArrow: scrollUpArrow.join(" "),
  scrollDownArrow: scrollDownArrow.join(" "),
  list: list.join(" "),
  item: item.join(" "),
  itemText: itemText.join(" "),
  itemIndicator: itemIndicator.join(" "),
  groupLabel: groupLabel.join(" "),
  separator: separator.join(" "),
};
