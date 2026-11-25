// No "use client": a Meter's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type MeterSize = "sm" | "md" | "lg";

export type MeterTone = "accent" | "good" | "warning" | "critical";

export interface MeterVariantProps {
  /** A 4, 8, or 12 px track, with Button's font sizes for the label. @default "md" */
  size?: MeterSize | undefined;
  /** The fill's color. Never the only signal: keep the value or an aria-valuetext. @default "accent" */
  tone?: MeterTone | undefined;
}

const sizeClass: Record<MeterSize, string> = {
  sm: "ow-meter--sm",
  md: "ow-meter--md",
  lg: "ow-meter--lg",
};

const toneClass: Record<MeterTone, string> = {
  accent: "ow-meter--accent",
  good: "ow-meter--good",
  warning: "ow-meter--warning",
  critical: "ow-meter--critical",
};

/** The root's classes. */
export function meterVariants({ size = "md", tone = "accent" }: MeterVariantProps = {}): string {
  return cn("ow-meter", sizeClass[size], toneClass[tone]);
}

const segmentToneClass: Record<MeterTone, string> = {
  accent: "ow-meter__segment--accent",
  good: "ow-meter__segment--good",
  warning: "ow-meter__segment--warning",
  critical: "ow-meter__segment--critical",
};

const itemToneClass: Record<MeterTone, string> = {
  accent: "ow-meter__legend-item--accent",
  good: "ow-meter__legend-item--good",
  warning: "ow-meter__legend-item--warning",
  critical: "ow-meter__legend-item--critical",
};

const legendSizeClass: Record<MeterSize, string> = {
  sm: "ow-meter__legend--sm",
  md: "ow-meter__legend--md",
  lg: "ow-meter__legend--lg",
};

/** A part of a whole. Without a tone it takes its color from its position. */
export function meterSegmentVariants({ tone }: { tone?: MeterTone | undefined } = {}): string {
  return cn("ow-meter__segment", tone && segmentToneClass[tone]);
}

/** A legend item. Give it the tone of its segment, or none to match a segment by position. */
export function meterLegendItemVariants({ tone }: { tone?: MeterTone | undefined } = {}): string {
  return cn("ow-meter__legend-item", tone && itemToneClass[tone]);
}

/** The legend's classes, at a size. */
export function meterLegendVariants({
  size = "md",
}: {
  size?: MeterSize | undefined;
} = {}): string {
  return cn("ow-meter__legend", legendSizeClass[size]);
}

/** The classes of the inner parts. */
export const meterSlots = {
  track: "ow-meter__track",
  indicator: "ow-meter__indicator",
  value: "ow-meter__value",
  label: "ow-meter__label",
  legendValue: "ow-meter__legend-value",
} as const;
