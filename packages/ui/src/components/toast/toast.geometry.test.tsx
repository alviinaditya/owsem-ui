import { DirectionProvider } from "@base-ui/react/direction-provider";
import { describe, expect, onTestFinished, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { Toast } from "./index";

const VIEWPORT = { width: 1280, height: 800 };
const cards = () => [...document.querySelectorAll<HTMLElement>(".ow-toast")];
const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

async function viewport(width: number, height: number) {
  onTestFinished(() => page.viewport(VIEWPORT.width, VIEWPORT.height));
  await page.viewport(width, height);
}

/** Shows toasts and waits until they have arrived, with their transitions ended. */
async function shown(
  count: number,
  options: Parameters<ReturnType<typeof Toast.createToastManager>["add"]>[0] = {},
  dir: "ltr" | "rtl" = "ltr",
) {
  const manager = Toast.createToastManager();
  await render(
    <DirectionProvider direction={dir}>
      <Toast.Provider toastManager={manager}>
        <Toast.Portal>
          <Toast.Viewport />
        </Toast.Portal>
      </Toast.Provider>
    </DirectionProvider>,
  );
  for (let i = 1; i <= count; i++) {
    manager.add({ title: `Toast ${i}`, description: "A line of text.", timeout: 0, ...options });
  }
  await expect.poll(() => cards().length).toBe(count);
  await expect.poll(() => cards().every((c) => !c.hasAttribute("data-starting-style"))).toBe(true);
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
}

describe("Toast geometry", () => {
  test("is at most 22rem wide, 16px from the bottom end of the window", async () => {
    await shown(1);
    const box = (cards()[0] as HTMLElement).getBoundingClientRect();
    expect(Math.abs(box.width - 22 * rem)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(window.innerWidth - box.right - 16)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(window.innerHeight - box.bottom - 16)).toBeLessThanOrEqual(TOL);
  });

  test("on a phone it is never wider than the window minus a 16px gutter on each side", async () => {
    await viewport(320, 568);
    await shown(1);
    const box = (cards()[0] as HTMLElement).getBoundingClientRect();
    expect(Math.abs(box.width - (320 - 32))).toBeLessThanOrEqual(TOL);
    expect(Math.abs(box.left - 16)).toBeLessThanOrEqual(TOL);
  });

  test("in RTL it is at the bottom left", async () => {
    await shown(1, {}, "rtl");
    const box = (cards()[0] as HTMLElement).getBoundingClientRect();
    expect(Math.abs(box.left - 16)).toBeLessThanOrEqual(TOL);
  });

  test("the padding is 12px by 14px, and the text keeps clear of the close button", async () => {
    await shown(1);
    const card = (cards()[0] as HTMLElement).getBoundingClientRect();
    const title = (
      document.querySelector(".ow-toast__title") as HTMLElement
    ).getBoundingClientRect();
    const close = (
      document.querySelector(".ow-toast__close") as HTMLElement
    ).getBoundingClientRect();
    expect(Math.abs(title.left - card.left - 14)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(title.top - card.top - 12)).toBeLessThanOrEqual(TOL);
    expect(title.right).toBeLessThanOrEqual(close.left);
  });

  test("a long title wraps inside the card instead of widening it", async () => {
    await shown(1, { title: `${"Averyveryverylongword".repeat(8)} and more words to wrap` });
    const card = (cards()[0] as HTMLElement).getBoundingClientRect();
    const title = (
      document.querySelector(".ow-toast__title") as HTMLElement
    ).getBoundingClientRect();
    expect(Math.abs(card.width - 22 * rem)).toBeLessThanOrEqual(TOL);
    expect(title.right).toBeLessThanOrEqual(card.right);
  });

  test("the mark sits level with the first line of the title", async () => {
    await shown(1, { type: "info" });
    const mark = (document.querySelector(".ow-toast__mark") as HTMLElement).getBoundingClientRect();
    const title = document.querySelector(".ow-toast__title") as HTMLElement;
    const line = title.getBoundingClientRect();
    expect(Math.abs(mark.top + mark.height / 2 - (line.top + line.height / 2))).toBeLessThanOrEqual(
      TOL,
    );
    // The mark starts the text, and the text starts after it with a 10px gap.
    expect(Math.abs(line.left - mark.right - 10)).toBeLessThanOrEqual(TOL);
  });

  test("the action is a 32px Button under the description", async () => {
    await shown(1, { actionProps: { children: "Undo" } });
    const action = (
      document.querySelector(".ow-toast__action") as HTMLElement
    ).getBoundingClientRect();
    const text = (
      document.querySelector(".ow-toast__description") as HTMLElement
    ).getBoundingClientRect();
    expect(Math.abs(action.height - 32)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(action.top - text.bottom - 8)).toBeLessThanOrEqual(TOL);
  });

  test("closed, a stack is as tall as its front card; older ones peek 8px and are narrower", async () => {
    await shown(3);
    const [front, middle, back] = cards().map((c) => c.getBoundingClientRect()) as [
      DOMRect,
      DOMRect,
      DOMRect,
    ];
    expect(Math.abs(front.top - middle.top - 8)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(middle.top - back.top - 8)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(front.bottom - 16 - (window.innerHeight - 32))).toBeLessThanOrEqual(TOL);
    // Scaled about the bottom center: 0.95 and 0.90 of the width, centered.
    expect(Math.abs(middle.width / front.width - 0.95)).toBeLessThan(0.002);
    expect(Math.abs(back.width / front.width - 0.9)).toBeLessThan(0.002);
    expect(
      Math.abs(middle.left + middle.width / 2 - (front.left + front.width / 2)),
    ).toBeLessThanOrEqual(TOL);
  });
});
