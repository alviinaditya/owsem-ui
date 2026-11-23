// Generated from components/tabs by scripts/build-tailwind.ts; do not edit.
"use client";

import { Tabs } from "@base-ui/react/tabs";
import {
  Children,
  createContext,
  type ReactElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { cn } from "../lib/cn";
import { GlideHighlight, useGlide } from "../lib/glide/use-glide";
import { useMergedRefs } from "../lib/merge-refs";
import { createThumb } from "../toggle-group/thumb";
import { type TabsListVariantProps, tabsListVariants, tabsSlots } from "./tabs-variants";

// Base UI gives every tab this role, also when another element renders it.
const TAB = '[role="tab"]';

// The indicator is placed before the first paint; the server has no layout, so it falls back
// to an effect there (and the active tab draws its own key until then).
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

// For the List's Glide axis.
const OrientationContext = createContext<Tabs.Root.Orientation>("horizontal");

export interface TabsRootProps extends Omit<Tabs.Root.Props, "className"> {
  className?: string | undefined;
}

/** The tabs and their panels: the list above the panel, or beside it when vertical. */
export function TabsRoot({
  className,
  orientation = "horizontal",
  ...props
}: TabsRootProps): ReactElement {
  return (
    <OrientationContext.Provider value={orientation}>
      <Tabs.Root
        data-slot="tabs"
        {...props}
        orientation={orientation}
        className={cn(tabsSlots.root, className)}
      />
    </OrientationContext.Provider>
  );
}

export interface TabsListProps extends Omit<Tabs.List.Props, "className">, TabsListVariantProps {
  className?: string | undefined;
}

/**
 * The tabs: a flat well as wide as they are, and scrolling sideways when they do not fit. It draws
 * the indicator that slides under the active tab, and the hover highlight (Glide).
 */
export function TabsList({
  size = "md",
  className,
  onClick,
  children,
  ref,
  ...props
}: TabsListProps): ReactElement {
  const orientation = useContext(OrientationContext);
  const glide = useGlide<HTMLDivElement>({
    items: TAB,
    skip: "[data-active]",
    axis: orientation === "vertical" ? "y" : "x",
  });
  const list = useRef<HTMLDivElement | null>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const merged = useMergedRefs(list, useMergedRefs(glide.ref, ref));

  useBeforePaint(() => {
    if (!list.current || !indicator.current) return;
    const instance = createThumb(list.current, indicator.current, TAB, "data-active");
    return () => instance.destroy();
  }, []);

  return (
    <Tabs.List
      data-slot="tabs-list"
      {...props}
      ref={merged}
      className={cn(tabsListVariants({ size }), className)}
      data-size={size}
      onClick={(event) => {
        // A tab the list's edge cuts comes in when it is clicked; the arrow keys already do this.
        (event.target as Element).closest(TAB)?.scrollIntoView({
          block: "nearest",
          inline: "nearest",
        });
        onClick?.(event);
      }}
    >
      <GlideHighlight glide={glide} />
      <span
        ref={indicator}
        data-slot="tabs-indicator"
        className={tabsSlots.indicator}
        aria-hidden="true"
      />
      {children}
    </Tabs.List>
  );
}

export interface TabsTabProps extends Omit<Tabs.Tab.Props, "className"> {
  className?: string | undefined;
}

/**
 * One tab: Base UI's Tab. It holds any node; its text is wrapped in a span, so a tab with only an
 * icon is square.
 */
export function TabsTab({ className, children, ...props }: TabsTabProps): ReactElement {
  return (
    <Tabs.Tab data-slot="tabs-tab" {...props} className={cn(tabsSlots.tab, className)}>
      {Children.map(children, (child) =>
        typeof child === "string" || typeof child === "number" ? (
          <span data-slot="tabs-label" className={tabsSlots.label}>
            {child}
          </span>
        ) : (
          child
        ),
      )}
    </Tabs.Tab>
  );
}

export interface TabsPanelProps extends Omit<Tabs.Panel.Props, "className"> {
  className?: string | undefined;
}

/** What a tab shows: Base UI's Panel, with no padding of its own. */
export function TabsPanel({ className, ...props }: TabsPanelProps): ReactElement {
  return (
    <Tabs.Panel data-slot="tabs-panel" {...props} className={cn(tabsSlots.panel, className)} />
  );
}

export declare namespace TabsRoot {
  type Props = TabsRootProps;
  type State = Tabs.Root.State;
  type ChangeEventDetails = Tabs.Root.ChangeEventDetails;
}

export declare namespace TabsList {
  type Props = TabsListProps;
  type State = Tabs.List.State;
}

export declare namespace TabsTab {
  type Props = TabsTabProps;
  type State = Tabs.Tab.State;
}

export declare namespace TabsPanel {
  type Props = TabsPanelProps;
  type State = Tabs.Panel.State;
}
