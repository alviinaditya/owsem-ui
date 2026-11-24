import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { ReactElement } from "react";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  ColorPicker as CssPicker,
  ColorPickerPopover as CssPopover,
} from "../src/components/color-picker/index";
import {
  type ColorPickerSize,
  colorPickerSlots,
  colorPickerTriggerVariants,
} from "../src/tailwind/color-picker/color-picker-variants";
import {
  ColorPicker as TwPicker,
  ColorPickerPopover as TwPopover,
} from "../src/tailwind/color-picker/index";
import { cn } from "../src/tailwind/lib/cn";
import {
  type Accepted,
  type Case,
  classNames,
  expectStyles,
  frame,
  measureFrom,
  PROPS,
  setMedia,
  tailwindParity,
} from "./parity";

// Color Picker in Tailwind CSS v4 (src/tailwind/color-picker, with Popover's helpers) against
// color-picker.css.

const SIZES: ColorPickerSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm opacity-100 p-8 w-20 h-24 gap-0 shadow-none outline-red-500 focus-visible:outline-red-500 data-disabled:opacity-100";

const candidates = classNames(
  ...Object.values(colorPickerSlots),
  ...SIZES.flatMap((size) => [
    colorPickerTriggerVariants({ size }),
    colorPickerTriggerVariants({ size, variant: "swatch" }),
  ]),
  OVERRIDES,
  "data-alpha:bg-red-500 hover:bg-red-500 focus-visible:bg-red-500 size-16 p-2",
);
// Base UI's range input of a thumb is fixed with no offsets, so it sits in each side's own box.
const HIDDEN_RANGE: Accepted = {
  what: /^box [xy]$/,
  part: / input$/,
  reason: "A slider's hidden input is fixed with no offsets, so it sits in the viewport.",
};

// The popup lands where its trigger is, and each flavor's trigger is in its own side.
const PLACED: Accepted[] = [
  {
    what: /^transform$/,
    part: /color-picker-positioner/,
    reason: "Floating UI translates the positioner by the trigger's place in the page.",
  },
  {
    what: /^box [xy]$/,
    part: / span$/,
    reason: "Base UI's focus guards are fixed with no offsets, so they sit in the viewport.",
  },
];

const tw = tailwindParity(candidates, [HIDDEN_RANGE, ...PLACED]);
// A part in a state is measured while it moves, so its box says nothing; the motion tests read the
// transitions.
const twMotion = tailwindParity(candidates, [
  HIDDEN_RANGE,
  ...PLACED,
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

// What these parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "translate",
  "backgroundSize",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
  "fontVariantNumeric",
  "textAlign",
  "aspectRatio",
  "gridTemplateColumns",
  "forcedColorAdjust",
  "visibility",
  "flexBasis",
];

// The screen color picker is there where the browser has the EyeDropper API; Firefox has none.
let stubbed = false;
beforeAll(() => {
  if ("EyeDropper" in window) return;
  stubbed = true;
  Object.defineProperty(window, "EyeDropper", {
    configurable: true,
    value: class {
      open = () => Promise.resolve({ sRGBHex: "#ff0000" });
    },
  });
});
afterAll(() => {
  if (stubbed) Reflect.deleteProperty(window, "EyeDropper");
});

interface Kit {
  Picker: typeof CssPicker;
  Popover: typeof CssPopover;
}
const css: Kit = { Picker: CssPicker, Popover: CssPopover };
const twind: Kit = { Picker: TwPicker, Popover: TwPopover };

const make = (name: string, ui: (kit: Kit) => ReactElement): Case => ({
  name,
  css: ui(css),
  tw: ui(twind),
});

const SWATCHES = [
  "#ffffff",
  "#000000",
  "#ff0000",
  "rgb(255 0 0 / 0.5)",
  { color: "#ffee99", label: "Butter" },
  "#336699",
];

const pickers: Case[] = [
  make("default", ({ Picker }) => <Picker />),
  make("light color", ({ Picker }) => <Picker defaultValue="#ffffff" />),
  make("dark color", ({ Picker }) => <Picker defaultValue="#000000" />),
  make("translucent", ({ Picker }) => <Picker defaultValue="#ff000080" />),
  make("no alpha", ({ Picker }) => <Picker alpha={false} />),
  make("no inputs", ({ Picker }) => <Picker inputs={false} />),
  make("no swatches", ({ Picker }) => <Picker swatches={false} />),
  make("no eye dropper", ({ Picker }) => <Picker eyeDropper={false} />),
  make("bare", ({ Picker }) => (
    <Picker alpha={false} inputs={false} swatches={false} eyeDropper={false} />
  )),
  make("disabled", ({ Picker }) => <Picker disabled />),
  make("rgb fields", ({ Picker }) => <Picker format="rgb" />),
  make("hsl fields", ({ Picker }) => <Picker format="hsl" />),
  make("swatches with a translucent and a light one", ({ Picker }) => (
    <Picker swatches={SWATCHES} defaultValue="#ffffff" />
  )),
  make("a selected translucent swatch", ({ Picker }) => (
    <Picker swatches={SWATCHES} defaultValue="rgb(255 0 0 / 0.5)" />
  )),
  make("swatches without alpha", ({ Picker }) => (
    <Picker swatches={SWATCHES} alpha={false} defaultValue="#ff0000" />
  )),
  make("a wider picker", ({ Picker }) => <Picker style={{ inlineSize: 320 }} />),
  make("a narrow picker", ({ Picker }) => <Picker style={{ inlineSize: 170 }} />),
  make("in a narrow box", ({ Picker }) => (
    <div style={{ inlineSize: 200 }}>
      <Picker />
    </div>
  )),
];

const triggers: Case[] = [
  ...SIZES.flatMap((size) => [
    make(`${size} field`, ({ Popover }) => <Popover size={size} />),
    make(`${size} swatch`, ({ Popover }) => (
      <Popover size={size} variant="swatch" aria-label="Color" />
    )),
  ]),
  make("default trigger", ({ Popover }) => <Popover />),
  make("translucent field", ({ Popover }) => <Popover defaultValue="#ff000080" />),
  make("translucent swatch", ({ Popover }) => (
    <Popover variant="swatch" defaultValue="#ff000080" aria-label="Color" />
  )),
  make("translucent without alpha", ({ Popover }) => (
    <Popover alpha={false} defaultValue="#ff000080" />
  )),
  make("rgb value", ({ Popover }) => <Popover format="rgb" />),
  make("a token as the color", ({ Popover }) => <Popover defaultValue="var(--ow-accent)" />),
  make("disabled field", ({ Popover }) => <Popover disabled />),
  make("disabled swatch", ({ Popover }) => (
    <Popover disabled variant="swatch" aria-label="Color" />
  )),
  make("custom children", ({ Popover }) => <Popover>Pick</Popover>),
  make("size from an outer part", ({ Popover }) => <Popover data-size="lg" />),
  make("in a larger font", ({ Popover }) => (
    <div style={{ fontSize: 24 }}>
      <Popover />
    </div>
  )),
];

const all = [...pickers, ...triggers];

const slot = (name: string) => `[data-slot=color-picker-${name}]`;
const root = { props };

describe("Color Picker in Tailwind CSS v4 against color-picker.css", () => {
  test("every prop of the picker matches in the light theme", async () => {
    await tw.parity(pickers, root);
  });

  test("and in the dark theme", async () => {
    await tw.parity(pickers, { ...root, theme: "dark" });
  });

  test("and in a right-to-left page, where the gradients and thumbs turn", async () => {
    await tw.parity(pickers, { ...root, dir: "rtl" });
  });

  test("every trigger size, variant, and state matches in the light theme", async () => {
    await tw.parity(triggers, root);
  });

  test("and in the dark theme", async () => {
    await tw.parity(triggers, { ...root, theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(triggers, { ...root, dir: "rtl" });
  });

  test("a real hover steps up the keys and the fields", { timeout: 60_000 }, async () => {
    await tw.states(pickers, "default", "hover", { ...root, target: slot("tool") });
    await tw.states(pickers, "default", "hover", { ...root, target: slot("format") });
    await tw.states(pickers, "default", "hover", { ...root, target: slot("input") });
    await tw.states(pickers, "disabled", "hover", { ...root, target: slot("tool") });
    await tw.states(pickers, "disabled", "hover", { ...root, target: slot("input") });
    await tw.states(pickers, "default", "hover", { ...root, target: slot("swatch") });
    await tw.states(triggers, "md field", "hover", root);
  });

  test("a held press compacts a key, a swatch, and a trigger", { timeout: 60_000 }, async () => {
    await tw.states(pickers, "default", "held", { ...root, target: slot("tool") });
    await tw.states(pickers, "default", "held", { ...root, target: slot("format") });
    await tw.states(pickers, "default", "held", { ...root, target: slot("swatch") });
    await tw.states(pickers, "swatches with a translucent and a light one", "held", {
      ...root,
      target: slot("swatch"),
    });
    await tw.states(triggers, "md field", "held", root);
    await tw.states(triggers, "md swatch", "held", root);
    await tw.states(triggers, "lg field", "held", root);
  });

  test("a held press on the area and on a slider compacts the thumb", {
    timeout: 60_000,
  }, async () => {
    await tw.states(pickers, "default", "held", { ...root, target: slot("area") });
    await tw.states(pickers, "default", "held", {
      ...root,
      target: `[data-channel=hue] ${slot("thumb")}`,
    });
    await tw.states(pickers, "default", "held", {
      ...root,
      target: `[data-channel=alpha] ${slot("thumb")}`,
    });
  });

  test("keyboard focus draws the ring on every control", { timeout: 90_000 }, async () => {
    for (const target of [
      slot("area"),
      slot("tool"),
      "[data-channel=hue] input[type=range]",
      "[data-channel=alpha] input[type=range]",
      slot("format"),
      slot("input"),
      slot("swatch"),
    ]) {
      await tw.states(pickers, "default", "focus", { ...root, target });
    }
    await tw.states(triggers, "md field", "focus", root);
    await tw.states(triggers, "md swatch", "focus", root);
  });

  test("forced colors match: edges, the selected swatch, and focus use system colors", {
    timeout: 90_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(pickers, root);
    await tw.parity(triggers, root);
    // The first swatch is the current color, and the one Tab reaches.
    await tw.states(pickers, "swatches with a translucent and a light one", "focus", {
      ...root,
      target: slot("swatch"),
    });
    await tw.states(pickers, "default", "focus", { ...root, target: slot("area") });
    await tw.states(pickers, "default", "focus", {
      ...root,
      target: "[data-channel=hue] input[type=range]",
    });
    await tw.states(pickers, "default", "focus", { ...root, target: slot("input") });
  });

  test("reduced motion matches: nothing compacts", { timeout: 60_000 }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(pickers, root);
    await tw.parity(triggers, root);
    await tw.states(pickers, "default", "held", { ...root, target: slot("tool") });
    await tw.states(pickers, "default", "held", { ...root, target: slot("area") });
    await tw.states(pickers, "default", "held", {
      ...root,
      target: `[data-channel=hue] ${slot("thumb")}`,
    });
    await tw.states(pickers, "default", "held", { ...root, target: slot("swatch") });
    await tw.states(triggers, "md field", "held", root);
  });

  test("more contrast brings the fields' edge back", async () => {
    await setMedia("more-contrast");
    await tw.parity(pickers, root);
    await tw.parity(pickers, { ...root, theme: "dark" });
  });

  test("transitions are the same: the settle spring, and the quick press", async () => {
    await tw.motion(all);
  });

  test("a held press lets in over its own time, in both", { timeout: 60_000 }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    const live = { props: motion, live: true };
    await twMotion.states(pickers, "default", "held", { ...live, target: slot("tool") });
    await twMotion.states(pickers, "default", "held", { ...live, target: slot("swatch") });
    await twMotion.states(pickers, "default", "held", { ...live, target: slot("area") });
    await twMotion.states(pickers, "default", "held", {
      ...live,
      target: `[data-channel=hue] ${slot("thumb")}`,
    });
    await twMotion.states(triggers, "md field", "held", live);
  });
});

/** An open picker in a popover: both flavors portal to the body, so each is found by its class. */
const popupCases: Case[] = [
  make("popup in a right-to-left page", ({ Popover }) => (
    <Rtl>
      <div style={{ paddingInlineStart: 250 }}>
        <Popover defaultOpen />
      </div>
    </Rtl>
  )),
  make("popup", ({ Popover }) => <Popover defaultOpen />),
  make("popup of a swatch trigger", ({ Popover }) => (
    <Popover defaultOpen variant="swatch" aria-label="Color" />
  )),
  make("popup in a narrow trigger side", ({ Popover }) => <Popover defaultOpen side="top" />),
];

function Rtl({ children }: { children: ReactElement }): ReactElement {
  return <DirectionProvider direction="rtl">{children}</DirectionProvider>;
}

const popups = (): { css: Element | undefined; tw: Element | undefined } => {
  const found = [...document.querySelectorAll("[data-slot=color-picker-popup]")];
  return {
    css: found.find((el) => el.classList.contains("ow-color-picker__popup")),
    tw: found.find((el) => !el.classList.contains("ow-color-picker__popup")),
  };
};

describe("the popup of a Color Picker in Tailwind CSS v4 in its portal", () => {
  /** Opens one case in both flavors and measures both popups from their triggers. */
  async function compare(
    name: string,
    options: {
      theme?: "light" | "dark";
      mark?: (popup: Element) => void;
    } = {},
  ) {
    const screen = await tw.mount(
      popupCases.filter((one) => one.name === name),
      options.theme ? { theme: options.theme } : {},
    );
    await vi.waitFor(
      () => {
        const { css: a, tw: b } = popups();
        expect(a).toBeDefined();
        expect(b).toBeDefined();
        // Base UI takes its starting state off a frame after the popup is in.
        expect(a?.hasAttribute("data-starting-style")).toBe(false);
        expect(b?.hasAttribute("data-starting-style")).toBe(false);
      },
      { timeout: 5000 },
    );
    const { css: a, tw: b } = popups();
    if (!a || !b) throw new Error("no popup");
    // Base UI focuses the first control of a popup; no ring is the case under test.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    options.mark?.(a);
    options.mark?.(b);
    await frame();
    await frame();
    const side = (flavor: string) =>
      screen.container.querySelector(`[data-case="${name}"] [data-side=${flavor}]`);
    const trigger = (flavor: string) =>
      side(flavor)?.querySelector("[data-slot=color-picker-trigger]") as Element;
    const parts = (popup: Element, flavor: string) =>
      measureFrom(
        trigger(flavor),
        popup.closest("[data-slot=color-picker-positioner]") as Element,
        [...props, "maxWidth"],
      );
    tw.expectParts(name, parts(a, "css"), parts(b, "tw"));
  }

  test("the popup and the picker in it match, with the popup's shadow", async () => {
    await compare("popup");
  });

  test("and when the trigger is a swatch, or the popup opens upward", async () => {
    await compare("popup of a swatch trigger");
    await compare("popup in a narrow trigger side");
  });

  test("in the dark theme", async () => {
    await compare("popup", { theme: "dark" });
  });

  test("in a right-to-left page", async () => {
    await compare("popup in a right-to-left page");
  });

  test("with more contrast, the popup gets a ring", async () => {
    await setMedia("more-contrast");
    await compare("popup");
  });

  test("in forced colors", async () => {
    await setMedia("forced-colors");
    await compare("popup");
  });

  test.each(["data-starting-style", "data-ending-style", "data-instant"])(
    "a popup in its %s state matches",
    async (state) => {
      await compare("popup", { mark: (popup) => popup.setAttribute(state, "") });
    },
  );

  test("the popup fades in 150 ms and out in 100 ms, in both", async () => {
    const read = async (flavor: "css" | "tw") => {
      const { css: a, tw: b } = popups();
      const popup = flavor === "css" ? a : b;
      if (!popup) throw new Error("no popup");
      const out: string[] = [];
      for (const state of [null, "data-ending-style", "data-instant"]) {
        if (state) popup.setAttribute(state, "");
        const style = getComputedStyle(popup);
        out.push(`${style.transitionProperty} ${style.transitionDuration}`);
        if (state) popup.removeAttribute(state);
      }
      return out;
    };
    const screen = await render(
      <>
        <CssPopover defaultOpen />
        <TwPopover defaultOpen />
      </>,
    );
    tw.load();
    await vi.waitFor(() => expect(popups().css && popups().tw).toBeTruthy());
    expect(await read("tw")).toEqual(await read("css"));
    expect(await read("tw")).toEqual(["opacity 0.15s", "opacity 0.1s", "none 0s"]);
    await screen.unmount();
  });

  test("a press opens it in the portal, and it ends fully shown", async () => {
    tw.load();
    const screen = await render(<TwPopover />);
    await userEvent.click(screen.getByRole("button").element());
    await expect
      .poll(() => document.querySelector("[data-slot=color-picker-popup]"))
      .not.toBeNull();
    const popup = document.querySelector("[data-slot=color-picker-popup]") as HTMLElement;
    await expect.poll(() => getComputedStyle(popup).opacity).toBe("1");
    expect(popup.querySelector("[data-slot=color-picker]")).not.toBeNull();
  });
});

/** What a drag leaves: the last value sent, the thumb's box in its track, and its aria value. */
async function drag(
  kit: Kit,
  pick: (scope: Element) => { from: Element; thumb: Element; box: Element; input?: Element },
  to: (box: DOMRect) => { x: number; y: number },
  from: (box: DOMRect) => { x: number; y: number },
) {
  tw.load();
  const values: string[] = [];
  const screen = await render(
    <kit.Picker defaultValue="#ff0000" onChange={(value) => values.push(value)} />,
  );
  const { from: source, thumb, box, input } = pick(screen.container);
  const rect = source.getBoundingClientRect();
  await userEvent.dragAndDrop(source, source, {
    sourcePosition: from(rect),
    targetPosition: to(rect),
  });
  // The thumb springs back from its press; its box is read where it rests.
  await vi.waitFor(() => expect(document.getAnimations().length).toBe(0), { timeout: 3000 });
  const t = thumb.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const out = {
    last: values.at(-1),
    thumb: [t.x - b.x, t.y - b.y, t.width, t.height].map((n) => Math.round(n * 100) / 100),
    value: input?.getAttribute("aria-valuenow") ?? null,
    dragging: source.closest("[data-dragging]") !== null,
  };
  await screen.unmount();
  return out;
}

const q = (scope: Element, selector: string): Element => {
  const el = scope.querySelector(selector);
  if (!el) throw new Error(`no ${selector}`);
  return el;
};

describe("dragging in Tailwind CSS v4 gives what dragging gives in the CSS flavor", () => {
  const area = (scope: Element) => ({
    from: q(scope, slot("area")),
    thumb: q(scope, `${slot("area")} > ${slot("thumb")}`),
    box: q(scope, slot("area")),
  });
  const channel = (name: string) => (scope: Element) => ({
    from: q(scope, `[data-channel=${name}] ${slot("control")}`),
    thumb: q(scope, `[data-channel=${name}] ${slot("thumb")}`),
    box: q(scope, `[data-channel=${name}] ${slot("track")}`),
    input: q(scope, `[data-channel=${name}] input[type=range]`),
  });

  test("the area: the same color, and the thumb in the same place", async () => {
    const at = (r: DOMRect) => ({ x: r.width * 0.3, y: r.height * 0.6 });
    const first = await drag(twind, area, at, () => ({ x: 10, y: 10 }));
    const second = await drag(css, area, at, () => ({ x: 10, y: 10 }));
    expect(first).toEqual(second);
    expect(first.dragging).toBe(false);
    expect(first.thumb[0]).toBeGreaterThan(40);
  });

  test("the hue slider", async () => {
    const at = (r: DOMRect) => ({ x: r.width * 0.5, y: r.height / 2 });
    const first = await drag(twind, channel("hue"), at, () => ({ x: 20, y: 12 }));
    const second = await drag(css, channel("hue"), at, () => ({ x: 20, y: 12 }));
    expect(first).toEqual(second);
    expect(Number(first.value)).toBeGreaterThan(100);
  });

  test("the alpha slider", async () => {
    const at = (r: DOMRect) => ({ x: r.width * 0.25, y: r.height / 2 });
    const first = await drag(twind, channel("alpha"), at, () => ({ x: 120, y: 12 }));
    const second = await drag(css, channel("alpha"), at, () => ({ x: 120, y: 12 }));
    expect(first).toEqual(second);
  });

  test("a right-to-left page gives the same thumb box too", async () => {
    const run = async (kit: Kit) => {
      tw.load();
      const screen = await render(
        <Rtl>
          <div dir="rtl">
            <kit.Picker defaultValue="#ff0000" />
          </div>
        </Rtl>,
      );
      const { thumb, box } = area(screen.container);
      await frame();
      const t = thumb.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const out = [t.x - b.x, t.y - b.y, t.width, t.height].map((n) => Math.round(n * 100) / 100);
      await screen.unmount();
      return out;
    };
    expect(await run(twind)).toEqual(await run(css));
  });

  test("the rendered tree has no ow- class, and every part keeps its data-slot", async () => {
    tw.load();
    const screen = await render(
      <>
        <TwPicker swatches={SWATCHES} />
        <TwPopover defaultOpen />
      </>,
    );
    await vi.waitFor(() =>
      expect(document.querySelector("[data-slot=color-picker-popup]")).not.toBeNull(),
    );
    const classes = [...document.body.querySelectorAll("[class]")].flatMap((el) =>
      [...el.classList].filter((name) => name.startsWith("ow-")),
    );
    expect(classes).toEqual([]);
    for (const name of [
      "color-picker",
      "area",
      "thumb",
      "tools",
      "tool",
      "sliders",
      "slider",
      "control",
      "track",
      "preview",
      "inputs",
      "format",
      "field",
      "input",
      "label",
      "swatches",
      "swatch",
      "chip",
      "value",
      "trigger",
      "positioner",
      "popup",
    ]) {
      const slotName = name === "color-picker" ? name : `color-picker-${name}`;
      expect(document.querySelector(`[data-slot=${slotName}]`), slotName).not.toBeNull();
    }
    await screen.unmount();
  });
});

describe("className on Color Picker in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on the root", async () => {
    tw.load();
    const screen = await render(<TwPicker className={OVERRIDES} />);
    const el = q(screen.container, "[data-slot=color-picker]");
    expectStyles(el, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      paddingTop: "32px",
      width: "80px",
      height: "96px",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("a user's utilities beat the trigger's, and a disabled variant beats its own", async () => {
    tw.load();
    const screen = await render(
      <>
        <TwPopover className={OVERRIDES} />
        <TwPopover disabled className="disabled:opacity-100" />
      </>,
    );
    const [a, b] = [...screen.container.querySelectorAll("[data-slot=color-picker-trigger]")];
    if (!a || !b) throw new Error("not rendered");
    expectStyles(a, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      paddingTop: "32px",
      width: "80px",
      height: "96px",
    });
    expectStyles(b, { opacity: "1" });
  });

  test("a user's utility on a swatch trigger beats the swatch variant's", async () => {
    tw.load();
    const screen = await render(
      <TwPopover variant="swatch" aria-label="Color" className="size-16 p-2" />,
    );
    const el = q(screen.container, "[data-slot=color-picker-trigger]");
    expectStyles(el, { width: "64px", height: "64px", paddingTop: "8px" });
  });

  test("the slots and variants merge with a className, the user's last", () => {
    const trigger = cn(colorPickerTriggerVariants({ size: "sm" }), "px-8 rounded-none text-lg");
    expect(trigger).toContain("rounded-none");
    expect(trigger).toContain("text-lg");
    expect(trigger).not.toContain("rounded-(--_radius)");
    expect(trigger).not.toContain("px-(--px)");
    expect(trigger).not.toContain("text-[13px]");
    const swatch = cn(colorPickerTriggerVariants({ variant: "swatch" }), "size-8 shadow-md");
    expect(swatch).not.toContain("size-[calc(2_*_var(--_py)_+_1lh)]");
    expect(swatch).not.toContain("shadow-none");
    const root = cn(colorPickerSlots.root, "w-64 gap-2 rounded-none p-0 bg-red-500");
    for (const gone of [
      "w-[256px]",
      "gap-(--_pad)",
      "rounded-(--_radius)",
      "p-(--_pad)",
      "bg-(color:--_bg)",
    ]) {
      expect(root, gone).not.toContain(gone);
    }
  });
});
