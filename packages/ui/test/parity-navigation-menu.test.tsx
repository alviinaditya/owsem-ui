import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
  NavigationMenu as CssNavigationMenu,
  type NavigationMenuSize,
} from "../src/components/navigation-menu/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { NavigationMenu as TwNavigationMenu } from "../src/tailwind/navigation-menu/index";
import {
  navigationMenuPopupVariants,
  navigationMenuSlots,
  navigationMenuTriggerVariants,
  navigationMenuVariants,
} from "../src/tailwind/navigation-menu/navigation-menu-variants";
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

// Navigation Menu in Tailwind CSS v4 (src/tailwind/navigation-menu, with Glide) against
// navigation-menu.css. The first item's panel is open, with the portal's container the side itself.

const SIZES: NavigationMenuSize[] = ["sm", "md", "lg"];
const ROOT_OVERRIDES = "text-red-500 p-0";
const TRIGGER_OVERRIDES = "rounded-none bg-red-500 px-8 py-1 text-red-500 font-bold gap-0";
const POPUP_OVERRIDES = "rounded-none bg-red-500 text-red-500 outline-red-500 shadow-none";

const FOCUS_GUARDS: Accepted = {
  what: /^box [xy]$/,
  part: / span$/,
  reason: "Base UI's focus guards are fixed with no offsets, so they sit in each side's own box.",
};

const candidates = classNames(
  ...SIZES.flatMap((size) => [
    navigationMenuVariants({ size }),
    navigationMenuTriggerVariants({ size }),
    navigationMenuPopupVariants({ size }),
  ]),
  ...Object.values(navigationMenuSlots),
  ...Object.values(glideSlots),
  ROOT_OVERRIDES,
  TRIGGER_OVERRIDES,
  POPUP_OVERRIDES,
);
const tw = tailwindParity(candidates, [FOCUS_GUARDS]);
// A panel in a state is measured while it moves, so its box says nothing.
const twMotion = tailwindParity(candidates, [
  FOCUS_GUARDS,
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

const props = [
  ...PROPS,
  "overflowY",
  "maxHeight",
  "maxWidth",
  "marginInlineStart",
  "paddingInlineStart",
  "transformOrigin",
  "translate",
  "visibility",
  "letterSpacing",
  "listStyleType",
  "flexWrap",
  "clipPath",
  "forcedColorAdjust",
  "transitionProperty",
  "transitionDuration",
];

interface Kit {
  NavigationMenu: typeof CssNavigationMenu;
}
const css: Kit = { NavigationMenu: CssNavigationMenu };
const twind: Kit = { NavigationMenu: TwNavigationMenu };

interface NavProps {
  kit: Kit;
  size?: NavigationMenuSize;
  dir?: "ltr" | "rtl";
  open?: boolean;
  arrow?: boolean;
  rootClassName?: string;
  triggerClassName?: string;
  popupClassName?: string;
}

function Nav({
  kit,
  size,
  dir = "ltr",
  open = true,
  arrow,
  rootClassName,
  triggerClassName,
  popupClassName,
}: NavProps): ReactElement {
  const { NavigationMenu } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ position: "relative", blockSize: 260 }}>
        {host ? (
          <NavigationMenu.Root
            size={size}
            className={rootClassName}
            aria-label="Main"
            {...(open ? { defaultValue: "a" } : {})}
          >
            <NavigationMenu.List>
              <NavigationMenu.Item value="a">
                <NavigationMenu.Trigger className={triggerClassName}>
                  Products
                </NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <NavigationMenu.Link href="#one" active>
                    <strong>One</strong>
                    <span>First</span>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link href="#two">
                    <strong>Two</strong>
                    <span>Second</span>
                  </NavigationMenu.Link>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item value="b">
                <NavigationMenu.Trigger icon={null} disabled>
                  Off
                </NavigationMenu.Trigger>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link href="#pricing" active>
                  Pricing
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            <NavigationMenu.Portal container={host}>
              <NavigationMenu.Positioner positionMethod="absolute">
                <NavigationMenu.Popup className={popupClassName}>
                  {arrow ? <NavigationMenu.Arrow /> : null}
                  <NavigationMenu.Viewport />
                </NavigationMenu.Popup>
              </NavigationMenu.Positioner>
            </NavigationMenu.Portal>
          </NavigationMenu.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, nav: Omit<NavProps, "kit">): Case => ({
  name,
  css: <Nav kit={css} {...nav} />,
  tw: <Nav kit={twind} {...nav} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(size, { size })),
  make("default", {}),
  make("arrow", { arrow: true }),
  make("closed", { open: false }),
  make("starting", {}),
  make("ending", {}),
  make("instant", {}),
  make("a user's class", {
    open: false,
    rootClassName: ROOT_OVERRIDES,
    triggerClassName: TRIGGER_OVERRIDES,
    popupClassName: POPUP_OVERRIDES,
  }),
];

// The states Base UI sets on the panel and its content, put on by hand: the transitions are frozen.
const mark = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  await vi.waitFor(() => expect(side.querySelector("[data-slot=navigation-menu]")).not.toBeNull(), {
    timeout: 5000,
  });
  if (name !== "closed" && name !== "a user's class") {
    await vi.waitFor(
      () => expect(side.querySelector("[data-slot=navigation-menu-popup]")).not.toBeNull(),
      { timeout: 5000 },
    );
  }
  const popup = side.querySelector("[data-slot=navigation-menu-popup]");
  const content = side.querySelector("[data-slot=navigation-menu-content]");
  if (name === "starting") {
    popup?.setAttribute("data-starting-style", "");
    content?.setAttribute("data-starting-style", "");
    content?.setAttribute("data-activation-direction", "left");
  }
  if (name === "ending") {
    popup?.setAttribute("data-ending-style", "");
    content?.setAttribute("data-ending-style", "");
    content?.setAttribute("data-activation-direction", "left");
  }
  if (name === "instant") popup?.setAttribute("data-instant", "");
  await frame();
  await frame();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

const run = { props, pseudo: PSEUDO, prepare: mark };
const open = {
  ...run,
  target: "[data-slot=navigation-menu-trigger]:not([data-popup-open]):not([data-disabled])",
};

describe("Navigation Menu in Tailwind CSS v4 against navigation-menu.css", () => {
  test("every size, state, and layout matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the open trigger and the current link are outlined", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast and reduced motion match", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("transitions are the same: 180 ms in, 320 ms between triggers, none when instant", async () => {
    await twMotion.motion(cases, { prepare: mark });
  });

  test("a hovered link in the list matches", { timeout: 60_000 }, async () => {
    await tw.states(cases, "closed", "hover", {
      ...run,
      target: "[data-slot=navigation-menu-link]",
    });
  });

  test("a hovered trigger, a held press, and keyboard focus match", {
    timeout: 60_000,
  }, async () => {
    await tw.states(cases, "closed", "hover", open);
    await tw.states(cases, "closed", "hover", { ...open, theme: "dark" });
    await tw.states(cases, "closed", "focus", open);
    await tw.states(cases, "closed", "held", open);
  });
});

describe("className on Navigation Menu in Tailwind CSS v4", () => {
  const rendered = async (nav: Partial<NavProps>) => {
    tw.load();
    const screen = await render(<Nav kit={twind} {...nav} />);
    await vi.waitFor(
      () => expect(screen.container.querySelector("[data-slot=navigation-menu]")).not.toBeNull(),
      { timeout: 5000 },
    );
    return screen.container;
  };

  test("a user's utilities beat the component's, on the root and a trigger", async () => {
    const root = await rendered({
      open: false,
      rootClassName: ROOT_OVERRIDES,
      triggerClassName: TRIGGER_OVERRIDES,
    });
    expectStyles(root.querySelector("[data-slot=navigation-menu-trigger]") as Element, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
    });
  });

  test("and on the popup", async () => {
    const root = await rendered({ popupClassName: POPUP_OVERRIDES });
    await vi.waitFor(
      () => expect(root.querySelector("[data-slot=navigation-menu-popup]")).not.toBeNull(),
      { timeout: 5000 },
    );
    expectStyles(root.querySelector("[data-slot=navigation-menu-popup]") as Element, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      boxShadow: "none",
    });
  });

  test("a Tailwind page does not see the CSS flavor's classes", async () => {
    const root = await rendered({ open: false });
    const classes = [...root.querySelectorAll("[class]")].flatMap((el) =>
      el.className.split(/\s+/),
    );
    expect(classes.filter((name) => /^ow-[\w-]+$/.test(name))).toEqual([]);
    expect(classes.length).toBeGreaterThan(10);
  });

  test("the classes merge with a className, the user's last", () => {
    const trigger = cn(
      navigationMenuTriggerVariants({ size: "sm" }),
      "px-8 py-1 rounded-none text-red-500 gap-0",
    );
    for (const gone of [
      "px-(--px)",
      "py-(--_py)",
      "rounded-(--ow-radius)",
      "text-(color:--ow-fg)",
    ]) {
      expect(trigger.split(" "), gone).not.toContain(gone);
    }
    const popup = cn(navigationMenuPopupVariants(), "rounded-none shadow-none text-lg");
    expect(popup).not.toContain("rounded-(--ow-radius)");
    expect(popup).not.toContain("shadow-(shadow:--_shadow)");
    expect(cn(navigationMenuSlots.link, "px-8 rounded-none")).not.toContain("rounded-(--_inner)");
  });
});
