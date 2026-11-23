// Generated from components/input by scripts/build-tailwind.ts; do not edit.
"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cn } from "../lib/cn";
import { useShakeGate } from "../lib/shake";
import {
  type InputSize,
  type InputVariantProps,
  inputSlots,
  inputVariants,
  inputWrapperVariants,
} from "./input-variants";

// `size` is the type scale here, not the input's width in characters; set `inline-size` instead.
export interface InputProps extends Omit<BaseInput.Props, "className" | "size">, InputVariantProps {
  className?: string | undefined;
  /** The size of an outer part that renders this one, such as Toolbar.Button. */
  "data-size"?: InputSize | undefined;
  /** An icon before the text, the font size plus 2px. Decorative: the input needs a name. */
  startIcon?: ReactNode;
  /** An icon after the text. */
  endIcon?: ReactNode;
}

const icon = (node: ReactNode, side: "start" | "end") =>
  node == null ? null : (
    <span data-slot="input-icon" data-side={side} aria-hidden="true" className={inputSlots.icon}>
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
 * A text field: the page's fill with a 3:1 edge, as tall as Button. It fills its parent. `ref`,
 * `className`, `style`, and every other prop always reach the input; icons add a wrapper that
 * only places them.
 */
export function Input({
  "data-size": outerSize,
  size = outerSize ?? "md",
  startIcon,
  endIcon,
  className,
  ref,
  ...props
}: InputProps): ReactElement {
  const gate = useShakeGate(ref);
  const input = (
    <BaseInput
      data-slot="input"
      {...props}
      ref={gate}
      className={cn(inputVariants({ size }), className)}
      data-size={size}
    />
  );
  if (startIcon == null && endIcon == null) return input;
  return (
    <span
      data-slot="input-wrapper"
      data-size={size}
      className={inputWrapperVariants({ size })}
      style={forIcons(props.style)}
    >
      {icon(startIcon, "start")}
      {input}
      {icon(endIcon, "end")}
    </span>
  );
}

export declare namespace Input {
  type Props = InputProps;
  type State = BaseInput.State;
  type ChangeEventDetails = BaseInput.ChangeEventDetails;
}
