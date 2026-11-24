// Generated from components/table-of-contents by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of table-of-contents-variants.ts: the same exports, with the styles as
// utility classes. Needs tokens.css.

// A rail along the list, and a marker that slides along it to the current link. The rail and the
// marker read Tree Rail Nav's tokens for its rail and trail, so both navs read as one.
const root = [
  "[--_fg:var(--ow-fg)] [--_muted:var(--ow-muted)] [--_rail:var(--ow-line)]",
  "[--_marker:var(--ow-accent)] [--_focus:var(--ow-focus)] [--_radius:var(--ow-radius)]",
  "relative text-[13.5px] leading-[1.4]",
];

const list = [
  "m-0 p-0 list-none",
  // The rail, a 1px line at the top list's inline start. The 2px marker covers it, and the 1px
  // padding keeps a link's focus ring clear of the marker.
  "data-[depth=1]:ps-[1px] data-[depth=1]:border-s data-[depth=1]:border-s-(color:--_rail)",
  // Sub-sections indent; the marker stays on the one rail.
  "[[data-slot=table-of-contents-list]_&]:ps-[12px]",
];

const link = [
  // Box.
  "block py-[4px] ps-[12px] pe-[8px] rounded-(--_radius)",
  // Type.
  "text-(color:--_muted) wrap-break-word no-underline",
  "data-current:text-(color:--_fg) hover:text-(color:--_fg)",
  // Inside, so a scrolling container never cuts it.
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--_focus)",
  // The current link is underlined, and focus uses the system color.
  "forced-colors:data-current:underline forced-colors:focus-visible:outline-[Highlight]",
];

// Beside the current link: the tracker lays it out on that link's box (--_x, --_y, --_h), and slides
// it there from where it was by --_dx, --_dy, and --_sy, which end at none.
const marker = [
  // Box.
  "absolute top-[var(--_y,0px)] left-[var(--_x,0px)] w-[2px] h-[var(--_h,0px)]",
  "bg-(color:--_marker) opacity-0 pointer-events-none data-visible:opacity-100",
  "[translate:var(--_dx,0)_var(--_dy,0)] [scale:1_var(--_sy,1)]",
  // Motion. Its own layer, so it lands without a pixel jump.
  "will-change-[translate,scale] transition-[translate,scale,opacity]",
  "duration-[var(--ow-spring-travel-duration),var(--ow-spring-travel-duration),150ms]",
  "ease-[var(--ow-spring-travel),var(--ow-spring-travel),ease]",
  // The first placement and a resize: no transition.
  "data-instant:[transition:none]",
  // Media. The marker jumps to the next link, and only fades in and out; in forced colors it is the
  // system highlight.
  "motion-reduce:transition-[opacity] motion-reduce:duration-150 motion-reduce:ease-[ease]",
  "forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]",
];

/** The classes of the parts. Item has no look of its own. */
export const tableOfContentsSlots: Record<"root" | "list" | "item" | "link" | "marker", string> = {
  root: root.join(" "),
  list: list.join(" "),
  item: "",
  link: link.join(" "),
  marker: marker.join(" "),
};
