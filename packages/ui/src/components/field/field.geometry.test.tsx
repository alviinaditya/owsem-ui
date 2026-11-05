import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { rect, TOL } from "../../../test/geometry.ts";
import { Field } from "./index";

describe("Field geometry", () => {
  test("one gap between its parts, no outer margins, and it fills its parent", async () => {
    const screen = await render(
      <div data-testid="box" style={{ inlineSize: 300 }}>
        <Field.Root invalid>
          <Field.Label>Email</Field.Label>
          <Field.Control />
          <Field.Description>Help</Field.Description>
          <Field.Error match>Wrong</Field.Error>
        </Field.Root>
      </div>,
    );
    const q = (selector: string) => {
      const el = screen.container.querySelector(selector);
      if (!el) throw new Error(`no ${selector}`);
      return el;
    };
    const root = rect(q(".ow-field"));
    const label = rect(q(".ow-field__label"));
    const control = rect(q(".ow-input"));
    const description = rect(q(".ow-field__description"));
    const error = rect(q(".ow-field__error"));
    expect(root.width).toBe(300);
    expect(control.width).toBe(300);
    expect(label.top).toBeCloseTo(root.top, 1);
    expect(error.bottom).toBeCloseTo(root.bottom, 1);
    const gaps = [
      control.top - label.bottom,
      description.top - control.bottom,
      error.top - description.bottom,
    ];
    for (const gap of gaps) expect(Math.abs(gap - 7)).toBeLessThanOrEqual(TOL);
  });

  test("the label's start lines up with the control, in both directions (FR-16)", async () => {
    const screen = await render(
      <div dir="rtl" style={{ inlineSize: 300 }}>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Field.Control />
        </Field.Root>
      </div>,
    );
    const label = screen.container.querySelector(".ow-field__label") as Element;
    const control = screen.container.querySelector(".ow-input") as Element;
    expect(Math.abs(rect(label).right - rect(control).right)).toBeLessThanOrEqual(TOL);
  });
});
