// Generated from components/kbd by scripts/build-tailwind.ts; do not edit.
"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ReactElement } from "react";
import { cn } from "../lib/cn";
import { kbdSlots } from "./kbd-variants";

export interface KbdProps extends Omit<useRender.ComponentProps<"kbd">, "className"> {
  className?: string | undefined;
}

/**
 * A key on the keyboard: a small raised keycap, sized from the text around it. Put one key or a
 * whole shortcut in it (`⌘K`, `Ctrl K`), or one per key side by side.
 */
export function Kbd({ className, render, ref, ...props }: KbdProps): ReactElement {
  const defaults = { "data-slot": "kbd", className: cn(kbdSlots.root, className) };
  return useRender({
    defaultTagName: "kbd",
    render,
    ref,
    props: mergeProps<"kbd">(defaults, props),
  });
}

export declare namespace Kbd {
  type Props = KbdProps;
}
