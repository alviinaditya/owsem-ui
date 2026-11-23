"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ReactElement } from "react";
import { cn } from "../../core/cn";
import {
  type CheckboxSize,
  type CheckboxVariantProps,
  checkboxSlots,
  checkboxVariants,
} from "./checkbox-variants";
import "./checkbox.css";

// Icons from Lucide (https://lucide.dev), ISC License: check and minus. The viewBox is padded so
// the glyph is about 62% of the box.
const glyph = (name: "check" | "minus", path: string) => (
  <svg
    data-glyph={name}
    viewBox="-4 -4 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {/* Length 1, so CSS draws the check in with one dash (checkbox.css). */}
    <path className={checkboxSlots.stroke} d={path} pathLength={1} />
  </svg>
);

const GLYPHS = (
  <>
    {glyph("check", "M20 6 9 17l-5-5")}
    {glyph("minus", "M4 12h16")}
  </>
);

export interface CheckboxIndicatorProps extends Omit<BaseCheckbox.Indicator.Props, "className"> {
  className?: string | undefined;
}

/**
 * Shows the state: a check or a minus that crossfade. Children replace them, and can be any node;
 * mark a pair with `data-glyph="check"` and `data-glyph="minus"` to keep the crossfade.
 */
export function CheckboxIndicator({
  className,
  children = GLYPHS,
  ...props
}: CheckboxIndicatorProps): ReactElement {
  return (
    <BaseCheckbox.Indicator
      data-slot="checkbox-indicator"
      {...props}
      className={cn(checkboxSlots.indicator, className)}
    >
      {children}
    </BaseCheckbox.Indicator>
  );
}

export interface CheckboxRootProps
  extends Omit<BaseCheckbox.Root.Props, "className">,
    CheckboxVariantProps {
  className?: string | undefined;
  /** The size of an outer part that renders this one, such as Toolbar.Button. */
  "data-size"?: CheckboxSize | undefined;
}

/** The box. Without children it draws its Indicator; it needs a `<label>` or an `aria-label`. */
export function CheckboxRoot({
  "data-size": outerSize,
  size = outerSize ?? "md",
  className,
  children = <CheckboxIndicator />,
  ...props
}: CheckboxRootProps): ReactElement {
  return (
    <BaseCheckbox.Root
      data-slot="checkbox"
      {...props}
      className={cn(checkboxVariants({ size }), className)}
      data-size={size}
    >
      {children}
    </BaseCheckbox.Root>
  );
}
