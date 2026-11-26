import { DirectionProvider } from "@base-ui/react/direction-provider";
import { describe, expect, onTestFinished, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { Drawer } from "./index";

const VIEWPORT = { width: 1280, height: 800 };
type Direction = "up" | "down" | "left" | "right";

const popup = () => document.querySelector(".ow-drawer__popup") as HTMLElement;

/** The popup at rest: the opening style is gone and the transition has ended. */
async function arrived() {
  await expect
    .poll(() => document.querySelector(".ow-drawer__popup:not([data-starting-style])"))
    .not.toBeNull();
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
}

async function viewport(width: number, height: number) {
  onTestFinished(() => page.viewport(VIEWPORT.width, VIEWPORT.height));
  await page.viewport(width, height);
}

function Sheet({ direction, tall }: { direction: Direction; tall?: boolean }) {
  return (
    <Drawer.Root defaultOpen swipeDirection={direction}>
      <Drawer.Portal>
        <Drawer.Popup>
          <Drawer.Title>Share the draft</Drawer.Title>
          <Drawer.Description>Anyone with the link can read it.</Drawer.Description>
          {tall ? (
            <Drawer.Content>
              <div style={{ blockSize: 3000 }} />
            </Drawer.Content>
          ) : null}
          <Drawer.Close>Done</Drawer.Close>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

const corners = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  return {
    tl: Number.parseFloat(style.borderTopLeftRadius),
    tr: Number.parseFloat(style.borderTopRightRadius),
    br: Number.parseFloat(style.borderBottomRightRadius),
    bl: Number.parseFloat(style.borderBottomLeftRadius),
  };
};

describe("Drawer geometry", () => {
  test.each([
    ["down", { tl: 16, tr: 16, br: 0, bl: 0 }],
    ["up", { tl: 0, tr: 0, br: 16, bl: 16 }],
    ["left", { tl: 0, tr: 16, br: 16, bl: 0 }],
    ["right", { tl: 16, tr: 0, br: 0, bl: 16 }],
  ] as const)(
    "%s: it rests on its edge and only the corners facing the page are round",
    async (direction, round) => {
      await render(<Sheet direction={direction} />);
      await arrived();
      const box = popup().getBoundingClientRect();
      if (direction === "down") expect(box.bottom).toBeCloseTo(VIEWPORT.height, 0);
      if (direction === "up") expect(box.top).toBeCloseTo(0, 0);
      if (direction === "left") expect(box.left).toBeCloseTo(0, 0);
      if (direction === "right") expect(box.right).toBeCloseTo(VIEWPORT.width, 0);
      expect(corners(popup())).toEqual(round);
    },
  );

  test("top and bottom sheets are 32rem at most, and centered", async () => {
    for (const direction of ["down", "up"] as const) {
      const view = await render(<Sheet direction={direction} />);
      await arrived();
      const box = popup().getBoundingClientRect();
      expect(box.width).toBeCloseTo(512, 0);
      expect(box.left + box.width / 2).toBeCloseTo(VIEWPORT.width / 2, 0);
      await view.unmount();
    }
  });

  test("left and right sheets are 24rem wide, the height of the screen", async () => {
    for (const direction of ["left", "right"] as const) {
      const view = await render(<Sheet direction={direction} />);
      await arrived();
      const box = popup().getBoundingClientRect();
      expect(box.width).toBeCloseTo(384, 0);
      expect(box.height).toBeCloseTo(VIEWPORT.height, 0);
      await view.unmount();
    }
  });

  test("on a phone, a bottom sheet is the whole width and a side sheet leaves the page a strip", async () => {
    await viewport(390, 700);
    const bottom = await render(<Sheet direction="down" />);
    await arrived();
    expect(popup().getBoundingClientRect().width).toBeCloseTo(390, 0);
    await bottom.unmount();
    await render(<Sheet direction="left" />);
    await arrived();
    expect(popup().getBoundingClientRect().width).toBeCloseTo(390 - 48, 0);
  });

  test("a sheet too tall for the screen stops 3rem short of the far edge", async () => {
    await viewport(390, 600);
    const bottom = await render(<Sheet direction="down" tall />);
    await arrived();
    expect(popup().getBoundingClientRect().top).toBeCloseTo(48, 0);
    await bottom.unmount();
    await render(<Sheet direction="up" tall />);
    await arrived();
    expect(popup().getBoundingClientRect().bottom).toBeCloseTo(600 - 48, 0);
  });

  test.each(["down", "up"] as const)(
    "%s: the grabber is 36 by 4, centered, 8px from the edge",
    async (direction) => {
      await render(<Sheet direction={direction} />);
      await arrived();
      const style = getComputedStyle(popup(), "::before");
      expect(style.position).toBe("absolute");
      expect(Number.parseFloat(style.width)).toBeCloseTo(36, 1);
      expect(Number.parseFloat(style.height)).toBeCloseTo(4, 1);
      // Auto margins center it: what is left over is split in two.
      const room = popup().clientWidth - 36;
      expect(Number.parseFloat(style.marginLeft)).toBeCloseTo(room / 2, 0);
      const edge = direction === "down" ? style.top : style.bottom;
      expect(Number.parseFloat(edge)).toBeCloseTo(8, 1);
    },
  );

  test.each(["left", "right"] as const)("%s: no grabber", async (direction) => {
    await render(<Sheet direction={direction} />);
    await arrived();
    expect(getComputedStyle(popup(), "::before").content).toBe("none");
  });

  test("the grabber's room comes out of the padding, so the title stays clear of it", async () => {
    await render(<Sheet direction="down" />);
    await arrived();
    const title = document.querySelector(".ow-drawer__title") as HTMLElement;
    const gap = title.getBoundingClientRect().top - popup().getBoundingClientRect().top;
    // 16px padding and the grabber's 12px; the grabber ends at 12px.
    expect(gap).toBeGreaterThanOrEqual(12 + 4);
    expect(gap).toBeCloseTo(16 * 1 + 12, 0);
  });

  test("text direction flips the inside, not the edge: a left sheet stays left", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Sheet direction="left" />
        </div>
      </DirectionProvider>,
    );
    await arrived();
    expect(popup().getBoundingClientRect().left).toBeCloseTo(0, 0);
    const title = document.querySelector(".ow-drawer__title") as HTMLElement;
    const box = popup().getBoundingClientRect();
    // The text starts at the right edge of the sheet.
    expect(box.right - title.getBoundingClientRect().right).toBeLessThanOrEqual(16 + TOL);
    expect(title.getBoundingClientRect().left).toBeGreaterThan(box.left);
  });

  test("the sheet at rest has its swipe variables at zero and no snap offset", async () => {
    await render(<Sheet direction="down" />);
    await arrived();
    const style = getComputedStyle(popup());
    expect(style.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
  });
});
