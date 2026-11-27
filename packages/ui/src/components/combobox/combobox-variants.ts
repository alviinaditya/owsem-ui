// No "use client": a Combobox's classes can be used from Server Components.
import { cn } from "../../core/cn";
import { inputVariants } from "../input/input-variants";
import { selectPopupVariants, selectSlots } from "../select/select-variants";

export type ComboboxSize = "sm" | "md" | "lg";

export interface ComboboxVariantProps {
  /** The field's and the items' type scale: 13, 14, or 16px. @default "md" */
  size?: ComboboxSize | undefined;
}

const groupSizeClass: Record<ComboboxSize, string> = {
  sm: "ow-combobox__input-group--sm",
  md: "ow-combobox__input-group--md",
  lg: "ow-combobox__input-group--lg",
};

/** The input group's classes: the field, as tall as an Input of the size. */
export function comboboxInputGroupVariants({ size = "md" }: ComboboxVariantProps = {}): string {
  return cn("ow-combobox__input-group", groupSizeClass[size]);
}

/** The classes of an input outside an input group: an Input's own. */
export function comboboxInputVariants({ size = "md" }: ComboboxVariantProps = {}): string {
  return inputVariants({ size });
}

/** The popup's classes: Select's, so the two lists look alike. */
export function comboboxPopupVariants({ size = "md" }: ComboboxVariantProps = {}): string {
  return cn(selectPopupVariants({ size }), "ow-combobox__popup");
}

/** The classes of the other parts. Items, groups, and separators are Select's. */
export const comboboxSlots: Record<
  | "label"
  | "inputGroupInput"
  | "chips"
  | "chip"
  | "chipRemove"
  | "trigger"
  | "clear"
  | "icon"
  | "backdrop"
  | "positioner"
  | "status"
  | "empty"
  | "list"
  | "item"
  | "itemIndicator"
  | "groupLabel"
  | "separator",
  string
> = {
  label: selectSlots.label,
  inputGroupInput: "ow-combobox__input",
  chips: "ow-combobox__chips",
  chip: "ow-combobox__chip",
  chipRemove: "ow-combobox__chip-remove",
  trigger: "ow-combobox__trigger",
  clear: "ow-combobox__clear",
  icon: "ow-combobox__icon",
  backdrop: selectSlots.backdrop,
  positioner: selectSlots.positioner,
  status: "ow-combobox__status",
  empty: "ow-combobox__empty",
  list: cn(selectSlots.list, "ow-combobox__list"),
  item: cn(selectSlots.item, "ow-combobox__item"),
  itemIndicator: selectSlots.itemIndicator,
  groupLabel: selectSlots.groupLabel,
  separator: selectSlots.separator,
};
