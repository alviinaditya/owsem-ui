import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Select as CssSelect } from "../src/components/select/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { Select as TwSelect } from "../src/tailwind/select/index";
import {
  type SelectSize,
  selectPopupVariants,
  selectSlots,
  selectTriggerVariants,
} from "../src/tailwind/select/select-variants";
import {
  type Accepted,
  type Case,
  classNames,
  expectStyles,
  frame,
  measure,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Select in Tailwind CSS v4 (src/tailwind/select, with Glide) against select.css and glide.css. The
// popup renders in a portal; here the portal's container is the side itself, so its parts are
// compared like any other.

const SIZES: SelectSize[] = ["sm", "md", "lg"];
const TRIGGER_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 text-sm gap-0 opacity-100 outline-red-500 cursor-default data-popup-open:bg-green-500";
const POPUP_OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm opacity-100 outline-red-500 duration-300 ease-linear data-ending-style:duration-300 data-starting-style:opacity-100";
const ITEM_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 font-bold gap-0 cursor-default data-disabled:opacity-100 focus-visible:outline-red-500";

const FOCUS_GUARDS: Accepted = {
  what: /^box [xy]$/,
  part: / span$/,
  reason: "Base UI's focus guards are fixed with no offsets, so they sit in each side's own box.",
};
const candidates = classNames(
  ...Object.values(selectSlots),
  ...Object.values(glideSlots),
  ...SIZES.flatMap((size) => [selectTriggerVariants({ size }), selectPopupVariants({ size })]),
  TRIGGER_OVERRIDES,
  POPUP_OVERRIDES,
  ITEM_OVERRIDES,
  "data-starting-style:bg-green-500 data-selected:text-green-500",
);
const tw = tailwindParity(candidates, [FOCUS_GUARDS]);
// Glide appears at the size its item had when the popup opened, then scales to the hovered one:
// the end box is the same, as `box` says, but the height and the scale split it differently.
const twAlone = tailwindParity(candidates, [
  FOCUS_GUARDS,
  {
    what: /^(height|bottom|transform|border\w*Radius)$/,
    part: / glide$/,
    reason: "Glide's highlight is a size and a scale that depend on where it first appeared.",
  },
]);
const twMotion = tailwindParity(candidates, [
  FOCUS_GUARDS,
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

// What the select's parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "overflowY",
  "maxWidth",
  "maxHeight",
  "minWidth",
  "scrollPaddingTop",
  "scrollbarWidth",
  "overscrollBehaviorY",
  "marginInlineStart",
  "marginInlineEnd",
  "paddingInlineStart",
  "paddingInlineEnd",
  "transformOrigin",
  "textOverflow",
  "textAlign",
  "visibility",
  "forcedColorAdjust",
  "borderStartStartRadius",
  "borderEndEndRadius",
  "animationName",
  "animationDuration",
  "animationTimingFunction",
  "transitionProperty",
  "transitionDuration",
  "transitionTimingFunction",
  "transitionDelay",
];
// The check's pop in an indicator's child is a part of its own.
const pseudo = PSEUDO;

const NO_COLLISION = { side: "none", align: "none", fallbackAxisSide: "none" } as const;

interface Kit {
  Select: typeof CssSelect;
}
const css: Kit = { Select: CssSelect };
const twind: Kit = { Select: TwSelect };

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "a-very-long-name", label: "A very, very long fruit name that is cut at the end" },
];

const Dot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

interface SelProps {
  kit: Kit;
  size?: SelectSize;
  dir?: "ltr" | "rtl";
  /** Draws the popup, in the box around it. */
  open?: boolean;
  /** Over the trigger (data-side="none"), not beside it. */
  overlay?: boolean;
  multiple?: boolean;
  value?: string | null;
  label?: boolean;
  disabled?: boolean;
  invalid?: "data" | "aria";
  placeholder?: boolean;
  width?: number;
  many?: boolean;
  groups?: boolean;
  triggerClassName?: string;
  popupClassName?: string;
  itemClassName?: string;
}

/** A Select; open, its portal is the box around it, so each side owns its popup. */
function Sel({
  kit,
  size,
  dir = "ltr",
  open,
  overlay,
  multiple,
  value = "apple",
  label,
  disabled,
  invalid,
  placeholder,
  width,
  many,
  groups,
  triggerClassName,
  popupClassName,
  itemClassName,
}: SelProps): ReactElement {
  const { Select } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const items = many
    ? Array.from({ length: 30 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }))
    : FRUITS;
  const picked = multiple ? [value ?? "apple"] : placeholder ? null : value;
  const invalidProps =
    invalid === "data"
      ? { "data-invalid": "" }
      : invalid === "aria"
        ? { "aria-invalid": true }
        : {};
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ position: "relative", blockSize: open ? 330 : undefined }}>
        {host ? (
          <Select.Root
            items={items}
            size={size}
            defaultValue={picked as never}
            multiple={multiple as never}
            disabled={disabled}
            modal={false}
            {...(open ? { open: true } : {})}
          >
            {label ? <Select.Label>Fruit</Select.Label> : null}
            <div style={{ inlineSize: width }}>
              <Select.Trigger
                aria-label="Fruit"
                placeholder="Pick a fruit"
                className={triggerClassName}
                style={width ? { inlineSize: "100%" } : undefined}
                {...invalidProps}
              />
            </div>
            <Select.Portal container={host}>
              <Select.Positioner
                side="bottom"
                alignItemWithTrigger={Boolean(overlay)}
                collisionAvoidance={NO_COLLISION}
              >
                <Select.Popup className={popupClassName} finalFocus={false}>
                  <Select.ScrollUpArrow keepMounted />
                  <Select.List style={many ? { maxBlockSize: 150 } : undefined}>
                    {groups ? (
                      <>
                        <Select.Group>
                          <Select.GroupLabel>Fruits</Select.GroupLabel>
                          {items.slice(0, 2).map((item) => (
                            <Select.Item
                              key={item.value}
                              value={item.value}
                              className={itemClassName}
                              disabled={item.value === "banana"}
                            >
                              <Dot />
                              <Select.ItemText>{item.label}</Select.ItemText>
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Group>
                        <Select.Separator />
                        {items.slice(2).map((item) => (
                          <Select.Item
                            key={item.value}
                            value={item.value}
                            className={itemClassName}
                          >
                            {item.label}
                          </Select.Item>
                        ))}
                      </>
                    ) : (
                      items.map((item) => (
                        <Select.Item
                          key={item.value}
                          value={item.value}
                          className={itemClassName}
                          disabled={item.value === "banana"}
                        >
                          {item.label}
                        </Select.Item>
                      ))
                    )}
                  </Select.List>
                  <Select.ScrollDownArrow keepMounted />
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, sel: Omit<SelProps, "kit">): Case => ({
  name,
  css: <Sel kit={css} {...sel} />,
  tw: <Sel kit={twind} {...sel} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(`closed ${size}`, { size })),
  make("closed", {}),
  make("closed, placeholder", { placeholder: true }),
  make("closed, label", { label: true }),
  make("closed, long value", { value: "a-very-long-name", width: 160 }),
  make("closed, stretched", { width: 340 }),
  make("closed, disabled", { disabled: true }),
  make("closed, invalid", { invalid: "data" }),
  make("closed, aria-invalid", { invalid: "aria" }),
  make("closed, a user's class", { triggerClassName: "px-8 rounded-none" }),
  ...SIZES.map((size) => make(`open ${size}`, { size, open: true })),
  make("open", { open: true }),
  make("open, placeholder", { open: true, placeholder: true }),
  make("open, groups", { open: true, groups: true }),
  make("open, groups, sm", { open: true, groups: true, size: "sm" }),
  make("open, scrolls", { open: true, many: true, value: "v12" }),
  make("open, multiple", { open: true, multiple: true }),
  make("open, invalid", { open: true, invalid: "data" }),
  make("open, over the trigger", { open: true, overlay: true }),
  make("open, over the trigger, sm", { open: true, overlay: true, size: "sm" }),
  make("open, over the trigger, lg", { open: true, overlay: true, size: "lg" }),
  make("open, long value", { open: true, value: "a-very-long-name", width: 160 }),
  make("open, a user's class", {
    open: true,
    triggerClassName: "px-8",
    popupClassName: "p-0",
    itemClassName: "px-8",
  }),
  make("starting", { open: true }),
  make("ending", { open: true }),
  make("instant", { open: true }),
  make("ending and instant", { open: true }),
];

// The states Base UI sets on the popup, put on by hand: the transitions are frozen. The list is
// given the class Base UI adds to a list with arrows when the app turns style elements off.
const mark = async (side: Element, clean = true) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  // The flavor that is not drawn (see `acted`).
  if (!side.firstElementChild?.firstElementChild) return;
  if (!name.startsWith("open") && !/^(starting|ending|instant)/.test(name)) return;
  const popup = () => side.querySelector("[data-slot=select-popup]");
  // Floating UI places the popup after it mounts.
  await vi.waitFor(() => expect(popup()).not.toBeNull(), { timeout: 5000 });
  await frame();
  await frame();
  const el = popup();
  if (name.startsWith("starting")) el?.setAttribute("data-starting-style", "");
  if (name.startsWith("ending")) el?.setAttribute("data-ending-style", "");
  if (name.endsWith("instant")) el?.setAttribute("data-instant", "");
  else el?.removeAttribute("data-instant");
  if (name.includes("scrolls")) {
    side.querySelector("[data-slot=select-list]")?.classList.add("base-ui-disable-scrollbar");
  }
  await frame();
  await frame();
  expect(popup(), name).toBe(el);
  // Base UI focuses the popup it opened last, which draws the browser's focus ring in forced colors.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  if (!clean) return;
  // And lights and places Glide's highlight on the selected item, as it does for the last popup only.
  for (const lit of side.querySelectorAll("[data-glide-active]")) {
    lit.removeAttribute("data-glide-active");
  }
  for (const name of ["data-visible", "style"]) {
    side.querySelector("[data-slot=glide]")?.removeAttribute(name);
  }
  await frame();
};

const run = { props, pseudo, prepare: mark };
// Glide's highlight stays where the open popup put it.
const keep = { props, pseudo, prepare: (side: Element) => mark(side, false) };
const trigger = { ...run, target: "[data-slot=select-trigger]" };
// The selected item, which Base UI focuses on open and Glide lights.
const SELECTED = "[role=option][aria-selected=true]";

/** An element focused as a keyboard user does. */
async function focusVisible(side: Element, selector: string): Promise<void> {
  const el = side.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`no ${selector}`);
  await userEvent.keyboard("{Shift}");
  el.focus();
  await frame();
  if (!el.matches(":focus-visible")) throw new Error("the element did not get keyboard focus");
}

// The room Base UI finds depends on where each mount lands; the side by side tests compare it.
const alone = props.filter((name) => name !== "maxHeight");

/**
 * A case with `act` done on each flavor, mounted alone: Base UI focuses the popup it opened last,
 * and Glide lights the selected item for it, so side by side they would not start alike.
 */
async function acted(
  name: string,
  act: (side: Element) => Promise<void>,
  options: typeof run & { theme?: "light" | "dark"; dir?: "ltr" | "rtl" } = keep,
): Promise<void> {
  const one = cases.find((c) => c.name === name) as Case;
  const taken = [];
  for (const flavor of ["css", "tw"] as const) {
    const only: Case = {
      name,
      css: flavor === "css" ? one.css : <div />,
      tw: flavor === "tw" ? one.tw : <div />,
    };
    const screen = await twAlone.mount([only], options);
    const side = screen.container.querySelector(`[data-side=${flavor}]`) as Element;
    await act(side);
    taken.push(measure(side, alone, pseudo));
  }
  twAlone.expectParts(name, taken[0] ?? [], taken[1] ?? []);
}

/** A real hover on the element, and the pointer back to a corner nothing is drawn in. */
const hoverOn = (selector: string) => async (side: Element) => {
  const el = side.querySelector(selector) as Element;
  await userEvent.hover(el);
  await frame();
  await frame();
  if (!el.matches(":hover")) throw new Error("the element is not :hover");
};

describe("Select in Tailwind CSS v4 against select.css", () => {
  test("every size, trigger, popup, and item matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the icon margins swap sides", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the outline is drawn, a disabled field and item are gray", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast: the trigger's edge and the popup's ring come back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("reduced motion: it fades, without growing", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("transitions are the same: 180 ms in, 140 ms out after a beat, none when instant", async () => {
    await twMotion.motion(cases, { prepare: mark });
    await setMedia("reduced-motion");
    await twMotion.motion(cases, { prepare: mark });
  });

  test("an invalid trigger shakes once, and blinks when motion is reduced", async () => {
    const armed = (side: Element) => {
      side.querySelector("[data-slot=select-trigger]")?.setAttribute("data-armed", "");
    };
    const only = cases.filter((c) => c.name.startsWith("closed") && c.name.includes("invalid"));
    await twMotion.motion(only, { prepare: armed });
    await tw.parity(only, { ...run, prepare: armed });
    await setMedia("reduced-motion");
    await twMotion.motion(only, { prepare: armed });
    // A form re-plays it with data-shake="off", which stops it.
    const off = (side: Element) => {
      const el = side.querySelector("[data-slot=select-trigger]");
      el?.setAttribute("data-armed", "");
      el?.setAttribute("data-shake", "off");
    };
    await twMotion.motion(only, { prepare: off });
  });

  test("a hovered trigger deepens its tint", async () => {
    await tw.states(cases, "closed", "hover", trigger);
    await tw.states(cases, "closed", "hover", { ...trigger, theme: "dark" });
    await tw.states(cases, "closed, invalid", "hover", trigger);
    await tw.states(cases, "closed, disabled", "hover", trigger);
    await tw.states(cases, "open", "hover", trigger);
    await tw.states(cases, "open, invalid", "hover", trigger);
  });

  test("keyboard focus draws the ring outside the trigger", { timeout: 60_000 }, async () => {
    await tw.states(cases, "closed", "focus", trigger);
    await tw.states(cases, "closed, invalid", "focus", trigger);
    await tw.states(cases, "closed lg", "focus", trigger);
    await setMedia("forced-colors");
    await tw.states(cases, "closed", "focus", trigger);
    await tw.states(cases, "closed", "hover", trigger);
  });

  test("a hovered item matches, and Glide lights it", { timeout: 60_000 }, async () => {
    const hover = hoverOn(SELECTED);
    await acted("open, groups", hover);
    await acted("open, groups", hover, { ...keep, theme: "dark" });
    await acted("open, groups", hover, { ...keep, dir: "rtl" });
    await setMedia("forced-colors");
    await acted("open, groups", hover);
  });

  test("keyboard focus draws the ring inside the item", { timeout: 60_000 }, async () => {
    const focusItem = async (side: Element) => focusVisible(side, SELECTED);
    await acted("open, groups", focusItem);
    await acted("open, groups", focusItem, { ...keep, theme: "dark" });
    await setMedia("forced-colors");
    await acted("open, groups", focusItem);
  });
});

describe("Select in Tailwind CSS v4 behaves as in CSS", () => {
  test("Glide lights the hovered item, and the tree holds no class of the CSS flavor", async () => {
    tw.load();
    const screen = await render(<Sel kit={twind} open />);
    await expect.poll(() => screen.container.querySelectorAll("[role=option]").length).toBe(4);
    const items = [...screen.container.querySelectorAll<HTMLElement>("[role=option]")];
    const list = screen.container.querySelector<HTMLElement>("[data-slot=select-list]");
    const highlight = screen.container.querySelector<HTMLElement>("[data-slot=glide]");
    if (!list || !highlight) throw new Error("not rendered");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    list.removeAttribute("data-glide");
    expect(getComputedStyle(list).position).toBe("relative");
    expect(getComputedStyle(list).isolation).toBe("isolate");
    await userEvent.hover(items[2] as Element);
    await expect.poll(() => items[2]?.hasAttribute("data-glide-active")).toBe(true);
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
      el.className.split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(10);
  });
});

describe("className on Select in Tailwind CSS v4", () => {
  const rendered = async (props: Partial<SelProps>) => {
    tw.load();
    const screen = await render(<Sel kit={twind} {...props} />);
    await vi.waitFor(
      () => expect(screen.container.querySelector("[data-slot=select-trigger]")).not.toBeNull(),
      { timeout: 5000 },
    );
    return screen.container;
  };

  test("a user's utilities beat the component's, on the trigger", async () => {
    const root = await rendered({ triggerClassName: TRIGGER_OVERRIDES });
    const trigger = root.querySelector("[data-slot=select-trigger]");
    if (!trigger) throw new Error("not rendered");
    expectStyles(trigger, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontSize: "14px",
      columnGap: "0px",
      cursor: "default",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("on the popup", async () => {
    const root = await rendered({ open: true, popupClassName: POPUP_OVERRIDES });
    await vi.waitFor(() => expect(root.querySelector("[data-slot=select-popup]")).not.toBeNull(), {
      timeout: 5000,
    });
    expectStyles(root.querySelector("[data-slot=select-popup]") as Element, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("and on an item", async () => {
    const root = await rendered({ open: true, itemClassName: ITEM_OVERRIDES });
    await vi.waitFor(() => expect(root.querySelector("[role=option]")).not.toBeNull(), {
      timeout: 5000,
    });
    expectStyles(root.querySelector("[role=option]") as Element, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
      columnGap: "0px",
      cursor: "default",
    });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    const root = await rendered({ triggerClassName: "data-popup-open:bg-green-500", open: true });
    const trigger = root.querySelector("[data-slot=select-trigger]") as Element;
    await expect.poll(() => trigger.hasAttribute("data-popup-open")).toBe(true);
    expectStyles(trigger, { backgroundColor: "oklch(0.723 0.219 149.579)" });
  });

  test("the trigger's, popup's, and item's classes merge with a className, the user's last", () => {
    const trigger = cn(selectTriggerVariants({ size: "sm" }), "px-8 rounded-none text-lg gap-0");
    for (const gone of ["px-(--px)", "rounded-(--ow-radius)", "text-[0.8125rem]", "gap-[0.5em]"]) {
      expect(trigger.split(" "), gone).not.toContain(gone);
    }
    const popup = cn(selectPopupVariants({ size: "lg" }), "rounded-none text-sm shadow-none");
    for (const gone of [
      "rounded-(--ow-radius)",
      "text-[1rem]",
      "shadow-(shadow:--_popup-shadow)",
    ]) {
      expect(popup.split(" "), gone).not.toContain(gone);
    }
    const item = cn(selectSlots.item, "px-8 py-1 rounded-none text-red-500 gap-0");
    for (const gone of ["px-(--px)", "py-(--_py)", "rounded-(--_inner)", "text-(color:--_fg)"]) {
      expect(item.split(" "), gone).not.toContain(gone);
    }
  });
});
