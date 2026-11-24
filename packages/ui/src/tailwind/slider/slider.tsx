// Generated from components/slider by scripts/build-tailwind.ts; do not edit.
"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { createContext, type ReactElement, useContext } from "react";
import { cn } from "../lib/cn";
import { type SliderVariantProps, sliderSlots, sliderVariants } from "./slider-variants";

/** What a Root that draws its own parts tells those parts: how many thumbs, and their name. */
interface Drawn {
  count: number;
  ariaLabel: string | undefined;
  ariaDescribedby: string | undefined;
}

const DrawnContext = createContext<Drawn>({
  count: 1,
  ariaLabel: undefined,
  ariaDescribedby: undefined,
});

export interface SliderLabelProps extends Omit<BaseSlider.Label.Props, "className"> {
  className?: string | undefined;
}

/** The name of the slider, at the start of the line above it. */
export function SliderLabel({ className, ...props }: SliderLabelProps): ReactElement {
  return (
    <BaseSlider.Label
      data-slot="slider-label"
      {...props}
      className={cn(sliderSlots.label, className)}
    />
  );
}

export interface SliderValueProps extends Omit<BaseSlider.Value.Props, "className"> {
  className?: string | undefined;
}

/** The formatted value, in tabular figures; a range reads "20 – 80". It is an `output`. */
export function SliderValue({ className, ...props }: SliderValueProps): ReactElement {
  return (
    <BaseSlider.Value
      data-slot="slider-value"
      {...props}
      className={cn(sliderSlots.value, className)}
    />
  );
}

export interface SliderIndicatorProps extends Omit<BaseSlider.Indicator.Props, "className"> {
  className?: string | undefined;
}

/** The filled part of the track, from its start to the thumb, or between the two thumbs. */
export function SliderIndicator({ className, ...props }: SliderIndicatorProps): ReactElement {
  return (
    <BaseSlider.Indicator
      data-slot="slider-indicator"
      {...props}
      className={cn(sliderSlots.indicator, className)}
    />
  );
}

export interface SliderThumbProps extends Omit<BaseSlider.Thumb.Props, "className"> {
  className?: string | undefined;
}

/**
 * The handle, with Base UI's range input inside. In a range slider give each thumb its `index`,
 * which also lets it render on the server. Put it inside the Track, which it is placed against.
 */
export function SliderThumb({ className, ...props }: SliderThumbProps): ReactElement {
  return (
    <BaseSlider.Thumb
      data-slot="slider-thumb"
      {...props}
      className={cn(sliderSlots.thumb, className)}
    />
  );
}

export interface SliderTrackProps extends Omit<BaseSlider.Track.Props, "className"> {
  className?: string | undefined;
}

/** The groove. Without children it draws the Indicator and one Thumb for each value. */
export function SliderTrack({ className, children, ...props }: SliderTrackProps): ReactElement {
  const { count, ariaLabel, ariaDescribedby } = useContext(DrawnContext);
  return (
    <BaseSlider.Track
      data-slot="slider-track"
      {...props}
      className={cn(sliderSlots.track, className)}
    >
      {children ?? (
        <>
          <SliderIndicator />
          {Array.from({ length: count }, (_, index) => (
            <SliderThumb
              // biome-ignore lint/suspicious/noArrayIndexKey: the thumbs are the values, in order
              key={index}
              index={index}
              aria-label={ariaLabel}
              aria-describedby={ariaDescribedby}
            />
          ))}
        </>
      )}
    </BaseSlider.Track>
  );
}

export interface SliderControlProps extends Omit<BaseSlider.Control.Props, "className"> {
  className?: string | undefined;
}

/** The area that takes the pointer: at least 24px tall. Without children it draws a Track. */
export function SliderControl({ className, children, ...props }: SliderControlProps): ReactElement {
  return (
    <BaseSlider.Control
      data-slot="slider-control"
      {...props}
      className={cn(sliderSlots.control, className)}
    >
      {children ?? <SliderTrack />}
    </BaseSlider.Control>
  );
}

export interface SliderRootProps<
  Value extends number | readonly number[] = number | readonly number[],
> extends Omit<BaseSlider.Root.Props<Value>, "className">,
    SliderVariantProps {
  className?: string | undefined;
}

/**
 * The state and the layout: a label at the start and the value at the end above the control.
 * Without children it draws a Control with one Thumb for each value, and the `aria-label` and
 * `aria-describedby` you give go to the thumbs, which is what they name. With children they stay
 * on the Root, as in Base UI. `size` sets the track, the thumb, and the font for every part.
 */
export function SliderRoot<Value extends number | readonly number[] = number>({
  size = "md",
  className,
  children,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
  ...props
}: SliderRootProps<Value>): ReactElement {
  const own = children === undefined;
  const current = props.value ?? props.defaultValue;
  const count = Array.isArray(current) ? current.length : 1;
  // A range keeps its name on the group too, since its thumbs share it.
  const named = own
    ? count > 1 && ariaLabel !== undefined
      ? { "aria-label": ariaLabel }
      : {}
    : { "aria-label": ariaLabel, "aria-describedby": ariaDescribedby };
  return (
    <DrawnContext.Provider
      value={{
        count,
        ariaLabel: own ? ariaLabel : undefined,
        ariaDescribedby: own ? ariaDescribedby : undefined,
      }}
    >
      <BaseSlider.Root
        data-slot="slider"
        {...props}
        {...named}
        className={cn(sliderVariants({ size }), className)}
        data-size={size}
      >
        {own ? <SliderControl /> : children}
      </BaseSlider.Root>
    </DrawnContext.Provider>
  );
}

export declare namespace SliderRoot {
  type Props<Value extends number | readonly number[] = number | readonly number[]> =
    SliderRootProps<Value>;
  type State = BaseSlider.Root.State;
  type ChangeEventReason = BaseSlider.Root.ChangeEventReason;
  type ChangeEventDetails = BaseSlider.Root.ChangeEventDetails;
  type CommitEventReason = BaseSlider.Root.CommitEventReason;
  type CommitEventDetails = BaseSlider.Root.CommitEventDetails;
}

export declare namespace SliderLabel {
  type Props = SliderLabelProps;
  type State = BaseSlider.Label.State;
}

export declare namespace SliderValue {
  type Props = SliderValueProps;
  type State = BaseSlider.Value.State;
}

export declare namespace SliderControl {
  type Props = SliderControlProps;
  type State = BaseSlider.Control.State;
}

export declare namespace SliderTrack {
  type Props = SliderTrackProps;
  type State = BaseSlider.Track.State;
}

export declare namespace SliderIndicator {
  type Props = SliderIndicatorProps;
  type State = BaseSlider.Indicator.State;
}

export declare namespace SliderThumb {
  type Props = SliderThumbProps;
  type State = BaseSlider.Thumb.State;
}
