import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ToggleGroup as CssToggleGroup } from "../src/components/toggle-group/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { ToggleGroup as TwToggleGroup } from "../src/tailwind/toggle-group/index";
import {
  type ToggleGroupSize,
  toggleGroupSlots,
  toggleGroupVariants,
} from "../src/tailwind/toggle-group/toggle-group-variants";
import {
  type Case,
  classNames,
  expectStyles,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Toggle Group in Tailwind CSS v4 (src/tailwind/toggle-group, with thumb.ts and Glide) against
// toggle-group.css and glide.css.

const SIZES: ToggleGroupSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm gap-0 p-0 opacity-100 outline-red-500 cursor-default duration-300 ease-linear";
const ITEM_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 font-bold gap-0 cursor-default data-pressed:bg-green-500 data-pressed:text-red-500 disabled:opacity-100 focus-visible:outline-red-500";

const tw = tailwindParity(
  classNames(
    ...Object.values(toggleGroupSlots),
    ...Object.values(glideSlots),
    ...SIZES.map((size) => toggleGroupVariants({ size })),
    OVERRIDES,
    ITEM_OVERRIDES,
    "data-pressed:text-green-500 data-pressed:bg-red-500",
  ),
);

// What these parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "translate",
  "transformOrigin",
  "forcedColorAdjust",
  "gridAutoColumns",
  "gridAutoRows",
  "gridAutoFlow",
  "textOverflow",
  "marginInlineStart",
  "marginInlineEnd",
  "paddingInlineStart",
  "paddingInlineEnd",
];
// The key of the thumb, and its press.
const pseudo = [...PSEUDO, "transform", "willChange", "forcedColorAdjust", "borderTopRightRadius"];

type Kit = typeof CssToggleGroup;
const css: Kit = CssToggleGroup;
const twind: Kit = TwToggleGroup;

const Lines = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 6h16M4 12h10M4 18h13" />
  </svg>
);

interface GroupProps {
  kit: Kit;
  size?: ToggleGroupSize;
  value?: string[];
  multiple?: boolean;
  orientation?: "horizontal" | "vertical";
  equal?: boolean;
  disabled?: boolean;
  /** The second item is disabled. */
  one?: boolean;
  items?: "icons" | "both" | "long" | "text";
  className?: string;
  itemClassName?: string;
  /** The group's width, in px. */
  width?: number;
}

function Group({
  kit,
  size,
  value = ["b"],
  multiple,
  orientation,
  equal,
  disabled,
  one,
  items = "text",
  className,
  itemClassName,
  width,
}: GroupProps): ReactElement {
  const { Root, Item } = kit;
  const label = (text: string) => (items === "long" ? `${text} of a long, long label` : text);
  const body = (text: string) =>
    items === "icons" ? (
      <Lines />
    ) : items === "both" ? (
      <>
        <Lines />
        {text}
      </>
    ) : (
      label(text)
    );
  return (
    <Root
      aria-label="Group"
      size={size}
      defaultValue={value}
      multiple={multiple}
      orientation={orientation}
      equal={equal}
      disabled={disabled}
      className={className}
      style={width ? { inlineSize: width } : undefined}
    >
      {["One", "Two", "Three"].map((text, i) => (
        <Item
          key={text}
          value={"abc"[i] as string}
          aria-label={items === "icons" ? text : undefined}
          disabled={one && i === 1 ? true : undefined}
          className={itemClassName}
        >
          {body(text)}
        </Item>
      ))}
    </Root>
  );
}

const make = (name: string, group: Omit<GroupProps, "kit">): Case => ({
  name,
  css: <Group kit={css} {...group} />,
  tw: <Group kit={twind} {...group} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(size, { size })),
  make("default", {}),
  make("none pressed", { value: [] }),
  make("first pressed", { value: ["a"] }),
  make("multiple", { multiple: true, value: ["a", "c"] }),
  make("multiple, none pressed", { multiple: true, value: [] }),
  make("vertical", { orientation: "vertical" }),
  make("vertical, multiple", { orientation: "vertical", multiple: true, value: ["a", "b"] }),
  make("equal", { equal: true, items: "long" }),
  make("equal, stretched", { equal: true, width: 340 }),
  make("equal, vertical", { equal: true, orientation: "vertical", items: "long" }),
  make("disabled group", { disabled: true }),
  make("one disabled", { one: true }),
  make("one disabled and pressed", { one: true, value: ["b"] }),
  make("icon only", { items: "icons" }),
  make("icon only, sm", { items: "icons", size: "sm" }),
  make("icon only, multiple", { items: "icons", multiple: true, value: ["a", "c"] }),
  make("icon and label", { items: "both" }),
  make("a long label, cut", { items: "long", width: 220 }),
  make("lg, vertical", { size: "lg", orientation: "vertical" }),
  make("a user's class", { className: "gap-0 text-sm", itemClassName: "px-8" }),
  {
    name: "in a larger font",
    css: (
      <div style={{ fontSize: 24 }}>
        <Group kit={css} />
      </div>
    ),
    tw: (
      <div style={{ fontSize: 24 }}>
        <Group kit={twind} />
      </div>
    ),
  },
];

// The moment before the script places the thumb: server-rendered HTML has no layout, and the
// pressed item draws its own key.
const beforeThumb = (side: Element) => {
  side.querySelector("[data-slot=toggle-group]")?.removeAttribute("data-thumb");
  side.querySelector("[data-slot=toggle-group-thumb]")?.removeAttribute("data-visible");
};

const item = { target: "[aria-pressed=false]", props, pseudo };
const pressed = { target: "[aria-pressed=true]", props, pseudo };
const run = { props, pseudo };

describe("Toggle Group in Tailwind CSS v4 against toggle-group.css", () => {
  test("every size, layout, and state matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the icon margins swap sides", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("before the thumb is placed, the pressed item draws its own key", async () => {
    await tw.parity(cases, { ...run, prepare: beforeThumb });
    await tw.parity(cases, { ...run, prepare: beforeThumb, theme: "dark" });
  });

  test("Glide lights the hovered item and not the pressed one", { timeout: 60_000 }, async () => {
    for (const name of ["md", "vertical", "multiple", "equal", "icon only", "lg, vertical"]) {
      await tw.states(cases, name, "hover", item);
    }
    await tw.states(cases, "md", "hover", { ...item, theme: "dark" });
    await tw.states(cases, "md", "hover", { ...item, dir: "rtl" });
    await tw.states(cases, "md", "hover", pressed);
  });

  test("a pressed item that Glide lights (a skipped one keeps the mark) keeps its text color", async () => {
    const lit = (side: Element) => {
      for (const el of side.querySelectorAll("button:not(:disabled)")) {
        el.setAttribute("data-glide-active", "");
      }
    };
    await tw.parity(cases, { ...run, prepare: lit });
    await setMedia("forced-colors");
    await tw.parity(cases, { ...run, prepare: lit });
  });

  test("a hovered key with multiple selection moves toward the label color", {
    timeout: 60_000,
  }, async () => {
    for (const name of ["multiple", "vertical, multiple", "icon only, multiple"]) {
      await tw.states(cases, name, "hover", pressed);
      await tw.states(cases, name, "hover", item);
    }
  });

  test("a held press presses the item in, and the thumb with it", { timeout: 60_000 }, async () => {
    for (const name of ["md", "multiple", "vertical", "icon only", "disabled group"]) {
      await tw.states(cases, name, "held", pressed);
      await tw.states(cases, name, "held", item);
    }
  });

  test("keyboard focus draws the ring", { timeout: 60_000 }, async () => {
    for (const name of ["md", "multiple", "icon only", "vertical", "none pressed"]) {
      await tw.states(cases, name, "focus", { ...run, target: "[aria-pressed]" });
    }
  });

  test("forced colors match: pressed is the highlight, disabled is gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, prepare: beforeThumb });
    await tw.states(cases, "md", "hover", item);
    await tw.states(cases, "multiple", "hover", pressed);
    await tw.states(cases, "md", "focus", { ...run, target: "[aria-pressed]" });
    await tw.states(cases, "md", "held", pressed);
  });

  test("reduced motion matches: nothing slides or presses, a held thumb dims", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
    await tw.states(cases, "md", "held", pressed);
    await tw.states(cases, "md", "held", item);
    await tw.states(cases, "md", "hover", item);
  });

  test("more contrast changes nothing", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("transitions are the same: the thumb's travel, the item's colors", async () => {
    await tw.motion(cases, run);
  });

  test("transitions with the thumb's states on: visible, held, instant", async () => {
    const one = cases.filter((c) => c.name === "md");
    for (const flag of ["held", "instant"]) {
      const prepare = (side: Element) => {
        side.querySelector("[data-slot=toggle-group-thumb]")?.setAttribute(`data-${flag}`, "");
      };
      await tw.motion(one, { prepare });
      await tw.parity(one, { ...run, prepare });
    }
    await setMedia("reduced-motion");
    for (const flag of ["held", "instant"]) {
      const prepare = (side: Element) => {
        side.querySelector("[data-slot=toggle-group-thumb]")?.setAttribute(`data-${flag}`, "");
      };
      await tw.motion(one, { prepare });
      await tw.parity(one, { ...run, prepare });
    }
  });

  test("transitions with forced colors, held and instant", async () => {
    await setMedia("forced-colors");
    const one = cases.filter((c) => c.name === "md");
    for (const flag of ["held", "instant"]) {
      const prepare = (side: Element) => {
        side.querySelector("[data-slot=toggle-group-thumb]")?.setAttribute(`data-${flag}`, "");
      };
      await tw.motion(one, { prepare });
    }
  });

  test("a held press lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "md", "held", { ...pressed, props: motion, live: true });
    await tw.states(cases, "md", "held", { ...item, props: motion, live: true });
  });
});

/** An element's box from the corner of its side. */
const boxOf = (side: Element, el: Element): number[] => {
  const a = side.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return [b.x - a.x, b.y - a.y, b.width, b.height];
};
const within = (a: number[], b: number[], tol = 0.02) =>
  a.every((n, i) => Math.abs(n - (b[i] as number)) <= tol);

describe("Toggle Group in Tailwind CSS v4 behaves as in CSS", () => {
  test("the thumb lands on the pressed item, in the same box as in the CSS flavor", {
    timeout: 60_000,
  }, async () => {
    const wanted = ["md", "vertical", "equal", "lg, vertical", "icon only"];
    const screen = await tw.mount(
      cases.filter((c) => wanted.includes(c.name)),
      run,
    );
    for (const name of wanted) {
      const row = screen.container.querySelector(`[data-case="${name}"]`);
      const sides = ["css", "tw"].map((s) => row?.querySelector(`[data-side=${s}]`) as Element);
      const boxes = [];
      for (const side of sides) {
        const thumb = side.querySelector("[data-slot=toggle-group-thumb]") as Element;
        const on = side.querySelector("[aria-pressed=true]") as Element;
        expect(thumb.hasAttribute("data-visible"), name).toBe(true);
        // The thumb reaches 4px past the item: the track's padding, as a clear border.
        const [x, y, w, h] = boxOf(side, thumb) as [number, number, number, number];
        const item = boxOf(side, on) as [number, number, number, number];
        expect(
          within([x + 4, y + 4, w - 8, h - 8], item),
          `${name} ${side.getAttribute("data-side")}`,
        ).toBe(true);
        boxes.push(boxOf(side, thumb));
      }
      expect(within(boxes[0] as number[], boxes[1] as number[]), name).toBe(true);
    }
  });

  test("a click moves the thumb to the new item, where the CSS flavor puts it", async () => {
    const screen = await tw.mount(cases.filter((c) => c.name === "md"));
    const row = screen.container.querySelector('[data-case="md"]');
    const boxes = [];
    for (const flavor of ["css", "tw"]) {
      const side = row?.querySelector(`[data-side=${flavor}]`) as Element;
      const items = [...side.querySelectorAll("button")];
      await userEvent.click(items[2] as Element);
      await expect.poll(() => items[2]?.getAttribute("aria-pressed")).toBe("true");
      await expect
        .poll(() => {
          const thumb = side.querySelector("[data-slot=toggle-group-thumb]") as Element;
          const [x, , w] = boxOf(side, thumb);
          const [ix, , iw] = boxOf(side, items[2] as Element);
          return within([(x as number) + 4, (w as number) - 8], [ix as number, iw as number]);
        })
        .toBe(true);
      boxes.push(boxOf(side, side.querySelector("[data-slot=toggle-group-thumb]") as Element));
    }
    expect(within(boxes[0] as number[], boxes[1] as number[])).toBe(true);
  });

  test("Glide lights the hovered item in the Tailwind flavor", async () => {
    tw.load();
    const screen = await render(<Group kit={twind} />);
    const group = screen.container.querySelector<HTMLElement>("[data-slot=toggle-group]");
    if (!group) throw new Error("not rendered");
    const items = [...group.querySelectorAll("button")];
    const highlight = group.querySelector<HTMLElement>("[data-slot=glide]");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    group.removeAttribute("data-glide");
    expect(getComputedStyle(group).position).toBe("relative");
    expect(getComputedStyle(group).isolation).toBe("isolate");
    await userEvent.hover(items[0] as Element);
    expect(items[0]?.hasAttribute("data-glide-active")).toBe(true);
    expect(highlight?.hasAttribute("data-visible")).toBe(true);
    // The pressed item is not lit.
    await userEvent.hover(items[1] as Element);
    expect(highlight?.hasAttribute("data-visible")).toBe(false);
  });

  test("the rendered Tailwind tree holds no class of the CSS flavor", async () => {
    tw.load();
    const screen = await render(<Group kit={twind} items="long" />);
    const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
      el.className.split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(10);
    expect(screen.container.querySelector("[data-slot=toggle-group-label]")).not.toBeNull();
  });
});

describe("className on Toggle Group in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on the group", async () => {
    tw.load();
    const screen = await render(<Group kit={twind} className={OVERRIDES} />);
    const group = screen.container.querySelector("[data-slot=toggle-group]");
    if (!group) throw new Error("not rendered");
    expectStyles(group, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      columnGap: "0px",
      paddingTop: "0px",
      opacity: "1",
      cursor: "default",
      outlineColor: "oklch(0.637 0.237 25.331)",
      transitionDuration: "0.3s",
    });
  });

  test("a user's utilities beat the component's, on an item", async () => {
    tw.load();
    const screen = await render(<Group kit={twind} itemClassName={ITEM_OVERRIDES} one />);
    const [first, second] = [...screen.container.querySelectorAll("[data-slot=toggle-group-item]")];
    if (!first || !second) throw new Error("not rendered");
    expectStyles(first, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
      columnGap: "0px",
      cursor: "default",
    });
    expectStyles(second, { opacity: "1" });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    tw.load();
    const screen = await render(
      <Group kit={twind} itemClassName="data-pressed:text-green-500 data-pressed:bg-red-500" />,
    );
    const on = screen.container.querySelector("[aria-pressed=true]");
    if (!on) throw new Error("not rendered");
    expectStyles(on, {
      color: "oklch(0.723 0.219 149.579)",
      backgroundColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("toggleGroupVariants() and the slots merge with a className, the user's last", () => {
    const merged = cn(toggleGroupVariants({ size: "sm" }), "rounded-none p-0 text-lg gap-0");
    expect(merged).toContain("text-lg");
    expect(merged).toContain("rounded-none");
    expect(merged).not.toContain("text-[13px]");
    expect(merged.split(" ")).not.toContain("p-(--_inset)");
    expect(merged).not.toContain("gap-[2px]");
    expect(cn(toggleGroupSlots.item, "px-8 rounded-none")).not.toContain("px-(--px)");
    expect(cn(toggleGroupSlots.item, "px-8 rounded-none")).not.toContain("rounded-(--_radius)");
    expect(cn(toggleGroupSlots.thumb, "opacity-100")).not.toContain(" opacity-0");
  });
});
