import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { TableOfContents as CssToc } from "../src/components/table-of-contents/index";
import { cn } from "../src/tailwind/lib/cn";
import { TableOfContents as TwToc } from "../src/tailwind/table-of-contents/index";
import { tableOfContentsSlots } from "../src/tailwind/table-of-contents/table-of-contents-variants";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  MOTION,
  PROPS,
  pick,
  setMedia,
  tailwindParity,
} from "./parity";
import { run as markerRun } from "./toc-run";

// Table of Contents in Tailwind CSS v4 (src/tailwind/table-of-contents) against
// table-of-contents.css.

const OVERRIDES =
  "rounded-none text-red-500 text-sm opacity-100 p-8 data-current:text-green-500 focus-visible:outline-red-500 w-20 h-10";

const tw = tailwindParity(
  classNames(...Object.values(tableOfContentsSlots), OVERRIDES, "hover:text-red-500"),
);

// What these parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "translate",
  "scale",
  "listStyleType",
  "overflowWrap",
  "forcedColorAdjust",
  "paddingInlineStart",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeDasharray",
  "strokeDashoffset",
];

type Kit = typeof CssToc;
type Flavor = "css" | "tw";

interface DocProps {
  kit: Kit;
  flavor: Flavor;
  /** Makes the ids of the sections unique: every case and flavor sits in one page. */
  name: string;
  /** Where the article is scrolled to: 0 reads nothing, 120 the first section, 450 the second. */
  scroll?: number;
  /** Adds a third level under the second section. */
  deep?: boolean;
  /** A long title that wraps onto many lines, and a word that cannot break. */
  long?: boolean;
  /** The nav's width. */
  width?: number;
  className?: string;
}

const block = (height: number) => ({ blockSize: height, margin: 0 });

/** The nav beside the article it follows: ids are per flavor, as both sit in one page. */
function Doc({
  kit: { Root, List, Item, Link },
  flavor,
  name,
  scroll = 0,
  deep,
  long,
  width = 160,
  className,
}: DocProps): ReactElement {
  const id = (section: string) => `${flavor}-${name.replace(/\W+/g, "-")}-${section}`;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
      <div
        data-article=""
        data-scroll={scroll}
        style={{ inlineSize: 120, blockSize: 300, overflowY: "auto" }}
      >
        <p style={block(200)} />
        <h2 id={id("install")} style={block(30)}>
          Installation
        </h2>
        <p style={block(300)} />
        <h3 id={id("recolor")} style={block(30)}>
          Recoloring
        </h3>
        <p style={block(600)} />
      </div>
      <Root aria-label="On this page" style={{ inlineSize: width }} className={className}>
        <List>
          <Item>
            <Link href={`#${id("install")}`}>Installation</Link>
            <List>
              <Item>
                <Link href={`#${id("recolor")}`}>
                  {long
                    ? "Recoloring a component with theme tokens, Supercalifragilisticexpialidocious"
                    : "Recoloring"}
                </Link>
                {deep ? (
                  <List>
                    <Item>
                      <Link href={`#${id("recolor")}`}>Deeper</Link>
                    </Item>
                  </List>
                ) : null}
              </Item>
            </List>
          </Item>
          <Item>
            <Link href="#nowhere">Nowhere</Link>
          </Item>
        </List>
      </Root>
    </div>
  );
}

const make = (name: string, doc: Omit<DocProps, "kit" | "flavor" | "name">): Case => ({
  name,
  css: <Doc kit={CssToc} flavor="css" name={name} {...doc} />,
  tw: <Doc kit={TwToc} flavor="tw" name={name} {...doc} />,
});

const cases: Case[] = [
  make("before the marker is placed", {}),
  make("on the first section", { scroll: 120 }),
  make("on the second section", { scroll: 450 }),
  make("three levels", { scroll: 450, deep: true }),
  make("long labels", { scroll: 450, long: true, width: 120 }),
  make("long labels, nothing current", { long: true, width: 120 }),
  make("a narrow nav", { scroll: 450, width: 60 }),
];

// Scrolls each article, and waits for the tracker to take the new reading.
const settle = async (side: Element) => {
  const article = side.querySelector<HTMLElement>("[data-article]");
  const top = Number(article?.dataset.scroll ?? 0);
  if (!article || top === 0) return;
  article.scrollTop = top;
  article.dispatchEvent(new Event("scroll"));
  const name = side.closest("[data-case]")?.getAttribute("data-case");
  await vi.waitFor(() => expect(side.querySelector("[data-current]"), name ?? "").not.toBeNull());
  await vi.waitFor(() =>
    expect(
      side.querySelector("[data-slot=table-of-contents-marker]")?.hasAttribute("data-visible"),
    ).toBe(true),
  );
};

const run = { props, prepare: settle };

const link = '[data-slot="table-of-contents-link"]';
const nested = `[data-slot="table-of-contents-list"] [data-slot="table-of-contents-list"] ${link}`;

describe("Table of Contents in Tailwind CSS v4 against table-of-contents.css", () => {
  test("every level, the marker, and long labels match in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the rail and the marker are on the right", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("a real hover brightens a link", async () => {
    await tw.states(cases, "on the second section", "hover", { ...run, target: link });
    await tw.states(cases, "on the second section", "hover", { ...run, target: nested });
  });

  test("keyboard focus draws the ring inside the link", async () => {
    await tw.states(cases, "on the second section", "focus", { ...run, target: link });
    await tw.states(cases, "on the second section", "focus", { ...run, target: nested });
  });

  test("forced colors match: the marker is the highlight, the current link underlined", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
    await tw.states(cases, "on the second section", "focus", { ...run, target: nested });
  });

  test("reduced motion matches: the marker only fades", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("reduced motion: the marker transitions only its opacity", async () => {
    await setMedia("reduced-motion");
    await tw.motion(cases, { prepare: settle });
  });

  test("the first placement and a resize do not transition", async () => {
    // The tracker takes data-instant off in the same turn; here it stays, to read what it does.
    await tw.motion(cases, {
      prepare: async (side) => {
        await settle(side);
        side
          .querySelector("[data-slot=table-of-contents-marker]")
          ?.setAttribute("data-instant", "");
      },
    });
    await setMedia("reduced-motion");
    await tw.motion(cases, {
      prepare: async (side) => {
        await settle(side);
        side
          .querySelector("[data-slot=table-of-contents-marker]")
          ?.setAttribute("data-instant", "");
      },
    });
  });

  test("transitions are the same: the spring along the rail, and a fade", async () => {
    await tw.motion(cases, { prepare: settle });
  });
});

describe("a marker in Tailwind CSS v4 moves", () => {
  const marker = (side: Element) => {
    const el = side.querySelector<HTMLElement>("[data-slot=table-of-contents-marker]");
    if (!el) throw new Error("no marker");
    return el;
  };

  test("it lands on the current link's run with the same points, and travels to the next", async () => {
    const screen = await tw.mount(cases, { names: ["before the marker is placed"] });
    const boxes: Record<string, number[]> = {};
    for (const side of ["css", "tw"] as const) {
      const root = screen.container.querySelector(
        `[data-case="before the marker is placed"] [data-side=${side}]`,
      );
      if (!root) throw new Error("no side");
      const article = root.querySelector<HTMLElement>("[data-article]") as HTMLElement;
      const rail = root.querySelector("[data-slot=table-of-contents-list]") as HTMLElement;
      const origin = rail.getBoundingClientRect();
      for (const [name, top] of [
        ["first", 120],
        ["second", 450],
      ] as const) {
        article.scrollTop = top;
        article.dispatchEvent(new Event("scroll"));
        await vi.waitFor(() => {
          const el = root.querySelector("[data-current]");
          expect(el?.textContent).toBe(name === "first" ? "Installation" : "Recoloring");
        });
        // The travel ends on the link's run: from its top to its bottom, less a bend's half.
        await vi.waitFor(
          () => {
            const { start, end } = markerRun(marker(root));
            const l = (root.querySelector("[data-current]") as Element).getBoundingClientRect();
            expect(Math.abs(start.y - l.top)).toBeLessThan(7.5);
            expect(Math.abs(end.y - l.bottom)).toBeLessThan(7.5);
          },
          { timeout: 3000 },
        );
        await vi.waitFor(() => expect(marker(root).getAnimations()).toEqual([]), { timeout: 3000 });
        const { start, end } = markerRun(marker(root));
        boxes[`${side} ${name}`] = [
          start.x - origin.x,
          start.y - origin.y,
          end.x - origin.x,
          end.y - origin.y,
        ].map((n) => Math.round(n * 100) / 100);
      }
    }
    expect(boxes["tw first"]).toEqual(boxes["css first"]);
    expect(boxes["tw second"]).toEqual(boxes["css second"]);
    // The sub-section's run is one level in from the section's.
    expect((boxes["tw second"]?.[0] ?? 0) - (boxes["tw first"]?.[0] ?? 0)).toBe(12);
  });

  test("the rendered tree has no ow- class", async () => {
    tw.load();
    const screen = await render(<Doc kit={TwToc} flavor="tw" name="tree" scroll={450} deep />);
    await frame();
    const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
      [...el.classList].filter((name) => name.startsWith("ow-")),
    );
    expect(classes).toEqual([]);
    expect(screen.container.querySelectorAll("[data-slot]").length).toBeGreaterThan(5);
  });

  test("a click moves the marker with the same transitions in both flavors", async () => {
    const read = async (kit: Kit, flavor: Flavor) => {
      tw.load();
      const screen = await render(<Doc kit={kit} flavor={flavor} name="click" scroll={120} />);
      const el = screen.container.querySelector<HTMLElement>(
        "[data-slot=table-of-contents-marker]",
      ) as HTMLElement;
      const article = screen.container.querySelector<HTMLElement>("[data-article]") as HTMLElement;
      article.scrollTop = 120;
      article.dispatchEvent(new Event("scroll"));
      await vi.waitFor(() => expect(el.hasAttribute("data-visible")).toBe(true));
      const out = pick(getComputedStyle(el), MOTION);
      await screen.unmount();
      return out;
    };
    expect(await read(TwToc, "tw")).toEqual(await read(CssToc, "css"));
  });
});

describe("className on Table of Contents in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on the root and a link", async () => {
    tw.load();
    const screen = await render(
      <TwToc.Root aria-label="On this page" className={OVERRIDES}>
        <TwToc.List>
          <TwToc.Item>
            <TwToc.Link href="#a" className={OVERRIDES}>
              A
            </TwToc.Link>
          </TwToc.Item>
        </TwToc.List>
      </TwToc.Root>,
    );
    const root = screen.container.querySelector("[data-slot=table-of-contents]") as Element;
    const anchor = screen.container.querySelector("[data-slot=table-of-contents-link]") as Element;
    expectStyles(root, { fontSize: "14px", opacity: "1", paddingLeft: "32px" });
    expectStyles(anchor, {
      borderTopLeftRadius: "0px",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      paddingTop: "32px",
    });
  });

  test("a current link takes a user's variant utility over its own", async () => {
    tw.load();
    const screen = await render(
      <TwToc.Root aria-label="On this page">
        <TwToc.List>
          <TwToc.Item>
            <TwToc.Link href="#a" data-current="" className="data-current:text-green-500">
              A
            </TwToc.Link>
          </TwToc.Item>
        </TwToc.List>
      </TwToc.Root>,
    );
    const anchor = screen.container.querySelector("[data-slot=table-of-contents-link]") as Element;
    expectStyles(anchor, { color: "oklch(0.723 0.219 149.579)" });
  });

  test("the slots merge with a className, the user's last", () => {
    const link = cn(tableOfContentsSlots.link, "rounded-none px-8 text-lg text-red-500");
    expect(link).toContain("rounded-none");
    expect(link).toContain("text-red-500");
    expect(link).not.toContain("rounded-(--_radius)");
    expect(link).not.toContain("text-(color:--_muted)");
    const root = cn(tableOfContentsSlots.root, "text-lg leading-none");
    expect(root).not.toContain("text-[13.5px]");
    expect(root).not.toContain("leading-[1.4]");
  });
});
