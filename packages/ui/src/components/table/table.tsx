"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  type ComponentPropsWithRef,
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./table.css";

const cls = {
  root: "ow-table",
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

const join = (base: string, extra: string | undefined) => (extra ? `${base} ${extra}` : base);

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

export interface TableRootProps extends useRender.ComponentProps<"div"> {
  /**
   * `"table"` always draws a table that scrolls sideways when it is wider; `"stack"` always shows
   * each row as a block; `"auto"` stacks when the Root is narrower than `stackBelow`.
   */
  layout?: TableLayout;
  /** Cell padding: `"sm"` is tighter. */
  size?: "default" | "sm";
  /** The Root width in pixels under which `layout="auto"` stacks. */
  stackBelow?: number;
  /** Props for the `<table>` inside the Root. */
  tableProps?: ComponentPropsWithRef<"table">;
}

/**
 * The table as a card: a `div` that holds a scroller and the `<table>`. `ref`, `className`,
 * `style`, and `render` are the card's. Wider than the card, the table scrolls inside it, with
 * its edges fading on the sides that have more; it is focusable then, so the keyboard can scroll
 * it, and `aria-label` or `aria-labelledby` (else the Caption) name it. Narrow, rows can stack.
 */
export const TableRoot: ForwardRefExoticComponent<
  Omit<TableRootProps, "ref"> & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, Omit<TableRootProps, "ref">>(function TableRoot(
  {
    className,
    render,
    layout = "auto",
    stackBelow = 480,
    size,
    tableProps,
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": labelledby,
    ...props
  },
  ref,
) {
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

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      own.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

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
        ref: setRef,
        props: {
          ...props,
          className: join(cls.root, className),
          "data-layout": stacked ? "stack" : "table",
          "data-size": size,
          children: (
            <div
              ref={scroller}
              className={cls.scroll}
              // Focusable only while it scrolls, so a keyboard can reach what is off to the side.
              tabIndex={overflowing ? 0 : undefined}
              {...(overflowing ? region : null)}
            >
              <table
                {...table}
                className={join(cls.table, tableClass)}
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
});

export type TableCaptionProps = useRender.ComponentProps<"caption"> & {
  /** Hides it from sight but keeps it as the table's name. */
  visuallyHidden?: boolean;
};

/** The table's title, above the card; it names the table. */
export const TableCaption: ForwardRefExoticComponent<
  Omit<TableCaptionProps, "ref"> & RefAttributes<HTMLTableCaptionElement>
> = forwardRef<HTMLTableCaptionElement, Omit<TableCaptionProps, "ref">>(function TableCaption(
  { className, render, visuallyHidden, ...props },
  ref,
) {
  const id = useId();
  return useRender({
    defaultTagName: "caption",
    render,
    ref,
    props: {
      id,
      ...props,
      className: join(cls.caption, className),
      "data-visually-hidden": visuallyHidden ? "" : undefined,
    },
  });
});

function section(
  name: "header" | "body" | "footer",
  tag: "thead" | "tbody" | "tfoot",
  kind: Section,
) {
  const Part = forwardRef<HTMLTableSectionElement, Omit<useRender.ComponentProps<"tbody">, "ref">>(
    function Part({ className, render, ...props }, ref) {
      const role = useRole("rowgroup");
      return (
        <SectionContext.Provider value={kind}>
          {useRender({
            defaultTagName: tag,
            render,
            ref,
            props: { role, ...props, className: join(cls[name], className) },
          })}
        </SectionContext.Provider>
      );
    },
  );
  return Part;
}

export type TableHeaderProps = useRender.ComponentProps<"thead">;
export type TableBodyProps = useRender.ComponentProps<"tbody">;
export type TableFooterProps = useRender.ComponentProps<"tfoot">;

/** The header rows: their cells name the columns, and label the stacked cells. */
export const TableHeader: ForwardRefExoticComponent<
  Omit<TableHeaderProps, "ref"> & RefAttributes<HTMLTableSectionElement>
> = section("header", "thead", "head");
TableHeader.displayName = "TableHeader";

/** The body rows. */
export const TableBody: ForwardRefExoticComponent<
  Omit<TableBodyProps, "ref"> & RefAttributes<HTMLTableSectionElement>
> = section("body", "tbody", "body");
TableBody.displayName = "TableBody";

/** The footer rows, such as totals. */
export const TableFooter: ForwardRefExoticComponent<
  Omit<TableFooterProps, "ref"> & RefAttributes<HTMLTableSectionElement>
> = section("footer", "tfoot", "foot");
TableFooter.displayName = "TableFooter";

export type TableRowProps = useRender.ComponentProps<"tr">;

/** A row. Stacked, it is a block with its first cell as the title. */
export const TableRow: ForwardRefExoticComponent<
  Omit<TableRowProps, "ref"> & RefAttributes<HTMLTableRowElement>
> = forwardRef<HTMLTableRowElement, Omit<TableRowProps, "ref">>(function TableRow(
  { className, render, ...props },
  ref,
) {
  const role = useRole("row");
  return useRender({
    defaultTagName: "tr",
    render,
    ref,
    props: { role, ...props, className: join(cls.row, className) },
  });
});

export type TableHeadProps = useRender.ComponentProps<"th">;

/**
 * A heading cell (`th`). In the header it is a column heading (`scope="col"`) and its text labels
 * that column's cells when stacked; elsewhere it is a row heading (`scope="row"`).
 */
export const TableHead: ForwardRefExoticComponent<
  Omit<TableHeadProps, "ref"> & RefAttributes<HTMLTableCellElement>
> = forwardRef<HTMLTableCellElement, Omit<TableHeadProps, "ref">>(function TableHead(
  { className, render, scope, ...props },
  ref,
) {
  const kind = useContext(SectionContext);
  const { setLabel } = useContext(TableContext);
  const el = useRef<HTMLTableCellElement | null>(null);
  // Registers the text by column index; runs again when the content changes.
  useLayoutEffect(() => {
    const cell = el.current;
    if (cell && kind === "head") setLabel(cell.cellIndex, cell.textContent?.trim() ?? "");
  });
  const setRef = useCallback(
    (node: HTMLTableCellElement | null) => {
      el.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const role = useRole(kind === "head" ? "columnheader" : "rowheader");
  return useRender({
    defaultTagName: "th",
    render,
    ref: setRef,
    props: {
      role,
      scope: scope ?? (kind === "head" ? "col" : "row"),
      ...props,
      className: join(cls.head, className),
    },
  });
});

export type TableCellProps = useRender.ComponentProps<"td">;

/** A data cell (`td`). Stacked, it shows its column's heading before its value. */
export const TableCell: ForwardRefExoticComponent<
  Omit<TableCellProps, "ref"> & RefAttributes<HTMLTableCellElement>
> = forwardRef<HTMLTableCellElement, Omit<TableCellProps, "ref">>(function TableCell(
  { className, render, children, ...props },
  ref,
) {
  const { labels } = useContext(TableContext);
  const el = useRef<HTMLTableCellElement | null>(null);
  const [label, setLabel] = useState<string>();
  useLayoutEffect(() => {
    const index = el.current?.cellIndex;
    setLabel(index === undefined ? undefined : labels[index]);
  }, [labels]);
  const setRef = useCallback(
    (node: HTMLTableCellElement | null) => {
      el.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const role = useRole("cell");
  return useRender({
    defaultTagName: "td",
    render,
    ref: setRef,
    props: {
      role,
      "data-label": label || undefined,
      ...props,
      className: join(cls.cell, className),
      // One box for the value, so stacked it sits beside its heading, however it is made up.
      children: <span className={cls.value}>{children}</span>,
    },
  });
});
