import { type ReactElement, useEffect, useState } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Input as CssInput } from "../src/components/input/input";
import inputCss from "../src/components/input/input.css?raw";
import { Input as TwInput } from "../src/tailwind/input/input";
import {
  type InputSize,
  inputSlots,
  inputVariants,
  inputWrapperVariants,
} from "../src/tailwind/input/input-variants";
import { cn } from "../src/tailwind/lib/cn";
import bridge from "../src/tailwind.css?raw";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  INPUT_RESIZE,
  setMedia,
  tailwindParity,
} from "./parity";

// Input in Tailwind CSS v4 (src/tailwind/input) against input.css.

const SIZES: InputSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 text-sm h-20 ps-12 pe-2 outline-red-500 cursor-default opacity-100 resize-none min-h-0 transition-none";

const tw = tailwindParity(
  classNames(
    "h-40 resize-none min-h-0",
    ...Object.values(inputSlots),
    ...SIZES.flatMap((size) => [inputVariants({ size }), inputWrapperVariants({ size })]),
    OVERRIDES,
    "ow-input-invalid:bg-green-500 ow-input-disabled:opacity-100 focus-visible:outline-red-500",
  ),
  [INPUT_RESIZE],
);

const Search = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

/** Turns invalid after it has mounted valid, so it is armed and shakes. */
function Rejects({ Input }: { Input: typeof CssInput }): ReactElement {
  const [invalid, setInvalid] = useState(false);
  useEffect(() => setInvalid(true), []);
  return <Input aria-label="Name" aria-invalid={invalid ? "true" : undefined} />;
}

const make = (name: string, ui: (Input: typeof CssInput) => ReactElement): Case => ({
  name,
  css: ui(CssInput),
  tw: ui(TwInput),
});

const cases: Case[] = [
  ...SIZES.flatMap((size) => [
    make(`${size} value`, (Input) => <Input size={size} aria-label="Name" defaultValue="Ada" />),
    make(`${size} placeholder`, (Input) => (
      <Input size={size} aria-label="Name" placeholder="Your name" />
    )),
    make(`${size} start icon`, (Input) => (
      <Input size={size} aria-label="Search" startIcon={<Search />} placeholder="Search" />
    )),
    make(`${size} end icon`, (Input) => (
      <Input size={size} aria-label="Search" endIcon={<Search />} defaultValue="Ada" />
    )),
    make(`${size} both icons`, (Input) => (
      <Input
        size={size}
        aria-label="Search"
        startIcon={<Search />}
        endIcon={<Search />}
        placeholder="Search"
      />
    )),
  ]),
  make("default", (Input) => <Input aria-label="Name" />),
  make("disabled", (Input) => <Input aria-label="Name" disabled placeholder="Disabled" />),
  make("disabled with icons", (Input) => (
    <Input
      aria-label="Name"
      disabled
      startIcon={<Search />}
      endIcon={<Search />}
      defaultValue="x"
    />
  )),
  make("invalid by aria", (Input) => <Input aria-label="Name" aria-invalid="true" />),
  make("invalid by data", (Input) => <Input aria-label="Name" data-invalid="" />),
  make("invalid with icons", (Input) => (
    <Input aria-label="Name" aria-invalid="true" startIcon={<Search />} endIcon={<Search />} />
  )),
  make("invalid and disabled", (Input) => <Input aria-label="Name" aria-invalid="true" disabled />),
  make("aria-invalid false", (Input) => <Input aria-label="Name" aria-invalid="false" />),
  make("textarea", (Input) => <Input aria-label="Bio" render={<textarea rows={3} />} />),
  make("textarea with icons", (Input) => (
    <Input aria-label="Bio" render={<textarea rows={2} />} startIcon={<Search />} />
  )),
  make("size from an outer part", (Input) => (
    <Input aria-label="Name" data-size="lg" startIcon={<Search />} />
  )),
  make("in a larger font", (Input) => (
    <div style={{ fontSize: 22 }}>
      <Input aria-label="Name" startIcon={<Search />} style={{ fontSize: 20 }} />
    </div>
  )),
  make("with an icon color from style", (Input) => (
    <Input aria-label="Name" startIcon={<Search />} style={{ "--icon": "30px" } as never} />
  )),
  make("shake set to off", (Input) => (
    <Input aria-label="Name" aria-invalid="true" data-armed="" data-shake="off" />
  )),
  make("invalid and armed", (Input) => <Rejects Input={Input} />),
  make("invalid unarmed from the start", (Input) => (
    <Input aria-label="Name" aria-invalid="true" />
  )),
  make("file", (Input) => <Input aria-label="File" type="file" />),
];

describe("Input in Tailwind CSS v4 against input.css", () => {
  test("every size, icon layout, and state matches in the light theme", async () => {
    await tw.parity(cases);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark" });
  });

  test("and in a right-to-left page, where the icons and their clearance swap sides", async () => {
    await tw.parity(cases, { dir: "rtl" });
  });

  test("hover deepens the tint, except when invalid or disabled", { timeout: 60_000 }, async () => {
    for (const name of ["md value", "invalid by aria", "disabled", "md start icon", "textarea"]) {
      await tw.states(cases, name, "hover", { target: "input, textarea" });
    }
  });

  test("keyboard focus draws the ring", { timeout: 60_000 }, async () => {
    for (const name of ["md value", "invalid by data", "md both icons", "textarea"]) {
      await tw.states(cases, name, "focus", { target: "input, textarea" });
    }
  });

  test("forced colors match: the edge, invalid thicker, disabled gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases);
    for (const name of ["md value", "invalid by aria", "md both icons"]) {
      await tw.states(cases, name, "focus", { target: "input" });
    }
    await tw.states(cases, "md value", "hover", { target: "input" });
  });

  test("more contrast brings the edge back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases);
  });

  test("reduced motion matches", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases);
  });

  test("transitions and animations are the same: name, duration, easing", async () => {
    await tw.motion(cases);
  });

  test("a field that becomes invalid shakes with the same animation", async () => {
    await tw.motion(cases, { names: ["invalid and armed", "shake set to off"] });
    tw.load();
    const screen = await render(
      <>
        <Rejects Input={CssInput} />
        <Rejects Input={TwInput} />
      </>,
    );
    await frame();
    const [a, b] = [...screen.container.querySelectorAll("input")].map((input) => {
      const style = getComputedStyle(input);
      return [style.animationName, style.animationDuration, style.animationTimingFunction];
    });
    expect(a?.[0]).toBe("ow-input-shake");
    expect(b).toEqual(a);
  });

  test("a field that becomes invalid blinks instead when motion is reduced", async () => {
    await setMedia("reduced-motion");
    tw.load();
    const screen = await render(
      <>
        <Rejects Input={CssInput} />
        <Rejects Input={TwInput} />
      </>,
    );
    await frame();
    const [a, b] = [...screen.container.querySelectorAll("input")].map((input) => {
      const style = getComputedStyle(input);
      return [style.animationName, style.animationDuration, style.animationTimingFunction];
    });
    expect(a?.[0]).toBe("ow-input-blink");
    expect(b).toEqual(a);
  });

  test("the keyframes in tailwind.css are the ones in input.css", () => {
    const rules = (css: string): Record<string, string> => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css.replace(/@layer[^{;]*[{;]/g, ""));
      return Object.fromEntries(
        [...sheet.cssRules]
          .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule)
          .map((rule) => [rule.name, rule.cssText]),
      );
    };
    const mine = rules(inputCss);
    const theirs = rules(bridge);
    expect(Object.keys(mine).sort()).toEqual(["ow-input-blink", "ow-input-shake"]);
    for (const name of Object.keys(mine)) expect(theirs[name], name).toBe(mine[name]);
  });
});

describe("className on Input in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <>
        <TwInput aria-label="Name" className={OVERRIDES} />
        <TwInput
          aria-label="Name"
          startIcon={<Search />}
          endIcon={<Search />}
          className="px-8 py-1"
        />
      </>,
    );
    const [plain, icons] = [...screen.container.querySelectorAll("input")];
    if (!plain || !icons) throw new Error("not rendered");
    expectStyles(plain, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      paddingLeft: "48px",
      paddingRight: "8px",
      paddingTop: "4px",
      height: "80px",
      fontSize: "14px",
      cursor: "default",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
    // The icons raise the padding through variables, so a user's px still wins on both sides.
    expectStyles(icons, { paddingLeft: "32px", paddingRight: "32px" });
  });

  test("a user's height and resize win on a textarea", async () => {
    tw.load();
    const screen = await render(
      <TwInput aria-label="Bio" render={<textarea />} className="h-40 resize-none min-h-0" />,
    );
    const area = screen.container.querySelector("textarea");
    if (!area) throw new Error("not rendered");
    expectStyles(area, { height: "160px", resize: "none", minHeight: "0px" });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    tw.load();
    const screen = await render(
      <>
        <TwInput aria-label="Name" aria-invalid="true" className="ow-input-invalid:bg-green-500" />
        <TwInput aria-label="Name" disabled className="ow-input-disabled:opacity-100" />
      </>,
    );
    const [invalid, disabled] = [...screen.container.querySelectorAll("input")];
    if (!invalid || !disabled) throw new Error("not rendered");
    expectStyles(invalid, { backgroundColor: "oklch(0.723 0.219 149.579)" });
    expectStyles(disabled, { opacity: "1" });
  });

  test("inputVariants() output merges with a className, the user's last", () => {
    const merged = cn(inputVariants({ size: "sm" }), "rounded-none px-8 text-lg");
    expect(merged).toContain("rounded-none");
    expect(merged).not.toContain("rounded-(--ow-radius)");
    expect(merged).not.toContain("ps-(--_ps)");
    expect(merged).not.toContain("pe-(--_pe)");
    expect(merged).not.toContain("text-[0.8125rem]");
  });
});
