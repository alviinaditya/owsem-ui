import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import contextMenuCss from "../src/components/context-menu/context-menu.css?raw";
import { ContextMenu as CssContextMenu } from "../src/components/context-menu/index";
import { contextMenuSlots } from "../src/tailwind/context-menu/context-menu-variants";
import { ContextMenu as TwContextMenu } from "../src/tailwind/context-menu/index";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { menuPopupVariants, menuSlots } from "../src/tailwind/menu/menu-variants";
import {
  type Accepted,
  type Case,
  classNames,
  frame,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Context Menu in Tailwind CSS v4 (src/tailwind/context-menu) against context-menu.css. Its popup
// and items are Menu's, so this compares the area, and the same parts under the Context Menu
// names. The popup is fixed to the window, so the portal's container is a box that contains it.

const SIZES = ["sm", "md", "lg"] as const;

const WINDOW_BOX: Accepted = {
  what: /^box [xy]$/,
  reason: "The popup is fixed to the window, so each side's own column sets where it lands.",
};

const WINDOW_PLACE: Accepted = {
  what: /^(transform|transformOrigin)$/,
  part: /context-menu-(positioner|popup)$/,
  reason: "Where a fixed popup lands, and so its origin, follows its side's column.",
};

const FOCUS_GUARDS: Accepted = {
  what: /^box [xy]$/,
  part: / span$/,
  reason: "Base UI's focus guards are fixed with no offsets, so they sit in each side's own box.",
};

const candidates = classNames(
  ...Object.values(contextMenuSlots),
  ...Object.values(menuSlots),
  ...Object.values(glideSlots),
  ...SIZES.map((size) => menuPopupVariants({ size })),
  "rounded-none p-0",
);
const tw = tailwindParity(candidates, [FOCUS_GUARDS, WINDOW_BOX, WINDOW_PLACE]);

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

interface Kit {
  ContextMenu: typeof CssContextMenu;
}
const css: Kit = { ContextMenu: CssContextMenu };
const twind: Kit = { ContextMenu: TwContextMenu };

interface AreaProps {
  kit: Kit;
  size?: (typeof SIZES)[number];
  dir?: "ltr" | "rtl";
  open?: boolean;
  areaClassName?: string;
}

function Area({ kit, size, dir = "ltr", open = true, areaClassName }: AreaProps): ReactElement {
  const { ContextMenu } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [area, setArea] = useState<HTMLElement | null>(null);
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ position: "relative", blockSize: 300, contain: "layout" }}>
        {host ? (
          <ContextMenu.Root open={open}>
            <ContextMenu.Trigger
              ref={setArea}
              className={areaClassName}
              style={{ inlineSize: 120, blockSize: 60 }}
            >
              Area
            </ContextMenu.Trigger>
            <ContextMenu.Portal container={host}>
              <ContextMenu.Positioner anchor={area} side="bottom" align="start" sideOffset={0}>
                <ContextMenu.Popup size={size} finalFocus={false}>
                  <ContextMenu.Group>
                    <ContextMenu.GroupLabel>Clipboard</ContextMenu.GroupLabel>
                    <ContextMenu.Item>Cut</ContextMenu.Item>
                    <ContextMenu.Item disabled>Paste</ContextMenu.Item>
                  </ContextMenu.Group>
                  <ContextMenu.Separator />
                  <ContextMenu.CheckboxItem defaultChecked>
                    <ContextMenu.CheckboxItemIndicator />
                    Word wrap
                  </ContextMenu.CheckboxItem>
                  <ContextMenu.RadioGroup value="a">
                    <ContextMenu.RadioItem value="a">
                      <ContextMenu.RadioItemIndicator />A
                    </ContextMenu.RadioItem>
                  </ContextMenu.RadioGroup>
                  <ContextMenu.SubmenuRoot>
                    <ContextMenu.SubmenuTrigger>More</ContextMenu.SubmenuTrigger>
                  </ContextMenu.SubmenuRoot>
                </ContextMenu.Popup>
              </ContextMenu.Positioner>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, area: Omit<AreaProps, "kit">): Case => ({
  name,
  css: <Area kit={css} {...area} />,
  tw: <Area kit={twind} {...area} />,
});

const cases: Case[] = [
  ...SIZES.map((size) => make(size, { size })),
  make("default", {}),
  make("closed", { open: false }),
];

const prepare = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  await vi.waitFor(
    () => expect(side.querySelector("[data-slot=context-menu-trigger]")).not.toBeNull(),
    { timeout: 5000 },
  );
  if (name !== "closed") {
    await vi.waitFor(
      () => expect(side.querySelector("[data-slot=context-menu-popup]")).not.toBeNull(),
      { timeout: 5000 },
    );
  }
  await frame();
  await frame();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

const run = { props, pseudo: PSEUDO, prepare };

describe("Context Menu in Tailwind CSS v4 against context-menu.css and menu.css", () => {
  test("every size and the closed area match in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors, more contrast, and reduced motion match", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
    await setMedia("more-contrast");
    await tw.parity(cases, run);
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("the area's one rule is the same in both flavors", () => {
    // Chrome and Firefox do not compute -webkit-touch-callout, so the sources are compared.
    expect(contextMenuCss).toContain("-webkit-touch-callout: none");
    expect(contextMenuSlots.trigger).toBe("[-webkit-touch-callout:none]");
  });
});

describe("className on Context Menu in Tailwind CSS v4", () => {
  test("a user's utilities beat the popup's classes, as in Menu", async () => {
    tw.load();
    const screen = await render(<Area kit={twind} areaClassName="p-0 rounded-none" />);
    await vi.waitFor(
      () => expect(screen.container.querySelector("[data-slot=context-menu-popup]")).not.toBeNull(),
      { timeout: 5000 },
    );
    const area = screen.container.querySelector("[data-slot=context-menu-trigger]") as Element;
    expect(area.className).toBe(cn(contextMenuSlots.trigger, "p-0 rounded-none"));
    expect(getComputedStyle(area).borderTopLeftRadius).toBe("0px");
  });
});
