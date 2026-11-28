import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Switch as CssSwitch } from "../src/components/switch/index";
import switchCss from "../src/components/switch/switch.css?raw";
import { cn } from "../src/tailwind/lib/cn";
import { Switch as TwSwitch } from "../src/tailwind/switch/index";
import {
  type SwitchSize,
  switchSlots,
  switchVariants,
} from "../src/tailwind/switch/switch-variants";
import bridge from "../src/tailwind.css?raw";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// Switch in Tailwind CSS v4 (src/tailwind/switch) against switch.css.

const SIZES: SwitchSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 text-sm opacity-100 outline-red-500 cursor-default w-20 h-10 data-checked:bg-green-500 data-disabled:opacity-100 focus-visible:outline-red-500";

const tw = tailwindParity(
  classNames(
    ...Object.values(switchSlots),
    ...SIZES.map((size) => switchVariants({ size })),
    OVERRIDES,
    "ow-label-hover:bg-red-500 ow-switch-held:bg-red-500 data-checked:bg-red-500",
  ),
);

// What the switch draws that PROPS leaves out: the thumb's travel and its container.
const props = [
  ...PROPS,
  "translate",
  "containerType",
  "aspectRatio",
  "backgroundClip",
  "transformOrigin",
  "forcedColorAdjust",
  "marginInlineStart",
];

type Kit = typeof CssSwitch;
const make = (name: string, ui: (Switch: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssSwitch),
  tw: ui(TwSwitch),
});

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const cases: Case[] = [
  ...SIZES.flatMap((size) => [
    make(size, (Switch) => <Switch.Root size={size} aria-label="Wi-Fi" />),
    make(`${size} on`, (Switch) => <Switch.Root size={size} defaultChecked aria-label="Wi-Fi" />),
  ]),
  make("default", (Switch) => <Switch.Root aria-label="Wi-Fi" />),
  make("disabled", (Switch) => <Switch.Root disabled aria-label="Wi-Fi" />),
  make("disabled on", (Switch) => <Switch.Root disabled defaultChecked aria-label="Wi-Fi" />),
  make("invalid", (Switch) => <Switch.Root aria-invalid aria-label="Wi-Fi" />),
  make("invalid on", (Switch) => <Switch.Root aria-invalid defaultChecked aria-label="Wi-Fi" />),
  make("read only", (Switch) => <Switch.Root readOnly aria-label="Wi-Fi" />),
  make("read only on", (Switch) => <Switch.Root readOnly defaultChecked aria-label="Wi-Fi" />),
  make("disabled and read only", (Switch) => (
    <Switch.Root disabled readOnly defaultChecked aria-label="Wi-Fi" />
  )),
  make("an icon in the thumb", (Switch) => (
    <Switch.Root defaultChecked aria-label="Wi-Fi">
      <Switch.Thumb>
        <Check />
      </Switch.Thumb>
    </Switch.Root>
  )),
  make("an icon in the thumb, off", (Switch) => (
    <Switch.Root aria-label="Wi-Fi">
      <Switch.Thumb>
        <Check />
      </Switch.Thumb>
    </Switch.Root>
  )),
  make("disabled with an icon", (Switch) => (
    <Switch.Root disabled defaultChecked aria-label="Wi-Fi">
      <Switch.Thumb>
        <Check />
      </Switch.Thumb>
    </Switch.Root>
  )),
  make("size from an outer part", (Switch) => (
    <Switch.Root data-size="lg" defaultChecked aria-label="Wi-Fi" />
  )),
  make("in a larger font", (Switch) => (
    <div style={{ fontSize: 24 }}>
      <Switch.Root defaultChecked aria-label="Wi-Fi" />
    </div>
  )),
  make("in a label", (Switch) => (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Switch.Root />
      <span data-text="">Wi-Fi</span>
    </label>
  )),
  make("in a label, on", (Switch) => (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Switch.Root defaultChecked />
      <span data-text="">Wi-Fi</span>
    </label>
  )),
  make("in a label, disabled", (Switch) => (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Switch.Root disabled />
      <span data-text="">Wi-Fi</span>
    </label>
  )),
  make("a sized track", (Switch) => (
    <Switch.Root style={{ inlineSize: 80 }} aria-label="Wi-Fi" defaultChecked />
  )),
];

const root = { target: "[data-slot=switch]", props };
const text = { target: "[data-text]", props };

describe("Switch in Tailwind CSS v4 against switch.css", () => {
  test("every size, state, and thumb matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page, where the thumb travels the other way", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("hover steps an off track up, and leaves an on or disabled one", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "md on", "disabled", "read only", "an icon in the thumb"]) {
      await tw.states(cases, name, "hover", root);
    }
  });

  test("pointing at the label counts as pointing at the track", { timeout: 60_000 }, async () => {
    for (const name of ["in a label", "in a label, on", "in a label, disabled"]) {
      await tw.states(cases, name, "hover", text);
    }
  });

  test("a held press, with a real pointer, widens and squashes the thumb", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "md on", "lg on", "disabled", "read only", "an icon in the thumb"]) {
      await tw.states(cases, name, "held", root);
    }
  });

  test("a held press in a right-to-left page", { timeout: 60_000 }, async () => {
    for (const name of ["md", "md on"])
      await tw.states(cases, name, "held", { ...root, dir: "rtl" });
  });

  test("keyboard focus draws the ring", { timeout: 60_000 }, async () => {
    for (const name of ["md", "md on", "read only"]) {
      await tw.states(cases, name, "focus", root);
    }
  });

  test("forced colors match: on is the highlight, the key is drawn solid", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
    await tw.states(cases, "md on", "hover", root);
    await tw.states(cases, "md on", "focus", root);
    await tw.states(cases, "md", "held", root);
  });

  test("reduced motion matches: the thumb goes to its place with no stretch", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.states(cases, "md", "held", root);
    await tw.states(cases, "md on", "held", root);
  });

  test("reduced motion: the thumb does not transition", async () => {
    await setMedia("reduced-motion");
    await tw.motion(cases);
  });

  test("more contrast brings the track's edge back, over an on track too", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("transitions are the same: the thumb's two registered properties, springs and all", async () => {
    await tw.motion(cases);
  });

  test("a held press lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "md", "held", { ...root, props: motion, live: true });
    await tw.states(cases, "md on", "held", { ...root, props: motion, live: true });
  });

  test("the @property rules in tailwind.css are the ones in switch.css", () => {
    const rules = (css: string): Record<string, string> => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css.replace(/@layer[^{;]*[{;]/g, ""));
      return Object.fromEntries(
        [...sheet.cssRules]
          .filter((rule) => rule instanceof CSSPropertyRule)
          .map((rule) => [rule.name, rule.cssText]),
      );
    };
    const mine = rules(switchCss);
    expect(Object.keys(mine).sort()).toEqual(["--_switch-held", "--_switch-travel"]);
    const theirs = rules(bridge);
    for (const name of Object.keys(mine)) expect(theirs[name], name).toBe(mine[name]);
  });
});

describe("a switch in Tailwind CSS v4 moves", () => {
  test("the thumb travels on a registered property, not at once", async () => {
    tw.load();
    const screen = await render(<TwSwitch.Root aria-label="Wi-Fi" />);
    const track = screen.container.querySelector<HTMLElement>("[data-slot=switch]");
    const thumb = screen.container.querySelector<HTMLElement>("[data-slot=switch-thumb]");
    if (!track || !thumb) throw new Error("not rendered");
    const travel = () => Number(getComputedStyle(thumb).getPropertyValue("--_switch-travel"));
    expect(travel()).toBe(0);
    track.click();
    await vi.waitFor(() => expect(track.hasAttribute("data-checked")).toBe(true));
    // Mid-way: the registered number is between its ends, and the thumb is stretched.
    await vi.waitFor(() => {
      expect(travel()).toBeGreaterThan(0);
      expect(travel()).toBeLessThan(1);
    });
    await vi.waitFor(() => expect(travel()).toBe(1), { timeout: 3000 });
  });
});

describe("className on Switch in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(<TwSwitch.Root className={OVERRIDES} aria-label="Wi-Fi" />);
    const track = screen.container.querySelector("[data-slot=switch]");
    if (!track) throw new Error("not rendered");
    expectStyles(track, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      width: "80px",
      height: "40px",
      fontSize: "14px",
      cursor: "default",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    tw.load();
    const screen = await render(
      <>
        <TwSwitch.Root defaultChecked aria-label="Wi-Fi" className="data-checked:bg-red-500" />
        <TwSwitch.Root disabled aria-label="Wi-Fi" className="data-disabled:opacity-100" />
      </>,
    );
    const [on, off] = [...screen.container.querySelectorAll("[data-slot=switch]")];
    if (!on || !off) throw new Error("not rendered");
    expectStyles(on, { backgroundColor: "oklch(0.637 0.237 25.331)" });
    expectStyles(off, { opacity: "1" });
  });

  test("switchVariants() output merges with a className, the user's last", () => {
    const merged = cn(switchVariants({ size: "sm" }), "rounded-none w-20 text-lg");
    expect(merged).toContain("rounded-none");
    expect(merged).toContain("w-20");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("rounded-[calc(var(--_radius)_+_var(--_inset))]");
    expect(merged).not.toContain("text-[0.8125rem]");
  });
});
