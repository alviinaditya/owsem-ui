// No "use client": the classes of Table can be used from Server Components.
import { cn } from "../../core/cn";

export type TableSize = "default" | "sm";

export interface TableVariantProps {
  /** Cell padding: `"sm"` is tighter. @default "default" */
  size?: TableSize | undefined;
}

/** The root's classes. */
export function tableVariants({ size = "default" }: TableVariantProps = {}): string {
  return cn("ow-table", size === "sm" && "ow-table--sm");
}

/** The classes of the other parts. */
export const tableSlots = {
  scroller: "ow-table__scroller",
  scroll: "ow-table__scroll",
  table: "ow-table__table",
  caption: "ow-table__caption",
  header: "ow-table__header",
  body: "ow-table__body",
  footer: "ow-table__footer",
  row: "ow-table__row",
  head: "ow-table__head",
  cell: "ow-table__cell",
  value: "ow-table__value",
} as const;
