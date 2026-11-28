// Generated from components/table-of-contents by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of table-of-contents-variants.ts: the same exports, with the styles as
// utility classes. Needs tokens.css.

// A rail that bends with the levels, and a marker that travels along it to the current link. The
// rail and the marker read Tree Rail Nav's tokens for its rail and trail, so both navs read as one.
const root = [
  "[--_fg:var(--ow-fg)] [--_muted:var(--ow-muted)] [--_rail:var(--ow-line)]",
  "[--_marker:var(--ow-accent)] [--_focus:var(--ow-focus)] [--_radius:var(--ow-radius)]",
  "relative text-[13.5px] leading-[1.4]",
];

const list = [
  "m-0 p-0 list-none",
  // The 2px marker covers the rail, and the 2px of padding keeps a link's focus ring clear of it.
  "data-[depth=1]:ps-[2px]",
  // Sub-sections indent, and the rail bends in with them.
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

// The rail and the marker: one SVG over the nav, drawn by the tracker. It is mirrored for right to
// left, as the tracker measures x from the inline start.
const rail = [
  "absolute inset-0 w-full h-full overflow-visible pointer-events-none",
  "rtl:[scale:-1_1] [&_path]:fill-none",
];

const line = ["stroke-(color:--_rail) stroke-1"];

// The marker is the same path, dashed to show only the current link's run: the tracker sets where
// the dash starts (--_from) and how long it is (--_len), and it travels along the path as those
// transition.
const marker = [
  "stroke-(color:--_marker) stroke-2",
  "[stroke-dasharray:var(--_len,0px)_100000px] [stroke-dashoffset:calc(var(--_from,0px)*-1)]",
  "opacity-0 data-visible:opacity-100",
  // Motion.
  "transition-[stroke-dasharray,stroke-dashoffset,opacity]",
  "duration-[var(--ow-spring-travel-duration),var(--ow-spring-travel-duration),150ms]",
  "ease-[var(--ow-spring-travel),var(--ow-spring-travel),var(--ow-ease-out)]",
  // The first placement and a redraw: no transition.
  "data-instant:[transition:none]",
  // Media. The marker jumps to the next link, and only fades in and out; in forced colors the rail
  // is the text color and the marker the system highlight.
  "motion-reduce:transition-[opacity] motion-reduce:duration-150 motion-reduce:ease-(--ow-ease-out)",
  "forced-colors:forced-color-adjust-none forced-colors:stroke-[Highlight]",
];

/** The classes of the parts. Item has no look of its own. */
export const tableOfContentsSlots: Record<
  "root" | "list" | "item" | "link" | "rail" | "line" | "marker",
  string
> = {
  root: root.join(" "),
  list: list.join(" "),
  item: "",
  link: link.join(" "),
  rail: rail.join(" "),
  line: [...line, "forced-colors:stroke-[CanvasText]"].join(" "),
  marker: marker.join(" "),
};
