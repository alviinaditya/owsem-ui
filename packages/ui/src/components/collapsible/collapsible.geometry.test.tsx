import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { rect, TOL } from "../../../test/geometry.ts";
import { Collapsible, type CollapsibleSize } from "./index";

const HEIGHTS: Record<CollapsibleSize, number> = { sm: 32, md: 40, lg: 48 };
const FONTS: Record<CollapsibleSize, number> = { sm: 13, md: 14, lg: 16 };

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

async function mount(ui: ReactNode, dir: "ltr" | "rtl" = "ltr"): Promise<HTMLElement> {
  const screen = await render(
    <div dir={dir} style={{ inlineSize: 300 }}>
      {ui}
    </div>,
  );
  return screen.container.querySelector(".ow-collapsible__trigger") as HTMLElement;
}

describe("Collapsible geometry", () => {
  for (const size of ["sm", "md", "lg"] as const) {
    test(`${size}: a ${HEIGHTS[size]}px row, the chevron 1em + 2px and centered on the label`, async () => {
      const trigger = await mount(
        <Collapsible.Root>
          <Collapsible.Trigger size={size}>Details</Collapsible.Trigger>
        </Collapsible.Root>,
      );
      close(rect(trigger).height, HEIGHTS[size]);
      close(rect(trigger).width, 300);
      const icon = trigger.querySelector(".ow-collapsible__icon") as HTMLElement;
      close(rect(icon).width, FONTS[size] + 2);
      close(rect(icon).height, FONTS[size] + 2);
      const range = document.createRange();
      range.selectNodeContents(trigger.firstChild as Node);
      const label = range.getBoundingClientRect();
      // A 15px icon in a 32px row sits on a half pixel.
      const middle = rect(trigger).top + rect(trigger).height / 2;
      expect(Math.abs(rect(icon).top + rect(icon).height / 2 - middle)).toBeLessThanOrEqual(1);
      expect(Math.abs(label.top + label.height / 2 - middle)).toBeLessThanOrEqual(1);
    });
  }

  test("a row is never under 24px tall, even with a small font", async () => {
    const trigger = await mount(
      <Collapsible.Root>
        <Collapsible.Trigger style={{ fontSize: 8 }}>Tiny</Collapsible.Trigger>
      </Collapsible.Root>,
    );
    expect(rect(trigger).height).toBeGreaterThanOrEqual(24);
  });

  test("the chevron's strokes meet at the middle of the icon, and stay inside it", async () => {
    const trigger = await mount(
      <Collapsible.Root>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
      </Collapsible.Root>,
    );
    const icon = trigger.querySelector(".ow-collapsible__icon") as HTMLElement;
    const [start, end] = [...trigger.querySelectorAll(".ow-collapsible__stroke")];
    if (!start || !end) throw new Error("no strokes");
    const a = rect(start);
    const b = rect(end);
    // Side by side, give or take a stroke's width: one ends where the other starts.
    expect(Math.abs(a.right - b.left)).toBeLessThanOrEqual(2.1);
    close(a.left + (b.right - a.left) / 2, rect(icon).left + rect(icon).width / 2);
    expect(a.left).toBeGreaterThanOrEqual(rect(icon).left - 0.5);
    expect(b.right).toBeLessThanOrEqual(rect(icon).right + 0.5);
  });

  for (const dir of ["ltr", "rtl"] as const) {
    test(`${dir}: the label at the start and the chevron at the end`, async () => {
      const trigger = await mount(
        <Collapsible.Root>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
        </Collapsible.Root>,
        dir,
      );
      const icon = trigger.querySelector(".ow-collapsible__icon") as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(trigger.firstChild as Node);
      const label = range.getBoundingClientRect();
      const box = rect(trigger);
      if (dir === "ltr") {
        expect(label.left - box.left).toBeLessThan(20);
        expect(box.right - rect(icon).right).toBeLessThan(20);
        expect(rect(icon).left).toBeGreaterThan(label.right);
      } else {
        expect(box.right - label.right).toBeLessThan(20);
        expect(rect(icon).left - box.left).toBeLessThan(20);
        expect(rect(icon).right).toBeLessThan(label.left);
      }
    });
  }

  test("a long label wraps inside the row and the chevron keeps its size", async () => {
    const trigger = await mount(
      <Collapsible.Root>
        <Collapsible.Trigger>
          A label that is much longer than the room the row has, so that it has to wrap
        </Collapsible.Trigger>
      </Collapsible.Root>,
    );
    const icon = trigger.querySelector(".ow-collapsible__icon") as HTMLElement;
    close(rect(icon).width, 16);
    expect(rect(trigger).height).toBeGreaterThan(40);
    expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
  });

  // The label and the panel's text start at the same place: the content takes the trigger's
  // formula, in any size, behind a wrapper, and mirrored.
  const lines = async (ui: ReactNode, dir: "ltr" | "rtl") => {
    const screen = await render(
      <div dir={dir} style={{ inlineSize: 300 }}>
        {ui}
      </div>,
    );
    const trigger = screen.container.querySelector(".ow-collapsible__trigger") as HTMLElement;
    const text = screen.container.querySelector("[data-text]") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(trigger.firstChild as Node);
    const label = range.getBoundingClientRect();
    return { label, text: rect(text) };
  };

  for (const dir of ["ltr", "rtl"] as const) {
    for (const size of ["sm", "md", "lg"] as const) {
      test(`${dir} ${size}: the panel's text lines up with the label to half a pixel`, async () => {
        const { label, text } = await lines(
          <Collapsible.Root size={size} defaultOpen>
            <Collapsible.Trigger>Details</Collapsible.Trigger>
            <Collapsible.Panel>
              <span data-text="">Content</span>
            </Collapsible.Panel>
          </Collapsible.Root>,
          dir,
        );
        close(dir === "ltr" ? label.left : label.right, dir === "ltr" ? text.left : text.right);
      });
    }

    test(`${dir}: a trigger inside a heading, and with an own size, still lines up`, async () => {
      const { label, text } = await lines(
        <Collapsible.Root size="lg" defaultOpen>
          <h3 style={{ margin: 0 }}>
            <Collapsible.Trigger size="lg">Details</Collapsible.Trigger>
          </h3>
          <Collapsible.Panel>
            <span data-text="">Content</span>
          </Collapsible.Panel>
        </Collapsible.Root>,
        dir,
      );
      close(dir === "ltr" ? label.left : label.right, dir === "ltr" ? text.left : text.right);
    });
  }

  test("the panel's size is the content's to the last fraction at both ends of its move", async () => {
    // Base UI measures whole pixels: 77.7px of content would move to 78 and jump to 77.7 on landing.
    if (!CSS.supports("interpolate-size", "allow-keywords")) return;
    const trigger = await mount(
      <Collapsible.Root>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Panel>
          <div style={{ blockSize: 60.2 }}>Content</div>
        </Collapsible.Panel>
      </Collapsible.Root>,
    );
    const panel = () => document.querySelector<HTMLElement>(".ow-collapsible__panel");
    const moving = () =>
      panel()
        ?.getAnimations()
        .filter(
          (a) =>
            a instanceof CSSTransition && ["height", "block-size"].includes(a.transitionProperty),
        ) ?? [];
    const content = () => rect(panel()?.firstElementChild as HTMLElement).height;
    trigger.click();
    await expect.poll(() => moving().length).toBe(1);
    for (const animation of moving()) animation.finish();
    expect(Math.abs(rect(panel() as HTMLElement).height - content())).toBeLessThanOrEqual(0.05);
    trigger.click();
    await expect.poll(() => moving().length).toBe(1);
    // The first frame of the close is the size it rests at, not a rounded one.
    for (const animation of moving()) animation.currentTime = 0;
    expect(Math.abs(rect(panel() as HTMLElement).height - content())).toBeLessThanOrEqual(0.05);
  });
});
