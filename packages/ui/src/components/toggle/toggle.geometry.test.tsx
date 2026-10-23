import type { CSSProperties, ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, TOL } from "../../../test/geometry.ts";
import { Toggle, type ToggleSize } from "./index";

const Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(<div style={{ display: "flex", gap: 8 }}>{ui}</div>);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-toggle")];
}

const iconOf = (toggle: HTMLElement | undefined) => {
  const icon = toggle?.querySelector(".ow-toggle__icon");
  if (!toggle || !icon) throw new Error("no icon");
  return { toggle, icon };
};

// FR-11: font 13/14/16 px, height 2 × --py + 1lh at line-height 1.25, icon font + 2 px.
const SIZES: Record<ToggleSize, { height: number; icon: number; inset: number }> = {
  sm: { height: 29.25, icon: 15, inset: 7.125 },
  md: { height: 38.5, icon: 16, inset: 11.25 },
  lg: { height: 48, icon: 18, inset: 15 },
};

describe("Toggle geometry (FR-9 to FR-11, Button's)", () => {
  for (const [size, expected] of Object.entries(SIZES) as [ToggleSize, typeof SIZES.md][]) {
    test(`${size}: ${expected.height} px tall, icons ${expected.icon} px and evenly inset`, async () => {
      const [label, start, end, iconOnly] = await mount(
        <>
          <Toggle size={size}>Label</Toggle>
          <Toggle size={size} startIcon={<Icon />}>
            Label
          </Toggle>
          <Toggle size={size} endIcon={<Icon />}>
            Label
          </Toggle>
          <Toggle size={size} aria-label="Icon" startIcon={<Icon />} />
        </>,
      );
      for (const toggle of [label, start, end, iconOnly]) {
        expect(toggle?.getBoundingClientRect().height).toBeCloseTo(expected.height, 1);
      }

      const a = iconOf(start);
      const startGap = insets(a.toggle, a.icon);
      expect(a.icon.getBoundingClientRect().width).toBeCloseTo(expected.icon, 1);
      expect(startGap.top).toBeCloseTo(expected.inset, 1);
      expect(Math.abs(startGap.left - startGap.top)).toBeLessThanOrEqual(TOL);

      const b = iconOf(end);
      const endGap = insets(b.toggle, b.icon);
      expect(Math.abs(endGap.right - endGap.top)).toBeLessThanOrEqual(TOL);

      // Icon only: a square, the icon centered (FR-10a).
      const c = iconOf(iconOnly);
      const box = c.toggle.getBoundingClientRect();
      expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(TOL);
      const centered = insets(c.toggle, c.icon);
      expect(Math.abs(centered.left - centered.top)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(centered.right - centered.bottom)).toBeLessThanOrEqual(TOL);
    });
  }

  test("a --py under the floor still gives a 24 px target (FR-14)", async () => {
    const floor = { "--py": "0px" } as CSSProperties;
    const [label, iconOnly] = await mount(
      <>
        <Toggle size="sm" style={floor}>
          Label
        </Toggle>
        <Toggle size="sm" style={floor} aria-label="Icon" startIcon={<Icon />} />
      </>,
    );
    expect(label?.getBoundingClientRect().height).toBeCloseTo(24, 1);
    const box = iconOnly?.getBoundingClientRect();
    expect(box?.height).toBeCloseTo(24, 1);
    expect(box?.width).toBeCloseTo(24, 1);
  });

  test("--py set on the toggle changes its height; on a wrapper it does not (FR-11a)", async () => {
    const [own, wrapped] = await mount(
      <>
        <Toggle style={{ "--py": "1em" } as CSSProperties}>Own</Toggle>
        <span style={{ "--py": "1em" } as CSSProperties}>
          <Toggle>Wrapped</Toggle>
        </span>
      </>,
    );
    // md: 2 × 14 + 17.5.
    expect(own?.getBoundingClientRect().height).toBeCloseTo(45.5, 1);
    expect(wrapped?.getBoundingClientRect().height).toBeCloseTo(SIZES.md.height, 1);
  });
});
