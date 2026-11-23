// No "use client": a Toolbar's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type ToolbarSize = "sm" | "md" | "lg";

export interface ToolbarVariantProps {
  /**
   * Button's sizes: the bar is 32, 40, or 48px tall. Items that do not set their own follow it.
   * @default "md"
   */
  size?: ToolbarSize | undefined;
}

const rootSize: Record<ToolbarSize, string> = {
  sm: "ow-toolbar--sm",
  md: "ow-toolbar--md",
  lg: "ow-toolbar--lg",
};

const buttonSize: Record<ToolbarSize, string> = {
  sm: "ow-toolbar__button--sm",
  md: "ow-toolbar__button--md",
  lg: "ow-toolbar__button--lg",
};

const linkSize: Record<ToolbarSize, string> = {
  sm: "ow-toolbar__link--sm",
  md: "ow-toolbar__link--md",
  lg: "ow-toolbar__link--lg",
};

const inputSize: Record<ToolbarSize, string> = {
  sm: "ow-toolbar__input--sm",
  md: "ow-toolbar__input--md",
  lg: "ow-toolbar__input--lg",
};

/** The root's classes. */
export function toolbarVariants({ size = "md" }: ToolbarVariantProps = {}): string {
  return cn("ow-toolbar", rootSize[size]);
}

/** A button's classes. */
export function toolbarButtonVariants({ size = "md" }: ToolbarVariantProps = {}): string {
  return cn("ow-toolbar__button", buttonSize[size]);
}

/** A link's classes. */
export function toolbarLinkVariants({ size = "md" }: ToolbarVariantProps = {}): string {
  return cn("ow-toolbar__link", linkSize[size]);
}

/** An input's classes. */
export function toolbarInputVariants({ size = "md" }: ToolbarVariantProps = {}): string {
  return cn("ow-toolbar__input", inputSize[size]);
}

/** The classes of the other parts. */
export const toolbarSlots = {
  group: "ow-toolbar__group",
  icon: "ow-toolbar__icon",
  separator: "ow-toolbar__separator",
} as const;
