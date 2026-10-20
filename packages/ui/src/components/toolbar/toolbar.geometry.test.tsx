import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { concentric, insets, TOL } from "../../../test/geometry.ts";
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

// FR-11: 2 × --py + 1lh at line-height 1.25; icons the font size plus 2 px.
const SIZES: Record<ToolbarSize, { height: number; icon: number }> = {
  sm: { height: 29.25, icon: 15 },
  md: { height: 38.5, icon: 16 },
  lg: { height: 48, icon: 18 },
};

describe("Toolbar geometry (FR-9 to FR-11, FR-10b)", () => {
  for (const [size, expected] of Object.entries(SIZES) as [ToolbarSize, typeof SIZES.md][]) {
    test(`${size}: every item ${expected.height} px tall, icons even, the panel concentric`, async () => {
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
      const items = all(".ow-toolbar-button, .ow-toolbar-link, .ow-toolbar-input");
      expect(items).toHaveLength(5);
      for (const item of items) {
        expect(item.getBoundingClientRect().height, item.className).toBeCloseTo(expected.height, 1);
      }

      // Icon only: a square, also when the item renders a Toggle (FR-10a).
      for (const square of all("[data-icon-only]")) {
        const box = square.getBoundingClientRect();
        expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(TOL);
      }

      // A start icon sits as far from the side as from the top; an end icon too.
      const [start, end] = all(".ow-toolbar-icon").filter(
        (icon) => !icon.parentElement?.hasAttribute("data-icon-only"),
      );
      if (!start?.parentElement || !end?.parentElement) throw new Error("no icons");
      expect(start.getBoundingClientRect().width).toBeCloseTo(expected.icon, 1);
      const a = insets(start.parentElement, start);
      expect(Math.abs(a.left - a.top)).toBeLessThanOrEqual(TOL);
      const b = insets(end.parentElement, end);
      expect(Math.abs(b.right - b.top)).toBeLessThanOrEqual(TOL);

      // The groove is as long as an icon; the panel's corners are its items' plus the padding.
      expect(one(".ow-toolbar-separator").getBoundingClientRect().height).toBeCloseTo(
        expected.icon,
        1,
      );
      const r = concentric(one(".ow-toolbar"), one(".ow-toolbar-button"));
      expect(r.delta).toBeLessThanOrEqual(TOL);
      expect(r.insetDelta).toBeLessThanOrEqual(TOL);
    });
  }
});
