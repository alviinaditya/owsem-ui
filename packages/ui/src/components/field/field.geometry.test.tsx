import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { rect, TOL } from "../../../test/geometry.ts";
import { Field } from "./index";

describe("Field geometry", () => {
  test("one gap between its parts, no outer margins, and it fills its parent", async () => {
    const screen = await render(
      <div data-testid="box" style={{ inlineSize: 300 }}>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Field.Control />
          <Field.Description>Help</Field.Description>
          <Field.Error match={false}>Wrong</Field.Error>
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
    expect(root.width).toBe(300);
    expect(control.width).toBe(300);
    expect(label.top).toBeCloseTo(root.top, 1);
    expect(description.bottom).toBeCloseTo(root.bottom, 1);
    const gaps = [control.top - label.bottom, description.top - control.bottom];
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

  test("an error takes the description's place: a one-line swap moves nothing", async () => {
    function Swap({ invalid }: { invalid: boolean }) {
      return (
        <div data-testid="box" style={{ inlineSize: 300 }}>
          <Field.Root invalid={invalid}>
            <Field.Label>Email</Field.Label>
            <Field.Control />
            <Field.Description>Help</Field.Description>
            <Field.Error match={invalid}>Wrong</Field.Error>
          </Field.Root>
          <p data-testid="after">After</p>
        </div>
      );
    }
    const screen = await render(<Swap invalid={false} />);
    const q = (selector: string) => {
      const el = screen.container.querySelector(selector);
      if (!el) throw new Error(`no ${selector}`);
      return el;
    };
    const before = { root: rect(q(".ow-field")), after: rect(q("[data-testid=after]")) };
    const description = rect(q(".ow-field__description"));
    await screen.rerender(<Swap invalid />);
    expect(getComputedStyle(q(".ow-field__description")).display).toBe("none");
    const error = rect(q(".ow-field__error"));
    // The error sits where the description was, and nothing under it moved.
    expect(error.top).toBeCloseTo(description.top, 1);
    expect(error.height).toBeCloseTo(description.height, 1);
    expect(rect(q(".ow-field")).height).toBeCloseTo(before.root.height, 1);
    expect(rect(q("[data-testid=after]")).top).toBeCloseTo(before.after.top, 1);
    // Valid again: the description comes back, in the same place.
    await screen.rerender(<Swap invalid={false} />);
    await expect.poll(() => screen.container.querySelector(".ow-field__error")).toBeNull();
    expect(getComputedStyle(q(".ow-field__description")).display).not.toBe("none");
    expect(rect(q(".ow-field__description")).top).toBeCloseTo(description.top, 1);
    expect(rect(q("[data-testid=after]")).top).toBeCloseTo(before.after.top, 1);
  });
});
