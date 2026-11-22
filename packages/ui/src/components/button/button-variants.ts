// No "use client": links styled as buttons are often rendered by Server Components.
import { cn } from "../../core/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonVariantProps {
  /** @default "primary" */
  variant?: ButtonVariant | undefined;
  /** @default "md" */
  size?: ButtonSize | undefined;
  /** A flat tint of the variant's tone, for primary, secondary, and destructive. */
  soft?: boolean | undefined;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "ow-button--primary",
  secondary: "ow-button--secondary",
  outline: "ow-button--outline",
  ghost: "ow-button--ghost",
  link: "ow-button--link",
  destructive: "ow-button--destructive",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "ow-button--sm",
  md: "ow-button--md",
  lg: "ow-button--lg",
};

/**
 * The root's classes. Style a link as a button with it:
 *
 *   <a href="/docs" className={buttonVariants({ variant: "outline" })}>Docs</a>
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  soft,
}: ButtonVariantProps = {}): string {
  return cn("ow-button", variantClass[variant], sizeClass[size], soft && "ow-button--soft");
}

/** The classes of the inner parts. */
export const buttonSlots = {
  layer: "ow-button__layer",
  ripple: "ow-button__ripple",
  icon: "ow-button__icon",
  glyph: "ow-button__glyph",
  label: "ow-button__label",
  spinner: "ow-button__spinner",
} as const;
