// The Tailwind CSS v4 twin of table-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type TableSize = "default" | "sm";

export interface TableVariantProps {
  /** Cell padding: `"sm"` is tighter. @default "default" */
  size?: TableSize | undefined;
}

// A card with a quiet header row, hairlines between rows, and no vertical lines. Nothing moves, so
// nothing animates.
const root = [
  "group/ow-table",
  // The theme tokens it reads.
  "[--_panel:var(--ow-panel)] [--_shadow:var(--ow-surface-shadow)] [--_fg:var(--ow-fg)]",
  "[--_muted:var(--ow-muted)] [--_line:var(--ow-line)] [--_focus:var(--ow-focus)]",
  "[--_radius:var(--ow-radius)]",
  // The header and footer: a faint tint of the text color.
  "[--_tint:color-mix(in_oklab,var(--_fg)_4%,transparent)]",
  // Stacked: the width of the headings that lead the values.
  "[--_label:5.5rem]",
  // Box.
  "relative box-border min-w-0 max-w-full rounded-(--_radius)",
  "bg-(color:--_panel) shadow-(shadow:--_shadow)",
  // Type.
  "text-(color:--_fg) text-[0.875rem] leading-[1.5]",
  // Room for the caption above the card.
  "has-[[data-slot=table-caption]:not([data-visually-hidden])]:mt-[28px]",
  "forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-[CanvasText]",
];

// Cell padding, by size.
const variants = cva(root, {
  variants: {
    size: {
      default: "[--_py:10px] [--_px:14px]",
      sm: "[--_py:6px] [--_px:12px]",
    },
  },
  defaultVariants: { size: "default" },
});

/** The root's classes. */
export function tableVariants({ size }: TableVariantProps = {}): string {
  return cn(variants({ size }));
}

// Wider than the card, the table scrolls inside it with a fade on the sides that have more. The
// scrollbar is hidden.
const scroll = [
  "rounded-[inherit] overflow-x-auto overscroll-x-contain",
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--_focus)",
  "data-overflow-start:[mask-image:linear-gradient(to_right,transparent,#000_28px)]",
  "data-overflow-end:[mask-image:linear-gradient(to_left,transparent,#000_28px)]",
  "data-overflow-start:data-overflow-end:[mask-image:linear-gradient(to_right,transparent,#000_28px,#000_calc(100%_-_28px),transparent)]",
  // Right to left: the sides swap.
  "[&:dir(rtl)]:data-overflow-start:[mask-image:linear-gradient(to_left,transparent,#000_28px)]",
  "[&:dir(rtl)]:data-overflow-end:[mask-image:linear-gradient(to_right,transparent,#000_28px)]",
  "[&:dir(rtl)]:data-overflow-start:data-overflow-end:[mask-image:linear-gradient(to_left,transparent,#000_28px,#000_calc(100%_-_28px),transparent)]",
];

const table = [
  "w-full border-separate border-spacing-0 tabular-nums",
  // Stacked: the display types are overridden, so the table roles are stated again.
  "group-data-[layout=stack]/ow-table:block",
];

// A small title above the card, one line; it names the table.
const caption = [
  "absolute bottom-[calc(100%_+_8px)] inset-x-0 overflow-hidden px-[2px]",
  "text-(color:--_muted) text-[0.8125rem] font-medium leading-[1.25rem] text-start text-ellipsis",
  "whitespace-nowrap",
  // Hidden from sight, kept as the table's name.
  "data-visually-hidden:bottom-auto data-visually-hidden:w-[1px] data-visually-hidden:h-[1px]",
  "data-visually-hidden:p-0 data-visually-hidden:[clip-path:inset(50%)]",
];

// The header row stays for screen readers when stacked.
const header = [
  "group-data-[layout=stack]/ow-table:block group-data-[layout=stack]/ow-table:absolute",
  "group-data-[layout=stack]/ow-table:w-[1px] group-data-[layout=stack]/ow-table:h-[1px]",
  "group-data-[layout=stack]/ow-table:overflow-hidden",
  "group-data-[layout=stack]/ow-table:[clip-path:inset(50%)]",
  "group-data-[layout=stack]/ow-table:whitespace-nowrap",
];

const body = ["group-data-[layout=stack]/ow-table:block"];

const footer = ["group-data-[layout=stack]/ow-table:block"];

// Stacked: a row is a grid with room to grow. Its first cell is the title across the top; each other
// cell is a heading beside its value, the heading column as wide as the longest heading.
const row = [
  "group-data-[layout=stack]/ow-table:grid",
  "group-data-[layout=stack]/ow-table:grid-cols-[max-content_minmax(0,1fr)]",
  "group-data-[layout=stack]/ow-table:gap-x-[16px]",
  "group-data-[layout=stack]/ow-table:gap-y-[6px]",
  "group-data-[layout=stack]/ow-table:py-[calc(var(--_py)_+_6px)]",
  "group-data-[layout=stack]/ow-table:px-(--_px)",
  "group-data-[layout=stack]/ow-table:border-b",
  "group-data-[layout=stack]/ow-table:border-b-(color:--_line)",
  "group-data-[layout=stack]/ow-table:[[data-slot=table-body]>&]:last:border-b-0",
  "group-data-[layout=stack]/ow-table:[[data-slot=table-footer]>&]:border-b-0",
  "group-data-[layout=stack]/ow-table:[[data-slot=table-footer]>&]:bg-(color:--_tint)",
  "forced-colors:border-b-[CanvasText]",
];

// A heading and a data cell share the box: a hairline below, the first cell the row's title.
const cell = [
  "py-(--_py) px-(--_px) border-b border-b-(color:--_line) text-start align-top",
  // No hairline after the last row of the body.
  "[[data-slot=table-body]>[data-slot=table-row]:last-child>&]:border-b-0",
  // The header and footer rows: a faint tint; the footer has its hairline above.
  "in-data-[slot=table-header]:bg-(color:--_tint) in-data-[slot=table-footer]:bg-(color:--_tint)",
  "in-data-[slot=table-footer]:border-b-0 in-data-[slot=table-footer]:border-t",
  "in-data-[slot=table-footer]:border-t-(color:--_line)",
  // Stacked: each is a grid of the row's columns, a heading beside its value.
  "group-data-[layout=stack]/ow-table:grid group-data-[layout=stack]/ow-table:col-span-full",
  "group-data-[layout=stack]/ow-table:grid-cols-subgrid",
  "group-data-[layout=stack]/ow-table:items-baseline",
  "group-data-[layout=stack]/ow-table:min-w-0 group-data-[layout=stack]/ow-table:p-0",
  "group-data-[layout=stack]/ow-table:border-0 group-data-[layout=stack]/ow-table:bg-transparent",
  "group-data-[layout=stack]/ow-table:text-(color:--_fg)",
  "group-data-[layout=stack]/ow-table:[font-size:inherit]",
  "group-data-[layout=stack]/ow-table:font-normal",
  // The title: the whole row's width, no heading.
  "group-data-[layout=stack]/ow-table:first:block",
  "group-data-[layout=stack]/ow-table:first:pb-[4px]",
  "group-data-[layout=stack]/ow-table:first:font-semibold",
  "forced-colors:border-b-[CanvasText]",
  "forced-colors:group-data-[layout=stack]/ow-table:border-[CanvasText]",
];

// A column heading is quiet; a row heading in the body reads as text.
const head = [
  ...cell,
  "text-(color:--_muted) text-[0.8125rem] font-medium",
  "in-data-[slot=table-body]:text-(color:--_fg)",
];

const dataCell = [
  ...cell,
  // Stacked, the heading of its column leads the value.
  "group-data-[layout=stack]/ow-table:before:content-[attr(data-label)]",
  "group-data-[layout=stack]/ow-table:before:text-(color:--_muted)",
  "group-data-[layout=stack]/ow-table:before:text-[0.75rem]",
  "group-data-[layout=stack]/ow-table:before:font-medium",
  "group-data-[layout=stack]/ow-table:before:whitespace-nowrap",
  "group-data-[layout=stack]/ow-table:first:before:content-none",
  // A cell with nothing in it, such as no default, leaves no heading either.
  "group-data-[layout=stack]/ow-table:has-[>[data-slot=table-value]:empty]:hidden",
];

// One box for the value, so stacked it sits beside its heading, however it is made up.
const value = [
  "group-data-[layout=stack]/ow-table:block group-data-[layout=stack]/ow-table:min-w-0 group-data-[layout=stack]/ow-table:wrap-break-word",
];

/** The classes of the other parts. */
export const tableSlots: Record<
  "scroll" | "table" | "caption" | "header" | "body" | "footer" | "row" | "head" | "cell" | "value",
  string
> = {
  scroll: scroll.join(" "),
  table: table.join(" "),
  caption: caption.join(" "),
  header: header.join(" "),
  body: body.join(" "),
  footer: footer.join(" "),
  row: row.join(" "),
  head: head.join(" "),
  cell: dataCell.join(" "),
  value: value.join(" "),
};
