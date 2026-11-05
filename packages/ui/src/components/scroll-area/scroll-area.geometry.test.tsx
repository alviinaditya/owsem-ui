import type { CSSProperties, ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { ScrollArea } from "./index";

// 16px type: a 6px pill, 4px from the edge. --ow-radius is 8px: the ends stay 5px from the corners.
const SIZE = 6;
const GAP = 4;
const CLEAR = 5;
const frame = { inlineSize: 240, blockSize: 160, fontSize: 16 } satisfies CSSProperties;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const one = (part: string) => {
    const el = screen.container.querySelector<HTMLElement>(`.ow-scroll-area${part}`);
    if (!el) throw new Error(`no ${part}`);
    return el;
  };
  await expect.poll(() => screen.container.querySelector(".ow-scroll-area__thumb")).not.toBeNull();
  return one;
}

const box = (el: Element) => el.getBoundingClientRect();
const bar = (axis: "vertical" | "horizontal") => `__scrollbar[data-orientation="${axis}"]` as const;

describe("ScrollArea geometry", () => {
  test("a thin pill on the inline end, clear of the rounded corners (FR-10b)", async () => {
    const one = await mount(
      <ScrollArea.Root style={frame}>
        <div style={{ blockSize: 800 }}>Long</div>
      </ScrollArea.Root>,
    );
    const area = box(one(""));
    const track = box(one("__scrollbar"));
    const thumb = box(one("__thumb"));
    expect(thumb.width).toBeCloseTo(SIZE, 1);
    expect(area.right - track.right).toBeCloseTo(GAP, 1);
    expect(track.top - area.top).toBeCloseTo(CLEAR, 1);
    expect(area.bottom - track.bottom).toBeCloseTo(CLEAR, 1);
    expect(Math.abs(thumb.left - track.left)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(thumb.top - track.top)).toBeLessThanOrEqual(TOL);
    // A pill: both ends fully round.
    expect(Number.parseFloat(getComputedStyle(one("__thumb")).borderTopLeftRadius)).toBeGreaterThan(
      SIZE / 2,
    );
  });

  test("a larger radius moves the ends in with it", async () => {
    const one = await mount(
      <ScrollArea.Root style={{ ...frame, "--ow-radius": "20px" } as CSSProperties}>
        <div style={{ blockSize: 800 }}>Long</div>
      </ScrollArea.Root>,
    );
    expect(box(one("__scrollbar")).top - box(one("")).top).toBeCloseTo(20 - SIZE / 2, 1);
  });

  test("without a radius, the ends keep the same gap as the side", async () => {
    const one = await mount(
      <ScrollArea.Root style={{ ...frame, "--ow-radius": "0px" } as CSSProperties}>
        <div style={{ blockSize: 800 }}>Long</div>
      </ScrollArea.Root>,
    );
    expect(box(one("__scrollbar")).top - box(one("")).top).toBeCloseTo(GAP, 1);
  });

  test("the thumb travels the whole track", async () => {
    const one = await mount(
      <ScrollArea.Root style={frame}>
        <div style={{ blockSize: 800 }}>Long</div>
      </ScrollArea.Root>,
    );
    const viewport = one("__viewport");
    viewport.scrollTop = viewport.scrollHeight;
    await expect
      .poll(() => Math.abs(box(one("__thumb")).bottom - box(one("__scrollbar")).bottom))
      .toBeLessThanOrEqual(TOL);
  });

  test("the bars take no room, and meet without touching at the corner", async () => {
    const one = await mount(
      <ScrollArea.Root style={frame}>
        <div style={{ inlineSize: 800, blockSize: 800 }}>Wide</div>
      </ScrollArea.Root>,
    );
    await expect.poll(() => one(bar("horizontal"))).toBeTruthy();
    await expect.poll(() => box(one(bar("vertical"))).bottom).toBeLessThan(box(one("")).bottom - 8);
    const viewport = one("__viewport");
    expect(viewport.clientWidth).toBe(240);
    expect(viewport.clientHeight).toBe(160);

    const vertical = box(one(bar("vertical")));
    const horizontal = box(one(bar("horizontal")));
    expect(horizontal.height).toBeCloseTo(SIZE, 1);
    expect(box(one("")).bottom - horizontal.bottom).toBeCloseTo(GAP, 1);
    expect(horizontal.left - box(one("")).left).toBeCloseTo(CLEAR, 1);
    expect(vertical.bottom).toBeLessThanOrEqual(horizontal.top + TOL);
    expect(horizontal.right).toBeLessThanOrEqual(vertical.left + TOL);
  });

  // The shortest thumb is Base UI's 16px, so its press area must reach past both of its ends.
  for (const axis of ["vertical", "horizontal"] as const) {
    test(`the ${axis} thumb is pressed over at least 24 × 24 px (FR-14)`, async () => {
      const content =
        axis === "vertical" ? { blockSize: 20000 } : { inlineSize: 20000, blockSize: 10 };
      const one = await mount(
        <ScrollArea.Root style={frame}>
          <div style={content}>Long</div>
        </ScrollArea.Root>,
      );
      const thumb = one("__thumb");
      await userEvent.hover(one("__viewport"));
      await expect.poll(() => getComputedStyle(one("__scrollbar")).pointerEvents).toBe("auto");

      const area = box(one(""));
      const pill = box(thumb);
      expect(axis === "vertical" ? pill.height : pill.width).toBeCloseTo(16, 0);
      const middle = axis === "vertical" ? pill.top + pill.height / 2 : pill.left + pill.width / 2;
      for (const along of [-11.5, 0, 11.5]) {
        for (const across of [0.5, 12, 23.5]) {
          const hit =
            axis === "vertical"
              ? document.elementFromPoint(area.right - across, middle + along)
              : document.elementFromPoint(middle + along, area.bottom - across);
          expect(hit).toBe(thumb);
        }
      }
    });
  }

  test("the press area stays inside the Root", async () => {
    const one = await mount(
      <ScrollArea.Root style={frame}>
        <div style={{ blockSize: 800 }}>Long</div>
      </ScrollArea.Root>,
    );
    await userEvent.hover(one("__viewport"));
    await expect.poll(() => getComputedStyle(one("__scrollbar")).pointerEvents).toBe("auto");
    const area = box(one(""));
    const pill = box(one("__thumb"));
    expect(document.elementFromPoint(area.right + 1, pill.top + 4)).not.toBe(one("__thumb"));
    expect(document.elementFromPoint(area.right - 25, pill.top + 4)).not.toBe(one("__thumb"));
  });
});
