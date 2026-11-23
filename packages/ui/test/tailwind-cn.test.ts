import { describe, expect, test } from "vitest";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { fieldSlots } from "../src/tailwind/field/field-variants";
import { fieldsetSlots } from "../src/tailwind/fieldset/fieldset-variants";
import { formSlots } from "../src/tailwind/form/form-variants";
import {
  inputSlots,
  inputVariants,
  inputWrapperVariants,
} from "../src/tailwind/input/input-variants";
import { kbdSlots } from "../src/tailwind/kbd/kbd-variants";
import { cn } from "../src/tailwind/lib/cn";
import { separatorSlots } from "../src/tailwind/separator/separator-variants";
import { toggleSlots, toggleVariants } from "../src/tailwind/toggle/toggle-variants";
import { classNames } from "./parity";

// The classes the Tailwind flavor writes with a shorthand of ours, such as px-(--px), must lose to
// a user's built-in utility of the same kind, whichever comes first: that is how a className wins.
const SIZES = ["sm", "md", "lg"] as const;
const all = classNames(
  ...[
    buttonSlots,
    fieldSlots,
    fieldsetSlots,
    formSlots,
    inputSlots,
    kbdSlots,
    separatorSlots,
  ].flatMap((slots) => Object.values(slots)),
  ...Object.values(toggleSlots),
  ...SIZES.flatMap((size) => [
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
  border: "border-red-500",
  duration: "duration-75",
  ease: "ease-linear",
  h: "h-4",
  me: "me-1",
  "min-h": "min-h-4",
  ms: "ms-1",
  outline: "outline-red-500",
  pe: "pe-1",
  ps: "ps-1",
  px: "px-1",
  py: "py-1",
  rounded: "rounded-none",
  scale: "scale-50",
  shadow: "shadow-none",
  size: "size-4",
  text: "text-red-500",
};

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
