import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { rect, TOL } from "../../../test/geometry.ts";
import { Field } from "../field";
import { Fieldset } from "./index";

describe("Fieldset geometry", () => {
  test("one gap under the legend and between fields, no margins, and it fills its parent", async () => {
    const screen = await render(
      <div style={{ inlineSize: 300 }}>
        <Fieldset.Root>
          <Fieldset.Legend>Address</Fieldset.Legend>
          <Field.Root>
            <Field.Label>Street</Field.Label>
            <Field.Control />
          </Field.Root>
          <Field.Root>
            <Field.Label>City</Field.Label>
            <Field.Control />
          </Field.Root>
        </Fieldset.Root>
      </div>,
    );
    const set = screen.container.querySelector(".ow-fieldset") as Element;
    const legend = screen.container.querySelector(".ow-fieldset__legend") as Element;
    const [street, city] = [...screen.container.querySelectorAll(".ow-field")] as [
      Element,
      Element,
    ];
    expect(rect(set).width).toBe(300);
    expect(rect(street).width).toBe(300);
    expect(rect(legend).top).toBeCloseTo(rect(set).top, 1);
    expect(rect(city).bottom).toBeCloseTo(rect(set).bottom, 1);
    const gap = 14 * 1.25;
    expect(Math.abs(rect(street).top - rect(legend).bottom - gap)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(rect(city).top - rect(street).bottom - gap)).toBeLessThanOrEqual(TOL);
  });

  test("it shrinks with its parent, unlike a bare fieldset", async () => {
    const screen = await render(
      <div style={{ inlineSize: 120 }}>
        <Fieldset.Root>
          <Fieldset.Legend>Address</Fieldset.Legend>
          <Field.Root>
            <Field.Label>Street</Field.Label>
            <Field.Control />
          </Field.Root>
        </Fieldset.Root>
      </div>,
    );
    const input = screen.container.querySelector(".ow-input") as Element;
    expect(rect(input).width).toBe(120);
  });
});
