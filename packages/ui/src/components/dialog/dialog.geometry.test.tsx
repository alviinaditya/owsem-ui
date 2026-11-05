import { DirectionProvider } from "@base-ui/react/direction-provider";
import { describe, expect, onTestFinished, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { Button } from "../button";
import { Dialog } from "./index";

const VIEWPORT = { width: 1280, height: 800 };

const popup = () => document.querySelector(".ow-dialog__popup") as HTMLElement;

/** The popup, once it has started opening. */
const opened = () =>
  expect
    .poll(() => document.querySelector(".ow-dialog__popup:not([data-starting-style])"))
    .not.toBeNull();

/** Ends the open transition rather than waiting for idle: WebKit in CI can keep frames coming. */
async function open() {
  await opened();
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
}

async function viewport(width: number, height: number) {
  onTestFinished(() => page.viewport(VIEWPORT.width, VIEWPORT.height));
  await page.viewport(width, height);
}

/** Clicks the trigger, and pauses the popup's transform transition as it starts. */
async function pausedOpening() {
  const started = new Promise<CSSTransition>((resolve) => {
    const onRun = (event: TransitionEvent) => {
      const target = event.target as HTMLElement;
      if (event.propertyName !== "transform" || !target.classList.contains("ow-dialog__popup")) {
        return;
      }
      document.removeEventListener("transitionrun", onRun);
      const run = target
        .getAnimations()
        .find((a) => (a as CSSTransition).transitionProperty === "transform") as CSSTransition;
      run.pause();
      resolve(run);
    };
    document.addEventListener("transitionrun", onRun);
  });
  await userEvent.click(document.querySelector("button") as HTMLElement);
  return started;
}

function appCss(css: string) {
  const sheet = document.createElement("style");
  sheet.textContent = css;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
}

function Panel({
  className,
  long,
  shut,
}: {
  className?: string;
  long?: boolean;
  /** Opens from its trigger, with the transition, rather than open from the start. */
  shut?: boolean;
}) {
  return (
    <Dialog.Root {...(shut ? {} : { defaultOpen: true })}>
      {shut ? <Dialog.Trigger>Open</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Popup {...(className ? { className } : {})}>
          <Dialog.Title>Share the draft</Dialog.Title>
          <Dialog.Description>Anyone with the link can read it.</Dialog.Description>
          {long ? <div style={{ blockSize: 2000 }} /> : null}
          <Dialog.Close render={<Button />}>Done</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const expectClose = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

function expectCentered(box: DOMRect) {
  const { clientWidth, clientHeight } = document.documentElement;
  expectClose(box.left + box.width / 2, clientWidth / 2);
  expectClose(box.top + box.height / 2, clientHeight / 2);
}

describe("Dialog geometry", () => {
  test("centered, 448px wide at the default font size, with 16px of padding", async () => {
    await render(<Panel />);
    await open();
    const box = popup().getBoundingClientRect();
    expectCentered(box);
    expectClose(box.width, 448);
    const title = (document.querySelector(".ow-dialog__title") as Element).getBoundingClientRect();
    expectClose(title.left - box.left, 16);
    expectClose(title.top - box.top, 16);
  });

  test("stays centered while it grows", async () => {
    await render(<Panel shut />);
    const grow = await pausedOpening();
    grow.currentTime = 0;
    const box = popup().getBoundingClientRect();
    expect(box.width).toBeLessThan(448);
    expectClose(box.width, 448 * 0.96);
    expectCentered(box);
    grow.finish();
  });

  test("centered right to left too (FR-16)", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <Panel />
      </DirectionProvider>,
    );
    await open();
    const box = popup().getBoundingClientRect();
    expectCentered(box);
    const title = (document.querySelector(".ow-dialog__title") as Element).getBoundingClientRect();
    expectClose(box.right - title.right, 16);
  });

  test("at 320px it keeps 16px from each side, and long content scrolls inside", async () => {
    await viewport(320, 568);
    await render(<Panel long />);
    await open();
    const box = popup().getBoundingClientRect();
    expectClose(box.left, 16);
    expectClose(box.right, 320 - 16);
    expectClose(box.top, 16);
    expectClose(box.bottom, 568 - 16);
    expect(popup().scrollHeight).toBeGreaterThan(popup().clientHeight);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(568);
  });

  test("a button in the corner has a concentric radius: popup = button + gap (FR-10b)", async () => {
    await render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title>Share the draft</Dialog.Title>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Dialog.Close render={<Button />}>Done</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await open();
    const box = popup().getBoundingClientRect();
    const button = document.querySelector(".ow-dialog__popup button") as HTMLElement;
    const inner = button.getBoundingClientRect();
    expectClose(box.right - inner.right, 16);
    expectClose(box.bottom - inner.bottom, 16);
    const radius = (el: Element) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
    expectClose(radius(popup()), radius(button) + 16);
  });

  test("font-size scales the width, the padding, and the title", async () => {
    await render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup style={{ fontSize: 28 }}>
            <Dialog.Title>Share</Dialog.Title>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await open();
    const style = getComputedStyle(popup());
    expectClose(Number.parseFloat(style.inlineSize), 896);
    expectClose(Number.parseFloat(style.paddingBlockStart), 32);
    expect(getComputedStyle(document.querySelector(".ow-dialog__title") as Element).fontSize).toBe(
      "32px",
    );
  });

  test("a class alone makes it wider, up to the screen's margin", async () => {
    appCss(".wide { inline-size: 40rem; } .huge { inline-size: 100rem; }");
    await render(<Panel className="wide" />);
    await open();
    expectClose(popup().getBoundingClientRect().width, 640);
    popup().classList.replace("wide", "huge");
    expectClose(popup().getBoundingClientRect().width, VIEWPORT.width - 32);
  });

  test("a class alone makes it a full screen", async () => {
    appCss(`.full {
      inline-size: 100%;
      max-inline-size: none;
      block-size: 100%;
      max-block-size: none;
      border-radius: 0;
    }`);
    await render(<Panel className="full" />);
    await open();
    const box = popup().getBoundingClientRect();
    expect([box.left, box.top]).toEqual([0, 0]);
    expect([box.width, box.height]).toEqual([
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    ]);
  });

  test("a class alone makes it a sheet, sliding up from the bottom", async () => {
    appCss(`.sheet {
      inline-size: 100%;
      max-inline-size: none;
      margin-block: auto 0;
      border-end-start-radius: 0;
      border-end-end-radius: 0;
    }
    .sheet[data-starting-style] {
      transform: translateY(100%);
    }`);
    await render(<Panel className="sheet" shut />);
    const slide = await pausedOpening();
    slide.currentTime = 0;
    // Its own transition replaces the growth: it starts a whole height down, at full size.
    expectClose(popup().getBoundingClientRect().top, document.documentElement.clientHeight);
    expectClose(popup().getBoundingClientRect().width, document.documentElement.clientWidth);
    slide.finish();
    await open();
    const box = popup().getBoundingClientRect();
    expect([box.left, box.width]).toEqual([0, document.documentElement.clientWidth]);
    expectClose(box.bottom, document.documentElement.clientHeight);
  });

  test("in a Viewport, the popup is at its full height and the Viewport scrolls", async () => {
    await render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Viewport>
            <Dialog.Popup>
              <Dialog.Title>Share the draft</Dialog.Title>
              <div style={{ blockSize: 2000 }} />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await open();
    const box = popup().getBoundingClientRect();
    const scroller = document.querySelector(".ow-dialog__viewport") as HTMLElement;
    expect(box.height).toBeGreaterThan(2000);
    expect(popup().scrollHeight).toBeLessThanOrEqual(popup().clientHeight);
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    // Its top is 16px down, not cut off above the screen, and it stays centered across.
    expectClose(box.top, 16);
    expectClose(box.left + box.width / 2, scroller.clientWidth / 2);
    scroller.scrollTop = scroller.scrollHeight;
    expectClose(popup().getBoundingClientRect().bottom, scroller.clientHeight - 16);
  });

  test("short in a Viewport, it is centered", async () => {
    await render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Viewport>
            <Dialog.Popup>
              <Dialog.Title>Share the draft</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await open();
    expectCentered(popup().getBoundingClientRect());
  });
});
