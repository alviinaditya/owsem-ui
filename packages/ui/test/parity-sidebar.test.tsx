import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Sidebar as CssSidebar } from "../src/components/sidebar/index";
import sidebarCss from "../src/components/sidebar/sidebar.css?raw";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { Sidebar as TwSidebar } from "../src/tailwind/sidebar/index";
import { sidebarSlots } from "../src/tailwind/sidebar/sidebar-variants";
import bridge from "../src/tailwind.css?raw";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  MOTION,
  measure,
  measureFrom,
  type Part,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Sidebar in Tailwind CSS v4 (src/tailwind/sidebar, with sidebar.indicator.ts and Glide) against
// sidebar.css and glide.css.

const ROOT_OVERRIDES = "w-64 bg-red-500 text-red-500 opacity-50 rounded-none";
const LINK_OVERRIDES =
  "h-10 rounded-none px-8 text-red-500 cursor-default hover:text-green-500 data-active:font-bold data-active:text-green-500 data-disabled:text-red-500 data-disabled:cursor-pointer focus-visible:outline-red-500";
const HEADER_OVERRIDES = "p-0 bg-red-500";
const TRIGGER_OVERRIDES =
  "size-10 rounded-none bg-red-500 hover:bg-green-500 text-red-500 hover:text-red-500";

const candidates = classNames(
  ...Object.values(sidebarSlots),
  ...Object.values(glideSlots),
  ROOT_OVERRIDES,
  LINK_OVERRIDES,
  HEADER_OVERRIDES,
  TRIGGER_OVERRIDES,
  "data-disabled:text-green-500 mt-0 data-[state=closed]:opacity-100",
);
const tw = tailwindParity(candidates);
// An animated part is measured part way, so its box says nothing; the motion tests read the motion.
const twMotion = tailwindParity(candidates, [
  { what: /^box /, reason: "An animation in progress is measured part way." },
]);

// What these parts draw that PROPS leaves out, SVG presentation included.
const props = [
  ...PROPS,
  "translate",
  "visibility",
  "clipPath",
  "maskImage",
  "maskSize",
  "maskPosition",
  "maskRepeat",
  "maskComposite",
  "transformOrigin",
  "forcedColorAdjust",
  "insetInlineStart",
  "marginInlineStart",
  "paddingInlineStart",
  "paddingInlineEnd",
  "maxWidth",
  "overflowX",
  "overflowY",
  "overscrollBehaviorY",
  "scrollbarWidth",
  "textOverflow",
  "textTransform",
  "webkitTapHighlightColor",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
  "vectorEffect",
  "filter",
  "d",
  "r",
  "cx",
  "cy",
];
const pseudo = [...PSEUDO, "opacity", "borderTopWidth", "borderTopColor", "borderTopStyle"];

type Kit = typeof CssSidebar;
const css: Kit = CssSidebar;
const twind: Kit = TwSidebar;

const Dot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="6" />
  </svg>
);

interface NavProps {
  kit: Kit;
  active?: string;
  /** More rows, so the content scrolls inside `height`. */
  many?: boolean;
  height?: number;
  closed?: boolean;
  noIndicator?: boolean;
  rootClassName?: string;
  linkClassName?: string;
  headerClassName?: string;
  triggerClassName?: string;
  /** Only the ordinary rows, no header, footer or group label. */
  bare?: boolean;
  /** A drawer, open from the start. */
  mobile?: boolean;
}

const rows = [
  ["/button", "Button"],
  ["/badge", "Badge"],
  ["/input", "Input"],
  ["/switch", "Switch"],
] as const;

function Nav({
  kit,
  active,
  many,
  height = 360,
  closed,
  noIndicator,
  rootClassName,
  linkClassName,
  headerClassName,
  triggerClassName,
  bare,
  mobile,
}: NavProps): ReactElement {
  const { Provider, Root, Header, Footer, Content, Indicator, Group, GroupLabel, List, Item } = kit;
  const more = many ? Array.from({ length: 8 }, (_, i) => [`/more-${i}`, `More ${i}`]) : [];
  return (
    <Provider
      defaultOpen={!closed}
      shortcut={false}
      {...(mobile ? { mobileQuery: "all", defaultMobileOpen: true } : {})}
    >
      <Root className={rootClassName} style={{ blockSize: height }}>
        {bare ? null : (
          <Header className={headerClassName}>
            <kit.Trigger className={triggerClassName} aria-label="Toggle">
              <Dot />
            </kit.Trigger>
          </Header>
        )}
        <Content>
          {noIndicator ? null : <Indicator />}
          <Group>
            {bare ? null : <GroupLabel>Display</GroupLabel>}
            <List>
              {rows.slice(0, 2).map(([href, name]) => (
                <Item key={href} href={href} active={href === active} className={linkClassName}>
                  {name}
                </Item>
              ))}
              <Item href="/icon" active={active === "/icon"} className={linkClassName}>
                <kit.ItemIcon>
                  <Dot />
                </kit.ItemIcon>
                Icon row
                <kit.ItemBadge>New</kit.ItemBadge>
              </Item>
              <Item href="/off" disabled active={active === "/off"} className={linkClassName}>
                Disabled
              </Item>
              <Item href="/long" active={active === "/long"} className={linkClassName}>
                A label that is far too long to fit in the row
                <kit.ItemBadge>12</kit.ItemBadge>
              </Item>
            </List>
          </Group>
          <Group>
            {bare ? null : <GroupLabel>Forms</GroupLabel>}
            <List>
              {[...rows.slice(2), ...more].map(([href, name]) => (
                <Item key={href} href={href} active={href === active} className={linkClassName}>
                  {name}
                </Item>
              ))}
            </List>
          </Group>
        </Content>
        {bare ? null : <Footer>Footer</Footer>}
      </Root>
    </Provider>
  );
}

const make = (name: string, nav: Omit<NavProps, "kit">): Case => ({
  name,
  css: <Nav kit={css} {...nav} />,
  tw: <Nav kit={twind} {...nav} />,
});

const cases: Case[] = [
  make("plain", { noIndicator: true }),
  make("with an indicator, none active", {}),
  make("active", { active: "/input" }),
  make("active, first", { active: "/button" }),
  make("active with an icon and a badge", { active: "/icon" }),
  make("active and disabled", { active: "/off" }),
  make("active with a long label", { active: "/long" }),
  make("closed", { closed: true, active: "/input" }),
  make("scrolls, at the start", { many: true, height: 240, active: "/button" }),
  make("scrolls, in the middle", { many: true, height: 240, active: "/input" }),
  make("scrolls, at the end", { many: true, height: 240, active: "/more-7" }),
  make("landed", { active: "/input" }),
  make("away", { active: "/input" }),
  make("waiting", { active: "/input" }),
  make("bare rows", { bare: true, active: "/badge" }),
  make("a user's class", {
    active: "/input",
    rootClassName: ROOT_OVERRIDES,
    linkClassName: LINK_OVERRIDES,
    headerClassName: HEADER_OVERRIDES,
    triggerClassName: TRIGGER_OVERRIDES,
  }),
];

const caseOf = (side: Element) => side.closest("[data-case]")?.getAttribute("data-case") ?? "";
const q = <T extends HTMLElement>(side: Element, selector: string) =>
  side.querySelector<T>(selector) as T;

/** The state of a case that the script or the page sets, put on by hand, after the liquid lands. */
const stage = async (side: Element) => {
  const name = caseOf(side);
  const content = q(side, "[data-slot=sidebar-content]");
  const links = [...side.querySelectorAll<HTMLElement>("[data-slot=sidebar-link]")];
  const indicator = side.querySelector("[data-slot=sidebar-indicator]");
  const placed = !!indicator && links.some((l) => l.hasAttribute("data-active"));
  if (placed) {
    await vi.waitFor(() => expect(indicator.hasAttribute("data-visible")).toBe(true), {
      timeout: 5000,
    });
    await vi.waitFor(() => expect(indicator.hasAttribute("data-moving")).toBe(false), {
      timeout: 5000,
    });
  }
  if (name.includes("middle")) content.scrollTop = 40;
  if (name.includes("at the end")) content.scrollTop = 1e6;
  await frame();
  const active = links.find((l) => l.hasAttribute("data-active"));
  if (name === "landed") active?.setAttribute("data-landed", "");
  if (name === "away") {
    active?.setAttribute("data-away", "");
    links.find((l) => l.textContent === "Button")?.setAttribute("data-landed", "");
  }
  if (name === "waiting") indicator?.setAttribute("data-waiting", "");
  await frame();
};

const run = { props, pseudo, prepare: stage };
const link = (name: string) =>
  `[data-slot=sidebar-link]:not([data-active]):not([data-disabled])${name}`;

describe("Sidebar in Tailwind CSS v4 against sidebar.css", () => {
  test("every part and state matches in the light theme", { timeout: 60_000 }, async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", { timeout: 60_000 }, async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page", { timeout: 60_000 }, async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the liquid and the dot are the highlight", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
    await tw.states(cases, "active", "hover", { ...run, target: link("") });
    await tw.states(cases, "active", "focus", { ...run, target: link("") });
  });

  test("more contrast changes nothing", { timeout: 60_000 }, async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("reduced motion matches: no pulse, no slide", { timeout: 60_000 }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("a real hover lights a row through Glide, in both themes and directions", {
    timeout: 60_000,
  }, async () => {
    const target = { ...run, target: link("") };
    await tw.states(cases, "active", "hover", target);
    await tw.states(cases, "active", "hover", { ...target, theme: "dark" });
    await tw.states(cases, "active", "hover", { ...target, dir: "rtl" });
    await tw.states(cases, "plain", "hover", target);
    await tw.states(cases, "scrolls, in the middle", "hover", target);
  });

  test("a held press, and hovering the disabled and the active row", {
    timeout: 60_000,
  }, async () => {
    await tw.states(cases, "active", "held", { ...run, target: link("") });
    await tw.states(cases, "active", "hover", {
      ...run,
      target: "[data-slot=sidebar-link][data-disabled]",
    });
    await tw.states(cases, "active", "hover", {
      ...run,
      target: "[data-slot=sidebar-link][data-active]",
    });
    await tw.states(cases, "active and disabled", "hover", {
      ...run,
      target: "[data-slot=sidebar-link][data-disabled]",
    });
  });

  test("the trigger: hover, held, keyboard focus", { timeout: 60_000 }, async () => {
    const target = { ...run, target: "[data-slot=sidebar-trigger]" };
    await tw.states(cases, "active", "hover", target);
    await tw.states(cases, "active", "held", target);
    await tw.states(cases, "active", "focus", target);
    await tw.states(cases, "a user's class", "hover", target);
  });

  test("keyboard focus draws the ring inside the row", { timeout: 60_000 }, async () => {
    await tw.states(cases, "active", "focus", { ...run, target: link("") });
    await tw.states(cases, "active", "focus", { ...run, target: link(""), dir: "rtl" });
    await tw.states(cases, "active", "focus", {
      ...run,
      target: "[data-slot=sidebar-link][data-active]",
    });
    await tw.states(cases, "a user's class", "focus", { ...run, target: link("") });
  });
});

/** Transitions and animations of every part and pseudo element, as authored, for the cases. */
async function motion(names: string[], prepare = stage): Promise<void> {
  const screen = await twMotion.mount(
    cases.filter((one) => names.includes(one.name)),
    { live: true, prepare },
  );
  for (const name of names) {
    const row = screen.container.querySelector(`[data-case="${name}"]`);
    const [a, b] = ["css", "tw"].map((flavor) =>
      measure(row?.querySelector(`[data-side=${flavor}]`) as Element, MOTION, MOTION),
    );
    twMotion.expectParts(name, a as Part[], b as Part[]);
  }
}

describe("Sidebar's motion in Tailwind CSS v4", () => {
  const names = ["active", "closed", "waiting", "plain", "scrolls, in the middle"];

  test("transitions and animations are the same, durations, easings, and names", {
    timeout: 60_000,
  }, async () => {
    await motion(names);
  });

  test("and with forced colors", { timeout: 60_000 }, async () => {
    await motion(names);
    await setMedia("forced-colors");
    await motion(names);
  });

  test("with reduced motion the pulse stands still and the sidebar only fades", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await motion(names);
  });

  test("the pulse runs the keyframes of tailwind.css, and the ring too", async () => {
    tw.load();
    const screen = await render(<Nav kit={twind} active="/input" />);
    const pulse = q(screen.container, "[data-slot=sidebar-pulse]");
    q(screen.container, "[data-slot=sidebar-indicator]").setAttribute("data-waiting", "");
    const names = pulse
      .getAnimations({ subtree: true })
      .map((a) => (a as CSSAnimation).animationName);
    expect(names.sort()).toEqual(["ow-sidebar-ping", "ow-sidebar-swell"]);
  });

  test("the keyframes in tailwind.css are the ones in sidebar.css", () => {
    const rules = (text: string): Record<string, string> => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(text.replace(/@layer[^{;]*[{;]/g, ""));
      return Object.fromEntries(
        [...sheet.cssRules]
          .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule)
          .map((rule) => [rule.name, rule.cssText]),
      );
    };
    const mine = rules(sidebarCss);
    expect(Object.keys(mine)).toEqual(["ow-sidebar-swell", "ow-sidebar-ping"]);
    const shared = rules(bridge);
    for (const name of Object.keys(mine)) expect(shared[name], name).toBe(mine[name]);
  });
});

/** The drawer's popup and scrim, from their own corners; Base UI puts them in the body. */
async function drawer(
  kit: Kit,
  state: "open" | "starting" | "ending",
  dir: "ltr" | "rtl",
): Promise<{ popup: Part[]; backdrop: Part[] }> {
  const screen = await render(
    <DirectionProvider direction={dir}>
      <div dir={dir}>
        <Nav kit={kit} mobile active="/input" />
      </div>
    </DirectionProvider>,
  );
  const find = (slot: string) => document.querySelector<HTMLElement>(`[data-slot=${slot}]`);
  await vi.waitFor(() => expect(find("sidebar")).not.toBeNull(), { timeout: 5000 });
  const popup = find("sidebar") as HTMLElement;
  const backdrop = find("sidebar-backdrop") as HTMLElement;
  // Base UI takes its starting style off by itself.
  await vi.waitFor(() => expect(popup.hasAttribute("data-starting-style")).toBe(false));
  await vi.waitFor(() =>
    expect(popup.hasAttribute("data-visible") || find("sidebar-indicator")).toBeTruthy(),
  );
  for (const el of [popup, backdrop]) {
    if (state === "starting") el.setAttribute("data-starting-style", "");
    if (state === "ending") el.setAttribute("data-ending-style", "");
  }
  await frame();
  await frame();
  const parts = {
    popup: measureFrom(popup, popup, props, pseudo),
    backdrop: measureFrom(backdrop, backdrop, props, pseudo),
  };
  await screen.unmount();
  return parts;
}

describe("Sidebar as a drawer in Tailwind CSS v4", () => {
  const frozen = () => {
    tw.load();
    const style = document.createElement("style");
    style.textContent =
      "*, ::before, ::after { transition: none !important; animation: none !important; }";
    document.head.append(style);
    return () => style.remove();
  };

  test.each(["open", "starting", "ending"] as const)(
    "the %s drawer and its scrim match",
    {
      timeout: 60_000,
    },
    async (state) => {
      for (const dir of ["ltr", "rtl"] as const) {
        const off = frozen();
        const a = await drawer(css, state, dir);
        const b = await drawer(twind, state, dir);
        off();
        tw.expectParts(`${state} ${dir} popup`, a.popup, b.popup);
        tw.expectParts(`${state} ${dir} scrim`, a.backdrop, b.backdrop);
      }
    },
  );

  test("dark, forced colors, reduced motion", { timeout: 60_000 }, async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    for (const media of [undefined, "forced-colors", "reduced-motion"] as const) {
      if (media) await setMedia(media);
      for (const state of ["open", "starting", "ending"] as const) {
        const off = frozen();
        const a = await drawer(css, state, "ltr");
        const b = await drawer(twind, state, "ltr");
        off();
        document.documentElement.removeAttribute("data-theme");
        tw.expectParts(`${media} ${state} popup`, a.popup, b.popup);
        tw.expectParts(`${media} ${state} scrim`, a.backdrop, b.backdrop);
        document.documentElement.setAttribute("data-theme", "dark");
      }
    }
    document.documentElement.removeAttribute("data-theme");
  });

  test("the drawer's transitions are the same: 300 ms in, 220 ms out, and the scrim's 250 ms", {
    timeout: 60_000,
  }, async () => {
    const read = async (kit: Kit, state: "open" | "starting" | "ending") => {
      const screen = await render(<Nav kit={kit} mobile active="/input" />);
      const find = (slot: string) => document.querySelector<HTMLElement>(`[data-slot=${slot}]`);
      await vi.waitFor(() => expect(find("sidebar")).not.toBeNull(), { timeout: 5000 });
      const popup = find("sidebar") as HTMLElement;
      const backdrop = find("sidebar-backdrop") as HTMLElement;
      await vi.waitFor(() => expect(popup.hasAttribute("data-starting-style")).toBe(false));
      for (const el of [popup, backdrop]) {
        if (state === "starting") el.setAttribute("data-starting-style", "");
        if (state === "ending") el.setAttribute("data-ending-style", "");
      }
      const parts = [popup, backdrop].map((el) => measureFrom(el, el, MOTION, MOTION));
      await screen.unmount();
      return parts;
    };
    tw.load();
    for (const reduced of [false, true]) {
      if (reduced) await setMedia("reduced-motion");
      for (const state of ["open", "starting", "ending"] as const) {
        const a = await read(css, state);
        const b = await read(twind, state);
        tw.expectParts(
          `${state} popup${reduced ? " reduced" : ""}`,
          a[0] as Part[],
          b[0] as Part[],
        );
        tw.expectParts(`${state} scrim`, a[1] as Part[], b[1] as Part[]);
      }
    }
  });
});

function Switcher({ kit }: { kit: Kit }): ReactElement {
  const [active, setActive] = useState("/button");
  return (
    <>
      <button type="button" data-go="" onClick={() => setActive("/input")}>
        go
      </button>
      <Nav kit={kit} active={active} />
    </>
  );
}

/** What the liquid draws once it rests: its parts' attributes, and where the bar and dot sit. */
function liquid(root: ParentNode, name: string) {
  const el = (selector: string) => root.querySelector(selector) as Element;
  const row = [...root.querySelectorAll("[data-slot=sidebar-link]")].find((a) =>
    a.textContent?.startsWith(name),
  ) as Element;
  const from = row.getBoundingClientRect();
  const rel = (target: Element) => {
    const r = target.getBoundingClientRect();
    return [r.x - from.x, r.y - from.y, r.width, r.height].map((n) => Math.round(n * 100) / 100);
  };
  const svg = el("[data-slot=sidebar-liquid]");
  return {
    parts: [...svg.children].map((part) => ({
      tag: part.tagName,
      attributes: Object.fromEntries(
        [...part.attributes].filter((a) => a.name !== "class").map((a) => [a.name, a.value]),
      ),
    })),
    svg: Object.fromEntries(
      [...svg.attributes].filter((a) => a.name !== "class").map((a) => [a.name, a.value]),
    ),
    mix: (svg as SVGElement).style.getPropertyValue("--_mix"),
    body: rel(svg.querySelector("rect") as Element),
    dot: rel(svg.querySelector("circle:last-of-type") as Element),
    landed: [...root.querySelectorAll("[data-landed]")].map((a) => a.textContent),
    waiting: el("[data-slot=sidebar-indicator]").hasAttribute("data-waiting"),
    pulse: getComputedStyle(el("[data-slot=sidebar-pulse]")).display,
  };
}

/** Equal, but for the last digit of a number the liquid computed from a clock. */
function expectClose(actual: unknown, wanted: unknown): void {
  const numbers = (value: unknown): string =>
    JSON.stringify(value).replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));
  expect(numbers(actual)).toBe(numbers(wanted));
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Sidebar behaves as in CSS in Tailwind CSS v4", () => {
  const run = async (kit: Kit) => {
    tw.load();
    const screen = await render(<Switcher kit={kit} />);
    const c = screen.container;
    const indicator = () => q(c, "[data-slot=sidebar-indicator]");
    await vi.waitFor(() => expect(indicator().hasAttribute("data-visible")).toBe(true));
    await vi.waitFor(() => expect(indicator().hasAttribute("data-moving")).toBe(false));
    const first = liquid(c, "Button");
    // A click on a row moves the liquid there at once; the page has not changed yet, so it waits.
    const target = [...c.querySelectorAll<HTMLElement>("[data-slot=sidebar-link]")].find(
      (a) => a.textContent === "Input",
    ) as HTMLElement;
    target.addEventListener("click", (event) => event.preventDefault(), { once: true });
    target.click();
    await vi.waitFor(() => expect(indicator().hasAttribute("data-moving")).toBe(true), {
      timeout: 5000,
    });
    await vi.waitFor(() => expect(indicator().hasAttribute("data-waiting")).toBe(true), {
      timeout: 8000,
    });
    const pulse = q(c, "[data-slot=sidebar-pulse]");
    const waiting = {
      display: getComputedStyle(pulse).display,
      animations: pulse
        .getAnimations({ subtree: true })
        .map((a) => (a as CSSAnimation).animationName)
        .sort(),
      at: liquid(c, "Input").dot,
    };
    // The page catches up: the wait is over.
    q(c, "[data-go]").click();
    await vi.waitFor(() => expect(indicator().hasAttribute("data-waiting")).toBe(false), {
      timeout: 5000,
    });
    await vi.waitFor(() => expect(indicator().hasAttribute("data-moving")).toBe(false), {
      timeout: 5000,
    });
    await wait(200);
    const arrived = liquid(c, "Input");
    await screen.unmount();
    return { first, waiting, arrived };
  };

  test("a click moves the liquid, the pulse waits on the dot, and the page's change ends it", {
    timeout: 60_000,
  }, async () => {
    const a = await run(css);
    const b = await run(twind);
    expectClose(b.first, a.first);
    expectClose(b.waiting, a.waiting);
    expectClose(b.arrived, a.arrived);
    expect(a.waiting.display).toBe("block");
    expect(a.waiting.animations).toEqual(["ow-sidebar-ping", "ow-sidebar-swell"]);
    expect(a.arrived.pulse).toBe("none");
    expect(a.arrived.landed).toEqual(["Input"]);
    expect(a.arrived.parts.length).toBe(6);
  });

  test("with no change of page the liquid goes back, and the pulse hides", {
    timeout: 60_000,
  }, async () => {
    const back = async (kit: Kit) => {
      tw.load();
      const screen = await render(<Switcher kit={kit} />);
      const c = screen.container;
      const indicator = () => q(c, "[data-slot=sidebar-indicator]");
      await vi.waitFor(() => expect(indicator().hasAttribute("data-visible")).toBe(true));
      await vi.waitFor(() => expect(indicator().hasAttribute("data-moving")).toBe(false));
      const row = [...c.querySelectorAll<HTMLElement>("[data-slot=sidebar-link]")].find(
        (a) => a.textContent === "Input",
      ) as HTMLElement;
      row.addEventListener("click", (event) => event.preventDefault(), { once: true });
      row.click();
      await vi.waitFor(() => expect(indicator().hasAttribute("data-waiting")).toBe(true), {
        timeout: 8000,
      });
      expect(getComputedStyle(q(c, "[data-slot=sidebar-pulse]")).display).toBe("block");
      await vi.waitFor(() => expect(indicator().hasAttribute("data-waiting")).toBe(false), {
        timeout: 8000,
      });
      await vi.waitFor(() => expect(indicator().hasAttribute("data-moving")).toBe(false), {
        timeout: 8000,
      });
      await wait(200);
      const end = liquid(c, "Button");
      await screen.unmount();
      return end;
    };
    const a = await back(css);
    const b = await back(twind);
    expectClose(b, a);
    expect(a.pulse).toBe("none");
    expect(a.landed).toEqual(["Button"]);
  });

  test("the active item scrolls into view, as far as in the CSS flavor", async () => {
    const top: number[] = [];
    for (const kit of [css, twind]) {
      tw.load();
      const screen = await render(<Nav kit={kit} many active="/more-7" height={240} />);
      const content = q(screen.container, "[data-slot=sidebar-content]");
      await expect.poll(() => content.scrollTop).toBeGreaterThan(0);
      await wait(300);
      top.push(content.scrollTop);
      const on = q(screen.container, "[data-slot=sidebar-link][data-active]");
      const [c, l] = [content.getBoundingClientRect(), on.getBoundingClientRect()];
      expect(l.top).toBeGreaterThanOrEqual(c.top);
      expect(l.bottom).toBeLessThanOrEqual(c.bottom);
      await screen.unmount();
    }
    expect(Math.abs((top[0] as number) - (top[1] as number))).toBeLessThanOrEqual(0.5);
  });

  test("the edges fade where there is more to scroll, with the same mask", async () => {
    const masks: string[][] = [];
    for (const kit of [css, twind]) {
      tw.load();
      const screen = await render(<Nav kit={kit} many height={240} />);
      const content = q(screen.container, "[data-slot=sidebar-content]");
      const seen: string[] = [];
      await expect.poll(() => content.hasAttribute("data-overflow-end")).toBe(true);
      expect(content.hasAttribute("data-overflow-start")).toBe(false);
      seen.push(getComputedStyle(content).maskImage);
      content.scrollTop = 60;
      await expect.poll(() => content.hasAttribute("data-overflow-start")).toBe(true);
      seen.push(getComputedStyle(content).maskImage);
      content.scrollTop = 1e6;
      await expect.poll(() => content.hasAttribute("data-overflow-end")).toBe(false);
      seen.push(getComputedStyle(content).maskImage);
      masks.push(seen);
      await screen.unmount();
    }
    expect(masks[1]).toEqual(masks[0]);
    expect(new Set(masks[0]).size).toBe(3);
  });

  test("Glide lights the hovered row and skips the active and the disabled", async () => {
    tw.load();
    const screen = await render(<Nav kit={twind} active="/input" />);
    const content = q(screen.container, "[data-slot=sidebar-content]");
    const highlight = q(content, "[data-slot=glide]");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    content.removeAttribute("data-glide");
    expect(getComputedStyle(content).position).toBe("relative");
    expect(getComputedStyle(content).isolation).toBe("isolate");
    const rows = [...content.querySelectorAll<HTMLElement>("[data-slot=sidebar-link]")];
    const row = (name: string) => rows.find((a) => a.textContent?.startsWith(name)) as HTMLElement;
    await userEvent.hover(row("Badge"));
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    expect(row("Badge").hasAttribute("data-glide-active")).toBe(true);
    expect(getComputedStyle(highlight).clipPath).toContain("inset(");
    await userEvent.hover(row("Input"));
    expect(highlight.hasAttribute("data-visible")).toBe(false);
    await userEvent.hover(row("Badge"));
    await userEvent.hover(row("Disabled"));
    expect(highlight.hasAttribute("data-visible")).toBe(false);
  });

  test("the rendered Tailwind tree holds no class of the CSS flavor, the script's parts included", async () => {
    tw.load();
    const screen = await render(<Nav kit={twind} active="/input" />);
    await vi.waitFor(() =>
      expect(
        screen.container.querySelector("[data-slot=sidebar-indicator][data-visible]"),
      ).not.toBeNull(),
    );
    const classes = [
      ...screen.container.querySelectorAll("[class], [class='']"),
      ...screen.container.querySelectorAll("svg, svg *"),
    ].flatMap((el) => (el.getAttribute("class") ?? "").split(/\s+/));
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(10);
    for (const slot of ["sidebar-liquid", "sidebar-pulse", "sidebar-indicator", "sidebar-link"]) {
      expect(screen.container.querySelector(`[data-slot=${slot}]`), slot).not.toBeNull();
    }
    await screen.unmount();
    const drawer = await render(<Nav kit={twind} mobile active="/input" />);
    await vi.waitFor(() =>
      expect(document.querySelector("[data-slot=sidebar-backdrop]")).not.toBeNull(),
    );
    const all = [
      ...document.querySelectorAll(
        "[data-slot=sidebar-backdrop], [data-slot=sidebar] *, [data-slot=sidebar]",
      ),
    ];
    expect(
      all
        .flatMap((el) => (el.getAttribute("class") ?? "").split(/\s+/))
        .filter((n) => /^ow-[\w-]+$/.test(n)),
    ).toEqual([]);
    await drawer.unmount();
  });
});

describe("className on Sidebar in Tailwind CSS v4", () => {
  const mount = async (props: Omit<NavProps, "kit">) => {
    tw.load();
    const screen = await render(<Nav kit={twind} {...props} />);
    return screen.container;
  };

  test("a user's utilities beat the component's, on the root", async () => {
    const root = q(await mount({ rootClassName: ROOT_OVERRIDES }), "[data-slot=sidebar]");
    expectStyles(root, {
      width: "256px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      opacity: "0.5",
      borderTopLeftRadius: "0px",
    });
  });

  test("a user's utilities beat the component's, on a row", async () => {
    const c = await mount({ linkClassName: LINK_OVERRIDES, active: "/input" });
    const [first, active] = [
      q(c, "[data-slot=sidebar-link]"),
      q(c, "[data-slot=sidebar-link][data-active]"),
    ];
    expectStyles(first, {
      height: "40px",
      borderTopLeftRadius: "0px",
      color: "oklch(0.637 0.237 25.331)",
      cursor: "default",
    });
    expectStyles(active, {
      color: "oklch(0.723 0.219 149.579)",
      fontWeight: "700",
    });
  });

  test("a user's utilities beat the component's, on the header and the trigger", async () => {
    const c = await mount({
      headerClassName: HEADER_OVERRIDES,
      triggerClassName: TRIGGER_OVERRIDES,
    });
    expectStyles(q(c, "[data-slot=sidebar-header]"), {
      paddingTop: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
    });
    expectStyles(q(c, "[data-slot=sidebar-trigger]"), {
      width: "40px",
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
    });
  });

  test("the slots merge with a className, the user's last", () => {
    const root = cn(sidebarSlots.root, "w-64 rounded-none text-sm bg-red-500");
    for (const gone of ["w-[248px]", "text-[0.875rem]"])
      expect(root.split(" ")).not.toContain(gone);
    expect(root).toContain("w-64");
    expect(cn(sidebarSlots.link, "h-10 px-8 rounded-none text-red-500")).not.toContain("h-[calc(");
    expect(cn(sidebarSlots.link, "rounded-none")).not.toContain("rounded-(--_radius)");
    expect(cn(sidebarSlots.header, "p-0")).not.toContain("p-[12px]");
    expect(cn(sidebarSlots.trigger, "size-10 rounded-none")).not.toContain("size-[calc(");
  });
});
