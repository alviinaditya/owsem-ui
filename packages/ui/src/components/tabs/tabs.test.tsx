import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Tabs } from "./index";

const root = document.documentElement;
const NAMES = ["Overview", "Activity", "Settings"] as const;

function Sample({
  list,
  ...props
}: Partial<Tabs.Root.Props> & { list?: Partial<Tabs.List.Props> }) {
  return (
    <Tabs.Root defaultValue={props.value === undefined ? "activity" : undefined} {...props}>
      <Tabs.List aria-label="Project" {...list}>
        {NAMES.map((name) => (
          <Tabs.Tab key={name} value={name.toLowerCase()}>
            {name}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {NAMES.map((name) => (
        <Tabs.Panel key={name} value={name.toLowerCase()}>
          {`${name} panel`}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

/** More tabs than fit in 240px. */
function Long({
  dir,
  list,
  ...props
}: Partial<Tabs.Root.Props> & { dir?: "ltr" | "rtl"; list?: Partial<Tabs.List.Props> }) {
  return (
    <div dir={dir} style={{ inlineSize: 240 }}>
      <Tabs.Root defaultValue="a" {...props}>
        <Tabs.List aria-label="Files" {...list}>
          {["a", "b", "c", "d", "e", "f"].map((name) => (
            <Tabs.Tab key={name} value={name}>
              {`component-${name}.tsx`}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const list = screen.container.querySelector<HTMLElement>(".ow-tabs__list");
  const thumb = screen.container.querySelector<HTMLElement>(".ow-tabs__indicator");
  if (!list || !thumb) throw new Error("not mounted");
  const tab = (name: string) => {
    const el = [...list.querySelectorAll<HTMLElement>('[role="tab"]')].find(
      (candidate) => candidate.textContent === name,
    );
    if (!el) throw new Error(`no tab ${name}`);
    return el;
  };
  const shown = () =>
    [...screen.container.querySelectorAll(".ow-tabs__panel")]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => el.textContent);
  return { screen, list, thumb, tab, shown };
}

/**
 * Whether the indicator's key (inside the clear border that keeps the well's padding) covers the
 * element exactly (within 0.5 px), as drawn now.
 */
function over(thumb: Element, el: Element): boolean {
  const a = thumb.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
  return [
    a.left + border - b.left,
    a.top + border - b.top,
    b.right - (a.right - border),
    b.bottom - (a.bottom - border),
  ].every((d) => Math.abs(d) <= 0.5);
}

const transitions = (el: Element) =>
  el
    .getAnimations()
    .filter((a): a is CSSTransition => a instanceof CSSTransition)
    .map((a) => a.transitionProperty)
    .sort();

/** Resolves a value of `property` (e.g. a token) to its computed form inside `scope`. */
function resolve(property: string, value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

/** An unlayered stylesheet, as an app's own CSS is, for one test. */
function sheet(css: string) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  onTestFinished(() => style.remove());
}

describe("Tabs", () => {
  test("the shortest usage: Base UI's roles, the first tab active, and its panel", async () => {
    const screen = await render(
      <Tabs.Root>
        <Tabs.List aria-label="Project">
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="activity">Activity</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview">Overview panel</Tabs.Panel>
        <Tabs.Panel value="activity">Activity panel</Tabs.Panel>
      </Tabs.Root>,
    );
    await expect.element(screen.getByRole("tablist", { name: "Project" })).toBeInTheDocument();
    const tabs = screen.getByRole("tab");
    await expect.element(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await expect.element(tabs.nth(1)).toHaveAttribute("aria-selected", "false");
    const panel = screen.getByRole("tabpanel", { name: "Overview" });
    await expect.element(panel).toHaveTextContent("Overview panel");
    // The list draws its indicator with no wiring, as decoration.
    const thumb = screen.container.querySelector<HTMLElement>(".ow-tabs__indicator");
    expect(thumb?.getAttribute("aria-hidden")).toBe("true");
    await expect.poll(() => thumb && over(thumb, tabs.nth(0).element())).toBe(true);
  });

  test("a click picks the tab, and the panel left goes at once", async () => {
    const changes: string[] = [];
    const { tab, shown, screen } = await mount(
      <Sample onValueChange={(value) => changes.push(value)} />,
    );
    expect(shown()).toEqual(["Activity panel"]);
    // React renders the click in a microtask, and Base UI drops the old panel in a later frame.
    tab("Settings").click();
    await Promise.resolve();
    expect(screen.container.querySelectorAll(".ow-tabs__panel")).toHaveLength(2);
    expect(shown()).toEqual(["Settings panel"]);
    expect(changes).toEqual(["settings"]);
    await expect.poll(() => screen.container.querySelectorAll(".ow-tabs__panel")).toHaveLength(1);
  });

  test("controlled, it follows its value; keepMounted panels stay, hidden", async () => {
    const { screen, thumb, tab, shown } = await mount(<Sample value="overview" />);
    expect(shown()).toEqual(["Overview panel"]);
    tab("Settings").click();
    await Promise.resolve();
    expect(shown()).toEqual(["Overview panel"]);
    await screen.rerender(<Sample value="settings" />);
    expect(shown()).toEqual(["Settings panel"]);
    await expect.poll(() => over(thumb, tab("Settings"))).toBe(true);

    const kept = await render(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="Kept">
          <Tabs.Tab value="a">A</Tabs.Tab>
          <Tabs.Tab value="b">B</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a" keepMounted>
          Panel A
        </Tabs.Panel>
        <Tabs.Panel value="b" keepMounted>
          Panel B
        </Tabs.Panel>
      </Tabs.Root>,
    );
    const panels = [...kept.container.querySelectorAll(".ow-tabs__panel")];
    expect(panels.map((el) => getComputedStyle(el).display)).toEqual(["block", "none"]);
  });

  test("passes className, style, render, and ref through on every part (FR-2, FR-5)", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      list: createRef<HTMLDivElement>(),
      tab: createRef<HTMLElement>(),
      panel: createRef<HTMLDivElement>(),
    };
    const screen = await render(
      <Tabs.Root ref={refs.root} className="mine-root" style={{ marginBlock: "1px" }} value="a">
        <Tabs.List
          ref={refs.list}
          aria-label="Links"
          className="mine-list"
          style={{ marginBlock: "2px" }}
        >
          <Tabs.Tab
            ref={refs.tab}
            value="a"
            className={(state) => (state.active ? "on" : "off")}
            style={{ marginInline: "3px" }}
          >
            A
          </Tabs.Tab>
          <Tabs.Tab value="b" nativeButton={false} render={<a href="#b">B</a>} />
        </Tabs.List>
        <Tabs.Panel
          ref={refs.panel}
          value="a"
          className="mine-panel"
          style={{ marginBlock: "4px" }}
          render={<section />}
        >
          A
        </Tabs.Panel>
      </Tabs.Root>,
    );
    const { container } = screen;
    expect(refs.root.current?.className).toBe("ow-tabs mine-root");
    expect(refs.root.current?.style.marginBlock).toBe("1px");
    expect(refs.list.current?.className).toBe("ow-tabs__list mine-list");
    expect(refs.list.current?.style.marginBlock).toBe("2px");
    expect(refs.tab.current?.className).toBe("ow-tabs__tab on");
    expect(refs.tab.current?.style.marginInline).toBe("3px");
    const link = container.querySelector("a");
    expect(link?.className).toBe("ow-tabs__tab");
    expect(link?.getAttribute("role")).toBe("tab");
    expect(refs.panel.current?.tagName).toBe("SECTION");
    expect(refs.panel.current?.className).toBe("ow-tabs__panel mine-panel");
    expect(refs.panel.current?.style.marginBlock).toBe("4px");
  });

  test("a tab holds any node: text is wrapped, other nodes stay as they are", async () => {
    const screen = await render(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="Files">
          <Tabs.Tab value="a">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
            </svg>
            Code
          </Tabs.Tab>
          <Tabs.Tab value="b">{2}</Tabs.Tab>
          <Tabs.Tab value="c">
            <b>Bold</b>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    const [icon, count, bold] = screen.getByRole("tab").elements();
    expect(icon?.querySelector(":scope > svg + .ow-tabs__label")?.textContent).toBe("Code");
    expect(count?.querySelector(":scope > .ow-tabs__label")?.textContent).toBe("2");
    expect(bold?.querySelector(":scope > .ow-tabs__label")).toBeNull();
    expect(bold?.querySelector(":scope > b")?.textContent).toBe("Bold");
  });

  test("draws a flat well, a raised key, and quiet tabs from the theme tokens, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { screen, list, thumb, tab } = await mount(<Sample />);
    const panel = screen.container.querySelector(".ow-tabs__panel") as Element;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const well = getComputedStyle(list);
      expect(well.backgroundColor, theme).toBe(resolve("background-color", "var(--ow-well-bg)"));
      expect(well.boxShadow, theme).toBe(resolve("box-shadow", "var(--ow-well-shadow)"));
      const key = getComputedStyle(thumb);
      expect(key.backgroundColor, theme).toBe(resolve("background-color", "var(--ow-raised-bg)"));
      expect(key.boxShadow, theme).toBe(resolve("box-shadow", "var(--ow-raised-shadow)"));
      // Labels change color with a short transition.
      await expect
        .poll(() => getComputedStyle(tab("Activity")).color, { message: theme })
        .toBe(resolve("color", "var(--ow-fg)"));
      await expect
        .poll(() => getComputedStyle(tab("Overview")).color, { message: theme })
        .toBe(resolve("color", "var(--ow-muted)"));
      expect(getComputedStyle(tab("Activity")).backgroundColor, theme).toBe("rgba(0, 0, 0, 0)");
      expect(getComputedStyle(panel).color, theme).toBe(resolve("color", "var(--ow-fg)"));
    }
  });

  test("a theme token set on the root or a part changes it alone (TK-9)", async () => {
    const { list, thumb, tab } = await mount(
      <>
        <Sample
          style={
            {
              "--ow-well-bg": "rgb(1, 2, 3)",
              "--ow-raised-bg": "rgb(4, 5, 6)",
              "--ow-muted": "rgb(7, 8, 9)",
            } as CSSProperties
          }
        />
        <Sample />
      </>,
    );
    expect(getComputedStyle(list).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(tab("Overview")).color).toBe("rgb(7, 8, 9)");
    const lists = document.querySelectorAll(".ow-tabs__list");
    expect(getComputedStyle(lists[1] as Element).backgroundColor).toBe(
      resolve("background-color", "var(--ow-well-bg)"),
    );

    // On one tab, that tab alone.
    const one = await mount(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="One">
          <Tabs.Tab value="a">A</Tabs.Tab>
          <Tabs.Tab value="b" style={{ "--ow-muted": "rgb(10, 11, 12)" } as CSSProperties}>
            B
          </Tabs.Tab>
          <Tabs.Tab value="c">C</Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    expect(getComputedStyle(one.tab("B")).color).toBe("rgb(10, 11, 12)");
    expect(getComputedStyle(one.tab("C")).color).toBe(resolve("color", "var(--ow-muted)"));
  });

  test("an unlayered rule on a className beats the component's own value", async () => {
    sheet(`
      .mine-root { gap: 40px; }
      .mine-list { padding: 9px; background-color: rgb(1, 2, 3); border-radius: 1px; font-size: 20px; }
      .mine-tab { color: rgb(4, 5, 6); border-radius: 2px; }
      .mine-panel { padding: 7px; color: rgb(7, 8, 9); }
    `);
    const screen = await render(
      <Tabs.Root className="mine-root" defaultValue="a">
        <Tabs.List className="mine-list" aria-label="Mine">
          <Tabs.Tab className="mine-tab" value="a">
            A
          </Tabs.Tab>
          <Tabs.Tab className="mine-tab" value="b">
            B
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel className="mine-panel" value="a">
          A
        </Tabs.Panel>
      </Tabs.Root>,
    );
    const style = (selector: string) =>
      getComputedStyle(screen.container.querySelector(selector) as Element);
    expect(style(".mine-root").rowGap).toBe("40px");
    const list = style(".mine-list");
    expect(list.paddingInlineStart).toBe("9px");
    expect(list.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(list.borderTopLeftRadius).toBe("1px");
    // The tabs are sized in em, so the list's font size scales them.
    expect(style(".mine-tab").fontSize).toBe("20px");
    expect(style(".mine-tab").paddingBlockStart).toBe("15px");
    // On the active tab too, whose state is in the component's selector.
    expect(style('.mine-tab[aria-selected="true"]').color).toBe("rgb(4, 5, 6)");
    expect(style(".mine-tab").borderTopLeftRadius).toBe("2px");
    expect(style(".mine-panel").paddingInlineStart).toBe("7px");
    expect(style(".mine-panel").color).toBe("rgb(7, 8, 9)");
    // And --py through style (FR-11).
    const padded = await render(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="Padded" size="lg">
          <Tabs.Tab value="a" style={{ "--py": "1em" } as CSSProperties}>
            A
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    const tab = padded.container.querySelector(".ow-tabs__tab") as Element;
    expect(getComputedStyle(tab).paddingBlockStart).toBe("16px");
  });

  test("the panel adds no padding or margin, and the list fits its tabs", async () => {
    const { screen, list, tab } = await mount(<Sample />);
    const panel = getComputedStyle(screen.container.querySelector(".ow-tabs__panel") as Element);
    expect([panel.padding, panel.margin]).toEqual(["0px", "0px"]);
    const well = list.getBoundingClientRect();
    const end = tab("Settings").getBoundingClientRect().right;
    expect(well.right - end).toBeCloseTo(3, 0);
    expect(getComputedStyle(list).margin).toBe("0px");
    expect(getComputedStyle(list.parentElement as Element).margin).toBe("0px");
  });

  test("stretched with plain CSS, with equal tabs by className, the indicator follows", async () => {
    sheet(`
      .stretched { inline-size: 100%; }
      .stretched > .ow-tabs__tab { flex: 1; }
    `);
    const { screen, list, thumb, tab } = await mount(
      <div className="box" style={{ inlineSize: 600 }}>
        <Sample list={{ className: "stretched" }} />
      </div>,
    );
    const box = screen.container.querySelector(".box") as HTMLElement;
    expect(list.getBoundingClientRect().width).toBeCloseTo(600, 0);
    const widths = () => NAMES.map((name) => tab(name).getBoundingClientRect().width);
    for (const width of widths()) expect(width).toBeCloseTo((600 - 6 - 4) / 3, 0);
    expect(over(thumb, tab("Activity"))).toBe(true);
    // The parent resizes: it snaps along, without sliding.
    box.style.inlineSize = "450px";
    await expect.poll(() => over(thumb, tab("Activity"))).toBe(true);
    expect(transitions(thumb)).toEqual([]);
    for (const width of widths()) expect(width).toBeCloseTo((450 - 6 - 4) / 3, 0);
    // A class added later moves the tabs too.
    list.classList.remove("stretched");
    await expect.poll(() => over(thumb, tab("Activity"))).toBe(true);
    expect(list.getBoundingClientRect().width).toBeLessThan(450);
  });

  test("places the indicator under the active tab on mount, without sliding in", async () => {
    const { thumb, tab } = await mount(<Sample />);
    expect(over(thumb, tab("Activity"))).toBe(true);
    expect(getComputedStyle(thumb).opacity).toBe("1");
    expect(transitions(thumb)).toEqual([]);
  });

  test("a value that arrives after mount, as on hydration, appears in place", async () => {
    const { screen, thumb, tab } = await mount(<Sample value={null} />);
    expect(getComputedStyle(thumb).opacity).toBe("0");
    await screen.rerender(<Sample value="settings" />);
    await expect.poll(() => over(thumb, tab("Settings"))).toBe(true);
    expect(getComputedStyle(thumb).opacity).toBe("1");
    expect(transitions(thumb)).toEqual([]);
  });

  test("slides to the next tab by transform, and lands on it", async () => {
    const { thumb, tab } = await mount(<Sample />);
    tab("Settings").click();
    await expect.poll(() => transitions(thumb)).toEqual(["transform", "translate"]);
    expect(over(thumb, tab("Settings"))).toBe(false);
    await settle();
    expect(over(thumb, tab("Settings"))).toBe(true);
  });

  test("the active tab draws its own key on the server, until the indicator is placed", async () => {
    const html = renderToString(<Sample />);
    expect(html).toContain("data-active");
    expect(html).not.toContain("data-thumb");
    expect(html).toContain("Activity panel");
    const { list, tab } = await mount(<Sample />);
    const background = () => getComputedStyle(tab("Activity")).backgroundColor;
    expect(background()).toBe("rgba(0, 0, 0, 0)");
    // As in server-rendered HTML before hydration.
    list.removeAttribute("data-thumb");
    expect(background()).toBe(resolve("background-color", "var(--ow-raised-bg)"));
    expect(getComputedStyle(tab("Activity")).boxShadow).toBe(
      resolve("box-shadow", "var(--ow-raised-shadow)"),
    );
    expect(getComputedStyle(tab("Overview")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("presses in while held, the indicator with the active tab", async () => {
    const { thumb, tab } = await mount(<Sample />);
    const active = tab("Activity");
    active.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(active.hasAttribute("data-held")).toBe(true);
    expect(thumb.hasAttribute("data-held")).toBe(true);
    await expect.poll(() => getComputedStyle(thumb).scale).toBe("0.97");
    expect(getComputedStyle(active).scale).toBe("0.97");
    window.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
    await expect.poll(() => thumb.hasAttribute("data-held")).toBe(false);
    expect(active.hasAttribute("data-held")).toBe(false);
    await settle();
    expect(getComputedStyle(thumb).scale).toBe("none");

    // Holding another tab leaves the indicator as it is.
    const other = tab("Overview");
    other.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(other.hasAttribute("data-held")).toBe(true);
    expect(thumb.hasAttribute("data-held")).toBe(false);
    window.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
  });

  test("Glide lights the hovered tab along the list's axis, with no wiring", async () => {
    const hover = (list: Element, x: number, y: number) =>
      list.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: x,
          clientY: y,
          pointerType: "mouse",
        }),
      );
    const across = await mount(<Sample />);
    expect(across.list.querySelector(":scope > .ow-glide")).not.toBeNull();
    let box = across.tab("Settings").getBoundingClientRect();
    hover(across.list, box.left + 2, box.top + 2);
    expect(across.tab("Settings").hasAttribute("data-glide-active")).toBe(true);
    await expect
      .poll(() => getComputedStyle(across.tab("Settings")).color)
      .toBe(resolve("color", "var(--ow-fg)"));

    const down = await mount(<Sample orientation="vertical" />);
    box = down.tab("Settings").getBoundingClientRect();
    // Beside the tab, in the well's padding: only the y axis counts, so it is lit.
    hover(down.list, down.list.getBoundingClientRect().left + 1, box.top + 2);
    expect(down.tab("Settings").hasAttribute("data-glide-active")).toBe(true);
  });

  test("a disabled tab dims, is not lit, and does not pick", async () => {
    const { list, tab, shown } = await mount(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="Files">
          <Tabs.Tab value="a">A</Tabs.Tab>
          <Tabs.Tab value="b" disabled>
            B
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
      </Tabs.Root>,
    );
    const b = tab("B");
    expect(b.getAttribute("aria-disabled")).toBe("true");
    expect(b.hasAttribute("data-disabled")).toBe(true);
    expect(getComputedStyle(b).cursor).toBe("not-allowed");
    const box = b.getBoundingClientRect();
    list.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: box.left + 2,
        clientY: box.top + 2,
        pointerType: "mouse",
      }),
    );
    expect(b.hasAttribute("data-glide-active")).toBe(false);
    b.click();
    await Promise.resolve();
    expect(shown()).toEqual(["Panel A"]);
  });

  test("keyboard: arrows, Home, and End move focus, Space and Enter pick (FR-15)", async () => {
    const { tab, shown } = await mount(<Sample defaultValue="overview" />);
    tab("Overview").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("Activity"));
    expect(shown()).toEqual(["Overview panel"]);
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(tab("Settings"));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("Overview"));
    await userEvent.keyboard("{Home}{ArrowRight}");
    await userEvent.keyboard("{Enter}");
    await expect.poll(shown).toEqual(["Activity panel"]);
    await userEvent.keyboard("{ArrowRight} ");
    await expect.poll(shown).toEqual(["Settings panel"]);
    // Tab leaves for the panel, which the keyboard can reach.
    await userEvent.tab();
    expect(document.activeElement?.getAttribute("role")).toBe("tabpanel");
  });

  test("activateOnFocus picks as the arrows move; vertical uses the up and down arrows", async () => {
    const auto = await mount(<Sample defaultValue="overview" list={{ activateOnFocus: true }} />);
    auto.tab("Overview").focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(auto.shown).toEqual(["Activity panel"]);

    const down = await mount(<Sample defaultValue="overview" orientation="vertical" />);
    expect(down.list.getAttribute("aria-orientation")).toBe("vertical");
    down.tab("Overview").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(down.tab("Activity"));
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(down.tab("Overview"));
  });

  test("shows keyboard focus with a 2px ring inside the tab, from the focus token (FR-13)", async () => {
    await mount(<Sample />);
    await userEvent.tab();
    const tab = document.activeElement as HTMLElement;
    expect(tab.getAttribute("role")).toBe("tab");
    const style = getComputedStyle(tab);
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual([
      "solid",
      "2px",
      "-2px",
    ]);
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
    // The panel's sits outside it, and is the same ring.
    await userEvent.tab();
    const panel = getComputedStyle(document.activeElement as Element);
    expect([panel.outlineStyle, panel.outlineWidth, panel.outlineOffset]).toEqual([
      "solid",
      "2px",
      "2px",
    ]);
  });

  test("tabs that do not fit scroll sideways with no scrollbar, the indicator under its tab", async () => {
    const { list, thumb, tab } = await mount(<Long />);
    expect(list.getBoundingClientRect().width).toBeCloseTo(240, 0);
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    expect(list.scrollHeight).toBe(list.clientHeight);
    expect(list.offsetHeight - list.clientHeight).toBe(0);
    // Scrolled by hand, the indicator goes with its tab.
    list.scrollLeft = 120;
    expect(over(thumb, tab("component-a.tsx"))).toBe(true);
    // The keyboard brings the focused tab in, and the indicator lands on it.
    tab("component-a.tsx").focus();
    await userEvent.keyboard("{End}{Enter}");
    await expect.poll(() => list.scrollLeft).toBe(list.scrollWidth - list.clientWidth);
    await settle();
    expect(over(thumb, tab("component-f.tsx"))).toBe(true);
    // The new place resizes nothing; a scrolled list snaps right, too.
    list.style.fontSize = "13px";
    await expect.poll(() => over(thumb, tab("component-f.tsx"))).toBe(true);
    // The page does not widen.
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });

  test("a click on a tab the list's edge cuts brings it in, keeping the well's gap", async () => {
    const seen: string[] = [];
    const { list, tab } = await mount(<Long list={{ onClick: () => seen.push("click") }} />);
    const edge = list.getBoundingClientRect().right;
    const cut = tab("component-b.tsx");
    expect(cut.getBoundingClientRect().right).toBeGreaterThan(edge);
    cut.click();
    await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
    expect(edge - cut.getBoundingClientRect().right).toBeCloseTo(3, 0);
    // The list's own onClick still runs.
    expect(seen).toEqual(["click"]);
  });

  test("an active tab past the end is in view from the start", async () => {
    const { list, thumb, tab } = await mount(<Long defaultValue="f" />);
    await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
    const box = tab("component-f.tsx").getBoundingClientRect();
    expect(box.right).toBeLessThanOrEqual(list.getBoundingClientRect().right);
    expect(over(thumb, tab("component-f.tsx"))).toBe(true);
  });

  test("right to left: the first tab is on the right, under the indicator, and arrows follow (FR-16)", async () => {
    const { thumb, tab } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Sample defaultValue="overview" />
        </div>
      </DirectionProvider>,
    );
    const first = tab("Overview").getBoundingClientRect();
    expect(first.left).toBeGreaterThan(tab("Activity").getBoundingClientRect().left);
    expect(over(thumb, tab("Overview"))).toBe(true);
    tab("Overview").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tab("Activity"));
  });

  test("right to left, a list that scrolls keeps the indicator under its tab", async () => {
    const { list, thumb, tab } = await mount(<Long dir="rtl" />);
    expect(over(thumb, tab("component-a.tsx"))).toBe(true);
    list.scrollLeft = -120;
    expect(list.scrollLeft).toBe(-120);
    tab("component-c.tsx").click();
    await settle();
    expect(over(thumb, tab("component-c.tsx"))).toBe(true);
  });

  test("stays legible in forced colors: the active tab on a Highlight key (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { list, thumb, tab } = await mount(<Sample />);
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    expect(getComputedStyle(thumb).backgroundColor).toBe(resolve("color", "Highlight"));
    await expect
      .poll(() => getComputedStyle(tab("Activity")).color)
      .toBe(resolve("color", "HighlightText"));
    await expect
      .poll(() => getComputedStyle(tab("Overview")).color)
      .toBe(resolve("color", "CanvasText"));
    // The well's edge: an outline that forced colors paint.
    expect(getComputedStyle(list).outlineStyle).toBe("solid");
    expect(getComputedStyle(list).outlineColor).toBe(resolve("color", "CanvasText"));
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Sample />
        <Sample list={{ size: "sm", "aria-label": "Small" }} defaultValue="overview" />
        <Sample orientation="vertical" list={{ size: "lg", "aria-label": "Vertical" }} />
        <Tabs.Root defaultValue="a">
          <Tabs.List aria-label="Icons">
            <Tabs.Tab value="a" aria-label="List">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18M3 12h12M3 18h16" />
              </svg>
            </Tabs.Tab>
            <Tabs.Tab value="b" disabled>
              Disabled
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">Panel</Tabs.Panel>
        </Tabs.Root>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      // Labels change color with a short transition; axe reads the colors once they land.
      await settle();
      expect(await axeReport(screen.container), theme).toEqual({
        violations: [],
        contrastUnknown: [],
      });
    }
  });

  test("runs no rAF and no animations when idle, after a change too", async () => {
    const { tab } = await mount(<Sample />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    tab("Settings").click();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("with reduced motion, the indicator moves at once and does not press (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { thumb, tab } = await mount(<Sample />);
    tab("Settings").click();
    await expect.poll(() => over(thumb, tab("Settings"))).toBe(true);
    expect(transitions(thumb)).toEqual([]);
    const active = tab("Settings");
    active.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(thumb.hasAttribute("data-held")).toBe(true);
    expect(getComputedStyle(thumb).scale).toBe("none");
    expect(getComputedStyle(active).scale).toBe("none");
    window.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
  });
});
