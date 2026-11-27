import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Menu as CssMenu } from "../src/components/menu/index";
import { Menubar as CssMenubar, type MenubarSize } from "../src/components/menubar/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { Menu as TwMenu } from "../src/tailwind/menu/index";
import { menuPopupVariants, menuSlots } from "../src/tailwind/menu/menu-variants";
import { Menubar as TwMenubar } from "../src/tailwind/menubar/index";
import { menubarTriggerVariants, menubarVariants } from "../src/tailwind/menubar/menubar-variants";
import {
  type Accepted,
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Menubar in Tailwind CSS v4 (src/tailwind/menubar) against menubar.css. Its Edit menu is open,
// with the portal's container the side itself, so the menu's parts are compared too.

const SIZES: MenubarSize[] = ["sm", "md", "lg"];
const BAR_OVERRIDES = "rounded-none bg-red-500 text-red-500 gap-0 p-0 outline-red-500";
const TRIGGER_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 font-bold gap-0 data-disabled:opacity-100";

const FOCUS_GUARDS: Accepted = {
  what: /^box [xy]$/,
  part: / span$/,
  reason: "Base UI's focus guards are fixed with no offsets, so they sit in each side's own box.",
};

const candidates = classNames(
  ...SIZES.flatMap((size) => [menubarVariants({ size }), menubarTriggerVariants({ size })]),
  ...Object.values(menuSlots),
  ...Object.values(glideSlots),
  ...SIZES.map((size) => menuPopupVariants({ size })),
  BAR_OVERRIDES,
  TRIGGER_OVERRIDES,
);
const tw = tailwindParity(candidates, [FOCUS_GUARDS]);

const props = [
  ...PROPS,
  "overflowY",
  "maxHeight",
  "marginInlineStart",
  "paddingInlineStart",
  "transformOrigin",
  "visibility",
  "letterSpacing",
  "forcedColorAdjust",
];

const NO_COLLISION = { side: "none", align: "none", fallbackAxisSide: "none" } as const;

interface Kit {
  Menu: typeof CssMenu;
  Menubar: typeof CssMenubar;
}
const css: Kit = { Menu: CssMenu, Menubar: CssMenubar };
const twind: Kit = { Menu: TwMenu, Menubar: TwMenubar };

interface BarProps {
  kit: Kit;
  size?: MenubarSize;
  dir?: "ltr" | "rtl";
  open?: boolean;
  disabled?: boolean;
  barClassName?: string;
  triggerClassName?: string;
}

function Bar({
  kit,
  size,
  dir = "ltr",
  open = true,
  disabled,
  barClassName,
  triggerClassName,
}: BarProps): ReactElement {
  const { Menu, Menubar } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ position: "relative", blockSize: 200 }}>
        {host ? (
          <Menubar.Root size={size} modal={false} className={barClassName} aria-label="App">
            <Menu.Root>
              <Menubar.Trigger className={triggerClassName}>File</Menubar.Trigger>
            </Menu.Root>
            <Menu.Root open={open}>
              <Menubar.Trigger className={triggerClassName}>Edit</Menubar.Trigger>
              <Menu.Portal container={host}>
                <Menu.Positioner
                  align="start"
                  positionMethod="absolute"
                  collisionAvoidance={NO_COLLISION}
                >
                  <Menu.Popup finalFocus={false} size={size}>
                    <Menu.Item>Cut</Menu.Item>
                    <Menu.Item>Copy</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <Menu.Root>
              <Menubar.Trigger disabled={disabled} className={triggerClassName}>
                View
              </Menubar.Trigger>
            </Menu.Root>
          </Menubar.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, bar: Omit<BarProps, "kit">): Case => ({
  name,
  css: <Bar kit={css} {...bar} />,
  tw: <Bar kit={twind} {...bar} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(size, { size })),
  make("default", {}),
  make("closed", { open: false }),
  make("disabled", { open: false, disabled: true }),
  make("a user's class", {
    open: false,
    barClassName: BAR_OVERRIDES,
    triggerClassName: TRIGGER_OVERRIDES,
  }),
];

const prepare = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  await vi.waitFor(() => expect(side.querySelector("[data-slot=menubar]")).not.toBeNull(), {
    timeout: 5000,
  });
  if (!["closed", "disabled", "a user's class"].includes(name)) {
    await vi.waitFor(() => expect(side.querySelector("[data-slot=menu-popup]")).not.toBeNull(), {
      timeout: 5000,
    });
  }
  await frame();
  await frame();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

const run = { props, pseudo: PSEUDO, prepare };
const edit = {
  ...run,
  target: "[data-slot=menubar-trigger]:not([data-popup-open]):not([data-disabled])",
};

describe("Menubar in Tailwind CSS v4 against menubar.css", () => {
  test("every size and state matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the open trigger is outlined, a disabled one is gray", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast and reduced motion match", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("a hovered trigger matches", { timeout: 60_000 }, async () => {
    await tw.states(cases, "closed", "hover", edit);
    await tw.states(cases, "closed", "hover", { ...edit, theme: "dark" });
  });

  test("a held press and keyboard focus match", { timeout: 60_000 }, async () => {
    await tw.states(cases, "closed", "held", edit);
    await tw.states(cases, "closed", "focus", edit);
    await setMedia("forced-colors");
    await tw.states(cases, "closed", "focus", edit);
  });
});

describe("Menubar in Tailwind CSS v4 behaves as in CSS", () => {
  test("the open trigger is tinted and the menu is Menu's, with no class of the CSS flavor", async () => {
    tw.load();
    const screen = await render(<Bar kit={twind} />);
    await vi.waitFor(
      () => expect(screen.container.querySelector("[data-slot=menu-popup]")).not.toBeNull(),
      { timeout: 5000 },
    );
    const open = screen.container.querySelector<HTMLElement>("[data-popup-open]");
    expect(open?.textContent).toBe("Edit");
    expect(getComputedStyle(open as HTMLElement).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await userEvent.keyboard("{Tab}");
    const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
      el.className.split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
  });
});

describe("className on Menubar in Tailwind CSS v4", () => {
  const rendered = async (props: Partial<BarProps>) => {
    tw.load();
    const screen = await render(<Bar kit={twind} open={false} {...props} />);
    await vi.waitFor(
      () => expect(screen.container.querySelector("[data-slot=menubar]")).not.toBeNull(),
      { timeout: 5000 },
    );
    return screen.container;
  };

  test("a user's utilities beat the component's, on the bar and a trigger", async () => {
    const root = await rendered({
      barClassName: BAR_OVERRIDES,
      triggerClassName: TRIGGER_OVERRIDES,
    });
    expectStyles(root.querySelector("[data-slot=menubar]") as Element, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      columnGap: "0px",
      paddingTop: "0px",
    });
    expectStyles(root.querySelector("[data-slot=menubar-trigger]") as Element, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
    });
  });

  test("the classes merge with a className, the user's last", () => {
    const bar = cn(menubarVariants({ size: "sm" }), "rounded-none p-0 text-lg shadow-none");
    expect(bar).toContain("rounded-none");
    expect(bar).not.toContain("rounded-(--ow-radius)");
    expect(bar).not.toContain("text-[0.8125rem]");
    const trigger = cn(menubarTriggerVariants(), "px-8 py-1 rounded-none text-red-500 gap-0");
    for (const gone of ["px-(--px)", "py-(--_py)", "rounded-(--_inner)", "text-(color:--ow-fg)"]) {
      expect(trigger.split(" "), gone).not.toContain(gone);
    }
  });
});
