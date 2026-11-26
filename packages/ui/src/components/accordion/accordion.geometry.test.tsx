import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { rect, TOL } from "../../../test/geometry.ts";
import { Accordion, type AccordionSize } from "./index";

const HEIGHTS: Record<AccordionSize, number> = { sm: 32, md: 40, lg: 48 };
const FONTS: Record<AccordionSize, number> = { sm: 13, md: 14, lg: 16 };

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

async function mount(ui: ReactNode, dir: "ltr" | "rtl" = "ltr"): Promise<HTMLElement> {
  const screen = await render(
    <div dir={dir} style={{ inlineSize: 300 }}>
      {ui}
    </div>,
  );
  return screen.container.querySelector(".ow-accordion") as HTMLElement;
}

const Items = ({ size, open }: { size?: AccordionSize; open?: string[] }) => (
  <Accordion.Root size={size} defaultValue={open}>
    {["a", "b", "c"].map((value) => (
      <Accordion.Item key={value} value={value}>
        <Accordion.Trigger>{`Item ${value}`}</Accordion.Trigger>
        <Accordion.Panel>
          <div style={{ blockSize: 60 }}>Content</div>
        </Accordion.Panel>
      </Accordion.Item>
    ))}
  </Accordion.Root>
);

describe("Accordion geometry", () => {
  for (const size of ["sm", "md", "lg"] as const) {
    test(`${size}: a ${HEIGHTS[size]}px row, the chevron 1em + 2px, and one pixel between rows`, async () => {
      const group = await mount(<Items size={size} />);
      const triggers = [...group.querySelectorAll<HTMLElement>(".ow-accordion__trigger")];
      const items = [...group.querySelectorAll<HTMLElement>(".ow-accordion__item")];
      for (const trigger of triggers) {
        close(rect(trigger).height, HEIGHTS[size]);
        close(rect(trigger).width, 300);
        const icon = trigger.querySelector(".ow-accordion__icon") as HTMLElement;
        close(rect(icon).width, FONTS[size] + 2);
        const middle = rect(trigger).top + rect(trigger).height / 2;
        expect(Math.abs(rect(icon).top + rect(icon).height / 2 - middle)).toBeLessThanOrEqual(1);
      }
      // The first row has no line above it; each other item has one pixel above its trigger.
      close(rect(items[0] as HTMLElement).height, HEIGHTS[size]);
      close(rect(items[1] as HTMLElement).height, HEIGHTS[size] + 1);
      close(rect(items[2] as HTMLElement).height, HEIGHTS[size] + 1);
      close(rect(group).height, 3 * HEIGHTS[size] + 2);
    });
  }

  test("an open item adds only its panel: the content's height and its padding", async () => {
    const group = await mount(<Items open={["a"]} />);
    const items = [...group.querySelectorAll<HTMLElement>(".ow-accordion__item")];
    // 40 trigger, 60 content, 0.25em (3.5px) above and 1em (14px) below it.
    close(rect(items[0] as HTMLElement).height, 40 + 3.5 + 60 + 14);
    const panel = group.querySelector(".ow-accordion__panel") as HTMLElement;
    close(rect(panel).height, 77.5);
  });

  test("the panel's text lines up with the row's label", async () => {
    const group = await mount(<Items open={["a"]} />);
    const trigger = group.querySelector(".ow-accordion__trigger") as HTMLElement;
    const text = group.querySelector(".ow-accordion__content > div") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(trigger.firstChild as Node);
    close(range.getBoundingClientRect().left, rect(text).left);
  });

  test("a row's focus ring has room: the panel does not clip it, and neither does its content", async () => {
    const group = await mount(<Items open={["a"]} />);
    const trigger = group.querySelector(".ow-accordion__trigger") as HTMLElement;
    const panel = group.querySelector(".ow-accordion__panel") as HTMLElement;
    // The ring is 2px out and 2px wide: it reaches 4px below the row, inside the panel.
    const ring = rect(trigger).bottom + 4;
    expect(ring).toBeGreaterThan(rect(panel).top);
    // Above the panel's box, as the unit test shows: z-index 1, positioned.
    const style = getComputedStyle(trigger);
    expect(style.position).toBe("relative");
    expect(style.zIndex).toBe("1");
    // The content keeps 4px at each side, the room a ring of its own controls needs.
    const content = group.querySelector(".ow-accordion__content") as HTMLElement;
    expect(getComputedStyle(content).paddingLeft).toBe("4px");
    expect(getComputedStyle(content).paddingRight).toBe("4px");
  });

  for (const dir of ["ltr", "rtl"] as const) {
    test(`${dir}: the label at the start and the chevron at the end`, async () => {
      const group = await mount(<Items />, dir);
      const trigger = group.querySelector(".ow-accordion__trigger") as HTMLElement;
      const icon = trigger.querySelector(".ow-accordion__icon") as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(trigger.firstChild as Node);
      const label = range.getBoundingClientRect();
      const box = rect(trigger);
      if (dir === "ltr") {
        expect(label.left - box.left).toBeLessThan(8);
        expect(box.right - rect(icon).right).toBeLessThan(8);
      } else {
        expect(box.right - label.right).toBeLessThan(8);
        expect(rect(icon).left - box.left).toBeLessThan(8);
      }
    });
  }

  test("horizontal: a chevron that points toward the panel, and a row as wide as its label", async () => {
    const screen = await render(
      <Accordion.Root orientation="horizontal" defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Trigger>Item a</Accordion.Trigger>
          <Accordion.Panel>
            <div style={{ inlineSize: 100 }}>Content</div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger>Item b</Accordion.Trigger>
          <Accordion.Panel>
            <div style={{ inlineSize: 100 }}>Content</div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const [a, b] = [...screen.container.querySelectorAll<HTMLElement>(".ow-accordion__trigger")];
    if (!a || !b) throw new Error("no triggers");
    expect(rect(a).width).toBeLessThan(160);
    close(rect(a).height, 40);
    expect(rect(b).left).toBeGreaterThan(rect(a).right);
    // An open one points back (left), a closed one forward (right): the svg is turned a quarter.
    const svg = a.querySelector("svg") as SVGElement;
    expect(getComputedStyle(svg).rotate).toBe("-90deg");
  });

  test("the panel's size is the content's to the last fraction at both ends of its move", async () => {
    // Base UI measures whole pixels: 77.7px of content would move to 78 and jump to 77.7 on landing.
    if (!CSS.supports("interpolate-size", "allow-keywords")) return;
    const group = await mount(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Trigger>Item</Accordion.Trigger>
          <Accordion.Panel>
            <div style={{ blockSize: 60.2 }}>Content</div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = group.querySelector(".ow-accordion__trigger") as HTMLElement;
    const panel = () => group.querySelector<HTMLElement>(".ow-accordion__panel");
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
