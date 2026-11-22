import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, nested, TOL } from "../../../test/geometry.ts";
import { Toggle } from "../toggle";
import { Toolbar, type ToolbarSize } from "./index";

const Glyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const all = (selector: string) => [...screen.container.querySelectorAll<HTMLElement>(selector)];
  return { all, one: (selector: string) => all(selector)[0] as HTMLElement };
}

// FR-11: the bar is as tall as a Button of its size; the items are 8 px shorter (the inset on
// both sides). Icons are the font size plus 2 px.
const SIZES: Record<ToolbarSize, { bar: number; height: number; icon: number }> = {
  sm: { bar: 32, height: 24, icon: 15 },
  md: { bar: 40, height: 32, icon: 16 },
  lg: { bar: 48, height: 40, icon: 18 },
};

describe("Toolbar geometry (FR-9 to FR-11, FR-10b)", () => {
  for (const [size, expected] of Object.entries(SIZES) as [ToolbarSize, typeof SIZES.md][]) {
    test(`${size}: the bar ${expected.bar} px, every item ${expected.height} px tall, icons even, the panel concentric`, async () => {
      const { all, one } = await mount(
        <Toolbar.Root aria-label="Bar" size={size}>
          <Toolbar.Button aria-label="Icon" startIcon={<Glyph />} />
          <Toolbar.Button startIcon={<Glyph />}>Label</Toolbar.Button>
          <Toolbar.Button render={<Toggle />} aria-label="Toggle" startIcon={<Glyph />} />
          <Toolbar.Separator />
          <Toolbar.Link href="#a" endIcon={<Glyph />}>
            Link
          </Toolbar.Link>
          <Toolbar.Input aria-label="Field" />
        </Toolbar.Root>,
      );
      expect(
        Math.abs(one(".ow-toolbar").getBoundingClientRect().height - expected.bar),
      ).toBeLessThanOrEqual(TOL);
      const items = all(".ow-toolbar__button, .ow-toolbar__link, .ow-toolbar__input");
      expect(items).toHaveLength(5);
      for (const item of items) {
        expect(
          Math.abs(item.getBoundingClientRect().height - expected.height),
          item.className,
        ).toBeLessThanOrEqual(TOL);
      }

      // Icon only: a square, also when the item renders a Toggle (FR-10a).
      for (const square of all("[data-icon-only]")) {
        const box = square.getBoundingClientRect();
        expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(TOL);
      }

      // A start icon sits as far from the side as from the top; an end icon too.
      const [start, end] = all(".ow-toolbar__icon").filter(
        (icon) => !icon.parentElement?.hasAttribute("data-icon-only"),
      );
      if (!start?.parentElement || !end?.parentElement) throw new Error("no icons");
      expect(start.getBoundingClientRect().width).toBeCloseTo(expected.icon, 1);
      const a = insets(start.parentElement, start);
      expect(Math.abs(a.left - a.top)).toBeLessThanOrEqual(TOL);
      const b = insets(end.parentElement, end);
      expect(Math.abs(b.right - b.top)).toBeLessThanOrEqual(TOL);

      // The separator is as long as an icon; the panel takes the one radius, its items that less
      // the padding (TK-8).
      expect(one(".ow-toolbar__separator").getBoundingClientRect().height).toBeCloseTo(
        expected.icon,
        1,
      );
      const r = nested(one(".ow-toolbar"), one(".ow-toolbar__button"));
      expect(r.outerDelta).toBeLessThanOrEqual(TOL);
      expect(r.innerDelta).toBeLessThanOrEqual(TOL);
      expect(r.insetDelta).toBeLessThanOrEqual(TOL);
    });
  }
});
