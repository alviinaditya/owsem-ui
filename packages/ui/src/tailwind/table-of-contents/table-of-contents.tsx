// Generated from components/table-of-contents by scripts/build-tailwind.ts; do not edit.
"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  type ComponentProps,
  createContext,
  type ReactElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { cn } from "../lib/cn";
import { useMergedRefs } from "../lib/merge-refs";
import { tableOfContentsSlots } from "./table-of-contents-variants";
import { createTracker } from "./tracker";

// Placing the marker before the first paint keeps a nav mounted on the client (a route change)
// from showing a frame without it; the server has no layout, so it falls back to an effect there.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

// The level of the list a link is in: 1 for the top list.
const DepthContext = createContext(0);

export interface TableOfContentsRootProps extends Omit<ComponentProps<"nav">, "className"> {
  className?: string | undefined;
}

/**
 * The table of contents: a `<nav>` that tracks the section being read and holds the marker. Its
 * links' targets are found by id; the current link gets `aria-current="location"`.
 */
export function TableOfContentsRoot({
  className,
  children,
  ref,
  ...props
}: TableOfContentsRootProps): ReactElement {
  const root = useRef<HTMLElement | null>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const merged = useMergedRefs(root, ref);

  useBeforePaint(() => {
    if (!root.current || !marker.current) return;
    const tracker = createTracker(root.current, marker.current);
    return () => tracker.destroy();
  }, []);

  return (
    <nav
      data-slot="table-of-contents"
      {...props}
      ref={merged}
      className={cn(tableOfContentsSlots.root, className)}
    >
      {children}
      <span
        ref={marker}
        data-slot="table-of-contents-marker"
        className={tableOfContentsSlots.marker}
        aria-hidden="true"
      />
    </nav>
  );
}

export interface TableOfContentsListProps extends Omit<ComponentProps<"ul">, "className"> {
  className?: string | undefined;
}

/** A list of sections. The top one draws the rail; a nested one, inside an Item, indents. */
export function TableOfContentsList({
  className,
  children,
  ...props
}: TableOfContentsListProps): ReactElement {
  const depth = useContext(DepthContext) + 1;
  return (
    <ul
      data-depth={depth}
      {...props}
      // Found by this, so it stays.
      data-slot="table-of-contents-list"
      className={cn(tableOfContentsSlots.list, className)}
    >
      <DepthContext.Provider value={depth}>{children}</DepthContext.Provider>
    </ul>
  );
}

export interface TableOfContentsItemProps extends Omit<ComponentProps<"li">, "className"> {
  className?: string | undefined;
}

/** One section: its `Link`, and a nested `List` for its sub-sections. */
export function TableOfContentsItem({
  className,
  ...props
}: TableOfContentsItemProps): ReactElement {
  return (
    <li
      data-slot="table-of-contents-item"
      {...props}
      className={cn(tableOfContentsSlots.item, className)}
    />
  );
}

export interface TableOfContentsLinkProps extends Omit<useRender.ComponentProps<"a">, "className"> {
  className?: string | undefined;
}

/** A link to a section, by its hash (`href="#id"`). `render` swaps the `<a>` for a router's link. */
export function TableOfContentsLink({
  className,
  render,
  ref,
  ...props
}: TableOfContentsLinkProps): ReactElement {
  const defaults = { "data-depth": useContext(DepthContext), ...props };
  const forced = {
    // Found by this, so it stays.
    "data-slot": "table-of-contents-link",
    className: cn(tableOfContentsSlots.link, className),
  };
  return useRender({
    defaultTagName: "a",
    render,
    ref,
    props: mergeProps<"a">(defaults, forced),
  });
}
