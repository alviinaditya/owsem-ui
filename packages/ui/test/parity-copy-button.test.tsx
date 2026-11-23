import { DirectionProvider } from "@base-ui/react/direction-provider";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { CopyButton as CssCopyButton } from "../src/components/copy-button/copy-button";
import copyButtonCss from "../src/components/copy-button/copy-button.css?raw";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { CopyButton as TwCopyButton } from "../src/tailwind/copy-button/copy-button";
import { copyButtonSlots } from "../src/tailwind/copy-button/copy-button-variants";
import { iconMorphSlots } from "../src/tailwind/icon-morph/icon-morph-variants";
import { cn } from "../src/tailwind/lib/cn";
import { tooltipSlots } from "../src/tailwind/tooltip/tooltip-variants";
import bridge from "../src/tailwind.css?raw";
import {
  BUTTON_RIPPLE,
  type Case,
  classNames,
  expectStyles,
  frame,
  MOTION,
  measureFrom,
  type Part,
  PROPS,
  setMedia,
  tailwindParity,
} from "./parity";

// Copy Button in Tailwind CSS v4 (src/tailwind/copy-button) against copy-button.css. It draws the
// Tailwind Button, Icon Morph, and Tooltip.

const OVERRIDES = "bg-red-500 text-red-500 px-8 gap-0 opacity-100 [--_duration:1s]";

const tw = tailwindParity(
  classNames(
    ...Object.values(copyButtonSlots),
    ...Object.values(iconMorphSlots),
    ...Object.values(tooltipSlots),
    ...Object.values(buttonSlots),
    ...(["primary", "secondary", "outline", "ghost", "link", "destructive"] as const).flatMap(
      (variant) => (["sm", "md", "lg"] as const).map((size) => buttonVariants({ variant, size })),
    ),
    OVERRIDES,
  ),
  [
    BUTTON_RIPPLE,
    {
      what: /^(top|right|bottom|left)$/,
      part: /button-ripple/,
      within: 0.02,
      reason:
        "The ripple is set from the pointer's fractional position, and layout rounds its edges to 1/64 px (0.0156), so a side can differ by that much.",
    },
  ],
);

// What Copy Button draws that PROPS leaves out: the icons' strokes, the cells, and the check.
const props = [
  ...PROPS,
  "visibility",
  "justifyItems",
  "gridTemplateColumns",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
  "strokeDasharray",
  "strokeDashoffset",
  "clipPath",
  "filter",
  "translate",
];

/** Replaces the Clipboard API for one test. */
function clipboard(): void {
  const own = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn(() => Promise.resolve()) },
  });
  onTestFinished(() => {
    if (own) Object.defineProperty(navigator, "clipboard", own);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  });
}

const BUTTON = "[data-slot=copy-button]";

type Props = Partial<Parameters<typeof CssCopyButton>[0]>;
// In a box that is the status region's containing block, so it is measured too.
const make = (name: string, props: Props = {}): Case => ({
  name,
  css: (
    <div style={{ position: "relative" }}>
      <CssCopyButton value="pnpm add owsem-ui" timeout={60_000} {...props} />
    </div>
  ),
  tw: (
    <div style={{ position: "relative" }}>
      <TwCopyButton value="pnpm add owsem-ui" timeout={60_000} {...props} />
    </div>
  ),
});

const cases: Case[] = [
  make("icon only"),
  make("copied icon only"),
  make("label", { showLabel: true }),
  make("copied label", { showLabel: true }),
  make("primary label", { showLabel: true, variant: "primary" }),
  make("copied primary label", { showLabel: true, variant: "primary" }),
  make("outline", { showLabel: true, variant: "outline", size: "sm" }),
  make("large", { showLabel: true, size: "lg", variant: "secondary" }),
  make("large icon only", { size: "lg" }),
  make("labels set", { showLabel: true, labels: { copy: "Salin", copied: "Tersalin" } }),
  make("a duration", { showLabel: true, duration: "300ms" }),
  make("copied with a duration", { duration: "300ms" }),
  make("disabled", { disabled: true, showLabel: true }),
  make("a class", { className: "ow-extra", showLabel: true }),
];

/** Clicks the buttons of the cases that start with "copied", and waits until they show it. */
const copy = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  if (!name.startsWith("copied")) return;
  const button = side.querySelector<HTMLElement>("[data-slot=copy-button]");
  if (!button) throw new Error("no button");
  button.click();
  await vi.waitFor(() => expect(button.hasAttribute("data-copied")).toBe(true));
  // The leaving icon goes and the check is drawn once the transitions and the animation end.
  await vi.waitFor(() => expect(side.getAnimations({ subtree: true })).toHaveLength(0), {
    timeout: 5000,
  });
  await frame();
};

describe("Copy Button in Tailwind CSS v4 against copy-button.css", () => {
  test("every size, variant, and label, copied or not, matches in the light theme", async () => {
    clipboard();
    await tw.parity(cases, { props, prepare: copy });
  });

  test("and in the dark theme", async () => {
    clipboard();
    await tw.parity(cases, { theme: "dark", props, prepare: copy });
  });

  test("and in a right-to-left page", async () => {
    clipboard();
    await tw.parity(cases, { dir: "rtl", props, prepare: copy });
  });

  test("hover, a held press, and keyboard focus match", { timeout: 60_000 }, async () => {
    clipboard();
    for (const name of ["label", "primary label", "icon only"]) {
      await tw.states(cases, name, "hover", { props, target: BUTTON });
      await tw.states(cases, name, "held", { props, target: BUTTON });
      await tw.states(cases, name, "focus", { props, target: BUTTON });
    }
  });

  test("forced colors match", { timeout: 60_000 }, async () => {
    clipboard();
    await setMedia("forced-colors");
    await tw.parity(cases, { props, prepare: copy });
    await tw.states(cases, "label", "focus", { props, target: BUTTON });
  });

  test("reduced motion matches: the check is just there", { timeout: 60_000 }, async () => {
    clipboard();
    await setMedia("reduced-motion");
    await tw.parity(cases, { props, prepare: copy });
  });

  test("reduced motion: no check animation", async () => {
    clipboard();
    await setMedia("reduced-motion");
    await tw.motion(cases, { prepare: copy });
  });

  test("more contrast changes nothing", async () => {
    clipboard();
    await setMedia("more-contrast");
    await tw.parity(cases, { props, prepare: copy });
  });

  test("transitions and animations are the same: durations, easings, names", async () => {
    clipboard();
    await tw.motion(cases, { prepare: copy });
  });

  test("the check draws in with ow-copy-button-draw", async () => {
    clipboard();
    tw.load();
    const screen = await render(<TwCopyButton value="x" timeout={60_000} showLabel />);
    const button = screen.container.querySelector<HTMLElement>("[data-slot=copy-button]");
    if (!button) throw new Error("no button");
    button.click();
    await vi.waitFor(() => expect(button.hasAttribute("data-copied")).toBe(true));
    const path = button.querySelector("svg > path[pathLength]");
    if (!path) throw new Error("no check");
    const style = getComputedStyle(path);
    expect(style.animationName).toBe("ow-copy-button-draw");
    expect(style.animationDuration).not.toBe("0s");
  });

  test("the keyframes in tailwind.css are the ones in copy-button.css", () => {
    const rules = (css: string): Record<string, string> => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css.replace(/@layer[^{;]*[{;]/g, ""));
      return Object.fromEntries(
        [...sheet.cssRules]
          .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule)
          .map((rule) => [rule.name, rule.cssText]),
      );
    };
    const mine = rules(copyButtonCss);
    expect(Object.keys(mine)).toEqual(["ow-copy-button-draw"]);
    expect(rules(bridge)["ow-copy-button-draw"]).toBe(mine["ow-copy-button-draw"]);
  });
});

/** The Tooltip of one flavor, open on its button; it renders in a portal, so it is measured from there. */
async function tip(
  Button: typeof CssCopyButton,
  dir: "ltr" | "rtl",
  copied: boolean,
  props: readonly string[],
): Promise<Part[]> {
  clipboard();
  tw.load();
  const screen = await render(
    <DirectionProvider direction={dir}>
      <div dir={dir} style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Button value="x" timeout={60_000} />
      </div>
    </DirectionProvider>,
  );
  const button = screen.container.querySelector<HTMLElement>("[data-slot=copy-button]");
  if (!button) throw new Error("no button");
  if (copied) button.click();
  else await userEvent.hover(button);
  await vi.waitFor(() =>
    expect(document.querySelector("[data-slot=tooltip-popup]")).not.toBeNull(),
  );
  // Settled: nothing is entering or leaving any more, and the width has eased to the word.
  await vi.waitFor(() =>
    expect(document.querySelector("[data-starting-style], [data-ending-style]")).toBeNull(),
  );
  await new Promise((resolve) => setTimeout(resolve, 400));
  await frame();
  const positioner = document.querySelector("[data-slot=tooltip-positioner]");
  if (!positioner) throw new Error("no popup");
  const parts = measureFrom(button, positioner, props);
  await userEvent.unhover(button);
  await screen.unmount();
  return parts;
}

describe("the Tooltip of Copy Button in Tailwind CSS v4", () => {
  for (const dir of ["ltr", "rtl"] as const) {
    for (const copied of [false, true]) {
      test(`says ${copied ? "copied" : "copy"} the same way, ${dir}`, async () => {
        const state = `${copied ? "copied" : "copy"} ${dir}`;
        const a = await tip(CssCopyButton, dir, copied, props);
        const b = await tip(TwCopyButton, dir, copied, props);
        tw.expectParts(state, a, b);
        const motion = await tip(CssCopyButton, dir, copied, MOTION);
        tw.expectParts(`${state} motion`, motion, await tip(TwCopyButton, dir, copied, MOTION));
      });
    }
  }

  for (const media of ["reduced-motion", "forced-colors", "more-contrast"] as const) {
    test(`says copy and copied the same way with ${media}`, async () => {
      await setMedia(media);
      for (const copied of [false, true]) {
        const state = `${media} ${copied ? "copied" : "copy"}`;
        const a = await tip(CssCopyButton, "ltr", copied, [...props, ...MOTION]);
        const b = await tip(TwCopyButton, "ltr", copied, [...props, ...MOTION]);
        tw.expectParts(state, a, b);
      }
    });
  }
});

describe("className on Copy Button in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwCopyButton
        value="x"
        showLabel
        className={OVERRIDES}
        style={{ "--_duration": "2s" } as never}
      />,
    );
    const button = screen.container.querySelector("[data-slot=copy-button]");
    if (!button) throw new Error("not rendered");
    expectStyles(button, {
      backgroundColor: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      columnGap: "0px",
      opacity: "1",
    });
  });

  test("the slots merge with a className, the user's last", () => {
    const merged = cn(copyButtonSlots.tip, "grid-cols-2 justify-items-start");
    expect(merged).toContain("grid-cols-2");
    expect(merged).toContain("justify-items-start");
    expect(merged).not.toContain("grid-cols-[minmax(0,1fr)]");
    expect(merged).not.toContain("justify-items-center");
  });
});
