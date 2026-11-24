import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, nested, rect, TOL, usedRadius } from "../../../test/geometry.ts";
import { Input } from "../input";
import { NumberField, type NumberFieldSize } from "./index";

// A Number Field is as tall as an Input of its size; the steppers are that less 4px on each side.
const SIZES: [NumberFieldSize, number, number][] = [
  ["sm", 32, 24],
  ["md", 40, 32],
  ["lg", 48, 40],
];

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

async function mount(ui: ReactNode, dir: "ltr" | "rtl" = "ltr") {
  const screen = await render(
    <div dir={dir} style={{ inlineSize: 320 }}>
      {ui}
    </div>,
  );
  const q = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  return {
    screen,
    field: q(".ow-number-field"),
    group: q(".ow-number-field__group"),
    input: q(".ow-number-field__input"),
    minus: q(".ow-number-field__decrement"),
    plus: q(".ow-number-field__increment"),
  };
}

describe("Number Field geometry", () => {
  test.each(SIZES)(
    "%s: the field is as tall as an Input, exactly, at 1em of any size",
    async (size, height, side) => {
      const { screen, group, minus, plus } = await mount(
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NumberField.Root size={size} defaultValue={5} />
          <Input size={size} aria-label="Input" />
        </div>,
      );
      const input = screen.container.querySelector(".ow-input") as HTMLElement;
      close(rect(group).height, height);
      close(rect(group).height, rect(input).height);
      close(rect(minus).width, side);
      close(rect(minus).height, side);
      close(rect(plus).width, side);
      close(rect(plus).height, side);
    },
  );

  test("exact at fractional sizes too: the height and the steppers keep their sum", async () => {
    for (const fontSize of [13.2, 14.3, 17.6]) {
      const { group, minus } = await mount(
        <div style={{ fontSize }}>
          <NumberField.Root defaultValue={1} style={{ fontSize: `${fontSize / 16}rem` }} />
        </div>,
      );
      close(rect(group).height - rect(minus).height, 8);
      close(rect(minus).width, rect(minus).height);
    }
  });

  test.each(SIZES)("%s: the steppers sit 4px in from the field's ends, centered", async (size) => {
    const { group, minus, plus } = await mount(<NumberField.Root size={size} defaultValue={5} />);
    const start = insets(group, minus);
    const end = insets(group, plus);
    close(start.left, 4);
    close(start.top, 4);
    close(start.bottom, 4);
    close(end.right, 4);
    close(end.top, 4);
    close(end.bottom, 4);
  });

  test.each(SIZES)(
    "%s: the field takes the one radius, the steppers that less 4px",
    async (size) => {
      const { group, minus, plus } = await mount(<NumberField.Root size={size} defaultValue={5} />);
      for (const stepper of [minus, plus]) {
        const { outerDelta, innerDelta } = nested(group, stepper);
        expect(outerDelta).toBeLessThanOrEqual(TOL);
        expect(innerDelta).toBeLessThanOrEqual(TOL);
      }
      expect(usedRadius(minus)).toBeLessThan(usedRadius(group));
    },
  );

  test("the input fills what the steppers leave, and centers its digits", async () => {
    const { group, input, minus, plus } = await mount(
      <NumberField.Root defaultValue={5} style={{ inlineSize: 220 }} />,
    );
    close(rect(input).left, rect(minus).right);
    close(rect(input).right, rect(plus).left);
    close(rect(input).height, rect(minus).height);
    close(rect(group).width, 220);
    expect(getComputedStyle(input).textAlign).toBe("center");
  });

  test("right to left: the Decrement is at the start, the right, and the Increment at the left", async () => {
    const { group, minus, plus, input } = await mount(<NumberField.Root defaultValue={5} />, "rtl");
    close(insets(group, minus).right, 4);
    close(insets(group, plus).left, 4);
    expect(rect(minus).left).toBeGreaterThan(rect(input).left);
  });

  test("a stepper is a target of at least 24px, in every size", async () => {
    for (const [size] of SIZES) {
      const { minus, plus } = await mount(<NumberField.Root size={size} defaultValue={5} />);
      expect(rect(minus).width).toBeGreaterThanOrEqual(24 - TOL);
      expect(rect(plus).height).toBeGreaterThanOrEqual(24 - TOL);
    }
  });

  test("the icon is 1em + 2px and centered in its stepper", async () => {
    for (const [size] of SIZES) {
      const { minus } = await mount(<NumberField.Root size={size} defaultValue={5} />);
      const svg = minus.querySelector("svg") as SVGElement;
      const font = Number.parseFloat(getComputedStyle(minus).fontSize);
      close(rect(svg).width, font + 2);
      const gap = insets(minus, svg);
      close(gap.left, gap.right);
      close(gap.top, gap.bottom);
    }
  });

  test("a label above the field stays out of its height, and the scrub area takes the label's width", async () => {
    const { screen, group } = await mount(
      <NumberField.Root defaultValue={5}>
        <NumberField.ScrubArea>
          <label htmlFor="x">Qty</label>
        </NumberField.ScrubArea>
        <NumberField.Group />
      </NumberField.Root>,
    );
    close(rect(group).height, 40);
    const area = screen.container.querySelector(".ow-number-field__scrub-area") as HTMLElement;
    close(rect(area).bottom + 7, rect(group).top);
    expect(rect(area).width).toBeLessThan(rect(group).width / 2);
  });
});
