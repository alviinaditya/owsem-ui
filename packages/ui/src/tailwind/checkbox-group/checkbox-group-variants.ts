// Generated from components/checkbox-group by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of checkbox-group-variants.ts: the same exports, with the styles as
// utility classes. Needs tokens.css, and nothing from the bridge (tailwind.css).

import { cva } from "class-variance-authority";
import type { CheckboxGroupSize } from "../lib/checkbox-group-size";
import { cn } from "../lib/cn";

export type { CheckboxGroupSize };

export interface CheckboxGroupVariantProps {
  /** Button's fonts and row heights: 32, 40, or 48 px tall. The Checkboxes in it take it. @default "md" */
  size?: CheckboxGroupSize | undefined;
}

// A row is a <label> holding a checkbox, with Button's geometry. --py comes from the group, or from
// the row's own style. The rows are matched from the group, as :where, so a user's class on a row
// is as specific as these.
const row = [
  "[&_:where(label:has([role=checkbox]))]:[--_py:max(var(--py),(24px_-_1lh)_/_2)]",
  "[&_:where(label:has([role=checkbox]))]:[--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[&_:where(label:has([role=checkbox]))]:flex",
  "[&_:where(label:has([role=checkbox]))]:items-start",
  "[&_:where(label:has([role=checkbox]))]:gap-[0.5em]",
  "[&_:where(label:has([role=checkbox]))]:box-border",
  "[&_:where(label:has([role=checkbox]))]:py-(--_py)",
  "[&_:where(label:has([role=checkbox]))]:px-(--px)",
  "[&_:where(label:has([role=checkbox]))]:cursor-pointer",
  "[&_:where(label:has([role=checkbox]))]:touch-manipulation",
  "[&_:where(label:has([role=checkbox]))]:[-webkit-tap-highlight-color:transparent]",
  "[&_:where(label:has([role=checkbox][data-readonly]))]:cursor-default",
  // A disabled row dims as one, its box with it, so the box does not dim a second time.
  "[&_:where(label:has([role=checkbox][data-disabled]))]:opacity-50",
  "[&_:where(label:has([role=checkbox][data-disabled]))]:cursor-not-allowed",
  "[&_:where(label)_[role=checkbox][data-disabled]]:opacity-100",
  // The label turns gray with the system's disabled color.
  "forced-colors:[&_:where(label:has([role=checkbox][data-disabled]))]:text-[GrayText]",
  "forced-colors:[&_:where(label:has([role=checkbox][data-disabled]))]:opacity-100",
  // In a row: on the first line of a label that wraps, and as far from the start as from the top.
  "[&_:where(label>[role=checkbox])]:my-[calc((1lh_-_var(--icon))_/_2)]",
  "[&_:where(label>[role=checkbox]:first-child)]:ms-[calc((1cap_-_var(--icon))_/_2)]",
];

// The group sets no width: it fits its rows, and a rule on className lays them out in a row or a
// grid. Glide's container, so it holds the highlight behind the rows.
const root = [
  "[--_fg:var(--ow-fg)]",
  "relative isolate inline-flex flex-col align-top",
  "text-(color:--_fg)",
  ...row,
];

const sizeStyles = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The group's classes. */
export function checkboxGroupVariants({ size }: CheckboxGroupVariantProps = {}): string {
  return cn(variants({ size }));
}
