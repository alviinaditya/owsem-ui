import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { PreviewCard } from "./index";

type Side = "top" | "right" | "bottom" | "left";
const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];

const rect = (selector: string) => {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`no ${selector}`);
  return el.getBoundingClientRect();
};

describe("PreviewCard geometry", () => {
  for (const side of SIDES) {
    test(`${side}: 10px from the link, the arrow on its edge and on the link`, async () => {
      await render(
        <div style={{ display: "grid", placeItems: "center", blockSize: 500 }}>
          <PreviewCard.Root defaultOpen>
            <PreviewCard.Trigger
              href="/docs"
              style={{ display: "block", inlineSize: 40, blockSize: 32 }}
            >
              Open
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner side={side}>
                <PreviewCard.Popup style={{ inlineSize: 180, blockSize: 90 }}>
                  <PreviewCard.Arrow />
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>,
      );
      await expect
        .poll(() => document.querySelector(".ow-preview-card__popup:not([data-starting-style])"))
        .not.toBeNull();
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSTransition) animation.finish();
      }
      const trigger = rect("a");
      const popup = rect(".ow-preview-card__popup");
      const arrow = rect(".ow-preview-card__arrow");
      const gap = {
        top: trigger.top - popup.bottom,
        bottom: popup.top - trigger.bottom,
        left: trigger.left - popup.right,
        right: popup.left - trigger.right,
      }[side];
      expect(Math.abs(gap - 10)).toBeLessThanOrEqual(TOL);
      const vertical = side === "top" || side === "bottom";
      const along = vertical ? arrow.left + arrow.width / 2 : arrow.top + arrow.height / 2;
      const middle = vertical ? trigger.left + trigger.width / 2 : trigger.top + trigger.height / 2;
      expect(Math.abs(along - middle)).toBeLessThanOrEqual(TOL);
      const across = vertical ? arrow.top + arrow.height / 2 : arrow.left + arrow.width / 2;
      const edge = { top: popup.bottom, bottom: popup.top, left: popup.right, right: popup.left }[
        side
      ];
      expect(Math.abs(across - edge)).toBeLessThanOrEqual(TOL);
      expect(gap - arrow.width / 2).toBeCloseTo(3, 0);
    });
  }
});
