import type { CSSProperties } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { settle } from "../../../test/raf-counter.ts";
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
  test("the marker covers the rail and is as tall as the current link, wrapped or not", async () => {
    const { get, links } = await mount(dir);
    const [install, recolor] = links;
    const article = get(".article");
    const marker = get(".ow-table-of-contents__marker");
    const rail = get(".ow-table-of-contents__list").getBoundingClientRect();
    if (!install || !recolor) throw new Error("no links");
    // The nested title wraps onto two lines.
    const line = Number.parseFloat(getComputedStyle(recolor).lineHeight);
    expect(recolor.getBoundingClientRect().height).toBeGreaterThan(2 * line);
    for (const [top, link] of [
      [120, install],
      [450, recolor],
    ] as const) {
      article.scrollTop = top;
      // WebKit can hold back the scroll event of a test frame it throttles; this test is about
      // where the marker lands, so the event is sent here.
      article.dispatchEvent(new Event("scroll"));
      await expect.poll(() => link.hasAttribute("data-current")).toBe(true);
      await settle({ maxMs: 3000 });
      const m = marker.getBoundingClientRect();
      const l = link.getBoundingClientRect();
      expect(Math.abs(m.top - l.top)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(m.bottom - l.bottom)).toBeLessThanOrEqual(TOL);
      expect(m.width).toBeCloseTo(2, 1);
      // Its outer edge is the rail's: the top list's inline start.
      const edge = dir === "ltr" ? m.left - rail.left : rail.right - m.right;
      expect(Math.abs(edge)).toBeLessThanOrEqual(TOL);
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
