import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Table as CssTable } from "../src/components/table/index";
import { cn } from "../src/tailwind/lib/cn";
import { scrollAreaSlots } from "../src/tailwind/scroll-area/scroll-area-variants";
import { Table as TwTable } from "../src/tailwind/table/index";
import { tableSlots, tableVariants } from "../src/tailwind/table/table-variants";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Table in Tailwind CSS v4 (src/tailwind/table) against table.css: the plain table and the stacked
// rows, both sizes, the header, body and footer, the caption, and the scroll fades. Which layout a
// table has is decided by the Root's width in script (`stackBelow`), so the widths where it
// switches are tested here; the CSS has no media or container query.

const OVERRIDES =
  "rounded-none bg-red-500 text-red-500 p-8 text-sm border-red-500 font-bold shadow-none";

const tw = tailwindParity(
  classNames(
    ...Object.values(tableSlots),
    // The scroller is a Scroll Area, with its scrollbar.
    ...Object.values(scrollAreaSlots),
    tableVariants({ size: "default" }),
    tableVariants({ size: "sm" }),
    OVERRIDES,
    "px-8 py-8 mt-8 data-overflow-end:bg-red-500 border-b-4",
  ),
);

// What the table's own parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "maskImage",
  "maskComposite",
  "scrollbarWidth",
  "overflowX",
  "overscrollBehaviorX",
  "overflowWrap",
  "textAlign",
  "textOverflow",
  "clipPath",
  "maxWidth",
  "gridTemplateColumns",
  "gridColumnEnd",
  "fontVariantNumeric",
  "borderSpacing",
  "borderCollapse",
  "alignItems",
  "paddingBlockEnd",
  "borderBottomWidth",
  "borderTopWidth",
  "borderBottomColor",
  "borderTopColor",
  "borderBottomStyle",
];
// The stacked heading before a value, and a hairline's color.
const pseudo = [...PSEUDO, "color", "fontSize", "fontWeight", "whiteSpace"];

interface Kit {
  Table: typeof CssTable;
}
const css: Kit = { Table: CssTable };
const twind: Kit = { Table: TwTable };

interface TableProps {
  kit: Kit;
  size?: "default" | "sm";
  layout?: "table" | "stack" | "auto";
  stackBelow?: number;
  /** The Root's width in px. */
  width?: number;
  /** A minimum width for the `<table>` itself, so it overflows the Root. */
  wide?: number;
  caption?: "shown" | "hidden";
  footer?: boolean;
  rowHeadings?: boolean;
  /** One cell with nothing in it. */
  empty?: boolean;
  /** Two columns, which never stack in `auto`. */
  columns?: 2 | 3;
  className?: string;
}

function Data({ kit, ...table }: TableProps): ReactElement {
  const { Table } = kit;
  const three = (table.columns ?? 3) === 3;
  return (
    <Table.Root
      size={table.size}
      layout={table.layout}
      stackBelow={table.stackBelow}
      className={table.className}
      style={{ inlineSize: table.width ?? 336 }}
      tableProps={table.wide ? { style: { minInlineSize: table.wide } } : undefined}
    >
      {table.caption ? (
        <Table.Caption visuallyHidden={table.caption === "hidden"}>Team</Table.Caption>
      ) : null}
      <Table.Header>
        <Table.Row>
          <Table.Head>{table.rowHeadings ? "Member" : "Name"}</Table.Head>
          <Table.Head>Role</Table.Head>
          {three ? <Table.Head>Status</Table.Head> : null}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {[
          ["Ada", "Engineer", "Active"],
          ["Grace", "Admiral", "Away"],
          ["Linus", table.empty ? "" : "Maintainer", "Active"],
        ].map(([name, role, status]) => (
          <Table.Row key={name}>
            {table.rowHeadings ? <Table.Head>{name}</Table.Head> : <Table.Cell>{name}</Table.Cell>}
            <Table.Cell>{role}</Table.Cell>
            {three ? <Table.Cell>{status}</Table.Cell> : null}
          </Table.Row>
        ))}
      </Table.Body>
      {table.footer ? (
        <Table.Footer>
          <Table.Row>
            <Table.Cell>Total</Table.Cell>
            <Table.Cell>3</Table.Cell>
            {three ? <Table.Cell>2</Table.Cell> : null}
          </Table.Row>
        </Table.Footer>
      ) : null}
    </Table.Root>
  );
}

const make = (name: string, table: Omit<TableProps, "kit">): Case => ({
  name,
  css: <Data kit={css} {...table} />,
  tw: <Data kit={twind} {...table} />,
});

const cases: Case[] = [
  make("table", { layout: "table" }),
  make("table, sm", { layout: "table", size: "sm" }),
  make("table with a footer", { layout: "table", footer: true, caption: "shown" }),
  make("table with a hidden caption", { layout: "table", caption: "hidden" }),
  make("table with row headings", { layout: "table", rowHeadings: true, footer: true }),
  make("table with an empty cell", { layout: "table", empty: true }),
  make("stack", { layout: "stack" }),
  make("stack, sm", { layout: "stack", size: "sm" }),
  make("stack with a footer", { layout: "stack", footer: true, caption: "shown" }),
  make("stack with a hidden caption", { layout: "stack", caption: "hidden" }),
  make("stack with row headings", { layout: "stack", rowHeadings: true, footer: true }),
  make("stack with an empty cell", { layout: "stack", empty: true }),
  // Wide enough: the Root is 300 and stackBelow 300, so it is not narrower.
  make("auto at its threshold", { width: 300, stackBelow: 300 }),
  make("auto one pixel under", { width: 299, stackBelow: 300 }),
  make("auto with two columns, narrow", { width: 200, columns: 2 }),
  make("auto, narrow", { width: 200 }),
  make("wide", { layout: "table", wide: 700, width: 300 }),
  make("wide, scrolled to the middle", { layout: "table", wide: 700, width: 300 }),
  make("wide, scrolled to the end", { layout: "table", wide: 700, width: 300 }),
  make("wide, sm", { layout: "table", wide: 700, width: 300, size: "sm", footer: true }),
  make("a user's class", { layout: "table", className: "rounded-none" }),
];

/** Scrolls the table sideways as the case's name says. */
const scroll = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  const scroller = side.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
  if (!scroller) return;
  // The start is at the right in right-to-left writing, and scrollLeft counts from there.
  const toward = getComputedStyle(scroller).direction === "rtl" ? -1 : 1;
  if (name.includes("middle")) scroller.scrollLeft = 100 * toward;
  else if (name.includes("end")) scroller.scrollLeft = 1e6 * toward;
  for (let i = 0; i < 3; i++) await frame();
};

const run = { props, pseudo, prepare: scroll };

describe("Table in Tailwind CSS v4 against table.css", () => {
  test("every layout, size, and part matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page: the fades swap", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: an outline and edges in CanvasText", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast changes nothing", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("reduced motion changes nothing", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("nothing moves, so nothing transitions", async () => {
    await tw.motion(cases, { prepare: scroll });
  });
});

describe("Table states, with real input, in Tailwind CSS v4", () => {
  // The viewport takes the focus; Scroll Area draws the ring on its Root, which is compared too.
  const scroller = { target: "[data-slot=scroll-area-viewport]", props, pseudo };

  test("keyboard focus on a scrolling table draws a ring inside it", async () => {
    await tw.states(cases, "wide", "focus", scroller);
  });

  test("keyboard focus, scrolled to the middle", async () => {
    await tw.states(cases, "wide, scrolled to the middle", "focus", {
      ...scroller,
      prepare: scroll,
    });
  });

  test("keyboard focus in the dark theme", async () => {
    await tw.states(cases, "wide", "focus", { ...scroller, theme: "dark" });
  });

  test("keyboard focus with forced colors", async () => {
    await setMedia("forced-colors");
    await tw.states(cases, "wide", "focus", scroller);
  });
});

describe("className on Table in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(<Data kit={twind} layout="table" className={OVERRIDES} />);
    const root = screen.container.querySelector("[data-slot=table]");
    if (!root) throw new Error("not rendered");
    expectStyles(root, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      fontWeight: "700",
    });
  });

  test("a user's size utilities beat the size's", async () => {
    tw.load();
    const screen = await render(<Data kit={twind} layout="table" size="sm" />);
    const cell = screen.container.querySelector("[data-slot=table-cell]");
    if (!cell) throw new Error("not rendered");
    expectStyles(cell, { paddingTop: "6px", paddingLeft: "12px" });
  });

  test("the slots merge with a className, the user's last", () => {
    const merged = cn(tableVariants({ size: "sm" }), "rounded-none p-8 text-sm");
    expect(merged).toContain("rounded-none");
    expect(merged).not.toContain("rounded-(--_radius)");
    expect(merged).not.toContain("text-[0.875rem]");
    expect(cn(tableSlots.cell, "py-8")).not.toContain("py-(--_py)");
    expect(cn(tableSlots.caption, "text-red-500")).not.toContain("text-(color:--_muted)");
    expect(cn(tableSlots.scroll, "rounded-none")).not.toContain("rounded-[inherit]");
  });

  test("a table with a user's className has the size's variables", () => {
    expect(tableVariants({ size: "sm" })).toContain("[--_py:6px]");
    expect(tableVariants({ size: "sm" })).not.toContain("[--_py:10px]");
    expect(tableVariants({})).toContain("[--_py:10px]");
  });
});
