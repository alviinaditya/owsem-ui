import { describe, expect, onTestFinished, test } from "vitest";
import { restingRect } from "./resting-anchor";

/** A box at a fractional spot, as at 110% zoom, inside `parent` when given. */
function box(style: string, parent: HTMLElement = document.body): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `position:absolute;left:40.37px;top:30.73px;inline-size:120px;block-size:36px;${style}`;
  parent.append(el);
  onTestFinished(() => el.remove());
  return el;
}

/** Its box with its own transforms taken off. */
function atRest(el: HTMLElement): DOMRect {
  const { scale, translate, transform } = el.style;
  el.style.scale = el.style.translate = el.style.transform = "none";
  const rect = el.getBoundingClientRect();
  Object.assign(el.style, { scale, translate, transform });
  return rect;
}

function expectSame(a: DOMRect, b: DOMRect) {
  for (const side of ["left", "top", "width", "height"] as const) {
    expect(a[side], side).toBeCloseTo(b[side], 3);
  }
}

describe("restingRect", () => {
  test("a box at rest is its own box", () => {
    const el = box("");
    expectSame(restingRect(el), el.getBoundingClientRect());
  });

  test("a pressed box (scale 0.97, from its middle) gives the box it rests at", () => {
    const el = box("scale:0.97");
    expect(el.getBoundingClientRect().width).toBeCloseTo(120 * 0.97, 3);
    expectSame(restingRect(el), atRest(el));
  });

  test("scale, translate, and transform together, from any origin, all come off", () => {
    const el = box(
      "scale:0.9 0.8;translate:3px 5px;transform:scale(0.95);transform-origin:10px 4px",
    );
    expect(el.getBoundingClientRect().left).not.toBeCloseTo(atRest(el).left, 1);
    expectSame(restingRect(el), atRest(el));
  });

  test("inside a scaled ancestor, it takes off its own scale only", () => {
    const parent = box("scale:1.5;transform-origin:0 0");
    const el = box("scale:0.97", parent);
    expectSame(restingRect(el), atRest(el));
  });

  test("a rotation or a percentage translate keeps the box as drawn", () => {
    for (const style of ["rotate:10deg", "translate:10% 0"]) {
      const el = box(style);
      expectSame(restingRect(el), el.getBoundingClientRect());
    }
  });
});
