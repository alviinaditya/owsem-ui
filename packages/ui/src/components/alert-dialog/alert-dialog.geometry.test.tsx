import { DirectionProvider } from "@base-ui/react/direction-provider";
import { describe, expect, onTestFinished, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TOL, themeRadius } from "../../../test/geometry.ts";
import { Button } from "../button";
import { AlertDialog } from "./index";

const VIEWPORT = { width: 1280, height: 800 };

const popup = () => document.querySelector(".ow-alert-dialog__popup") as HTMLElement;

/** The popup, once it has started opening. */
const opened = () =>
  expect
    .poll(() => document.querySelector(".ow-alert-dialog__popup:not([data-starting-style])"))
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

/**
 * Clicks the trigger, and pauses the popup's transform transition once it is listed. Polled rather
 * than caught in transitionrun: WebKit fires that event before getAnimations() has the transition.
 */
async function pausedOpening(): Promise<CSSTransition> {
  await userEvent.click(document.querySelector("button") as HTMLElement);
  let run: CSSTransition | undefined;
  await expect
    .poll(
      () => {
        run = popup()
          ?.getAnimations()
          .find(
            (a): a is CSSTransition =>
              a instanceof CSSTransition && a.transitionProperty === "transform",
          );
        run?.pause();
        return run;
      },
      { interval: 1 },
    )
    .toBeDefined();
  return run as CSSTransition;
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
    <AlertDialog.Root {...(shut ? {} : { defaultOpen: true })}>
      {shut ? <AlertDialog.Trigger>Open</AlertDialog.Trigger> : null}
      <AlertDialog.Portal>
        <AlertDialog.Popup {...(className ? { className } : {})}>
          <AlertDialog.Title>Share the draft</AlertDialog.Title>
          <AlertDialog.Description>Anyone with the link can read it.</AlertDialog.Description>
          {long ? <div style={{ blockSize: 2000 }} /> : null}
          <AlertDialog.Close render={<Button />}>Done</AlertDialog.Close>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

const expectClose = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

function expectCentered(box: DOMRect) {
  const { clientWidth, clientHeight } = document.documentElement;
  expectClose(box.left + box.width / 2, clientWidth / 2);
  expectClose(box.top + box.height / 2, clientHeight / 2);
}

describe("Alert Dialog geometry", () => {
  test("centered, 448px wide at the default font size, with 16px of padding", async () => {
    await render(<Panel />);
    await open();
    const box = popup().getBoundingClientRect();
    expectCentered(box);
    expectClose(box.width, 448);
    const title = (
      document.querySelector(".ow-alert-dialog__title") as Element
    ).getBoundingClientRect();
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

  test("centered right to left too", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <Panel />
      </DirectionProvider>,
    );
    await open();
    const box = popup().getBoundingClientRect();
    expectCentered(box);
    const title = (
      document.querySelector(".ow-alert-dialog__title") as Element
    ).getBoundingClientRect();
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

  test("the popup takes the one radius; a button 16px in keeps its own", async () => {
    await render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Title>Share the draft</AlertDialog.Title>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <AlertDialog.Close render={<Button />}>Done</AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await open();
    const box = popup().getBoundingClientRect();
    const button = document.querySelector(".ow-alert-dialog__popup button") as HTMLElement;
    const inner = button.getBoundingClientRect();
    expectClose(box.right - inner.right, 16);
    expectClose(box.bottom - inner.bottom, 16);
    const radius = (el: Element) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
    expectClose(radius(popup()), themeRadius());
    expectClose(radius(button), themeRadius());
  });

  test("font-size scales the width, the padding, and the title", async () => {
    await render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Popup style={{ fontSize: 28 }}>
            <AlertDialog.Title>Share</AlertDialog.Title>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await open();
    const style = getComputedStyle(popup());
    expectClose(Number.parseFloat(style.inlineSize), 896);
    expectClose(Number.parseFloat(style.paddingBlockStart), 32);
    expect(
      getComputedStyle(document.querySelector(".ow-alert-dialog__title") as Element).fontSize,
    ).toBe("32px");
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
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Viewport>
            <AlertDialog.Popup>
              <AlertDialog.Title>Share the draft</AlertDialog.Title>
              <div style={{ blockSize: 2000 }} />
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await open();
    const box = popup().getBoundingClientRect();
    const scroller = document.querySelector(".ow-alert-dialog__viewport") as HTMLElement;
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
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Viewport>
            <AlertDialog.Popup>
              <AlertDialog.Title>Share the draft</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await open();
    expectCentered(popup().getBoundingClientRect());
  });
});
