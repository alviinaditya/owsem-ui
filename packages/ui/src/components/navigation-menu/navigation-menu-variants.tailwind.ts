// The Tailwind CSS v4 twin of navigation-menu-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type NavigationMenuSize = "sm" | "md" | "lg";

export interface NavigationMenuVariantProps {
  /**
   * Button's sizes: triggers and links in the list are 32, 40, or 48px tall, and the panel's type
   * follows. Set it on the Root; the panel in the portal reads it from there.
   * @default "md"
   */
  size?: NavigationMenuSize | undefined;
}

// Site navigation: a row of triggers and links, and one panel that holds the open item's content.
const root = ["block min-w-0 max-w-full text-(color:--ow-fg)"];

const rootSizes = {
  sm: "text-[0.8125rem] leading-[1.25]",
  md: "text-[0.875rem] leading-[1.25]",
  lg: "text-[1rem] leading-[1.25]",
};

const rootVariants = cva(root, {
  variants: { size: rootSizes },
  defaultVariants: { size: "md" },
});

/** The root's classes. */
export function navigationMenuVariants({ size }: NavigationMenuVariantProps = {}): string {
  return cn(rootVariants({ size }));
}

// It wraps on a narrow screen, so every trigger stays reachable without a side scroll.
const list = [
  "flex flex-wrap items-center gap-[2px] m-0 p-0 list-none",
  "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
];

// Triggers, and links in the list: Button's geometry, --py the only input. The open item's trigger,
// and the page the link is for, stay tinted.
const trigger = [
  "[--_py:max(var(--py),(24px_-_1lh)_/_2)] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--_hover:var(--ow-hover)] [--_open:var(--ow-pressed-bg)]",
  // Box.
  "inline-flex flex-none items-center justify-center gap-[0.25em] box-border m-0 py-(--_py) px-(--px)",
  "border-0 rounded-(--ow-radius)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "bg-transparent text-(color:--ow-fg) font-[family-name:inherit] font-medium leading-[1.25] no-underline",
  "whitespace-nowrap cursor-pointer touch-manipulation",
  "hover:not-data-disabled:bg-(color:--_hover)",
  "data-popup-open:not-data-disabled:bg-(color:--_open) data-pressed:not-data-disabled:bg-(color:--_open)",
  "data-active:not-data-disabled:bg-(color:--_open)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
  // Forced colors: the ring, the open trigger, and a disabled one take system colors.
  "forced-colors:focus-visible:outline-[Highlight] forced-colors:data-popup-open:outline-[Highlight]",
  "forced-colors:data-pressed:outline-[Highlight] forced-colors:data-active:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

const triggerSizes = {
  sm: "[--py:0.6058em]",
  md: "[--py:0.8036em]",
  lg: "[--py:0.875em]",
};

const triggerVariants = cva(trigger, {
  variants: { size: triggerSizes },
  defaultVariants: { size: "md" },
});

/** A trigger's classes; a link in the list wears them too. */
export function navigationMenuTriggerVariants({ size }: NavigationMenuVariantProps = {}): string {
  return cn(triggerVariants({ size }));
}

// The popup is the panel: the raised fill with the popup shadow, sized by Base UI to the open
// content. The size is Base UI's own to animate; the rest is transform and opacity.
const popup = [
  // The theme tokens it reads.
  "[--_bg:var(--ow-raised-bg)] [--_shadow:var(--ow-popup-shadow)] [--_fg:var(--ow-fg)]",
  "[--_muted:var(--ow-muted)] [--_pad:8px]",
  // One radius outside; the links inside follow its curve, less the padding.
  "[--_inner:max(0px,var(--ow-radius)_-_var(--_pad))]",
  // Box.
  "relative box-border w-(--popup-width) h-(--popup-height) max-h-(--available-height)",
  "rounded-(--ow-radius) bg-(color:--_bg) shadow-(shadow:--_shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg)",
  // Grows out of the open trigger, and has its own layer so it lands without a pixel jump.
  "origin-(--transform-origin) will-change-transform",
  "[transition:opacity_180ms_var(--ow-ease-out),transform_180ms_var(--ow-ease-out),inline-size_320ms_var(--ow-ease-out),block-size_320ms_var(--ow-ease-out)]",
  "data-starting-style:opacity-0 data-starting-style:transform-[scale(0.96)]",
  "data-ending-style:opacity-0 data-ending-style:transform-[scale(0.96)]",
  // Leaving is quicker than arriving.
  "data-ending-style:[transition-duration:120ms]",
  // Opened from the keyboard, or shut with Escape: no animation.
  "data-instant:[transition:none]",
  // More contrast asked for: a ring around the panel and its arrow.
  "contrast-more:[--_shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
  // It fades, without growing, and takes a new size at once.
  "motion-reduce:data-starting-style:transform-none motion-reduce:data-ending-style:transform-none",
  "motion-reduce:[transition:opacity_180ms_var(--ow-ease-out)]",
];

const popupSizes = {
  sm: "text-[0.8125rem] leading-[1.25]",
  md: "text-[0.875rem] leading-[1.25]",
  lg: "text-[1rem] leading-[1.25]",
};

const popupVariants = cva(popup, {
  variants: { size: popupSizes },
  defaultVariants: { size: "md" },
});

/** The popup's classes. */
export function navigationMenuPopupVariants({ size }: NavigationMenuVariantProps = {}): string {
  return cn(popupVariants({ size }));
}

// The chevron: the font size plus 2px, turned over while its panel is open.
const icon = [
  "inline-flex flex-none size-[calc(1em_+_2px)] [transition:transform_200ms_var(--ow-ease-out)]",
  "will-change-transform",
  "[&>svg]:size-full data-popup-open:transform-[rotate(180deg)] motion-reduce:transition-none",
];

// An optional backdrop under the panel: clear, it only takes presses.
const backdrop = ["fixed inset-0"];

// Base UI sizes the positioner to the open content and moves it to the open trigger; these
// transitions let that glide. The pseudo element bridges the gap to the trigger, so the pointer can
// travel into the panel.
const positioner = [
  "group/ow-navigation-menu",
  "w-(--positioner-width) h-(--positioner-height) max-w-(--available-width)",
  "transition-[top,left,right,bottom] duration-320 ease-(--ow-ease-out)",
  "data-instant:[transition:none] motion-reduce:[transition:none]",
  "before:absolute before:inset-x-0 before:h-[12px] before:content-['']",
  "data-[side=bottom]:before:-top-[12px] data-[side=top]:before:-bottom-[12px]",
];

// The shared viewport clips the contents as they slide.
const viewport = ["relative size-full overflow-hidden rounded-[inherit]"];

// A content takes the size of what it holds, up to the window's width. It slides in from the side
// of the trigger it came from and out toward the other, on transform and opacity; where it is too
// tall for the window, it scrolls. Glide's highlight takes the links' corners.
const content = [
  "relative isolate box-border w-max max-w-(--available-width) max-h-(--available-height)",
  "p-(--_pad) overflow-y-auto overscroll-contain",
  // It keeps pace with the panel's 320 ms move on a symmetric curve; the one leaving fades on
  // ease-in, so it is still there as it moves, and the one arriving fades in after 60 ms.
  "[--_slide:cubic-bezier(0.4,0,0.2,1)]",
  "[transition:opacity_200ms_ease-out_60ms,translate_320ms_var(--_slide)]",
  "data-ending-style:[transition:opacity_140ms_ease-in,translate_320ms_var(--_slide)]",
  "will-change-[translate]",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
  "data-starting-style:data-[activation-direction=left]:translate-x-[-40%]",
  "data-ending-style:data-[activation-direction=right]:translate-x-[-40%]",
  "data-starting-style:data-[activation-direction=right]:translate-x-[40%]",
  "data-ending-style:data-[activation-direction=left]:translate-x-[40%]",
  "data-starting-style:data-[activation-direction=up]:translate-y-[-40%]",
  "data-ending-style:data-[activation-direction=down]:translate-y-[-40%]",
  "data-starting-style:data-[activation-direction=down]:translate-y-[40%]",
  "data-ending-style:data-[activation-direction=up]:translate-y-[40%]",
  // The contents fade without sliding.
  "motion-reduce:data-starting-style:data-[activation-direction]:translate-none",
  "motion-reduce:data-ending-style:data-[activation-direction]:translate-none",
  "[&>[data-slot=glide]]:[--_radius:var(--_inner)]",
];

// A link in a content: a title, then lines of text, flat; Glide lights the one under the pointer.
const link = [
  "grid gap-[2px] box-border px-[0.75em] py-[0.625em] rounded-(--_inner) outline-none",
  "text-(color:--_fg) no-underline cursor-pointer",
  "[&>:first-child]:font-medium [&>:not(:first-child)]:text-(color:--_muted)",
  "[&>:not(:first-child)]:text-[0.9286em]",
  "data-active:bg-(color:--ow-pressed-bg)",
  // A 2px ring, inside the link so the panel does not clip it.
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2",
  "focus-visible:outline-(color:--ow-focus)",
  "forced-colors:focus-visible:outline-[Highlight] forced-colors:data-active:outline-[Highlight]",
];

// An optional arrow toward the open trigger, in the panel's surface and shadow. Base UI centers it
// on the trigger and places it with physical sides.
const arrow = [
  // The half that shows when the arrow points right or left.
  "[--_right-half:polygon(50%_0,100%_0,100%_100%,50%_100%,50%_11px,calc(50%_-_1px)_11px,calc(50%_-_1px)_3px,50%_3px)]",
  "[--_left-half:polygon(0_0,50%_0,50%_3px,calc(50%_+_1px)_3px,calc(50%_+_1px)_11px,50%_11px,50%_100%,0_100%)]",
  "size-[14px]",
  // With the 1px ring outside it, the square's diagonal is the box: (7.9 + 2) × √2 = 14.
  "before:absolute before:inset-0 before:m-auto before:size-[7.9px] before:content-['']",
  // Invisible until forced colors draw it as the edge.
  "before:outline-1 before:outline-transparent",
  "before:bg-(color:--_bg) before:shadow-(shadow:--_shadow) before:transform-[rotate(45deg)]",
  "data-[side=top]:top-[calc(100%_-_7px)]",
  "data-[side=top]:[clip-path:polygon(0_50%,3px_50%,3px_calc(50%_-_1px),11px_calc(50%_-_1px),11px_50%,100%_50%,100%_100%,0_100%)]",
  "data-[side=bottom]:bottom-[calc(100%_-_7px)]",
  "data-[side=bottom]:[clip-path:polygon(0_0,100%_0,100%_50%,11px_50%,11px_calc(50%_+_1px),3px_calc(50%_+_1px),3px_50%,0_50%)]",
  "data-[side=left]:left-[calc(100%_-_7px)] data-[side=left]:[clip-path:var(--_right-half)]",
  "data-[side=right]:right-[calc(100%_-_7px)] data-[side=right]:[clip-path:var(--_left-half)]",
  // Logical sides: mirrored right to left.
  "data-[side=inline-start]:start-[calc(100%_-_7px)]",
  "data-[side=inline-start]:[clip-path:var(--_right-half)]",
  "data-[side=inline-end]:end-[calc(100%_-_7px)]",
  "data-[side=inline-end]:[clip-path:var(--_left-half)]",
  "group-[[dir=rtl]]/ow-navigation-menu:data-[side=inline-start]:transform-[scaleX(-1)]",
  "group-[[dir=rtl]]/ow-navigation-menu:data-[side=inline-end]:transform-[scaleX(-1)]",
];

/** The classes of the other parts. */
export const navigationMenuSlots: Record<
  "list" | "icon" | "backdrop" | "positioner" | "viewport" | "content" | "link" | "arrow",
  string
> = {
  list: list.join(" "),
  icon: icon.join(" "),
  backdrop: backdrop.join(" "),
  positioner: positioner.join(" "),
  viewport: viewport.join(" "),
  content: content.join(" "),
  link: link.join(" "),
  arrow: arrow.join(" "),
};
