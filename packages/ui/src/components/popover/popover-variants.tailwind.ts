// The Tailwind CSS v4 twin of popover-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// The positioner only names the group the arrow reads its text direction from.
const positioner = ["group/ow-popover"];

// A floating panel on the raised fill with the popup shadow. It grows out of its trigger in 180 ms.
// The arrow reads --_bg and --_shadow from here.
const popup = [
  // The theme tokens it reads.
  "[--_bg:var(--ow-raised-bg)] [--_shadow:var(--ow-popup-shadow)] [--_fg:var(--ow-fg)]",
  "[--_muted:var(--ow-muted)]",
  // Box.
  "box-border max-w-(--available-width) p-[16px] rounded-(--ow-radius)",
  "bg-(color:--_bg) shadow-(shadow:--_shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg) text-[0.875rem] leading-[1.5]",
  // Grows out of the trigger, and has its own layer so it lands without a pixel jump.
  "origin-(--transform-origin) will-change-transform",
  "transition-[opacity,transform] duration-180 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-starting-style:transform-[scale(0.96)]",
  "data-ending-style:opacity-0 data-ending-style:transform-[scale(0.96)]",
  // Leaving is quicker than arriving.
  "data-ending-style:duration-120",
  // Opened from the keyboard, or shut with Escape: no animation.
  "data-instant:[transition:none]",
  // More contrast asked for: a ring around the popup and its arrow.
  "contrast-more:[--_shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
  // It fades, without growing.
  "motion-reduce:data-starting-style:transform-none motion-reduce:data-ending-style:transform-none",
];

const title = ["m-0 text-[1em] font-semibold leading-[1.4]"];

const description = [
  "m-0 text-(color:--_muted)",
  // A description stays close to its title.
  "[[data-slot=popover-title]+&]:mt-[4px]",
];

// A 14px box centered on the popup's edge; its outer half shows a square turned 45 degrees with
// the popup's surface and shadow, so its edges are the panel's (in dark, a light line). The visible
// half reaches 1px into the popup at the middle, over the panel's inner line, so the arrow opens
// into the panel. Base UI centers it on the trigger with top or left and places it with physical
// sides.
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
  "group-[[dir=rtl]]/ow-popover:data-[side=inline-start]:transform-[scaleX(-1)]",
  "group-[[dir=rtl]]/ow-popover:data-[side=inline-end]:transform-[scaleX(-1)]",
];

/** The classes of the parts. */
export const popoverSlots: Record<
  "positioner" | "popup" | "arrow" | "title" | "description",
  string
> = {
  positioner: positioner.join(" "),
  popup: popup.join(" "),
  arrow: arrow.join(" "),
  title: title.join(" "),
  description: description.join(" "),
};
