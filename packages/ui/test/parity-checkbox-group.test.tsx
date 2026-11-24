import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Checkbox as CssCheckbox } from "../src/components/checkbox/index";
import { CheckboxGroup as CssGroup } from "../src/components/checkbox-group/index";
import { checkboxSlots, checkboxVariants } from "../src/tailwind/checkbox/checkbox-variants";
import { Checkbox as TwCheckbox } from "../src/tailwind/checkbox/index";
import {
  type CheckboxGroupSize,
  checkboxGroupVariants,
} from "../src/tailwind/checkbox-group/checkbox-group-variants";
import { CheckboxGroup as TwGroup } from "../src/tailwind/checkbox-group/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// Checkbox Group in Tailwind CSS v4 (src/tailwind/checkbox-group, with Checkbox and Glide from the
// same folder) against checkbox-group.css, checkbox.css, and glide.css.

const SIZES: CheckboxGroupSize[] = ["sm", "md", "lg"];
const OVERRIDES = "rounded-none bg-red-500 text-red-500 text-sm opacity-100 gap-0 cursor-default";
const ROWS = "[&_:where(label:has([role=checkbox]))]";

const tw = tailwindParity(
  classNames(
    ...Object.values(checkboxSlots),
    ...Object.values(glideSlots),
    ...SIZES.map((size) => checkboxGroupVariants({ size })),
    ...SIZES.map((size) => checkboxVariants({ size })),
    OVERRIDES,
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
  "gridTemplateColumns",
  "webkitTapHighlightColor",
];

interface Kit {
  Group: typeof CssGroup;
  Checkbox: typeof CssCheckbox;
}
const css: Kit = { Group: CssGroup, Checkbox: CssCheckbox };
const twind: Kit = {
  Group: TwGroup as typeof CssGroup,
  Checkbox: TwCheckbox as typeof CssCheckbox,
};

const OPTIONS = ["Cheese", "Olives", "Onions"] as const;

interface GroupProps {
  kit: Kit;
  size?: CheckboxGroupSize;
  value?: string[];
  disabled?: boolean;
  one?: "disabled" | "readonly" | "own-size";
  parent?: boolean;
  className?: string;
  long?: boolean;
  bare?: boolean;
}

function Options({
  kit,
  size,
  value = ["olives"],
  disabled,
  one,
  parent,
  className,
  long,
  bare,
}: GroupProps): ReactElement {
  const { Group, Checkbox } = kit;
  return (
    <Group
      aria-label="Toppings"
      size={size}
      defaultValue={value}
      allValues={parent ? OPTIONS.map((name) => name.toLowerCase()) : undefined}
      disabled={disabled}
      className={className}
    >
      {parent ? (
        <label>
          <Checkbox.Root parent />
          All
        </label>
      ) : null}
      {OPTIONS.map((name) => {
        const rest = {
          value: name.toLowerCase(),
          "aria-label": bare ? name : undefined,
          disabled: one === "disabled" && name === "Onions" ? true : undefined,
          readOnly: one === "readonly" && name === "Onions" ? true : undefined,
          size: one === "own-size" && name === "Onions" ? ("lg" as const) : undefined,
        };
        return bare ? (
          <Checkbox.Root key={name} {...rest} />
        ) : (
          <label key={name}>
            <Checkbox.Root {...rest} />
            {long && name === "Olives"
              ? "Olives: black, green, or both, whichever the kitchen has left today."
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
  ...SIZES.flatMap((size) => [make(size, { size, value: [] }), make(`${size} on`, { size })]),
  make("default", {}),
  make("disabled group", { disabled: true }),
  make("one disabled", { one: "disabled", value: ["onions"] }),
  make("one read only", { one: "readonly", value: ["onions"] }),
  make("a box with a size of its own", { one: "own-size", size: "sm" }),
  make("a parent, some ticked", { parent: true }),
  make("a parent, all ticked", { parent: true, value: ["cheese", "olives", "onions"] }),
  make("a parent, none ticked", { parent: true, value: [] }),
  make("a label that wraps", { long: true }),
  make("boxes without rows", { bare: true }),
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

const box = { target: "[data-slot=checkbox]", props };
const row = { target: "label", props };

describe("Checkbox Group in Tailwind CSS v4 against checkbox-group.css", () => {
  test("every size and state matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page, where the box's margin swaps sides", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("hover steps an off box up, on the box or its row", { timeout: 60_000 }, async () => {
    for (const name of ["md", "md on", "one disabled", "one read only", "a parent, some ticked"]) {
      await tw.states(cases, name, "hover", box);
      await tw.states(cases, name, "hover", row);
    }
  });

  test("Glide lights the hovered row", { timeout: 60_000 }, async () => {
    for (const name of ["md", "a grid of rows", "a label that wraps"]) {
      await tw.states(cases, name, "hover", row);
    }
    await tw.states(cases, "md", "hover", { ...row, theme: "dark" });
  });

  test("a held press, on the box or its row, goes deepest and in to 0.97", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["md", "md on", "lg on", "disabled group"]) {
      await tw.states(cases, name, "held", box);
      await tw.states(cases, name, "held", row);
    }
  });

  test("keyboard focus draws the ring", { timeout: 60_000 }, async () => {
    for (const name of ["md on", "a parent, some ticked"]) {
      await tw.states(cases, name, "focus", box);
    }
  });

  test("forced colors match: on is the highlight, disabled is gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
    await tw.states(cases, "md on", "focus", box);
  });

  test("reduced motion matches", { timeout: 60_000 }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.states(cases, "md", "held", box);
  });

  test("more contrast brings the edge back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("transitions are the same: the box, its glyphs, the highlight", async () => {
    await tw.motion(cases, { props });
  });
});

describe("Checkbox Group in Tailwind CSS v4 behaves as in CSS", () => {
  test("the group's size reaches the boxes, and select all ticks every box", async () => {
    tw.load();
    const screen = await render(<Options kit={twind} size="lg" parent value={[]} />);
    const boxes = [...screen.container.querySelectorAll<HTMLElement>("[data-slot=checkbox]")];
    expect(boxes.map((el) => el.getAttribute("data-size"))).toEqual(["lg", "lg", "lg", "lg"]);
    await userEvent.click(screen.getByText("All"));
    expect(boxes.map((el) => el.getAttribute("aria-checked"))).toEqual([
      "true",
      "true",
      "true",
      "true",
    ]);
  });
});

describe("className on Checkbox Group in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(<Options kit={twind} className={OVERRIDES} />);
    const group = screen.container.querySelector("[data-slot=checkbox-group]");
    if (!group) throw new Error("not rendered");
    expectStyles(group, { opacity: "1", fontSize: "14px", columnGap: "0px" });
  });

  test("checkboxGroupVariants() output merges with a className, the user's last", () => {
    const merged = cn(checkboxGroupVariants({ size: "sm" }), "text-lg");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-[0.8125rem]");
  });
});
