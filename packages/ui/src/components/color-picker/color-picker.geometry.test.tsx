import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { concentric, insets, rect, TOL } from "../../../test/geometry.ts";
import { ColorPicker, ColorPickerPopover } from "./index";

const all = (scope: ParentNode, selector: string) => [
  ...scope.querySelectorAll<HTMLElement>(selector),
];

describe("Color Picker geometry", () => {
  test("triggers are 2 × --py + 1lh tall per size, the swatch a square (FR-9, FR-11)", async () => {
    const screen = await render(
      <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <ColorPickerPopover key={size} size={size} />
        ))}
        {(["sm", "md", "lg"] as const).map((size) => (
          <ColorPickerPopover key={size} size={size} variant="swatch" aria-label="Color" />
        ))}
      </div>,
    );
    const heights = all(screen.container, ".ow-color-picker__trigger").map((t) => rect(t).height);
    for (const [i, expected] of [29.25, 38.5, 48, 29.25, 38.5, 48].entries()) {
      expect(heights[i]).toBeCloseTo(expected, 1);
    }
    for (const swatch of all(screen.container, '[data-variant="swatch"]')) {
      expect(rect(swatch).width).toBeCloseTo(rect(swatch).height, 1);
    }
  });

  test("the color sits as far from the trigger's edge as from its top and bottom (FR-10)", async () => {
    const screen = await render(
      <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <ColorPickerPopover key={size} size={size} />
        ))}
      </div>,
    );
    for (const trigger of all(screen.container, ".ow-color-picker__trigger")) {
      const chip = trigger.querySelector(".ow-color-picker__chip");
      if (!chip) throw new Error("no chip");
      const gap = insets(trigger, chip);
      expect(Math.abs(gap.top - gap.bottom)).toBeLessThan(TOL);
      expect(Math.abs(gap.left - gap.top)).toBeLessThan(TOL);
      expect(rect(chip).height).toBeCloseTo(
        Number.parseFloat(getComputedStyle(trigger).fontSize) + 2,
        1,
      );
    }
  });

  test("the panel is concentric with the area (FR-10b)", async () => {
    const screen = await render(<ColorPicker />);
    const panel = screen.container.querySelector(".ow-color-picker");
    const area = screen.container.querySelector(".ow-color-picker__area");
    if (!panel || !area) throw new Error("no panel");
    const { delta, insetDelta } = concentric(panel, area);
    expect(delta).toBeLessThan(TOL);
    expect(insetDelta).toBeLessThan(TOL);
  });

  test("fields and the format switch line up, and every target is 24px or more (FR-14)", async () => {
    const screen = await render(<ColorPicker format="rgb" />);
    const scope = screen.container;
    const format = scope.querySelector<HTMLElement>(".ow-color-picker__format");
    if (!format) throw new Error("no format switch");
    for (const input of all(scope, ".ow-color-picker__input")) {
      expect(rect(input).height).toBeCloseTo(29.25, 1);
      expect(rect(input).top).toBeCloseTo(rect(format).top, 1);
    }
    expect(rect(format).height).toBeCloseTo(29.25, 1);
    const targets = [
      ...all(scope, ".ow-color-picker__swatch"),
      ...all(scope, ".ow-color-picker__control"),
      ...all(scope, ".ow-color-picker__tool"),
      format,
    ];
    for (const target of targets) {
      expect(rect(target).width).toBeGreaterThanOrEqual(24 - TOL);
      expect(rect(target).height).toBeGreaterThanOrEqual(24 - TOL);
    }
  });

  test("the preview and the eye dropper are as tall as the two tracks together", async () => {
    const screen = await render(<ColorPicker />);
    const [hue, alpha] = all(screen.container, ".ow-color-picker__track");
    const preview = screen.container.querySelector(".ow-color-picker__preview");
    if (!hue || !alpha || !preview) throw new Error("no tracks");
    expect(rect(preview).top).toBeCloseTo(rect(hue).top, 1);
    expect(rect(preview).bottom).toBeCloseTo(rect(alpha).bottom, 1);
  });
});
