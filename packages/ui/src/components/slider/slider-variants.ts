// No "use client": a Slider's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type SliderSize = "sm" | "md" | "lg";

export interface SliderVariantProps {
  /** A 4, 6, or 8 px track with a 16, 20, or 24 px thumb, and Button's fonts. @default "md" */
  size?: SliderSize | undefined;
}

const sizeClass: Record<SliderSize, string> = {
  sm: "ow-slider--sm",
  md: "ow-slider--md",
  lg: "ow-slider--lg",
};

/** The root's classes: the size's track, thumb, and font, which every part reads. */
export function sliderVariants({ size = "md" }: SliderVariantProps = {}): string {
  return cn("ow-slider", sizeClass[size]);
}

/** The classes of the inner parts. */
export const sliderSlots = {
  label: "ow-slider__label",
  value: "ow-slider__value",
  control: "ow-slider__control",
  track: "ow-slider__track",
  indicator: "ow-slider__indicator",
  thumb: "ow-slider__thumb",
} as const;
