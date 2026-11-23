import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button as CssButton } from "../src/components/button/index";
import { CommandMenu as CssCommandMenu } from "../src/components/command-menu/index";
import { Input as CssInput } from "../src/components/input/index";
import { Select as CssSelect } from "../src/components/select/index";
import { Switch as CssSwitch } from "../src/components/switch/index";
import { Toggle as CssToggle } from "../src/components/toggle/index";
import { Toolbar as CssToolbar } from "../src/components/toolbar/index";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { Button as TwButton } from "../src/tailwind/button/index";
import {
  commandMenuSlots,
  commandMenuTriggerVariants,
} from "../src/tailwind/command-menu/command-menu-variants";
import { CommandMenu as TwCommandMenu } from "../src/tailwind/command-menu/index";
import { Input as TwInput } from "../src/tailwind/input/index";
import {
  inputSlots,
  inputVariants,
  inputWrapperVariants,
} from "../src/tailwind/input/input-variants";
import { kbdSlots } from "../src/tailwind/kbd/kbd-variants";
import { cn } from "../src/tailwind/lib/cn";
import { Select as TwSelect } from "../src/tailwind/select/index";
import {
  selectPopupVariants,
  selectSlots,
  selectTriggerVariants,
} from "../src/tailwind/select/select-variants";
import { Switch as TwSwitch } from "../src/tailwind/switch/index";
import { switchSlots, switchVariants } from "../src/tailwind/switch/switch-variants";
import { Toggle as TwToggle } from "../src/tailwind/toggle/index";
import { toggleSlots, toggleVariants } from "../src/tailwind/toggle/toggle-variants";
import { Toolbar as TwToolbar } from "../src/tailwind/toolbar/index";
import {
  type ToolbarSize,
  toolbarButtonVariants,
  toolbarInputVariants,
  toolbarLinkVariants,
  toolbarSlots,
  toolbarVariants,
} from "../src/tailwind/toolbar/toolbar-variants";
import {
  BUTTON_RIPPLE,
  type Case,
  classNames,
  expectStyles,
  frame,
  INPUT_RESIZE,
  measure,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Toolbar in Tailwind CSS v4 (src/tailwind/toolbar) against toolbar.css, with the controls it
// takes as items: Button, Toggle, Input, Switch, Select.Trigger, and CommandMenu.Trigger, in their
// Tailwind flavors against their CSS flavors.

const SIZES: ToolbarSize[] = ["sm", "md", "lg"];
const ROOT_OVERRIDES =
  "rounded-none bg-red-500 text-red-500 text-sm gap-0 p-0 opacity-100 outline-red-500 cursor-default";
const ITEM_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 font-bold gap-0 cursor-default";

const candidates = classNames(
  ...Object.values(toolbarSlots),
  ...Object.values(buttonSlots),
  ...Object.values(toggleSlots),
  ...Object.values(inputSlots),
  ...Object.values(switchSlots),
  ...Object.values(selectSlots),
  ...Object.values(commandMenuSlots),
  ...Object.values(kbdSlots),
  ...SIZES.flatMap((size) => [
    toolbarVariants({ size }),
    toolbarButtonVariants({ size }),
    toolbarLinkVariants({ size }),
    toolbarInputVariants({ size }),
    toggleVariants({ size }),
    inputVariants({ size }),
    inputWrapperVariants({ size }),
    switchVariants({ size }),
    selectTriggerVariants({ size }),
    selectPopupVariants({ size }),
    commandMenuTriggerVariants({ size }),
    buttonVariants({ size }),
    buttonVariants({ size, variant: "secondary" }),
  ]),
  ROOT_OVERRIDES,
  ITEM_OVERRIDES,
);
const tw = tailwindParity(candidates, [INPUT_RESIZE, BUTTON_RIPPLE]);

// What the toolbar and its items draw that PROPS leaves out.
const props = [
  ...PROPS,
  "maxWidth",
  "marginInlineStart",
  "marginInlineEnd",
  "paddingInlineStart",
  "paddingInlineEnd",
  "borderInlineStartWidth",
  "transformOrigin",
  "textDecorationLine",
  "forcedColorAdjust",
  "textOverflow",
  "textAlign",
  "visibility",
  "boxShadow",
  "transitionProperty",
  "transitionDuration",
  "transitionTimingFunction",
];
const pseudo = [...PSEUDO, "transform", "borderTopRightRadius", "forcedColorAdjust"];

interface Kit {
  Toolbar: typeof CssToolbar;
  Button: typeof CssButton;
  Toggle: typeof CssToggle;
  Input: typeof CssInput;
  Switch: typeof CssSwitch;
  Select: typeof CssSelect;
  CommandMenu: typeof CssCommandMenu;
}
const css: Kit = {
  Toolbar: CssToolbar,
  Button: CssButton,
  Toggle: CssToggle,
  Input: CssInput,
  Switch: CssSwitch,
  Select: CssSelect,
  CommandMenu: CssCommandMenu,
};
const twind: Kit = {
  Toolbar: TwToolbar,
  Button: TwButton,
  Toggle: TwToggle,
  Input: TwInput,
  Switch: TwSwitch,
  Select: TwSelect,
  CommandMenu: TwCommandMenu,
};

const Glyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

interface BarProps {
  kit: Kit;
  size?: ToolbarSize;
  orientation?: "horizontal" | "vertical";
  /** Which items it holds. */
  kind: "text" | "controls" | "fields";
  className?: string;
  itemClassName?: string;
}

function Bar({ kit, size, orientation, kind, className, itemClassName }: BarProps): ReactElement {
  const { Toolbar, Button, Toggle, Input, Switch, Select, CommandMenu } = kit;
  const items =
    kind === "text" ? (
      <>
        <Toolbar.Group aria-label="Text">
          <Toolbar.Button render={<Toggle />} aria-label="Bold" startIcon={<Glyph />} />
          <Toolbar.Button
            render={<Toggle defaultPressed />}
            aria-label="Italic"
            startIcon={<Glyph />}
          />
        </Toolbar.Group>
        <Toolbar.Separator />
        <Toolbar.Button data-item="share" startIcon={<Glyph />} className={itemClassName}>
          Share
        </Toolbar.Button>
        <Toolbar.Button disabled className={itemClassName}>
          Redo
        </Toolbar.Button>
        <Toolbar.Button aria-label="Icon only" endIcon={<Glyph />} className={itemClassName} />
        <Toolbar.Link href="#help" data-item="link" endIcon={<Glyph />} className={itemClassName}>
          Help
        </Toolbar.Link>
      </>
    ) : kind === "controls" ? (
      <>
        <Toolbar.Button data-item="button" render={<Button />} className={itemClassName}>
          Save
        </Toolbar.Button>
        <Toolbar.Button
          data-item="button-secondary"
          render={<Button variant="secondary" />}
          className={itemClassName}
        >
          Cancel
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} aria-label="Plain">
          Toggle
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle size="lg" />} aria-label="Own size">
          Own
        </Toolbar.Button>
        <Toolbar.Button render={<Switch.Root />} aria-label="Alerts" className={itemClassName} />
        <Toolbar.Button render={<Toggle defaultPressed />} aria-label="On" startIcon={<Glyph />} />
      </>
    ) : (
      <>
        <Toolbar.Input aria-label="Search" placeholder="Search" className={itemClassName} />
        <Toolbar.Input
          aria-label="Name"
          placeholder="Name"
          render={<Input />}
          className={itemClassName}
        />
        <Select.Root items={[{ value: "a", label: "Alpha" }]} defaultValue="a">
          <Toolbar.Button render={<Select.Trigger />} aria-label="Pick" className={itemClassName} />
        </Select.Root>
        <CommandMenu.Root>
          <Toolbar.Button
            render={<CommandMenu.Trigger />}
            aria-label="Find"
            className={itemClassName}
          >
            Find
            <CommandMenu.Shortcut>⌘K</CommandMenu.Shortcut>
          </Toolbar.Button>
        </CommandMenu.Root>
      </>
    );
  return (
    <Toolbar.Root
      aria-label="Formatting"
      size={size}
      orientation={orientation}
      className={className}
    >
      {items}
    </Toolbar.Root>
  );
}

const make = (name: string, bar: Omit<BarProps, "kit">): Case => ({
  name,
  css: <Bar kit={css} {...bar} />,
  tw: <Bar kit={twind} {...bar} />,
});

const KINDS = ["text", "controls", "fields"] as const;
const cases: Case[] = [
  ...KINDS.flatMap((kind) => [
    ...SIZES.map((size) => make(`${kind} ${size}`, { kind, size })),
    make(`${kind} vertical`, { kind, orientation: "vertical" }),
    make(`${kind} vertical, lg`, { kind, orientation: "vertical", size: "lg" }),
    make(`${kind}, a user's class`, {
      kind,
      className: ROOT_OVERRIDES,
      itemClassName: ITEM_OVERRIDES,
    }),
  ]),
  {
    name: "in a larger font",
    css: (
      <div style={{ fontSize: 24 }}>
        <Bar kit={css} kind="text" />
      </div>
    ),
    tw: (
      <div style={{ fontSize: 24 }}>
        <Bar kit={twind} kind="text" />
      </div>
    ),
  },
];

const run = { props, pseudo };
const on = (selector: string) => ({ ...run, target: selector });

/** An element focused as a keyboard user does. */
async function focusVisible(side: Element, selector: string): Promise<void> {
  const el = side.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`no ${selector}`);
  await userEvent.keyboard("{Shift}");
  el.focus();
  await frame();
  if (!el.matches(":focus-visible")) throw new Error("the element did not get keyboard focus");
}

/** A case with `act` done on each side first. */
async function acted(
  name: string,
  act: (side: Element) => Promise<void>,
  options: typeof run & { theme?: "light" | "dark"; dir?: "ltr" | "rtl" } = run,
): Promise<void> {
  const screen = await tw.mount(
    cases.filter((c) => c.name === name),
    options,
  );
  const row = screen.container.querySelector(`[data-case="${name}"]`);
  const taken = [];
  for (const flavor of ["css", "tw"]) {
    const side = row?.querySelector(`[data-side=${flavor}]`) as Element;
    await act(side);
    taken.push(measure(side, props, pseudo));
  }
  tw.expectParts(name, taken[0] ?? [], taken[1] ?? []);
}

describe("Toolbar in Tailwind CSS v4 against toolbar.css", () => {
  test("every size, kind of item, and orientation matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page, where the icon margins swap sides", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the outline is drawn, a disabled item is gray", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast: the field's edge comes back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("reduced motion matches", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("transitions are the same", async () => {
    await tw.motion(cases, run);
  });

  test("a hovered item matches", { timeout: 120_000 }, async () => {
    await tw.states(cases, "text md", "hover", on("[data-item=share]"));
    await tw.states(cases, "text md", "hover", on("[data-item=link]"));
    await tw.states(cases, "text md", "hover", on("[aria-label=Bold]"));
    await tw.states(cases, "text md", "hover", on("[aria-label=Italic]"));
    await tw.states(cases, "text lg", "hover", on("[data-item=share]"));
    await tw.states(cases, "text md", "hover", {
      ...on("[data-item=share]"),
      theme: "dark",
    });
    await tw.states(cases, "controls md", "hover", on("[data-item=button]"));
    await tw.states(cases, "controls md", "hover", on("[aria-label=Alerts]"));
    await tw.states(cases, "controls md", "hover", on("[aria-label=Plain]"));
    await tw.states(cases, "fields md", "hover", on("[aria-label=Search]"));
    await tw.states(cases, "fields md", "hover", on("[aria-label=Name]"));
    await tw.states(cases, "fields md", "hover", on("[aria-label=Pick]"));
    await tw.states(cases, "fields md", "hover", on("[aria-label=Find]"));
  });

  test("a held press presses an item in", { timeout: 120_000 }, async () => {
    await tw.states(cases, "text md", "held", on("[data-item=share]"));
    await tw.states(cases, "text md", "held", on("[data-item=link]"));
    await tw.states(cases, "text md", "held", on("[aria-label=Bold]"));
    await tw.states(cases, "text md", "held", on("[aria-label=Italic]"));
    await tw.states(cases, "controls md", "held", on("[data-item=button]"));
    await tw.states(cases, "controls md", "held", on("[aria-label=Plain]"));
    await tw.states(cases, "controls md", "held", on("[aria-label=Alerts]"));
    await tw.states(cases, "fields md", "held", on("[aria-label=Find]"));
    await setMedia("reduced-motion");
    await tw.states(cases, "text md", "held", on("[data-item=share]"));
    await tw.states(cases, "text md", "held", on("[aria-label=Bold]"));
  });

  test("a held press lets in over 90 ms and out on the settle spring, in both", {
    timeout: 60_000,
  }, async () => {
    const motion = ["transitionDuration", "transitionTimingFunction", "transitionProperty"];
    await tw.states(cases, "text md", "held", {
      ...on("[data-item=share]"),
      props: motion,
      live: true,
    });
    await tw.states(cases, "text md", "held", {
      ...on("[aria-label=Bold]"),
      props: motion,
      live: true,
    });
  });

  test("keyboard focus draws the ring", { timeout: 120_000 }, async () => {
    const focus = (selector: string) => (side: Element) => focusVisible(side, selector);
    for (const kind of KINDS) {
      for (const selector of {
        text: ["[data-item=share]", "[data-item=link]", "[aria-label=Bold]"],
        controls: ["[data-item=button]", "[aria-label=Alerts]", "[aria-label=Plain]"],
        fields: ["[aria-label=Search]", "[aria-label=Pick]", "[aria-label=Find]"],
      }[kind]) {
        await acted(`${kind} md`, focus(selector));
      }
    }
    await acted("text md", focus("[data-item=share]"), { ...run, theme: "dark" });
    await setMedia("forced-colors");
    await acted("text md", focus("[data-item=share]"));
    await acted("fields md", focus("[aria-label=Search]"));
  });

  test("forced colors with hover", { timeout: 60_000 }, async () => {
    await setMedia("forced-colors");
    await tw.states(cases, "text md", "hover", on("[data-item=share]"));
    await tw.states(cases, "text md", "hover", on("[aria-label=Bold]"));
  });
});

describe("Toolbar in Tailwind CSS v4 behaves as in CSS", () => {
  test("a Toggle, a Button, and an Input rendered as items keep their own look", async () => {
    tw.load();
    const screen = await render(<Bar kit={twind} kind="controls" size="sm" />);
    const q = (selector: string) => screen.container.querySelector(selector) as HTMLElement;
    const button = q("[data-item=button]");
    // Button's own primary look, not the toolbar's quiet one.
    expect(getComputedStyle(button, "::before").backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(button.dataset.size).toBe("sm");
    expect(getComputedStyle(button).fontSize).toBe("13px");
    expect(q("[aria-label=Alerts]").dataset.size).toBe("sm");
    expect(q('[aria-label="Own size"]').dataset.size).toBe("lg");
  });

  test("a Toggle rendered as an item keeps the toolbar's radius over a user's plain utility", async () => {
    // The toolbar's rules for a Toggle have a specificity of their own, to beat the Toggle's: in the
    // CSS flavor a utility layer wins by its layer instead. A variant utility still wins.
    tw.load();
    const screen = await render(
      <TwToolbar.Root aria-label="t">
        <TwToolbar.Button render={<TwToggle />} aria-label="Plain" className="rounded-none">
          Toggle
        </TwToolbar.Button>
      </TwToolbar.Root>,
    );
    const toggle = screen.container.querySelector("[aria-label=Plain]") as Element;
    expectStyles(toggle, { borderTopLeftRadius: "12px" });
  });

  test("the rendered Tailwind tree holds no class of the CSS flavor", async () => {
    tw.load();
    for (const kind of KINDS) {
      const screen = await render(<Bar kit={twind} kind={kind} />);
      const classes = [...screen.container.querySelectorAll("[class]")].flatMap((el) =>
        (el.getAttribute("class") ?? "").split(/\s+/),
      );
      expect(
        classes.filter((name) => /^ow-[\w-]+$/.test(name)),
        kind,
      ).toEqual([]);
      expect(classes.length).toBeGreaterThan(10);
      await screen.unmount();
    }
  });
});

describe("className on Toolbar in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on the root", async () => {
    tw.load();
    const screen = await render(<Bar kit={twind} kind="text" className={ROOT_OVERRIDES} />);
    const root = screen.container.querySelector("[data-slot=toolbar]");
    if (!root) throw new Error("not rendered");
    expectStyles(root, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      fontSize: "14px",
      columnGap: "0px",
      paddingTop: "0px",
      opacity: "1",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("on a button, a link, and an input, which have no specificity of their own", async () => {
    tw.load();
    for (const kind of ["text", "fields"] as const) {
      const screen = await render(<Bar kit={twind} kind={kind} itemClassName={ITEM_OVERRIDES} />);
      const item = screen.container.querySelector(
        kind === "text" ? "[data-item=share]" : "[aria-label=Search]",
      );
      if (!item) throw new Error("not rendered");
      expectStyles(item, {
        borderTopLeftRadius: "0px",
        backgroundColor: "oklch(0.637 0.237 25.331)",
        paddingLeft: "32px",
        paddingTop: "4px",
        fontWeight: "700",
        cursor: "default",
      });
      await screen.unmount();
    }
  });

  test("the root's and the items' classes merge with a className, the user's last", () => {
    const root = cn(toolbarVariants({ size: "lg" }), "rounded-none text-sm gap-0 p-0");
    for (const gone of ["rounded-(--ow-radius)", "text-[1rem]", "gap-[4px]", "p-(--_pad)"]) {
      expect(root.split(" "), gone).not.toContain(gone);
    }
    const button = cn(toolbarButtonVariants({ size: "sm" }), "ow-toolbar-quiet:px-8");
    expect(button).toContain("ow-toolbar-quiet:px-8");
    expect(button).not.toContain("ow-toolbar-quiet:px-(--px)");
    expect(button).not.toContain("ow-toolbar-quiet:text-[0.875rem]");
  });
});
