import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { RadioGroup as CssGroup, Radio as CssRadio } from "../src/components/radio-group/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { RadioGroup as TwGroup, Radio as TwRadio } from "../src/tailwind/radio-group/index";
import {
  type RadioGroupSize,
  radioGroupSlots,
  radioGroupVariants,
} from "../src/tailwind/radio-group/radio-group-variants";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  setMedia,
  tailwindParity,
} from "./parity";

// Radio Group in Tailwind CSS v4 (src/tailwind/radio-group, with Glide from src/tailwind/lib/glide)
// against radio-group.css and glide.css.

const SIZES: RadioGroupSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm opacity-100 gap-0 outline-red-500 cursor-default duration-300 ease-linear";

const ROWS = "[&_:where(label:has([data-slot=radio-group-radio]))]";

const tw = tailwindParity(
  classNames(
    ...Object.values(radioGroupSlots),
    ...Object.values(glideSlots),
    ...SIZES.map((size) => radioGroupVariants({ size })),
    OVERRIDES,
    "data-checked:bg-red-500 data-disabled:opacity-100 focus-visible:outline-red-500",
    "grid grid-cols-3 gap-4",
    `${ROWS}:p-1 ${ROWS}:cursor-default`,
  ),
);

// What these parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "marginInlineStart",
  "marginInlineEnd",
  "transformOrigin",
  "forcedColorAdjust",
  "backgroundClip",
  "webkitTapHighlightColor",
  "gridTemplateColumns",
];

interface Kit {
  Group: typeof CssGroup;
  Radio: typeof CssRadio;
}
const css: Kit = { Group: CssGroup, Radio: CssRadio };
const twind: Kit = { Group: TwGroup as typeof CssGroup, Radio: TwRadio as typeof CssRadio };

const OPTIONS = ["Standard", "Express", "Pickup"] as const;

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

interface GroupProps {
  kit: Kit;
  size?: RadioGroupSize;
  value?: string | undefined;
  disabled?: boolean;
  readOnly?: boolean;
  /** One option that is disabled or read only. */
  one?: "disabled" | "readonly" | "invalid";
  mark?: "svg" | "kept";
  className?: string;
  long?: boolean;
  bare?: boolean;
}

function Options({
  kit,
  size,
  value = "express",
  disabled,
  readOnly,
  one,
  mark: markType,
  className,
  long,
  bare,
}: GroupProps): ReactElement {
  const { Group, Radio } = kit;
  const mark =
    markType === "svg" ? (
      <Radio.Indicator>
        <Check />
      </Radio.Indicator>
    ) : markType === "kept" ? (
      <Radio.Indicator keepMounted />
    ) : undefined;
  return (
    <Group
      aria-label="Delivery"
      size={size}
      defaultValue={value}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
    >
      {OPTIONS.map((name) => {
        const rest = {
          value: name.toLowerCase(),
          "aria-label": bare ? name : undefined,
          disabled: one === "disabled" && name === "Pickup" ? true : undefined,
          readOnly: one === "readonly" && name === "Pickup" ? true : undefined,
          "aria-invalid": one === "invalid" && name === "Pickup" ? true : undefined,
        };
        return bare ? (
          <Radio.Root key={name} {...rest}>
            {mark}
          </Radio.Root>
        ) : (
          <label key={name}>
            <Radio.Root {...rest}>{mark}</Radio.Root>
            {long && name === "Express"
              ? "Express: it arrives tomorrow, wherever you are, or the day after."
              : name}
          </label>
        );
      })}
    </Group>
  );
}

const make = (name: string, group: Omit<GroupProps, "kit">): Case => ({
  name,
  css: <Options kit={css} {...group} />,
  tw: <Options kit={twind} {...group} />,
});

const cases: Case[] = [
  ...SIZES.flatMap((size) => [make(size, { size, value: "" }), make(`${size} on`, { size })]),
  make("default", {}),
  make("disabled group", { disabled: true }),
  make("one disabled", { one: "disabled", value: "pickup" }),
  make("one disabled, off", { one: "disabled", value: "standard" }),
  make("read only group", { readOnly: true }),
  make("one read only", { one: "readonly", value: "pickup" }),
  make("one invalid", { one: "invalid", value: "standard" }),
  make("one invalid, on", { one: "invalid", value: "pickup" }),
  make("an icon as the mark", { mark: "svg" }),
  make("a mark kept mounted", { mark: "kept" }),
  make("a label that wraps", { long: true }),
  make("radios without rows", { bare: true }),
  make("a grid of rows", { className: "grid grid-cols-3 gap-4" }),
  make("a user's class", { className: "text-sm gap-0" }),
  {
    name: "in a larger font",
    css: (
      <div style={{ fontSize: 24 }}>
        <Options kit={css} />
      </div>
    ),
    tw: (
      <div style={{ fontSize: 24 }}>
        <Options kit={twind} />
      </div>
    ),
  },
];

const radio = { target: "[data-slot=radio-group-radio]", props };
const row = { target: "label", props };

describe("Radio Group in Tailwind CSS v4 against radio-group.css", () => {
  test("every size, state, and mark matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page, where the radio margins swap sides", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("hover steps an off radio up, on the radio or its row, and leaves an on or disabled one", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "md on", "one disabled, off", "read only group"]) {
      await tw.states(cases, name, "hover", { ...radio, target: "[data-slot=radio-group-radio]" });
      await tw.states(cases, name, "hover", row);
    }
  });

  test("Glide lights the hovered row, with its tint", { timeout: 60_000 }, async () => {
    for (const name of ["md", "a grid of rows", "a label that wraps"]) {
      await tw.states(cases, name, "hover", row);
    }
    await tw.states(cases, "md", "hover", { ...row, theme: "dark" });
  });

  test("a held press, on the radio or its row, goes deepest and in to 0.97", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "md on", "lg on", "disabled group", "read only group"]) {
      await tw.states(cases, name, "held", radio);
      await tw.states(cases, name, "held", row);
    }
  });

  test("keyboard focus draws the ring", { timeout: 60_000 }, async () => {
    // Tab reaches the checked radio of the group.
    const checked = { ...radio, target: "[data-slot=radio-group-radio][data-checked]" };
    for (const name of ["md on", "one disabled, off", "an icon as the mark"]) {
      await tw.states(cases, name, "focus", checked);
    }
  });

  test("forced colors match: on is the highlight, disabled is gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
    await tw.states(cases, "md on", "hover", row);
    const checked = { ...radio, target: "[data-slot=radio-group-radio][data-checked]" };
    await tw.states(cases, "md on", "focus", checked);
    await tw.states(cases, "md", "held", radio);
  });

  test("reduced motion matches: a held press does not move, the dot only fades", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.states(cases, "md", "held", radio);
    await tw.states(cases, "md", "hover", row);
  });

  test("more contrast brings the edge back, on an on radio too", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("transitions are the same: the radio, the dot, the highlight", async () => {
    await tw.motion(cases, { props });
  });

  test("a held press lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "md", "held", { ...radio, props: motion, live: true });
    await tw.states(cases, "md on", "held", { ...row, props: motion, live: true });
  });

  test("a highlight that has landed on a taller, wider row keeps round corners", async () => {
    const one = cases.filter((item) => item.name === "md");
    const placed = (side: Element) => {
      const style = side.querySelector<HTMLElement>("[data-slot=glide]")?.style;
      for (const [name, value] of [
        ["--_x", "10px"],
        ["--_y", "30px"],
        ["--_w", "50px"],
        ["--_h", "20px"],
        ["--_sx", "2"],
        ["--_sy", "0.5"],
      ] as const) {
        style?.setProperty(name, value);
      }
    };
    await tw.parity(one, { props, prepare: placed });
  });

  test("with reduced motion the highlight only fades", async () => {
    await setMedia("reduced-motion");
    const one = cases.filter((item) => item.name === "md");
    await tw.motion(one, { props });
    await tw.motion(one, {
      props,
      prepare: (side) => side.querySelector("[data-slot=glide]")?.setAttribute("data-visible", ""),
    });
  });

  test("the highlight's first moment: shown, held, and instant", async () => {
    const one = cases.filter((item) => item.name === "md");
    const flags = (state: "visible" | "held" | "instant") => (side: Element) => {
      side.querySelector("[data-slot=glide]")?.setAttribute(`data-${state}`, "");
    };
    for (const state of ["visible", "held", "instant"] as const) {
      await tw.parity(one, { props, prepare: flags(state) });
    }
    await setMedia("reduced-motion");
    await tw.motion(one, { props, prepare: flags("instant") });
  });
});

describe("Radio Group in Tailwind CSS v4 behaves as in CSS", () => {
  test("Glide lights the hovered row and its highlight lands on it, with no ow- class", async () => {
    tw.load();
    const screen = await render(<Options kit={twind} />);
    const group = screen.container.querySelector<HTMLElement>("[data-slot=radio-group]");
    if (!group) throw new Error("not rendered");
    const rows = [...group.querySelectorAll("label")];
    const highlight = group.querySelector<HTMLElement>("[data-slot=glide]");
    if (!highlight) throw new Error("no highlight");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    group.removeAttribute("data-glide");
    expect(getComputedStyle(group).position).toBe("relative");
    expect(getComputedStyle(group).isolation).toBe("isolate");
    await userEvent.hover(rows[2] as Element);
    expect(rows[2]?.hasAttribute("data-glide-active")).toBe(true);
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    await userEvent.hover(rows[0] as Element);
    expect(rows[0]?.hasAttribute("data-glide-active")).toBe(true);
    expect(rows[2]?.hasAttribute("data-glide-active")).toBe(false);
    // Its transform ends where the row is: the offset the script wrote, and the transition is done.
    await expect
      .poll(() => {
        const a = highlight.getBoundingClientRect();
        const b = (rows[0] as Element).getBoundingClientRect();
        return [a.x - b.x, a.y - b.y, a.width - b.width, a.height - b.height].map((n) =>
          Math.abs(n) < 0.02 ? 0 : n,
        );
      })
      .toEqual([0, 0, 0, 0]);
    expect(screen.container.innerHTML.match(/(?<=["\s])ow-[\w-]+(?=["\s])/g)).toBeNull();
  });

  test("the rendered Tailwind tree holds no class of the CSS flavor", async () => {
    tw.load();
    const screen = await render(<Options kit={twind} mark="svg" />);
    const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
      el.className.split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(10);
  });

  test("a click picks a row, and the dot arrives", async () => {
    tw.load();
    const screen = await render(<Options kit={twind} />);
    const radios = [...screen.container.querySelectorAll<HTMLElement>("[role=radio]")];
    await userEvent.click(radios[2] as Element);
    await expect.poll(() => radios[2]?.getAttribute("aria-checked")).toBe("true");
    await frame();
    await expect
      .poll(
        () =>
          getComputedStyle(radios[2]?.querySelector("[data-slot=radio-group-indicator]") as Element)
            .opacity,
      )
      .toBe("1");
  });
});

describe("className on Radio Group in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on the group", async () => {
    tw.load();
    const screen = await render(<Options kit={twind} className={OVERRIDES} />);
    const group = screen.container.querySelector("[data-slot=radio-group]");
    if (!group) throw new Error("not rendered");
    expectStyles(group, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      columnGap: "0px",
      opacity: "1",
      cursor: "default",
      outlineColor: "oklch(0.637 0.237 25.331)",
      transitionDuration: "0.3s",
    });
  });

  test("a user's utility with a state's variant beats that state's, on a radio", async () => {
    tw.load();
    const screen = await render(
      <TwGroup aria-label="Delivery" defaultValue="a">
        <TwRadio.Root value="a" className="data-checked:bg-red-500" aria-label="A" />
        <TwRadio.Root value="b" disabled className="data-disabled:opacity-100" aria-label="B" />
      </TwGroup>,
    );
    const [on, off] = [...screen.container.querySelectorAll("[role=radio]")];
    if (!on || !off) throw new Error("not rendered");
    expectStyles(on, { backgroundColor: "oklch(0.637 0.237 25.331)" });
    expectStyles(off, { opacity: "1" });
  });

  test("a user's utility with the rows' variant replaces the rows' own", async () => {
    tw.load();
    const screen = await render(
      <Options kit={twind} className={`${ROWS}:p-1 ${ROWS}:cursor-default`} />,
    );
    const label = screen.container.querySelector("label");
    if (!label) throw new Error("not rendered");
    expectStyles(label, { paddingTop: "4px", paddingLeft: "4px", cursor: "default" });
  });

  test("radioGroupVariants() output merges with a className, the user's last", () => {
    const merged = cn(radioGroupVariants({ size: "sm" }), "text-lg [--py:1em]");
    expect(merged).toContain("text-lg");
    expect(merged).toContain("[--py:1em]");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("[--py:0.6058em]");
    expect(cn(radioGroupSlots.radio, "rounded-none")).not.toContain("rounded-[50%]");
    expect(cn(radioGroupSlots.radio, "cursor-default")).not.toContain(" cursor-pointer");
    expect(cn(radioGroupSlots.indicator, "opacity-100")).not.toContain(" opacity-0");
  });
});
