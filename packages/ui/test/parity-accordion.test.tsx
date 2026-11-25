import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Accordion as CssAccordion } from "../src/components/accordion/index";
import {
  type AccordionSize,
  accordionContentVariants,
  accordionSlots,
  accordionTriggerVariants,
} from "../src/tailwind/accordion/accordion-variants";
import { Accordion as TwAccordion } from "../src/tailwind/accordion/index";
import { cn } from "../src/tailwind/lib/cn";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// Accordion in Tailwind CSS v4 (src/tailwind/accordion) against accordion.css.

const SIZES: AccordionSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 text-sm font-bold gap-0 opacity-100 outline-red-500 cursor-default";

const tw = tailwindParity(
  classNames(
    ...Object.values(accordionSlots),
    ...SIZES.map((size) => accordionTriggerVariants({ size })),
    ...SIZES.map((size) => accordionContentVariants({ size })),
    OVERRIDES,
    "p-0 overflow-visible text-green-500 [[data-slot=accordion-item]+&]:border-red-500",
  ),
);

// What the rows, the chevron, and the panel draw that PROPS leaves out.
const props = [
  ...PROPS,
  "rotate",
  "transformBox",
  "transformOrigin",
  "stroke",
  "strokeWidth",
  "fill",
  "textAlign",
  "contentVisibility",
];

type Kit = typeof CssAccordion;
const make = (name: string, ui: (Accordion: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssAccordion),
  tw: ui(TwAccordion),
});

const Dot = () => <b>+</b>;

interface Options {
  size?: AccordionSize;
  open?: string[];
  multiple?: boolean;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  keepMounted?: boolean;
  hiddenUntilFound?: boolean;
}

const whole = (Accordion: Kit, { open, ...options }: Options = {}) => (
  <div style={{ inlineSize: options.orientation === "horizontal" ? 480 : 300 }}>
    <Accordion.Root defaultValue={open} {...options}>
      {["one", "two", "three"].map((value) => (
        <Accordion.Item key={value} value={value}>
          <Accordion.Trigger>{`Item ${value}`}</Accordion.Trigger>
          <Accordion.Panel>
            <p style={{ margin: 0 }}>Some content</p>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  </div>
);

const cases: Case[] = [
  ...SIZES.flatMap((size) => [
    make(size, (Accordion) => whole(Accordion, { size })),
    make(`${size} open`, (Accordion) => whole(Accordion, { size, open: ["two"] })),
  ]),
  make("several open", (Accordion) => whole(Accordion, { multiple: true, open: ["one", "three"] })),
  make("disabled", (Accordion) => whole(Accordion, { disabled: true, open: ["one"] })),
  make("kept mounted", (Accordion) => whole(Accordion, { keepMounted: true, open: ["one"] })),
  make("until found", (Accordion) => whole(Accordion, { hiddenUntilFound: true, open: ["one"] })),
  make("horizontal", (Accordion) => whole(Accordion, { orientation: "horizontal" })),
  make("horizontal open", (Accordion) =>
    whole(Accordion, { orientation: "horizontal", open: ["two"] }),
  ),
  make("a disabled item", (Accordion) => (
    <div style={{ inlineSize: 300 }}>
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Trigger>Open</Accordion.Trigger>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b" disabled>
          <Accordion.Trigger>Disabled</Accordion.Trigger>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )),
  make("icons of your own", (Accordion) => (
    <div style={{ inlineSize: 300 }}>
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Trigger icon={<Dot />}>Mine</Accordion.Trigger>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger icon={null}>None</Accordion.Trigger>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )),
  make("a header of your own", (Accordion) => (
    <div style={{ inlineSize: 300 }}>
      <Accordion.Root>
        <Accordion.Item value="a">
          {/* biome-ignore lint/a11y/useHeadingContent: Header fills it with its children */}
          <Accordion.Header render={<h2 />}>
            <Accordion.Trigger>Level two</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )),
  make("a long label", (Accordion) => (
    <div style={{ inlineSize: 180 }}>
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Trigger>
            A label that has to wrap before it reaches the chevron
          </Accordion.Trigger>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )),
  make("in a larger font", (Accordion) => (
    <div style={{ inlineSize: 300, fontSize: 24 }}>
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Trigger>Big</Accordion.Trigger>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )),
];

describe("Accordion in Tailwind CSS v4 against accordion.css", () => {
  test("every size and state matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("forced colors match", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
  });

  test("reduced motion matches: no chevron transition, a fade only", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.motion(cases);
  });

  test("more contrast matches: the hairlines come back at 3:1", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("a hovered row matches: the chevron takes the text color", async () => {
    await tw.states(cases, "md", "hover", { props, target: "button" });
  });

  test("a held row matches: nothing changes", async () => {
    await tw.states(cases, "md", "held", { props, target: "button" });
  });

  test("a focused row matches", async () => {
    await tw.states(cases, "lg open", "focus", { props, target: "button" });
  });

  test("transitions are the same: the chevron's colors and strokes, the panel's size and fade", async () => {
    await tw.motion(cases);
  });
});

describe("an accordion in Tailwind CSS v4 moves", () => {
  test("opening runs a transition of the panel's height and opacity, and of each stroke's rotate", async () => {
    tw.load();
    const screen = await render(
      <div style={{ inlineSize: 300 }}>
        <TwAccordion.Root>
          <TwAccordion.Item value="a">
            <TwAccordion.Trigger>A</TwAccordion.Trigger>
            <TwAccordion.Panel>
              <div style={{ blockSize: 100 }} />
            </TwAccordion.Panel>
          </TwAccordion.Item>
        </TwAccordion.Root>
      </div>,
    );
    (screen.container.querySelector("button") as HTMLElement).click();
    const names = (els: Element[]) =>
      els.flatMap((el) => el.getAnimations()).map((a) => (a as CSSTransition).transitionProperty);
    const panel = () => [...screen.container.querySelectorAll("[data-slot=accordion-panel]")];
    const strokes = [...screen.container.querySelectorAll("path")];
    // Both start in the same frame: sample them for as long as the strokes' spring runs.
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      for (const name of names(panel())) seen.add(`panel ${name}`);
      for (const name of names(strokes)) seen.add(`stroke ${name}`);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(seen).toContain("panel opacity");
    expect(seen).toContain("stroke rotate");
    expect(seen.has("panel block-size") || seen.has("panel height")).toBe(true);
  });

  test("horizontal, the panel's width moves instead", async () => {
    tw.load();
    const screen = await render(
      <TwAccordion.Root orientation="horizontal">
        <TwAccordion.Item value="a">
          <TwAccordion.Trigger>A</TwAccordion.Trigger>
          <TwAccordion.Panel>
            <div style={{ inlineSize: 100 }} />
          </TwAccordion.Panel>
        </TwAccordion.Item>
      </TwAccordion.Root>,
    );
    (screen.container.querySelector("button") as HTMLElement).click();
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      for (const el of screen.container.querySelectorAll("[data-slot=accordion-panel]")) {
        for (const a of el.getAnimations()) seen.add((a as CSSTransition).transitionProperty);
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(seen.has("inline-size") || seen.has("width")).toBe(true);
    expect(seen.has("block-size") || seen.has("height")).toBe(false);
  });
});

describe("className on Accordion in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwAccordion.Root defaultValue={["a"]}>
        <TwAccordion.Item value="a">
          <TwAccordion.Trigger className={OVERRIDES}>A</TwAccordion.Trigger>
          <TwAccordion.Panel className="p-0 overflow-visible">x</TwAccordion.Panel>
        </TwAccordion.Item>
        <TwAccordion.Item value="b" className="[[data-slot=accordion-item]+&]:border-red-500">
          <TwAccordion.Trigger>B</TwAccordion.Trigger>
          <TwAccordion.Panel>x</TwAccordion.Panel>
        </TwAccordion.Item>
      </TwAccordion.Root>,
    );
    const trigger = screen.container.querySelector("[data-slot=accordion-trigger]");
    const panel = screen.container.querySelector("[data-slot=accordion-panel]");
    const second = screen.container.querySelectorAll("[data-slot=accordion-item]")[1];
    if (!trigger || !second) throw new Error("not rendered");
    expectStyles(trigger, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      opacity: "1",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
    expectStyles(second, { borderTopColor: "oklch(0.637 0.237 25.331)" });
    expectStyles(panel as Element, { overflow: "visible" });
    expect(getComputedStyle(panel as Element).paddingTop).toBe("0px");
  });

  test("accordionTriggerVariants() output merges with a className, the user's last", () => {
    const merged = cn(accordionTriggerVariants({ size: "sm" }), "text-lg gap-0");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("gap-[0.5em]");
  });
});
