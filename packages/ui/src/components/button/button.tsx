"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import {
  type ForwardRefExoticComponent,
  forwardRef,
  type PointerEvent,
  type ReactNode,
  type RefAttributes,
  useRef,
} from "react";
import { withClassName } from "../../core/class-name";
import { ButtonIcon, type ButtonStyleOptions, cls, styleAttributes } from "./button-styles";
import "./button.css";

const PRESSED = "data-pressed";

export interface ButtonProps extends Omit<BaseButton.Props, "ref">, ButtonStyleOptions {
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

function Spinner() {
  return (
    <span className={cls.spinner}>
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

/** Restarts the ripple at the press point: a CSS transition, so nothing runs per frame. */
function startRipple(button: HTMLElement, ripple: HTMLElement, event: PointerEvent): void {
  const box = button.getBoundingClientRect();
  const style = getComputedStyle(button);
  const w = Number.parseFloat(style.width);
  const h = Number.parseFloat(style.height);
  // Layout px per screen px: undoes the press scale and any scaled ancestor.
  const k = box.width ? w / box.width : 1;
  const x = (event.clientX - box.left) * k;
  const y = (event.clientY - box.top) * k;
  ripple.style.setProperty("--_x", `${x}px`);
  ripple.style.setProperty("--_y", `${y}px`);
  ripple.style.setProperty("--_d", `${2 * Math.hypot(Math.max(x, w - x), Math.max(y, h - y))}px`);
  delete ripple.dataset.state;
  // Reading the style applies the reset, so the transition starts from the press point.
  getComputedStyle(ripple).opacity;
  ripple.dataset.state = "on";
}

// forwardRef keeps refs working on React 18, where `ref` is not a prop.
export const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLElement>> =
  forwardRef<HTMLElement, ButtonProps>(function Button(
    {
      variant,
      size,
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
    },
    ref,
  ) {
    const ripple = useRef<HTMLSpanElement>(null);
    // Mounted only for buttons that can load, so the spinner can fade in and out.
    const spinner = loading === undefined ? null : <Spinner />;
    const release = (button: HTMLElement) => {
      button.removeAttribute(PRESSED);
      if (ripple.current?.dataset.state === "on") ripple.current.dataset.state = "off";
    };
    return (
      <BaseButton
        {...props}
        ref={ref}
        className={withClassName(cls.root, className)}
        // Base UI's way to load: disabled, but focusable, with aria-disabled.
        disabled={disabled || loading}
        focusableWhenDisabled={focusableWhenDisabled || loading}
        aria-busy={loading || undefined}
        {...styleAttributes({ variant, size, soft })}
        data-loading={loading ? "" : undefined}
        // Base UI skips this while disabled or loading.
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || event.button !== 0) return;
          event.currentTarget.setAttribute(PRESSED, "");
          if (ripple.current) startRipple(event.currentTarget, ripple.current, event);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          release(event.currentTarget);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          release(event.currentTarget);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          release(event.currentTarget);
        }}
      >
        {variant === "link" ? null : (
          <span className={cls.layer} aria-hidden="true">
            <span ref={ripple} className={cls.ripple} />
          </span>
        )}
        {startIcon == null ? spinner : null}
        {startIcon == null ? null : (
          <ButtonIcon side="start">
            <span className={cls.glyph}>{startIcon}</span>
            {spinner}
          </ButtonIcon>
        )}
        {children == null || children === false ? null : (
          <span className={cls.label}>{children}</span>
        )}
        {endIcon == null ? null : (
          <ButtonIcon side="end">
            <span className={cls.glyph}>{endIcon}</span>
          </ButtonIcon>
        )}
      </BaseButton>
    );
  });

/** A square button with one icon and no visible text, so `aria-label` is required. */
export const IconButton: ForwardRefExoticComponent<IconButtonProps & RefAttributes<HTMLElement>> =
  forwardRef<HTMLElement, IconButtonProps>(function IconButton(
    { icon, variant = "ghost", ...props },
    ref,
  ) {
    return <Button {...props} ref={ref} variant={variant} startIcon={icon} data-icon-only="" />;
  });

export declare namespace Button {
  type Props = ButtonProps;
  type State = BaseButton.State;
}

export declare namespace IconButton {
  type Props = IconButtonProps;
  type State = BaseButton.State;
}
