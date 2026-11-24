import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Toggle as CssToggle } from "../src/components/toggle/toggle";
import { cn } from "../src/tailwind/lib/cn";
import { Toggle as TwToggle } from "../src/tailwind/toggle/toggle";
import {
  type ToggleSize,
  toggleSlots,
  toggleVariants,
} from "../src/tailwind/toggle/toggle-variants";
import { type Case, classNames, expectStyles, setMedia, tailwindParity } from "./parity";

// Toggle in Tailwind CSS v4 (src/tailwind/toggle) against toggle.css.

const SIZES: ToggleSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 text-sm font-bold gap-0 opacity-100 outline-red-500 cursor-default duration-300 ease-linear data-pressed:bg-green-500 data-pressed:text-red-500 hover:not-data-pressed:not-data-disabled:not-active:bg-red-500 focus-visible:outline-red-500 data-disabled:opacity-100";

const tw = tailwindParity(
  classNames(
    ...Object.values(toggleSlots),
    ...SIZES.flatMap((size) => [
      toggleVariants({ size }),
      toggleVariants({ size, variant: "solid" }),
    ]),
    OVERRIDES,
    "data-pressed:bg-red-500 data-pressed:text-green-500",
  ),
);

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M12 5v14" />
  </svg>
);

const make = (name: string, ui: (Toggle: typeof CssToggle) => ReactElement): Case => ({
  name,
  css: ui(CssToggle),
  tw: ui(TwToggle),
});

const cases: Case[] = [
  ...SIZES.flatMap((size) => [
    make(size, (Toggle) => <Toggle size={size}>Bold</Toggle>),
    make(`${size} pressed`, (Toggle) => (
      <Toggle size={size} defaultPressed>
        Bold
      </Toggle>
    )),
    make(`${size} icon only`, (Toggle) => (
      <Toggle size={size} startIcon={<Plus />} aria-label="Add" />
    )),
  ]),
  ...SIZES.flatMap((size) => [
    make(`${size} solid`, (Toggle) => (
      <Toggle size={size} variant="solid">
        Bold
      </Toggle>
    )),
    make(`${size} solid pressed`, (Toggle) => (
      <Toggle size={size} variant="solid" defaultPressed>
        Bold
      </Toggle>
    )),
    make(`${size} solid icon only pressed`, (Toggle) => (
      <Toggle size={size} variant="solid" startIcon={<Plus />} defaultPressed aria-label="Add" />
    )),
  ]),
  make("solid disabled", (Toggle) => (
    <Toggle variant="solid" disabled>
      Bold
    </Toggle>
  )),
  make("solid disabled pressed", (Toggle) => (
    <Toggle variant="solid" disabled defaultPressed>
      Bold
    </Toggle>
  )),
  make("solid with icons pressed", (Toggle) => (
    <Toggle variant="solid" startIcon={<Plus />} endIcon={<Plus />} defaultPressed>
      Add
    </Toggle>
  )),
  make("default", (Toggle) => <Toggle>Italic</Toggle>),
  make("disabled", (Toggle) => <Toggle disabled>Bold</Toggle>),
  make("disabled pressed", (Toggle) => (
    <Toggle disabled defaultPressed>
      Bold
    </Toggle>
  )),
  make("start icon", (Toggle) => <Toggle startIcon={<Plus />}>Add</Toggle>),
  make("end icon", (Toggle) => <Toggle endIcon={<Plus />}>Add</Toggle>),
  make("start and end icons", (Toggle) => (
    <Toggle startIcon={<Plus />} endIcon={<Plus />} defaultPressed>
      Add
    </Toggle>
  )),
  make("icon only pressed", (Toggle) => (
    <Toggle startIcon={<Plus />} defaultPressed aria-label="Add" />
  )),
  make("icon only disabled", (Toggle) => <Toggle endIcon={<Plus />} disabled aria-label="Add" />),
  make("size from an outer part", (Toggle) => <Toggle data-size="lg">Bold</Toggle>),
  make("in a larger font", (Toggle) => (
    <div style={{ fontSize: 24 }}>
      <Toggle startIcon={<Plus />}>Add</Toggle>
    </div>
  )),
  make("a link", (Toggle) => <Toggle render={<a href="#top" />}>Bold</Toggle>),
];

describe("Toggle in Tailwind CSS v4 against toggle.css", () => {
  test("every size, state, and icon layout matches in the light theme", async () => {
    await tw.parity(cases);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark" });
  });

  test("and in a right-to-left page, where the icon margins swap sides", async () => {
    await tw.parity(cases, { dir: "rtl" });
  });

  test("hover tints an off toggle, steps an on one up, and leaves a disabled one", {
    timeout: 60_000,
  }, async () => {
    for (const name of [
      "md",
      "md pressed",
      "disabled",
      "disabled pressed",
      "icon only pressed",
      "md solid",
      "md solid pressed",
      "solid disabled pressed",
    ]) {
      await tw.states(cases, name, "hover");
    }
  });

  test("a held press, with a real pointer, goes deepest and in to 0.97", {
    timeout: 60_000,
  }, async () => {
    for (const name of [
      "md",
      "md pressed",
      "lg",
      "disabled",
      "md icon only",
      "md solid",
      "md solid pressed",
      "lg solid pressed",
    ]) {
      await tw.states(cases, name, "held");
    }
  });

  test("keyboard focus draws the ring", async () => {
    for (const name of ["md", "md pressed", "icon only pressed", "md solid pressed"]) {
      await tw.states(cases, name, "focus");
    }
  });

  test("forced colors match: on is the highlight, disabled is gray, focus is the highlight", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases);
    await tw.states(cases, "md pressed", "hover");
    await tw.states(cases, "md pressed", "focus");
    await tw.states(cases, "md", "held");
    await tw.states(cases, "md solid pressed", "hover");
    await tw.states(cases, "md solid pressed", "held");
    await tw.states(cases, "md solid pressed", "focus");
  });

  test("reduced motion matches: a held press does not move", { timeout: 60_000 }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases);
    await tw.states(cases, "md", "held");
    await tw.states(cases, "md pressed", "held");
    await tw.states(cases, "md solid pressed", "held");
  });

  test("more contrast changes nothing", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases);
  });

  test("transitions are the same: property, duration, easing", async () => {
    await tw.motion(cases);
  });

  test("a held press lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    // The authored transition while held, read with a real pointer.
    await tw.states(cases, "md", "held", {
      props: ["transitionDuration", "transitionTimingFunction", "transitionProperty"],
      live: true,
    });
  });
});

describe("className on Toggle in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(<TwToggle className={OVERRIDES}>Bold</TwToggle>);
    const toggle = screen.container.querySelector("button");
    if (!toggle) throw new Error("not rendered");
    expectStyles(toggle, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
      fontSize: "14px",
      columnGap: "0px",
      cursor: "default",
      outlineColor: "oklch(0.637 0.237 25.331)",
      transitionDuration: "0.3s",
    });
    expect(toggle.className).not.toMatch(/(^| )px-\(--px\)( |$)/);
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    tw.load();
    const screen = await render(
      <>
        <TwToggle defaultPressed className="data-pressed:bg-red-500 data-pressed:text-green-500">
          On
        </TwToggle>
        <TwToggle disabled className="data-disabled:opacity-100">
          Off
        </TwToggle>
      </>,
    );
    const [on, off] = [...screen.container.querySelectorAll("button")];
    if (!on || !off) throw new Error("not rendered");
    expectStyles(on, { backgroundColor: "oklch(0.637 0.237 25.331)" });
    expectStyles(off, { opacity: "1" });
  });

  test("a user's utility with a state's variant beats the solid fill's", async () => {
    tw.load();
    const screen = await render(
      <TwToggle variant="solid" defaultPressed className="data-pressed:bg-red-500">
        On
      </TwToggle>,
    );
    const on = screen.container.querySelector("button");
    if (!on) throw new Error("not rendered");
    expectStyles(on, { backgroundColor: "oklch(0.637 0.237 25.331)" });
  });

  test("toggleVariants() output merges with a className, the user's last", () => {
    const merged = cn(toggleVariants({ size: "sm" }), "rounded-none px-8 text-lg");
    expect(merged).toContain("rounded-none");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("rounded-(--ow-radius)");
    expect(merged).not.toContain("px-(--px)");
    expect(merged).not.toContain("text-[0.8125rem]");
  });
});
