import type { CSSProperties, ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, rect, TOL } from "../../../test/geometry.ts";
import { Button } from "../button";
import { Input, type InputSize } from "./index";

const Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

async function mount(ui: ReactNode, dir?: "rtl"): Promise<HTMLElement> {
  const screen = await render(
    <div dir={dir} style={{ inlineSize: 320 }}>
      {ui}
    </div>,
  );
  return screen.container;
}

const q = (scope: Element, selector: string) => {
  const el = scope.querySelector(selector);
  if (!el) throw new Error(`no ${selector}`);
  return el;
};

// FR-11: font 13/14/16 px, height 2 × --py + 1lh at line-height 1.25, icon font + 2 px.
const SIZES: [InputSize, number, number, number][] = [
  ["sm", 13, 29.25, 7.125],
  ["md", 14, 38.5, 11.25],
  ["lg", 16, 48, 15],
];

describe("Input geometry (FR-9 to FR-11, Button's)", () => {
  test.each(SIZES)("%s: as tall as Button, with and without icons", async (size, _font, height) => {
    const scope = await mount(
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Input size={size} aria-label="A" />
        <Input size={size} aria-label="B" startIcon={<Icon />} endIcon={<Icon />} />
        <Button size={size}>Go</Button>
      </div>,
    );
    const [a, b] = [...scope.querySelectorAll(".ow-input")] as [Element, Element];
    const button = q(scope, ".ow-button");
    expect(Math.abs(rect(a).height - height)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(rect(b).height - height)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(rect(a).height - rect(button).height)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(rect(a).top - rect(button).top)).toBeLessThanOrEqual(TOL);
  });

  test.each(SIZES)(
    "%s: icons are font + 2px, as far from the edge as from the top (FR-10)",
    async (size, font, _height, inset) => {
      const scope = await mount(
        <Input size={size} aria-label="A" startIcon={<Icon />} endIcon={<Icon />} />,
      );
      const input = q(scope, ".ow-input");
      for (const side of ["start", "end"] as const) {
        const icon = q(scope, `.ow-input__icon[data-side="${side}"]`);
        expect(rect(icon).width).toBeCloseTo(font + 2, 1);
        const gap = insets(input, icon);
        expect(Math.abs(gap.top - inset)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(gap.top - gap.bottom)).toBeLessThanOrEqual(TOL);
        const edge = side === "start" ? gap.left : gap.right;
        expect(Math.abs(edge - gap.top), `${side} edge`).toBeLessThanOrEqual(TOL);
      }
    },
  );

  test("the wrapper adds no size, and icons take no room from the input", async () => {
    const scope = await mount(<Input aria-label="A" startIcon={<Icon />} endIcon={<Icon />} />);
    const input = q(scope, ".ow-input");
    expect(rect(input).width).toBe(320);
    expect(rect(q(scope, ".ow-input__wrapper")).height).toBe(rect(input).height);
  });

  test("the text clears each icon", async () => {
    const scope = await mount(<Input aria-label="A" startIcon={<Icon />} endIcon={<Icon />} />);
    const input = q(scope, ".ow-input");
    const style = getComputedStyle(input);
    const start = rect(q(scope, '.ow-input__icon[data-side="start"]'));
    const end = rect(q(scope, '.ow-input__icon[data-side="end"]'));
    const textStart = rect(input).left + Number.parseFloat(style.paddingLeft);
    const textEnd = rect(input).right - Number.parseFloat(style.paddingRight);
    expect(textStart).toBeGreaterThan(start.right);
    expect(textEnd).toBeLessThan(end.left);
  });

  test("a width on the input keeps its icons inside it", async () => {
    const scope = await mount(
      <Input aria-label="A" style={{ inlineSize: 200 }} startIcon={<Icon />} endIcon={<Icon />} />,
    );
    const input = rect(q(scope, ".ow-input"));
    expect(input.width).toBe(200);
    expect(rect(q(scope, '.ow-input__icon[data-side="end"]')).right).toBeLessThan(input.right);
  });

  test("--py and font size in style move the icons with the input (FR-11)", async () => {
    const scope = await mount(
      <Input
        aria-label="A"
        startIcon={<Icon />}
        style={{ "--py": "1.5em", fontSize: 20 } as CSSProperties}
      />,
    );
    const input = q(scope, ".ow-input");
    const icon = q(scope, ".ow-input__icon");
    expect(rect(input).height).toBeCloseTo(2 * 30 + 25, 0);
    expect(rect(icon).width).toBeCloseTo(22, 1);
    const gap = insets(input, icon);
    expect(Math.abs(gap.left - gap.top)).toBeLessThanOrEqual(TOL);
  });

  test("--py never drops a target under 24 px (FR-14)", async () => {
    const scope = await mount(
      <Input aria-label="A" size="sm" style={{ "--py": "0px" } as CSSProperties} />,
    );
    expect(rect(q(scope, ".ow-input")).height).toBeGreaterThanOrEqual(24 - TOL);
  });

  test("follows the text direction (FR-16)", async () => {
    const scope = await mount(<Input aria-label="A" startIcon={<Icon />} />, "rtl");
    const gap = insets(q(scope, ".ow-input"), q(scope, ".ow-input__icon"));
    expect(Math.abs(gap.right - gap.top)).toBeLessThanOrEqual(TOL);
    expect(gap.left).toBeGreaterThan(gap.right);
  });
});
