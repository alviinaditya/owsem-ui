"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import {
  type ForwardRefExoticComponent,
  forwardRef,
  type JSX,
  type RefAttributes,
  useCallback,
} from "react";
import { withClassName } from "../../core/class-name";
import type { GlideOptions } from "../../core/glide/glide";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import "./radio-group.css";

const cls = {
  root: "ow-radio-group",
  radio: "ow-radio-group__radio",
  indicator: "ow-radio-group__indicator",
} as const;

const INERT = `.${cls.radio}:is([data-disabled], [data-readonly])`;

// Glide lights the row, a label holding a radio. It follows any layout, since the nearest row is
// measured on both axes, and leaves other content in the group alone, such as a caption: only a
// press on a row picks it.
const GLIDE: GlideOptions = {
  items: `label:has(.${cls.radio})`,
  axis: "xy",
  maxDistance: 8,
  gapClick: false,
  isDisabled: (row) => row.querySelector(INERT) !== null,
};

export type RadioGroupSize = "sm" | "md" | "lg";

export interface RadioGroupProps<Value = unknown> extends Omit<BaseRadioGroup.Props<Value>, "ref"> {
  /** Button's fonts and row heights (FR-11): 29.25, 38.5, or 48 px tall. @default "md" */
  size?: RadioGroupSize | undefined;
}

type RadioGroupComponent = <Value = unknown>(
  props: RadioGroupProps<Value> & RefAttributes<HTMLDivElement>,
) => JSX.Element;

/** The group: holds the options, usually `<label>` rows, and the hover highlight (Glide). */
export const RadioGroup: RadioGroupComponent = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup({ className, size = "md", children, ...props }, ref) {
    const glide = useGlide<HTMLDivElement>(GLIDE);
    const glideRef = glide.ref;
    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        glideRef(el);
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [glideRef, ref],
    );
    return (
      <BaseRadioGroup
        {...props}
        ref={setRef}
        className={withClassName(cls.root, className)}
        data-size={size}
      >
        <GlideHighlight glide={glide} />
        {children}
      </BaseRadioGroup>
    );
  },
) as unknown as RadioGroupComponent;

export type RadioIndicatorProps = Omit<BaseRadio.Indicator.Props, "ref">;

/** The mark of a checked radio: the dot, or any node given as children. */
export const RadioIndicator: ForwardRefExoticComponent<
  RadioIndicatorProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, RadioIndicatorProps>(function RadioIndicator(
  { className, ...props },
  ref,
) {
  return (
    <BaseRadio.Indicator {...props} ref={ref} className={withClassName(cls.indicator, className)} />
  );
});

export interface RadioRootProps<Value = unknown> extends Omit<BaseRadio.Root.Props<Value>, "ref"> {}

type RadioRootComponent = <Value = unknown>(
  props: RadioRootProps<Value> & RefAttributes<HTMLSpanElement>,
) => JSX.Element;

/** One option's circle. Without children it draws its Indicator; children replace it. */
export const RadioRoot: RadioRootComponent = forwardRef<HTMLSpanElement, RadioRootProps>(
  function RadioRoot({ className, children = <RadioIndicator />, ...props }, ref) {
    return (
      <BaseRadio.Root {...props} ref={ref} className={withClassName(cls.radio, className)}>
        {children}
      </BaseRadio.Root>
    );
  },
) as unknown as RadioRootComponent;

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
