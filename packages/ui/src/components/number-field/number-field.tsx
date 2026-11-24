"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { createContext, type ReactElement, useContext } from "react";
import { cn } from "../../core/cn";
import { useShakeGate } from "../../core/shake";
import {
  type NumberFieldVariantProps,
  numberFieldSlots,
  numberFieldVariants,
} from "./number-field-variants";
import "./number-field.css";

type ScrubDirection = "horizontal" | "vertical";

// The ScrubArea's direction reaches the cursor, which sits in a portal but in the same React tree.
const DirectionContext = createContext<ScrubDirection>("horizontal");

// Icons from Lucide (https://lucide.dev), ISC License: minus, plus, and arrows left-right and
// up-down. The glyph is the icon size, the font size plus 2px.
const icon = (paths: string[], extra?: { halo?: boolean }): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {extra?.halo
      ? paths.map((d) => (
          <path key={`halo-${d}`} d={d} strokeWidth="5" style={{ stroke: "var(--ow-bg)" }} />
        ))
      : null}
    {paths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

const MINUS = ["M5 12h14"];
const PLUS = ["M5 12h14", "M12 5v14"];
const ACROSS = ["M4 12h16", "m8 8-4 4 4 4", "m16 8 4 4-4 4"];
const DOWN = ["M12 4v16", "m8 8 4-4 4 4", "m8 16 4 4 4-4"];

export interface NumberFieldRootProps
  extends Omit<BaseNumberField.Root.Props, "className">,
    NumberFieldVariantProps {
  className?: string | undefined;
}

/**
 * The state and the layout: a label above the field. Without children it draws a Group, and the
 * `aria-label`, `aria-labelledby`, and `aria-describedby` you give go to the Input it draws, which
 * is what they name. With children they stay on the Root, as in Base UI. `size` sets the font and
 * the field's height, and every part below reads them.
 */
export function NumberFieldRoot({
  size = "md",
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  ...props
}: NumberFieldRootProps): ReactElement {
  const own = children === undefined;
  // Only what is given: a Field's label and description are wired by Base UI otherwise.
  const named = Object.fromEntries(
    Object.entries({
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledby,
      "aria-describedby": ariaDescribedby,
    }).filter(([, value]) => value !== undefined),
  );
  return (
    <BaseNumberField.Root
      data-slot="number-field"
      {...props}
      {...(own ? {} : named)}
      className={cn(numberFieldVariants({ size }), className)}
      data-size={size}
    >
      {own ? (
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput {...named} />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      ) : (
        children
      )}
    </BaseNumberField.Root>
  );
}

export interface NumberFieldDecrementProps
  extends Omit<BaseNumberField.Decrement.Props, "className"> {
  className?: string | undefined;
}

/** Steps down, and repeats while held. Without children it draws a minus. */
export function NumberFieldDecrement({
  className,
  children = icon(MINUS),
  ...props
}: NumberFieldDecrementProps): ReactElement {
  return (
    <BaseNumberField.Decrement
      data-slot="number-field-decrement"
      {...props}
      className={cn(numberFieldSlots.decrement, className)}
    >
      {children}
    </BaseNumberField.Decrement>
  );
}

export interface NumberFieldIncrementProps
  extends Omit<BaseNumberField.Increment.Props, "className"> {
  className?: string | undefined;
}

/** Steps up, and repeats while held. Without children it draws a plus. */
export function NumberFieldIncrement({
  className,
  children = icon(PLUS),
  ...props
}: NumberFieldIncrementProps): ReactElement {
  return (
    <BaseNumberField.Increment
      data-slot="number-field-increment"
      {...props}
      className={cn(numberFieldSlots.increment, className)}
    >
      {children}
    </BaseNumberField.Increment>
  );
}

export interface NumberFieldInputProps extends Omit<BaseNumberField.Input.Props, "className"> {
  className?: string | undefined;
}

/** The text field, with the number centered. It takes no look of its own: the Group is the field. */
export function NumberFieldInput({ className, ...props }: NumberFieldInputProps): ReactElement {
  return (
    <BaseNumberField.Input
      data-slot="number-field-input"
      {...props}
      className={cn(numberFieldSlots.input, className)}
    />
  );
}

export interface NumberFieldGroupProps extends Omit<BaseNumberField.Group.Props, "className"> {
  className?: string | undefined;
}

/** The field: a tint with the steppers inset at both ends. Without children it draws all three. */
export function NumberFieldGroup({
  className,
  children = (
    <>
      <NumberFieldDecrement />
      <NumberFieldInput />
      <NumberFieldIncrement />
    </>
  ),
  ref,
  ...props
}: NumberFieldGroupProps): ReactElement {
  const gate = useShakeGate(ref);
  return (
    <BaseNumberField.Group
      data-slot="number-field-group"
      {...props}
      ref={gate}
      className={cn(numberFieldSlots.group, className)}
    >
      {children}
    </BaseNumberField.Group>
  );
}

export interface NumberFieldScrubAreaProps
  extends Omit<BaseNumberField.ScrubArea.Props, "className"> {
  className?: string | undefined;
}

/** Wraps the label: dragging it changes the value. The cursor says which way. */
export function NumberFieldScrubArea({
  direction = "horizontal",
  className,
  ...props
}: NumberFieldScrubAreaProps): ReactElement {
  return (
    <DirectionContext.Provider value={direction}>
      <BaseNumberField.ScrubArea
        data-slot="number-field-scrub-area"
        {...props}
        direction={direction}
        className={cn(numberFieldSlots.scrubArea, className)}
        data-direction={direction}
      />
    </DirectionContext.Provider>
  );
}

export interface NumberFieldScrubAreaCursorProps
  extends Omit<BaseNumberField.ScrubAreaCursor.Props, "className"> {
  className?: string | undefined;
}

/** Stands in for the pointer while scrubbing. Without children it draws a two-way arrow. */
export function NumberFieldScrubAreaCursor({
  className,
  children,
  ...props
}: NumberFieldScrubAreaCursorProps): ReactElement {
  const direction = useContext(DirectionContext);
  return (
    <BaseNumberField.ScrubAreaCursor
      data-slot="number-field-scrub-area-cursor"
      {...props}
      className={cn(numberFieldSlots.scrubAreaCursor, className)}
      data-direction={direction}
    >
      {children ?? icon(direction === "vertical" ? DOWN : ACROSS, { halo: true })}
    </BaseNumberField.ScrubAreaCursor>
  );
}

export declare namespace NumberFieldRoot {
  type Props = NumberFieldRootProps;
  type State = BaseNumberField.Root.State;
  type ChangeEventReason = BaseNumberField.Root.ChangeEventReason;
  type ChangeEventDetails = BaseNumberField.Root.ChangeEventDetails;
  type CommitEventReason = BaseNumberField.Root.CommitEventReason;
  type CommitEventDetails = BaseNumberField.Root.CommitEventDetails;
}

export declare namespace NumberFieldGroup {
  type Props = NumberFieldGroupProps;
  type State = BaseNumberField.Group.State;
}

export declare namespace NumberFieldInput {
  type Props = NumberFieldInputProps;
  type State = BaseNumberField.Input.State;
}

export declare namespace NumberFieldDecrement {
  type Props = NumberFieldDecrementProps;
  type State = BaseNumberField.Decrement.State;
}

export declare namespace NumberFieldIncrement {
  type Props = NumberFieldIncrementProps;
  type State = BaseNumberField.Increment.State;
}

export declare namespace NumberFieldScrubArea {
  type Props = NumberFieldScrubAreaProps;
  type State = BaseNumberField.ScrubArea.State;
}

export declare namespace NumberFieldScrubAreaCursor {
  type Props = NumberFieldScrubAreaCursorProps;
  type State = BaseNumberField.ScrubAreaCursor.State;
}
