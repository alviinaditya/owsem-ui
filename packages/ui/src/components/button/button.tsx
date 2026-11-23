"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { ReactElement, ReactNode } from "react";
import { cn } from "../../core/cn";
import { useRipple } from "../../core/use-ripple";
import {
  type ButtonSize,
  type ButtonVariantProps,
  buttonSlots,
  buttonVariants,
} from "./button-variants";
import "./button.css";

export interface ButtonProps extends Omit<BaseButton.Props, "className">, ButtonVariantProps {
  className?: string | undefined;
  /** The size of an outer part that renders this one, such as Toolbar.Button. */
  "data-size"?: ButtonSize | undefined;
  /**
   * Shows a spinner without changing the button's size: in the start icon's place, or centered
   * over the content, which keeps its box. The button ignores presses but keeps focus.
   */
  loading?: boolean | undefined;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export interface IconButtonProps extends Omit<ButtonProps, "startIcon" | "endIcon" | "children"> {
  icon: ReactNode;
  /** Required: the button shows no text. */
  "aria-label": string;
}

function Spinner(): ReactElement {
  return (
    <span data-slot="button-spinner" className={buttonSlots.spinner}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Button({
  "data-size": outerSize,
  variant = "primary",
  size = outerSize ?? "md",
  soft,
  loading,
  startIcon,
  endIcon,
  disabled,
  focusableWhenDisabled,
  className,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}: ButtonProps): ReactElement {
  const ripple = useRipple();
  // Mounted only for buttons that can load, so the spinner can fade in and out.
  const spinner = loading === undefined ? null : <Spinner />;
  return (
    <BaseButton
      data-slot="button"
      data-variant={variant}
      {...props}
      data-size={size}
      className={cn(buttonVariants({ variant, size, soft }), className)}
      // Base UI's way to load: disabled, but focusable, with aria-disabled.
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading ? "" : undefined}
      // Base UI skips these while disabled or loading.
      {...ripple.props({ onPointerDown, onPointerUp, onPointerLeave, onPointerCancel })}
    >
      {variant === "link" ? null : (
        <span className={buttonSlots.layer} aria-hidden="true">
          <span data-slot="button-ripple" ref={ripple.ref} className={buttonSlots.ripple} />
        </span>
      )}
      {startIcon == null ? spinner : null}
      {startIcon == null ? null : (
        <span
          data-slot="button-icon"
          data-side="start"
          aria-hidden="true"
          className={buttonSlots.icon}
        >
          <span className={buttonSlots.glyph}>{startIcon}</span>
          {spinner}
        </span>
      )}
      {children == null || children === false ? null : (
        <span data-slot="button-label" className={buttonSlots.label}>
          {children}
        </span>
      )}
      {endIcon == null ? null : (
        <span
          data-slot="button-icon"
          data-side="end"
          aria-hidden="true"
          className={buttonSlots.icon}
        >
          <span className={buttonSlots.glyph}>{endIcon}</span>
        </span>
      )}
    </BaseButton>
  );
}

/** A square button with one icon and no visible text, so `aria-label` is required. */
export function IconButton({ icon, variant = "ghost", ...props }: IconButtonProps): ReactElement {
  return <Button {...props} variant={variant} startIcon={icon} data-icon-only="" />;
}

export declare namespace Button {
  type Props = ButtonProps;
  type State = BaseButton.State;
}

export declare namespace IconButton {
  type Props = IconButtonProps;
  type State = BaseButton.State;
}
