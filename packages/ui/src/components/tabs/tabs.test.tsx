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

/** More tabs than fit in 220px. */
function Long({
  dir,
  list,
  ...props
}: Partial<Tabs.Root.Props> & { dir?: "ltr" | "rtl"; list?: Partial<Tabs.List.Props> }) {
  return (
    <div dir={dir} style={{ inlineSize: 220 }}>
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
  // The track holds the tabs and scrolls; the list around it is the well.
  const list = screen.container.querySelector<HTMLElement>(".ow-tabs__track");
  const well = screen.container.querySelector<HTMLElement>(".ow-tabs__list");
  const thumb = screen.container.querySelector<HTMLElement>(".ow-tabs__indicator");
  if (!list || !well || !thumb) throw new Error("not mounted");
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
  return { screen, list, well, thumb, tab, shown };
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

/** The indicator's accent tint over the raised fill, and the active tab's text. */
const TRACK = "color-mix(in oklab, var(--ow-fg) 6%, transparent)";
const TINT = "color-mix(in oklab, var(--ow-accent) 14%, var(--ow-raised-bg))";
const ON = "color-mix(in oklab, var(--ow-accent) 70%, var(--ow-fg))";

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
      tab: createRef<HTMLButtonElement>(),
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
          <Tabs.Tab ref={refs.tab} value="a" className="on" style={{ marginInline: "3px" }}>
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
    expect(refs.list.current?.className).toBe("ow-tabs__list ow-tabs__list--md mine-list");
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

  test("draws a tinted list, an accent-tint key, and quiet tabs from the theme tokens, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { screen, well: wellEl, thumb, tab } = await mount(<Sample />);
    const panel = screen.container.querySelector(".ow-tabs__panel") as Element;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const well = getComputedStyle(wellEl);
      expect(well.backgroundColor, theme).toBe(resolve("background-color", TRACK));
      // A list that is a tint of the text color, with no shadow, and a tinted key with no edge.
      expect(well.boxShadow, theme).toBe("none");
      const key = getComputedStyle(thumb, "::before");
      expect(key.content, theme).toBe('""');
      expect(key.backgroundColor, theme).toBe(resolve("background-color", TINT));
      expect(getComputedStyle(thumb).boxShadow, theme).toBe("none");
      // Labels change color with a short transition.
      await expect
        .poll(() => getComputedStyle(tab("Activity")).color, { message: theme })
        .toBe(resolve("color", ON));
      await expect
        .poll(() => getComputedStyle(tab("Overview")).color, { message: theme })
        .toBe(resolve("color", "var(--ow-muted)"));
      expect(getComputedStyle(tab("Activity")).backgroundColor, theme).toBe("rgba(0, 0, 0, 0)");
      expect(getComputedStyle(panel).color, theme).toBe(resolve("color", "var(--ow-fg)"));
    }
  });

  test("a theme token set on the root or a part changes it alone (TK-9)", async () => {
    const { well, thumb, tab } = await mount(
      <>
        <Sample
          style={
            {
              "--ow-accent": "rgb(1, 2, 3)",
              "--ow-fg": "rgb(4, 5, 6)",
              "--ow-muted": "rgb(7, 8, 9)",
            } as CSSProperties
          }
        />
        <Sample />
      </>,
    );
    expect(getComputedStyle(well).backgroundColor).toBe(resolve("background-color", TRACK, well));
    expect(getComputedStyle(well).backgroundColor).not.toBe(resolve("background-color", TRACK));
    expect(getComputedStyle(thumb, "::before").backgroundColor).toBe(
      resolve("background-color", TINT, well),
    );
    expect(getComputedStyle(tab("Overview")).color).toBe("rgb(7, 8, 9)");
    const lists = document.querySelectorAll(".ow-tabs__list");
    expect(getComputedStyle(lists[1] as Element).backgroundColor).toBe(
      resolve("background-color", TRACK),
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
    expect(Number.parseFloat(style(".mine-tab").paddingBlockStart)).toBeCloseTo(10.36, 1);
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
    expect(well.right - end).toBeCloseTo(4, 0);
    expect(getComputedStyle(list).margin).toBe("0px");
    expect(getComputedStyle(list.parentElement as Element).margin).toBe("0px");
  });

  test("stretched with plain CSS, with equal tabs by className, the indicator follows", async () => {
    sheet(`
      .stretched { inline-size: 100%; }
      .stretched .ow-tabs__tab { flex: 1; }
    `);
    const {
      screen,
      well: list,
      thumb,
      tab,
    } = await mount(
      <div className="box" style={{ inlineSize: 600 }}>
        <Sample list={{ className: "stretched" }} />
      </div>,
    );
    const box = screen.container.querySelector(".box") as HTMLElement;
    expect(list.getBoundingClientRect().width).toBeCloseTo(600, 0);
    const widths = () => NAMES.map((name) => tab(name).getBoundingClientRect().width);
    for (const width of widths()) expect(width).toBeCloseTo((600 - 8 - 4) / 3, 0);
    expect(over(thumb, tab("Activity"))).toBe(true);
    // The parent resizes: it snaps along, without sliding.
    box.style.inlineSize = "450px";
    await expect.poll(() => over(thumb, tab("Activity"))).toBe(true);
    expect(transitions(thumb)).toEqual([]);
    for (const width of widths()) expect(width).toBeCloseTo((450 - 8 - 4) / 3, 0);
    // A class added later moves the tabs too.
    list.classList.remove("stretched");
    await expect.poll(() => over(thumb, tab("Activity"))).toBe(true);
    expect(list.getBoundingClientRect().width).toBeLessThan(450);
  });

  test("stretches the indicator's key along the way, and settles back to rest", async () => {
    const { thumb, tab } = await mount(<Sample />);
    const stretches = () =>
      thumb
        .getAnimations({ subtree: true })
        .filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement === "::before");
    expect(stretches()).toEqual([]);
    tab("Settings").click();
    // Read the frames inside the poll: the stretch may be over by the next look.
    let frames: Keyframe[] = [];
    await expect
      .poll(() => {
        const [stretch, ...others] = stretches();
        if (stretch) frames = (stretch.effect as KeyframeEffect).getKeyframes();
        return stretch ? 1 + others.length : 0;
      })
      .toBe(1);
    expect(frames.every((f) => f.transformOrigin === "100% 50%")).toBe(true);
    expect(frames.map((f) => f.transform)[1]).toMatch(/^scale\(1\.[1-3]\d*, 1\)$/);
    await expect.poll(() => stretches().length).toBe(0);
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
    expect(background()).toBe(resolve("background-color", TINT));
    expect(getComputedStyle(tab("Activity")).boxShadow).toBe("none");
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
    expect(down.well.getAttribute("aria-orientation")).toBe("vertical");
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
    expect(list.getBoundingClientRect().width).toBeCloseTo(220, 0);
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
    // It clears the fade and the button over it.
    expect(edge - cut.getBoundingClientRect().right).toBeCloseTo(
      Number.parseFloat(getComputedStyle(list).scrollPaddingRight),
      0,
    );
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
    const { well, thumb, tab } = await mount(<Sample />);
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    expect(getComputedStyle(thumb, "::before").backgroundColor).toBe(resolve("color", "Highlight"));
    await expect
      .poll(() => getComputedStyle(tab("Activity")).color)
      .toBe(resolve("color", "HighlightText"));
    await expect
      .poll(() => getComputedStyle(tab("Overview")).color)
      .toBe(resolve("color", "CanvasText"));
    // The well's edge: an outline that forced colors paint.
    expect(getComputedStyle(well).outlineStyle).toBe("solid");
    expect(getComputedStyle(well).outlineColor).toBe(resolve("color", "CanvasText"));
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

  test("Glide's highlight never shows on the active tab, nor slides out from under the indicator", async () => {
    const screen = await render(<Sample />);
    await settle();
    const list = screen.container.querySelector<HTMLElement>(".ow-tabs__track") as HTMLElement;
    const glide = list.querySelector<HTMLElement>(":scope > .ow-glide") as HTMLElement;
    const tab = (name: string) => screen.getByRole("tab", { name }).element() as HTMLElement;
    // Over the active tab it stays hidden.
    await userEvent.hover(tab("Activity"));
    await settle();
    expect(glide.hasAttribute("data-visible")).toBe(false);
    // Over another tab it shows.
    await userEvent.hover(tab("Overview"));
    await expect.poll(() => glide.hasAttribute("data-visible")).toBe(true);
    // Picking that tab takes the highlight away: it is the indicator's now.
    await userEvent.click(tab("Overview"));
    await expect.poll(() => glide.hasAttribute("data-visible")).toBe(false);
    // From there it appears at the next tab in place, with no slide from the picked one.
    await userEvent.hover(tab("Settings"));
    await expect.poll(() => glide.hasAttribute("data-visible")).toBe(true);
    const moving = glide
      .getAnimations()
      .filter((a) => a instanceof CSSTransition && a.transitionProperty === "transform");
    expect(moving).toEqual([]);
    const at = tab("Settings").getBoundingClientRect();
    const lit = glide.getBoundingClientRect();
    expect(Math.abs(lit.left - at.left)).toBeLessThan(1);
  });
});

test("every part has its data-slot", async () => {
  const screen = await render(
    <Tabs.Root defaultValue="a">
      <Tabs.List aria-label="T">
        <Tabs.Tab value="a">A</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">A</Tabs.Panel>
    </Tabs.Root>,
  );
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "tabs",
    "tabs-list",
    "tabs-track",
    "glide",
    "tabs-indicator",
    "tabs-tab",
    "tabs-label",
    "tabs-scroll-button",
    "tabs-scroll-button",
    "tabs-panel",
  ]);
});

describe("Tabs that overflow", () => {
  const buttons = (well: HTMLElement) => ({
    start: well.querySelector<HTMLElement>('[data-slot="tabs-scroll-button"][data-edge="start"]'),
    end: well.querySelector<HTMLElement>('[data-slot="tabs-scroll-button"][data-edge="end"]'),
  });
  const shows = (el: HTMLElement | null) =>
    !!el && getComputedStyle(el).visibility === "visible" && getComputedStyle(el).opacity === "1";
  const masked = (el: Element) => getComputedStyle(el).maskImage !== "none";

  test("tabs that fit show no buttons and no fade", async () => {
    const { list, well } = await mount(<Sample />);
    expect(list.hasAttribute("data-overflow-start")).toBe(false);
    expect(list.hasAttribute("data-overflow-end")).toBe(false);
    expect(masked(list)).toBe(false);
    expect(shows(buttons(well).start)).toBe(false);
    expect(shows(buttons(well).end)).toBe(false);
  });

  test("buttons and the fade show only at the ends with more, and follow the scroll", async () => {
    const { list, well } = await mount(<Long />);
    const { start, end } = buttons(well);
    await expect.poll(() => shows(end)).toBe(true);
    expect(shows(start)).toBe(false);
    expect(list.hasAttribute("data-overflow-end")).toBe(true);
    expect(list.hasAttribute("data-overflow-start")).toBe(false);
    expect(masked(list)).toBe(true);
    list.scrollLeft = 80;
    await expect.poll(() => shows(start)).toBe(true);
    expect(shows(end)).toBe(true);
    list.scrollLeft = list.scrollWidth;
    await expect.poll(() => shows(end)).toBe(false);
    expect(shows(start)).toBe(true);
    expect(list.hasAttribute("data-overflow-end")).toBe(false);
  });

  test("the fade covers an end only as far as the button, and the tabs below it stay whole", async () => {
    const { list, well } = await mount(<Long />);
    await expect.poll(() => masked(list)).toBe(true);
    const fade = Number.parseFloat(getComputedStyle(well).getPropertyValue("--_fade")) || 0;
    // 2em of the list's 14px.
    expect(fade).toBeGreaterThan(0);
    const button = buttons(well).end as HTMLElement;
    expect(button.getBoundingClientRect().width).toBeCloseTo(
      Number.parseFloat(getComputedStyle(button).width),
      1,
    );
    expect(getComputedStyle(list).maskImage).toContain("linear-gradient");
  });

  test("a button scrolls by about a page, smoothly, and the indicator stays on its tab", async () => {
    const { list, well, thumb, tab } = await mount(<Long />);
    await expect.poll(() => shows(buttons(well).end)).toBe(true);
    const page = list.clientWidth - tab("component-a.tsx").offsetWidth;
    buttons(well).end?.click();
    await expect.poll(() => list.scrollLeft).toBeGreaterThan(page - 2);
    await expect
      .poll(() => list.scrollLeft)
      .toBeLessThanOrEqual(list.scrollWidth - list.clientWidth);
    expect(over(thumb, tab("component-a.tsx"))).toBe(true);
    const at = list.scrollLeft;
    buttons(well).start?.click();
    await expect.poll(() => list.scrollLeft).toBeLessThan(at);
    expect(over(thumb, tab("component-a.tsx"))).toBe(true);
  });

  test("with reduced motion a button scrolls at once", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { list, well } = await mount(<Long />);
    await expect.poll(() => shows(buttons(well).end)).toBe(true);
    buttons(well).end?.click();
    expect(list.scrollLeft).toBeGreaterThan(0);
    expect(getComputedStyle(buttons(well).end as Element).transitionDuration).toBe("0s");
  });

  test("the buttons are decorative: hidden from the tree and out of the tab order", async () => {
    const { well, tab, screen } = await mount(<Long />);
    for (const el of Object.values(buttons(well))) {
      expect(el?.getAttribute("aria-hidden")).toBe("true");
      expect(el?.tabIndex).toBe(-1);
    }
    // The tabs stay the keyboard's; Tab leaves the list without stopping on a button.
    tab("component-a.tsx").focus();
    await userEvent.tab();
    expect(well.contains(document.activeElement)).toBe(false);
    await expect.element(screen.getByRole("tab", { name: "component-a.tsx" })).toBeVisible();
    // A press on a button does not take the focus from the tab.
    tab("component-a.tsx").focus();
    buttons(well).end?.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(tab("component-a.tsx"));
  });

  test("scrollButtons={false} keeps the fade and draws no buttons", async () => {
    const { list, well } = await mount(<Long list={{ scrollButtons: false }} />);
    expect(well.querySelector('[data-slot="tabs-scroll-button"]')).toBeNull();
    await expect.poll(() => masked(list)).toBe(true);
  });

  test("a vertical wheel turns a horizontal list until it runs out, then the page gets it", async () => {
    const { list } = await mount(<Long />);
    const wheel = (deltaY: number) => {
      const event = new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true });
      list.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(wheel(60)).toBe(true);
    expect(list.scrollLeft).toBe(60);
    expect(wheel(-20)).toBe(true);
    expect(list.scrollLeft).toBe(40);
    list.scrollLeft = 0;
    expect(wheel(-20)).toBe(false);
    list.scrollLeft = list.scrollWidth;
    expect(wheel(20)).toBe(false);
    // A sideways wheel is the browser's own.
    const sideways = new WheelEvent("wheel", {
      deltaX: 40,
      deltaY: 2,
      bubbles: true,
      cancelable: true,
    });
    list.scrollLeft = 10;
    list.dispatchEvent(sideways);
    expect(sideways.defaultPrevented).toBe(false);
  });

  test("a wheel on tabs that fit is left to the page", async () => {
    const { list } = await mount(<Sample />);
    const event = new WheelEvent("wheel", { deltaY: 60, bubbles: true, cancelable: true });
    list.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  test("picking another tab brings it into view, clear of the fade", async () => {
    function Controlled({ value }: { value: string }) {
      return (
        <div style={{ inlineSize: 220 }}>
          <Tabs.Root value={value}>
            <Tabs.List aria-label="Files">
              {["a", "b", "c", "d", "e", "f"].map((name) => (
                <Tabs.Tab key={name} value={name}>{`component-${name}.tsx`}</Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.Root>
        </div>
      );
    }
    const screen = await render(<Controlled value="a" />);
    const list = screen.container.querySelector(".ow-tabs__track") as HTMLElement;
    await screen.rerender(<Controlled value="f" />);
    await expect.poll(() => list.scrollLeft).toBe(list.scrollWidth - list.clientWidth);
  });

  test("right to left: the start button is on the right and scrolling goes the other way", async () => {
    const { list, well } = await mount(<Long dir="rtl" />);
    const { start, end } = buttons(well);
    await expect.poll(() => shows(end)).toBe(true);
    expect(start?.getBoundingClientRect().left).toBeGreaterThan(
      (end as HTMLElement).getBoundingClientRect().left,
    );
    expect(getComputedStyle(list).maskImage).toContain("to left");
    end?.click();
    await expect.poll(() => list.scrollLeft).toBeLessThan(-100);
    await expect.poll(() => shows(start)).toBe(true);
    // The chevron turns round with the writing.
    expect(getComputedStyle(end?.firstElementChild as Element).scale).toBe("-1 1");
  });

  test("vertical: the buttons sit at the top and bottom, and the list scrolls down and up", async () => {
    const screen = await render(
      <div style={{ blockSize: 120, display: "flex" }}>
        <Tabs.Root defaultValue="a" orientation="vertical">
          <Tabs.List aria-label="Files">
            {["a", "b", "c", "d", "e", "f"].map((name) => (
              <Tabs.Tab key={name} value={name}>{`component-${name}.tsx`}</Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
      </div>,
    );
    const list = screen.container.querySelector(".ow-tabs__track") as HTMLElement;
    const well = screen.container.querySelector(".ow-tabs__list") as HTMLElement;
    const { start, end } = buttons(well);
    await expect.poll(() => shows(end)).toBe(true);
    expect(shows(start)).toBe(false);
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    // Down the block axis: the default direction, so no "to right" or "to left".
    expect(getComputedStyle(list).maskImage).not.toMatch(/to (left|right)|90deg|270deg/);
    expect(end?.getBoundingClientRect().top).toBeGreaterThan(
      (start as HTMLElement).getBoundingClientRect().top,
    );
    expect(list.offsetWidth - list.clientWidth).toBe(0);
    end?.click();
    await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
    await expect.poll(() => shows(start)).toBe(true);
    // The chevrons point up and down, not turned with the writing.
    expect(getComputedStyle(start?.firstElementChild as Element).scale).toBe("none");
  });

  test("the well keeps its own edge: the fade cuts the tabs, not the well", async () => {
    const { list, well } = await mount(<Long />);
    await expect.poll(() => masked(list)).toBe(true);
    expect(masked(well)).toBe(false);
    expect(getComputedStyle(well).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });
});
