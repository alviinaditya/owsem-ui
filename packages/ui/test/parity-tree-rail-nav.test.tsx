import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TreeRailNav as CssTreeRailNav } from "../src/components/tree-rail-nav/index";
import treeRailNavCss from "../src/components/tree-rail-nav/tree-rail-nav.css?raw";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { TreeRailNav as TwTreeRailNav } from "../src/tailwind/tree-rail-nav/index";
import { treeRailNavSlots } from "../src/tailwind/tree-rail-nav/tree-rail-nav-variants";
import bridge from "../src/tailwind.css?raw";
import {
  type Accepted,
  type Case,
  classNames,
  expectStyles,
  frame,
  MOTION,
  measure,
  type Part,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Tree Rail Nav in Tailwind CSS v4 (src/tailwind/tree-rail-nav, with tree-rail.ts and Glide)
// against tree-rail-nav.css and glide.css.

const ROOT_OVERRIDES = "w-72 bg-red-500 text-red-500 opacity-50 text-sm";
const ITEM_OVERRIDES =
  "min-h-10 rounded-none px-8 text-red-500 cursor-default data-current:text-green-500 data-[depth=1]:text-red-500 data-trail:text-red-500 data-glide-active:text-red-500 disabled:text-red-500 aria-disabled:text-red-500 disabled:cursor-default aria-disabled:cursor-default focus-visible:outline-red-500 duration-500";
const PANEL_OVERRIDES = "bg-red-500 duration-700 data-starting-style:bg-green-500";
const LIST_OVERRIDES = "m-4 p-4 bg-red-500";

const candidates = classNames(
  ...Object.values(treeRailNavSlots),
  ...Object.values(glideSlots),
  ROOT_OVERRIDES,
  ITEM_OVERRIDES,
  PANEL_OVERRIDES,
  LIST_OVERRIDES,
);
// The two dots in the CSS are data URIs with spaces and quotes; a class has neither, so the same
// image is written with %20 and %22. A test below reads both images as text.
const MASK: Accepted = {
  what: /^::(before|after) maskImage$/,
  reason: "The same SVG image, its spaces and quotes percent-encoded (compared decoded below).",
};
const tw = tailwindParity(candidates, [MASK]);
// A part in the middle of a transition or an animation is measured part way.
const twMotion = tailwindParity(candidates, [
  MASK,
  { what: /^box /, reason: "A transition in progress is measured part way." },
  { what: /^(transform|scale|translate|opacity)$/, reason: "Read part way through the motion." },
]);

// What these parts draw that PROPS leaves out, SVG presentation included.
const props = [
  ...PROPS,
  "visibility",
  "maskImage",
  "maskSize",
  "maskPosition",
  "maskRepeat",
  "maskComposite",
  "rotate",
  "transformOrigin",
  "transformBox",
  "forcedColorAdjust",
  "insetInlineStart",
  "marginInlineStart",
  "marginBlockEnd",
  "paddingInlineStart",
  "paddingInlineEnd",
  "minWidth",
  "overflowX",
  "overflowY",
  "textAlign",
  "gridRowStart",
  "fill",
  "fillOpacity",
  "stroke",
  "strokeWidth",
  "strokeOpacity",
  "strokeLinecap",
  "strokeLinejoin",
  "vectorEffect",
  "filter",
  "d",
];
const pseudo = [
  ...PSEUDO,
  "transform",
  "scale",
  "transformOrigin",
  "opacity",
  "insetInlineStart",
  "maskImage",
  "maskSize",
  "maskPosition",
  "maskRepeat",
  "forcedColorAdjust",
  "willChange",
];

type Kit = typeof CssTreeRailNav;
const css: Kit = CssTreeRailNav;
const twind: Kit = TwTreeRailNav;

const Dot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="6" />
  </svg>
);

interface TreeProps {
  kit: Kit;
  current?: string;
  /** Settings starts closed. */
  closed?: boolean;
  origin?: boolean;
  icons?: boolean;
  /** Labels too long for the width. */
  long?: boolean;
  width?: number;
  rootClassName?: string;
  itemClassName?: string;
  panelClassName?: string;
  listClassName?: string;
}

function Tree({
  kit,
  current = "dark",
  closed,
  origin,
  icons,
  long,
  width = 280,
  rootClassName,
  itemClassName,
  panelClassName,
  listClassName,
}: TreeProps): ReactElement {
  const { Root, List, Node, Link, Toggle, Panel, Origin, Icon, Label } = kit;
  const text = (label: string) =>
    long ? `${label}: a label that is much too long to fit in one line` : label;
  const content = (label: string) => (
    <>
      {icons ? (
        <Icon>
          <Dot />
        </Icon>
      ) : null}
      <Label>{text(label)}</Label>
    </>
  );
  const link = (id: string, label: string, extra: { disabled?: boolean } = {}) => (
    <Node>
      <Link
        href={`#${id}`}
        current={current === id}
        className={itemClassName}
        onClick={(event) => event.preventDefault()}
        {...extra}
      >
        {content(label)}
      </Link>
    </Node>
  );
  return (
    <Root aria-label="Docs" style={{ inlineSize: width }} className={rootClassName}>
      {origin ? <Origin>Docs</Origin> : null}
      <List className={listClassName}>
        {link("home", "Home")}
        <Node defaultOpen={!closed}>
          <Toggle className={itemClassName}>{content("Settings")}</Toggle>
          <Panel className={panelClassName}>
            <List>
              {link("profile", "Profile")}
              <Node defaultOpen>
                <Toggle className={itemClassName}>{content("Appearance")}</Toggle>
                <Panel>
                  <List>
                    {link("dark", "Dark mode")}
                    {link("density", "Density", { disabled: true })}
                  </List>
                </Panel>
              </Node>
            </List>
          </Panel>
        </Node>
        <Node defaultOpen={false}>
          <Toggle className={itemClassName}>{content("Help")}</Toggle>
          <Panel>
            <List>{link("faq", "FAQ")}</List>
          </Panel>
        </Node>
        {link("about", "About")}
      </List>
    </Root>
  );
}

const make = (name: string, tree: Omit<TreeProps, "kit">): Case => ({
  name,
  css: <Tree kit={css} {...tree} />,
  tw: <Tree kit={twind} {...tree} />,
});

const cases: Case[] = [
  make("default", {}),
  make("with an origin", { origin: true }),
  make("with icons and an origin", { origin: true, icons: true }),
  make("current at the first level", { current: "home" }),
  make("current in a group", { current: "profile" }),
  make("current in a closed group", { current: "faq" }),
  make("current under a closed parent", { closed: true }),
  make("nothing current", { current: "none" }),
  make("settings closed, none current", { closed: true, current: "none" }),
  make("disabled is current", { current: "density" }),
  make("long labels", { long: true, width: 220, current: "profile" }),
  make("long labels with icons", { long: true, icons: true, width: 220, origin: true }),
  make("a user's class", {
    rootClassName: ROOT_OVERRIDES,
    itemClassName: ITEM_OVERRIDES,
    panelClassName: PANEL_OVERRIDES,
    listClassName: LIST_OVERRIDES,
  }),
];

const tree = (side: Element) => side.querySelector("[data-slot=tree-rail-nav-tree]") as HTMLElement;
const panels = (side: Element) => [...side.querySelectorAll("[data-slot=tree-rail-nav-panel]")];

/** The script has drawn the rail and the first draw is done. */
const drawn = async (side: Element) => {
  await vi.waitFor(() => expect(tree(side).hasAttribute("data-rail")).toBe(true), {
    timeout: 5000,
  });
  await frame();
  await frame();
};

const run = { props, pseudo, prepare: drawn };
/** Before the script has drawn the rail: the server's HTML and the CSS alone. */
const resting = async (side: Element) => {
  await drawn(side);
  tree(side).removeAttribute("data-rail");
  await frame();
};
const row = (name: string) =>
  `:is([data-slot=tree-rail-nav-link], [data-slot=tree-rail-nav-toggle])[data-depth]:is(:not([data-current]))${name}`;

describe("Tree Rail Nav in Tailwind CSS v4 against tree-rail-nav.css", () => {
  test("every part, state, and level matches in the light theme", { timeout: 60_000 }, async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", { timeout: 60_000 }, async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the rail and the tint are mirrored", {
    timeout: 60_000,
  }, async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("before the script has drawn the rail, CSS draws its resting shape", {
    timeout: 60_000,
  }, async () => {
    await tw.parity(cases, { ...run, prepare: resting });
    await tw.parity(cases, { ...run, prepare: resting, theme: "dark" });
    await tw.parity(cases, { ...run, prepare: resting, dir: "rtl" });
  });

  test("the first draw sets data-instant on the tree: nothing transitions", async () => {
    const instant = async (side: Element) => {
      await drawn(side);
      tree(side).setAttribute("data-instant", "");
      await frame();
    };
    await tw.parity(cases, { ...run, prepare: instant });
    await twMotion.motion(cases, { prepare: instant });
  });

  test("a row that is leaving, arriving, or on the trail", { timeout: 60_000 }, async () => {
    const mark = (names: string[]) => async (side: Element) => {
      await drawn(side);
      for (const link of side.querySelectorAll("[data-slot=tree-rail-nav-link]")) {
        for (const name of names) link.setAttribute(`data-${name}`, "");
      }
      await frame();
    };
    for (const names of [["leaving"], ["arrived"], ["trail"], ["leaving", "arrived"]]) {
      await tw.parity(cases, { ...run, prepare: mark(names) });
      await twMotion.motion(cases, { prepare: mark(names) });
    }
    await tw.parity(cases, { ...run, prepare: mark(["leaving"]), dir: "rtl" });
  });

  test("a panel opening or closing holds no height and clips", { timeout: 60_000 }, async () => {
    const state = (name: string) => async (side: Element) => {
      await drawn(side);
      for (const panel of panels(side)) panel.setAttribute(name, "");
      await frame();
    };
    for (const name of ["data-starting-style", "data-ending-style", "data-clip"]) {
      await tw.parity(cases, { ...run, prepare: state(name) });
    }
  });

  test("forced colors match: system colors for the rail, the trail, and the resting rail", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, prepare: resting });
    await tw.states(cases, "default", "focus", { ...run, target: row("") });
    await tw.states(cases, "default", "hover", { ...run, target: row("") });
  });

  test("reduced motion matches: no sweep, a quiet panel, a still label", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, prepare: resting });
    await tw.states(cases, "long labels", "hover", { ...run, target: row("") });
  });

  test("more contrast changes nothing", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("a real hover warms a row's dot and lights it through Glide", {
    timeout: 60_000,
  }, async () => {
    const target = { ...run, target: row("") };
    await tw.states(cases, "default", "hover", target);
    await tw.states(cases, "default", "hover", { ...target, theme: "dark" });
    await tw.states(cases, "default", "hover", { ...target, dir: "rtl" });
    await tw.states(cases, "with icons and an origin", "hover", target);
    await tw.states(cases, "long labels", "hover", target);
    await tw.states(cases, "long labels", "hover", { ...target, dir: "rtl" });
    await tw.states(cases, "default", "hover", {
      ...run,
      target: "[data-slot=tree-rail-nav-link][data-disabled], [aria-disabled=true]",
    });
    await tw.states(cases, "default", "hover", {
      ...run,
      target: "[data-slot=tree-rail-nav-link][data-current]",
    });
    await tw.states(cases, "default", "hover", {
      ...run,
      target: "[data-slot=tree-rail-nav-toggle]",
    });
  });

  test("keyboard focus draws the ring inside the row and runs a long label", {
    timeout: 60_000,
  }, async () => {
    const target = { ...run, target: row("") };
    await tw.states(cases, "default", "focus", target);
    await tw.states(cases, "default", "focus", { ...target, dir: "rtl" });
    await tw.states(cases, "long labels", "focus", target);
    await tw.states(cases, "long labels", "focus", { ...target, dir: "rtl" });
    await tw.states(cases, "a user's class", "focus", target);
    await tw.states(cases, "default", "focus", {
      ...run,
      target: "[data-slot=tree-rail-nav-toggle]",
    });
  });

  test("the masks draw the same SVG images, decoded", async () => {
    const screen = await tw.mount(
      cases.filter((one) => one.name === "with an origin"),
      { ...run, prepare: resting },
    );
    const images = (flavor: "css" | "tw") => {
      const side = screen.container.querySelector(`[data-side=${flavor}]`) as Element;
      return [...side.querySelectorAll("*")]
        .map((el) => getComputedStyle(el, "::before").maskImage)
        .filter((image) => image.startsWith("url("))
        .map((image) =>
          decodeURIComponent(image)
            .replaceAll('"', "'")
            .replace(/^url\('|'\)$/g, ""),
        );
    };
    const wanted = images("css");
    // The origin's dot, and the branch into each open group.
    expect(wanted.length).toBeGreaterThan(2);
    expect(images("tw")).toEqual(wanted);
  });

  test("a held press changes nothing on a row", async () => {
    await tw.states(cases, "default", "held", { ...run, target: row("") });
    await tw.states(cases, "default", "held", {
      ...run,
      target: "[data-slot=tree-rail-nav-toggle]",
    });
  });
});

/** Every part's motion, pseudo elements included, for the cases. */
async function motion(
  names: string[],
  prepare: (side: Element) => Promise<void> = drawn,
  options: { dir?: "ltr" | "rtl" } = {},
): Promise<void> {
  const screen = await twMotion.mount(
    cases.filter((one) => names.includes(one.name)),
    { live: true, prepare, ...options },
  );
  for (const name of names) {
    const rowOf = screen.container.querySelector(`[data-case="${name}"]`);
    const [a, b] = ["css", "tw"].map((flavor) =>
      measure(rowOf?.querySelector(`[data-side=${flavor}]`) as Element, MOTION, MOTION),
    );
    twMotion.expectParts(name, a as Part[], b as Part[]);
  }
}

describe("Tree Rail Nav's motion in Tailwind CSS v4", () => {
  const names = ["default", "with an origin", "long labels", "current in a closed group"];

  test("transitions and animations are the same: durations, easings, and names", {
    timeout: 60_000,
  }, async () => {
    await motion(names);
    await motion(names, drawn, { dir: "rtl" });
  });

  test("the resting rail and the tint are the same, while nothing is drawn", {
    timeout: 60_000,
  }, async () => {
    await motion(names, resting);
  });

  test("with forced colors", async () => {
    await setMedia("forced-colors");
    await motion(names);
  });

  test("with reduced motion the tint only fades and the panel and chevron stand still", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await motion(names);
    const leaving = async (side: Element) => {
      await drawn(side);
      for (const link of side.querySelectorAll("[data-slot=tree-rail-nav-link]")) {
        link.setAttribute("data-leaving", "");
      }
    };
    await motion(names, leaving);
  });

  test("a hovered or focused long label runs the marquee, left to right and mirrored", {
    timeout: 60_000,
  }, async () => {
    const motionOf = [
      "transitionProperty",
      "transitionDuration",
      "animationName",
      "animationDuration",
    ];
    for (const dir of ["ltr", "rtl"] as const) {
      const seen: string[][] = [];
      for (const flavor of ["css", "tw"]) {
        const screen = await twMotion.mount(
          cases.filter((one) => one.name === "long labels"),
          { live: true, prepare: drawn, dir },
        );
        const side = screen.container.querySelector(`[data-side=${flavor}]`) as Element;
        const label = side.querySelector("[data-slot=tree-rail-nav-label][data-overflow]");
        if (!label) throw new Error("no label that overflows");
        await userEvent.hover(label.closest("[data-slot=tree-rail-nav-link]") as Element);
        await frame();
        const text = label.querySelector("[data-slot=tree-rail-nav-label-text]") as Element;
        seen.push([
          ...motionOf.map((name) => getComputedStyle(text)[name as "animationName"]),
          getComputedStyle(label).maskPosition,
          getComputedStyle(label).transitionProperty,
          ...text.getAnimations().map((a) => (a as CSSAnimation).animationName),
          String(Math.round(text.getAnimations()[0]?.effect?.getTiming().delay ?? 0)),
        ]);
        await (screen as unknown as { unmount(): Promise<void> }).unmount();
      }
      expect(seen[1], dir).toEqual(seen[0]);
      expect(seen[0]?.join(" "), dir).toContain(
        dir === "rtl" ? "ow-tree-rail-nav-marquee-rtl" : "ow-tree-rail-nav-marquee",
      );
    }
  });

  test("the keyframes in tailwind.css are the ones in tree-rail-nav.css", () => {
    const rules = (text: string): Record<string, string> => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(text.replace(/@layer[^{;]*[{;]/g, ""));
      return Object.fromEntries(
        [...sheet.cssRules]
          .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule)
          .map((rule) => [rule.name, rule.cssText]),
      );
    };
    const mine = rules(treeRailNavCss);
    expect(Object.keys(mine)).toEqual(["ow-tree-rail-nav-marquee", "ow-tree-rail-nav-marquee-rtl"]);
    const shared = rules(bridge);
    for (const name of Object.keys(mine)) expect(shared[name], name).toBe(mine[name]);
  });
});

function Controlled({ kit }: { kit: Kit }): ReactElement {
  const [current, setCurrent] = useState("dark");
  return (
    <>
      <button type="button" data-go="" onClick={() => setCurrent("profile")}>
        go
      </button>
      <Tree kit={kit} current={current} origin />
    </>
  );
}

const q = <T extends Element>(root: ParentNode, selector: string) =>
  root.querySelector(selector) as T;
const rowNamed = (root: ParentNode, name: string) =>
  [
    ...root.querySelectorAll<HTMLElement>(
      "[data-slot=tree-rail-nav-link], [data-slot=tree-rail-nav-toggle]",
    ),
  ].find((el) => el.textContent?.startsWith(name)) as HTMLElement;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** What the script drew, and where the rows and panels ended up. */
function snapshot(root: ParentNode) {
  const svg = q<SVGElement>(root, "[data-slot=tree-rail-nav-rail]");
  const layers = [...svg.children];
  const corner = q<HTMLElement>(root, "[data-slot=tree-rail-nav-tree]").getBoundingClientRect();
  const box = (el: Element) => {
    const r = el.getBoundingClientRect();
    return [r.x - corner.x, r.y - corner.y, r.width, r.height].map((n) => Math.round(n * 10) / 10);
  };
  return {
    paths: [...svg.querySelectorAll("path")].map((path) => path.getAttribute("d")),
    marker: layers[3]?.firstElementChild?.getAttribute("transform"),
    hollow: layers[3]?.firstElementChild?.hasAttribute("data-hollow"),
    on: layers.map((layer) => layer.hasAttribute("data-on")),
    nodes: [...(layers[2]?.children ?? [])].map((node) => ({
      // A dot out of sight keeps the place it had when the panel last moved: a frame's difference.
      transform: node.hasAttribute("data-hidden") ? "hidden" : node.getAttribute("transform"),
      attributes: [...node.attributes]
        .filter((a) => a.name.startsWith("data-"))
        .map((a) => a.name)
        .sort(),
    })),
    rows: [
      ...root.querySelectorAll("[data-slot=tree-rail-nav-link], [data-slot=tree-rail-nav-toggle]"),
    ].map((row) => ({
      box: box(row),
      attributes: [...row.attributes]
        .filter((a) => /^data-(trail|arrived|leaving|current|depth)$/.test(a.name))
        .map((a) => `${a.name}=${a.value}`)
        .sort(),
    })),
    panels: [...root.querySelectorAll("[data-slot=tree-rail-nav-panel]")].map((panel) => ({
      box: box(panel),
      hidden: panel.hasAttribute("hidden"),
    })),
    svg: box(svg),
  };
}

describe("Tree Rail Nav behaves as in CSS in Tailwind CSS v4", () => {
  const scenario = async (kit: Kit) => {
    tw.load();
    const screen = await render(<Controlled kit={kit} />);
    const c = screen.container;
    await vi.waitFor(() =>
      expect(q(c, "[data-slot=tree-rail-nav-tree]").hasAttribute("data-rail")).toBe(true),
    );
    await wait(300);
    const at: Record<string, ReturnType<typeof snapshot>> = { first: snapshot(c) };
    // A group closes, and opens again: the rail ends at its row, then runs through it.
    await userEvent.click(rowNamed(c, "Appearance"));
    await wait(900);
    at.closed = snapshot(c);
    await userEvent.click(rowNamed(c, "Appearance"));
    await wait(900);
    at.reopened = snapshot(c);
    await userEvent.click(rowNamed(c, "Settings"));
    await wait(900);
    at.parentClosed = snapshot(c);
    await userEvent.click(rowNamed(c, "Settings"));
    await wait(900);
    at.parentOpen = snapshot(c);
    // The current row changes: the trail travels there.
    q<HTMLElement>(c, "[data-go]").click();
    await wait(1500);
    at.moved = snapshot(c);
    // Arrow keys walk the rows, and open and close groups.
    rowNamed(c, "Home").focus();
    const walked: (string | null)[] = [];
    for (const key of [
      "ArrowDown",
      "ArrowDown",
      "ArrowRight",
      "ArrowDown",
      "ArrowLeft",
      "End",
      "Home",
    ]) {
      await userEvent.keyboard(`{${key}}`);
      await wait(60);
      walked.push(document.activeElement?.textContent ?? null);
    }
    await wait(900);
    at.keys = snapshot(c);
    await screen.unmount();
    return { at, walked };
  };

  test("the paths, the marker, and the dots end where the CSS flavor's do, after each change", {
    timeout: 60_000,
  }, async () => {
    const a = await scenario(css);
    const b = await scenario(twind);
    for (const name of Object.keys(a.at)) expect(b.at[name], name).toEqual(a.at[name]);
    expect(a.at.first?.paths.length).toBeGreaterThan(2);
    expect(a.at.first?.nodes.some((n) => n.attributes.includes("data-lit"))).toBe(true);
    // The rail is not what it was after the changes.
    expect(a.at.closed?.paths).not.toEqual(a.at.first?.paths);
    expect(a.at.moved?.marker).not.toEqual(a.at.first?.marker);
  });

  test("arrow keys move the focus and open and close groups, as in the CSS flavor", {
    timeout: 60_000,
  }, async () => {
    const a = await scenario(css);
    const b = await scenario(twind);
    expect(b.walked).toEqual(a.walked);
    expect(new Set(a.walked).size).toBeGreaterThan(3);
  });

  test("Glide lights the hovered row in the Tailwind flavor, and the tree isolates it", async () => {
    tw.load();
    const screen = await render(<Tree kit={twind} />);
    const c = screen.container;
    const root = q<HTMLElement>(c, "[data-slot=tree-rail-nav-tree]");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    root.removeAttribute("data-glide");
    expect(getComputedStyle(root).position).toBe("relative");
    expect(getComputedStyle(root).isolation).toBe("isolate");
    const highlight = q<HTMLElement>(root, "[data-slot=glide]");
    await userEvent.hover(rowNamed(c, "Home"));
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    expect(rowNamed(c, "Home").hasAttribute("data-glide-active")).toBe(true);
    await userEvent.unhover(rowNamed(c, "Home"));
  });

  test("the rendered Tailwind tree holds no class of the CSS flavor, the script's parts included", async () => {
    tw.load();
    const screen = await render(<Tree kit={twind} origin icons long />);
    await vi.waitFor(() =>
      expect(q(screen.container, "[data-slot=tree-rail-nav-tree]").hasAttribute("data-rail")).toBe(
        true,
      ),
    );
    await userEvent.click(rowNamed(screen.container, "Appearance"));
    const classes = [...screen.container.querySelectorAll("*")].flatMap((el) =>
      (el.getAttribute("class") ?? "").split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(40);
    for (const slot of ["tree-rail-nav-rail", "tree-rail-nav-origin", "tree-rail-nav-label-text"]) {
      expect(screen.container.querySelector(`[data-slot=${slot}]`), slot).not.toBeNull();
    }
    // The dots, the marker, and the paths the script made carry utilities, not ow- classes.
    const svg = q<SVGElement>(screen.container, "[data-slot=tree-rail-nav-rail]");
    expect(svg.querySelectorAll("g[class]").length).toBeGreaterThan(3);
  });

  test("a long label starts its marquee on hover and stops when the pointer leaves", async () => {
    tw.load();
    const screen = await render(<Tree kit={twind} long width={220} />);
    const c = screen.container;
    const row = rowNamed(c, "Home");
    const text = () => q<HTMLElement>(row, "[data-slot=tree-rail-nav-label-text]");
    await vi.waitFor(() =>
      expect(q(row, "[data-slot=tree-rail-nav-label]").hasAttribute("data-overflow")).toBe(true),
    );
    expect(getComputedStyle(text()).animationName).toBe("none");
    await userEvent.hover(row);
    await expect
      .poll(() => getComputedStyle(text()).animationName)
      .toBe("ow-tree-rail-nav-marquee");
    await expect.poll(() => text().getAnimations().length).toBe(1);
    await userEvent.unhover(row);
    await expect.poll(() => getComputedStyle(text()).animationName).toBe("none");
  });
});

describe("className on Tree Rail Nav in Tailwind CSS v4", () => {
  const mount = async (props: Omit<TreeProps, "kit">) => {
    tw.load();
    const screen = await render(<Tree kit={twind} {...props} />);
    return screen.container;
  };

  test("a user's utilities beat the component's, on the root and a list", async () => {
    const c = await mount({ rootClassName: ROOT_OVERRIDES, listClassName: LIST_OVERRIDES });
    expectStyles(q(c, "[data-slot=tree-rail-nav]"), {
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      opacity: "0.5",
      fontSize: "14px",
    });
    expectStyles(q(c, "[data-slot=tree-rail-nav-list]"), {
      marginTop: "16px",
      paddingTop: "16px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("a user's utilities beat the component's, on a row and on a panel", async () => {
    const c = await mount({ itemClassName: ITEM_OVERRIDES, panelClassName: PANEL_OVERRIDES });
    expectStyles(q(c, "[data-slot=tree-rail-nav-link]"), {
      minHeight: "40px",
      borderTopLeftRadius: "0px",
      paddingLeft: "32px",
      cursor: "default",
    });
    expectStyles(q(c, "[data-slot=tree-rail-nav-panel]"), {
      backgroundColor: "oklch(0.637 0.237 25.331)",
      transitionDuration: "0.7s",
    });
    expectStyles(q(c, "[data-slot=tree-rail-nav-link][data-current]"), {
      color: "oklch(0.723 0.219 149.579)",
    });
  });

  test("the slots merge with a className, the user's last", () => {
    const item = cn(
      treeRailNavSlots.item,
      "min-h-10 px-8 rounded-none text-red-500 cursor-default",
    );
    for (const gone of [
      "min-h-[32px]",
      "rounded-(--_radius)",
      "text-(color:--_muted)",
      "cursor-pointer",
    ]) {
      expect(item.split(" "), gone).not.toContain(gone);
    }
    expect(cn(treeRailNavSlots.root, "text-sm")).not.toContain("text-[13.5px]");
    expect(cn(treeRailNavSlots.panel, "duration-700")).not.toContain("duration-340");
    expect(cn(treeRailNavSlots.list, "m-4 p-4")).not.toContain("m-0");
    expect(cn(treeRailNavSlots.tree, "pt-0")).not.toContain("pt-[4px]");
  });
});
