// Generated from components/combobox by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of combobox-variants.ts: the same exports, with the styles as utility
// classes. Needs tokens.css, and from the bridge (tailwind.css) the ow-input-invalid and
// ow-input-disabled variants and the ow-input-shake and ow-input-blink keyframes.

import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";
import { inputVariants } from "../input/input-variants";
import { selectPopupVariants, selectSlots } from "../select/select-variants";

export type ComboboxSize = "sm" | "md" | "lg";

export interface ComboboxVariantProps {
  /** The field's and the items' type scale: 13, 14, or 16px. @default "md" */
  size?: ComboboxSize | undefined;
}

// The input group is the field, drawn as Input is: a 6% tint of the text color, 9% on hover, a ring
// while the input has focus, critical when invalid, dim when disabled. It is as tall as an Input of
// the size; the buttons inside are squares inset 4px from its ends.
const inputGroup = [
  // The theme tokens it reads.
  "[--_bg:color-mix(in_oklab,var(--ow-fg)_6%,transparent)] [--_fg:var(--ow-fg)]",
  "[--_focus:var(--ow-focus)]",
  "[--_py:max(var(--py),(24px_-_1lh)_/_2)] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)] [--_inset:4px]",
  // Input's height, and the buttons' side: that less the inset on both sides.
  "[--_height:calc(2_*_var(--_py)_+_1lh)] [--_stepper:calc(var(--_height)_-_2_*_var(--_inset))]",
  // Box.
  "flex items-start box-border w-full min-w-0 min-h-(--_height) p-(--_inset)",
  "rounded-(--ow-radius) bg-(color:--_bg) text-(color:--_fg) cursor-text",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // The tint deepens on hover, and turns critical when invalid.
  "pointer-fine:hover:not-data-disabled:not-ow-input-invalid:[--_bg:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "ow-input-invalid:[--_bg:color-mix(in_oklab,var(--ow-critical)_14%,transparent)]",
  // Rejects once when it becomes invalid, as Input does (its keyframes). data-armed is set while it
  // is valid (core/shake.ts), so a field invalid from the start stays still.
  "ow-input-invalid:data-armed:not-data-[shake=off]:will-change-transform",
  "ow-input-invalid:data-armed:not-data-[shake=off]:animate-[ow-input-shake_320ms_var(--ow-ease-out)]",
  "motion-reduce:ow-input-invalid:data-armed:not-data-[shake=off]:animate-[ow-input-blink_160ms_var(--ow-ease-out)]",
  // The ring is the group's, while the input has focus.
  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2",
  "has-[input:focus-visible]:outline-(color:--_focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  // The transparent outline is the edge; invalid thickens it, since its color is gone.
  "forced-colors:ow-input-invalid:outline-2 forced-colors:ow-input-invalid:-outline-offset-2",
  "forced-colors:has-[input:focus-visible]:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

const inputGroupSizes = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

const inputGroupVariants = cva(inputGroup, {
  variants: { size: inputGroupSizes },
  defaultVariants: { size: "md" },
});

/** The input group's classes: the field, as tall as an Input of the size. */
export function comboboxInputGroupVariants({ size }: ComboboxVariantProps = {}): string {
  return cn(inputGroupVariants({ size }));
}

/** The classes of an input outside an input group: an Input's own. */
export function comboboxInputVariants({ size }: ComboboxVariantProps = {}): string {
  return inputVariants({ size });
}

// The popup is Select's panel; this keeps it from being taller than the room, and hides it when
// there is nothing to say and nothing to pick.
const popup = [
  "max-h-(--available-height)",
  "data-empty:not-has-[>[role=status]:not(:empty)]:hidden",
];

/** The popup's classes: Select's, so the two lists look alike. */
export function comboboxPopupVariants({ size }: ComboboxVariantProps = {}): string {
  return cn(selectPopupVariants({ size }), popup.join(" "));
}

// The group draws the field, so the input is bare; it measures in the group's font. Among chips,
// it takes what room is left on the line, and wraps below that.
const inputInGroup = [
  "[--_muted:var(--ow-muted)] flex-1 basis-0 min-w-0 box-border h-(--_stepper) m-0",
  "py-0 px-[calc(var(--px)_-_var(--_inset))] border-0 bg-transparent text-inherit",
  "font-[family-name:inherit] font-[weight:inherit] text-ellipsis outline-none",
  "placeholder:text-(color:--_muted) placeholder:opacity-100",
  "ow-input-disabled:cursor-not-allowed",
  "in-data-[slot$=chips]:flex-[1_1_5em] in-data-[slot$=chips]:min-w-[5em]",
];

const chips = [
  "flex flex-1 basis-0 flex-wrap content-center items-center gap-[4px] box-border min-w-0",
  "min-h-(--_stepper)",
];

// A pill on the field: the raised fill with the surface shadow, and a 24px remove target.
const chip = [
  "[--_chip:24px] [--_bg:var(--ow-raised-bg)] [--_fg:var(--ow-fg)] [--_focus:var(--ow-focus)]",
  "inline-flex items-center box-border max-w-full h-(--_chip) ps-[0.75em] pe-0",
  "rounded-[calc(var(--_chip)_/_2)] bg-(color:--_bg) shadow-(shadow:--ow-surface-shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "text-(color:--_fg) leading-none whitespace-nowrap cursor-default",
  // Reached with the arrow keys from the input.
  "data-highlighted:outline-2 data-highlighted:outline-offset-0 data-highlighted:outline-(color:--_focus)",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-(color:--_focus)",
  "data-disabled:opacity-45",
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  "forced-colors:data-highlighted:outline-[Highlight] forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

// The buttons of the field: flat, muted, filling in on hover and press.
const button = [
  "[--_muted:var(--ow-muted)] [--_focus:var(--ow-focus)]",
  "inline-grid flex-none place-items-center box-border m-0 p-0 border-0",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "bg-transparent text-(color:--_muted) font-[family-name:inherit] font-[weight:inherit]",
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent]",
  "hover:not-data-disabled:not-disabled:not-data-readonly:bg-(color:--ow-hover)",
  "hover:not-data-disabled:not-disabled:not-data-readonly:text-(color:--ow-fg)",
  "active:not-data-disabled:not-disabled:not-data-readonly:bg-(color:--ow-pressed-bg)",
  "active:not-data-disabled:not-disabled:not-data-readonly:text-(color:--ow-fg)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--_focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

// The field's radius less the inset (as Toggle Group's items).
const square = [
  "[--_radius:max(0px,var(--ow-radius)_-_var(--_inset))] size-(--_stepper) rounded-(--_radius)",
  "[&>:where(svg)]:size-(--icon)",
];

const trigger = [...button, ...square, "data-popup-open:text-(color:--ow-fg)"];

// It fades in and out as the selection comes and goes.
const clear = [
  ...button,
  ...square,
  "transition-opacity duration-120 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
];

const chipRemove = [...button, "size-(--_chip) rounded-[50%]", "[&>:where(svg)]:size-[0.875em]"];

const icon = ["inline-flex flex-none size-(--icon) [&>:where(svg)]:size-(--icon)"];

// A line of text over the list: loading, or no match. It shows only when it has text.
const notice = [
  "[--_muted:var(--ow-muted)] box-border p-[1em] text-(color:--_muted) text-center empty:hidden",
];

// Positioned, so axe reads its text over Glide's highlight.
const item = [selectSlots.item, "relative"];

// The checks sit at the end, where the field's chevron is.
const itemIndicator = cn(selectSlots.itemIndicator, "ms-auto first:ms-auto");

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
  inputGroupInput: inputInGroup.join(" "),
  chips: chips.join(" "),
  chip: chip.join(" "),
  chipRemove: chipRemove.join(" "),
  trigger: trigger.join(" "),
  clear: clear.join(" "),
  icon: icon.join(" "),
  backdrop: selectSlots.backdrop,
  positioner: selectSlots.positioner,
  status: notice.join(" "),
  empty: notice.join(" "),
  list: cn(selectSlots.list, "data-empty:hidden"),
  item: item.join(" "),
  itemIndicator,
  groupLabel: selectSlots.groupLabel,
  separator: selectSlots.separator,
};
