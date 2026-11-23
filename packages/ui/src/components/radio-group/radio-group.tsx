"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactElement } from "react";
import { cn } from "../../core/cn";
import type { GlideOptions } from "../../core/glide/glide";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { useMergedRefs } from "../../core/merge-refs";
import {
  type RadioGroupVariantProps,
  radioGroupSlots,
  radioGroupVariants,
} from "./radio-group-variants";
import "./radio-group.css";

// Glide lights the row, a label holding a radio. It follows any layout, since the nearest row is
// measured on both axes, and leaves other content in the group alone, such as a caption: only a
// press on a row picks it.
const GLIDE: GlideOptions = {
  items: 'label:has([role="radio"])',
  axis: "xy",
  maxDistance: 8,
  gapClick: false,
  isDisabled: (row) =>
    row.querySelector('[role="radio"]:is([data-disabled], [data-readonly])') !== null,
};

export interface RadioGroupProps<Value = unknown>
  extends Omit<BaseRadioGroup.Props<Value>, "className">,
    RadioGroupVariantProps {
  className?: string | undefined;
}

/** The group: holds the options, usually `<label>` rows, and the hover highlight (Glide). */
export function RadioGroup<Value = unknown>({
  size = "md",
  className,
  children,
  ref,
  ...props
}: RadioGroupProps<Value>): ReactElement {
  const glide = useGlide<HTMLDivElement>(GLIDE);
  const merged = useMergedRefs(glide.ref, ref);
  return (
    <BaseRadioGroup
      data-slot="radio-group"
      {...props}
      ref={merged}
      className={cn(radioGroupVariants({ size }), className)}
      data-size={size}
    >
      <GlideHighlight glide={glide} />
      {children}
    </BaseRadioGroup>
  );
}

export interface RadioIndicatorProps extends Omit<BaseRadio.Indicator.Props, "className"> {
  className?: string | undefined;
}

/** The mark of a checked radio: the dot, or any node given as children. */
export function RadioIndicator({ className, ...props }: RadioIndicatorProps): ReactElement {
  return (
    <BaseRadio.Indicator
      data-slot="radio-group-indicator"
      {...props}
      className={cn(radioGroupSlots.indicator, className)}
    />
  );
}

export interface RadioRootProps<Value = unknown>
  extends Omit<BaseRadio.Root.Props<Value>, "className"> {
  className?: string | undefined;
}

/** One option's circle. Without children it draws its Indicator; children replace it. */
export function RadioRoot<Value = unknown>({
  className,
  children = <RadioIndicator />,
  ...props
}: RadioRootProps<Value>): ReactElement {
  return (
    <BaseRadio.Root
      data-slot="radio-group-radio"
      {...props}
      className={cn(radioGroupSlots.radio, className)}
    >
      {children}
    </BaseRadio.Root>
  );
}

export declare namespace RadioGroup {
  type Props<Value = unknown> = RadioGroupProps<Value>;
  type State = BaseRadioGroup.State;
  type ChangeEventDetails = BaseRadioGroup.ChangeEventDetails;
}

export declare namespace RadioRoot {
  type Props<Value = unknown> = RadioRootProps<Value>;
  type State = BaseRadio.Root.State;
}

export declare namespace RadioIndicator {
  type Props = RadioIndicatorProps;
  type State = BaseRadio.Indicator.State;
}
