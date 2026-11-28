// The Tailwind CSS v4 twin of menu-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type MenuSize = "sm" | "md" | "lg";

export interface MenuVariantProps {
  /** The items' type scale: 13, 14, or 16px. @default "md" */
  size?: MenuSize | undefined;
}

// A modal menu's backdrop: clear, it takes a press outside, so that press only shuts the menu.
const backdrop = ["fixed inset-0"];

// The chevron of a submenu trigger mirrors where the text runs right to left.
const positioner = ["group/ow-menu-positioner"];

// A popup list of actions on the raised fill with the popup shadow. Items are flat; Glide lights
// the one nearest the pointer, or the one the keyboard reached. It fades in and grows from its
// trigger in 180 ms.
const popup = [
  "group/ow-menu-popup",
  // The theme tokens it reads.
  "[--_bg:var(--ow-raised-bg)] [--_shadow:var(--ow-popup-shadow)] [--_fg:var(--ow-fg)]",
  "[--_muted:var(--ow-muted)]",
  // The highlight, as Glide's, for an item whose submenu is open.
  "[--_highlight:var(--ow-hover)] [--_pad:4px]",
  // One radius outside; the items inside follow its curve, less the padding.
  "[--_inner:max(0px,var(--ow-radius)_-_var(--_pad))]",
  // Box. It only clips: a scrollbar on a rounded box draws square (Chrome), so the viewport scrolls.
  "box-border flex flex-col min-w-[10rem] max-h-(--available-height) overflow-clip",
  "rounded-(--ow-radius) bg-(color:--_bg) shadow-(shadow:--_shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg)",
  // Grows out of its trigger, and has its own layer so it lands without a pixel jump.
  "origin-(--transform-origin) will-change-transform",
  "transition-[opacity,transform] duration-180 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-starting-style:transform-[scale(0.96)]",
  "data-ending-style:opacity-0 data-ending-style:transform-[scale(0.96)]",
  // Leaving is quicker than arriving.
  "data-ending-style:duration-120",
  // Opened from the keyboard, or shut with Escape: no animation.
  "data-instant:[transition:none]",
  // It fades, without growing.
  "motion-reduce:data-starting-style:transform-none motion-reduce:data-ending-style:transform-none",
  // More contrast asked for: a ring around the popup.
  "contrast-more:[--_shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
];

const sizeStyles = {
  sm: "text-[0.8125rem] leading-[1.25]",
  md: "text-[0.875rem] leading-[1.25]",
  lg: "text-[1rem] leading-[1.25]",
};

const variants = cva(popup, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The popup's classes. */
export function menuPopupVariants({ size }: MenuVariantProps = {}): string {
  return cn(variants({ size }));
}

// The popup only clips, so this scrolls. It holds Glide's highlight, which takes the items'
// corners.
const viewport = [
  "relative isolate flex-auto box-border min-h-0 p-(--_pad) overflow-y-auto overscroll-contain",
  "[&>[data-slot=glide]]:[--_radius:var(--_inner)]",
];

// Items: Button's geometry rule, --py the only input; an icon or indicator first.
const item = [
  "[--py:0.5em] [--_py:max(var(--py),(24px_-_1lh)_/_2)] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)]",
  // Box.
  "flex items-center gap-[0.5em] box-border py-(--_py) px-(--px) rounded-(--_inner)",
  // Type.
  "text-(color:--_fg) no-underline whitespace-nowrap cursor-default",
  // The item whose submenu is open stays lit while the pointer is in the submenu.
  "group-[:not(:hover)]/ow-menu-popup:data-popup-open:bg-(color:--_highlight)",
  // A 2px ring, inside the item so the popup does not clip it.
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2",
  "focus-visible:outline-(color:--ow-focus)",
  "data-disabled:opacity-45",
  // Icons sit as far from the edge as from the top and bottom.
  "[&>svg]:inline-flex [&>svg]:flex-none [&>svg]:size-(--icon)",
  "[&>svg:first-child]:ms-[calc((1cap_-_var(--icon))_/_2)]",
  // A shortcut (<kbd>) at the end, muted, whatever the app's kbd style.
  "[&>kbd]:ms-auto [&>kbd]:inline [&>kbd]:p-0 [&>kbd]:ps-[1.5em] [&>kbd]:border-0",
  "[&>kbd]:bg-transparent [&>kbd]:bg-none [&>kbd]:text-(color:--_muted) [&>kbd]:[font:inherit]",
  "[&>kbd]:tracking-[0.04em]",
  // Forced colors: the ring and a disabled item take system colors.
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

// Unchecked, it keeps its room, so the labels stay in line. A check pops in on the settle spring,
// as Select's.
const indicator = [
  "inline-flex flex-none size-(--icon) first:ms-[calc((1cap_-_var(--icon))_/_2)]",
  "[&>svg]:size-full",
  "[&>*]:will-change-transform [&>*]:transition-[opacity,transform]",
  "[&>*]:duration-[120ms,var(--ow-spring-settle-duration)]",
  "[&>*]:ease-[var(--ow-ease-out),var(--ow-spring-settle)]",
  "data-unchecked:[&>*]:opacity-0",
  "data-unchecked:[&>*]:transform-[scale(calc(1_-_0.4_*_var(--ow-motion-scale)))]",
  "motion-reduce:data-unchecked:[&>*]:transform-none",
];

// The submenu's chevron, muted, at the end.
const chevron = [
  "inline-flex flex-none size-(--icon) ms-auto me-[calc((1cap_-_var(--icon))_/_2)]",
  "text-(color:--_muted) [&>svg]:size-full",
  "group-[[dir=rtl]]/ow-menu-positioner:transform-[scaleX(-1)]",
];

// A heading, not a choice: smaller than the items (12px of 14), in capitals with tracking, as
// Sidebar's group label. Their inline padding: the item's --px in its em.
const groupLabel = [
  "pt-[0.6em] pb-[0.3em] px-[calc((0.5em_+_(1.25em_-_1cap)_/_2)_/_0.8571)]",
  "text-(color:--_muted) text-[0.8571em] font-medium leading-[1.25]",
  "tracking-[0.06em] uppercase",
];

// A hairline, as a border for forced colors.
const separator = ["my-(--_pad) border-0 border-solid border-t border-(color:--ow-line)"];

/** The classes of the other parts. */
export const menuSlots: Record<
  | "backdrop"
  | "positioner"
  | "viewport"
  | "item"
  | "indicator"
  | "chevron"
  | "groupLabel"
  | "separator",
  string
> = {
  backdrop: backdrop.join(" "),
  positioner: positioner.join(" "),
  viewport: viewport.join(" "),
  item: item.join(" "),
  indicator: indicator.join(" "),
  chevron: chevron.join(" "),
  groupLabel: groupLabel.join(" "),
  separator: separator.join(" "),
};
