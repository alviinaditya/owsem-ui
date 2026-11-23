// No "use client": a Select's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectVariantProps {
  /** The trigger's and the items' type scale: 13, 14, or 16px. @default "md" */
  size?: SelectSize | undefined;
}

const triggerSizeClass: Record<SelectSize, string> = {
  sm: "ow-select__trigger--sm",
  md: "ow-select__trigger--md",
  lg: "ow-select__trigger--lg",
};

const popupSizeClass: Record<SelectSize, string> = {
  sm: "ow-select__popup--sm",
  md: "ow-select__popup--md",
  lg: "ow-select__popup--lg",
};

/** The trigger's classes. */
export function selectTriggerVariants({ size = "md" }: SelectVariantProps = {}): string {
  return cn("ow-select__trigger", triggerSizeClass[size]);
}

/** The popup's classes. */
export function selectPopupVariants({ size = "md" }: SelectVariantProps = {}): string {
  return cn("ow-select__popup", popupSizeClass[size]);
}

/** The classes of the other parts. */
export const selectSlots = {
  backdrop: "ow-select__backdrop",
  label: "ow-select__label",
  value: "ow-select__value",
  icon: "ow-select__icon",
  positioner: "ow-select__positioner",
  scrollUpArrow: "ow-select__scroll-up-arrow",
  scrollDownArrow: "ow-select__scroll-down-arrow",
  list: "ow-select__list",
  item: "ow-select__item",
  itemText: "ow-select__item-text",
  itemIndicator: "ow-select__item-indicator",
  groupLabel: "ow-select__group-label",
  separator: "ow-select__separator",
} as const;
