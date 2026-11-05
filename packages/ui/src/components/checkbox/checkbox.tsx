"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { type ForwardRefExoticComponent, forwardRef, type RefAttributes } from "react";
import { withClassName } from "../../core/class-name";
import "./checkbox.css";

const cls = { root: "ow-checkbox", indicator: "ow-checkbox__indicator" } as const;

// Icons from Lucide (https://lucide.dev), ISC License: check and minus.
const glyph = (name: "check" | "minus", path: string) => (
  <svg
    data-glyph={name}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={path} />
  </svg>
);

const GLYPHS = (
  <>
    {glyph("check", "M20 6 9 17l-5-5")}
    {glyph("minus", "M5 12h14")}
  </>
);

export type CheckboxIndicatorProps = Omit<BaseCheckbox.Indicator.Props, "ref">;

/**
 * Shows the state: a check or a minus that crossfade. Children replace them, and can be any node;
 * mark a pair with `data-glyph="check"` and `data-glyph="minus"` to keep the crossfade.
 */
export const CheckboxIndicator: ForwardRefExoticComponent<
  CheckboxIndicatorProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, CheckboxIndicatorProps>(function CheckboxIndicator(
  { className, children = GLYPHS, ...props },
  ref,
) {
  return (
    <BaseCheckbox.Indicator
      ref={ref}
      className={withClassName(cls.indicator, className)}
      {...props}
    >
      {children}
    </BaseCheckbox.Indicator>
  );
});

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxRootProps extends Omit<BaseCheckbox.Root.Props, "ref"> {
  /** Button's fonts (FR-11), and the box is the font size plus 2px: 15, 16, or 18 px. @default "md" */
  size?: CheckboxSize | undefined;
}

/** The box. Without children it draws its Indicator; it needs a `<label>` or an `aria-label`. */
export const CheckboxRoot: ForwardRefExoticComponent<
  CheckboxRootProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, CheckboxRootProps>(function CheckboxRoot(
  { className, size = "md", children = <CheckboxIndicator />, ...props },
  ref,
) {
  return (
    <BaseCheckbox.Root
      ref={ref}
      className={withClassName(cls.root, className)}
      data-size={size}
      {...props}
    >
      {children}
    </BaseCheckbox.Root>
  );
});
