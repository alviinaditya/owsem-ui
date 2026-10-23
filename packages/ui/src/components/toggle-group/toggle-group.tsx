"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import {
  Children,
  type ForwardRefExoticComponent,
  forwardRef,
  type JSX,
  type RefAttributes,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { withClassName } from "../../core/class-name";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { createThumb } from "./thumb";
import "./toggle-group.css";

const cls = {
  root: "ow-toggle-group",
  thumb: "ow-toggle-group__thumb",
  item: "ow-toggle-group__item",
  label: "ow-toggle-group__label",
} as const;

const ITEM = `.${cls.item}`;

// The thumb is placed before the first paint; the server has no layout, so it falls back without
// React 18's warning (and the pressed item draws its own key until then).
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ToggleGroupSize = "sm" | "md" | "lg";

export interface ToggleGroupRootProps<Value extends string = string>
  extends Omit<BaseToggleGroup.Props<Value>, "ref"> {
  /** Font size and padding of the items (FR-11). Default `"md"`. */
  size?: ToggleGroupSize | undefined;
  /**
   * Every item as wide as the widest, or an equal share of the group's width when something
   * stretches it.
   */
  equal?: boolean | undefined;
}

type ToggleGroupRootComponent = <Value extends string = string>(
  props: ToggleGroupRootProps<Value> & RefAttributes<HTMLDivElement>,
) => JSX.Element;

/**
 * The group: a flat track holding the items, the thumb that slides under the pressed one
 * (single selection), and the hover highlight (Glide).
 */
export const ToggleGroupRoot: ToggleGroupRootComponent = forwardRef<
  HTMLDivElement,
  ToggleGroupRootProps
>(function ToggleGroupRoot({ className, size = "md", equal, children, ...props }, ref) {
  const glide = useGlide<HTMLDivElement>({
    items: ITEM,
    axis: props.orientation === "vertical" ? "y" : "x",
  });
  const root = useRef<HTMLDivElement | null>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  useBeforePaint(() => {
    if (!root.current || !thumb.current) return;
    const instance = createThumb(root.current, thumb.current, ITEM);
    return () => instance.destroy();
  }, []);

  const glideRef = glide.ref;
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el;
      glideRef(el);
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [glideRef, ref],
  );

  return (
    <BaseToggleGroup
      {...props}
      ref={setRef}
      className={withClassName(cls.root, className)}
      data-size={size}
      data-equal={equal ? "" : undefined}
    >
      <GlideHighlight glide={glide} />
      <span ref={thumb} className={cls.thumb} aria-hidden="true" />
      {children}
    </BaseToggleGroup>
  );
}) as unknown as ToggleGroupRootComponent;

export type ToggleGroupItemProps = Omit<Toggle.Props, "ref">;

/**
 * One choice: Base UI's Toggle. Its text is wrapped in a span, so an item with only an icon is
 * square (FR-10a).
 */
export const ToggleGroupItem: ForwardRefExoticComponent<
  ToggleGroupItemProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, ToggleGroupItemProps>(function ToggleGroupItem(
  { className, children, ...props },
  ref,
) {
  return (
    <Toggle {...props} ref={ref} className={withClassName(cls.item, className)}>
      {Children.map(children, (child) =>
        typeof child === "string" || typeof child === "number" ? (
          <span className={cls.label}>{child}</span>
        ) : (
          child
        ),
      )}
    </Toggle>
  );
});

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
