import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, rect, TOL } from "../../../test/geometry.ts";
import { Input } from "../input";
import { OTPField, type OTPFieldSize } from "./index";

// A slot is a square on the height of an Input of its size, 0.5em from the next, and the row
// starts at the start edge of what it is given.
const SIZES: [OTPFieldSize, number, number][] = [
  ["sm", 32, 13],
  ["md", 40, 14],
  ["lg", 48, 16],
];

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

async function mount(ui: ReactNode, width = 320, dir: "ltr" | "rtl" = "ltr") {
  const screen = await render(
    <div dir={dir} style={{ inlineSize: width }}>
      {ui}
    </div>,
  );
  return {
    screen,
    row: screen.container.querySelector(".ow-otp-field") as HTMLElement,
    slots: [...screen.container.querySelectorAll<HTMLElement>(".ow-otp-field__input")],
  };
}

describe("OTP Field geometry", () => {
  test.each(SIZES)("%s: each slot is a square as tall as an Input, exactly", async (size, side) => {
    const { screen, slots } = await mount(
      <>
        <OTPField.Root length={4} size={size} aria-label="Code" />
        <Input size={size} aria-label="Input" />
      </>,
    );
    const input = screen.container.querySelector(".ow-input") as HTMLElement;
    for (const slot of slots) {
      close(rect(slot).width, side);
      close(rect(slot).height, side);
      close(rect(slot).height, rect(input).height);
    }
  });

  test.each(SIZES)("%s: the slots are 0.5em apart", async (size, _side, font) => {
    const { slots } = await mount(<OTPField.Root length={4} size={size} aria-label="Code" />);
    for (const [index, slot] of slots.slice(1).entries()) {
      close(rect(slot).left - rect(slots[index] as HTMLElement).right, font / 2);
    }
  });

  test("the row starts at the start edge, with room left after it", async () => {
    const { row, slots } = await mount(<OTPField.Root length={4} aria-label="Code" />, 400);
    close(rect(slots[0] as HTMLElement).left, rect(row).left);
    expect(rect(row).right - rect(slots.at(-1) as HTMLElement).right).toBeGreaterThan(50);
  });

  test("a digit is centered in its slot", async () => {
    const { slots } = await mount(<OTPField.Root length={2} aria-label="Code" defaultValue="1" />);
    const slot = slots[0] as HTMLInputElement;
    expect(getComputedStyle(slot).textAlign).toBe("center");
    expect(slot.value).toBe("1");
    close(getComputedStyle(slot).paddingLeft === "0px" ? 0 : 1, 0);
  });

  test("six slots at md fit a phone 320px wide, with room at its sides", async () => {
    const { row, slots } = await mount(<OTPField.Root length={6} aria-label="Code" />, 288);
    for (const slot of slots) close(rect(slot).width, 40);
    expect(rect(slots.at(-1) as HTMLElement).right).toBeLessThanOrEqual(rect(row).right + TOL);
    expect(rect(row).width).toBeLessThanOrEqual(288 + TOL);
  });

  test("a row too narrow shrinks its slots instead of overflowing its parent", async () => {
    const { row, slots } = await mount(
      <OTPField.Root length={6} size="lg" aria-label="Code" />,
      240,
    );
    expect(rect(slots.at(-1) as HTMLElement).right).toBeLessThanOrEqual(rect(row).right + TOL);
    expect(rect(slots[0] as HTMLElement).left).toBeGreaterThanOrEqual(rect(row).left - TOL);
    expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
  });

  test("at fractional font sizes the square keeps Input's height", async () => {
    for (const fontSize of [13.2, 14.3, 17.6]) {
      const { screen, slots } = await mount(
        <div style={{ fontSize: `${fontSize / 16}rem` }}>
          <OTPField.Root length={2} aria-label="Code" style={{ fontSize: `${fontSize / 16}rem` }} />
          <Input aria-label="Input" style={{ fontSize: `${fontSize / 16}rem` }} />
        </div>,
      );
      const input = screen.container.querySelector(".ow-input") as HTMLElement;
      close(rect(slots[0] as HTMLElement).height, rect(input).height);
      close(rect(slots[0] as HTMLElement).width, rect(input).height);
    }
  });

  test("a separator of your own sits between two groups, centered on the slots", async () => {
    const { slots, screen } = await mount(
      <OTPField.Root length={4} aria-label="Code">
        <OTPField.Input aria-label="1" />
        <OTPField.Input aria-label="2" />
        <span className="dash" aria-hidden="true">
          -
        </span>
        <OTPField.Input aria-label="3" />
        <OTPField.Input aria-label="4" />
      </OTPField.Root>,
    );
    const dash = screen.container.querySelector(".dash") as HTMLElement;
    close(rect(dash).top + rect(dash).height / 2, rect(slots[0] as HTMLElement).top + 20);
    close(rect(dash).left - rect(slots[1] as HTMLElement).right, 7);
    close(rect(slots[2] as HTMLElement).left - rect(dash).right, 7);
  });

  test("right to left: the first slot is at the right edge", async () => {
    const { row, slots } = await mount(<OTPField.Root length={3} aria-label="Code" />, 320, "rtl");
    expect(rect(slots[0] as HTMLElement).left).toBeGreaterThan(rect(slots[2] as HTMLElement).left);
    close(rect(slots[0] as HTMLElement).right, rect(row).right);
    expect(insets(row, slots[0] as HTMLElement).right).toBeLessThanOrEqual(TOL);
  });
});
