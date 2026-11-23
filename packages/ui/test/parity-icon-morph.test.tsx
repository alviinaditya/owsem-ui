import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Button as CssButton } from "../src/components/button/button";
import { IconMorph as CssIconMorph } from "../src/components/icon-morph/icon-morph";
import { Toggle as CssToggle } from "../src/components/toggle/toggle";
import { Button as TwButton } from "../src/tailwind/button/button";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { IconMorph as TwIconMorph } from "../src/tailwind/icon-morph/icon-morph";
import { iconMorphSlots } from "../src/tailwind/icon-morph/icon-morph-variants";
import { cn } from "../src/tailwind/lib/cn";
import { Toggle as TwToggle } from "../src/tailwind/toggle/toggle";
import { toggleSlots, toggleVariants } from "../src/tailwind/toggle/toggle-variants";
import {
  BUTTON_RIPPLE,
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  setMedia,
  tailwindParity,
} from "./parity";

// Icon Morph in Tailwind CSS v4 (src/tailwind/icon-morph) against icon-morph.css.

// What the hidden state draws that PROPS leaves out: the blur.
const props = [...PROPS, "filter"];

const OVERRIDES = "inline-flex size-10 opacity-50";

const tw = tailwindParity(
  classNames(
    ...Object.values(iconMorphSlots),
    ...Object.values(buttonSlots),
    ...Object.values(toggleSlots),
    ...(["sm", "md", "lg"] as const).flatMap((size) => [
      buttonVariants({ size }),
      toggleVariants({ size }),
    ]),
    OVERRIDES,
  ),
  [BUTTON_RIPPLE],
);

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M12 5v14" />
  </svg>
);
const Minus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);

interface Kit {
  IconMorph: typeof CssIconMorph;
  Button: typeof CssButton;
  Toggle: typeof CssToggle;
}
const css: Kit = { IconMorph: CssIconMorph, Button: CssButton, Toggle: CssToggle };
const twind: Kit = { IconMorph: TwIconMorph, Button: TwButton, Toggle: TwToggle };

const make = (name: string, ui: (kit: Kit) => ReactElement): Case => ({
  name,
  css: ui(css),
  tw: ui(twind),
});

const cases: Case[] = [
  make("one icon", ({ IconMorph }) => (
    <IconMorph>
      <Plus key="plus" />
    </IconMorph>
  )),
  make("no icon", ({ IconMorph }) => <IconMorph>{null}</IconMorph>),
  make("with a duration", ({ IconMorph }) => (
    <IconMorph duration="300ms">
      <Plus key="plus" />
    </IconMorph>
  )),
  make("starting", ({ IconMorph }) => (
    <IconMorph>
      <Plus key="plus" />
    </IconMorph>
  )),
  make("ending", ({ IconMorph }) => (
    <IconMorph>
      <Plus key="plus" />
    </IconMorph>
  )),
  make("leaving and arriving", ({ IconMorph }) => (
    <IconMorph>
      <Minus key="minus" />
    </IconMorph>
  )),
  make("in a button", ({ IconMorph, Button }) => (
    <Button startIcon={<IconMorph>{<Plus key="plus" />}</IconMorph>}>Add</Button>
  )),
  make("in a button, icon only", ({ IconMorph, Button }) => (
    <Button size="lg" startIcon={<IconMorph>{<Plus key="plus" />}</IconMorph>} data-icon-only="" />
  )),
  make("in a button's end icon", ({ IconMorph, Button }) => (
    <Button endIcon={<IconMorph>{<Plus key="plus" />}</IconMorph>}>Add</Button>
  )),
  make("in a toggle", ({ IconMorph, Toggle }) => (
    <Toggle startIcon={<IconMorph>{<Plus key="plus" />}</IconMorph>}>Add</Toggle>
  )),
  make("in a toolbar's icon slot", ({ IconMorph }) => (
    <span
      className="ow-toolbar__icon"
      data-slot="toolbar-icon"
      style={{ display: "inline-flex", inlineSize: 18, blockSize: 18 }}
    >
      <IconMorph>
        <Plus key="plus" />
      </IconMorph>
    </span>
  )),
  make("in a larger font", ({ IconMorph }) => (
    <div style={{ fontSize: 28 }}>
      <IconMorph>
        <Plus key="plus" />
      </IconMorph>
    </div>
  )),
];

// The states Icon Morph sets on an icon while it enters or leaves, put on by hand: the transitions
// are frozen, so a real swap would be over before it is measured.
const mark = (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case");
  const items = side.querySelectorAll("[data-slot=icon-morph-item]");
  for (const item of items) {
    if (name === "starting") item.setAttribute("data-starting-style", "");
    if (name === "ending") item.setAttribute("data-ending-style", "");
    if (name === "leaving and arriving") {
      item.setAttribute("data-starting-style", "");
      const leaving = item.cloneNode(true) as Element;
      leaving.removeAttribute("data-starting-style");
      leaving.setAttribute("data-ending-style", "");
      item.after(leaving);
    }
  }
};

describe("Icon Morph in Tailwind CSS v4 against icon-morph.css", () => {
  test("every case matches in the light theme, including the hidden states", async () => {
    await tw.parity(cases, { props, prepare: mark });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props, prepare: mark });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { dir: "rtl", props, prepare: mark });
  });

  test("reduced motion matches: no scale or blur, a short crossfade", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props, prepare: mark });
  });

  test("reduced motion: a 150 ms crossfade of opacity alone", async () => {
    await setMedia("reduced-motion");
    await tw.motion(cases, { props, prepare: mark });
  });

  test("forced colors and more contrast change nothing", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props, prepare: mark });
    await setMedia("more-contrast");
    await tw.parity(cases, { props, prepare: mark });
  });

  test("transitions are the same: properties, durations, easings", async () => {
    await tw.motion(cases, { props, prepare: mark });
  });
});

describe("a swap in Tailwind CSS v4", () => {
  test("the old icon leaves while the new one enters, then one is left", async () => {
    tw.load();
    const Swap = ({ icon }: { icon: "plus" | "minus" }) => (
      // Long enough to be read on a slow runner; finished by hand below.
      <TwIconMorph duration="20s">
        {icon === "plus" ? <Plus key="plus" /> : <Minus key="minus" />}
      </TwIconMorph>
    );
    const screen = await render(<Swap icon="plus" />);
    const root = () => screen.container.firstElementChild as HTMLElement;
    expect(root().children).toHaveLength(1);
    // Swapped before its first style, an icon has nothing to transition from and goes at once.
    void getComputedStyle(root().firstElementChild as Element).opacity;
    await screen.rerender(<Swap icon="minus" />);
    const items = [...root().children];
    expect(items).toHaveLength(2);
    const leaving = items.find((item) => item.hasAttribute("data-ending-style"));
    expect(leaving).toBeDefined();
    expect(getComputedStyle(leaving as Element).transitionProperty).toBe("opacity, scale, filter");
    for (const animation of root().getAnimations({ subtree: true })) animation.finish();
    await expect.poll(() => root().children.length, { timeout: 3000 }).toBe(1);
    await frame();
    expect(root().firstElementChild?.hasAttribute("data-ending-style")).toBe(false);
  });
});

describe("className on Icon Morph in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwIconMorph className={OVERRIDES}>
        <Plus key="plus" />
      </TwIconMorph>,
    );
    const root = screen.container.firstElementChild;
    if (!root) throw new Error("not rendered");
    expectStyles(root, { display: "inline-flex", width: "40px", height: "40px", opacity: "0.5" });
  });

  test("the slots merge with a className, the user's last", () => {
    expect(cn(iconMorphSlots.root, "inline-flex")).toContain("inline-flex");
    expect(cn(iconMorphSlots.root, "inline-flex")).not.toContain("inline-grid");
  });
});
