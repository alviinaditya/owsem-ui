import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Table } from "./index";

const root = document.documentElement;

const COLUMNS = ["Name", "Type", "Default", "Description"];
const ROWS = [
  ["size", "string", "md", "How large it is"],
  ["disabled", "boolean", "false", "Blocks interaction"],
];

function Plain({
  width = 600,
  ...rest
}: {
  width?: number | string;
  layout?: "table" | "stack" | "auto";
  stackBelow?: number;
  size?: "default" | "sm";
  caption?: ReactNode;
  style?: CSSProperties;
  tableProps?: Record<string, unknown>;
}) {
  const { caption, style, ...props } = rest;
  return (
    <Table.Root {...props} style={{ inlineSize: width, ...style }}>
      {caption ? <Table.Caption>{caption}</Table.Caption> : null}
      <Table.Header>
        <Table.Row>
          {COLUMNS.map((name) => (
            <Table.Head key={name}>{name}</Table.Head>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {ROWS.map((row) => (
          <Table.Row key={row[0]}>
            {row.map((value) => (
              <Table.Cell key={value}>{value}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell>Total</Table.Cell>
          <Table.Cell>2</Table.Cell>
          <Table.Cell />
          <Table.Cell />
        </Table.Row>
      </Table.Footer>
    </Table.Root>
  );
}

function Wide({ columns = 14 }: { columns?: number }) {
  const names = Array.from({ length: columns }, (_, i) => `Column ${i}`);
  return (
    <Table.Root layout="table" style={{ inlineSize: 400 }}>
      <Table.Caption>Wide table</Table.Caption>
      <Table.Header>
        <Table.Row>
          {names.map((name) => (
            <Table.Head key={name} style={{ whiteSpace: "nowrap" }}>
              {name}
            </Table.Head>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          {names.map((name) => (
            <Table.Cell key={name} style={{ whiteSpace: "nowrap" }}>
              {name} value
            </Table.Cell>
          ))}
        </Table.Row>
      </Table.Body>
    </Table.Root>
  );
}

const q = <T extends HTMLElement = HTMLElement>(selector: string, scope: ParentNode = document) => {
  const el = scope.querySelector<T>(selector);
  if (!el) throw new Error(`no ${selector}`);
  return el;
};
const scroller = () => q(".ow-table__scroll");
const flags = () => [
  scroller().hasAttribute("data-overflow-x-start"),
  scroller().hasAttribute("data-overflow-x-end"),
];

/** Resolves a value of `property` (e.g. a token) to its computed form inside `scope`. */
function resolve(property: string, value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

describe("Table", () => {
  test("is a table with row groups, column headings with scope, and cells", async () => {
    const screen = await render(<Plain caption="Props" />);
    const table = q("table");
    expect(table.getAttribute("role")).toBeNull();
    expect(q(".ow-table").tagName).toBe("DIV");
    expect(q("caption", table).textContent).toBe("Props");
    expect(table.querySelectorAll("thead, tbody, tfoot")).toHaveLength(3);
    const heads = [...table.querySelectorAll("thead th")];
    expect(heads.map((th) => th.getAttribute("scope"))).toEqual(Array(4).fill("col"));
    expect(table.querySelectorAll("tbody td")).toHaveLength(8);
    await expect.element(screen.getByRole("table", { name: "Props" })).toBeVisible();
    await expect.element(screen.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect.element(screen.getByRole("cell", { name: "boolean" })).toBeVisible();
    expect(screen.getByRole("rowgroup").elements()).toHaveLength(3);
  });

  test("a heading cell in the body is a row heading, and scope can be set", async () => {
    await render(
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.Head>Row</Table.Head>
            <Table.Head scope="colgroup">Group</Table.Head>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect([...document.querySelectorAll("th")].map((th) => th.getAttribute("scope"))).toEqual([
      "row",
      "colgroup",
    ]);
  });

  test("every part takes className, style, ref, and render", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      caption: createRef<HTMLTableCaptionElement>(),
      header: createRef<HTMLTableSectionElement>(),
      body: createRef<HTMLTableSectionElement>(),
      footer: createRef<HTMLTableSectionElement>(),
      row: createRef<HTMLTableRowElement>(),
      head: createRef<HTMLTableCellElement>(),
      cell: createRef<HTMLTableCellElement>(),
      table: createRef<HTMLTableElement>(),
    };
    const style = { opacity: 0.9 };
    await render(
      <Table.Root
        ref={refs.root}
        className="mine"
        style={style}
        tableProps={{ ref: refs.table, className: "mine-table", "aria-rowcount": 3 }}
      >
        <Table.Caption ref={refs.caption} className="mine" style={style}>
          Title
        </Table.Caption>
        <Table.Header ref={refs.header} className="mine" style={style}>
          <Table.Row ref={refs.row} className="mine" style={style}>
            <Table.Head ref={refs.head} className="mine" style={style}>
              A
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body ref={refs.body} className="mine" style={style}>
          <Table.Row>
            <Table.Cell ref={refs.cell} className="mine" style={style}>
              a
            </Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer ref={refs.footer} className="mine" style={style}>
          <Table.Row>
            <Table.Cell>f</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>,
    );
    const names = {
      root: "ow-table",
      caption: "ow-table__caption",
      header: "ow-table__header",
      body: "ow-table__body",
      footer: "ow-table__footer",
      row: "ow-table__row",
      head: "ow-table__head",
      cell: "ow-table__cell",
    } as const;
    for (const [key, name] of Object.entries(names)) {
      const el = refs[key as keyof typeof names].current;
      expect(el, key).toBeInstanceOf(HTMLElement);
      expect(el?.classList.contains(name), key).toBe(true);
      expect(el?.classList.contains("mine"), key).toBe(true);
      expect(el?.style.opacity, key).toBe("0.9");
    }
    expect(refs.table.current?.tagName).toBe("TABLE");
    expect(refs.table.current?.className).toBe("ow-table__table mine-table");
    expect(refs.table.current?.getAttribute("aria-rowcount")).toBe("3");

    await render(
      <Table.Root render={<section data-x="" />}>
        <Table.Body render={<tbody data-b="" />}>
          <Table.Row render={<tr data-r="" />}>
            <Table.Cell render={<td data-c="" />}>x</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect(q("section[data-x].ow-table")).toBeTruthy();
    expect(q("tbody[data-b].ow-table__body")).toBeTruthy();
    expect(q("tr[data-r].ow-table__row")).toBeTruthy();
    expect(q("td[data-c].ow-table__cell")).toBeTruthy();
  });

  test("an unlayered rule on a className beats the component's own values", async () => {
    const style = document.createElement("style");
    style.textContent = ".mine-cell { padding: 3px; } .mine-root { border-radius: 2px; }";
    document.head.append(style);
    onTestFinished(() => style.remove());
    await render(
      <Table.Root className="mine-root">
        <Table.Body>
          <Table.Row>
            <Table.Cell className="mine-cell">x</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect(getComputedStyle(q(".ow-table__cell")).paddingTop).toBe("3px");
    expect(getComputedStyle(q(".ow-table")).borderTopLeftRadius).toBe("2px");
  });

  test("is a card: panel fill, radius, and surface shadow, with the content clipped to it", async () => {
    await render(<Plain />);
    const card = getComputedStyle(q(".ow-table"));
    expect(card.backgroundColor).toBe(resolve("background-color", "var(--ow-panel)"));
    expect(card.boxShadow).toBe(resolve("box-shadow", "var(--ow-surface-shadow)"));
    expect(card.borderTopLeftRadius).toBe(resolve("border-radius", "var(--ow-radius)"));
    expect(getComputedStyle(scroller()).borderTopLeftRadius).toBe(card.borderTopLeftRadius);
  });

  test("the header is muted on a faint tint under a hairline; body rows are split by hairlines, none after the last", async () => {
    await render(<Plain />);
    const head = getComputedStyle(q("thead th"));
    expect(head.color).toBe(resolve("color", "var(--ow-muted)"));
    expect(head.fontWeight).toBe("500");
    expect(head.textTransform).toBe("none");
    expect(head.backgroundColor).toBe(
      resolve("background-color", "color-mix(in oklab, var(--ow-fg) 4%, transparent)"),
    );
    expect(head.borderBottomWidth).toBe("1px");
    expect(head.borderBottomColor).toBe(resolve("color", "var(--ow-line)"));
    expect(head.borderLeftWidth).toBe("0px");
    const rows = [...document.querySelectorAll("tbody tr")];
    const border = (row: Element) => getComputedStyle(q("td", row)).borderBottomWidth;
    expect(rows.map(border)).toEqual(["1px", "0px"]);
    const cell = getComputedStyle(q("tbody td"));
    expect(cell.color).toBe(resolve("color", "var(--ow-fg)"));
    expect(cell.verticalAlign).toBe("top");
    expect([cell.paddingTop, cell.paddingLeft]).toEqual(["10px", "14px"]);
    expect(getComputedStyle(q("tfoot td")).borderTopWidth).toBe("1px");
  });

  test("size sm tightens the cells", async () => {
    await render(<Plain size="sm" />);
    const cell = getComputedStyle(q("tbody td"));
    expect([cell.paddingTop, cell.paddingLeft]).toEqual(["6px", "12px"]);
  });

  test("the caption sits above the card, not inside it, and can be visually hidden", async () => {
    await render(<Plain caption="Props" />);
    const card = q(".ow-table").getBoundingClientRect();
    const caption = q("caption").getBoundingClientRect();
    expect(caption.bottom).toBeLessThanOrEqual(card.top);
    expect(caption.height).toBeGreaterThan(10);
    expect(getComputedStyle(q(".ow-table")).marginTop).toBe("28px");
    await render(
      <Table.Root>
        <Table.Caption visuallyHidden>Hidden</Table.Caption>
        <Table.Body>
          <Table.Row>
            <Table.Cell>x</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    const hidden = document.querySelectorAll("caption")[1] as HTMLElement;
    expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(hidden.closest(".ow-table")).not.toBeNull();
    expect(getComputedStyle(hidden.closest(".ow-table") as Element).marginTop).toBe("0px");
  });
});

describe("Table layout", () => {
  const stacked = () => q(".ow-table").getAttribute("data-layout") === "stack";

  test("table keeps the table; stack stacks at any width", async () => {
    await render(
      <>
        <Plain width={200} layout="table" />
        <Plain width={900} layout="stack" />
      </>,
    );
    const [a, b] = [...document.querySelectorAll(".ow-table")];
    expect(a?.getAttribute("data-layout")).toBe("table");
    expect(b?.getAttribute("data-layout")).toBe("stack");
  });

  test("auto stacks under stackBelow, measured on the Root, and follows a resize", async () => {
    const screen = await render(<Plain width={479} />);
    expect(stacked()).toBe(true);
    await screen.rerender(<Plain width={480} />);
    await expect.poll(stacked).toBe(false);
    await screen.rerender(<Plain width={700} stackBelow={720} />);
    await expect.poll(stacked).toBe(true);
    await screen.rerender(<Plain width="100%" stackBelow={100} />);
    await expect.poll(stacked).toBe(false);
  });

  test("auto reads the Root's layout width, so a scaled ancestor does not stack it", async () => {
    await render(
      <div style={{ scale: "0.5", transformOrigin: "0 0" }}>
        <Plain width={600} />
      </div>,
    );
    expect(q(".ow-table").getBoundingClientRect().width).toBeLessThan(480);
    expect(stacked()).toBe(false);
  });

  test("auto never stacks a table of two columns", async () => {
    await render(
      <Table.Root style={{ inlineSize: 200 }}>
        <Table.Header>
          <Table.Row>
            <Table.Head>Class</Table.Head>
            <Table.Head>Part</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>ow-table</Table.Cell>
            <Table.Cell>Root</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    await settle();
    expect(stacked()).toBe(false);
  });

  test("a stacked row grows with its content: heading and value on one line, nothing crosses the hairline", async () => {
    await render(
      <Table.Root layout="stack" style={{ inlineSize: 300 }}>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Present when</Table.Head>
            <Table.Head>Notes</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {[1, 2].map((n) => (
            <Table.Row key={n}>
              <Table.Cell>row {n}</Table.Cell>
              <Table.Cell>
                {"A long value that has to wrap onto several lines ".repeat(3)}
              </Table.Cell>
              <Table.Cell>short</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>,
    );
    const [row] = [...document.querySelectorAll("tbody tr")];
    const cells = [...(row as Element).querySelectorAll("td")];
    const label = (el: Element) => getComputedStyle(el, "::before");
    expect(label(cells[1] as Element).whiteSpace).toBe("nowrap");
    const rowBox = (row as Element).getBoundingClientRect();
    for (const cell of cells) {
      const box = cell.getBoundingClientRect();
      expect(box.bottom).toBeLessThanOrEqual(rowBox.bottom + 0.5);
      expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
    }
    // The heading column is shared: the values start at the same x.
    const x = cells
      .slice(1)
      .map((c) => c.querySelector(".ow-table__value")?.getBoundingClientRect().left);
    expect(x[0]).toBe(x[1]);
  });

  test("header labels flow to the stacked cells by column; the first cell is the title", async () => {
    await render(
      <Table.Root layout="stack" style={{ inlineSize: 360 }}>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>
              <span>Type</span> <em>(TS)</em>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>size</Table.Cell>
            <Table.Cell>string</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    const cells = [...document.querySelectorAll<HTMLElement>("tbody td")];
    await expect.poll(() => cells[1]?.getAttribute("data-label")).toBe("Type (TS)");
    const pseudo = (el: Element) => getComputedStyle(el, "::before").content;
    expect(pseudo(cells[1] as Element)).toBe('"Type (TS)"');
    expect(pseudo(cells[0] as Element)).toBe("none");
    expect(getComputedStyle(cells[0] as Element).fontWeight).toBe("600");
    expect(getComputedStyle(cells[1] as Element).display).toBe("grid");
    expect(getComputedStyle(cells[0] as Element).display).toBe("block");
    expect(getComputedStyle(q("tbody tr")).display).toBe("grid");
  });

  test("stacked, the header row stays for screen readers and roles are stated", async () => {
    const screen = await render(<Plain layout="stack" width={360} />);
    const header = q("thead").getBoundingClientRect();
    expect(header.width).toBeLessThanOrEqual(1);
    await expect.element(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader").elements()).toHaveLength(4);
    expect(screen.getByRole("row").elements()).toHaveLength(4);
    expect(screen.getByRole("cell").elements().length).toBeGreaterThan(8);
    // Rows are blocks; an empty cell leaves no gap.
    const rows = [...document.querySelectorAll("tbody tr")];
    expect(rows[1]?.getBoundingClientRect().top).toBeGreaterThan(
      (rows[0]?.getBoundingClientRect().bottom ?? 0) - 1,
    );
    expect(getComputedStyle(q("tfoot td:last-child")).display).toBe("none");
  });

  test("stacked rows still have hairlines between them and none after the last", async () => {
    await render(<Plain layout="stack" width={360} />);
    const rows = [...document.querySelectorAll("tbody tr")];
    expect(rows.map((r) => getComputedStyle(r).borderBottomWidth)).toEqual(["1px", "0px"]);
  });
});

describe("Table overflow", () => {
  test("no fade and not focusable when nothing overflows", async () => {
    await render(<Plain width={700} />);
    expect(flags()).toEqual([false, false]);
    // Scroll Area keeps a viewport with nothing to scroll out of the tab order.
    expect(scroller().tabIndex).toBe(-1);
  });

  test("fades only the sides with more, and the native scrollbar is hidden", async () => {
    await render(<Wide />);
    const el = scroller();
    expect(flags()).toEqual([false, true]);
    expect(getComputedStyle(el).maskImage).toContain("linear-gradient");
    expect(getComputedStyle(el).scrollbarWidth).toBe("none");
    el.scrollLeft = 200;
    await expect.poll(flags).toEqual([true, true]);
    el.scrollLeft = el.scrollWidth;
    await expect.poll(flags).toEqual([true, false]);
    expect(getComputedStyle(el).maskImage).toContain("linear-gradient");
  });

  test("is focusable and named by its caption only while it overflows", async () => {
    const screen = await render(<Wide />);
    await expect.poll(() => scroller().tabIndex).toBe(0);
    expect(scroller().getAttribute("role")).toBe("region");
    await expect.element(screen.getByRole("region", { name: "Wide table" })).toBeVisible();
    await userEvent.tab();
    expect(document.activeElement).toBe(scroller());
    // Scroll Area draws the ring on its Root, over the content.
    expect(getComputedStyle(q(".ow-table__scroller"), "::after").outlineStyle).toBe("solid");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => scroller().scrollLeft).toBeGreaterThan(0);
    await screen.rerender(<Wide columns={1} />);
    await expect.poll(() => scroller().tabIndex).toBe(-1);
    expect(scroller().getAttribute("role")).toBeNull();
  });

  test("scrolls like a Scroll Area: the scrollbar shows on hover, focus, and scroll, with no arrows", async () => {
    await render(<Wide />);
    const bar = q(".ow-table__scroller .ow-scroll-area__scrollbar");
    const shown = () => getComputedStyle(bar).opacity;
    expect(bar.getAttribute("data-orientation")).toBe("horizontal");
    expect(bar.querySelectorAll("button")).toHaveLength(0);
    await expect.poll(shown).toBe("0");
    await userEvent.hover(scroller());
    await expect.poll(shown).toBe("1");
    await userEvent.unhover(scroller());
    await expect.poll(shown).toBe("0");
    // Keyboard focus: it shows, and stays while the table has it.
    await userEvent.tab();
    expect(document.activeElement).toBe(scroller());
    await expect.poll(shown).toBe("1");
  });

  test("a sideways wheel scrolls it; a vertical one has no room here and passes through", async () => {
    await render(<Wide />);
    const el = scroller();
    await userEvent.hover(el);
    await commands.wheel(120, 0);
    await expect.poll(() => el.scrollLeft).toBeGreaterThan(0);
    const at = el.scrollLeft;
    await commands.wheel(0, 120);
    expect(el.scrollTop).toBe(0);
    expect(el.scrollLeft).toBe(at);
  });

  test("nowrap keeps each cell on one line, so a narrow card scrolls instead of squeezing", async () => {
    function Words({ nowrap }: { nowrap?: boolean }) {
      return (
        <Table.Root layout="table" nowrap={nowrap} style={{ inlineSize: 240 }} aria-label="Words">
          <Table.Body>
            <Table.Row>
              <Table.Cell>some words that would wrap</Table.Cell>
              <Table.Cell>and more words that would wrap</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      );
    }
    const screen = await render(<Words />);
    const cell = () => q<HTMLElement>(".ow-table__cell");
    const wrapped = cell().getBoundingClientRect().height;
    expect(getComputedStyle(cell()).whiteSpace).toBe("normal");
    await screen.rerender(<Words nowrap />);
    expect(getComputedStyle(cell()).whiteSpace).toBe("nowrap");
    expect(cell().getBoundingClientRect().height).toBeLessThan(wrapped);
    await expect.poll(() => scroller().scrollWidth).toBeGreaterThan(scroller().clientWidth);
  });

  test("aria-label on the Root names the scroller", async () => {
    await render(
      <Table.Root layout="table" aria-label="Sizes" style={{ inlineSize: 100 }}>
        <Table.Body>
          <Table.Row>
            <Table.Cell style={{ whiteSpace: "nowrap" }}>{"x".repeat(80)}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    await expect.poll(() => scroller().getAttribute("aria-label")).toBe("Sizes");
    expect(q(".ow-table").hasAttribute("aria-label")).toBe(false);
  });
});

describe("Table theming", () => {
  test("reads the theme tokens in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(<Plain />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await settle();
      const card = getComputedStyle(q(".ow-table"));
      expect(card.backgroundColor, theme).toBe(resolve("background-color", "var(--ow-panel)"));
      expect(card.boxShadow, theme).toBe(resolve("box-shadow", "var(--ow-surface-shadow)"));
      expect(getComputedStyle(q("tbody td")).color, theme).toBe(resolve("color", "var(--ow-fg)"));
      expect(getComputedStyle(q("thead th")).color, theme).toBe(
        resolve("color", "var(--ow-muted)"),
      );
      expect(getComputedStyle(q("thead th")).borderBottomColor, theme).toBe(
        resolve("color", "var(--ow-line)"),
      );
    }
  });

  test("a theme token set on one table changes it alone (TK-9)", async () => {
    await render(
      <>
        <Plain style={{ "--ow-panel": "rgb(255, 0, 0)" } as CSSProperties} />
        <Plain />
      </>,
    );
    const [a, b] = [...document.querySelectorAll(".ow-table")];
    expect(getComputedStyle(a as Element).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(b as Element).backgroundColor).not.toBe("rgb(255, 0, 0)");
  });

  test("keeps its separators in forced colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Plain />);
    await commands.setForcedColors("active");
    await settle();
    const text = resolve("color", "CanvasText");
    expect(getComputedStyle(q("thead th")).borderBottomColor).toBe(text);
    expect(getComputedStyle(q("tbody td")).borderBottomColor).toBe(text);
    expect(getComputedStyle(q(".ow-table")).outlineStyle).toBe("solid");
  });

  test("has no axe violations in light and dark, a plain, stacked, and scrolling table", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <div style={{ display: "grid", gap: 40 }}>
        <Plain caption="Props" width={700} />
        <Plain caption="Stacked" layout="stack" width={360} />
        <Wide />
      </div>,
    );
    const last = () => [...document.querySelectorAll(".ow-table__scroll")].at(-1);
    await expect.poll(() => last()?.getAttribute("tabindex")).toBe("0");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await settle();
      const { violations } = await axeReport(screen.container);
      expect(violations, theme).toEqual([]);
    }
  });

  test("is idle: no rAF and no animations, after a scroll too", async () => {
    await render(<Wide />);
    await settle();
    expect(await measureIdle(1500)).toEqual({ rafCalls: 0, runningAnimations: [] });
    scroller().scrollLeft = 100;
    await settle();
    expect(await measureIdle(1500)).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

test("every part has its data-slot, and an outer part's data-slot wins", async () => {
  await render(<Plain caption="Props" />);
  const slots = [
    ...new Set(
      [...document.querySelectorAll("[data-slot]")].map((el) => el.getAttribute("data-slot")),
    ),
  ];
  expect(slots).toEqual([
    "table",
    "table-scroller",
    "scroll-area-viewport",
    "scroll-area-content",
    "table-table",
    "table-caption",
    "table-header",
    "table-row",
    "table-head",
    "table-body",
    "table-cell",
    "table-value",
    "table-footer",
  ]);
  await render(
    <Table.Root>
      <Table.Body>
        <Table.Row data-slot="mine">
          <Table.Cell>x</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>,
  );
  expect(document.querySelector("tr[data-slot='mine']")).not.toBeNull();
});

test("size sm adds a modifier class and keeps data-size", async () => {
  await render(<Plain size="sm" />);
  expect(q(".ow-table").classList.contains("ow-table--sm")).toBe(true);
  expect(q(".ow-table").getAttribute("data-size")).toBe("sm");
});
