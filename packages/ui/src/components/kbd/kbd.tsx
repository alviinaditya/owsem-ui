"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
} from "react";
import "./kbd.css";

const cls = { root: "ow-kbd" } as const;

export type KbdProps = useRender.ComponentProps<"kbd">;

/**
 * A key on the keyboard: a small raised keycap, sized from the text around it. Put one key or a
 * whole shortcut in it (`⌘K`, `Ctrl K`), or one per key side by side.
 */
export const Kbd: ForwardRefExoticComponent<Omit<KbdProps, "ref"> & RefAttributes<HTMLElement>> =
  forwardRef<HTMLElement, Omit<KbdProps, "ref">>(function Kbd(
    { className, render, ...props },
    ref,
  ) {
    return useRender({
      defaultTagName: "kbd",
      render,
      ref,
      props: mergeProps<"kbd">(
        {
          className: className ? `${cls.root} ${className}` : cls.root,
        } as ComponentPropsWithoutRef<"kbd">,
        props,
      ),
    });
  });

export declare namespace Kbd {
  type Props = KbdProps;
}
