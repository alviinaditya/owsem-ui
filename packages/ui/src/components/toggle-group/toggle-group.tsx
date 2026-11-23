"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Children, type ReactElement, useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "../../core/cn";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { useMergedRefs } from "../../core/merge-refs";
import { createThumb } from "./thumb";
import {
  type ToggleGroupVariantProps,
  toggleGroupSlots,
  toggleGroupVariants,
} from "./toggle-group-variants";
import "./toggle-group.css";

// Base UI's Toggle always sets aria-pressed, also when another element renders it.
const ITEM = "[aria-pressed]";

// The thumb is placed before the first paint; the server has no layout, so it falls back
// to an effect there (and the pressed item draws its own key until then).
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface ToggleGroupRootProps<Value extends string = string>
  extends Omit<BaseToggleGroup.Props<Value>, "className">,
    ToggleGroupVariantProps {
  className?: string | undefined;
  /**
   * Every item as wide as the widest, or an equal share of the group's width when something
   * stretches it.
   */
  equal?: boolean | undefined;
}

/**
 * The group: a flat track holding the items, the thumb that slides under the pressed one
 * (single selection), and the hover highlight (Glide).
 */
export function ToggleGroupRoot<Value extends string = string>({
  size = "md",
  equal,
  className,
  children,
  ref,
  ...props
}: ToggleGroupRootProps<Value>): ReactElement {
  const glide = useGlide<HTMLDivElement>({
    items: ITEM,
    skip: "[data-pressed]",
    axis: props.orientation === "vertical" ? "y" : "x",
  });
  const root = useRef<HTMLDivElement | null>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const merged = useMergedRefs(root, useMergedRefs(glide.ref, ref));

  useBeforePaint(() => {
    if (!root.current || !thumb.current) return;
    const instance = createThumb(root.current, thumb.current, ITEM);
    return () => instance.destroy();
  }, []);

  return (
    <BaseToggleGroup
      data-slot="toggle-group"
      {...props}
      ref={merged}
      className={cn(toggleGroupVariants({ size }), className)}
      data-size={size}
      data-equal={equal ? "" : undefined}
    >
      <GlideHighlight glide={glide} />
      <span
        ref={thumb}
        data-slot="toggle-group-thumb"
        className={toggleGroupSlots.thumb}
        aria-hidden="true"
      />
      {children}
    </BaseToggleGroup>
  );
}

export interface ToggleGroupItemProps extends Omit<Toggle.Props, "className"> {
  className?: string | undefined;
}

/**
 * One choice: Base UI's Toggle. Its text is wrapped in a span, so an item with only an icon is
 * square.
 */
export function ToggleGroupItem({
  className,
  children,
  ...props
}: ToggleGroupItemProps): ReactElement {
  return (
    <Toggle
      data-slot="toggle-group-item"
      {...props}
      className={cn(toggleGroupSlots.item, className)}
    >
      {Children.map(children, (child) =>
        typeof child === "string" || typeof child === "number" ? (
          <span data-slot="toggle-group-label" className={toggleGroupSlots.label}>
            {child}
          </span>
        ) : (
          child
        ),
      )}
    </Toggle>
  );
}

export declare namespace ToggleGroupRoot {
  type Props<Value extends string = string> = ToggleGroupRootProps<Value>;
  type State = BaseToggleGroup.State;
  type ChangeEventDetails = BaseToggleGroup.ChangeEventDetails;
}

export declare namespace ToggleGroupItem {
  type Props = ToggleGroupItemProps;
  type State = Toggle.State;
  type ChangeEventDetails = Toggle.ChangeEventDetails;
}
