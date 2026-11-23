// Generated from components/tooltip by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of tooltip-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// The positioner only names the group the arrow reads its text direction from.
const positioner = ["group/ow-tooltip"];

// A short label on a solid dark surface, with no material. It grows out of its trigger in 125 ms.
const popup = [
  // The theme tokens it reads. One line is 24px tall.
  "[--_bg:var(--ow-tooltip-bg)] [--_fg:var(--ow-tooltip-fg)] [--_py:calc((24px_-_1lh)_/_2)]",
  "[--_px:8px] [--_radius:var(--ow-radius)]",
  // Box.
  "box-border max-w-[min(20rem,var(--available-width,20rem))] py-(--_py) px-(--_px)",
  "rounded-(--_radius) bg-(color:--_bg)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg) text-[0.8125rem] font-normal leading-[1.25] wrap-break-word",
  // Grows out of the trigger, and has its own layer so it lands without a pixel jump.
  "origin-(--transform-origin) will-change-transform",
  "transition-[opacity,transform] duration-125 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-starting-style:transform-[scale(0.97)]",
  "data-ending-style:opacity-0 data-ending-style:transform-[scale(0.97)]",
  // Leaving is quicker than arriving.
  "data-ending-style:duration-100",
  // Opened by focus, or next to an open one, or shut with Escape: no animation.
  "data-instant:[transition:none]",
  // A shortcut, such as <kbd>⌘B</kbd>, after the label, whatever the app's kbd style. Its chip is a
  // line tall, so at the end it sits as far from the edge as from the top and bottom, with corners
  // concentric with the popup's.
  "[&_kbd]:inline-block [&_kbd]:align-top [&_kbd]:ms-[0.5em] [&_kbd]:px-[0.3em] [&_kbd]:border-0",
  "[&_kbd]:rounded-[max(2px,var(--ow-radius)_-_var(--_py))]",
  "[&_kbd]:bg-[color-mix(in_oklab,var(--ow-tooltip-fg)_14%,transparent)]",
  "[&_kbd]:text-[color-mix(in_oklab,var(--ow-tooltip-fg)_80%,transparent)] [&_kbd]:[font:inherit]",
  "[&_kbd:last-child]:me-[calc(var(--_py)_-_var(--_px))]",
  // No animation at all.
  "motion-reduce:[transition:none]",
];

// A 12px box; the triangle fills the half next to the popup and overlaps it by 1px, so no seam
// shows. Base UI places the arrow with physical sides, and centers it with top or left.
const arrow = [
  "size-[12px] bg-(color:--_bg)",
  "data-[side=top]:top-[calc(100%_-_1px)] data-[side=top]:[clip-path:polygon(0_0,100%_0,50%_50%)]",
  "data-[side=bottom]:bottom-[calc(100%_-_1px)]",
  "data-[side=bottom]:[clip-path:polygon(50%_50%,100%_100%,0_100%)]",
  "data-[side=left]:left-[calc(100%_-_1px)] data-[side=left]:[clip-path:polygon(0_0,50%_50%,0_100%)]",
  "data-[side=right]:right-[calc(100%_-_1px)]",
  "data-[side=right]:[clip-path:polygon(100%_0,100%_100%,50%_50%)]",
  // Logical sides: mirrored right to left.
  "data-[side=inline-start]:start-[calc(100%_-_1px)]",
  "data-[side=inline-start]:[clip-path:polygon(0_0,50%_50%,0_100%)]",
  "data-[side=inline-end]:end-[calc(100%_-_1px)]",
  "data-[side=inline-end]:[clip-path:polygon(100%_0,100%_100%,50%_50%)]",
  "group-[[dir=rtl]]/ow-tooltip:data-[side=inline-start]:transform-[scaleX(-1)]",
  "group-[[dir=rtl]]/ow-tooltip:data-[side=inline-end]:transform-[scaleX(-1)]",
  // The surface becomes Canvas inside a CanvasText edge; the arrow stays visible.
  "forced-colors:forced-color-adjust-none forced-colors:bg-[CanvasText]",
];

/** The classes of the parts. */
export const tooltipSlots: Record<"positioner" | "popup" | "arrow", string> = {
  positioner: positioner.join(" "),
  popup: popup.join(" "),
  arrow: arrow.join(" "),
};
