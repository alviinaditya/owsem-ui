// No "use client": a Navigation Menu's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type NavigationMenuSize = "sm" | "md" | "lg";

export interface NavigationMenuVariantProps {
  /**
   * Button's sizes: triggers and links in the list are 32, 40, or 48px tall, and the panel's type
   * follows. Set it on the Root; the panel in the portal reads it from there.
   * @default "md"
   */
  size?: NavigationMenuSize | undefined;
}

const rootSize: Record<NavigationMenuSize, string> = {
  sm: "ow-navigation-menu--sm",
  md: "ow-navigation-menu--md",
  lg: "ow-navigation-menu--lg",
};

const triggerSize: Record<NavigationMenuSize, string> = {
  sm: "ow-navigation-menu__trigger--sm",
  md: "ow-navigation-menu__trigger--md",
  lg: "ow-navigation-menu__trigger--lg",
};

const popupSize: Record<NavigationMenuSize, string> = {
  sm: "ow-navigation-menu__popup--sm",
  md: "ow-navigation-menu__popup--md",
  lg: "ow-navigation-menu__popup--lg",
};

/** The root's classes. */
export function navigationMenuVariants({ size = "md" }: NavigationMenuVariantProps = {}): string {
  return cn("ow-navigation-menu", rootSize[size]);
}

/** A trigger's classes; a link in the list wears them too. */
export function navigationMenuTriggerVariants({
  size = "md",
}: NavigationMenuVariantProps = {}): string {
  return cn("ow-navigation-menu__trigger", triggerSize[size]);
}

/** The popup's classes. */
export function navigationMenuPopupVariants({
  size = "md",
}: NavigationMenuVariantProps = {}): string {
  return cn("ow-navigation-menu__popup", popupSize[size]);
}

/** The classes of the other parts. */
export const navigationMenuSlots = {
  list: "ow-navigation-menu__list",
  icon: "ow-navigation-menu__icon",
  backdrop: "ow-navigation-menu__backdrop",
  positioner: "ow-navigation-menu__positioner",
  viewport: "ow-navigation-menu__viewport",
  content: "ow-navigation-menu__content",
  link: "ow-navigation-menu__link",
  arrow: "ow-navigation-menu__arrow",
} as const;
