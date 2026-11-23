"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  type ComponentPropsWithRef,
  createContext,
  type ReactElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../core/cn";
import { useMergedRefs } from "../../core/merge-refs";
import { type TableSize, tableSlots, tableVariants } from "./table-variants";
import "./table.css";

export type TableLayout = "table" | "stack" | "auto";

interface TableContextValue {
  /** The layout in use now: stacked rows, or the plain table. */
  stacked: boolean;
  /** Header labels by column index, for the stacked cells. */
  labels: readonly string[];
  setLabel: (index: number, label: string) => void;
}

const TableContext = createContext<TableContextValue>({
  stacked: false,
  labels: [],
  setLabel: () => {},
});
type Section = "head" | "body" | "foot";
const SectionContext = createContext<Section>("body");

/** In a stacked table the display types are overridden, so the table roles are stated again. */
const useRole = (role: string) => (useContext(TableContext).stacked ? role : undefined);

export interface TableRootProps extends Omit<useRender.ComponentProps<"div">, "className"> {
  className?: string | undefined;
  /**
   * `"table"` always draws a table that scrolls sideways when it is wider; `"stack"` always shows
   * each row as a block; `"auto"` stacks when the Root is narrower than `stackBelow`.
   */
  layout?: TableLayout | undefined;
  /** Cell padding: `"sm"` is tighter. */
  size?: TableSize | undefined;
  /** The Root width in pixels under which `layout="auto"` stacks. */
  stackBelow?: number | undefined;
  /** Props for the `<table>` inside the Root. */
  tableProps?: ComponentPropsWithRef<"table"> | undefined;
}

/**
 * The table as a card: a `div` that holds a scroller and the `<table>`. `ref`, `className`,
 * `style`, and `render` are the card's. Wider than the card, the table scrolls inside it, with
 * its edges fading on the sides that have more; it is focusable then, so the keyboard can scroll
 * it, and `aria-label` or `aria-labelledby` (else the Caption) name it. Narrow, rows can stack.
 */
export function TableRoot({
  className,
  render,
  layout = "auto",
  stackBelow = 480,
  size,
  tableProps,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledby,
  ref,
  ...props
}: TableRootProps): ReactElement {
  const own = useRef<HTMLDivElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [labels, setLabels] = useState<readonly string[]>([]);
  const stacked = layout === "stack" || (layout === "auto" && narrow);

  const setLabel = useCallback((index: number, label: string) => {
    setLabels((current) => {
      if (current[index] === label) return current;
      const next = [...current];
      next[index] = label;
      return next;
    });
  }, []);
  const context = useMemo(() => ({ stacked, labels, setLabel }), [stacked, labels, setLabel]);

  // The Root's own width decides `auto`. Stacked rows do not change it, so it cannot flip back.
  useLayoutEffect(() => {
    const el = own.current;
    if (!el || layout !== "auto") return;
    // A table of one or two columns fits at any width, so it never stacks.
    const update = () => {
      const columns = el.querySelector("tr")?.children.length ?? 0;
      setNarrow(columns > 2 && el.getBoundingClientRect().width < stackBelow);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout, stackBelow]);

  // Edge fades: data-overflow-start/-end say which side has more to scroll. Passive, idle-free.
  const [captionId, setCaptionId] = useState<string>();
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      // scrollLeft is negative in right-to-left writing.
      const at = Math.abs(el.scrollLeft);
      el.toggleAttribute("data-overflow-start", at > 1);
      el.toggleAttribute("data-overflow-end", max - at > 1);
      setOverflowing(max > 1);
      setCaptionId(el.querySelector("caption")?.id || undefined);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const merged = useMergedRefs(own, ref);

  const name = labelledby ?? captionId;
  // While it scrolls it is a named region, so the keyboard user knows what they reached.
  const region = {
    role: name || ariaLabel ? "region" : undefined,
    "aria-label": ariaLabel,
    "aria-labelledby": name,
  };
  const { className: tableClass, role, ...table } = tableProps ?? {};
  return (
    <TableContext.Provider value={context}>
      {useRender({
        defaultTagName: "div",
        render,
        ref: merged,
        props: {
          "data-slot": "table",
          ...props,
          className: cn(tableVariants({ size }), className),
          "data-layout": stacked ? "stack" : "table",
          "data-size": size,
          children: (
            <div
              data-slot="table-scroll"
              ref={scroller}
              className={tableSlots.scroll}
              // Focusable only while it scrolls, so a keyboard can reach what is off to the side.
              tabIndex={overflowing ? 0 : undefined}
              {...(overflowing ? region : null)}
            >
              <table
                data-slot="table-table"
                {...table}
                className={cn(tableSlots.table, tableClass)}
                role={role ?? (stacked ? "table" : undefined)}
              >
                {children}
              </table>
            </div>
          ),
        },
      })}
    </TableContext.Provider>
  );
}

export interface TableCaptionProps extends Omit<useRender.ComponentProps<"caption">, "className"> {
  className?: string | undefined;
  /** Hides it from sight but keeps it as the table's name. */
  visuallyHidden?: boolean | undefined;
}

/** The table's title, above the card; it names the table. */
export function TableCaption({
  className,
  render,
  visuallyHidden,
  ref,
  ...props
}: TableCaptionProps): ReactElement {
  const id = useId();
  return useRender({
    defaultTagName: "caption",
    render,
    ref,
    props: {
      "data-slot": "table-caption",
      id,
      ...props,
      className: cn(tableSlots.caption, className),
      "data-visually-hidden": visuallyHidden ? "" : undefined,
    },
  });
}

export interface TableHeaderProps extends Omit<useRender.ComponentProps<"thead">, "className"> {
  className?: string | undefined;
}

/** The header rows: their cells name the columns, and label the stacked cells. */
export function TableHeader({ className, render, ref, ...props }: TableHeaderProps): ReactElement {
  const role = useRole("rowgroup");
  return (
    <SectionContext.Provider value="head">
      {useRender({
        defaultTagName: "thead",
        render,
        ref,
        props: {
          "data-slot": "table-header",
          role,
          ...props,
          className: cn(tableSlots.header, className),
        },
      })}
    </SectionContext.Provider>
  );
}

export interface TableBodyProps extends Omit<useRender.ComponentProps<"tbody">, "className"> {
  className?: string | undefined;
}

/** The body rows. */
export function TableBody({ className, render, ref, ...props }: TableBodyProps): ReactElement {
  const role = useRole("rowgroup");
  return (
    <SectionContext.Provider value="body">
      {useRender({
        defaultTagName: "tbody",
        render,
        ref,
        props: {
          "data-slot": "table-body",
          role,
          ...props,
          className: cn(tableSlots.body, className),
        },
      })}
    </SectionContext.Provider>
  );
}

export interface TableFooterProps extends Omit<useRender.ComponentProps<"tfoot">, "className"> {
  className?: string | undefined;
}

/** The footer rows, such as totals. */
export function TableFooter({ className, render, ref, ...props }: TableFooterProps): ReactElement {
  const role = useRole("rowgroup");
  return (
    <SectionContext.Provider value="foot">
      {useRender({
        defaultTagName: "tfoot",
        render,
        ref,
        props: {
          "data-slot": "table-footer",
          role,
          ...props,
          className: cn(tableSlots.footer, className),
        },
      })}
    </SectionContext.Provider>
  );
}

export interface TableRowProps extends Omit<useRender.ComponentProps<"tr">, "className"> {
  className?: string | undefined;
}

/** A row. Stacked, it is a block with its first cell as the title. */
export function TableRow({ className, render, ref, ...props }: TableRowProps): ReactElement {
  const role = useRole("row");
  return useRender({
    defaultTagName: "tr",
    render,
    ref,
    props: { "data-slot": "table-row", role, ...props, className: cn(tableSlots.row, className) },
  });
}

export interface TableHeadProps extends Omit<useRender.ComponentProps<"th">, "className"> {
  className?: string | undefined;
}

/**
 * A heading cell (`th`). In the header it is a column heading (`scope="col"`) and its text labels
 * that column's cells when stacked; elsewhere it is a row heading (`scope="row"`).
 */
export function TableHead({
  className,
  render,
  scope,
  ref,
  ...props
}: TableHeadProps): ReactElement {
  const kind = useContext(SectionContext);
  const { setLabel } = useContext(TableContext);
  const el = useRef<HTMLTableCellElement | null>(null);
  const merged = useMergedRefs(el, ref);
  // Registers the text by column index; runs again when the content changes.
  useLayoutEffect(() => {
    const cell = el.current;
    if (cell && kind === "head") setLabel(cell.cellIndex, cell.textContent?.trim() ?? "");
  });
  const role = useRole(kind === "head" ? "columnheader" : "rowheader");
  return useRender({
    defaultTagName: "th",
    render,
    ref: merged,
    props: {
      "data-slot": "table-head",
      role,
      scope: scope ?? (kind === "head" ? "col" : "row"),
      ...props,
      className: cn(tableSlots.head, className),
    },
  });
}

export interface TableCellProps extends Omit<useRender.ComponentProps<"td">, "className"> {
  className?: string | undefined;
}

/** A data cell (`td`). Stacked, it shows its column's heading before its value. */
export function TableCell({
  className,
  render,
  children,
  ref,
  ...props
}: TableCellProps): ReactElement {
  const { labels } = useContext(TableContext);
  const el = useRef<HTMLTableCellElement | null>(null);
  const merged = useMergedRefs(el, ref);
  const [label, setLabel] = useState<string>();
  useLayoutEffect(() => {
    const index = el.current?.cellIndex;
    setLabel(index === undefined ? undefined : labels[index]);
  }, [labels]);
  const role = useRole("cell");
  return useRender({
    defaultTagName: "td",
    render,
    ref: merged,
    props: {
      "data-slot": "table-cell",
      role,
      "data-label": label || undefined,
      ...props,
      className: cn(tableSlots.cell, className),
      // One box for the value, so stacked it sits beside its heading, however it is made up.
      children: (
        <span data-slot="table-value" className={tableSlots.value}>
          {children}
        </span>
      ),
    },
  });
}
