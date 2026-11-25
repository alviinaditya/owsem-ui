import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Progress as CssProgress } from "../src/components/progress/index";
import progressCss from "../src/components/progress/progress.css?raw";
import { cn } from "../src/tailwind/lib/cn";
import { Progress as TwProgress } from "../src/tailwind/progress/index";
import {
  type ProgressSize,
  progressSlots,
  progressVariants,
} from "../src/tailwind/progress/progress-variants";
import bridge from "../src/tailwind.css?raw";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// Progress in Tailwind CSS v4 (src/tailwind/progress) against progress.css.

const SIZES: ProgressSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 h-10 text-sm translate-x-4 opacity-50 outline-red-500 mb-0 font-normal";

const tw = tailwindParity(
  classNames(
    ...Object.values(progressSlots),
    ...SIZES.map((size) => progressVariants({ size })),
    OVERRIDES,
    "bg-green-500 rounded-none",
  ),
);

// What a bar draws that PROPS leaves out: the fill's translate and the grid it sits in.
const props = [
  ...PROPS,
  "translate",
  "gridRowEnd",
  "gridColumnEnd",
  "gridTemplateColumns",
  "justifySelf",
  "fontVariantNumeric",
  "printColorAdjust",
];

type Kit = typeof CssProgress;
const make = (name: string, ui: (Progress: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssProgress),
  tw: ui(TwProgress),
});

const whole = (Progress: Kit, value: number | null, size?: ProgressSize) => (
  <div style={{ inlineSize: 280 }}>
    <Progress.Root value={value} size={size}>
      <Progress.Label>Uploading</Progress.Label>
      <Progress.Value />
      <Progress.Track />
    </Progress.Root>
  </div>
);

const cases: Case[] = [
  ...SIZES.map((size) => make(size, (Progress) => whole(Progress, 40, size))),
  make("empty", (Progress) => whole(Progress, 0)),
  make("full", (Progress) => whole(Progress, 100)),
  make("indeterminate", (Progress) => whole(Progress, null)),
  make("indeterminate, small", (Progress) => whole(Progress, null, "sm")),
  make("a bare bar", (Progress) => (
    <div style={{ inlineSize: 280 }}>
      <Progress.Root value={65} aria-label="Plain" />
    </div>
  )),
  make("a bare indeterminate bar", (Progress) => (
    <div style={{ inlineSize: 280 }}>
      <Progress.Root value={null} aria-label="Plain" />
    </div>
  )),
  make("a label and a value, no track", (Progress) => (
    <div style={{ inlineSize: 280 }}>
      <Progress.Root value={40}>
        <Progress.Label>Name</Progress.Label>
        <Progress.Value />
      </Progress.Root>
    </div>
  )),
  make("only a value", (Progress) => (
    <div style={{ inlineSize: 280 }}>
      <Progress.Root value={25} aria-label="Plain">
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>
    </div>
  )),
  make("only a label", (Progress) => (
    <div style={{ inlineSize: 280 }}>
      <Progress.Root value={25}>
        <Progress.Label>Name</Progress.Label>
        <Progress.Track />
      </Progress.Root>
    </div>
  )),
  make("a scale", (Progress) => (
    <div style={{ inlineSize: 280 }}>
      <Progress.Root value={30} min={10} max={50} aria-label="Scale">
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>
    </div>
  )),
  make("a format", (Progress) => (
    <div style={{ inlineSize: 280 }}>
      <Progress.Root value={3} max={8} format={{ style: "unit", unit: "megabyte" }} aria-label="U">
        <Progress.Label>Upload</Progress.Label>
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>
    </div>
  )),
  make("a long label", (Progress) => (
    <div style={{ inlineSize: 180 }}>
      <Progress.Root value={50}>
        <Progress.Label>A long label that has to wrap before it reaches the value</Progress.Label>
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>
    </div>
  )),
  make("in a larger font", (Progress) => (
    <div style={{ inlineSize: 280, fontSize: 24 }}>
      <Progress.Root value={50}>
        <Progress.Label>Big</Progress.Label>
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>
    </div>
  )),
  make("an indicator of your own", (Progress) => (
    <div style={{ inlineSize: 280 }}>
      <Progress.Root value={50} aria-label="Own">
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>
    </div>
  )),
];

describe("Progress in Tailwind CSS v4 against progress.css", () => {
  test("every size and state matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page, where the fill grows from the right", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("forced colors match: the track's edge shows and the fill is Highlight", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
  });

  test("reduced motion matches: no transition, and the indeterminate segment sits still", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.motion(cases);
  });

  test("more contrast brings the track's edge back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("transitions and animations are the same: the fill's translate, and the travel", async () => {
    await tw.motion(cases);
  });

  test("the keyframes in tailwind.css are the ones in progress.css", () => {
    const rules = (css: string): Record<string, string> => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css.replace(/@layer[^{;]*[{;]/g, ""));
      return Object.fromEntries(
        [...sheet.cssRules]
          .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule)
          .map((rule) => [rule.name, rule.cssText]),
      );
    };
    const mine = rules(progressCss);
    expect(Object.keys(mine)).toEqual(["ow-progress-travel"]);
    expect(rules(bridge)["ow-progress-travel"]).toBe(mine["ow-progress-travel"]);
  });
});

describe("a progress bar in Tailwind CSS v4 moves", () => {
  test("a change of value moves the fill on a transition of translate", async () => {
    tw.load();
    function Bar({ value }: { value: number }) {
      return (
        <div style={{ inlineSize: 200 }}>
          <TwProgress.Root value={value} aria-label="A" />
        </div>
      );
    }
    const screen = await render(<Bar value={10} />);
    const fill = screen.container.querySelector<HTMLElement>("[data-slot=progress-indicator]");
    if (!fill) throw new Error("not rendered");
    expect(fill.getAnimations()).toEqual([]);
    await screen.rerender(<Bar value={90} />);
    await expect
      .poll(() => fill.getAnimations().map((a) => (a as CSSTransition).transitionProperty))
      .toContain("translate");
  });

  test("an indeterminate segment runs ow-progress-travel and stops when a value is set", async () => {
    tw.load();
    function Bar({ value }: { value: number | null }) {
      return <TwProgress.Root value={value} aria-label="A" />;
    }
    const screen = await render(<Bar value={null} />);
    const fill = screen.container.querySelector<HTMLElement>("[data-slot=progress-indicator]");
    if (!fill) throw new Error("not rendered");
    expect(getComputedStyle(fill).animationName).toBe("ow-progress-travel");
    expect(getComputedStyle(fill).animationIterationCount).toBe("infinite");
    await screen.rerender(<Bar value={30} />);
    await expect.poll(() => getComputedStyle(fill).animationName).toBe("none");
  });
});

describe("className on Progress in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwProgress.Root value={40} aria-label="A">
        <TwProgress.Track className={OVERRIDES}>
          <TwProgress.Indicator className="bg-green-500 rounded-none" />
        </TwProgress.Track>
      </TwProgress.Root>,
    );
    const track = screen.container.querySelector("[data-slot=progress-track]");
    const fill = screen.container.querySelector("[data-slot=progress-indicator]");
    if (!track || !fill) throw new Error("not rendered");
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
  });

  test("progressVariants() output merges with a className, the user's last", () => {
    const merged = cn(progressVariants({ size: "sm" }), "text-lg gap-x-0");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("gap-x-[12px]");
  });
});
