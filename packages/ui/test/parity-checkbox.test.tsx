import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Checkbox as CssCheckbox } from "../src/components/checkbox/index";
import {
  type CheckboxSize,
  checkboxSlots,
  checkboxVariants,
} from "../src/tailwind/checkbox/checkbox-variants";
import { Checkbox as TwCheckbox } from "../src/tailwind/checkbox/index";
import { cn } from "../src/tailwind/lib/cn";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// Checkbox in Tailwind CSS v4 (src/tailwind/checkbox) against checkbox.css.

const SIZES: CheckboxSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm opacity-100 outline-red-500 cursor-default size-8 duration-300 ease-linear data-checked:bg-green-500 data-checked:text-red-500 data-disabled:opacity-100 focus-visible:outline-red-500";

const tw = tailwindParity(
  classNames(
    ...Object.values(checkboxSlots),
    ...SIZES.map((size) => checkboxVariants({ size })),
    OVERRIDES,
    "ow-checkbox-on:bg-red-500 ow-checkbox-on:text-green-500 ow-label-hover:bg-red-500 ow-checkbox-held:bg-red-500",
  ),
);

// What the checkbox draws that PROPS leaves out: the glyphs' strokes and their cell.
const props = [
  ...PROPS,
  "strokeDasharray",
  "strokeDashoffset",
  "stroke",
  "strokeWidth",
  "fill",
  "gridArea",
  "filter",
];

type Kit = typeof CssCheckbox;
const make = (name: string, ui: (Checkbox: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssCheckbox),
  tw: ui(TwCheckbox),
});

const Dot = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="6" fill="currentColor" />
  </svg>
);

const cases: Case[] = [
  ...SIZES.flatMap((size) => [
    make(size, (Checkbox) => <Checkbox.Root size={size} aria-label="Agree" />),
    make(`${size} checked`, (Checkbox) => (
      <Checkbox.Root size={size} defaultChecked aria-label="Agree" />
    )),
    make(`${size} indeterminate`, (Checkbox) => (
      <Checkbox.Root size={size} indeterminate aria-label="Agree" />
    )),
  ]),
  make("default", (Checkbox) => <Checkbox.Root aria-label="Agree" />),
  make("disabled", (Checkbox) => <Checkbox.Root disabled aria-label="Agree" />),
  make("disabled checked", (Checkbox) => (
    <Checkbox.Root disabled defaultChecked aria-label="Agree" />
  )),
  make("disabled indeterminate", (Checkbox) => (
    <Checkbox.Root disabled indeterminate aria-label="Agree" />
  )),
  make("read only", (Checkbox) => <Checkbox.Root readOnly aria-label="Agree" />),
  make("read only checked", (Checkbox) => (
    <Checkbox.Root readOnly defaultChecked aria-label="Agree" />
  )),
  make("disabled and read only", (Checkbox) => (
    <Checkbox.Root disabled readOnly defaultChecked aria-label="Agree" />
  )),
  make("indicator kept while off", (Checkbox) => (
    <Checkbox.Root aria-label="Agree">
      <Checkbox.Indicator keepMounted />
    </Checkbox.Root>
  )),
  make("indicator kept, checked", (Checkbox) => (
    <Checkbox.Root defaultChecked aria-label="Agree">
      <Checkbox.Indicator keepMounted />
    </Checkbox.Root>
  )),
  make("indicator kept, mixed", (Checkbox) => (
    <Checkbox.Root indeterminate aria-label="Agree">
      <Checkbox.Indicator keepMounted />
    </Checkbox.Root>
  )),
  make("starting checked", (Checkbox) => <Checkbox.Root defaultChecked aria-label="Agree" />),
  make("starting mixed", (Checkbox) => <Checkbox.Root indeterminate aria-label="Agree" />),
  make("starting kept, off", (Checkbox) => (
    <Checkbox.Root aria-label="Agree">
      <Checkbox.Indicator keepMounted />
    </Checkbox.Root>
  )),
  make("a glyph of your own", (Checkbox) => (
    <Checkbox.Root defaultChecked aria-label="Agree">
      <Checkbox.Indicator>
        <Dot />
      </Checkbox.Indicator>
    </Checkbox.Root>
  )),
  make("size from an outer part", (Checkbox) => (
    <Checkbox.Root data-size="lg" aria-label="Agree" defaultChecked />
  )),
  make("in a larger font", (Checkbox) => (
    <div style={{ fontSize: 24 }}>
      <Checkbox.Root aria-label="Agree" defaultChecked />
    </div>
  )),
  make("in a label", (Checkbox) => (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Checkbox.Root />
      <span data-text="">Agree to the terms</span>
    </label>
  )),
  make("in a label, checked", (Checkbox) => (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Checkbox.Root defaultChecked />
      <span data-text="">Agree to the terms</span>
    </label>
  )),
  make("in a label, disabled", (Checkbox) => (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Checkbox.Root disabled />
      <span data-text="">Agree to the terms</span>
    </label>
  )),
];

// The state Base UI puts on an indicator while it mounts, put on by hand: the transitions are frozen.
const mark = (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  if (name.startsWith("starting")) {
    side.querySelector("[data-slot=checkbox-indicator]")?.setAttribute("data-starting-style", "");
  }
};

const box = { target: "[data-slot=checkbox]", props };
const text = { target: "[data-text]", props };

describe("Checkbox in Tailwind CSS v4 against checkbox.css", () => {
  test("every size, state, and glyph matches in the light theme", async () => {
    await tw.parity(cases, { props, prepare: mark });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props, prepare: mark });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { dir: "rtl", props, prepare: mark });
  });

  test("hover tints an off box, lights a checked one, and leaves a disabled one", {
    timeout: 60_000,
  }, async () => {
    for (const name of [
      "md",
      "md checked",
      "md indeterminate",
      "disabled",
      "read only",
      "read only checked",
    ]) {
      await tw.states(cases, name, "hover", box);
    }
  });

  test("hover matches in the dark theme: a checked box darkens, an off one steps up", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "md checked", "md indeterminate"]) {
      await tw.states(cases, name, "hover", { ...box, theme: "dark" });
    }
    await tw.states(cases, "in a label, checked", "hover", { ...text, theme: "dark" });
  });

  test("pointing at the label counts as pointing at the box", { timeout: 60_000 }, async () => {
    for (const name of ["in a label", "in a label, checked", "in a label, disabled"]) {
      await tw.states(cases, name, "hover", text);
    }
  });

  test("a held press, with a real pointer, goes deeper and in to 0.97", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "md checked", "md indeterminate", "disabled", "read only"]) {
      await tw.states(cases, name, "held", box);
    }
    for (const name of ["in a label", "in a label, checked"]) {
      await tw.states(cases, name, "held", text);
    }
  });

  test("keyboard focus draws the ring", { timeout: 60_000 }, async () => {
    for (const name of ["md", "md checked", "md indeterminate"]) {
      await tw.states(cases, name, "focus", box);
    }
  });

  test("forced colors match: on is the highlight, disabled is gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props, prepare: mark });
    await tw.states(cases, "md checked", "hover", box);
    await tw.states(cases, "md checked", "focus", box);
    await tw.states(cases, "md", "held", box);
  });

  test("reduced motion matches: nothing moves or draws", { timeout: 60_000 }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props, prepare: mark });
    await tw.states(cases, "md", "held", box);
    await tw.states(cases, "md checked", "held", box);
  });

  test("more contrast brings the edge back, over a checked box too", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props, prepare: mark });
  });

  test("transitions and animations are the same: durations, easings, names", async () => {
    await tw.motion(cases, { prepare: mark });
  });

  test("reduced motion keeps the fade and drops the movement", async () => {
    await setMedia("reduced-motion");
    await tw.motion(cases, { prepare: mark });
  });

  test("a held press lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "md", "held", { ...box, props: motion, live: true });
    await tw.states(cases, "md checked", "held", { ...box, props: motion, live: true });
  });
});

describe("className on Checkbox in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(<TwCheckbox.Root className={OVERRIDES} aria-label="Agree" />);
    const box = screen.container.querySelector("[data-slot=checkbox]");
    if (!box) throw new Error("not rendered");
    expectStyles(box, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      width: "32px",
      height: "32px",
      fontSize: "14px",
      cursor: "default",
      outlineColor: "oklch(0.637 0.237 25.331)",
      transitionDuration: "0.3s",
    });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    tw.load();
    const screen = await render(
      <>
        <TwCheckbox.Root
          defaultChecked
          aria-label="Agree"
          className="ow-checkbox-on:bg-red-500 ow-checkbox-on:text-green-500"
        />
        <TwCheckbox.Root disabled aria-label="Agree" className="data-disabled:opacity-100" />
      </>,
    );
    const [on, off] = [...screen.container.querySelectorAll("[data-slot=checkbox]")];
    if (!on || !off) throw new Error("not rendered");
    expectStyles(on, {
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.723 0.219 149.579)",
    });
    expectStyles(off, { opacity: "1" });
  });

  test("checkboxVariants() output merges with a className, the user's last", () => {
    const merged = cn(checkboxVariants({ size: "sm" }), "rounded-none size-8 text-lg");
    expect(merged).toContain("rounded-none");
    expect(merged).toContain("size-8");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("rounded-[calc(var(--ow-radius)_/_2)]");
    expect(merged).not.toContain("size-(--icon)");
    expect(merged).not.toContain("text-[0.8125rem]");
  });
});
