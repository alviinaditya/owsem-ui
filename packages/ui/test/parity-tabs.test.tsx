import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Tabs as CssTabs } from "../src/components/tabs/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { Tabs as TwTabs } from "../src/tailwind/tabs/index";
import { type TabsSize, tabsListVariants, tabsSlots } from "../src/tailwind/tabs/tabs-variants";
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

// Tabs in Tailwind CSS v4 (src/tailwind/tabs, with thumb.ts of Toggle Group and Glide) against
// tabs.css and glide.css.

const SIZES: TabsSize[] = ["sm", "md", "lg"];
const ROOT_OVERRIDES = "gap-0 flex-col bg-red-500 opacity-100 text-red-500";
const LIST_OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm gap-0 p-0 opacity-100 outline-red-500 cursor-default duration-300 ease-linear overflow-visible";
const TAB_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 font-bold gap-0 cursor-default data-active:bg-green-500 data-active:text-red-500 data-disabled:opacity-100 focus-visible:outline-red-500";

const tw = tailwindParity(
  classNames(
    ...Object.values(tabsSlots),
    ...Object.values(glideSlots),
    ...SIZES.map((size) => tabsListVariants({ size })),
    ROOT_OVERRIDES,
    LIST_OVERRIDES,
    TAB_OVERRIDES,
    "data-active:text-green-500 data-active:bg-red-500",
  ),
);

// What these parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "translate",
  "transformOrigin",
  "forcedColorAdjust",
  "textOverflow",
  "marginInlineStart",
  "marginInlineEnd",
  "paddingInlineStart",
  "paddingInlineEnd",
  "overflowX",
  "overflowY",
  "scrollbarWidth",
  "scrollPaddingTop",
  "scrollPaddingLeft",
  "maxWidth",
  "maxHeight",
];
// The key of the indicator, and its press.
const pseudo = [...PSEUDO, "transform", "willChange", "forcedColorAdjust", "borderTopRightRadius"];

type Kit = typeof CssTabs;
const css: Kit = CssTabs;
const twind: Kit = TwTabs;

const Lines = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 6h16M4 12h10M4 18h13" />
  </svg>
);

interface TabsProps {
  kit: Kit;
  size?: TabsSize;
  value?: string;
  orientation?: "horizontal" | "vertical";
  /** What the tabs hold. */
  tabs?: "text" | "icons" | "both" | "many";
  /** The second tab is disabled. */
  one?: boolean;
  /** The root's size in px, so a list that does not fit scrolls. */
  width?: number;
  height?: number;
  rootClassName?: string;
  listClassName?: string;
  tabClassName?: string;
}

function Tabs({
  kit,
  size,
  value = "a",
  orientation,
  tabs = "text",
  one,
  width,
  height,
  rootClassName,
  listClassName,
  tabClassName,
}: TabsProps): ReactElement {
  const { Root, List, Tab, Panel } = kit;
  const names =
    tabs === "many" ? ["One", "Two", "Three", "Four", "Five", "Six"] : ["One", "Two", "Three"];
  const body = (text: string) =>
    tabs === "icons" ? (
      <Lines />
    ) : tabs === "both" ? (
      <>
        <Lines />
        {text}
      </>
    ) : (
      text
    );
  return (
    <Root
      defaultValue={value}
      orientation={orientation}
      className={rootClassName}
      style={{ inlineSize: width, blockSize: height }}
    >
      <List aria-label="Sections" size={size} className={listClassName}>
        {names.map((text, i) => (
          <Tab
            key={text}
            value={"abcdef"[i] as string}
            aria-label={tabs === "icons" ? text : undefined}
            disabled={one && i === 1 ? true : undefined}
            className={tabClassName}
          >
            {body(text)}
          </Tab>
        ))}
      </List>
      {names.map((text, i) => (
        <Panel key={text} value={"abcdef"[i] as string}>
          {text} panel
        </Panel>
      ))}
    </Root>
  );
}

const make = (name: string, tabs: Omit<TabsProps, "kit">): Case => ({
  name,
  css: <Tabs kit={css} {...tabs} />,
  tw: <Tabs kit={twind} {...tabs} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(size, { size })),
  make("default", {}),
  make("second selected", { value: "b" }),
  make("vertical", { orientation: "vertical" }),
  make("vertical, lg", { orientation: "vertical", size: "lg", value: "c" }),
  make("one disabled", { one: true }),
  make("one disabled and selected", { one: true, value: "b" }),
  make("icon only", { tabs: "icons" }),
  make("icon only, sm", { tabs: "icons", size: "sm" }),
  make("icon and label", { tabs: "both" }),
  make("overflow, scrolls sideways", { tabs: "many", width: 200, value: "d" }),
  make("overflow, scrolled to the middle", { tabs: "many", width: 200, value: "d" }),
  make("overflow, scrolled to the end", { tabs: "many", width: 200, value: "f" }),
  make("overflow, vertical", { tabs: "many", orientation: "vertical", height: 110, value: "d" }),
  make("overflow, vertical, scrolled", {
    tabs: "many",
    orientation: "vertical",
    height: 110,
    value: "d",
  }),
  make("a user's class", {
    rootClassName: "gap-0",
    listClassName: "gap-0 text-sm",
    tabClassName: "px-8",
  }),
  {
    name: "in a larger font",
    css: (
      <div style={{ fontSize: 24 }}>
        <Tabs kit={css} />
      </div>
    ),
    tw: (
      <div style={{ fontSize: 24 }}>
        <Tabs kit={twind} />
      </div>
    ),
  },
];

/** Scrolls the list as the case's name says. */
const scroll = (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  const list = side.querySelector<HTMLElement>("[data-slot=tabs-track]");
  if (!list) return;
  const toward = getComputedStyle(list).direction === "rtl" ? -1 : 1;
  if (name.includes("middle")) list.scrollLeft = 60 * toward;
  else if (name.includes("end")) list.scrollLeft = 1e6 * toward;
  else if (name.includes("vertical, scrolled")) list.scrollTop = 60;
};

// The moment before the script places the indicator: server-rendered HTML has no layout, and the
// active tab draws its own key.
const beforeIndicator = (side: Element) => {
  scroll(side);
  side.querySelector("[data-slot=tabs-track]")?.removeAttribute("data-thumb");
  side.querySelector("[data-slot=tabs-indicator]")?.removeAttribute("data-visible");
};

const tab = { target: "[role=tab][aria-selected=false]", props, pseudo, prepare: scroll };
const active = { target: "[role=tab][aria-selected=true]", props, pseudo, prepare: scroll };
const run = { props, pseudo, prepare: scroll };

describe("Tabs in Tailwind CSS v4 against tabs.css", () => {
  test("every size, layout, and state matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the icon margins and the scroll swap sides", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("before the indicator is placed, the active tab draws its own key", async () => {
    await tw.parity(cases, { ...run, prepare: beforeIndicator });
    await tw.parity(cases, { ...run, prepare: beforeIndicator, theme: "dark" });
  });

  test("Glide lights the hovered tab and not the active one", { timeout: 60_000 }, async () => {
    for (const name of [
      "md",
      "vertical",
      "icon only",
      "overflow, scrolls sideways",
      "vertical, lg",
    ]) {
      await tw.states(cases, name, "hover", tab);
    }
    await tw.states(cases, "md", "hover", { ...tab, theme: "dark" });
    await tw.states(cases, "md", "hover", { ...tab, dir: "rtl" });
    await tw.states(cases, "md", "hover", active);
  });

  test("a tab that Glide lights while active keeps its text color", async () => {
    // A skipped item keeps the active mark but shows no highlight.
    const lit = (side: Element) => {
      scroll(side);
      for (const el of side.querySelectorAll("[role=tab]:not([data-disabled])")) {
        el.setAttribute("data-glide-active", "");
      }
    };
    await tw.parity(cases, { ...run, prepare: lit });
    await setMedia("forced-colors");
    await tw.parity(cases, { ...run, prepare: lit });
  });

  test("a held press presses the tab in, and the indicator with it", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "vertical", "icon only", "overflow, scrolls sideways"]) {
      await tw.states(cases, name, "held", active);
      await tw.states(cases, name, "held", tab);
    }
  });

  test("keyboard focus draws the ring inside the tab, and on the panel", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "icon only", "vertical", "overflow, scrolls sideways"]) {
      await tw.states(cases, name, "focus", active);
    }
    await tw.states(cases, "md", "focus", { ...run, target: "[role=tabpanel]" });
    await tw.states(cases, "md", "focus", { ...run, target: "[role=tabpanel]", theme: "dark" });
  });

  test("forced colors match: the active tab is the highlight, disabled is gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, prepare: beforeIndicator });
    await tw.states(cases, "md", "hover", tab);
    await tw.states(cases, "md", "focus", active);
    await tw.states(cases, "md", "focus", { ...run, target: "[role=tabpanel]" });
    await tw.states(cases, "md", "held", active);
  });

  test("reduced motion matches: nothing slides or presses, a held indicator dims", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
    await tw.states(cases, "md", "held", active);
    await tw.states(cases, "md", "held", tab);
    await tw.states(cases, "md", "hover", tab);
  });

  test("a panel Base UI keeps a frame after its tab is left goes at once", async () => {
    const leaving = (side: Element) => {
      scroll(side);
      side.querySelector("[role=tabpanel]")?.setAttribute("data-ending-style", "");
    };
    await tw.parity(cases, { ...run, prepare: leaving });
  });

  test("more contrast changes nothing", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("transitions are the same: the indicator's travel, the tabs' colors", async () => {
    await tw.motion(cases, run);
  });

  test("transitions with the indicator's states on: held and instant", async () => {
    const one = cases.filter((c) => c.name === "md");
    const flag = (name: string) => (side: Element) => {
      side.querySelector("[data-slot=tabs-indicator]")?.setAttribute(`data-${name}`, "");
    };
    for (const name of ["held", "instant"]) {
      await tw.motion(one, { prepare: flag(name) });
      await tw.parity(one, { ...run, prepare: flag(name) });
    }
    await setMedia("reduced-motion");
    for (const name of ["held", "instant"]) {
      await tw.motion(one, { prepare: flag(name) });
      await tw.parity(one, { ...run, prepare: flag(name) });
    }
    await setMedia("forced-colors");
    for (const name of ["held", "instant"]) await tw.motion(one, { prepare: flag(name) });
  });

  test("a held press lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "md", "held", { ...active, props: motion, live: true });
    await tw.states(cases, "md", "held", { ...tab, props: motion, live: true });
  });
});

/** An element's box from the corner of its side. */
const boxOf = (side: Element, el: Element): number[] => {
  const a = side.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return [b.x - a.x, b.y - a.y, b.width, b.height];
};
const within = (a: number[], b: number[], tol = 0.02) =>
  a.every((n, i) => Math.abs(n - (b[i] as number)) <= tol);

describe("Tabs in Tailwind CSS v4 behaves as in CSS", () => {
  test("the indicator lands on the active tab, in the same box as in the CSS flavor", {
    timeout: 60_000,
  }, async () => {
    const wanted = ["md", "vertical", "lg", "icon only", "overflow, scrolled to the end"];
    const screen = await tw.mount(
      cases.filter((c) => wanted.includes(c.name)),
      run,
    );
    for (const name of wanted) {
      const row = screen.container.querySelector(`[data-case="${name}"]`);
      const boxes = [];
      for (const flavor of ["css", "tw"]) {
        const side = row?.querySelector(`[data-side=${flavor}]`) as Element;
        const indicator = side.querySelector("[data-slot=tabs-indicator]") as Element;
        const on = side.querySelector("[role=tab][aria-selected=true]") as Element;
        expect(indicator.hasAttribute("data-visible"), name).toBe(true);
        // The indicator reaches 4px past the tab: the well's padding, as a clear border.
        const [x, y, w, h] = boxOf(side, indicator) as [number, number, number, number];
        expect(within([x + 4, y + 4, w - 8, h - 8], boxOf(side, on)), `${name} ${flavor}`).toBe(
          true,
        );
        boxes.push(boxOf(side, indicator));
      }
      expect(within(boxes[0] as number[], boxes[1] as number[]), name).toBe(true);
    }
  });

  test("a click moves the indicator to the new tab, where the CSS flavor puts it", async () => {
    const screen = await tw.mount(cases.filter((c) => c.name === "md"));
    const row = screen.container.querySelector('[data-case="md"]');
    const boxes = [];
    for (const flavor of ["css", "tw"]) {
      const side = row?.querySelector(`[data-side=${flavor}]`) as Element;
      const tabs = [...side.querySelectorAll("[role=tab]")];
      await userEvent.click(tabs[2] as Element);
      await expect.poll(() => tabs[2]?.getAttribute("aria-selected")).toBe("true");
      await expect
        .poll(() => {
          const indicator = side.querySelector("[data-slot=tabs-indicator]") as Element;
          const [x, , w] = boxOf(side, indicator);
          const [tx, , tw] = boxOf(side, tabs[2] as Element);
          return within([(x as number) + 4, (w as number) - 8], [tx as number, tw as number]);
        })
        .toBe(true);
      boxes.push(boxOf(side, side.querySelector("[data-slot=tabs-indicator]") as Element));
    }
    expect(within(boxes[0] as number[], boxes[1] as number[])).toBe(true);
  });

  test("a click on a tab the list's edge cuts brings it in, as in CSS", async () => {
    const screen = await tw.mount(cases.filter((c) => c.name === "overflow, scrolls sideways"));
    const row = screen.container.querySelector('[data-case="overflow, scrolls sideways"]');
    const scrolled = [];
    for (const flavor of ["css", "tw"]) {
      const side = row?.querySelector(`[data-side=${flavor}]`) as Element;
      const list = side.querySelector("[data-slot=tabs-track]") as HTMLElement;
      const tabs = [...side.querySelectorAll("[role=tab]")];
      expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
      list.scrollLeft = 0;
      await frame();
      await userEvent.click(tabs[5] as Element, { force: true });
      await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
      await frame();
      scrolled.push(list.scrollLeft);
    }
    expect(Math.abs((scrolled[0] as number) - (scrolled[1] as number))).toBeLessThanOrEqual(0.5);
  });

  test("the list scrolls without a scrollbar, and keeps the well's gap to the edge", async () => {
    tw.load();
    const screen = await render(<Tabs kit={twind} tabs="many" width={200} />);
    const list = screen.container.querySelector<HTMLElement>("[data-slot=tabs-track]");
    if (!list) throw new Error("not rendered");
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    expect(list.offsetWidth).toBe(200);
    expect(getComputedStyle(list).scrollbarWidth).toBe("none");
    // Clear of the fade and its button, which is 2em of the 14px list wide.
    await expect.poll(() => getComputedStyle(list).scrollPaddingLeft).toBe("28px");
  });

  test("Glide lights the hovered tab in the Tailwind flavor", async () => {
    tw.load();
    const screen = await render(<Tabs kit={twind} />);
    const list = screen.container.querySelector<HTMLElement>("[data-slot=tabs-track]");
    if (!list) throw new Error("not rendered");
    const tabs = [...list.querySelectorAll("[role=tab]")];
    const highlight = list.querySelector<HTMLElement>("[data-slot=glide]");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    list.removeAttribute("data-glide");
    expect(getComputedStyle(list).position).toBe("relative");
    expect(getComputedStyle(list).isolation).toBe("isolate");
    await userEvent.hover(tabs[1] as Element);
    expect(tabs[1]?.hasAttribute("data-glide-active")).toBe(true);
    expect(highlight?.hasAttribute("data-visible")).toBe(true);
    // The active tab is not lit.
    await userEvent.hover(tabs[0] as Element);
    expect(highlight?.hasAttribute("data-visible")).toBe(false);
  });

  test("the rendered Tailwind tree holds no class of the CSS flavor", async () => {
    tw.load();
    const screen = await render(<Tabs kit={twind} tabs="text" />);
    const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
      el.className.split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(10);
    expect(screen.container.querySelector("[data-slot=tabs-label]")).not.toBeNull();
  });
});

describe("className on Tabs in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on the root", async () => {
    tw.load();
    const screen = await render(<Tabs kit={twind} rootClassName={ROOT_OVERRIDES} />);
    const root = screen.container.querySelector("[data-slot=tabs]");
    if (!root) throw new Error("not rendered");
    expectStyles(root, {
      columnGap: "0px",
      rowGap: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      opacity: "1",
      color: "oklch(0.637 0.237 25.331)",
    });
  });

  test("a user's utilities beat the component's, on the list", async () => {
    tw.load();
    const screen = await render(<Tabs kit={twind} listClassName={LIST_OVERRIDES} />);
    const list = screen.container.querySelector("[data-slot=tabs-list]");
    if (!list) throw new Error("not rendered");
    expectStyles(list, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      columnGap: "0px",
      paddingTop: "0px",
      opacity: "1",
      cursor: "default",
      outlineColor: "oklch(0.637 0.237 25.331)",
      transitionDuration: "0.3s",
      overflowX: "visible",
    });
  });

  test("a user's utilities beat the component's, on a tab", async () => {
    tw.load();
    const screen = await render(<Tabs kit={twind} tabClassName={TAB_OVERRIDES} one />);
    const [first, second] = [...screen.container.querySelectorAll("[role=tab]")];
    if (!first || !second) throw new Error("not rendered");
    expectStyles(first, {
      borderTopLeftRadius: "0px",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
      columnGap: "0px",
      cursor: "default",
    });
    expectStyles(second, { opacity: "1" });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    tw.load();
    const screen = await render(
      <Tabs kit={twind} tabClassName="data-active:text-green-500 data-active:bg-red-500" />,
    );
    const on = screen.container.querySelector("[role=tab][aria-selected=true]");
    if (!on) throw new Error("not rendered");
    expectStyles(on, {
      color: "oklch(0.723 0.219 149.579)",
      backgroundColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("tabsListVariants() and the slots merge with a className, the user's last", () => {
    const merged = cn(tabsListVariants({ size: "sm" }), "rounded-none p-0 text-lg gap-0");
    expect(merged).toContain("text-lg");
    expect(merged).toContain("rounded-none");
    expect(merged).not.toContain("text-[13px]");
    expect(merged.split(" ")).not.toContain("p-(--_inset)");
    expect(merged).not.toContain("gap-[2px]");
    expect(cn(tabsSlots.root, "gap-0")).not.toContain("gap-[0.75em]");
    expect(cn(tabsSlots.tab, "px-8 rounded-none")).not.toContain("px-(--px)");
    expect(cn(tabsSlots.tab, "px-8 rounded-none")).not.toContain("rounded-(--_radius)");
    expect(cn(tabsSlots.panel, "rounded-none")).not.toContain("rounded-(--ow-radius)");
    expect(cn(tabsSlots.indicator, "opacity-100")).not.toContain(" opacity-0");
  });
});
