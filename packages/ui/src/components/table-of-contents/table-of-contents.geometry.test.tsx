import type { CSSProperties } from "react";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { run } from "../../../test/toc-run.ts";
import { TableOfContents } from "./index";

const block = (height: number) => ({ blockSize: height, margin: 0 }) satisfies CSSProperties;

async function mount(dir: "ltr" | "rtl") {
  const screen = await render(
    <div dir={dir} style={{ display: "flex", gap: 24, alignItems: "start" }}>
      <div className="article" style={{ inlineSize: 300, blockSize: 300, overflowY: "auto" }}>
        <p style={block(200)} />
        <h2 id="install" style={block(30)}>
          Installation
        </h2>
        <p style={block(300)} />
        <h3 id="recolor" style={block(30)}>
          Recoloring
        </h3>
        <p style={block(600)} />
      </div>
      <TableOfContents.Root aria-label="On this page" style={{ inlineSize: 160 }}>
        <TableOfContents.List>
          <TableOfContents.Item>
            <TableOfContents.Link href="#install">Installation</TableOfContents.Link>
            <TableOfContents.List>
              <TableOfContents.Item>
                <TableOfContents.Link href="#recolor">
                  Recoloring a component with theme tokens
                </TableOfContents.Link>
              </TableOfContents.Item>
            </TableOfContents.List>
          </TableOfContents.Item>
        </TableOfContents.List>
      </TableOfContents.Root>
    </div>,
  );
  const get = (selector: string) => {
    const el = screen.container.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`no ${selector}`);
    return el;
  };
  return { get, links: [...screen.container.querySelectorAll<HTMLElement>("a")] };
}

describe.each(["ltr", "rtl"] as const)("Table of Contents geometry, %s", (dir) => {
  // Where the marker lands, not how it slides: without motion it rests on the link at once, so
  // the test never waits on frames WebKit may hold back in a throttled test frame.
  beforeAll(() => commands.setReducedMotion("reduce"));
  afterAll(() => commands.setReducedMotion("no-preference"));

  test("the marker's run is beside the current link, on the rail, wrapped or not", async () => {
    const { get, links } = await mount(dir);
    const [install, recolor] = links;
    const article = get(".article");
    const marker = get(".ow-table-of-contents__marker");
    const rail = get(".ow-table-of-contents__list").getBoundingClientRect();
    if (!install || !recolor) throw new Error("no links");
    // The nested title wraps onto two lines.
    const line = Number.parseFloat(getComputedStyle(recolor).lineHeight);
    expect(recolor.getBoundingClientRect().height).toBeGreaterThan(2 * line);
    for (const [top, link, indent] of [
      [120, install, 0],
      [450, recolor, 12],
    ] as const) {
      article.scrollTop = top;
      // WebKit can hold back the scroll event of a test frame it throttles; this test is about
      // where the marker lands, so the event is sent here.
      article.dispatchEvent(new Event("scroll"));
      await expect.poll(() => link.hasAttribute("data-current")).toBe(true);
      // The run ends where the rail bends to the other level, up to 7px short of the link's edge.
      const l = link.getBoundingClientRect();
      const { start, end } = run(marker);
      expect(Math.abs(start.y - l.top)).toBeLessThanOrEqual(TOL + (link === recolor ? 7 : 0));
      expect(Math.abs(end.y - l.bottom)).toBeLessThanOrEqual(TOL + (link === install ? 7 : 0));
      expect(getComputedStyle(marker).strokeWidth).toBe("2px");
      // Its outer edge is the rail's, the top list's inline start, moved in with the level.
      const edge = dir === "ltr" ? start.x - 1 - rail.left : rail.right - (start.x + 1);
      expect(Math.abs(edge - indent)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(end.x - start.x)).toBeLessThanOrEqual(TOL);
    }
  });

  test("links are pointer targets of 24px or more; sub-sections indent (FR-14)", async () => {
    const { links } = await mount(dir);
    const [install, recolor] = links;
    if (!install || !recolor) throw new Error("no links");
    for (const link of links) {
      expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
    const start = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const text = range.getClientRects()[0];
      if (!text) throw new Error("no text");
      return dir === "ltr" ? text.left : -text.right;
    };
    expect(start(recolor) - start(install)).toBeCloseTo(12, 0);
  });
});
