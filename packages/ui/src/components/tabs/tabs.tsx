"use client";

import { Tabs } from "@base-ui/react/tabs";
import {
  Children,
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { withClassName } from "../../core/class-name";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { createThumb } from "../toggle-group/thumb";
import "./tabs.css";

const cls = {
  root: "ow-tabs",
  list: "ow-tabs__list",
  indicator: "ow-tabs__indicator",
  tab: "ow-tabs__tab",
  label: "ow-tabs__label",
  panel: "ow-tabs__panel",
} as const;

const TAB = `.${cls.tab}`;

// The indicator is placed before the first paint; the server has no layout, so it falls back
// without React 18's warning (and the active tab draws its own key until then).
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

// For the List's Glide axis. (Context.Provider, not <Context>: React 18.2 is a supported peer.)
const OrientationContext = createContext<Tabs.Root.Orientation>("horizontal");

export type TabsSize = "sm" | "md" | "lg";

export type TabsRootProps = Omit<Tabs.Root.Props, "ref">;

/** The tabs and their panels: the list above the panel, or beside it when vertical. */
export const TabsRoot: ForwardRefExoticComponent<TabsRootProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, TabsRootProps>(function TabsRoot(
    { className, orientation = "horizontal", ...props },
    ref,
  ) {
    return (
      <OrientationContext.Provider value={orientation}>
        <Tabs.Root
          {...props}
          ref={ref}
          orientation={orientation}
          className={withClassName(cls.root, className)}
        />
      </OrientationContext.Provider>
    );
  });

export interface TabsListProps extends Omit<Tabs.List.Props, "ref"> {
  /** Font size and padding of the tabs (FR-11). Default `"md"`. */
  size?: TabsSize | undefined;
}

/**
 * The tabs: a flat well as wide as they are, and scrolling sideways when they do not fit. It draws
 * the indicator that slides under the active tab, and the hover highlight (Glide).
 */
export const TabsList: ForwardRefExoticComponent<TabsListProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
    { className, size = "md", onClick, children, ...props },
    ref,
  ) {
    const orientation = useContext(OrientationContext);
    const glide = useGlide<HTMLDivElement>({
      items: TAB,
      axis: orientation === "vertical" ? "y" : "x",
    });
    const list = useRef<HTMLDivElement | null>(null);
    const indicator = useRef<HTMLSpanElement>(null);

    useBeforePaint(() => {
      if (!list.current || !indicator.current) return;
      const instance = createThumb(list.current, indicator.current, TAB, "data-active");
      return () => instance.destroy();
    }, []);

    const glideRef = glide.ref;
    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        list.current = el;
        glideRef(el);
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [glideRef, ref],
    );

    return (
      <Tabs.List
        {...props}
        ref={setRef}
        className={withClassName(cls.list, className)}
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
        <span ref={indicator} className={cls.indicator} aria-hidden="true" />
        {children}
      </Tabs.List>
    );
  });

export type TabsTabProps = Omit<Tabs.Tab.Props, "ref">;

/**
 * One tab: Base UI's Tab. It holds any node; its text is wrapped in a span, so a tab with only an
 * icon is square (FR-10a).
 */
export const TabsTab: ForwardRefExoticComponent<TabsTabProps & RefAttributes<HTMLElement>> =
  forwardRef<HTMLElement, TabsTabProps>(function TabsTab({ className, children, ...props }, ref) {
    return (
      <Tabs.Tab {...props} ref={ref} className={withClassName(cls.tab, className)}>
        {Children.map(children, (child) =>
          typeof child === "string" || typeof child === "number" ? (
            <span className={cls.label}>{child}</span>
          ) : (
            child
          ),
        )}
      </Tabs.Tab>
    );
  });

export type TabsPanelProps = Omit<Tabs.Panel.Props, "ref">;

/** What a tab shows: Base UI's Panel, with no padding of its own. */
export const TabsPanel: ForwardRefExoticComponent<TabsPanelProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel({ className, ...props }, ref) {
    return <Tabs.Panel {...props} ref={ref} className={withClassName(cls.panel, className)} />;
  });

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
