"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import {
  type CSSProperties,
  type ForwardRefExoticComponent,
  forwardRef,
  type ReactNode,
  type RefAttributes,
} from "react";
import { withClassName } from "../../core/class-name";
import "./input.css";

const cls = { root: "ow-input", wrapper: "ow-input__wrapper", icon: "ow-input__icon" } as const;

export type InputSize = "sm" | "md" | "lg";

// `size` is the type scale here, not the input's width in characters; set `inline-size` instead.
export interface InputProps extends Omit<BaseInput.Props, "ref" | "size"> {
  /** Button's sizes (FR-11): 29.25, 38.5, or 48 px tall. @default "md" */
  size?: InputSize | undefined;
  /** An icon before the text, the font size plus 2px. Decorative: the input needs a name. */
  startIcon?: ReactNode;
  /** An icon after the text. */
  endIcon?: ReactNode;
}

const icon = (node: ReactNode, side: "start" | "end") =>
  node == null ? null : (
    <span className={cls.icon} data-side={side} aria-hidden="true">
      {node}
    </span>
  );

/** What in the input's `style` also sizes or colors its icons: custom properties and font size. */
function forIcons(style: InputProps["style"]): CSSProperties | undefined {
  if (typeof style !== "object") return undefined;
  return Object.fromEntries(
    Object.entries(style).filter(([key]) => key.startsWith("--") || key === "fontSize"),
  );
}

/**
 * A text field: a flat well as tall as Button. It fills its parent. `ref`, `className`, `style`,
 * and every other prop always reach the input; icons add a wrapper that only places them.
 */
export const Input: ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>> =
  forwardRef<HTMLInputElement, InputProps>(function Input(
    { className, size = "md", startIcon, endIcon, ...props },
    ref,
  ) {
    const input = (
      <BaseInput
        ref={ref}
        className={withClassName(cls.root, className)}
        data-size={size}
        {...props}
      />
    );
    if (startIcon == null && endIcon == null) return input;
    return (
      <span className={cls.wrapper} data-size={size} style={forIcons(props.style)}>
        {icon(startIcon, "start")}
        {input}
        {icon(endIcon, "end")}
      </span>
    );
  });

export declare namespace Input {
  type Props = InputProps;
  type State = BaseInput.State;
  type ChangeEventDetails = BaseInput.ChangeEventDetails;
}
