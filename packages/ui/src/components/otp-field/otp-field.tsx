"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import { type ReactElement, useId } from "react";
import { cn } from "../../core/cn";
import { useShakeGate } from "../../core/shake";
import { type OTPFieldVariantProps, otpFieldSlots, otpFieldVariants } from "./otp-field-variants";
import "./otp-field.css";

export interface OTPFieldInputProps extends Omit<BaseOTPField.Input.Props, "className"> {
  className?: string | undefined;
}

/**
 * One slot: a square text field with Input's material and a centered tabular digit. Base UI names
 * the first slot from the group's label and the rest from `aria-label`.
 */
export function OTPFieldInput({ className, ...props }: OTPFieldInputProps): ReactElement {
  return (
    <BaseOTPField.Input
      data-slot="otp-field-input"
      {...props}
      className={cn(otpFieldSlots.input, className)}
    />
  );
}

export interface OTPFieldRootProps
  extends Omit<BaseOTPField.Root.Props, "className">,
    OTPFieldVariantProps {
  className?: string | undefined;
}

/**
 * The slots in a row from the start edge, with the one-time-code behavior of Base UI: a pasted code
 * fills them, and invalid shakes the row once. Without children it draws one Input for each of
 * `length`; with children the slots are yours, and a separator between them is plain markup. A
 * group is named by a Field label, or by `aria-label` or `aria-labelledby`, which also name the
 * slots it draws. `size` sets the font and the slot's side, and every slot reads them.
 */
export function OTPFieldRoot({
  size = "md",
  className,
  children,
  ref,
  ...props
}: OTPFieldRootProps): ReactElement {
  const gate = useShakeGate(ref);
  const labelId = useId();
  const labelledby = props["aria-labelledby"];
  // Named by `aria-label` only when nothing else names the slots.
  const label = labelledby === undefined ? props["aria-label"] : undefined;
  return (
    <BaseOTPField.Root
      data-slot="otp-field"
      {...props}
      ref={gate}
      className={cn(otpFieldVariants({ size }), className)}
      data-size={size}
    >
      {children ?? (
        <>
          {/* Base UI ignores `aria-label` on the first slot, so that one points at the label. */}
          {label === undefined ? null : (
            <span id={labelId} hidden>
              {label}
            </span>
          )}
          {Array.from({ length: props.length }, (_, index) => (
            <OTPFieldInput
              // biome-ignore lint/suspicious/noArrayIndexKey: the slots are positions, in order
              key={index}
              aria-labelledby={label !== undefined && index === 0 ? labelId : labelledby}
              aria-label={
                label !== undefined && index > 0
                  ? `${label} ${index + 1}/${props.length}`
                  : undefined
              }
            />
          ))}
        </>
      )}
    </BaseOTPField.Root>
  );
}

export declare namespace OTPFieldRoot {
  type Props = OTPFieldRootProps;
  type State = BaseOTPField.Root.State;
  type ValidationType = BaseOTPField.Root.ValidationType;
  type ChangeEventReason = BaseOTPField.Root.ChangeEventReason;
  type ChangeEventDetails = BaseOTPField.Root.ChangeEventDetails;
  type InvalidEventReason = BaseOTPField.Root.InvalidEventReason;
  type InvalidEventDetails = BaseOTPField.Root.InvalidEventDetails;
  type CompleteEventReason = BaseOTPField.Root.CompleteEventReason;
  type CompleteEventDetails = BaseOTPField.Root.CompleteEventDetails;
}

export declare namespace OTPFieldInput {
  type Props = OTPFieldInputProps;
  type State = BaseOTPField.Input.State;
}
