"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import {
  type ForwardRefExoticComponent,
  forwardRef,
  type ReactNode,
  type RefAttributes,
} from "react";
import { withClassName } from "../../core/class-name";
import "./toggle.css";

const cls = { root: "ow-toggle", icon: "ow-toggle-icon" } as const;

export type ToggleSize = "sm" | "md" | "lg";

export interface ToggleProps extends Omit<BaseToggle.Props, "ref"> {
  /** Button's sizes (FR-11): 29.25, 38.5, or 48 px tall. @default "md" */
  size?: ToggleSize | undefined;
  /** An icon before the label, the font size plus 2px. Decorative: the toggle needs a name. */
  startIcon?: ReactNode;
  /** An icon after the label. */
  endIcon?: ReactNode;
}

const icon = (node: ReactNode, side: "start" | "end") =>
  node == null ? null : (
    <span className={cls.icon} data-side={side} aria-hidden="true">
      {node}
    </span>
  );

/**
 * A two-state button: flat while off, the raised key while on. Without children it is a square
 * icon button; give it an `aria-label`.
 */
export const Toggle: ForwardRefExoticComponent<ToggleProps & RefAttributes<HTMLButtonElement>> =
  forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
    { className, size, startIcon, endIcon, children, ...props },
    ref,
  ) {
    const iconOnly = children == null && (startIcon != null || endIcon != null);
    return (
      // A data-size passed in (Toolbar.Button rendering this toggle) wins over the default, and
      // the toggle's own size over both.
      <BaseToggle
        ref={ref}
        className={withClassName(cls.root, className)}
        data-size="md"
        data-icon-only={iconOnly ? "" : undefined}
        {...props}
        {...(size ? { "data-size": size } : undefined)}
      >
        {icon(startIcon, "start")}
        {children}
        {icon(endIcon, "end")}
      </BaseToggle>
    );
  });

export declare namespace Toggle {
  type Props = ToggleProps;
  type State = BaseToggle.State;
  type ChangeEventDetails = BaseToggle.ChangeEventDetails;
}
