import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { Tooltip } from "./index";

type Side = "top" | "right" | "bottom" | "left";
const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];

const rect = (selector: string) => {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`no ${selector}`);
  return el.getBoundingClientRect();
};

describe("Tooltip geometry", () => {
  for (const side of SIDES) {
    test(`${side}: 24px tall, 8px from the trigger, the arrow centered on it`, async () => {
      await render(
        <div style={{ display: "grid", placeItems: "center", blockSize: 400 }}>
          <Tooltip.Root open>
            <Tooltip.Trigger aria-label="Bold" style={{ inlineSize: 40, blockSize: 32 }} />
            <Tooltip.Portal>
              <Tooltip.Positioner side={side}>
                <Tooltip.Popup>
                  <Tooltip.Arrow />
                  Bold
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );
      // Open, then finish the open transition rather than wait for idle: WebKit in CI can keep
      // frames coming long after it (idle cost has its own test).
      await expect
        .poll(() => document.querySelector(".ow-tooltip__popup:not([data-starting-style])"))
        .not.toBeNull();
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSTransition) animation.finish();
      }
      const trigger = rect("[aria-label='Bold']");
      const popup = rect(".ow-tooltip__popup");
      const arrow = rect(".ow-tooltip__arrow");
      expect(popup.height).toBeCloseTo(24, 1);
      const gap = {
        top: trigger.top - popup.bottom,
        bottom: popup.top - trigger.bottom,
        left: trigger.left - popup.right,
        right: popup.left - trigger.right,
      }[side];
      // Base UI rounds the position to whole pixels.
      expect(Math.abs(gap - 8)).toBeLessThanOrEqual(TOL);
      // The 12px box's half by the popup holds the triangle, 1px of it under the popup.
      const vertical = side === "top" || side === "bottom";
      const center = vertical ? arrow.left + arrow.width / 2 : arrow.top + arrow.height / 2;
      const triggerCenter = vertical
        ? trigger.left + trigger.width / 2
        : trigger.top + trigger.height / 2;
      expect(Math.abs(center - triggerCenter)).toBeLessThanOrEqual(TOL);
      const overlap = {
        top: popup.bottom - arrow.top,
        bottom: arrow.bottom - popup.top,
        left: popup.right - arrow.left,
        right: arrow.right - popup.left,
      }[side];
      expect(overlap).toBeCloseTo(1, 1);
    });
  }
});
