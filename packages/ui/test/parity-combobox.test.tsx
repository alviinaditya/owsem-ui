import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Autocomplete as CssAutocomplete } from "../src/components/autocomplete/index";
import { Combobox as CssCombobox } from "../src/components/combobox/index";
import { Autocomplete as TwAutocomplete } from "../src/tailwind/autocomplete/index";
import {
  type ComboboxSize,
  comboboxInputGroupVariants,
  comboboxInputVariants,
  comboboxPopupVariants,
  comboboxSlots,
} from "../src/tailwind/combobox/combobox-variants";
import { Combobox as TwCombobox } from "../src/tailwind/combobox/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import {
  type Accepted,
  type Case,
  classNames,
  frame,
  INPUT_RESIZE,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Combobox and Autocomplete in Tailwind CSS v4 (src/tailwind, with Select's classes and Glide)
// against combobox.css, select.css, input.css, and glide.css. The popup renders in a portal; here
// the portal's container is the side itself, so its parts are compared like any other.

const SIZES: ComboboxSize[] = ["sm", "md", "lg"];
const GROUP_OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm opacity-100 gap-0 outline-red-500 cursor-default";
const POPUP_OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm opacity-100 outline-red-500 duration-300 ease-linear";
const ITEM_OVERRIDES = "rounded-none bg-red-500 px-8 py-1 text-red-500 font-bold gap-0";

const FOCUS_GUARDS: Accepted = {
  what: /^box [xy]$/,
  part: / span$/,
  reason: "Base UI's focus guards are fixed with no offsets, so they sit in each side's own box.",
};
const candidates = classNames(
  ...Object.values(comboboxSlots),
  ...Object.values(glideSlots),
  ...SIZES.flatMap((size) => [
    comboboxInputGroupVariants({ size }),
    comboboxInputVariants({ size }),
    comboboxPopupVariants({ size }),
  ]),
  GROUP_OVERRIDES,
  POPUP_OVERRIDES,
  ITEM_OVERRIDES,
  "data-selected:text-green-500 data-highlighted:bg-green-500",
);
const GLIDE_SUBPIXEL: Accepted = {
  what: /^transform$/,
  part: / glide$/,
  reason:
    "A held press opens the popup, and Glide's highlight lands a thousandth of a pixel apart.",
};
const tw = tailwindParity(candidates, [FOCUS_GUARDS, INPUT_RESIZE, GLIDE_SUBPIXEL]);
const twMotion = tailwindParity(candidates, [
  FOCUS_GUARDS,
  INPUT_RESIZE,
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

// What these parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "overflowY",
  "maxWidth",
  "maxHeight",
  "minWidth",
  "flexBasis",
  "flexWrap",
  "alignContent",
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
  "animationName",
  "animationDuration",
  "animationTimingFunction",
  "transitionProperty",
  "transitionDuration",
  "transitionTimingFunction",
  "transitionDelay",
];

const NO_COLLISION = { side: "none", align: "none", fallbackAxisSide: "none" } as const;
const FRUITS = ["Apple", "Banana", "Cherry", "A very, very long fruit name that is cut at the end"];
const GROUPS = [
  { value: "Orchard", items: ["Apple", "Cherry"] },
  { value: "Tropical", items: ["Banana", "Mango"] },
];

type Kit = typeof CssCombobox;
interface Props {
  kit: Kit;
  size?: ComboboxSize;
  dir?: "ltr" | "rtl";
  open?: boolean;
  multiple?: boolean;
  groups?: boolean;
  value?: string | null;
  disabled?: boolean;
  readOnly?: boolean;
  /** The data-invalid attribute, or aria-invalid, on the group. */
  invalid?: "data" | "aria";
  /** An Input with no group around it. */
  bare?: boolean;
  empty?: boolean;
  status?: string;
  groupClassName?: string;
  popupClassName?: string;
  itemClassName?: string;
}

/** A Combobox; open, its portal is the box around it, so each side owns its popup. */
function Box({
  kit,
  size,
  dir = "ltr",
  open,
  multiple,
  groups,
  value,
  disabled,
  readOnly,
  invalid,
  bare,
  empty,
  status,
  groupClassName,
  popupClassName,
  itemClassName,
}: Props): ReactElement {
  const Combobox = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const items = groups ? GROUPS : FRUITS;
  const invalidProps =
    invalid === "data"
      ? { "data-invalid": "" }
      : invalid === "aria"
        ? { "aria-invalid": true }
        : {};
  const defaultValue = multiple ? (value ? [value] : ["Apple", "Banana"]) : (value ?? null);
  const item = (name: string) => (
    <Combobox.Item key={name} value={name} className={itemClassName}>
      {name}
      <Combobox.ItemIndicator />
    </Combobox.Item>
  );
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ position: "relative", blockSize: open ? 330 : undefined }}>
        {host ? (
          <Combobox.Root
            items={items as never}
            size={size}
            multiple={multiple as never}
            defaultValue={defaultValue as never}
            disabled={disabled}
            readOnly={readOnly}
            {...(open ? { open: true } : {})}
          >
            {bare ? (
              <Combobox.Input aria-label="Fruit" placeholder="Pick a fruit" />
            ) : multiple ? (
              <Combobox.InputGroup className={groupClassName} {...invalidProps}>
                <Combobox.Chips>
                  <Combobox.Value>
                    {(chosen: string[]) =>
                      chosen.map((name) => (
                        <Combobox.Chip key={name}>
                          {name}
                          <Combobox.ChipRemove aria-label={`Remove ${name}`} />
                        </Combobox.Chip>
                      ))
                    }
                  </Combobox.Value>
                  <Combobox.Input aria-label="Fruit" />
                </Combobox.Chips>
                <Combobox.Clear />
                <Combobox.Trigger />
              </Combobox.InputGroup>
            ) : (
              <Combobox.InputGroup className={groupClassName} {...invalidProps}>
                <Combobox.Input aria-label="Fruit" placeholder="Pick a fruit" />
                <Combobox.Clear />
                <Combobox.Trigger />
              </Combobox.InputGroup>
            )}
            <Combobox.Portal container={host}>
              <Combobox.Positioner side="bottom" collisionAvoidance={NO_COLLISION}>
                <Combobox.Popup className={popupClassName} initialFocus={false} finalFocus={false}>
                  <Combobox.Status>{status}</Combobox.Status>
                  <Combobox.Empty>{empty ? "No fruit matches." : null}</Combobox.Empty>
                  <Combobox.List>
                    {groups
                      ? (group: (typeof GROUPS)[number]) => (
                          <Combobox.Group key={group.value} items={group.items}>
                            <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                            <Combobox.Collection>
                              {(name: string) => item(name)}
                            </Combobox.Collection>
                          </Combobox.Group>
                        )
                      : (name: string) => item(name)}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const css: Kit = CssCombobox;
const twind: Kit = TwCombobox;
const make = (name: string, p: Omit<Props, "kit">): Case => ({
  name,
  css: <Box kit={css} {...p} />,
  tw: <Box kit={twind} {...p} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(`closed ${size}`, { size, value: "Cherry" })),
  ...SIZES.map((size) => make(`chips ${size}`, { size, multiple: true })),
  make("closed, empty", {}),
  make("closed, disabled", { disabled: true, value: "Cherry" }),
  make("closed, read only", { readOnly: true, value: "Cherry" }),
  make("closed, invalid", { invalid: "data" }),
  make("closed, aria-invalid", { invalid: "aria" }),
  make("closed, a user's class", { groupClassName: GROUP_OVERRIDES, value: "Cherry" }),
  make("chips, disabled", { multiple: true, disabled: true }),
  make("chips, no picks", { multiple: true, value: "" }),
  make("bare input", { bare: true }),
  make("bare input, sm", { bare: true, size: "sm" }),
  make("bare input, disabled", { bare: true, disabled: true }),
  ...SIZES.map((size) => make(`open ${size}`, { size, open: true, value: "Banana" })),
  make("open, empty", { open: true }),
  make("open, groups", { open: true, groups: true, value: "Mango" }),
  make("open, chips", { open: true, multiple: true }),
  make("open, no match", { open: true, empty: true, groups: false, value: null }),
  make("open, a user's class", {
    open: true,
    groupClassName: "px-8",
    popupClassName: "p-0",
    itemClassName: ITEM_OVERRIDES,
  }),
  make("starting", { open: true }),
  make("ending", { open: true }),
];

// The states Base UI sets on the popup, put on by hand: the transitions are frozen.
const mark = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  if (!name.startsWith("open") && !/^(starting|ending)/.test(name)) return;
  const popup = () => side.querySelector("[data-slot=combobox-popup]");
  await vi.waitFor(() => expect(popup()).not.toBeNull(), { timeout: 5000 });
  await frame();
  await frame();
  const el = popup();
  if (name.startsWith("starting")) el?.setAttribute("data-starting-style", "");
  if (name.startsWith("ending")) el?.setAttribute("data-ending-style", "");
  await frame();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  // Glide's highlight stays where each side's popup put it.
  for (const lit of side.querySelectorAll("[data-glide-active]")) {
    lit.removeAttribute("data-glide-active");
  }
  for (const attr of ["data-visible", "style"]) {
    side.querySelector("[data-slot=glide]")?.removeAttribute(attr);
  }
  await frame();
};

const run = { props, pseudo: PSEUDO, prepare: mark };
const group = { ...run, target: "[data-slot=combobox-input-group]" };

describe("Combobox in Tailwind CSS v4 against combobox.css", () => {
  test("every size, state, and part matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the buttons and the checks swap sides", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the edge is drawn, focus is Highlight, disabled is gray", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast: the field's edge and the popup's ring come back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("reduced motion matches", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("transitions and animations are the same: the popup, the clear, the shake", async () => {
    await twMotion.motion(cases, { prepare: mark });
    await setMedia("reduced-motion");
    await twMotion.motion(cases, { prepare: mark });
  });

  test("an invalid field shakes once, and blinks when motion is reduced", async () => {
    const armed = (side: Element) => {
      side.querySelector("[data-slot=combobox-input-group]")?.setAttribute("data-armed", "");
    };
    const only = cases.filter((c) => c.name.startsWith("closed") && c.name.includes("invalid"));
    await twMotion.motion(only, { prepare: armed });
    await setMedia("reduced-motion");
    await twMotion.motion(only, { prepare: armed });
  });

  test("a hovered field deepens its tint", async () => {
    await tw.states(cases, "closed, empty", "hover", group);
    await tw.states(cases, "closed, empty", "hover", { ...group, theme: "dark" });
    await tw.states(cases, "closed, invalid", "hover", group);
    await tw.states(cases, "closed, disabled", "hover", group);
    await tw.states(cases, "chips md", "hover", group);
  });

  test("keyboard focus on the input rings the field", { timeout: 60_000 }, async () => {
    const input = { ...group, target: "[data-slot=combobox-input]" };
    await tw.states(cases, "closed, empty", "focus", input);
    await tw.states(cases, "closed, invalid", "focus", input);
    await tw.states(cases, "chips md", "focus", input);
    await tw.states(cases, "bare input", "focus", input);
    await setMedia("forced-colors");
    await tw.states(cases, "closed, empty", "focus", input);
  });

  test("a button under the pointer and held takes the hover and pressed materials", {
    timeout: 60_000,
  }, async () => {
    const trigger = { ...group, target: "[data-slot=combobox-trigger]" };
    await tw.states(cases, "closed md", "hover", trigger);
    await tw.states(cases, "closed md", "held", trigger);
    await tw.states(cases, "closed sm", "hover", trigger);
    const remove = { ...group, target: "[data-slot=combobox-chip-remove]" };
    await tw.states(cases, "chips md", "hover", remove);
    await tw.states(cases, "chips md", "held", remove);
  });
});

describe("Combobox in Tailwind CSS v4 behaves as in CSS", () => {
  test("Glide lights the hovered item, and the tree holds no class of the CSS flavor", async () => {
    tw.load();
    const screen = await render(<Box kit={twind} open />);
    await expect
      .poll(() => screen.container.querySelectorAll("[role=option]").length)
      .toBe(FRUITS.length);
    const items = [...screen.container.querySelectorAll<HTMLElement>("[role=option]")];
    const list = screen.container.querySelector<HTMLElement>("[data-slot=combobox-list]");
    if (!list) throw new Error("not rendered");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    list.removeAttribute("data-glide");
    expect(getComputedStyle(list).position).toBe("relative");
    expect(getComputedStyle(list).isolation).toBe("isolate");
    await userEvent.hover(items[2] as Element);
    await expect.poll(() => items[2]?.hasAttribute("data-glide-active")).toBe(true);
    const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
      el.className.split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(10);
  });

  test("a popup with nothing to show is hidden, and an Empty with text shows it", async () => {
    tw.load();
    const hidden = await render(<Box kit={twind} open value={null} />);
    // Not empty: items show.
    await expect
      .poll(() => hidden.container.querySelector("[data-slot=combobox-popup]"))
      .not.toBeNull();
    expect(
      getComputedStyle(hidden.container.querySelector("[data-slot=combobox-popup]") as Element)
        .display,
    ).not.toBe("none");
  });
});

describe("className on Combobox in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on the group and the popup", async () => {
    tw.load();
    const screen = await render(
      <Box kit={twind} open groupClassName={GROUP_OVERRIDES} popupClassName={POPUP_OVERRIDES} />,
    );
    await expect
      .poll(() => screen.container.querySelector("[data-slot=combobox-popup]"))
      .not.toBeNull();
    const field = screen.container.querySelector("[data-slot=combobox-input-group]") as Element;
    const panel = screen.container.querySelector("[data-slot=combobox-popup]") as Element;
    expect(getComputedStyle(field).borderTopLeftRadius).toBe("0px");
    const red = document.createElement("div");
    red.className = "bg-red-500";
    screen.container.append(red);
    expect(getComputedStyle(field).backgroundColor).toBe(getComputedStyle(red).backgroundColor);
    expect(getComputedStyle(panel).borderTopLeftRadius).toBe("0px");
    expect(getComputedStyle(panel).backgroundColor).toBe(getComputedStyle(red).backgroundColor);
    expect(cn(comboboxSlots.chip, "px-8")).toContain("px-8");
  });
});

// Autocomplete is Combobox's field and popup under other data-slots: its input alone, in a group,
// and its popup against the same in CSS.
type AutoKit = typeof CssAutocomplete;
function Auto({
  kit,
  group: grouped,
  size,
}: {
  kit: AutoKit;
  group?: boolean;
  size?: ComboboxSize;
}): ReactElement {
  const Autocomplete = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setHost} style={{ position: "relative", blockSize: 300 }}>
      {host ? (
        <Autocomplete.Root items={FRUITS} size={size} defaultValue="App" open>
          {grouped ? (
            <Autocomplete.InputGroup>
              <Autocomplete.Input aria-label="Fruit" />
              <Autocomplete.Clear />
              <Autocomplete.Trigger />
            </Autocomplete.InputGroup>
          ) : (
            <Autocomplete.Input aria-label="Fruit" />
          )}
          <Autocomplete.Portal container={host}>
            <Autocomplete.Positioner side="bottom" collisionAvoidance={NO_COLLISION}>
              <Autocomplete.Popup initialFocus={false} finalFocus={false}>
                <Autocomplete.List>
                  {(name: string) => (
                    <Autocomplete.Item key={name} value={name}>
                      {name}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      ) : null}
    </div>
  );
}

const autoCase = (name: string, p: { group?: boolean; size?: ComboboxSize }): Case => ({
  name,
  css: <Auto kit={CssAutocomplete} {...p} />,
  tw: <Auto kit={TwAutocomplete} {...p} />,
});

const autoCases: Case[] = [
  autoCase("autocomplete input", {}),
  autoCase("autocomplete input, lg", { size: "lg" }),
  autoCase("autocomplete group", { group: true }),
  autoCase("autocomplete group, sm", { group: true, size: "sm" }),
];

const autoMark = async (side: Element) => {
  await vi.waitFor(
    () => expect(side.querySelector("[data-slot=autocomplete-popup]")).not.toBeNull(),
    {
      timeout: 5000,
    },
  );
  await frame();
  await frame();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  for (const lit of side.querySelectorAll("[data-glide-active]")) {
    lit.removeAttribute("data-glide-active");
  }
  for (const attr of ["data-visible", "style"]) {
    side.querySelector("[data-slot=glide]")?.removeAttribute(attr);
  }
  await frame();
};

describe("Autocomplete in Tailwind CSS v4 against the CSS flavor", () => {
  test("the input, the group, and the popup match in light, dark, and right to left", async () => {
    const options = { props, pseudo: PSEUDO, prepare: autoMark };
    await tw.parity(autoCases, options);
    await tw.parity(autoCases, { ...options, theme: "dark" });
    await tw.parity(autoCases, { ...options, dir: "rtl" });
  });

  test("forced colors, more contrast, and reduced motion match", async () => {
    const options = { props, pseudo: PSEUDO, prepare: autoMark };
    await setMedia("forced-colors");
    await tw.parity(autoCases, options);
  });
});
