import { Field } from "@base-ui/react/field";
import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Slider as CssSlider } from "../src/components/slider/index";
import { cn } from "../src/tailwind/lib/cn";
import { Slider as TwSlider } from "../src/tailwind/slider/index";
import {
  type SliderSize,
  sliderSlots,
  sliderVariants,
} from "../src/tailwind/slider/slider-variants";
import {
  type Accepted,
  type Case,
  classNames,
  expectStyles,
  PROPS,
  setMedia,
  tailwindParity,
} from "./parity";

// Slider in Tailwind CSS v4 (src/tailwind/slider) against slider.css.

const SIZES: SliderSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 h-10 text-sm opacity-50 outline-red-500 mb-0 font-normal";

const HIDDEN_INPUT: Accepted = {
  what: /^box x$/,
  part: /^\d+ input$/,
  reason:
    "Base UI's range input is position: fixed with no offsets, so its box is measured from the viewport, and the two sides stand 360px apart in it.",
};

const tw = tailwindParity(
  classNames(
    ...Object.values(sliderSlots),
    ...SIZES.map((size) => sliderVariants({ size })),
    OVERRIDES,
    "bg-green-500 rounded-none",
  ),
  [HIDDEN_INPUT],
);

// What a slider draws that PROPS leaves out.
const props = [
  ...PROPS,
  "translate",
  "scale",
  "gridRowEnd",
  "gridColumnEnd",
  "gridTemplateColumns",
  "gridTemplateRows",
  "justifyItems",
  "alignSelf",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "fontVariantNumeric",
  "printColorAdjust",
  "touchAction",
  "userSelect",
  "webkitTapHighlightColor",
  "insetInlineStart",
  "bottom",
  "boxSizing",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "borderTopWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopColor",
  "borderLeftColor",
  "borderTopStyle",
  "borderLeftStyle",
];

type Kit = typeof CssSlider;
const make = (name: string, ui: (Slider: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssSlider),
  tw: ui(TwSlider),
});

const wide = (ui: ReactElement, width = 280) => <div style={{ inlineSize: width }}>{ui}</div>;

const whole = (Slider: Kit, size?: SliderSize, value: number | number[] = 40) =>
  wide(
    <Slider.Root defaultValue={value} size={size}>
      <Slider.Label>Volume</Slider.Label>
      <Slider.Value />
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          {Array.isArray(value) ? (
            value.map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed list
              <Slider.Thumb key={index} index={index} aria-label={`T${index}`} />
            ))
          ) : (
            <Slider.Thumb />
          )}
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>,
  );

const cases: Case[] = [
  ...SIZES.map((size) => make(size, (Slider) => whole(Slider, size))),
  make("a range", (Slider) => whole(Slider, "md", [20, 70])),
  make("a range, large", (Slider) => whole(Slider, "lg", [10, 90])),
  make("at the start", (Slider) => whole(Slider, "md", 0)),
  make("at the end", (Slider) => whole(Slider, "md", 100)),
  make("a bare slider", (Slider) => wide(<Slider.Root defaultValue={40} aria-label="Plain" />)),
  make("a bare range", (Slider) =>
    wide(<Slider.Root defaultValue={[20, 60]} aria-label="Plain" size="sm" />),
  ),
  make("only a label", (Slider) =>
    wide(
      <Slider.Root defaultValue={40}>
        <Slider.Label>Name</Slider.Label>
        <Slider.Control />
      </Slider.Root>,
    ),
  ),
  make("only a value", (Slider) =>
    wide(
      <Slider.Root defaultValue={40} aria-label="Plain">
        <Slider.Value />
        <Slider.Control />
      </Slider.Root>,
    ),
  ),
  make("disabled", (Slider) => wide(<Slider.Root defaultValue={40} disabled aria-label="Off" />)),
  make("disabled range", (Slider) =>
    wide(<Slider.Root defaultValue={[20, 60]} disabled aria-label="Off" />),
  ),
  make("invalid", (Slider) =>
    wide(
      <Field.Root invalid>
        <Slider.Root defaultValue={40} aria-label="Bad" />
      </Field.Root>,
    ),
  ),
  make("upright", (Slider) => (
    <Slider.Root orientation="vertical" defaultValue={40} aria-label="Up" />
  )),
  make("upright with a label and a value", (Slider) => (
    <Slider.Root orientation="vertical" defaultValue={40} size="lg">
      <Slider.Label>Vol</Slider.Label>
      <Slider.Value />
      <Slider.Control />
    </Slider.Root>
  )),
  make("upright range, small", (Slider) => (
    <Slider.Root orientation="vertical" defaultValue={[20, 80]} size="sm" aria-label="Up" />
  )),
  make("a format", (Slider) =>
    wide(
      <Slider.Root defaultValue={0.5} min={0} max={1} step={0.01} format={{ style: "percent" }}>
        <Slider.Label>Opacity</Slider.Label>
        <Slider.Value />
        <Slider.Control />
      </Slider.Root>,
    ),
  ),
  make("a thumb of your own", (Slider) =>
    wide(
      <Slider.Root defaultValue={40} aria-label="Own">
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb>
              <b>i</b>
            </Slider.Thumb>
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>,
    ),
  ),
  make("a long label", (Slider) =>
    wide(
      <Slider.Root defaultValue={50}>
        <Slider.Label>A long label that has to wrap before it reaches the value</Slider.Label>
        <Slider.Value />
        <Slider.Control />
      </Slider.Root>,
      180,
    ),
  ),
  make("in a larger font", (Slider) => (
    <div style={{ inlineSize: 280, fontSize: 24 }}>
      <Slider.Root defaultValue={50}>
        <Slider.Label>Big</Slider.Label>
        <Slider.Value />
        <Slider.Control />
      </Slider.Root>
    </div>
  )),
];

const thumb = { target: "[data-slot=slider-thumb]", props };
const focus = { target: "[data-slot=slider-thumb] input", props };

describe("Slider in Tailwind CSS v4 against slider.css", () => {
  test("every size and state matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page, where the fill grows from the right", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("hover grows the thumb, and a held thumb grows more", { timeout: 60_000 }, async () => {
    for (const name of ["md", "sm", "disabled", "a range"]) {
      await tw.states(cases, name, "hover", thumb);
    }
    for (const name of ["md", "lg", "a range"]) {
      await tw.states(cases, name, "held", thumb);
    }
  });

  test("keyboard focus on the thumb draws the ring", { timeout: 60_000 }, async () => {
    for (const name of ["md", "lg", "invalid", "a range"]) {
      await tw.states(cases, name, "focus", focus);
    }
  });

  test("forced colors match: the track's edge shows, the fill is Highlight, the key is bordered", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
    await tw.states(cases, "md", "focus", focus);
  });

  test("reduced motion matches: the thumb does not grow", { timeout: 60_000 }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.states(cases, "md", "hover", thumb);
    await tw.motion(cases);
  });

  test("more contrast brings the track's edge and the thumb's back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("transitions are the same: the thumb's scale, and nothing of its place", async () => {
    await tw.motion(cases);
  });

  test("a held thumb grows within 120 ms and lets go on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "md", "held", { ...thumb, props: motion, live: true });
    await tw.states(cases, "md", "hover", { ...thumb, props: motion, live: true });
  });
});

describe("a slider in Tailwind CSS v4 behaves as in CSS", () => {
  test("it steps with the keyboard and the fill follows", async () => {
    tw.load();
    const screen = await render(wide(<TwSlider.Root defaultValue={40} aria-label="A" />));
    const input = screen.container.querySelector("input") as HTMLInputElement;
    const fill = screen.container.querySelector("[data-slot=slider-indicator]") as HTMLElement;
    input.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(input.value).toBe("42");
    expect(fill.style.width).toBe("42%");
  });
});

describe("className on Slider in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwSlider.Root defaultValue={40} aria-label="A">
        <TwSlider.Control>
          <TwSlider.Track className={OVERRIDES}>
            <TwSlider.Indicator className="bg-green-500 rounded-none" />
            <TwSlider.Thumb className="bg-green-500 rounded-none" aria-label="A" />
          </TwSlider.Track>
        </TwSlider.Control>
      </TwSlider.Root>,
    );
    const track = screen.container.querySelector("[data-slot=slider-track]");
    const fill = screen.container.querySelector("[data-slot=slider-indicator]");
    const key = screen.container.querySelector("[data-slot=slider-thumb]");
    if (!track || !fill || !key) throw new Error("not rendered");
    expectStyles(track, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      height: "40px",
      opacity: "0.5",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
    expectStyles(fill, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.723 0.219 149.579)",
    });
    expectStyles(key, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.723 0.219 149.579)",
    });
  });

  test("sliderVariants() output merges with a className, the user's last", () => {
    const merged = cn(sliderVariants({ size: "sm" }), "text-lg gap-x-0");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("gap-x-[12px]");
  });
});
