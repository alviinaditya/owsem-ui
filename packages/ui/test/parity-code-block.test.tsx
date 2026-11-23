import type { ReactElement } from "react";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { CodeBlock as CssCodeBlock } from "../src/components/code-block/index";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { codeBlockSlots } from "../src/tailwind/code-block/code-block-variants";
import { CodeBlock as TwCodeBlock } from "../src/tailwind/code-block/index";
import { copyButtonSlots } from "../src/tailwind/copy-button/copy-button-variants";
import { iconMorphSlots } from "../src/tailwind/icon-morph/icon-morph-variants";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { tooltipSlots } from "../src/tailwind/tooltip/tooltip-variants";
import {
  type Accepted,
  BUTTON_RIPPLE,
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Code Block in Tailwind CSS v4 (src/tailwind/code-block, with Copy Button, Icon Morph, thumb.ts,
// and Glide) against code-block.css and glide.css.

const ROOT_OVERRIDES = "rounded-none bg-red-500 text-red-500 gap-0 opacity-100";
const TAB_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 font-bold cursor-default data-active:bg-green-500 data-active:text-red-500 focus-visible:outline-red-500";
const PANEL_OVERRIDES = "rounded-none bg-red-500 text-red-500 text-sm overflow-visible";

const FOCUS_GUARDS: Accepted = {
  what: /^box [xy]$/,
  part: / span$/,
  reason: "Base UI's focus guards are fixed with no offsets, so they sit in each side's own box.",
};

const STATUS: Accepted = {
  what: /^(left|right)$/,
  part: /copy-button-status/,
  reason:
    "An absolute box without offsets sits where it would flow, so its offsets from the page differ with where each side is.",
};

const tw = tailwindParity(
  classNames(
    ...Object.values(codeBlockSlots),
    ...Object.values(copyButtonSlots),
    ...Object.values(buttonSlots),
    ...Object.values(iconMorphSlots),
    ...Object.values(tooltipSlots),
    ...Object.values(glideSlots),
    ...(["sm", "md"] as const).flatMap((size) => [
      buttonVariants({ size }),
      buttonVariants({ size, variant: "ghost" }),
      buttonVariants({ size, variant: "secondary" }),
    ]),
    ROOT_OVERRIDES,
    TAB_OVERRIDES,
    PANEL_OVERRIDES,
    "data-active:text-green-500 data-active:bg-red-500",
  ),
  [BUTTON_RIPPLE, FOCUS_GUARDS, STATUS],
);

// What the block's parts draw that PROPS leaves out.
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
  "scrollbarColor",
  "direction",
  "tabSize",
  "maxWidth",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "textAlign",
  "visibility",
];
// The key of the thumb, and its press.
const pseudo = [...PSEUDO, "transform", "willChange", "forcedColorAdjust", "borderTopRightRadius"];

type Kit = typeof CssCodeBlock;
const css: Kit = CssCodeBlock;
const twind: Kit = TwCodeBlock;

const Glyph = ({ name }: { name: string }) => (
  <svg
    data-icon={name}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r={name === "b" ? 5 : 9} />
  </svg>
);

const SHORT = "export const answer = 42;";
const LONG = `${"const veryLongName = someFunction(argumentOne, argumentTwo, argumentThree);".repeat(4)}\nreturn veryLongName;`;
const TALL = "line one\nline two\nline three\nline four\nline five\nline six";

interface BlockProps {
  kit: Kit;
  /** Which snippets: one with a Title, or tabs. */
  tabs?: boolean | "many" | "plain";
  value?: string;
  icon?: boolean;
  title?: string;
  code?: string;
  width?: number;
  one?: boolean;
  /** The second snippet is taller than the others. */
  tall?: boolean;
  copy?: boolean;
  rootClassName?: string;
  tabClassName?: string;
  panelClassName?: string;
}

function Block({
  kit,
  tabs,
  value = "a",
  icon = true,
  title = "answer.ts",
  code = SHORT,
  width = 420,
  one,
  tall,
  copy = true,
  rootClassName,
  tabClassName,
  panelClassName,
}: BlockProps): ReactElement {
  const { Root, Header, Title, List, Tab, Panel, Copy } = kit;
  if (!tabs) {
    return (
      <Root style={{ inlineSize: width }} className={rootClassName}>
        <Header>
          <Title icon={icon ? <Glyph name="ts" key="ts" /> : undefined}>{title}</Title>
          {copy ? <Copy timeout={60_000} /> : null}
        </Header>
        <Panel className={panelClassName}>
          <pre>
            <code>{code}</code>
          </pre>
        </Panel>
      </Root>
    );
  }
  const names = tabs === "many" ? ["alpha", "beta", "gamma", "delta", "epsilon"] : ["a", "b", "c"];
  return (
    <Root defaultValue={value} style={{ inlineSize: width }} className={rootClassName}>
      <Header>
        <List aria-label="Snippets">
          {names.map((name, i) => (
            <Tab
              key={name}
              value={name}
              icon={tabs === "plain" ? undefined : <Glyph name={name} />}
              disabled={one && i === 1 ? true : undefined}
              className={tabClassName}
            >
              {name}
            </Tab>
          ))}
        </List>
        {copy ? <Copy timeout={60_000} /> : null}
      </Header>
      {names.map((name, i) => (
        <Panel key={name} value={name} className={panelClassName}>
          <pre>
            <code>{tall && i === 1 ? TALL : code}</code>
          </pre>
        </Panel>
      ))}
    </Root>
  );
}

const make = (name: string, block: Omit<BlockProps, "kit">): Case => ({
  name,
  css: <Block kit={css} {...block} />,
  tw: <Block kit={twind} {...block} />,
});

const cases: Case[] = [
  make("single", {}),
  make("single, no icon", { icon: false }),
  make("single, no copy", { copy: false }),
  make("single, a long title is cut", {
    title: "a-very-long-file-name-that-does-not-fit.config.ts",
    width: 200,
  }),
  make("single, long code", { code: LONG }),
  make("single, tall", { code: TALL }),
  make("tabs", { tabs: true }),
  make("tabs, second", { tabs: true, value: "b" }),
  make("tabs, third", { tabs: true, value: "c" }),
  make("tabs, no icons", { tabs: "plain" }),
  make("tabs, one disabled", { tabs: true, one: true }),
  make("tabs, one disabled and active", { tabs: true, one: true, value: "b" }),
  make("tabs, long code", { tabs: true, code: LONG }),
  make("tabs, a taller second", { tabs: true, tall: true }),
  make("tabs, no copy", { tabs: true, copy: false }),
  make("tabs, overflow", { tabs: "many", width: 260, value: "delta" }),
  make("tabs, overflow, scrolled to the end", { tabs: "many", width: 260, value: "epsilon" }),
  make("a user's class", {
    tabs: true,
    rootClassName: ROOT_OVERRIDES,
    tabClassName: "rounded-none px-8 py-1 font-bold cursor-default",
    panelClassName: "rounded-none overflow-visible",
  }),
  {
    name: "in a larger font",
    css: (
      <div style={{ fontSize: 22 }}>
        <Block kit={css} tabs />
      </div>
    ),
    tw: (
      <div style={{ fontSize: 22 }}>
        <Block kit={twind} tabs />
      </div>
    ),
  },
];

/** Scrolls the list of the cases that say so, and copies in the ones that start with "copied". */
const prepare = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  const list = side.querySelector<HTMLElement>("[data-slot=code-block-list]");
  if (list && name.includes("scrolled")) {
    list.scrollLeft = (getComputedStyle(list).direction === "rtl" ? -1 : 1) * 1e6;
  }
  if (name.startsWith("copied")) {
    const button = side.querySelector<HTMLElement>("[data-slot=code-block-copy]");
    if (!button) throw new Error("no button");
    button.click();
    await vi.waitFor(() => expect(button.hasAttribute("data-copied")).toBe(true));
    await vi.waitFor(() => expect(side.getAnimations({ subtree: true })).toHaveLength(0), {
      timeout: 5000,
    });
    await frame();
  }
};

/** Replaces the Clipboard API for one test. */
function clipboard(): void {
  const own = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn(() => Promise.resolve()) },
  });
  onTestFinished(() => {
    if (own) Object.defineProperty(navigator, "clipboard", own);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  });
}

// The moment before the script places the thumb: server-rendered HTML has no layout, and the
// active tab draws its own key.
const beforeThumb = async (side: Element) => {
  await prepare(side);
  side.querySelector("[data-slot=code-block-list]")?.removeAttribute("data-thumb");
  side.querySelector("[data-slot=code-block-thumb]")?.removeAttribute("data-visible");
};

const tab = { target: "[role=tab][aria-selected=false]", props, pseudo, prepare };
const active = { target: "[role=tab][aria-selected=true]", props, pseudo, prepare };
const run = { props, pseudo, prepare };

// A Copy that has been pressed shows its check and its words.
const copiedCases: Case[] = [make("copied, single", {}), make("copied, tabs", { tabs: true })];

describe("Code Block in Tailwind CSS v4 against code-block.css", () => {
  test("every layout, with and without tabs, matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page: code stays left to right, the icons swap sides", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("a copied snippet shows Copy's check", async () => {
    clipboard();
    await tw.parity(copiedCases, run);
    await tw.parity(copiedCases, { ...run, theme: "dark" });
  });

  test("before the thumb is placed, the active tab draws its own key", async () => {
    await tw.parity(cases, { ...run, prepare: beforeThumb });
    await tw.parity(cases, { ...run, prepare: beforeThumb, theme: "dark" });
  });

  test("Glide lights the hovered tab and not the active one", { timeout: 60_000 }, async () => {
    for (const name of ["tabs", "tabs, no icons", "tabs, overflow"]) {
      await tw.states(cases, name, "hover", tab);
    }
    await tw.states(cases, "tabs", "hover", { ...tab, theme: "dark" });
    await tw.states(cases, "tabs", "hover", { ...tab, dir: "rtl" });
    await tw.states(cases, "tabs", "hover", active);
  });

  test("a tab that Glide lights while active keeps its text color", async () => {
    const lit = async (side: Element) => {
      await prepare(side);
      for (const el of side.querySelectorAll("[role=tab]:not([disabled])")) {
        el.setAttribute("data-glide-active", "");
      }
    };
    await tw.parity(cases, { ...run, prepare: lit });
    await setMedia("forced-colors");
    await tw.parity(cases, { ...run, prepare: lit });
  });

  test("a held press presses the tab in, and the thumb with it", { timeout: 60_000 }, async () => {
    for (const name of ["tabs", "tabs, no icons", "tabs, overflow"]) {
      await tw.states(cases, name, "held", active);
    }
  });

  test("keyboard focus draws the ring inside the tab, and on a panel that scrolls", {
    timeout: 60_000,
  }, async () => {
    await tw.states(cases, "tabs", "focus", active);
    await tw.states(cases, "tabs, one disabled", "focus", active);
    await tw.states(cases, "tabs", "focus", { ...run, target: "[role=tabpanel]" });
  });

  test("keyboard focus draws the ring on a panel that scrolls", { timeout: 60_000 }, async () => {
    const panel = { ...run, target: "[data-slot=code-block-panel]" };
    await tw.states(cases, "single, long code", "focus", panel);
  });

  test("and in the dark theme", { timeout: 60_000 }, async () => {
    const panel = { ...run, target: "[data-slot=code-block-panel]", theme: "dark" } as const;
    await tw.states(cases, "single, long code", "focus", panel);
  });

  test("forced colors match: the active tab is the highlight, the card has an outline", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, prepare: beforeThumb });
    await tw.states(cases, "tabs", "hover", tab);
    await tw.states(cases, "tabs", "focus", active);
    await tw.states(cases, "tabs", "held", active);
  });

  test("forced colors: keyboard focus on a panel that scrolls", { timeout: 60_000 }, async () => {
    await setMedia("forced-colors");
    await tw.states(cases, "single, long code", "focus", {
      ...run,
      target: "[data-slot=code-block-panel]",
    });
  });

  test("reduced motion matches: nothing slides or presses, a held thumb dims", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
    await tw.states(cases, "tabs", "held", active);
    await tw.states(cases, "tabs", "hover", tab);
  });

  test("a panel Base UI keeps a frame after its tab is left goes at once", async () => {
    const leaving = async (side: Element) => {
      await prepare(side);
      side.querySelector("[role=tabpanel]")?.setAttribute("data-ending-style", "");
    };
    await tw.parity(cases, { ...run, prepare: leaving });
  });

  test("more contrast changes nothing", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("transitions are the same: the thumb's travel, the tabs' colors", async () => {
    await tw.motion(cases, run);
  });

  test("transitions with the thumb's states on: held and instant", async () => {
    const one = cases.filter((c) => c.name === "tabs");
    const flag = (name: string) => (side: Element) => {
      side.querySelector("[data-slot=code-block-thumb]")?.setAttribute(`data-${name}`, "");
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
  });

  test("transitions with forced colors, held and instant", async () => {
    await setMedia("forced-colors");
    const one = cases.filter((c) => c.name === "tabs");
    for (const name of ["held", "instant"]) {
      const prepare = (side: Element) => {
        side.querySelector("[data-slot=code-block-thumb]")?.setAttribute(`data-${name}`, "");
      };
      await tw.motion(one, { prepare });
    }
  });

  test("a held press lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "tabs", "held", { ...active, props: motion, live: true });
  });

  test("the scrollbar draws as in CSS where the browser has WebKit's", async () => {
    if (!CSS.supports("selector(::-webkit-scrollbar)")) return;
    const screen = await tw.mount(
      cases.filter((c) => c.name === "single, long code"),
      run,
    );
    const row = screen.container.querySelector('[data-case="single, long code"]');
    const read = (flavor: string) => {
      const panel = row?.querySelector(
        `[data-side=${flavor}] [data-slot=code-block-panel]`,
      ) as Element;
      const pick = (pseudoName: string, names: string[]) =>
        Object.fromEntries(
          names.map((name) => [
            name,
            String(getComputedStyle(panel, pseudoName)[name as keyof CSSStyleDeclaration]),
          ]),
        );
      return {
        bar: pick("::-webkit-scrollbar", ["height"]),
        track: pick("::-webkit-scrollbar-track", ["marginLeft", "marginRight"]),
        thumb: pick("::-webkit-scrollbar-thumb", [
          "borderTopWidth",
          "borderTopColor",
          "borderTopLeftRadius",
          "backgroundClip",
          "backgroundColor",
        ]),
        own: pick("", ["scrollbarWidth", "scrollbarColor"]),
      };
    };
    expect(read("tw")).toEqual(read("css"));
    expect(read("tw").bar).toEqual({ height: "10px" });
  });
});

describe("Code Block in Tailwind CSS v4 behaves as in CSS", () => {
  test("the thumb lands on the active tab, and a click moves it to the next", async () => {
    tw.load();
    const screen = await tw.mount(cases.filter((c) => c.name === "tabs"));
    const row = screen.container.querySelector('[data-case="tabs"]');
    const boxOf = (side: Element, el: Element) => {
      const a = side.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      return [b.x - a.x, b.y - a.y, b.width, b.height];
    };
    const near = (a: number[], b: number[]) =>
      a.every((n, i) => Math.abs(n - (b[i] as number)) <= 0.05);
    const boxes = [];
    for (const flavor of ["css", "tw"]) {
      const side = row?.querySelector(`[data-side=${flavor}]`) as Element;
      const tabs = [...side.querySelectorAll("[role=tab]")];
      const thumb = side.querySelector("[data-slot=code-block-thumb]") as Element;
      expect(thumb.hasAttribute("data-visible")).toBe(true);
      expect(near(boxOf(side, thumb), boxOf(side, tabs[0] as Element)), flavor).toBe(true);
      await userEvent.click(tabs[2] as Element);
      await expect.poll(() => tabs[2]?.getAttribute("aria-selected")).toBe("true");
      await expect.poll(() => near(boxOf(side, thumb), boxOf(side, tabs[2] as Element))).toBe(true);
      boxes.push(boxOf(side, thumb));
    }
    expect(near(boxes[0] as number[], boxes[1] as number[])).toBe(true);
  });

  test("Glide lights the hovered tab in the Tailwind flavor", async () => {
    tw.load();
    const screen = await render(<Block kit={twind} tabs />);
    const list = screen.container.querySelector<HTMLElement>("[data-slot=code-block-list]");
    const highlight = screen.container.querySelector<HTMLElement>("[data-slot=glide]");
    if (!list || !highlight) throw new Error("not rendered");
    const tabs = [...list.querySelectorAll("[role=tab]")];
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    list.removeAttribute("data-glide");
    expect(getComputedStyle(list).position).toBe("relative");
    expect(getComputedStyle(list).isolation).toBe("isolate");
    await userEvent.hover(tabs[1] as Element);
    expect(tabs[1]?.hasAttribute("data-glide-active")).toBe(true);
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    await userEvent.hover(tabs[0] as Element);
    expect(highlight.hasAttribute("data-visible")).toBe(false);
  });

  test("copying works, and the copied word shows", async () => {
    clipboard();
    tw.load();
    const screen = await render(<Block kit={twind} tabs value="b" tall />);
    const button = screen.container.querySelector<HTMLElement>("[data-slot=code-block-copy]");
    if (!button) throw new Error("not rendered");
    await userEvent.click(button);
    await vi.waitFor(() => expect(button.hasAttribute("data-copied")).toBe(true));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TALL);
  });

  test("another snippet's height is eased to, and ends where the CSS flavor's does", async () => {
    clipboard();
    const screen = await tw.mount(
      cases.filter((c) => c.name === "tabs, a taller second"),
      run,
    );
    const row = screen.container.querySelector('[data-case="tabs, a taller second"]');
    const heights = [];
    for (const flavor of ["css", "tw"]) {
      const side = row?.querySelector(`[data-side=${flavor}]`) as Element;
      const root = side.querySelector("[data-slot=code-block]") as HTMLElement;
      const before = root.getBoundingClientRect().height;
      await userEvent.click(side.querySelectorAll("[role=tab]")[1] as Element);
      await expect
        .poll(() => side.querySelector("[role=tabpanel]:not([hidden])")?.textContent)
        .toContain("line six");
      await expect.poll(() => root.getAnimations().length).toBe(0);
      const after = root.getBoundingClientRect().height;
      expect(after).toBeGreaterThan(before);
      heights.push(after);
    }
    expect(Math.abs((heights[0] as number) - (heights[1] as number))).toBeLessThan(0.1);
  });

  test("the rendered Tailwind tree holds no class of the CSS flavor", async () => {
    tw.load();
    for (const props of [{ tabs: true }, {}] as const) {
      const screen = await render(<Block kit={twind} {...props} />);
      const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
        (el.getAttribute("class") ?? "").split(/\s+/),
      );
      expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
      expect(classes.length).toBeGreaterThan(10);
      await screen.unmount();
    }
  });
});

describe("className on Code Block in Tailwind CSS v4", () => {
  const rendered = async (block: Partial<BlockProps>) => {
    tw.load();
    const screen = await render(<Block kit={twind} tabs {...block} />);
    return screen.container;
  };

  test("a user's utilities beat the component's, on the root", async () => {
    const root = (await rendered({ rootClassName: ROOT_OVERRIDES })).querySelector(
      "[data-slot=code-block]",
    );
    if (!root) throw new Error("not rendered");
    expectStyles(root, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      opacity: "1",
    });
  });

  test("on a tab", async () => {
    const tab = (await rendered({ tabClassName: TAB_OVERRIDES })).querySelector("[role=tab]");
    if (!tab) throw new Error("not rendered");
    expectStyles(tab, {
      borderTopLeftRadius: "0px",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
      cursor: "default",
    });
  });

  test("and on a panel", async () => {
    const panel = (await rendered({ panelClassName: PANEL_OVERRIDES })).querySelector(
      "[role=tabpanel]",
    );
    if (!panel) throw new Error("not rendered");
    expectStyles(panel, {
      borderBottomLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      overflowX: "visible",
    });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    const active = (await rendered({ tabClassName: "data-active:text-green-500" })).querySelector(
      "[role=tab][aria-selected=true]",
    );
    if (!active) throw new Error("not rendered");
    expectStyles(active, { color: "oklch(0.723 0.219 149.579)" });
  });

  test("the slots merge with a className, the user's last", () => {
    const tabs = cn(codeBlockSlots.tab, "px-8 py-1 rounded-none text-red-500");
    for (const gone of ["rounded-(--_radius)", "text-inherit"]) {
      expect(tabs.split(" "), gone).not.toContain(gone);
    }
    expect(cn(codeBlockSlots.copy, "rounded-none")).not.toContain("rounded-(--_nested)");
    expect(cn(codeBlockSlots.panel, "rounded-none text-sm")).not.toContain("text-[0.8125rem]");
    expect(cn(codeBlockSlots.root, "rounded-none")).not.toContain("rounded-(--_corner)");
    expect(cn(codeBlockSlots.thumb, "opacity-100")).not.toContain(" opacity-0");
  });
});
