// No "use client": a Menu's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type MenuSize = "sm" | "md" | "lg";

export interface MenuVariantProps {
  /** The items' type scale: 13, 14, or 16px. @default "md" */
  size?: MenuSize | undefined;
}

const sizeClass: Record<MenuSize, string> = {
  sm: "ow-menu__popup--sm",
  md: "ow-menu__popup--md",
  lg: "ow-menu__popup--lg",
};

/** The popup's classes. */
export function menuPopupVariants({ size = "md" }: MenuVariantProps = {}): string {
  return cn("ow-menu__popup", sizeClass[size]);
}

/** The classes of the other parts. */
export const menuSlots = {
  backdrop: "ow-menu__backdrop",
  positioner: "ow-menu__positioner",
  viewport: "ow-menu__viewport",
  item: "ow-menu__item",
  indicator: "ow-menu__indicator",
  chevron: "ow-menu__chevron",
  groupLabel: "ow-menu__group-label",
  separator: "ow-menu__separator",
} as const;
