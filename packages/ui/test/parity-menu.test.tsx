import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Kbd as CssKbd } from "../src/components/kbd/index";
import { Menu as CssMenu } from "../src/components/menu/index";
import { Kbd as TwKbd } from "../src/tailwind/kbd/index";
import { kbdSlots } from "../src/tailwind/kbd/kbd-variants";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { Menu as TwMenu } from "../src/tailwind/menu/index";
import { type MenuSize, menuPopupVariants, menuSlots } from "../src/tailwind/menu/menu-variants";
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

// Menu in Tailwind CSS v4 (src/tailwind/menu, with Glide) against menu.css and glide.css. The
// popup renders in a portal; here the portal's container is the side itself, so its parts are
// compared like any other.

const SIZES: MenuSize[] = ["sm", "md", "lg"];
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
  ...Object.values(menuSlots),
  ...Object.values(kbdSlots),
  ...Object.values(glideSlots),
  ...SIZES.map((size) => menuPopupVariants({ size })),
  POPUP_OVERRIDES,
  ITEM_OVERRIDES,
  "data-starting-style:bg-green-500 data-disabled:text-green-500",
);
const tw = tailwindParity(candidates, [FOCUS_GUARDS]);
// A popup in a state is measured while it moves, so its box says nothing.
const twMotion = tailwindParity(candidates, [
  FOCUS_GUARDS,
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

// What the menu's parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "overscrollBehaviorY",
  "overflowY",
  "maxHeight",
  "marginInlineStart",
  "marginInlineEnd",
  "paddingInlineStart",
  "paddingInlineEnd",
  "transformOrigin",
  "visibility",
  "textDecorationLine",
  "letterSpacing",
  "forcedColorAdjust",
];

const NO_COLLISION = { side: "none", align: "none", fallbackAxisSide: "none" } as const;

interface Kit {
  Menu: typeof CssMenu;
  Kbd: typeof CssKbd;
}
const css: Kit = { Menu: CssMenu, Kbd: CssKbd };
const twind: Kit = { Menu: TwMenu, Kbd: TwKbd };

const Glyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

interface PopProps {
  kit: Kit;
  size?: MenuSize;
  dir?: "ltr" | "rtl";
  modal?: boolean;
  /** Which items to draw. */
  items?: "all" | "plain" | "scroll";
  submenu?: boolean;
  popupClassName?: string;
  itemClassName?: string;
}

/** An open menu whose portal is the box around it, so each side owns its popup. */
function Pop({
  kit,
  size,
  dir = "ltr",
  modal = false,
  items = "all",
  submenu,
  popupClassName,
  itemClassName,
}: PopProps): ReactElement {
  const { Menu, Kbd } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [radio, setRadio] = useState("b");
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ position: "relative", blockSize: 440 }}>
        {host ? (
          <Menu.Root open modal={modal}>
            <Menu.Trigger render={<button type="button">Edit</button>} />
            <Menu.Portal container={host}>
              <Menu.Positioner side="bottom" collisionAvoidance={NO_COLLISION}>
                <Menu.Popup
                  size={size}
                  className={popupClassName}
                  finalFocus={false}
                  style={items === "scroll" ? { maxBlockSize: 150 } : undefined}
                >
                  {items === "plain" ? (
                    <>
                      <Menu.Item className={itemClassName}>Cut</Menu.Item>
                      <Menu.Item className={itemClassName}>Copy</Menu.Item>
                    </>
                  ) : items === "scroll" ? (
                    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) => (
                      <Menu.Item key={text}>{text}</Menu.Item>
                    ))
                  ) : (
                    <>
                      <Menu.Group>
                        <Menu.GroupLabel>Clipboard</Menu.GroupLabel>
                        <Menu.Item className={itemClassName}>
                          <Glyph />
                          Cut
                          <kbd>⌘X</kbd>
                        </Menu.Item>
                        <Menu.Item className={itemClassName}>
                          <Glyph />
                          Copy
                          <Kbd>⌘C</Kbd>
                        </Menu.Item>
                        <Menu.Item className={itemClassName} disabled>
                          <Glyph />
                          Paste
                        </Menu.Item>
                      </Menu.Group>
                      <Menu.Separator />
                      <Menu.CheckboxItem defaultChecked className={itemClassName}>
                        <Menu.CheckboxItemIndicator />
                        Word wrap
                      </Menu.CheckboxItem>
                      <Menu.CheckboxItem className={itemClassName}>
                        <Menu.CheckboxItemIndicator />
                        Minimap
                      </Menu.CheckboxItem>
                      <Menu.Separator />
                      <Menu.RadioGroup value={radio} onValueChange={setRadio}>
                        <Menu.RadioItem value="a" className={itemClassName}>
                          <Menu.RadioItemIndicator />
                          Small
                        </Menu.RadioItem>
                        <Menu.RadioItem value="b" className={itemClassName}>
                          <Menu.RadioItemIndicator />
                          Medium
                        </Menu.RadioItem>
                      </Menu.RadioGroup>
                      <Menu.Separator />
                      <Menu.LinkItem href="#help" className={itemClassName}>
                        Help
                      </Menu.LinkItem>
                      <Menu.SubmenuRoot open={submenu}>
                        <Menu.SubmenuTrigger className={itemClassName}>More</Menu.SubmenuTrigger>
                        <Menu.Portal container={host}>
                          <Menu.Positioner collisionAvoidance={NO_COLLISION}>
                            <Menu.Popup size={size} finalFocus={false}>
                              <Menu.Item>Archive</Menu.Item>
                              <Menu.Item>Delete</Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </>
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, pop: Omit<PopProps, "kit">): Case => ({
  name,
  css: <Pop kit={css} {...pop} />,
  tw: <Pop kit={twind} {...pop} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(size, { size })),
  make("default", {}),
  make("plain", { items: "plain" }),
  make("scrolls", { items: "scroll" }),
  make("submenu open", { submenu: true }),
  make("submenu open, sm", { submenu: true, size: "sm" }),
  make("modal", { modal: true }),
  make("starting", {}),
  make("ending", {}),
  make("instant", {}),
  make("ending and instant", {}),
  make("a user's class", { popupClassName: "p-0", itemClassName: "px-8" }),
];

// The states Base UI sets on the popup, put on by hand: the transitions are frozen.
const mark = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  const popup = () => side.querySelector("[data-slot=menu-popup]");
  // Floating UI places the popup after it mounts.
  await vi.waitFor(() => expect(popup()).not.toBeNull(), { timeout: 5000 });
  if (name.startsWith("submenu")) {
    await vi.waitFor(
      () => expect(side.querySelectorAll("[data-slot=menu-popup]")).toHaveLength(2),
      {
        timeout: 5000,
      },
    );
  }
  const el = popup();
  if (name.startsWith("starting")) el?.setAttribute("data-starting-style", "");
  if (name.startsWith("ending")) el?.setAttribute("data-ending-style", "");
  if (name.endsWith("instant")) el?.setAttribute("data-instant", "");
  else el?.removeAttribute("data-instant");
  await frame();
  await frame();
  expect(popup(), name).toBe(el);
  // Base UI focuses the popup it opened last, which draws the browser's focus ring in forced colors.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

const run = { props, pseudo: PSEUDO, prepare: mark };
const item = { ...run, target: "[role=menuitem]:not([data-disabled])" };

/** The popup's first item, focused as a keyboard user does. */
async function focusItem(side: Element, selector: string): Promise<Element> {
  const el = side.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`no ${selector}`);
  await userEvent.keyboard("{Shift}");
  el.focus();
  await frame();
  if (!el.matches(":focus-visible")) throw new Error("the item did not get keyboard focus");
  return el;
}

describe("Menu in Tailwind CSS v4 against menu.css", () => {
  test("every size, kind of item, and layout matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the icon margins and the chevron swap sides", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the outline is drawn, a disabled item is gray", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast: a ring around the popup", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("reduced motion: it fades, without growing", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("transitions are the same: 180 ms in, 120 ms out, none when instant", async () => {
    await twMotion.motion(cases, { prepare: mark });
    await setMedia("reduced-motion");
    await twMotion.motion(cases, { prepare: mark });
  });

  test("the item whose submenu is open stays lit while the pointer is away", async () => {
    await tw.parity(cases, { ...run, names: ["submenu open"], theme: "dark" });
  });

  test("a hovered item matches, and Glide lights it", { timeout: 60_000 }, async () => {
    await tw.states(cases, "default", "hover", item);
    await tw.states(cases, "default", "hover", { ...item, theme: "dark" });
    await tw.states(cases, "default", "hover", { ...item, dir: "rtl" });
    // The submenu's trigger, hovered while its popup is open.
    await tw.states(cases, "submenu open", "hover", {
      ...run,
      target: "[data-slot=menu-submenu-trigger]",
    });
  });

  test("a held press changes nothing on an item", { timeout: 60_000 }, async () => {
    await tw.states(cases, "default", "held", item);
  });

  test("keyboard focus draws the ring inside the item", { timeout: 60_000 }, async () => {
    for (const flavor of ["", "dark"] as const) {
      const screen = await tw.mount(
        cases.filter((c) => c.name === "default"),
        { ...run, ...(flavor ? { theme: flavor } : {}) },
      );
      const row = screen.container.querySelector('[data-case="default"]');
      const taken = [];
      for (const side of ["css", "tw"]) {
        const el = row?.querySelector(`[data-side=${side}]`) as Element;
        await focusItem(el, "[role=menuitem]:not([data-disabled])");
        taken.push(measure(el, props, PSEUDO));
      }
      tw.expectParts(`focus ${flavor}`, taken[0] ?? [], taken[1] ?? []);
    }
  });

  test("forced colors with hover and focus", { timeout: 60_000 }, async () => {
    await setMedia("forced-colors");
    await tw.states(cases, "default", "hover", item);
    const screen = await tw.mount(
      cases.filter((c) => c.name === "default"),
      run,
    );
    const row = screen.container.querySelector('[data-case="default"]');
    const taken = [];
    for (const side of ["css", "tw"]) {
      const el = row?.querySelector(`[data-side=${side}]`) as Element;
      await focusItem(el, "[role=menuitem]:not([data-disabled])");
      taken.push(measure(el, props, PSEUDO));
    }
    tw.expectParts("forced focus", taken[0] ?? [], taken[1] ?? []);
  });
});

describe("Menu in Tailwind CSS v4 behaves as in CSS", () => {
  test("Glide lights the hovered item and the keyboard's item, with no class of the CSS flavor", async () => {
    tw.load();
    const screen = await render(<Pop kit={twind} items="plain" />);
    await expect.poll(() => screen.container.querySelectorAll("[role=menuitem]").length).toBe(2);
    const items = [...screen.container.querySelectorAll<HTMLElement>("[role=menuitem]")];
    const viewport = screen.container.querySelector<HTMLElement>("[data-slot=menu-viewport]");
    const highlight = screen.container.querySelector<HTMLElement>("[data-slot=glide]");
    if (!viewport || !highlight) throw new Error("not rendered");
    // The CSS flavor's rule on [data-glide] is in this page too: the classes must do it alone.
    viewport.removeAttribute("data-glide");
    expect(getComputedStyle(viewport).position).toBe("relative");
    expect(getComputedStyle(viewport).isolation).toBe("isolate");
    await userEvent.hover(items[1] as Element);
    await expect.poll(() => items[1]?.hasAttribute("data-glide-active")).toBe(true);
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    await userEvent.keyboard("{ArrowUp}");
    await expect.poll(() => items[0]?.hasAttribute("data-glide-active")).toBe(true);
    const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
      el.className.split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(10);
  });
});

describe("className on Menu in Tailwind CSS v4", () => {
  const popupOf = async (props: Partial<PopProps>) => {
    tw.load();
    const screen = await render(<Pop kit={twind} {...props} />);
    await vi.waitFor(
      () => expect(screen.container.querySelector("[data-slot=menu-popup]")).not.toBeNull(),
      { timeout: 5000 },
    );
    return screen.container;
  };

  test("a user's utilities beat the component's, on the popup", async () => {
    const root = await popupOf({ items: "plain", popupClassName: POPUP_OVERRIDES });
    const popup = root.querySelector("[data-slot=menu-popup]");
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
    const root = await popupOf({ items: "plain", itemClassName: ITEM_OVERRIDES });
    const item = root.querySelector("[role=menuitem]");
    if (!item) throw new Error("not rendered");
    expectStyles(item, {
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
    const root = await popupOf({
      items: "plain",
      popupClassName: "data-starting-style:bg-green-500",
    });
    const popup = root.querySelector("[data-slot=menu-popup]");
    popup?.setAttribute("data-starting-style", "");
    expectStyles(popup as Element, { backgroundColor: "oklch(0.723 0.219 149.579)" });
  });

  test("the popup's and the slots' classes merge with a className, the user's last", () => {
    const merged = cn(menuPopupVariants({ size: "sm" }), "rounded-none p-0 text-lg shadow-none");
    expect(merged).toContain("rounded-none");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("rounded-(--ow-radius)");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("shadow-(shadow:--_shadow)");
    const item = cn(menuSlots.item, "px-8 py-1 rounded-none text-red-500 gap-0");
    for (const gone of ["px-(--px)", "py-(--_py)", "rounded-(--_inner)", "text-(color:--_fg)"]) {
      expect(item.split(" "), gone).not.toContain(gone);
    }
    expect(cn(menuSlots.groupLabel, "text-sm font-bold")).not.toContain("font-medium");
  });
});
