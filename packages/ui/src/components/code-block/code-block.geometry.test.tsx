import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { TOL, usedRadius } from "../../../test/geometry.ts";
import { CodeBlock } from "./index";

const Glyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const LONG = `const line = "${"x".repeat(120)}";`;

async function mount(dir: "ltr" | "rtl", tabs: boolean) {
  const screen = await render(
    <div dir={dir} style={{ inlineSize: 360 }}>
      <CodeBlock.Root defaultValue="a">
        <CodeBlock.Header>
          {tabs ? (
            <CodeBlock.List aria-label="Files">
              <CodeBlock.Tab value="a" icon={<Glyph />}>
                a.tsx
              </CodeBlock.Tab>
              <CodeBlock.Tab value="b" icon={<Glyph />}>
                b.css
              </CodeBlock.Tab>
            </CodeBlock.List>
          ) : (
            <CodeBlock.Title icon={<Glyph />}>a.tsx</CodeBlock.Title>
          )}
          <CodeBlock.Copy />
        </CodeBlock.Header>
        <CodeBlock.Panel value={tabs ? "a" : undefined}>
          <pre>
            <code>
              {LONG}
              <span className="end" />
            </code>
          </pre>
        </CodeBlock.Panel>
      </CodeBlock.Root>
    </div>,
  );
  const get = (selector: string) => {
    const el = screen.container.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`no ${selector}`);
    return el;
  };
  return get;
}

const near = (a: number, b: number) => Math.abs(a - b) <= TOL;

describe.each(["ltr", "rtl"] as const)("Code Block geometry, %s", (dir) => {
  test.each([false, true])("nested cards with one corner radius, tabs: %s", async (tabs) => {
    const get = await mount(dir, tabs);
    const root = get(".ow-code-block").getBoundingClientRect();
    const header = get(".ow-code-block__header").getBoundingClientRect();
    const panel = get(".ow-code-block__panel");
    const box = panel.getBoundingClientRect();
    // The inner card fills the outer one's width and bottom, and reaches 10px up over the header.
    expect(near(box.left, root.left) && near(box.right, root.right)).toBe(true);
    expect(near(box.bottom, root.bottom)).toBe(true);
    expect(near(box.top, header.bottom - 10)).toBe(true);
    // The same corners, concentric with the keys in the header (FR-10b): 8px + the 6px padding.
    expect(usedRadius(panel)).toBeCloseTo(usedRadius(get(".ow-code-block")), 1);
    const copy = get(".ow-code-block__copy");
    const key = copy.getBoundingClientRect();
    const pad = key.top - root.top;
    expect(pad).toBeCloseTo(6, 1);
    expect(usedRadius(get(".ow-code-block"))).toBeCloseTo(usedRadius(copy) + pad, 1);
    // Copy sits as far from its side as from the top.
    const side = dir === "ltr" ? root.right - key.right : key.left - root.left;
    expect(side).toBeCloseTo(pad, 1);
  });

  test.each([false, true])(
    "the icon sits as far from the edge as from the top, tabs: %s",
    async (tabs) => {
      const get = await mount(dir, tabs);
      const root = get(".ow-code-block").getBoundingClientRect();
      const icon = get(".ow-code-block__icon svg").getBoundingClientRect();
      const copy = get(".ow-code-block__copy").getBoundingClientRect();
      const fromTop = icon.top - root.top;
      const fromSide = dir === "ltr" ? icon.left - root.left : root.right - icon.right;
      expect(fromSide).toBeCloseTo(fromTop, 0);
      // Centered on the row of keys.
      expect(icon.top + icon.height / 2).toBeCloseTo(copy.top + copy.height / 2, 0);
    },
  );

  test("a long line scrolls in the panel, left to right on any page, and keeps its padding at the end", async () => {
    const get = await mount(dir, false);
    const panel = get(".ow-code-block__panel");
    expect(panel.scrollWidth).toBeGreaterThan(panel.clientWidth);
    // It starts at the code's start, on the left.
    const code = get(".ow-code-block__panel pre").getBoundingClientRect();
    expect(code.left).toBeCloseTo(panel.getBoundingClientRect().left, 0);
    panel.scrollLeft = panel.scrollWidth;
    const end = get(".end").getBoundingClientRect();
    expect(panel.getBoundingClientRect().right - end.right).toBeGreaterThanOrEqual(16 - TOL);
  });
});
