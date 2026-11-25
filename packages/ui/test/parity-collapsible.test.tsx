import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Collapsible as CssCollapsible } from "../src/components/collapsible/index";
import {
  type CollapsibleSize,
  collapsibleContentVariants,
  collapsibleSlots,
  collapsibleTriggerVariants,
} from "../src/tailwind/collapsible/collapsible-variants";
import { Collapsible as TwCollapsible } from "../src/tailwind/collapsible/index";
import { cn } from "../src/tailwind/lib/cn";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// Collapsible in Tailwind CSS v4 (src/tailwind/collapsible) against collapsible.css.

const SIZES: CollapsibleSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 text-sm font-bold gap-0 opacity-100 outline-red-500 cursor-default";

const tw = tailwindParity(
  classNames(
    ...Object.values(collapsibleSlots),
    ...SIZES.map((size) => collapsibleTriggerVariants({ size })),
    ...SIZES.map((size) => collapsibleContentVariants({ size })),
    OVERRIDES,
    "p-0 overflow-visible text-green-500",
  ),
);

// What the chevron and the panel draw that PROPS leaves out.
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

type Kit = typeof CssCollapsible;
const make = (name: string, ui: (Collapsible: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssCollapsible),
  tw: ui(TwCollapsible),
});

const Dot = () => <b>+</b>;

const whole = (
  Collapsible: Kit,
  options: { size?: CollapsibleSize; open?: boolean; disabled?: boolean } = {},
) => (
  <div style={{ inlineSize: 300 }}>
    <Collapsible.Root size={options.size} defaultOpen={options.open} disabled={options.disabled}>
      <Collapsible.Trigger>Details</Collapsible.Trigger>
      <Collapsible.Panel>
        <p style={{ margin: 0 }}>Some content</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </div>
);

const cases: Case[] = [
  ...SIZES.flatMap((size) => [
    make(size, (Collapsible) => whole(Collapsible, { size })),
    make(`${size} open`, (Collapsible) => whole(Collapsible, { size, open: true })),
  ]),
  make("an own size on the trigger", (Collapsible) => (
    <div style={{ inlineSize: 300 }}>
      <Collapsible.Root size="lg" defaultOpen>
        <Collapsible.Trigger size="sm">Details</Collapsible.Trigger>
        <Collapsible.Panel>Some content</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  )),
  make("a trigger in a heading", (Collapsible) => (
    <div style={{ inlineSize: 300 }}>
      <Collapsible.Root size="sm" defaultOpen>
        <h3 style={{ margin: 0 }}>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
        </h3>
        <Collapsible.Panel>Some content</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  )),
  make("disabled", (Collapsible) => whole(Collapsible, { disabled: true })),
  make("disabled open", (Collapsible) => whole(Collapsible, { disabled: true, open: true })),
  make("a custom icon", (Collapsible) => (
    <div style={{ inlineSize: 300 }}>
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger icon={<Dot />}>Details</Collapsible.Trigger>
        <Collapsible.Panel>Some content</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  )),
  make("no icon", (Collapsible) => (
    <div style={{ inlineSize: 300 }}>
      <Collapsible.Root>
        <Collapsible.Trigger icon={null}>Details</Collapsible.Trigger>
      </Collapsible.Root>
    </div>
  )),
  make("kept mounted, closed", (Collapsible) => (
    <div style={{ inlineSize: 300 }}>
      <Collapsible.Root>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Panel keepMounted>Some content</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  )),
  make("until found, closed", (Collapsible) => (
    <div style={{ inlineSize: 300 }}>
      <Collapsible.Root>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Panel hiddenUntilFound>Some content</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  )),
  make("a long label", (Collapsible) => (
    <div style={{ inlineSize: 180 }}>
      <Collapsible.Root>
        <Collapsible.Trigger>
          A label that has to wrap before it reaches the chevron
        </Collapsible.Trigger>
      </Collapsible.Root>
    </div>
  )),
  make("in a larger font", (Collapsible) => (
    <div style={{ inlineSize: 300, fontSize: 24 }}>
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger>Big</Collapsible.Trigger>
        <Collapsible.Panel>Content</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  )),
];

describe("Collapsible in Tailwind CSS v4 against collapsible.css", () => {
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

  test("reduced motion matches: no press, no chevron transition, a fade only", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.motion(cases);
  });

  test("more contrast matches", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("a hovered trigger matches", async () => {
    await tw.states(cases, "md", "hover", { props, target: "button" });
  });

  test("a held trigger matches", async () => {
    await tw.states(cases, "md", "held", { props, target: "button" });
  });

  test("a focused trigger matches", async () => {
    await tw.states(cases, "lg", "focus", { props, target: "button" });
  });

  test("transitions are the same: the press, the chevron's strokes, the panel's size and fade", async () => {
    await tw.motion(cases);
  });
});

describe("a collapsible in Tailwind CSS v4 moves", () => {
  test("opening runs a transition of the panel's height and opacity, and of each stroke's rotate", async () => {
    tw.load();
    const screen = await render(
      <div style={{ inlineSize: 300 }}>
        <TwCollapsible.Root>
          <TwCollapsible.Trigger>A</TwCollapsible.Trigger>
          <TwCollapsible.Panel>
            <div style={{ blockSize: 100 }} />
          </TwCollapsible.Panel>
        </TwCollapsible.Root>
      </div>,
    );
    const trigger = screen.container.querySelector("button") as HTMLElement;
    trigger.click();
    const names = (els: Element[]) =>
      els.flatMap((el) => el.getAnimations()).map((a) => (a as CSSTransition).transitionProperty);
    const panel = () => [...screen.container.querySelectorAll("[data-slot=collapsible-panel]")];
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
});

describe("className on Collapsible in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwCollapsible.Root defaultOpen>
        <TwCollapsible.Trigger className={OVERRIDES}>A</TwCollapsible.Trigger>
        <TwCollapsible.Panel className="p-0 overflow-visible">x</TwCollapsible.Panel>
      </TwCollapsible.Root>,
    );
    const trigger = screen.container.querySelector("[data-slot=collapsible-trigger]");
    const panel = screen.container.querySelector("[data-slot=collapsible-panel]");
    if (!trigger || !panel) throw new Error("not rendered");
    expectStyles(trigger, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      opacity: "1",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
    expectStyles(panel, { overflow: "visible" });
  });

  test("collapsibleTriggerVariants() output merges with a className, the user's last", () => {
    const merged = cn(collapsibleTriggerVariants({ size: "sm" }), "text-lg gap-0");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("gap-[0.5em]");
  });
});
