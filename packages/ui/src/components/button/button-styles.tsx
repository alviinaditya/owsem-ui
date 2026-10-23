// No "use client": links styled as buttons are often rendered by Server Components.
import type { ComponentPropsWithoutRef, ReactElement } from "react";

export const cls = {
  root: "ow-button",
  layer: "ow-button__layer",
  ripple: "ow-button__ripple",
  icon: "ow-button__icon",
  glyph: "ow-button__glyph",
  label: "ow-button__label",
  spinner: "ow-button__spinner",
} as const;

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  /** @default "primary" */
  variant?: ButtonVariant | undefined;
  /** @default "md" */
  size?: ButtonSize | undefined;
  /** A flat tint of the variant's tone, for primary, secondary, and destructive. */
  soft?: boolean | undefined;
}

/** The attributes the button's CSS reads. */
export interface ButtonStyleAttributes {
  "data-variant": ButtonVariant;
  "data-size": ButtonSize;
  "data-soft": "" | undefined;
}

/** Shared by Button and buttonStyles(). */
export const styleAttributes = ({
  variant = "primary",
  size = "md",
  soft,
}: ButtonStyleOptions): ButtonStyleAttributes => ({
  "data-variant": variant,
  "data-size": size,
  "data-soft": soft ? "" : undefined,
});

/**
 * Button styling for an element that is not a button, such as a link (Base UI's Button keeps
 * button semantics, so links are styled, not rendered through it):
 *
 *   <a href="/docs" {...buttonStyles({ variant: "outline" })}>Docs</a>
 */
export function buttonStyles({
  className,
  ...options
}: ButtonStyleOptions & { className?: string | undefined } = {}): ButtonStyleAttributes & {
  className: string;
} {
  return {
    className: className ? `${cls.root} ${className}` : cls.root,
    ...styleAttributes(options),
  };
}

export interface ButtonIconProps extends ComponentPropsWithoutRef<"span"> {
  /** The end of the button the icon sits at; it is pulled toward that edge (FR-10). */
  side?: "start" | "end" | undefined;
}

/** An icon at one end of a button, the font size plus 2px; for links styled with buttonStyles(). */
export function ButtonIcon({ side = "start", className, ...props }: ButtonIconProps): ReactElement {
  return (
    <span
      aria-hidden="true"
      {...props}
      className={className ? `${cls.icon} ${className}` : cls.icon}
      data-side={side}
    />
  );
}
