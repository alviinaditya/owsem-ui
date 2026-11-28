// The Tailwind CSS v4 twin of command-menu-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-reduced-transparency variant.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type CommandMenuSize = "sm" | "md" | "lg";

export interface CommandMenuVariantProps {
  /** The type scale and row height: 13, 14, or 16px. @default "md" */
  size?: CommandMenuSize | undefined;
}

// The trigger: a search field, a tint of the text color, as tall as controls. A shortcut (a Kbd)
// goes to its end.
const trigger = [
  "[--_py:max(var(--py),(24px_-_1lh)_/_2)] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)] [--_bg:color-mix(in_oklab,var(--ow-fg)_6%,transparent)]",
  // Box.
  "inline-flex items-center gap-[0.5em] box-border min-w-0 py-(--_py) px-(--px) overflow-hidden",
  "border-0 rounded-(--ow-radius) bg-(color:--_bg)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--ow-muted) font-[family-name:inherit] font-[weight:inherit] text-start",
  "whitespace-nowrap",
  "cursor-pointer transition-[color] duration-150 ease-(--ow-ease-out)",
  // Hover deepens the tint.
  "pointer-fine:hover:[--_bg:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "pointer-fine:hover:text-(color:--ow-fg)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "[&>[data-slot=command-menu-shortcut]]:ms-auto",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  "forced-colors:focus-visible:outline-[Highlight]",
];

const triggerSizes = {
  sm: "[--py:0.6058em] text-[13px] leading-[1.25]",
  md: "[--py:0.8036em] text-[14px] leading-[1.25]",
  lg: "[--py:0.875em] text-[16px] leading-[1.25]",
};

const triggerVariants = cva(trigger, {
  variants: { size: triggerSizes },
  defaultVariants: { size: "md" },
});

/** The trigger's classes. */
export function commandMenuTriggerVariants({ size }: CommandMenuVariantProps = {}): string {
  return cn(triggerVariants({ size }));
}

// The glass panel: the raised fill at 80% over a blur of the page, with the popup's shadow. One
// radius outside; the items follow its curve, less --_p. The width is a default: set a width on the
// Popup to change it. --_n is the items' --py in em, per size; the field and labels line up with
// the items from it.
const popup = [
  "[--_p:6px] [--_radius:max(0px,var(--ow-radius)_-_var(--_p))] [--_solid:var(--ow-raised-bg)]",
  "[--_glass:color-mix(in_oklab,var(--_solid)_80%,transparent)] [--_blur:24px]",
  "[--_bg:var(--_solid)] [--_shadow:var(--ow-popup-shadow)]",
  // Box.
  "relative flex flex-col w-[min(100%,560px)] max-h-[min(100%,32rem)] box-border",
  "rounded-(--ow-radius) outline-1 -outline-offset-1 outline-transparent bg-(color:--_bg)",
  "shadow-(shadow:--_shadow) text-(color:--ow-fg)",
  // Opens and closes as a Dialog does: a fade and a small grow from its middle, 250 ms in and
  // 200 ms out. Its own layer, so it lands without a pixel jump.
  "will-change-transform transition-[opacity,transform] duration-250 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-starting-style:transform-[scale(calc(1_-_0.04_*_var(--ow-motion-scale)))]",
  "data-ending-style:opacity-0 data-ending-style:transform-[scale(calc(1_-_0.04_*_var(--ow-motion-scale)))]",
  "data-ending-style:duration-200 motion-reduce:data-starting-style:transform-none",
  "motion-reduce:data-ending-style:transform-none",
  // Glass where the browser can blur; opaque for those who ask for less transparency.
  "supports-[backdrop-filter:blur(1px)]:[--_bg:var(--_glass)]",
  "supports-[backdrop-filter:blur(1px)]:backdrop-blur-(--_blur)",
  "supports-[backdrop-filter:blur(1px)]:backdrop-saturate-[1.6]",
  "supports-[backdrop-filter:blur(1px)]:ow-reduced-transparency:[--_bg:var(--_solid)]",
  "supports-[backdrop-filter:blur(1px)]:ow-reduced-transparency:backdrop-filter-none",
  // More contrast asked for: a ring around the popup.
  "contrast-more:[--_shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
];

const popupSizes = {
  sm: "[--_n:0.6058] text-[13px] leading-[1.25]",
  md: "[--_n:0.8036] text-[14px] leading-[1.25]",
  lg: "[--_n:0.875] text-[16px] leading-[1.25]",
};

const popupVariants = cva(popup, {
  variants: { size: popupSizes },
  defaultVariants: { size: "md" },
});

/** The popup's classes. */
export function commandMenuPopupVariants({ size }: CommandMenuVariantProps = {}): string {
  return cn(popupVariants({ size }));
}

// The search icon, in the trigger and in the field: as far from the edge as from the top and bottom.
const icon = [
  "flex-none size-(--icon) first:ms-[calc((1cap_-_var(--icon))_/_2)]",
  "fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]",
];

// The scrim; with backdrop="blur" the page also blurs under it.
const backdrop = [
  "fixed inset-0 bg-(color:--ow-backdrop)",
  "transition-opacity duration-250 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-200",
  "supports-[backdrop-filter:blur(1px)]:data-blur:backdrop-blur-[8px]",
  "supports-[backdrop-filter:blur(1px)]:data-blur:ow-reduced-transparency:backdrop-filter-none",
];

// The popup hangs from the upper part of the screen, so its top stays put as results change.
const viewport = [
  "fixed inset-0 flex items-start justify-center box-border pt-[clamp(16px,12vh,120px)]",
  "px-[16px] pb-[16px]",
];

// The search row and the footer stand as tall as each other.
const bar = [
  "[--py:calc((var(--_n)_+_0.25)_*_1em)] [--_py:max(var(--py),(24px_-_1lh)_/_2)]",
  "flex flex-none items-center min-h-[1lh] py-(--_py) text-(color:--ow-muted)",
  "forced-colors:border-[color:CanvasText]",
];

// The search row, its icon and text in line with the items'. A hairline under it, as over the
// footer; the input always has focus while the menu is open, so its caret shows it.
const field = [
  ...bar,
  "[--icon:calc(1em_+_2px)] gap-[0.5em]",
  "px-[calc(var(--_p)_+_max(var(--_n)_*_1em,(24px_-_1lh)_/_2)_+_(1lh_-_1cap)_/_2)]",
  "border-b border-(color:--ow-line)",
];

// One line tall: Firefox can make a text field taller, from the font's rounded metrics.
const input = [
  "flex-1 min-w-0 h-[1lh] p-0 border-0 outline-none bg-transparent text-(color:--ow-fg)",
  "[font:inherit] leading-[inherit] placeholder:text-(color:--ow-muted) placeholder:opacity-100",
];

// Shown only while focused: the way out for touch screen readers.
const close = [
  "absolute top-(--_p) end-(--_p) grid place-items-center size-[2em] p-0 border-0",
  "rounded-(--_radius) bg-transparent text-(color:--ow-muted)",
  "not-focus-visible:size-px not-focus-visible:overflow-hidden not-focus-visible:[clip-path:inset(50%)]",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "forced-colors:focus-visible:outline-[Highlight]",
  "[&_svg]:size-[calc(1em_+_2px)] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2",
  "[&_svg]:[stroke-linecap:round]",
];

// The results scroll inside the panel; Glide's highlight rides along, and takes the items' corners.
// An edge fades while there is more to scroll that way, by as much as has scrolled, up to 2em: List
// sets --_above and --_below as it scrolls.
const list = [
  "[--_thumb:color-mix(in_oklab,var(--ow-muted)_40%,transparent)] [--_above:0px] [--_below:0px]",
  "relative isolate flex-initial min-h-0 p-(--_p) overflow-y-auto overscroll-contain",
  "scroll-py-(--_p) outline-none",
  "[mask-image:linear-gradient(transparent,#000_min(var(--_above),2em),#000_calc(100%_-_min(var(--_below),2em)),transparent)]",
  "[&>[data-slot=glide]]:[--_radius:max(0px,var(--ow-radius)_-_6px)]",
  "data-empty:hidden",
  // A thin, quiet scrollbar without arrows: the standard properties here (Firefox)…
  "[scrollbar-width:thin] [scrollbar-color:var(--_thumb)_transparent]",
  // …and WebKit's pseudo-elements where the browser has them, which the standard ones would turn
  // off.
  "supports-[selector(::-webkit-scrollbar)]:[scrollbar-width:auto]",
  "supports-[selector(::-webkit-scrollbar)]:[scrollbar-color:auto]",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar]:w-[10px]",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-track]:bg-none",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:border-[3px]",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:border-solid",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:border-transparent",
  // A pill, whatever the theme's radius.
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:rounded-[999px]",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:bg-(--_thumb)",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:bg-clip-padding",
];

const empty = [
  "not-empty:py-[2.25em] not-empty:px-[1em] not-empty:text-(color:--ow-muted) not-empty:text-center",
];

// The first group's name sits closer to the top.
const group = ["group/ow-command-menu-group"];

// A group's name in capitals, as Sidebar's group label, in line with its items' icons.
const groupLabel = [
  "pt-[0.6em] pb-[0.3em] px-[calc((var(--_n)_+_0.125)_/_0.857_*_1em_-_1px)]",
  "text-(color:--ow-muted) text-[0.857em] font-medium",
  "tracking-[0.06em] uppercase",
  "group-first/ow-command-menu-group:pt-[0.3em]",
];

const item = [
  "group/ow-command-menu-item",
  "[--py:calc(var(--_n)_*_1em)] [--_py:max(var(--py),(24px_-_1lh)_/_2)]",
  "[--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)] [--icon:calc(1em_+_2px)]",
  "flex items-center gap-[0.5em] box-border py-(--_py) px-(--px) rounded-(--_radius)",
  "text-(color:--ow-fg) cursor-default outline-none",
  "data-disabled:opacity-50 forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
  "[&>[data-slot=command-menu-shortcut]]:ms-auto",
];

const itemIcon = [
  "inline-flex flex-none size-(--icon) ms-[calc((1cap_-_var(--icon))_/_2)] text-(color:--ow-muted)",
  "group-data-highlighted/ow-command-menu-item:group-not-data-disabled/ow-command-menu-item:text-(color:--ow-fg)",
  "[&>svg]:size-full",
];

// One line each; the description takes what the label leaves, so it gives way first.
const itemLabel = ["flex-initial min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"];

const itemDescription = [
  "flex-[1_1_0] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-(color:--ow-muted)",
];

// Past a hairline. Its hints start where group names do.
const footer = [
  ...bar,
  "flex-wrap gap-x-[1em] gap-y-[0.5em] px-[calc(var(--_p)_+_(var(--_n)_+_0.125)_*_1em_-_1px)]",
  "border-t border-(color:--ow-line)",
  "[&>*]:inline-flex [&>*]:items-center [&>*]:gap-[0.4em] [&>*]:text-[0.857em]",
];

/** The classes of the other parts. */
export const commandMenuSlots: Record<
  | "icon"
  | "backdrop"
  | "viewport"
  | "close"
  | "field"
  | "input"
  | "list"
  | "empty"
  | "group"
  | "groupLabel"
  | "item"
  | "itemIcon"
  | "itemLabel"
  | "itemDescription"
  | "shortcut"
  | "footer",
  string
> = {
  icon: icon.join(" "),
  backdrop: backdrop.join(" "),
  viewport: viewport.join(" "),
  close: close.join(" "),
  field: field.join(" "),
  input: input.join(" "),
  list: list.join(" "),
  empty: empty.join(" "),
  group: group.join(" "),
  groupLabel: groupLabel.join(" "),
  item: item.join(" "),
  itemIcon: itemIcon.join(" "),
  itemLabel: itemLabel.join(" "),
  itemDescription: itemDescription.join(" "),
  shortcut: "",
  footer: footer.join(" "),
};
