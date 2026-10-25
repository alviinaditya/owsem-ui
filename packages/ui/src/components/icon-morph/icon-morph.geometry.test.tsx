import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { Button, IconButton } from "../button";
import { Toggle } from "../toggle";
import { IconMorph } from "./index";

function Glyph({ name, size }: { name: string; size: number }) {
  return (
    <svg data-icon={name} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function Row({ big }: { big: boolean }) {
  return (
    <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16 }}>
      <span className="before">Copy</span>
      <IconMorph>
        {big ? (
          <Glyph key="big" name="big" size={24} />
        ) : (
          <Glyph key="small" name="small" size={16} />
        )}
      </IconMorph>
      <span className="after">code</span>
    </p>
  );
}

const center = (r: DOMRect) => [r.left + r.width / 2, r.top + r.height / 2];

describe("Icon Morph geometry", () => {
  test("both icons share one cell, centered, and nothing beside them moves mid-swap", async () => {
    const screen = await render(<Row big={false} />);
    const get = (selector: string) => {
      const el = screen.container.querySelector<HTMLElement>(selector);
      if (!el) throw new Error(`no ${selector}`);
      return el;
    };
    const root = get(".ow-icon-morph");
    expect(root.getBoundingClientRect().width).toBeCloseTo(16, 1);

    await screen.rerender(<Row big />);
    const small = get('[data-icon="small"]').parentElement as HTMLElement;
    const big = get('[data-icon="big"]').parentElement as HTMLElement;
    expect(small.hasAttribute("data-ending-style")).toBe(true);
    // One cell, as large as the larger icon, with both icons centered in it.
    const cell = root.getBoundingClientRect();
    expect(cell.width).toBeCloseTo(24, 1);
    expect(cell.height).toBeCloseTo(24, 1);
    for (const item of [small, big]) {
      const [x, y] = center(item.getBoundingClientRect());
      const [cx, cy] = center(cell);
      expect(Math.abs((x ?? 0) - (cx ?? 0))).toBeLessThanOrEqual(TOL);
      expect(Math.abs((y ?? 0) - (cy ?? 0))).toBeLessThanOrEqual(TOL);
    }
    const after = get(".after").getBoundingClientRect().left;
    // The leaving icon goes, and the text after it stays where it was. Polled, not settle(),
    // which times out in WebKit on CI.
    await expect
      .poll(() => screen.container.querySelectorAll(".ow-icon-morph__item").length, {
        timeout: 5000,
      })
      .toBe(1);
    expect(Math.abs(get(".after").getBoundingClientRect().left - after)).toBeLessThanOrEqual(TOL);
  });

  test.each(["sm", "md", "lg"] as const)(
    "in an icon slot, its icons fill the slot as one icon does, %s",
    async (size) => {
      // A 24px icon, as icon libraries draw them: the slot sizes it.
      const morph = (name: string) => (
        <IconMorph>
          <Glyph key={name} name={name} size={24} />
        </IconMorph>
      );
      const screen = await render(
        <div style={{ display: "flex", gap: 8 }}>
          <Button size={size} startIcon={<Glyph name="plain" size={24} />}>
            Copy
          </Button>
          <Button size={size} startIcon={morph("button")}>
            Copy
          </Button>
          <IconButton size={size} aria-label="Copy" icon={morph("icon-button")} />
          <Toggle size={size} aria-label="Pin" startIcon={morph("toggle")} />
        </div>,
      );
      const box = (selector: string) => {
        const el = screen.container.querySelector(selector);
        if (!el) throw new Error(`no ${selector}`);
        return el.getBoundingClientRect();
      };
      const plain = box('[data-icon="plain"]');
      expect(plain.width).toBeLessThan(24);
      for (const name of ["button", "icon-button", "toggle"]) {
        const icon = box(`[data-icon="${name}"]`);
        expect(Math.abs(icon.width - plain.width), name).toBeLessThanOrEqual(TOL);
        expect(Math.abs(icon.height - plain.height), name).toBeLessThanOrEqual(TOL);
      }
      // The button keeps the height of one with a plain icon.
      const [a, b] = [...screen.container.querySelectorAll(".ow-button")].map((el) =>
        el.getBoundingClientRect(),
      );
      expect(Math.abs((a?.height ?? 0) - (b?.height ?? 0))).toBeLessThanOrEqual(TOL);
    },
  );
});
