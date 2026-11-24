import { Field } from "@base-ui/react/field";
import type { ReactElement } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { NumberField as CssField } from "../src/components/number-field/index";
import numberFieldCss from "../src/components/number-field/number-field.css?raw";
import { cn } from "../src/tailwind/lib/cn";
import { NumberField as TwField } from "../src/tailwind/number-field/index";
import {
  type NumberFieldSize,
  numberFieldSlots,
  numberFieldVariants,
} from "../src/tailwind/number-field/number-field-variants";
import bridge from "../src/tailwind.css?raw";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// Number Field in Tailwind CSS v4 (src/tailwind/number-field) against number-field.css.

const SIZES: NumberFieldSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm opacity-50 gap-0 outline-red-500 cursor-default h-20";

const tw = tailwindParity(
  classNames(
    ...Object.values(numberFieldSlots),
    ...SIZES.map((size) => numberFieldVariants({ size })),
    OVERRIDES,
    "bg-green-500 rounded-none text-center",
  ),
);

// What these parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "marginInlineStart",
  "marginInlineEnd",
  "paddingInlineStart",
  "fontVariantNumeric",
  "textAlign",
  "userSelect",
  "webkitTapHighlightColor",
  "animationName",
  "animationDuration",
];

type Kit = typeof CssField;
const make = (name: string, ui: (NumberField: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssField),
  tw: ui(TwField),
});

const whole = (
  NumberField: Kit,
  extra: Partial<Parameters<Kit["Root"]>[0]> = {},
  label = "Quantity",
) => (
  <NumberField.Root defaultValue={5} {...extra}>
    <NumberField.Group>
      <NumberField.Decrement />
      <NumberField.Input aria-label={label} />
      <NumberField.Increment />
    </NumberField.Group>
  </NumberField.Root>
);

const cases: Case[] = [
  ...SIZES.map((size) => make(size, (NumberField) => whole(NumberField, { size }))),
  make("a bare field", (NumberField) => <NumberField.Root defaultValue={5} />),
  make("a bare group", (NumberField) => (
    <NumberField.Root defaultValue={5}>
      <NumberField.Group />
    </NumberField.Root>
  )),
  make("empty", (NumberField) => whole(NumberField, { defaultValue: undefined })),
  make("at the min", (NumberField) => whole(NumberField, { defaultValue: 0, min: 0, max: 10 })),
  make("at the max", (NumberField) => whole(NumberField, { defaultValue: 10, min: 0, max: 10 })),
  make("disabled", (NumberField) => whole(NumberField, { disabled: true })),
  make("read only", (NumberField) => whole(NumberField, { readOnly: true })),
  make("invalid", (NumberField) => <Field.Root invalid>{whole(NumberField)}</Field.Root>),
  make("a currency", (NumberField) =>
    whole(NumberField, {
      defaultValue: 1234.5,
      format: { style: "currency", currency: "USD" },
      locale: "en-US",
    }),
  ),
  make("a label and a scrub area", (NumberField) => (
    <NumberField.Root defaultValue={5}>
      <NumberField.ScrubArea>
        <label htmlFor="q">Quantity</label>
        <NumberField.ScrubAreaCursor />
      </NumberField.ScrubArea>
      <NumberField.Group>
        <NumberField.Decrement />
        <NumberField.Input id="q" />
        <NumberField.Increment />
      </NumberField.Group>
    </NumberField.Root>
  )),
  make("a vertical scrub area", (NumberField) => (
    <NumberField.Root defaultValue={5}>
      <NumberField.ScrubArea direction="vertical">
        <label htmlFor="v">Quantity</label>
      </NumberField.ScrubArea>
      <NumberField.Group>
        <NumberField.Input id="v" />
      </NumberField.Group>
    </NumberField.Root>
  )),
  make("steppers of your own", (NumberField) => (
    <NumberField.Root defaultValue={5}>
      <NumberField.Group>
        <NumberField.Decrement aria-label="Fewer">
          <b>-</b>
        </NumberField.Decrement>
        <NumberField.Input aria-label="Own" />
        <NumberField.Increment aria-label="More">
          <b>+</b>
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  )),
  make("a wide field", (NumberField) =>
    whole(NumberField, { style: { inlineSize: "100%" }, className: "w-full" }),
  ),
  make("a user's class", (NumberField) => (
    <NumberField.Root defaultValue={5} className="gap-0">
      <NumberField.Group className="rounded-none bg-green-500">
        <NumberField.Input aria-label="Own" className="text-center" />
      </NumberField.Group>
    </NumberField.Root>
  )),
  {
    name: "in a larger font",
    css: <div style={{ fontSize: 24 }}>{whole(CssField)}</div>,
    tw: <div style={{ fontSize: 24 }}>{whole(TwField)}</div>,
  },
];

const group = { target: "[data-slot=number-field-group]", props };
const stepper = { target: "[data-slot=number-field-increment]", props };
const input = { target: "[data-slot=number-field-input]", props };

describe("Number Field in Tailwind CSS v4 against number-field.css", () => {
  test("every size and state matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page, where the Decrement stays at the start", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("hover deepens the field's tint, and a stepper takes the hover material", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "disabled", "read only", "invalid"]) {
      await tw.states(cases, name, "hover", group);
    }
    for (const name of ["md", "at the max", "read only", "lg"]) {
      await tw.states(cases, name, "hover", stepper);
    }
  });

  test("a held stepper goes to the pressed material and in to 0.97", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "sm", "at the max", "read only"]) {
      await tw.states(cases, name, "held", stepper);
    }
  });

  test("keyboard focus on the input rings the field", { timeout: 60_000 }, async () => {
    for (const name of ["md", "invalid", "read only", "a label and a scrub area"]) {
      await tw.states(cases, name, "focus", input);
    }
  });

  test("forced colors match: the edge shows, focus is Highlight, a limit is gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
    await tw.states(cases, "md", "focus", input);
    await tw.states(cases, "md", "hover", stepper);
    await tw.states(cases, "md", "held", stepper);
  });

  test("reduced motion matches: a held stepper does not move, an invalid field blinks", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.states(cases, "md", "held", stepper);
    await tw.motion(cases);
  });

  test("more contrast brings the field's edge back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("transitions and animations are the same: the press, the shake", async () => {
    await tw.motion(cases);
  });

  test("a held stepper lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "md", "held", { ...stepper, props: motion, live: true });
  });

  test("the keyframes in tailwind.css are the ones in number-field.css", () => {
    const rules = (css: string): Record<string, string> => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css.replace(/@layer[^{;]*[{;]/g, ""));
      return Object.fromEntries(
        [...sheet.cssRules]
          .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule)
          .map((rule) => [rule.name, rule.cssText]),
      );
    };
    const mine = rules(numberFieldCss);
    expect(Object.keys(mine)).toEqual(["ow-number-field-shake", "ow-number-field-blink"]);
    for (const name of Object.keys(mine)) {
      expect(rules(bridge)[name]).toBe(mine[name]);
    }
  });
});

describe("a number field in Tailwind CSS v4 behaves as in CSS", () => {
  test("it steps, clamps, and dims a stepper at its limit", async () => {
    tw.load();
    const screen = await render(
      <TwField.Root defaultValue={9} max={10}>
        <TwField.Group />
      </TwField.Root>,
    );
    const q = (slot: string) =>
      screen.container.querySelector<HTMLElement>(
        `[data-slot=number-field-${slot}]`,
      ) as HTMLElement;
    await userEvent.click(q("increment"));
    expect((q("input") as HTMLInputElement).value).toBe("10");
    expect(q("increment").hasAttribute("data-disabled")).toBe(true);
    expect(getComputedStyle(q("increment")).opacity).toBe("0.45");
    expect(getComputedStyle(q("decrement")).opacity).toBe("1");
  });

  test("its scrub cursor, drawn while dragging, looks as the CSS flavor's", async () => {
    const seen: Record<string, string>[] = [];
    for (const kit of [CssField, TwField]) {
      tw.load();
      const screen = await render(
        <kit.Root defaultValue={0}>
          <kit.ScrubArea style={{ padding: 8 }}>
            <label htmlFor="x">Qty</label>
            <kit.ScrubAreaCursor />
          </kit.ScrubArea>
          <kit.Group />
        </kit.Root>,
      );
      onTestFinished(() => commands.mouse("up"));
      const area = screen.container.querySelector(
        "[data-slot=number-field-scrub-area]",
      ) as HTMLElement;
      await userEvent.hover(area);
      await commands.mouse("down");
      await userEvent.hover(area, { position: { x: 30, y: 6 }, force: true });
      await userEvent.hover(area, { position: { x: 60, y: 6 }, force: true });
      await expect
        .poll(() => document.querySelector("[data-slot=number-field-scrub-area-cursor]"))
        .not.toBeNull();
      const cursor = document.querySelector(
        "[data-slot=number-field-scrub-area-cursor]",
      ) as HTMLElement;
      const style = getComputedStyle(cursor);
      const halo = getComputedStyle(cursor.querySelector("path") as SVGPathElement);
      seen.push({
        position: style.position,
        width: style.width,
        height: style.height,
        color: style.color,
        pointerEvents: style.pointerEvents,
        haloStroke: halo.stroke,
        paths: String(cursor.querySelectorAll("path").length),
      });
      await commands.mouse("up");
      await expect
        .poll(() => document.querySelector("[data-slot=number-field-scrub-area-cursor]"))
        .toBeNull();
    }
    expect(seen[1]).toEqual(seen[0]);
  });
});

describe("className on Number Field in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwField.Root defaultValue={5} className="gap-0">
        <TwField.Group className={OVERRIDES}>
          <TwField.Input aria-label="A" className="bg-green-500" />
        </TwField.Group>
      </TwField.Root>,
    );
    const g = screen.container.querySelector("[data-slot=number-field-group]");
    const i = screen.container.querySelector("[data-slot=number-field-input]");
    if (!g || !i) throw new Error("not rendered");
    expectStyles(g, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      height: "80px",
      opacity: "0.5",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
    expectStyles(i, { backgroundColor: "oklch(0.723 0.219 149.579)" });
  });

  test("numberFieldVariants() output merges with a className, the user's last", () => {
    const merged = cn(numberFieldVariants({ size: "sm" }), "text-lg gap-0");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("gap-[0.5em]");
  });
});
