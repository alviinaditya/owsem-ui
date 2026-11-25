"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { CSSProperties, ReactElement } from "react";
import { cn } from "../../core/cn";
import { type ProgressVariantProps, progressSlots, progressVariants } from "./progress-variants";
import "./progress.css";

export interface ProgressIndicatorProps extends Omit<BaseProgress.Indicator.Props, "className"> {
  className?: string | undefined;
}

/** The fill. It moves with a transform; with no value it is a segment that travels. */
export function ProgressIndicator({
  className,
  style,
  ...props
}: ProgressIndicatorProps): ReactElement {
  // Base UI writes a width and a height inline; leaving them out lets the class size the fill.
  const own = { width: undefined, height: undefined };
  return (
    <BaseProgress.Indicator
      data-slot="progress-indicator"
      {...props}
      className={cn(progressSlots.indicator, className)}
      style={
        typeof style === "function"
          ? (state) => ({ ...own, ...style(state) })
          : { ...own, ...style }
      }
    />
  );
}

export interface ProgressTrackProps extends Omit<BaseProgress.Track.Props, "className"> {
  className?: string | undefined;
}

/** The groove. Without children it draws its own Indicator. */
export function ProgressTrack({ className, children, ...props }: ProgressTrackProps): ReactElement {
  return (
    <BaseProgress.Track
      data-slot="progress-track"
      {...props}
      className={cn(progressSlots.track, className)}
    >
      {children ?? <ProgressIndicator />}
    </BaseProgress.Track>
  );
}

export interface ProgressValueProps extends Omit<BaseProgress.Value.Props, "className"> {
  className?: string | undefined;
}

/** The formatted value, in tabular figures. It is hidden from screen readers: Root says it. */
export function ProgressValue({ className, ...props }: ProgressValueProps): ReactElement {
  return (
    <BaseProgress.Value
      data-slot="progress-value"
      {...props}
      className={cn(progressSlots.value, className)}
    />
  );
}

export interface ProgressLabelProps extends Omit<BaseProgress.Label.Props, "className"> {
  className?: string | undefined;
}

/** The name of the bar, at the start of the line above it. */
export function ProgressLabel({ className, ...props }: ProgressLabelProps): ReactElement {
  return (
    <BaseProgress.Label
      data-slot="progress-label"
      {...props}
      className={cn(progressSlots.label, className)}
    />
  );
}

export interface ProgressRootProps
  extends Omit<BaseProgress.Root.Props, "className">,
    ProgressVariantProps {
  className?: string | undefined;
}

/** How far along the fill is, as a number from 0 to 100 that the fill reads. */
function fillOf(value: number | null, min: number, max: number): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  const percent = ((value - min) / (max - min)) * 100;
  return Number.isNaN(percent) ? 0 : Math.min(100, Math.max(0, percent));
}

/**
 * The bar, with the label and value above it. Without children it draws its own Track. It needs a
 * name, from a Label or an aria-label; `value={null}` is indeterminate.
 */
export function ProgressRoot({
  size = "md",
  className,
  children,
  style,
  ...props
}: ProgressRootProps): ReactElement {
  const percent = fillOf(props.value, props.min ?? 0, props.max ?? 100);
  // Base UI sets the Indicator's width inline; the fill reads this and moves with a transform.
  const fill = (percent === undefined ? {} : { "--_value": percent }) as CSSProperties;
  return (
    <BaseProgress.Root
      data-slot="progress"
      {...props}
      className={cn(progressVariants({ size }), className)}
      data-size={size}
      style={
        typeof style === "function"
          ? (state) => ({ ...fill, ...style(state) })
          : { ...fill, ...style }
      }
    >
      {children ?? <ProgressTrack />}
    </BaseProgress.Root>
  );
}

export declare namespace ProgressRoot {
  type Props = ProgressRootProps;
  type State = BaseProgress.Root.State;
  type Status = BaseProgress.Root.State["status"];
}

export declare namespace ProgressTrack {
  type Props = ProgressTrackProps;
  type State = BaseProgress.Track.State;
}

export declare namespace ProgressIndicator {
  type Props = ProgressIndicatorProps;
  type State = BaseProgress.Indicator.State;
}

export declare namespace ProgressValue {
  type Props = ProgressValueProps;
  type State = BaseProgress.Value.State;
}

export declare namespace ProgressLabel {
  type Props = ProgressLabelProps;
  type State = BaseProgress.Label.State;
}
