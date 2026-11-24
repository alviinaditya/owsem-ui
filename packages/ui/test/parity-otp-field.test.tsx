import { Field } from "@base-ui/react/field";
import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { OTPField as CssOTP } from "../src/components/otp-field/index";
import otpCss from "../src/components/otp-field/otp-field.css?raw";
import { cn } from "../src/tailwind/lib/cn";
import { OTPField as TwOTP } from "../src/tailwind/otp-field/index";
import {
  type OTPFieldSize,
  otpFieldSlots,
  otpFieldVariants,
} from "../src/tailwind/otp-field/otp-field-variants";
import bridge from "../src/tailwind.css?raw";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// OTP Field in Tailwind CSS v4 (src/tailwind/otp-field) against otp-field.css.

const SIZES: OTPFieldSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm opacity-50 gap-0 outline-red-500 w-20";

const tw = tailwindParity(
  classNames(
    ...Object.values(otpFieldSlots),
    ...SIZES.map((size) => otpFieldVariants({ size })),
    OVERRIDES,
    "bg-green-500 rounded-none",
  ),
);

// What these parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "justifyContent",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "fontVariantNumeric",
  "textAlign",
  "animationName",
  "animationDuration",
];

type Kit = typeof CssOTP;
const make = (name: string, ui: (OTPField: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssOTP),
  tw: ui(TwOTP),
});

const cases: Case[] = [
  ...SIZES.map((size) =>
    make(size, (OTPField) => <OTPField.Root length={6} size={size} aria-label="Code" />),
  ),
  make("filled", (OTPField) => <OTPField.Root length={6} aria-label="Code" defaultValue="4829" />),
  make("complete", (OTPField) => (
    <OTPField.Root length={4} aria-label="Code" defaultValue="4829" />
  )),
  make("masked", (OTPField) => (
    <OTPField.Root length={4} aria-label="Code" defaultValue="48" mask />
  )),
  make("disabled", (OTPField) => (
    <OTPField.Root length={4} aria-label="Code" defaultValue="48" disabled />
  )),
  make("read only", (OTPField) => (
    <OTPField.Root length={4} aria-label="Code" defaultValue="48" readOnly />
  )),
  make("invalid", (OTPField) => (
    <Field.Root invalid>
      <OTPField.Root length={4} aria-label="Code" defaultValue="48" />
    </Field.Root>
  )),
  make("in a field", (OTPField) => (
    <Field.Root>
      <Field.Label>Code</Field.Label>
      <OTPField.Root length={4} />
    </Field.Root>
  )),
  make("grouped", (OTPField) => (
    <Field.Root>
      <Field.Label>Code</Field.Label>
      <OTPField.Root length={6}>
        <OTPField.Input />
        <OTPField.Input aria-label="2" />
        <OTPField.Input aria-label="3" />
        <span aria-hidden="true">-</span>
        <OTPField.Input aria-label="4" />
        <OTPField.Input aria-label="5" />
        <OTPField.Input aria-label="6" />
      </OTPField.Root>
    </Field.Root>
  )),
  make("a user's class", (OTPField) => (
    <OTPField.Root length={3} aria-label="Code" className="gap-0">
      <OTPField.Input aria-label="1" className="rounded-none bg-green-500" />
      <OTPField.Input aria-label="2" />
      <OTPField.Input aria-label="3" />
    </OTPField.Root>
  )),
  {
    name: "in a larger font",
    css: (
      <div style={{ fontSize: 24 }}>
        <CssOTP.Root length={4} aria-label="Code" />
      </div>
    ),
    tw: (
      <div style={{ fontSize: 24 }}>
        <TwOTP.Root length={4} aria-label="Code" />
      </div>
    ),
  },
];

// The slot Base UI makes the tab stop: the one after the last character typed.
const slot = { target: '[data-slot=otp-field-input][tabindex="0"]', props };

describe("OTP Field in Tailwind CSS v4 against otp-field.css", () => {
  test("every size and state matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("hover deepens a slot's tint", { timeout: 60_000 }, async () => {
    for (const name of ["md", "disabled", "read only", "invalid"]) {
      await tw.states(cases, name, "hover", slot);
    }
  });

  test("keyboard focus rings the slot", { timeout: 60_000 }, async () => {
    for (const name of ["md", "invalid", "read only", "in a field"]) {
      await tw.states(cases, name, "focus", slot);
    }
  });

  test("forced colors match: the edge shows, focus is Highlight, disabled is gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
    await tw.states(cases, "md", "focus", slot);
  });

  test("reduced motion matches: an invalid row blinks", { timeout: 60_000 }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.motion(cases);
  });

  test("more contrast brings each slot's edge back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("animations are the same: the row's shake", async () => {
    await tw.motion(cases);
  });

  test("the keyframes in tailwind.css are the ones in otp-field.css", () => {
    const rules = (css: string): Record<string, string> => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css.replace(/@layer[^{;]*[{;]/g, ""));
      return Object.fromEntries(
        [...sheet.cssRules]
          .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule)
          .map((rule) => [rule.name, rule.cssText]),
      );
    };
    const mine = rules(otpCss);
    expect(Object.keys(mine)).toEqual(["ow-otp-field-shake", "ow-otp-field-blink"]);
    for (const name of Object.keys(mine)) {
      expect(rules(bridge)[name]).toBe(mine[name]);
    }
  });
});

describe("an OTP field in Tailwind CSS v4 behaves as in CSS", () => {
  test("it shakes the row, not the slots, when it becomes invalid", async () => {
    tw.load();
    const screen = await render(
      <Field.Root>
        <TwOTP.Root length={4} aria-label="Code" />
      </Field.Root>,
    );
    const el = screen.container.querySelector("[data-slot=otp-field]") as HTMLElement;
    await screen.rerender(
      <Field.Root invalid>
        <TwOTP.Root length={4} aria-label="Code" />
      </Field.Root>,
    );
    await expect.poll(() => getComputedStyle(el).animationName).toBe("ow-otp-field-shake");
    const first = screen.container.querySelector("[data-slot=otp-field-input]") as HTMLElement;
    expect(getComputedStyle(first).animationName).toBe("none");
  });
});

describe("className on OTP Field in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwOTP.Root length={2} aria-label="Code" className="gap-0">
        <TwOTP.Input aria-label="A" className={OVERRIDES} />
        <TwOTP.Input aria-label="B" className="bg-green-500" />
      </TwOTP.Root>,
    );
    const [a, b] = [...screen.container.querySelectorAll("[data-slot=otp-field-input]")];
    if (!a || !b) throw new Error("not rendered");
    expectStyles(a, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      opacity: "0.5",
      outlineColor: "oklch(0.637 0.237 25.331)",
      width: "80px",
    });
    expectStyles(b, { backgroundColor: "oklch(0.723 0.219 149.579)" });
  });

  test("otpFieldVariants() output merges with a className, the user's last", () => {
    const merged = cn(otpFieldVariants({ size: "sm" }), "text-lg gap-0");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("gap-[0.5em]");
  });
});
