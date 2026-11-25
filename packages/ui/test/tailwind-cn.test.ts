import { describe, expect, test } from "vitest";
import {
  accordionContentVariants,
  accordionSlots,
  accordionTriggerVariants,
} from "../src/tailwind/accordion/accordion-variants";
import { avatarSlots, avatarVariants } from "../src/tailwind/avatar/avatar-variants";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { checkboxSlots, checkboxVariants } from "../src/tailwind/checkbox/checkbox-variants";
import { codeBlockSlots } from "../src/tailwind/code-block/code-block-variants";
import {
  collapsibleContentVariants,
  collapsibleSlots,
  collapsibleTriggerVariants,
} from "../src/tailwind/collapsible/collapsible-variants";
import {
  colorPickerSlots,
  colorPickerTriggerVariants,
} from "../src/tailwind/color-picker/color-picker-variants";
import {
  commandMenuPopupVariants,
  commandMenuSlots,
  commandMenuTriggerVariants,
} from "../src/tailwind/command-menu/command-menu-variants";
import { copyButtonSlots } from "../src/tailwind/copy-button/copy-button-variants";
import { dialogSlots } from "../src/tailwind/dialog/dialog-variants";
import { fieldSlots } from "../src/tailwind/field/field-variants";
import { fieldsetSlots } from "../src/tailwind/fieldset/fieldset-variants";
import { formSlots } from "../src/tailwind/form/form-variants";
import { iconMorphSlots } from "../src/tailwind/icon-morph/icon-morph-variants";
import {
  inputSlots,
  inputVariants,
  inputWrapperVariants,
} from "../src/tailwind/input/input-variants";
import { kbdSlots } from "../src/tailwind/kbd/kbd-variants";
import { cn } from "../src/tailwind/lib/cn";
import { glideSlots } from "../src/tailwind/lib/glide/glide-variants";
import { menuPopupVariants, menuSlots } from "../src/tailwind/menu/menu-variants";
import {
  meterLegendItemVariants,
  meterLegendVariants,
  meterSegmentVariants,
  meterSlots,
  meterVariants,
} from "../src/tailwind/meter/meter-variants";
import { popoverSlots } from "../src/tailwind/popover/popover-variants";
import { progressSlots, progressVariants } from "../src/tailwind/progress/progress-variants";
import {
  radioGroupSlots,
  radioGroupVariants,
} from "../src/tailwind/radio-group/radio-group-variants";
import { scrollAreaSlots } from "../src/tailwind/scroll-area/scroll-area-variants";
import {
  selectPopupVariants,
  selectSlots,
  selectTriggerVariants,
} from "../src/tailwind/select/select-variants";
import { separatorSlots } from "../src/tailwind/separator/separator-variants";
import { sidebarSlots } from "../src/tailwind/sidebar/sidebar-variants";
import { switchSlots, switchVariants } from "../src/tailwind/switch/switch-variants";
import { tableSlots, tableVariants } from "../src/tailwind/table/table-variants";
import { tableOfContentsSlots } from "../src/tailwind/table-of-contents/table-of-contents-variants";
import { tabsListVariants, tabsSlots } from "../src/tailwind/tabs/tabs-variants";
import { toggleSlots, toggleVariants } from "../src/tailwind/toggle/toggle-variants";
import {
  toggleGroupSlots,
  toggleGroupVariants,
} from "../src/tailwind/toggle-group/toggle-group-variants";
import {
  toolbarButtonVariants,
  toolbarInputVariants,
  toolbarLinkVariants,
  toolbarSlots,
  toolbarVariants,
} from "../src/tailwind/toolbar/toolbar-variants";
import { tooltipSlots } from "../src/tailwind/tooltip/tooltip-variants";
import { treeRailNavSlots } from "../src/tailwind/tree-rail-nav/tree-rail-nav-variants";
import { classNames } from "./parity";

// The classes the Tailwind flavor writes with a shorthand of ours, such as px-(--px), must lose to
// a user's built-in utility of the same kind, whichever comes first: that is how a className wins.
const SIZES = ["sm", "md", "lg"] as const;
const all = classNames(
  ...[
    accordionSlots,
    avatarSlots,
    buttonSlots,
    checkboxSlots,
    codeBlockSlots,
    collapsibleSlots,
    colorPickerSlots,
    commandMenuSlots,
    copyButtonSlots,
    dialogSlots,
    fieldSlots,
    fieldsetSlots,
    formSlots,
    glideSlots,
    iconMorphSlots,
    inputSlots,
    kbdSlots,
    menuSlots,
    meterSlots,
    popoverSlots,
    progressSlots,
    radioGroupSlots,
    scrollAreaSlots,
    selectSlots,
    separatorSlots,
    sidebarSlots,
    switchSlots,
    tableOfContentsSlots,
    tableSlots,
    tabsSlots,
    toggleGroupSlots,
    toolbarSlots,
    tooltipSlots,
    treeRailNavSlots,
  ].flatMap((slots) => Object.values(slots)),
  ...Object.values(toggleSlots),
  ...(["accent", "good", "warning", "critical"] as const).flatMap((tone) => [
    meterVariants({ tone }),
    meterSegmentVariants({ tone }),
    meterLegendItemVariants({ tone }),
  ]),
  meterSegmentVariants(),
  meterLegendItemVariants(),
  ...(["default", "sm"] as const).map((size) => tableVariants({ size })),
  ...SIZES.flatMap((size) => [
    accordionTriggerVariants({ size }),
    accordionContentVariants({ size }),
    avatarVariants({ size }),
    collapsibleTriggerVariants({ size }),
    collapsibleContentVariants({ size }),
    meterVariants({ size }),
    meterLegendVariants({ size }),
    progressVariants({ size }),
    checkboxVariants({ size }),
    switchVariants({ size }),
    toggleVariants({ size }),
    radioGroupVariants({ size }),
    toggleGroupVariants({ size }),
    tabsListVariants({ size }),
    inputVariants({ size }),
    inputWrapperVariants({ size }),
    commandMenuPopupVariants({ size }),
    commandMenuTriggerVariants({ size }),
    colorPickerTriggerVariants({ size }),
    colorPickerTriggerVariants({ size, variant: "swatch" }),
    menuPopupVariants({ size }),
    selectPopupVariants({ size }),
    selectTriggerVariants({ size }),
    toolbarButtonVariants({ size }),
    toolbarInputVariants({ size }),
    toolbarLinkVariants({ size }),
    toolbarVariants({ size }),
    ...(["primary", "secondary", "outline", "ghost", "link", "destructive"] as const).flatMap(
      (variant) => [false, true].map((soft) => buttonVariants({ variant, size, soft })),
    ),
  ]),
);

// The utility of each shorthand the class maps use, and a built-in utility of the same kind.
const BUILT_IN: Record<string, string> = {
  animate: "animate-none",
  bg: "bg-red-500",
  blur: "blur-none",
  border: "border-red-500",
  "border-b": "border-b-red-500",
  "border-s": "border-s-red-500",
  "border-t": "border-t-red-500",
  duration: "duration-75",
  gap: "gap-1",
  ease: "ease-linear",
  fill: "fill-red-500",
  grow: "grow-0",
  h: "h-4",
  me: "me-1",
  "max-w": "max-w-4",
  mb: "mb-1",
  end: "end-1",
  top: "top-1",
  pe: "pe-1",
  mt: "mt-1",
  "min-h": "min-h-4",
  "min-w": "min-w-4",
  "max-h": "max-h-4",
  ms: "ms-1",
  mx: "mx-1",
  pt: "pt-1",
  my: "my-1",
  "backdrop-blur": "backdrop-blur-none",
  origin: "origin-center",
  outline: "outline-red-500",
  p: "p-1",
  ps: "ps-1",
  px: "px-1",
  py: "py-1",
  "rounded-b": "rounded-b-none",
  "rounded-es": "rounded-es-none",
  "rounded-ee": "rounded-ee-none",
  "rounded-ss": "rounded-ss-none",
  "rounded-se": "rounded-se-none",
  rounded: "rounded-none",
  scale: "scale-50",
  "scroll-p": "scroll-p-1",
  "scroll-py": "scroll-py-1",
  shadow: "shadow-none",
  size: "size-4",
  stroke: "stroke-red-500",
  text: "text-red-500",
  w: "w-4",
};

// Tailwind 4.2 added these; an app on 4.1 would get no styles for them, and no warning.
const SINCE_4_2 =
  /^-?(?:(?:scroll-)?[mp]b[se]-|border-b[se](?:-|$)|inset-b?[se]-|(?:min-|max-)?(?:inline|block)-(?!flex|grid|block|table))/;
/** The utility after its variants; a colon inside brackets or parentheses is a value's. */
const utility = (name: string) => name.replace(/^(?:(?:[^:[(]|\[[^\]]*\]|\([^)]*\))+:)+/, "");

test("the class maps use only utilities of Tailwind 4.1", () => {
  const recent = (names: string[]) => names.filter((name) => SINCE_4_2.test(utility(name)));
  expect(
    recent(["mbs-2", "data-[side=top]:border-bs", "after:block-0", "max-inline-4"]),
  ).toHaveLength(4);
  expect(
    recent(["block", "inline-flex", "inset-x-0", "border-b", "group-data-[a=b]/c:mb-1"]),
  ).toEqual([]);
  expect(recent(all)).toEqual([]);
});

describe("cn and the shorthands of the class maps", () => {
  // Variants stay with the utility: before:bg-(color:--ow-accent) meets before:bg-red-500.
  const shorthands = all.filter((name) =>
    /-\((color:|shadow:)?--[\w-]+\)$|(^|:)animate-\[/.test(name),
  );

  test("each is replaced by a built-in of its kind, in either order", () => {
    expect(shorthands.length).toBeGreaterThan(30);
    const problems = shorthands.flatMap((name) => {
      const head = name.replace(/-(\(.*|\[[^\]]*\])$/, "");
      const prefix = head.slice(0, head.lastIndexOf(":") + 1);
      const utility = head.slice(prefix.length);
      const base = BUILT_IN[utility];
      if (!base) return [`${name}: add "${utility}" to this test`];
      const builtIn = `${prefix}${base}`;
      const merged = cn(name, builtIn);
      const reverse = cn(builtIn, name);
      return [
        ...(merged === builtIn ? [] : [`${name} + ${builtIn} gives ${merged}`]),
        ...(reverse === name ? [] : [`${builtIn} + ${name} gives ${reverse}`]),
      ];
    });
    expect(problems).toEqual([]);
  });

  test("a plain utility still merges", () => {
    expect(cn("px-4", false, undefined, "px-8")).toBe("px-8");
  });
});

describe("a user's className wins over Radio Group, Toggle Group, and Tabs", () => {
  // The shorthands above are replaced by built-ins; these are the parts a user reaches first.
  const tokens = (value: string) => value.split(" ");

  test("on the root", () => {
    const group = cn(radioGroupVariants({ size: "sm" }), "text-lg [--py:1em] gap-2 rounded-none");
    expect(tokens(group)).toContain("text-lg");
    expect(tokens(group)).toContain("[--py:1em]");
    expect(tokens(group)).not.toContain("text-[0.8125rem]");
    expect(tokens(group)).not.toContain("[--py:0.6058em]");
    expect(tokens(cn(tabsSlots.root, "gap-0 flex-col"))).not.toContain("gap-[0.75em]");
    const toggles = cn(toggleGroupVariants({ size: "lg" }), "text-sm p-0 rounded-none gap-0");
    for (const gone of ["text-[16px]", "p-(--_inset)", "gap-[2px]"]) {
      expect(tokens(toggles), gone).not.toContain(gone);
    }
  });

  test("on the list", () => {
    const list = cn(tabsListVariants({ size: "md" }), "text-lg p-0 overflow-visible bg-red-500");
    for (const gone of ["text-[14px]", "p-(--_inset)", "overflow-x-auto", "bg-(color:--_well)"]) {
      expect(tokens(list), gone).not.toContain(gone);
    }
    expect(tokens(list)).toContain("overflow-visible");
  });

  test("on an item, a tab, and a radio", () => {
    const item = tokens(cn(toggleGroupSlots.item, "px-8 py-1 text-red-500 rounded-none"));
    for (const gone of [
      "px-(--px)",
      "py-(--_py)",
      "text-(color:--_muted)",
      "rounded-(--_radius)",
    ]) {
      expect(item, gone).not.toContain(gone);
    }
    const tab = tokens(
      cn(tabsSlots.tab, "px-8 py-1 text-red-500 rounded-none data-active:bg-red-500"),
    );
    for (const gone of [
      "px-(--px)",
      "py-(--_py)",
      "text-(color:--_muted)",
      "rounded-(--_radius)",
    ]) {
      expect(tab, gone).not.toContain(gone);
    }
    expect(tab).toContain("data-active:bg-red-500");
    const radio = tokens(cn(radioGroupSlots.radio, "rounded-none cursor-default size-4"));
    for (const gone of ["rounded-[50%]", "cursor-pointer", "size-(--icon)"]) {
      expect(radio, gone).not.toContain(gone);
    }
    expect(tokens(cn(glideSlots.root, "opacity-100 rounded-none"))).not.toContain("opacity-0");
  });
});

describe("a user's className wins over Menu, Select, Toolbar, Code Block, and Command Menu", () => {
  const tokens = (value: string) => value.split(" ");
  const gone = (value: string, names: string[]) => {
    for (const name of names) expect(tokens(value), name).not.toContain(name);
  };

  test("on a trigger", () => {
    gone(
      cn(selectTriggerVariants({ size: "sm" }), "px-8 py-1 rounded-none text-lg gap-0 bg-red-500"),
      [
        "px-(--px)",
        "py-(--_py)",
        "rounded-(--ow-radius)",
        "text-[0.8125rem]",
        "gap-[0.5em]",
        "bg-(color:--_bg)",
      ],
    );
    gone(cn(commandMenuTriggerVariants({ size: "lg" }), "px-8 rounded-none text-sm bg-red-500"), [
      "px-(--px)",
      "rounded-(--ow-radius)",
      "text-[16px]",
      "bg-(color:--_bg)",
    ]);
  });

  test("on a popup", () => {
    gone(cn(menuPopupVariants({ size: "lg" }), "rounded-none text-sm shadow-none bg-red-500"), [
      "rounded-(--ow-radius)",
      "text-[1rem]",
      "shadow-(shadow:--_shadow)",
      "bg-(color:--_bg)",
    ]);
    gone(cn(selectPopupVariants({ size: "sm" }), "rounded-none text-lg bg-red-500 max-w-4"), [
      "rounded-(--ow-radius)",
      "text-[0.8125rem]",
      "bg-(color:--_bg)",
    ]);
    gone(cn(commandMenuPopupVariants({ size: "md" }), "rounded-none text-lg bg-red-500 w-4"), [
      "rounded-(--ow-radius)",
      "text-[14px]",
      "bg-(color:--_bg)",
      "w-[min(100%,560px)]",
    ]);
  });

  test("on an item", () => {
    for (const slot of [menuSlots.item, selectSlots.item, commandMenuSlots.item]) {
      gone(cn(slot, "px-8 py-1 rounded-none text-red-500 gap-0"), [
        "px-(--px)",
        "py-(--_py)",
        "gap-[0.5em]",
      ]);
    }
    gone(cn(menuSlots.item, "rounded-none text-red-500"), [
      "rounded-(--_inner)",
      "text-(color:--_fg)",
    ]);
    gone(cn(commandMenuSlots.item, "rounded-none"), ["rounded-(--_radius)"]);
  });

  test("on the root, and the tabs and the panel of a Code Block", () => {
    gone(cn(toolbarVariants({ size: "lg" }), "rounded-none text-sm gap-0 p-0 bg-red-500"), [
      "rounded-(--ow-radius)",
      "text-[1rem]",
      "gap-[4px]",
      "p-(--_pad)",
      "bg-(color:--_bg)",
    ]);
    gone(cn(codeBlockSlots.root, "rounded-none bg-red-500 text-red-500"), [
      "rounded-(--_corner)",
      "bg-(color:--_panel)",
      "text-(color:--_fg)",
    ]);
    gone(cn(codeBlockSlots.tab, "px-8 py-1 rounded-none"), ["rounded-(--_radius)"]);
    gone(cn(codeBlockSlots.panel, "rounded-none text-sm"), ["text-[0.8125rem]"]);
  });

  test("a toolbar item's own utilities have no specificity, so a user's utility needs no merge", () => {
    const button = cn(toolbarButtonVariants({ size: "md" }), "px-8 rounded-none");
    expect(tokens(button)).toContain("ow-toolbar-quiet:px-(--px)");
    expect(tokens(button)).toContain("px-8");
  });
});

describe("a user's className wins over Color Picker and Table of Contents", () => {
  const tokens = (value: string) => value.split(" ");
  const gone = (value: string, names: string[]) => {
    for (const name of names) expect(tokens(value), name).not.toContain(name);
  };

  test("on the root", () => {
    gone(cn(colorPickerSlots.root, "w-64 gap-2 rounded-none p-0 text-lg bg-red-500 shadow-none"), [
      "w-[256px]",
      "gap-(--_pad)",
      "rounded-(--_radius)",
      "p-(--_pad)",
      "text-[13px]",
      "bg-(color:--_bg)",
      "shadow-(shadow:--_panel-shadow)",
    ]);
    gone(cn(tableOfContentsSlots.root, "text-lg leading-none"), ["text-[13.5px]", "leading-[1.4]"]);
  });

  test("on the trigger, in each size and in the swatch variant", () => {
    gone(
      cn(
        colorPickerTriggerVariants({ size: "sm" }),
        "px-8 py-1 rounded-none text-lg gap-0 bg-red-500",
      ),
      [
        "px-(--px)",
        "py-(--_py)",
        "rounded-(--_radius)",
        "text-[13px]",
        "gap-[0.5em]",
        "bg-(color:--_surface)",
      ],
    );
    gone(
      cn(colorPickerTriggerVariants({ size: "lg", variant: "swatch" }), "size-8 p-1 shadow-md"),
      ["size-[calc(2_*_var(--_py)_+_1lh)]", "shadow-none"],
    );
  });

  test("on the parts inside the picker", () => {
    gone(cn(colorPickerSlots.area, "rounded-none h-20 shadow-none"), [
      "rounded-(--_radius)",
      "h-[160px]",
      "shadow-(shadow:--_color-edge)",
    ]);
    gone(cn(colorPickerSlots.tool, "rounded-none size-8 bg-red-500"), [
      "rounded-(--_radius)",
      "size-(--_tool)",
      "bg-(color:--_key)",
    ]);
    gone(cn(colorPickerSlots.input, "rounded-none px-4 text-lg bg-red-500"), [
      "rounded-(--_radius)",
      "px-[2px]",
      "text-[13px]",
      "bg-(color:--_field)",
    ]);
    gone(cn(colorPickerSlots.swatch, "rounded-none text-red-500"), [
      "rounded-[calc(var(--_radius)_-_2px)]",
      "text-[#fff]",
    ]);
  });

  test("on a link and a list of a Table of Contents", () => {
    gone(cn(tableOfContentsSlots.link, "px-8 py-1 rounded-none text-red-500"), [
      "py-[4px]",
      "rounded-(--_radius)",
      "text-(color:--_muted)",
    ]);
    gone(cn(tableOfContentsSlots.list, "p-2 m-2"), ["m-0", "p-0"]);
    gone(cn(tableOfContentsSlots.marker, "w-1 opacity-100 bg-red-500"), [
      "w-[2px]",
      "opacity-0",
      "bg-(color:--_marker)",
    ]);
  });
});

describe("a user's className wins over Tree Rail Nav and Sidebar", () => {
  const tokens = (value: string) => value.split(" ");
  const gone = (value: string, names: string[]) => {
    for (const name of names) expect(tokens(value), name).not.toContain(name);
  };

  test("on the root", () => {
    gone(cn(treeRailNavSlots.root, "text-lg leading-none"), ["text-[13.5px]", "leading-[1.4]"]);
    gone(cn(sidebarSlots.root, "w-64 text-sm rounded-none bg-red-500 opacity-100"), [
      "w-[248px]",
      "text-[0.875rem]",
    ]);
    gone(cn(sidebarSlots.provider, "min-w-8"), ["min-w-0"]);
  });

  test("on a row and a link", () => {
    gone(cn(treeRailNavSlots.item, "min-h-10 px-8 rounded-none text-red-500 cursor-default"), [
      "min-h-[32px]",
      "px-[10px]",
      "rounded-(--_radius)",
      "text-(color:--_muted)",
      "cursor-pointer",
    ]);
    gone(cn(sidebarSlots.link, "h-10 px-8 rounded-none text-red-500 cursor-default"), [
      "h-[calc(32em_/_14)]",
      "rounded-(--_radius)",
      "cursor-pointer",
    ]);
    expect(cn(sidebarSlots.link, "data-active:font-bold")).toContain("data-active:font-bold");
  });

  test("on a header and a trigger", () => {
    gone(cn(sidebarSlots.header, "p-0"), ["p-[12px]"]);
    gone(cn(sidebarSlots.trigger, "size-10 rounded-none bg-red-500 text-lg"), [
      "size-[calc(32em_/_14)]",
      "bg-transparent",
    ]);
    gone(cn(treeRailNavSlots.panel, "duration-700 h-8"), [
      "duration-340",
      "h-(--collapsible-panel-height)",
    ]);
  });
});
