// Generated from components/toggle by scripts/build-tailwind.ts; do not edit.
"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import type { ReactElement, ReactNode } from "react";
import { cn } from "../lib/cn";
import {
  type ToggleSize,
  type ToggleVariantProps,
  toggleSlots,
  toggleVariants,
} from "./toggle-variants";

export interface ToggleProps extends Omit<BaseToggle.Props, "className">, ToggleVariantProps {
  className?: string | undefined;
  /** The size of an outer part that renders this one, such as Toolbar.Button. */
  "data-size"?: ToggleSize | undefined;
  /** An icon before the label, the font size plus 2px. Decorative: the toggle needs a name. */
  startIcon?: ReactNode;
  /** An icon after the label. */
  endIcon?: ReactNode;
}

const icon = (node: ReactNode, side: "start" | "end") =>
  node == null ? null : (
    <span data-slot="toggle-icon" data-side={side} aria-hidden="true" className={toggleSlots.icon}>
      {node}
    </span>
  );

/**
 * A two-state button: flat while off, the raised key while on. Without children it is a square
 * icon button; give it an `aria-label`.
 */
export function Toggle({
  "data-size": outerSize,
  size = outerSize ?? "md",
  variant = "soft",
  startIcon,
  endIcon,
  className,
  children,
  ...props
}: ToggleProps): ReactElement {
  const iconOnly = children == null && (startIcon != null || endIcon != null);
  return (
    <BaseToggle
      data-slot="toggle"
      data-icon-only={iconOnly ? "" : undefined}
      {...props}
      className={cn(toggleVariants({ size, variant }), className)}
      data-size={size}
      data-variant={variant}
    >
      {icon(startIcon, "start")}
      {children}
      {icon(endIcon, "end")}
    </BaseToggle>
  );
}

export declare namespace Toggle {
  type Props = ToggleProps;
  type State = BaseToggle.State;
  type ChangeEventDetails = BaseToggle.ChangeEventDetails;
}
