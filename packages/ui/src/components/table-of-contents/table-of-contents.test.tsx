import { type CSSProperties, createRef, type MouseEvent, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { run } from "../../../test/toc-run.ts";
import { TableOfContents } from "./index";

const root = document.documentElement;

// The article scrolls in a 300px box, so the reading line (30%) is 90px from its top. Targets'
// tops in the article: Installation 200, npm 530, Usage 860, API 950; it scrolls 720px. Usage and
// API are short: neither reaches the line.
const block = (height: number) => ({ blockSize: height, margin: 0 }) satisfies CSSProperties;

function Article({ style }: { style?: CSSProperties }) {
  return (
    <div className="article" style={{ inlineSize: 400, overflowY: "auto", ...style }}>
      <p style={block(200)}>Intro</p>
      <h2 id="install" style={block(30)}>
        Installation
      </h2>
      <p style={block(300)} />
      <h3 id="npm" style={block(30)}>
        npm
      </h3>
      <p style={block(300)} />
      <h2 id="usage" style={block(30)}>
        Usage
      </h2>
      <p style={block(60)} />
      <h2 id="api" style={block(30)}>
        API
      </h2>
      <p style={block(40)} />
    </div>
  );
}

function Toc({
  onClick,
  style,
  long = false,
}: {
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  style?: CSSProperties;
  long?: boolean;
}) {
  const link = (id: string, label: string) => (
    <TableOfContents.Link href={`#${id}`} onClick={onClick}>
      {label}
    </TableOfContents.Link>
  );
  return (
    <TableOfContents.Root aria-label="On this page" style={{ inlineSize: 200, ...style }}>
      <TableOfContents.List>
        <TableOfContents.Item>
          {link("install", long ? "Installing the package from npm or a registry" : "Installation")}
          <TableOfContents.List>
            <TableOfContents.Item>{link("npm", "npm")}</TableOfContents.Item>
          </TableOfContents.List>
        </TableOfContents.Item>
        <TableOfContents.Item>{link("usage", "Usage")}</TableOfContents.Item>
        <TableOfContents.Item>{link("api", "API")}</TableOfContents.Item>
      </TableOfContents.List>
    </TableOfContents.Root>
  );
}

function Page(props: Parameters<typeof Toc>[0] & { children?: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "start" }}>
      {props.children ?? <Article style={{ blockSize: 300 }} />}
      <Toc {...props} />
    </div>
  );
}

async function mount(ui: ReactNode = <Page />) {
  const screen = await render(ui);
  const nav = screen.container.querySelector<HTMLElement>(".ow-table-of-contents");
  const marker = screen.container.querySelector<SVGPathElement>(".ow-table-of-contents__marker");
  const article = screen.container.querySelector<HTMLElement>(".article");
  if (!nav || !marker || !article) throw new Error("not mounted");
  const link = (name: string) => {
    const el = [...nav.querySelectorAll<HTMLElement>("a")].find((a) => a.textContent === name);
    if (!el) throw new Error(`no link ${name}`);
    return el;
  };
  const current = () =>
    [...nav.querySelectorAll<HTMLElement>("[aria-current]")].map(
      (a) => `${a.textContent}:${a.getAttribute("aria-current")}:${a.hasAttribute("data-current")}`,
    );
  const scroll = (top: number) => {
    article.scrollTop = top;
  };
  return { screen, nav, marker, article, link, current, scroll };
}

/**
 * Whether the marker's run is beside the link: from its top to its bottom, less a bend's half at
 * an end where the rail bends to the next level (7px at most).
 */
function beside(marker: SVGPathElement, link: Element, slack = 7.5): boolean {
  const { start, end } = run(marker);
  const rect = link.getBoundingClientRect();
  return Math.abs(start.y - rect.top) <= slack && Math.abs(end.y - rect.bottom) <= slack;
}

const transitions = (el: Element) =>
  el
    .getAnimations()
    .filter((a): a is CSSTransition => a instanceof CSSTransition)
    .map((a) => a.transitionProperty)
    .sort();

const TRAVEL = ["stroke-dasharray", "stroke-dashoffset"];

/** Resolves a color (e.g. `var(--ow-accent)`) to its computed rgb() inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

describe("Table of Contents", () => {
  test("renders a labelled nav of nested lists, with a decorative rail and marker", async () => {
    const { nav, marker, link } = await mount();
    expect(nav.tagName).toBe("NAV");
    expect(nav.getAttribute("aria-label")).toBe("On this page");
    const lists = [...nav.querySelectorAll("ul")];
    expect(lists.map((list) => list.dataset.depth)).toEqual(["1", "2"]);
    expect(link("Installation").dataset.depth).toBe("1");
    expect(link("npm").dataset.depth).toBe("2");
    expect(link("npm").closest("li")?.className).toBe("ow-table-of-contents__item");
    const rail = nav.querySelector("svg");
    expect(rail?.getAttribute("aria-hidden")).toBe("true");
    expect(rail?.getAttribute("focusable")).toBe("false");
    expect(rail?.contains(marker)).toBe(true);
    expect(marker.getAttribute("data-slot")).toBe("table-of-contents-marker");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const rootRef = createRef<HTMLElement>();
    const linkRef = createRef<HTMLAnchorElement>();
    const screen = await render(
      <TableOfContents.Root ref={rootRef} aria-label="On this page" className="mine">
        <TableOfContents.List className="list">
          <TableOfContents.Item className="item">
            <TableOfContents.Link ref={linkRef} href="#a" className="link">
              A
            </TableOfContents.Link>
          </TableOfContents.Item>
          <TableOfContents.Item>
            <TableOfContents.Link render={<a data-router="" href="#b" />}>B</TableOfContents.Link>
          </TableOfContents.Item>
        </TableOfContents.List>
      </TableOfContents.Root>,
    );
    const nav = screen.container.querySelector("nav");
    expect(rootRef.current).toBe(nav);
    expect(nav?.className).toBe("ow-table-of-contents mine");
    expect(nav?.querySelector("ul")?.className).toBe("ow-table-of-contents__list list");
    expect(nav?.querySelector("li")?.className).toBe("ow-table-of-contents__item item");
    expect(linkRef.current?.className).toBe("ow-table-of-contents__link link");
    const routed = nav?.querySelector("[data-router]");
    expect(routed?.className).toBe("ow-table-of-contents__link");
    expect(routed?.getAttribute("href")).toBe("#b");
  });

  test("nothing is current before hydration", () => {
    const html = renderToString(<Toc />);
    expect(html).not.toContain("aria-current");
    expect(html).not.toContain("data-current");
    expect(html).not.toContain("data-visible");
  });

  test("nothing is current until a target crosses the reading line", async () => {
    const { marker, current, scroll } = await mount();
    expect(current()).toEqual([]);
    expect(marker.hasAttribute("data-visible")).toBe(false);
    // Installation's top at 91px, just under the line.
    scroll(109);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(current()).toEqual([]);
    scroll(111);
    await expect.poll(current).toEqual(["Installation:location:true"]);
  });

  test("the current link is the last one whose target crossed the line, one at a time", async () => {
    const { current, scroll } = await mount();
    scroll(120);
    await expect.poll(current).toEqual(["Installation:location:true"]);
    scroll(450);
    await expect.poll(current).toEqual(["npm:location:true"]);
    // Usage, 160px down, has not reached the line yet.
    scroll(700);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(current()).toEqual(["npm:location:true"]);
    scroll(120);
    await expect.poll(current).toEqual(["Installation:location:true"]);
    scroll(0);
    await expect.poll(current).toEqual([]);
  });

  test("at the very end of the scroll area the last link is current", async () => {
    const { article, current, scroll } = await mount();
    scroll(article.scrollHeight);
    await expect.poll(current).toEqual(["API:location:true"]);
  });

  test("tracks the window when the targets have no scrolling ancestor", async () => {
    onTestFinished(() => window.scrollTo(0, 0));
    const { current } = await mount(
      <Page>
        <Article />
      </Page>,
    );
    window.scrollTo(0, 0);
    // The line is 30% down the window.
    const line = document.documentElement.clientHeight * 0.3;
    const install = document.getElementById("install");
    if (!install) throw new Error("no target");
    window.scrollTo(0, install.getBoundingClientRect().top + window.scrollY - line + 10);
    await expect.poll(current).toEqual(["Installation:location:true"]);
  });

  test("a clicked link stays current until the visitor scrolls", async () => {
    // As a click on Usage would: the article scrolls as far as it goes, and Usage stays current
    // though the end of the area would pick API.
    let article: HTMLElement | null = null;
    const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (article) article.scrollTop = article.scrollHeight;
    };
    const page = await mount(<Page onClick={onClick} />);
    article = page.article;
    page.link("Usage").click();
    expect(page.current()).toEqual(["Usage:location:true"]);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(page.current()).toEqual(["Usage:location:true"]);
    // Keys that do not scroll keep it.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(page.current()).toEqual(["Usage:location:true"]);
    page.article.dispatchEvent(new WheelEvent("wheel", { deltaY: -10 }));
    await expect.poll(page.current).toEqual(["API:location:true"]);

    page.link("npm").click();
    expect(page.current()).toEqual(["npm:location:true"]);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "PageUp" }));
    await expect.poll(page.current).toEqual(["API:location:true"]);

    page.link("Installation").click();
    page.article.dispatchEvent(new TouchEvent("touchstart"));
    await expect.poll(page.current).toEqual(["API:location:true"]);

    // A click that opens a new tab leaves the page, and the current link, as they are.
    page
      .link("npm")
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(page.current()).toEqual(["API:location:true"]);
  });

  test("places the marker beside the current link, on the rail, without travelling in", async () => {
    const { nav, marker, link, scroll } = await mount();
    scroll(120);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    expect(beside(marker, link("Installation"))).toBe(true);
    expect(transitions(marker)).toEqual([]);
    expect(getComputedStyle(marker).opacity).toBe("1");
    // On the rail: the top list's inline start, the marker's 2px just inside it.
    const edge = nav.querySelector("ul")?.getBoundingClientRect().left ?? Number.NaN;
    expect(run(marker).start.x).toBeCloseTo(edge + 1, 1);
    expect(getComputedStyle(marker).strokeWidth).toBe("2px");
  });

  test("travels to the next current link along the path, and rests on it", async () => {
    const { nav, marker, link, scroll } = await mount();
    scroll(120);
    await expect.poll(() => beside(marker, link("Installation"))).toBe(true);
    const before = run(marker).from;
    scroll(450);
    await expect.poll(() => transitions(marker)).toEqual(TRAVEL);
    expect(beside(marker, link("npm"))).toBe(false);
    await expect.poll(() => beside(marker, link("npm")), { timeout: 2000 }).toBe(true);
    await settle();
    expect(run(marker).from).toBeGreaterThan(before);
    // The sub-section is one level in: its run is 12px in from the section's.
    const edge = nav.querySelector("ul")?.getBoundingClientRect().left ?? Number.NaN;
    expect(run(marker).start.x).toBeCloseTo(edge + 13, 1);
    expect(run(marker).end.x).toBeCloseTo(edge + 13, 1);
  });

  test("the rail bends where the level changes, and the marker travels through the bend", async () => {
    const { nav, marker, link, scroll } = await mount();
    const rail = nav.querySelector<SVGPathElement>(".ow-table-of-contents__line");
    if (!rail) throw new Error("no rail");
    // Installation, npm, Usage, API are on levels 1, 2, 1, 1: two bends.
    await expect.poll(() => rail.getAttribute("d")?.match(/C/g)?.length).toBe(2);
    expect(marker.getAttribute("d")).toBe(rail.getAttribute("d"));
    // The rail is a continuous run beside each link, so its x only changes inside a bend.
    const x = (n: number) => rail.getPointAtLength(n).x;
    const total = rail.getTotalLength();
    const xs = Array.from({ length: 41 }, (_, i) => x((total * i) / 40));
    expect(new Set(xs.map((n) => Math.round(n * 10) / 10)).size).toBeGreaterThan(2);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(12, 0);
    // The bend lies between the two links' runs.
    scroll(120);
    await expect.poll(() => beside(marker, link("Installation"))).toBe(true);
    const first = run(marker);
    scroll(450);
    await expect.poll(() => beside(marker, link("npm")), { timeout: 2000 }).toBe(true);
    await settle();
    const second = run(marker);
    expect(first.from + first.len).toBeLessThan(second.from);
    // Midway between them, the rail is neither on the first run's x nor on the second's.
    const mid = x((first.from + first.len + second.from) / 2);
    expect(mid).toBeGreaterThan(Math.min(x(first.from), x(second.from)) + 1);
    expect(mid).toBeLessThan(Math.max(x(first.from), x(second.from)) - 1);
  });

  test("the marker travels by steps along the path, not by a jump", async () => {
    const { marker, link, scroll } = await mount();
    scroll(120);
    await expect.poll(() => beside(marker, link("Installation"))).toBe(true);
    scroll(450);
    await expect.poll(() => transitions(marker)).toEqual(TRAVEL);
    // Mid-travel the run is where the spring has it, between the two links' runs.
    const seen = new Set<number>();
    await expect
      .poll(
        () => {
          const { from } = run(marker);
          seen.add(Math.round(from));
          return seen.size;
        },
        { timeout: 2000 },
      )
      .toBeGreaterThan(3);
    await expect.poll(() => beside(marker, link("npm")), { timeout: 2000 }).toBe(true);
  });

  test("is as tall as a link whose title wraps onto two lines", async () => {
    const { marker, link, scroll } = await mount(<Page long style={{ inlineSize: 160 }} />);
    const install = link("Installing the package from npm or a registry");
    const lines =
      install.getBoundingClientRect().height /
      Number.parseFloat(getComputedStyle(install).lineHeight);
    expect(lines).toBeGreaterThan(2);
    scroll(120);
    await expect.poll(() => beside(marker, install)).toBe(true);
    // The run is its whole height, less the bend at its foot.
    expect(run(marker).len).toBeGreaterThan(
      2 * Number.parseFloat(getComputedStyle(install).lineHeight),
    );
    scroll(450);
    // A shorter run: its length changes on the way.
    await expect.poll(() => transitions(marker)).toEqual(TRAVEL);
    await expect.poll(() => beside(marker, link("npm")), { timeout: 2000 }).toBe(true);
    scroll(120);
    await expect.poll(() => beside(marker, install), { timeout: 2000 }).toBe(true);
  });

  test("a list with no nesting is a straight rail", async () => {
    const flat = await render(
      <div style={{ display: "flex", gap: 24, alignItems: "start" }}>
        <Article style={{ blockSize: 300 }} />
        <TableOfContents.Root aria-label="Flat" style={{ inlineSize: 200 }}>
          <TableOfContents.List>
            <TableOfContents.Item>
              <TableOfContents.Link href="#install">Installation</TableOfContents.Link>
            </TableOfContents.Item>
            <TableOfContents.Item>
              <TableOfContents.Link href="#usage">Usage</TableOfContents.Link>
            </TableOfContents.Item>
          </TableOfContents.List>
        </TableOfContents.Root>
      </div>,
    );
    const rail = flat.container.querySelector<SVGPathElement>(".ow-table-of-contents__line");
    await expect.poll(() => rail?.getAttribute("d")).toMatch(/^M[\d.]+ [\d.]+V[\d.]+V[\d.]+$/);
  });

  test("three levels bend down twice, and back up in one bend", async () => {
    const deep = await render(
      <div style={{ display: "flex", gap: 24, alignItems: "start" }}>
        <Article style={{ blockSize: 300 }} />
        <TableOfContents.Root aria-label="Deep" style={{ inlineSize: 200 }}>
          <TableOfContents.List>
            <TableOfContents.Item>
              <TableOfContents.Link href="#install">Installation</TableOfContents.Link>
              <TableOfContents.List>
                <TableOfContents.Item>
                  <TableOfContents.Link href="#npm">npm</TableOfContents.Link>
                  <TableOfContents.List>
                    <TableOfContents.Item>
                      <TableOfContents.Link href="#usage">Usage</TableOfContents.Link>
                    </TableOfContents.Item>
                  </TableOfContents.List>
                </TableOfContents.Item>
              </TableOfContents.List>
            </TableOfContents.Item>
            <TableOfContents.Item>
              <TableOfContents.Link href="#api">API</TableOfContents.Link>
            </TableOfContents.Item>
          </TableOfContents.List>
        </TableOfContents.Root>
      </div>,
    );
    const path = deep.container.querySelector<SVGPathElement>(".ow-table-of-contents__line");
    // Down two levels, and back up in one bend.
    await expect.poll(() => path?.getAttribute("d")?.match(/C/g)?.length).toBe(3);
    const xs = (path?.getAttribute("d") ?? "").match(/V[\d.]+/g)?.length;
    expect(xs).toBe(4);
  });

  test("fades out when no link is current, and fades in again where it lands", async () => {
    const { marker, link, scroll } = await mount();
    scroll(120);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    scroll(0);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(false);
    expect(transitions(marker)).toEqual(["opacity"]);
    await settle();
    scroll(450);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    expect(transitions(marker)).toEqual(["opacity"]);
    expect(beside(marker, link("npm"))).toBe(true);
  });

  test("snaps to its link when the nav resizes", async () => {
    const { screen, marker, link, scroll } = await mount(<Page long />);
    scroll(120);
    const install = link("Installing the package from npm or a registry");
    await expect.poll(() => beside(marker, install)).toBe(true);
    screen.rerender(<Page long style={{ inlineSize: 140 }} />);
    await expect.poll(() => beside(marker, install)).toBe(true);
    expect(transitions(marker)).toEqual([]);
  });

  test("places the marker inside a scaled ancestor", async () => {
    const { marker, link, scroll } = await mount(
      <div style={{ transform: "scale(0.5)", transformOrigin: "0 0" }}>
        <Page />
      </div>,
    );
    scroll(120);
    await expect.poll(() => beside(marker, link("Installation"))).toBe(true);
    scroll(450);
    await expect.poll(() => beside(marker, link("npm")), { timeout: 2000 }).toBe(true);
  });

  test("a hidden nav places the marker once it shows", async () => {
    const { screen, marker, link, current, scroll } = await mount(
      <Page style={{ display: "none" }} />,
    );
    scroll(120);
    await expect.poll(current).toEqual(["Installation:location:true"]);
    expect(marker.hasAttribute("data-visible")).toBe(false);
    screen.rerender(<Page />);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    expect(beside(marker, link("Installation"))).toBe(true);
  });

  test("follows links that change, and lets go of everything on unmount", async () => {
    const { screen, nav, marker, current, scroll } = await mount();
    scroll(450);
    await expect.poll(current).toEqual(["npm:location:true"]);
    // Its target is now API, which is below the line.
    nav.querySelector('[href="#npm"]')?.setAttribute("href", "#api");
    await expect.poll(current).toEqual(["Installation:location:true"]);
    screen.unmount();
    expect(nav.querySelector("[aria-current], [data-current]")).toBeNull();
    expect(marker.hasAttribute("data-visible")).toBe(false);
  });

  test("reads the theme tokens in light and dark: muted links, the current one in the text color", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { nav, marker, link, scroll } = await mount();
    scroll(120);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(getComputedStyle(link("Installation")).color, theme).toBe(
        resolveColor("var(--ow-fg)"),
      );
      expect(getComputedStyle(link("Usage")).color, theme).toBe(resolveColor("var(--ow-muted)"));
      expect(getComputedStyle(marker).stroke, theme).toBe(resolveColor("var(--ow-accent)"));
      const line = nav.querySelector(".ow-table-of-contents__line");
      expect(line && getComputedStyle(line).stroke, theme).toBe(resolveColor("var(--ow-line)"));
    }
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const { nav, marker, scroll } = await mount(
      <Page style={{ "--ow-accent": "rgb(255, 0, 0)" } as CSSProperties} />,
    );
    scroll(120);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    expect(getComputedStyle(marker).stroke).toBe("rgb(255, 0, 0)");
    expect(nav.parentElement && resolveColor("var(--ow-accent)", nav.parentElement)).not.toBe(
      "rgb(255, 0, 0)",
    );
  });

  test("shows keyboard focus with a 2px ring inside the link, from the focus token (FR-13)", async () => {
    const screen = await render(<Toc />);
    await userEvent.tab();
    const link = screen.container.querySelector("a");
    expect(document.activeElement).toBe(link);
    const style = getComputedStyle(link as Element);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("-2px");
    expect(style.outlineColor).toBe(resolveColor("var(--ow-focus)"));
  });

  test("right to left, the rail and the marker are on the right (FR-16)", async () => {
    const { nav, marker, scroll } = await mount(
      <div dir="rtl">
        <Page />
      </div>,
    );
    scroll(120);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    const list = nav.querySelector("ul");
    if (!list) throw new Error("no list");
    // The marker's 2px are just inside the list's right edge.
    expect(run(marker).start.x).toBeCloseTo(list.getBoundingClientRect().right - 1, 1);
  });

  test("with reduced motion, the marker jumps to the next link (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { marker, link, scroll } = await mount();
    scroll(120);
    await expect.poll(() => beside(marker, link("Installation"))).toBe(true);
    scroll(450);
    await expect.poll(() => beside(marker, link("npm")), { timeout: 200 }).toBe(true);
    expect(transitions(marker)).toEqual([]);
  });

  test("stays legible in forced colors: the marker in Highlight, the current link underlined (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { marker, link, scroll } = await mount();
    scroll(120);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    await commands.setForcedColors("active");
    const probe = document.createElement("span");
    probe.style.color = "Highlight";
    document.body.append(probe);
    onTestFinished(() => probe.remove());
    expect(getComputedStyle(marker).stroke).toBe(getComputedStyle(probe).color);
    expect(getComputedStyle(link("Installation")).textDecorationLine).toBe("underline");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { nav, marker, scroll } = await mount();
    scroll(450);
    await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
    // As in Tree Rail Nav's test: axe cannot read text contrast under an SVG, so the drawing is out
    // of it; the marker's and the rail's colors are checked above.
    const svg = nav.querySelector<SVGElement>("svg");
    if (svg) svg.style.display = "none";
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await settle();
      expect(await axeReport(nav)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a change too", async () => {
    const { scroll } = await mount();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    scroll(120);
    await new Promise((resolve) => setTimeout(resolve, 50));
    scroll(450);
    await settle({ maxMs: 3000 });
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

test("every part has its data-slot", async () => {
  const { nav } = await mount();
  const slots = [
    ...new Set([...nav.querySelectorAll("[data-slot]")].map((el) => el.getAttribute("data-slot"))),
  ];
  expect([nav.dataset.slot, ...slots]).toEqual([
    "table-of-contents",
    "table-of-contents-list",
    "table-of-contents-item",
    "table-of-contents-link",
    "table-of-contents-rail",
    "table-of-contents-marker",
  ]);
});

test("tracking survives another data-slot on a link and a list", async () => {
  const { nav, marker, link } = await mount(
    <div style={{ display: "flex", gap: 24, alignItems: "start" }}>
      <Article style={{ blockSize: 300 }} />
      <TableOfContents.Root aria-label="On this page" style={{ inlineSize: 200 }}>
        <TableOfContents.List data-slot="mine" style={{ paddingInlineStart: 20 }}>
          <TableOfContents.Item>
            <TableOfContents.Link data-slot="mine" href="#install">
              Installation
            </TableOfContents.Link>
          </TableOfContents.Item>
        </TableOfContents.List>
      </TableOfContents.Root>
    </div>,
  );
  expect(link("Installation").dataset.slot).toBe("table-of-contents-link");
  expect(nav.querySelector("ul")?.dataset.slot).toBe("table-of-contents-list");
  link("Installation").click();
  await expect.poll(() => marker.hasAttribute("data-visible")).toBe(true);
  expect(link("Installation").getAttribute("aria-current")).toBe("location");
  // The marker rests on the list's rail: the list's start edge, not the link's.
  const rail = (nav.querySelector("ul") as HTMLElement).getBoundingClientRect();
  expect(run(marker).start.x).toBeCloseTo(rail.left + 1, 1);
});
