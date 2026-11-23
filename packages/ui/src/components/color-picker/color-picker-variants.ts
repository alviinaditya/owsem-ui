// No "use client": the classes of Color Picker can be used from Server Components.
import { cn } from "../../core/cn";

export type ColorPickerSize = "sm" | "md" | "lg";

export type ColorPickerVariant = "field" | "swatch";

export interface ColorPickerVariantProps {
  /** The trigger's type scale and height: 13, 14, or 16px. @default "md" */
  size?: ColorPickerSize | undefined;
  /** `"field"` shows the color and its value; `"swatch"` is a square of the color. @default "field" */
  variant?: ColorPickerVariant | undefined;
}

const sizeClass: Record<ColorPickerSize, string> = {
  sm: "ow-color-picker__trigger--sm",
  md: "ow-color-picker__trigger--md",
  lg: "ow-color-picker__trigger--lg",
};

const variantClass: Record<ColorPickerVariant, string> = {
  field: "ow-color-picker__trigger--field",
  swatch: "ow-color-picker__trigger--swatch",
};

/** The popover trigger's classes. */
export function colorPickerTriggerVariants({
  size = "md",
  variant = "field",
}: ColorPickerVariantProps = {}): string {
  return cn("ow-color-picker__trigger", sizeClass[size], variantClass[variant]);
}

/** The classes of the other parts. */
export const colorPickerSlots = {
  root: "ow-color-picker",
  area: "ow-color-picker__area",
  thumb: "ow-color-picker__thumb",
  tools: "ow-color-picker__tools",
  tool: "ow-color-picker__tool",
  sliders: "ow-color-picker__sliders",
  slider: "ow-color-picker__slider",
  control: "ow-color-picker__control",
  track: "ow-color-picker__track",
  preview: "ow-color-picker__preview",
  inputs: "ow-color-picker__inputs",
  format: "ow-color-picker__format",
  field: "ow-color-picker__field",
  input: "ow-color-picker__input",
  label: "ow-color-picker__label",
  swatches: "ow-color-picker__swatches",
  swatch: "ow-color-picker__swatch",
  icon: "ow-color-picker__icon",
  chip: "ow-color-picker__chip",
  value: "ow-color-picker__value",
  positioner: "ow-color-picker__positioner",
  popup: "ow-color-picker__popup",
} as const;
