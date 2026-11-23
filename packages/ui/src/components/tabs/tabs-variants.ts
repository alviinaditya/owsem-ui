// No "use client": the classes of Tabs can be used from Server Components.
import { cn } from "../../core/cn";

export type TabsSize = "sm" | "md" | "lg";

export interface TabsListVariantProps {
  /** Font size and padding of the tabs. @default "md" */
  size?: TabsSize | undefined;
}

const sizeClass: Record<TabsSize, string> = {
  sm: "ow-tabs__list--sm",
  md: "ow-tabs__list--md",
  lg: "ow-tabs__list--lg",
};

/** The list's classes. */
export function tabsListVariants({ size = "md" }: TabsListVariantProps = {}): string {
  return cn("ow-tabs__list", sizeClass[size]);
}

/** The classes of the other parts. */
export const tabsSlots = {
  root: "ow-tabs",
  indicator: "ow-tabs__indicator",
  tab: "ow-tabs__tab",
  label: "ow-tabs__label",
  panel: "ow-tabs__panel",
} as const;
