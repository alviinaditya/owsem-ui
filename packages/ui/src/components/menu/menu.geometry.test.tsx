import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { concentric, insets, TOL } from "../../../test/geometry.ts";
import { settle } from "../../../test/raf-counter.ts";
import { Menu, type MenuSize } from "./index";

const Glyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

// FR-9's rule with --py 0.5em at line-height 1.25: 13, 14, and 16px type.
const SIZES: Record<MenuSize, { height: number; icon: number }> = {
  sm: { height: 29.25, icon: 15 },
  md: { height: 31.5, icon: 16 },
  lg: { height: 36, icon: 18 },
};

describe("Menu geometry (FR-9, FR-10, FR-10b)", () => {
  for (const [size, expected] of Object.entries(SIZES) as [MenuSize, typeof SIZES.md][]) {
    test(`${size}: items ${expected.height} px tall, icons even, the popup concentric`, async () => {
      await render(
        <Menu.Root defaultOpen>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup size={size}>
                <Menu.Item>
                  <Glyph />
                  Cut
                  <kbd>⌘X</kbd>
                </Menu.Item>
                <Menu.CheckboxItem defaultChecked>
                  <Menu.CheckboxItemIndicator />
                  Wrap
                </Menu.CheckboxItem>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );
      await settle();
      const items = [...document.querySelectorAll<HTMLElement>(".ow-menu-item")];
      expect(items).toHaveLength(3);
      for (const item of items) {
        expect(item.getBoundingClientRect().height, item.textContent ?? "").toBeCloseTo(
          expected.height,
          1,
        );
      }
      // Icon, indicator, and chevron: the font size plus 2px, as far from the side as the top.
      const [cut, wrap, more] = items as [HTMLElement, HTMLElement, HTMLElement];
      for (const [el, icon] of [
        [cut, cut.querySelector("svg")],
        [wrap, wrap.querySelector(".ow-menu-indicator")],
        [more, more.querySelector(".ow-menu-chevron")],
      ] as const) {
        if (!icon) throw new Error("no icon");
        const box = icon.getBoundingClientRect();
        expect(box.width).toBeCloseTo(expected.icon, 1);
        const gap = insets(el, icon);
        const side = icon === more.querySelector(".ow-menu-chevron") ? gap.right : gap.left;
        expect(Math.abs(side - gap.top)).toBeLessThanOrEqual(TOL);
      }
      const popup = document.querySelector(".ow-menu-popup") as HTMLElement;
      const ring = concentric(popup, cut);
      expect(ring.delta).toBeLessThanOrEqual(TOL);
      expect(ring.insetDelta).toBeLessThanOrEqual(TOL);
    });
  }
});
