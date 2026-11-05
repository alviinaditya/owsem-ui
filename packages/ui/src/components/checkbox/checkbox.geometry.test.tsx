import type { CSSProperties, ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { rect, TOL, usedRadius } from "../../../test/geometry.ts";
import { Checkbox, type CheckboxSize } from "./index";

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(<div style={{ display: "flex", gap: 40, padding: 40 }}>{ui}</div>);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-checkbox")];
}

const hit = (x: number, y: number) => document.elementFromPoint(x, y);

// FR-10, FR-11: the box is an icon of Button's fonts, the font size plus 2 px.
const SIZES: [CheckboxSize, number][] = [
  ["sm", 15],
  ["md", 16],
  ["lg", 18],
];

describe("Checkbox geometry", () => {
  test.each(SIZES)("%s: a %d px square, its glyph filling it", async (size, px) => {
    const [off, on] = await mount(
      <>
        <Checkbox.Root aria-label="Off" size={size} />
        <Checkbox.Root aria-label="On" size={size} defaultChecked />
      </>,
    );
    if (!off || !on) throw new Error("no checkboxes");
    for (const box of [off, on]) {
      expect(rect(box).width).toBeCloseTo(px, 1);
      expect(rect(box).height).toBeCloseTo(px, 1);
    }
    const glyph = on.querySelector('[data-glyph="check"]');
    if (!glyph) throw new Error("no glyph");
    // Checked from the start, so it rests at full scale.
    expect(Math.abs(rect(glyph).width - px)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(rect(glyph).left - rect(on).left)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(rect(glyph).top - rect(on).top)).toBeLessThanOrEqual(TOL);
  });

  test.each(SIZES)("%s: the press target is 24 px, adding no layout (FR-14)", async (size, px) => {
    const [box] = await mount(<Checkbox.Root aria-label="Run" size={size} />);
    if (!box) throw new Error("no checkbox");
    const target = rect({ el: box, pseudo: "::after" });
    expect(target.width).toBeCloseTo(24, 1);
    expect(target.height).toBeCloseTo(24, 1);
    const b = rect(box);
    const middle = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    // Each edge of the target presses the box, and just past it nothing does.
    for (const [dx, dy] of [
      [-11.5, 0],
      [11.5, 0],
      [0, -11.5],
      [0, 11.5],
      [-11.5, -11.5],
      [11.5, 11.5],
    ] as const) {
      expect(hit(middle.x + dx, middle.y + dy), `${dx},${dy}`).toBe(box);
    }
    expect(hit(middle.x - 13, middle.y)).not.toBe(box);
    expect(hit(middle.x, middle.y + 13)).not.toBe(box);
    // The parent holds the box's own size, with no target in it.
    expect(rect(box).width).toBeCloseTo(px, 1);
    const parent = box.parentElement;
    if (!parent) throw new Error("no parent");
    expect(parent.scrollWidth).toBeLessThanOrEqual(parent.clientWidth);
  });

  test("font-size scales the whole box, and its target stays the box above 24 px", async () => {
    const [box] = await mount(
      <Checkbox.Root aria-label="Run" defaultChecked style={{ fontSize: 30 }} />,
    );
    if (!box) throw new Error("no checkbox");
    expect(rect(box).width).toBeCloseTo(32, 1);
    expect(rect(box).height).toBeCloseTo(32, 1);
    const glyph = box.querySelector('[data-glyph="check"]');
    if (!glyph) throw new Error("no glyph");
    expect(rect(glyph).width).toBeCloseTo(32, 1);
    expect(rect({ el: box, pseudo: "::after" }).width).toBeCloseTo(32, 1);
  });

  test("--icon or a width set on it resizes the box, and a target never drops under 24 px", async () => {
    const [byIcon, tiny] = await mount(
      <>
        <Checkbox.Root aria-label="Icon" style={{ "--icon": "20px" } as CSSProperties} />
        <Checkbox.Root aria-label="Tiny" style={{ inlineSize: 10, blockSize: 10 }} />
      </>,
    );
    if (!byIcon || !tiny) throw new Error("no checkboxes");
    expect(rect(byIcon).width).toBeCloseTo(20, 1);
    expect(rect(tiny).width).toBeCloseTo(10, 1);
    expect(rect({ el: tiny, pseudo: "::after" }).width).toBeCloseTo(24, 1);
  });

  test("has no outer margin", async () => {
    const [box] = await mount(<Checkbox.Root aria-label="Run" />);
    if (!box) throw new Error("no checkbox");
    const style = getComputedStyle(box);
    for (const side of [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft]) {
      expect(side).toBe("0px");
    }
  });

  test("its corners are half the control radius, so a small box stays square (FR-10b)", async () => {
    const [box] = await mount(<Checkbox.Root aria-label="Run" />);
    if (!box) throw new Error("no checkbox");
    expect(usedRadius(box)).toBeCloseTo(4, 1);
  });

  test("checking it moves nothing around it, in a plain label", async () => {
    const screen = await render(
      <div style={{ fontSize: 14 }}>
        <label>
          <Checkbox.Root /> <span>Run the tests</span>
        </label>
      </div>,
    );
    const box = screen.getByRole("checkbox").element();
    const text = screen.getByText("Run the tests").element();
    const before = [rect(box).top, rect(text).top, rect(text).left];
    await screen.getByText("Run the tests").click();
    expect(box.getAttribute("aria-checked")).toBe("true");
    const after = [rect(box).top, rect(text).top, rect(text).left];
    for (const [i, value] of before.entries()) {
      expect(Math.abs(value - (after[i] ?? 0))).toBeLessThanOrEqual(TOL);
    }
    // The box sits on the text's middle line, give or take the font's metrics.
    const gap = rect(box).top + rect(box).height / 2 - (rect(text).top + rect(text).height / 2);
    expect(Math.abs(gap)).toBeLessThanOrEqual(3);
  });
});
