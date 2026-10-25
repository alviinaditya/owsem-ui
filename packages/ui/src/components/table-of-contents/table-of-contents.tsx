"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  type ComponentPropsWithoutRef,
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
import { cls, createTracker } from "./tracker";
import "./table-of-contents.css";

// Placing the marker before the first paint keeps a nav mounted on the client (a route change)
// from showing a frame without it; the server has no layout, so it falls back without React 18's
// warning.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

// The level of the list a link is in: 1 for the top list. (Context.Provider, not <Context>:
// React 18.2 is a supported peer.)
const DepthContext = createContext(0);

export type TableOfContentsRootProps = ComponentPropsWithoutRef<"nav">;

/**
 * The table of contents: a `<nav>` that tracks the section being read and holds the marker. Its
 * links' targets are found by id; the current link gets `aria-current="location"`.
 */
export const TableOfContentsRoot: ForwardRefExoticComponent<
  TableOfContentsRootProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, TableOfContentsRootProps>(function TableOfContentsRoot(
  { className, children, ...props },
  ref,
) {
  const root = useRef<HTMLElement | null>(null);
  const marker = useRef<HTMLSpanElement>(null);

  useBeforePaint(() => {
    if (!root.current || !marker.current) return;
    const tracker = createTracker(root.current, marker.current);
    return () => tracker.destroy();
  }, []);

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      root.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  return (
    <nav ref={setRef} className={className ? `${cls.root} ${className}` : cls.root} {...props}>
      {children}
      <span ref={marker} className={cls.marker} aria-hidden="true" />
    </nav>
  );
});

export type TableOfContentsListProps = ComponentPropsWithoutRef<"ul">;

/** A list of sections. The top one draws the rail; a nested one, inside an Item, indents. */
export const TableOfContentsList: ForwardRefExoticComponent<
  TableOfContentsListProps & RefAttributes<HTMLUListElement>
> = forwardRef<HTMLUListElement, TableOfContentsListProps>(function TableOfContentsList(
  { className, children, ...props },
  ref,
) {
  const depth = useContext(DepthContext) + 1;
  return (
    <ul
      ref={ref}
      className={className ? `${cls.list} ${className}` : cls.list}
      data-depth={depth}
      {...props}
    >
      <DepthContext.Provider value={depth}>{children}</DepthContext.Provider>
    </ul>
  );
});

export type TableOfContentsItemProps = ComponentPropsWithoutRef<"li">;

/** One section: its `Link`, and a nested `List` for its sub-sections. */
export const TableOfContentsItem: ForwardRefExoticComponent<
  TableOfContentsItemProps & RefAttributes<HTMLLIElement>
> = forwardRef<HTMLLIElement, TableOfContentsItemProps>(function TableOfContentsItem(
  { className, ...props },
  ref,
) {
  return <li ref={ref} className={className ? `${cls.item} ${className}` : cls.item} {...props} />;
});

export type TableOfContentsLinkProps = useRender.ComponentProps<"a">;

/** A link to a section, by its hash (`href="#id"`). `render` swaps the `<a>` for a router's link. */
export const TableOfContentsLink: ForwardRefExoticComponent<
  Omit<TableOfContentsLinkProps, "ref"> & RefAttributes<HTMLAnchorElement>
> = forwardRef<HTMLAnchorElement, Omit<TableOfContentsLinkProps, "ref">>(
  function TableOfContentsLink({ className, render, ...props }, ref) {
    const depth = useContext(DepthContext);
    return useRender({
      defaultTagName: "a",
      render,
      ref,
      props: mergeProps<"a">(
        {
          className: className ? `${cls.link} ${className}` : cls.link,
          "data-depth": depth,
        } as ComponentPropsWithoutRef<"a">,
        props,
      ),
    });
  },
);
