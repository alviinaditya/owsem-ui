// Generated from components/tabs by scripts/build-tailwind.ts; do not edit.
"use client";

import { Tabs } from "@base-ui/react/tabs";
import { Children, createContext, type ReactElement, useContext, useEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { GlideHighlight, useGlide } from "../lib/glide/use-glide";
import { useMergedRefs } from "../lib/merge-refs";
import { prefersReducedMotion } from "../lib/reduced-motion";
import { useBeforePaint } from "../lib/use-before-paint";
import { createThumb } from "../toggle-group/thumb";
import { type TabsListVariantProps, tabsListVariants, tabsSlots } from "./tabs-variants";

// Base UI gives every tab this role, also when another element renders it.
const TAB = '[role="tab"]';

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
  /** Chevron buttons at the end with more tabs beyond it, when they do not fit. @default true */
  scrollButtons?: boolean | undefined;
}

// Lucide icons (ISC): chevron-left, chevron-right, chevron-up, chevron-down.
const CHEVRON = {
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  up: "m18 15-6-6-6 6",
  down: "m6 9 6 6 6-6",
} as const;

// A wheel that counts lines, not pixels.
const lines = (event: WheelEvent) => (event.deltaMode === 1 ? 16 : 1);

/**
 * Keeps the track's overflow honest: `data-overflow-start` and `-end` say which sides have more
 * tabs, a vertical wheel scrolls a horizontal track, and the active tab is brought into view.
 */
function useTrack(track: { current: HTMLElement | null }, vertical: boolean): void {
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const rtl = () => getComputedStyle(el).direction === "rtl";

    const update = () => {
      const room = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
      // scrollLeft is negative in right-to-left writing.
      const at = Math.abs(vertical ? el.scrollTop : el.scrollLeft);
      el.toggleAttribute("data-overflow-start", at > 1);
      el.toggleAttribute("data-overflow-end", room - at > 1);
    };

    // Moves only this track, never the page, so the first paint does not scroll it. The gap it
    // keeps to the edge is the track's scroll-padding.
    const reveal = (smooth: boolean) => {
      const tab = el.querySelector<HTMLElement>(`${TAB}[data-active]`);
      if (!tab) return;
      const box = el.getBoundingClientRect();
      const at = tab.getBoundingClientRect();
      const style = getComputedStyle(el);
      const before = vertical
        ? at.top - box.top - Number.parseFloat(style.scrollPaddingTop)
        : at.left - box.left - Number.parseFloat(style.scrollPaddingLeft);
      const after = vertical
        ? box.bottom - at.bottom - Number.parseFloat(style.scrollPaddingBottom)
        : box.right - at.right - Number.parseFloat(style.scrollPaddingRight);
      const by = before < 0 ? before : after < 0 ? -after : 0;
      if (!by) return;
      const behavior = smooth && !prefersReducedMotion() ? "smooth" : "instant";
      el.scrollBy(vertical ? { top: by, behavior } : { left: by, behavior });
    };

    // A wheel turns a horizontal track; at its end the page gets the wheel back.
    const wheel = (event: WheelEvent) => {
      if (vertical || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const room = el.scrollWidth - el.clientWidth;
      const flip = rtl() ? -1 : 1;
      const [min, max] = flip < 0 ? [-room, 0] : [0, room];
      const next = Math.min(max, Math.max(min, el.scrollLeft + event.deltaY * flip * lines(event)));
      if (room <= 0 || next === el.scrollLeft) return;
      event.preventDefault();
      el.scrollLeft = next;
    };

    const sizes = new ResizeObserver(update);
    const observe = () => {
      sizes.disconnect();
      sizes.observe(el);
      for (const tab of el.querySelectorAll(TAB)) sizes.observe(tab);
    };
    const changes = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList")) observe();
      if (records.some((record) => record.attributeName === "data-active")) reveal(true);
    });
    changes.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-active"],
    });
    observe();
    update();
    reveal(false);
    el.addEventListener("scroll", update, { passive: true });
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      sizes.disconnect();
      changes.disconnect();
      el.removeEventListener("scroll", update);
      el.removeEventListener("wheel", wheel);
    };
  }, [track, vertical]);
}

/**
 * The tabs: a flat well as wide as they are. When they do not fit, they scroll inside it, with the
 * edges fading where more tabs hide and a chevron button there. It draws the indicator that slides
 * under the active tab, and the hover highlight (Glide).
 */
export function TabsList({
  size = "md",
  scrollButtons = true,
  className,
  onClick,
  children,
  ref,
  ...props
}: TabsListProps): ReactElement {
  const orientation = useContext(OrientationContext);
  const vertical = orientation === "vertical";
  const glide = useGlide<HTMLDivElement>({
    items: TAB,
    skip: "[data-active]",
    axis: vertical ? "y" : "x",
  });
  const track = useRef<HTMLDivElement | null>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const merged = useMergedRefs(track, glide.ref);

  useBeforePaint(() => {
    if (!track.current || !indicator.current) return;
    const instance = createThumb(track.current, indicator.current, TAB, "data-active");
    return () => instance.destroy();
  }, []);
  useTrack(track, vertical);

  // About a page: what shows, less one tab, so the one at the edge stays in sight.
  const page = (toward: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const tab = el.querySelector<HTMLElement>(TAB);
    const view = vertical ? el.clientHeight : el.clientWidth;
    const one = tab ? (vertical ? tab.offsetHeight : tab.offsetWidth) : 0;
    const by = Math.max(view / 2, view - one) * toward;
    const flip = !vertical && getComputedStyle(el).direction === "rtl" ? -1 : 1;
    const behavior = prefersReducedMotion() ? "instant" : "smooth";
    el.scrollBy(vertical ? { top: by, behavior } : { left: by * flip, behavior });
  };
  const shape = vertical ? (["up", "down"] as const) : (["left", "right"] as const);

  return (
    <Tabs.List
      data-slot="tabs-list"
      {...props}
      ref={ref}
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
      <div
        data-slot="tabs-track"
        data-orientation={orientation}
        ref={merged}
        className={tabsSlots.track}
      >
        <GlideHighlight glide={glide} />
        <span
          ref={indicator}
          data-slot="tabs-indicator"
          className={tabsSlots.indicator}
          aria-hidden="true"
        />
        {children}
      </div>
      {scrollButtons
        ? (["start", "end"] as const).map((edge, i) => (
            // Out of the tab order and the tree: the tabs are reached with the arrow keys.
            <button
              key={edge}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              data-slot="tabs-scroll-button"
              data-edge={edge}
              className={tabsSlots.scrollButton}
              // The selected tab keeps focus.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => page(i === 0 ? -1 : 1)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={CHEVRON[shape[i] as keyof typeof CHEVRON]} />
              </svg>
            </button>
          ))
        : null}
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
