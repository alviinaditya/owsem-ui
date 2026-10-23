import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { settle } from "../../../test/raf-counter.ts";
import { Popover } from "./index";

type Side = "top" | "right" | "bottom" | "left";
const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];

const rect = (selector: string) => {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`no ${selector}`);
  return el.getBoundingClientRect();
};

describe("Popover geometry", () => {
  for (const side of SIDES) {
    test(`${side}: 10px from the trigger, the arrow on its edge and on the trigger`, async () => {
      await render(
        <div style={{ display: "grid", placeItems: "center", blockSize: 500 }}>
          <Popover.Root defaultOpen>
            <Popover.Trigger style={{ inlineSize: 40, blockSize: 32 }}>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner side={side}>
                <Popover.Popup style={{ inlineSize: 180, blockSize: 90 }}>
                  <Popover.Arrow />
                  <Popover.Title>Title</Popover.Title>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );
      await settle();
      const trigger = rect("button");
      const popup = rect(".ow-popover__popup");
      const arrow = rect(".ow-popover__arrow");
      const gap = {
        top: trigger.top - popup.bottom,
        bottom: popup.top - trigger.bottom,
        left: trigger.left - popup.right,
        right: popup.left - trigger.right,
      }[side];
      // Base UI rounds the position to whole pixels.
      expect(Math.abs(gap - 10)).toBeLessThanOrEqual(TOL);
      const vertical = side === "top" || side === "bottom";
      // Centered on the trigger along the edge, and on the popup's edge across it.
      const along = vertical ? arrow.left + arrow.width / 2 : arrow.top + arrow.height / 2;
      const middle = vertical ? trigger.left + trigger.width / 2 : trigger.top + trigger.height / 2;
      expect(Math.abs(along - middle)).toBeLessThanOrEqual(TOL);
      const across = vertical ? arrow.top + arrow.height / 2 : arrow.left + arrow.width / 2;
      const edge = { top: popup.bottom, bottom: popup.top, left: popup.right, right: popup.left }[
        side
      ];
      expect(Math.abs(across - edge)).toBeLessThanOrEqual(TOL);
      // Its tip stops 3px short of the trigger.
      expect(gap - arrow.width / 2).toBeCloseTo(3, 0);
    });
  }
});
