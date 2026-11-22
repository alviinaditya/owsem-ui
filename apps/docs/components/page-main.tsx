"use client";

import { type ComponentProps, type ReactElement, useLayoutEffect, useRef } from "react";

// Pages that have been on screen. The first page is the one the server sent, so it does not
// fade in; StrictMode's second effect sees the same node and leaves it alone.
const seen = new WeakSet<HTMLElement>();
let navigated = false;

/**
 * A page's <main>. A page a navigation brings in fades in and rises a little (DS-16, "Page
 * changes" in globals.css). It is CSS only: a view transition froze the screen, the sidebar's
 * motion included, while it captured the old and new pages.
 */
export function PageMain({ className, ...props }: ComponentProps<"main">): ReactElement {
  const ref = useRef<HTMLElement>(null);
  // Before paint, so the new page never shows a frame before its fade.
  useLayoutEffect(() => {
    const main = ref.current;
    if (!main || seen.has(main)) return;
    seen.add(main);
    if (navigated) main.setAttribute("data-enter", "");
    navigated = true;
  }, []);
  return (
    <main {...props} ref={ref} className={className ? `page-enter ${className}` : "page-enter"} />
  );
}
