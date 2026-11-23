import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { ReactElement } from "react";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { CommandMenu as CssCommandMenu } from "../src/components/command-menu/index";
import {
  type CommandMenuSize,
  commandMenuPopupVariants,
  commandMenuSlots,
  commandMenuTriggerVariants,
} from "../src/tailwind/command-menu/command-menu-variants";
import { CommandMenu as TwCommandMenu } from "../src/tailwind/command-menu/index";
import { kbdSlots } from "../src/tailwind/kbd/kbd-variants";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
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

// Command Menu in Tailwind CSS v4 (src/tailwind/command-menu, with Kbd and Glide) against
// command-menu.css and glide.css. The popup renders in a portal; here the portal's container is a
// transformed box inside the side, which fixed boxes then fill, so each side owns its popup.

const SIZES: CommandMenuSize[] = ["sm", "md", "lg"];
const TRIGGER_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 text-sm gap-0 cursor-default outline-red-500";
const POPUP_OVERRIDES = "rounded-none bg-red-500 text-red-500 text-sm outline-red-500";
// No text color: a disabled item's own state wins over a plain utility, as everywhere in this flavor.
const ITEM_OVERRIDES = "rounded-none bg-red-500 px-8 py-1 gap-0";

const FOCUS_GUARDS: Accepted = {
  what: /^box [xy]$/,
  part: / span$/,
  reason: "Base UI's focus guards are fixed with no offsets, so they sit in each side's own box.",
};

const tw = tailwindParity(
  classNames(
    ...Object.values(commandMenuSlots),
    ...Object.values(kbdSlots),
    ...Object.values(glideSlots),
    ...SIZES.flatMap((size) => [
      commandMenuTriggerVariants({ size }),
      commandMenuPopupVariants({ size }),
    ]),
    TRIGGER_OVERRIDES,
    POPUP_OVERRIDES,
    ITEM_OVERRIDES,
    "data-disabled:text-green-500",
  ),
  [FOCUS_GUARDS],
);

// What the command menu's parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "maxWidth",
  "maxHeight",
  "overflowY",
  "overscrollBehaviorY",
  "scrollPaddingTop",
  "scrollbarWidth",
  "marginInlineStart",
  "marginInlineEnd",
  "paddingInlineStart",
  "paddingInlineEnd",
  "borderBlockEndWidth",
  "borderBlockStartWidth",
  "transformOrigin",
  "textOverflow",
  "textAlign",
  "visibility",
  "forcedColorAdjust",
  "backdropFilter",
  "maskImage",
  "clipPath",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
  "inlineSize",
  "blockSize",
];
const pseudo = PSEUDO;

interface Kit {
  CommandMenu: typeof CssCommandMenu;
}
const css: Kit = { CommandMenu: CssCommandMenu };
const twind: Kit = { CommandMenu: TwCommandMenu };

interface Command {
  value: string;
  label: string;
  description?: string;
  shortcut?: string;
  disabled?: boolean;
}

const GROUPS = [
  {
    value: "Pages",
    items: [
      { value: "home", label: "Home", description: "Start here" },
      { value: "settings", label: "Settings", description: "Profile and billing and a long note" },
    ],
  },
  {
    value: "Actions",
    items: [
      { value: "new", label: "New file", shortcut: "⌘N" },
      { value: "theme", label: "Toggle dark mode" },
      { value: "archive", label: "Archive", disabled: true },
    ],
  },
] satisfies { value: string; items: Command[] }[];

const MANY = [
  {
    value: "All",
    items: Array.from({ length: 14 }, (_, i) => ({ value: `c${i}`, label: `Command ${i}` })),
  },
] satisfies { value: string; items: Command[] }[];

const Dot = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

interface MenuProps {
  kit: Kit;
  size?: CommandMenuSize;
  dir?: "ltr" | "rtl";
  /** Draws the popup, in the box around it. */
  open?: boolean;
  /** The box around it is wide, so the popup reaches its own width. */
  wide?: boolean;
  backdrop?: "dim" | "blur";
  items?: "groups" | "none" | "many";
  footer?: boolean;
  triggerClassName?: string;
  popupClassName?: string;
  itemClassName?: string;
}

function Menu({
  kit,
  size,
  dir = "ltr",
  open,
  wide,
  backdrop,
  items = "groups",
  footer = true,
  triggerClassName,
  popupClassName,
  itemClassName,
}: MenuProps): ReactElement {
  const { CommandMenu } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const groups = items === "none" ? [] : items === "many" ? MANY : GROUPS;
  return (
    <DirectionProvider direction={dir}>
      <div
        ref={setHost}
        style={{
          position: "relative",
          transform: "translate(0)",
          blockSize: open ? 540 : undefined,
          inlineSize: wide ? 900 : undefined,
        }}
      >
        <CommandMenu.Root items={groups} shortcut={false} {...(open ? { open: true } : {})}>
          <CommandMenu.Trigger size={size} className={triggerClassName}>
            Search…<CommandMenu.Shortcut aria-hidden="true">⌘K</CommandMenu.Shortcut>
          </CommandMenu.Trigger>
          {host && open ? (
            <CommandMenu.Popup
              aria-label="Commands"
              size={size}
              backdrop={backdrop}
              container={host}
              className={popupClassName}
            >
              <CommandMenu.Input aria-label="Search commands" placeholder="Search…" />
              <CommandMenu.Empty>No results</CommandMenu.Empty>
              <CommandMenu.List>
                {(group: (typeof GROUPS)[number]) => (
                  <CommandMenu.Group key={group.value} items={group.items}>
                    <CommandMenu.GroupLabel>{group.value}</CommandMenu.GroupLabel>
                    <CommandMenu.Collection>
                      {(item: Command) => (
                        <CommandMenu.Item
                          key={item.value}
                          value={item}
                          disabled={item.disabled}
                          className={itemClassName}
                        >
                          <CommandMenu.ItemIcon>
                            <Dot />
                          </CommandMenu.ItemIcon>
                          <CommandMenu.ItemLabel>{item.label}</CommandMenu.ItemLabel>
                          {item.description ? (
                            <CommandMenu.ItemDescription>
                              {item.description}
                            </CommandMenu.ItemDescription>
                          ) : null}
                          {item.shortcut ? (
                            <CommandMenu.Shortcut>{item.shortcut}</CommandMenu.Shortcut>
                          ) : null}
                        </CommandMenu.Item>
                      )}
                    </CommandMenu.Collection>
                  </CommandMenu.Group>
                )}
              </CommandMenu.List>
              {footer ? (
                <CommandMenu.Footer>
                  <span>
                    <CommandMenu.Shortcut>↵</CommandMenu.Shortcut> Run
                  </span>
                  <span>
                    <CommandMenu.Shortcut>↑↓</CommandMenu.Shortcut> Move
                  </span>
                </CommandMenu.Footer>
              ) : null}
            </CommandMenu.Popup>
          ) : null}
        </CommandMenu.Root>
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, menu: Omit<MenuProps, "kit">): Case => ({
  name,
  css: <Menu kit={css} {...menu} />,
  tw: <Menu kit={twind} {...menu} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(`closed ${size}`, { size })),
  make("closed", {}),
  make("closed, a user's class", { triggerClassName: TRIGGER_OVERRIDES }),
  ...SIZES.map((size) => make(`open ${size}`, { size, open: true })),
  make("open", { open: true }),
  make("open, no footer", { open: true, footer: false }),
  make("open, empty", { open: true, items: "none" }),
  make("open, scrolls", { open: true, items: "many" }),
  make("open, scrolled", { open: true, items: "many" }),
  make("open, wide", { open: true, wide: true }),
  make("open, blur", { open: true, backdrop: "blur" }),
  make("open, a user's class", {
    open: true,
    popupClassName: POPUP_OVERRIDES,
    itemClassName: ITEM_OVERRIDES,
  }),
];

/** Waits for the popup, and scrolls the list of the cases that say so. */
const prepare = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  if (!name.startsWith("open")) return;
  await vi.waitFor(
    () => expect(side.querySelector("[data-slot=command-menu-list]")).not.toBeNull(),
    {
      timeout: 5000,
    },
  );
  const list = side.querySelector<HTMLElement>("[data-slot=command-menu-list]");
  if (list && name.includes("scrolled")) {
    list.scrollTop = 60;
    list.dispatchEvent(new Event("scroll"));
  }
  await frame();
  await frame();
};

const run = { props, pseudo, prepare };
const trigger = { ...run, target: "[data-slot=command-menu-trigger]" };

describe("Command Menu in Tailwind CSS v4 against command-menu.css", () => {
  test("every size, trigger, popup, and item matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the icon margins swap sides", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: borders and a disabled item take system colors", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast: the trigger's edge and the popup's ring come back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("reduced motion matches", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("transitions are the same: only the trigger's color moves", async () => {
    await tw.motion(cases, run);
  });

  test("a hovered trigger deepens its tint", async () => {
    await tw.states(cases, "closed", "hover", trigger);
    await tw.states(cases, "closed", "hover", { ...trigger, theme: "dark" });
    await tw.states(cases, "closed lg", "hover", trigger);
  });

  test("keyboard focus draws the ring outside the trigger", async () => {
    await tw.states(cases, "closed", "focus", trigger);
    await tw.states(cases, "closed sm", "focus", trigger);
    await setMedia("forced-colors");
    await tw.states(cases, "closed", "focus", trigger);
  });

  test("the close button shows only while focused", async () => {
    const focusClose = async (side: Element) => {
      await prepare(side);
      const close = side.querySelector<HTMLElement>("[data-slot=command-menu-close]");
      if (!close) throw new Error("no close button");
      await userEvent.keyboard("{Shift}");
      close.focus();
      await frame();
      expect(close.matches(":focus-visible")).toBe(true);
    };
    const screen = await tw.mount(
      cases.filter((c) => c.name === "open"),
      run,
    );
    const row = screen.container.querySelector('[data-case="open"]');
    const taken = [];
    for (const flavor of ["css", "tw"]) {
      const side = row?.querySelector(`[data-side=${flavor}]`) as Element;
      await focusClose(side);
      taken.push(measure(side, props, pseudo));
    }
    tw.expectParts("close focused", taken[0] ?? [], taken[1] ?? []);
  });
});

describe("Command Menu in Tailwind CSS v4 behaves as in CSS", () => {
  const open = async () => {
    tw.load();
    const screen = await render(<Menu kit={twind} open />);
    await expect
      .poll(() => screen.container.querySelectorAll("[role=option]").length, { timeout: 5000 })
      .toBe(5);
    return screen.container;
  };

  test("Glide lights the item Base UI highlights, from the pointer and the keyboard", async () => {
    const root = await open();
    const list = root.querySelector<HTMLElement>("[data-slot=command-menu-list]");
    const highlight = root.querySelector<HTMLElement>("[data-slot=glide]");
    if (!list || !highlight) throw new Error("not rendered");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    list.removeAttribute("data-glide");
    expect(getComputedStyle(list).position).toBe("relative");
    expect(getComputedStyle(list).isolation).toBe("isolate");
    const options = [...root.querySelectorAll<HTMLElement>("[role=option]")];
    await userEvent.hover(options[1] as Element);
    await expect.poll(() => options[1]?.hasAttribute("data-glide-active")).toBe(true);
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => options[2]?.hasAttribute("data-glide-active")).toBe(true);
    expect(highlight.hasAttribute("data-visible")).toBe(true);
  });

  test("the rendered Tailwind tree holds no class of the CSS flavor", async () => {
    const root = await open();
    const classes = [...root.querySelectorAll("[class]")].flatMap((el) =>
      (el.getAttribute("class") ?? "").split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(20);
    expect(root.querySelector("[data-slot=command-menu-shortcut]")).not.toBeNull();
  });
});

describe("className on Command Menu in Tailwind CSS v4", () => {
  const rendered = async (props: Partial<MenuProps>) => {
    tw.load();
    const screen = await render(<Menu kit={twind} {...props} />);
    if (props.open) {
      await expect
        .poll(() => screen.container.querySelector("[data-slot=command-menu-item]"), {
          timeout: 5000,
        })
        .not.toBeNull();
    }
    return screen.container;
  };

  test("a user's utilities beat the component's, on the trigger", async () => {
    const trigger = (await rendered({ triggerClassName: TRIGGER_OVERRIDES })).querySelector(
      "[data-slot=command-menu-trigger]",
    );
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
    const popup = (await rendered({ open: true, popupClassName: POPUP_OVERRIDES })).querySelector(
      "[data-slot=command-menu-popup]",
    );
    if (!popup) throw new Error("not rendered");
    expectStyles(popup, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("and on an item", async () => {
    const item = (await rendered({ open: true, itemClassName: ITEM_OVERRIDES })).querySelector(
      "[data-slot=command-menu-item]",
    );
    if (!item) throw new Error("not rendered");
    expectStyles(item, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      columnGap: "0px",
    });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    const root = await rendered({ open: true, itemClassName: "data-disabled:text-green-500" });
    const disabled = root.querySelector("[data-slot=command-menu-item][data-disabled]");
    if (!disabled) throw new Error("not rendered");
    expectStyles(disabled, { color: "oklch(0.723 0.219 149.579)" });
  });

  test("the trigger's, popup's, and item's classes merge with a className, the user's last", () => {
    const trigger = cn(commandMenuTriggerVariants({ size: "sm" }), "px-8 rounded-none text-lg");
    for (const gone of ["px-(--px)", "rounded-(--ow-radius)", "text-[13px]"]) {
      expect(trigger.split(" "), gone).not.toContain(gone);
    }
    const popup = cn(commandMenuPopupVariants({ size: "lg" }), "rounded-none text-sm");
    for (const gone of ["rounded-(--ow-radius)", "text-[16px]"]) {
      expect(popup.split(" "), gone).not.toContain(gone);
    }
    const item = cn(commandMenuSlots.item, "px-8 py-1 rounded-none text-red-500 gap-0");
    for (const gone of ["px-(--px)", "py-(--_py)", "rounded-(--_radius)", "text-(color:--ow-fg)"]) {
      expect(item.split(" "), gone).not.toContain(gone);
    }
  });
});
