import { describe, expect, test } from "vitest";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { checkboxSlots, checkboxVariants } from "../src/tailwind/checkbox/checkbox-variants";
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
import { popoverSlots } from "../src/tailwind/popover/popover-variants";
import { scrollAreaSlots } from "../src/tailwind/scroll-area/scroll-area-variants";
import { separatorSlots } from "../src/tailwind/separator/separator-variants";
import { switchSlots, switchVariants } from "../src/tailwind/switch/switch-variants";
import { tableSlots, tableVariants } from "../src/tailwind/table/table-variants";
import { toggleSlots, toggleVariants } from "../src/tailwind/toggle/toggle-variants";
import { tooltipSlots } from "../src/tailwind/tooltip/tooltip-variants";
import { classNames } from "./parity";

// The classes the Tailwind flavor writes with a shorthand of ours, such as px-(--px), must lose to
// a user's built-in utility of the same kind, whichever comes first: that is how a className wins.
const SIZES = ["sm", "md", "lg"] as const;
const all = classNames(
  ...[
    buttonSlots,
    checkboxSlots,
    copyButtonSlots,
    dialogSlots,
    fieldSlots,
    fieldsetSlots,
    formSlots,
    iconMorphSlots,
    inputSlots,
    kbdSlots,
    popoverSlots,
    scrollAreaSlots,
    separatorSlots,
    switchSlots,
    tableSlots,
    tooltipSlots,
  ].flatMap((slots) => Object.values(slots)),
  ...Object.values(toggleSlots),
  ...(["default", "sm"] as const).map((size) => tableVariants({ size })),
  ...SIZES.flatMap((size) => [
    checkboxVariants({ size }),
    switchVariants({ size }),
    toggleVariants({ size }),
    inputVariants({ size }),
    inputWrapperVariants({ size }),
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
  "border-t": "border-t-red-500",
  duration: "duration-75",
  ease: "ease-linear",
  h: "h-4",
  me: "me-1",
  "max-w": "max-w-4",
  mb: "mb-1",
  mt: "mt-1",
  "min-h": "min-h-4",
  ms: "ms-1",
  mx: "mx-1",
  my: "my-1",
  origin: "origin-center",
  outline: "outline-red-500",
  p: "p-1",
  pe: "pe-1",
  ps: "ps-1",
  px: "px-1",
  py: "py-1",
  rounded: "rounded-none",
  scale: "scale-50",
  shadow: "shadow-none",
  size: "size-4",
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
