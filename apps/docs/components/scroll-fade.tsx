"use client";

import { type HTMLAttributes, useEffect, useLayoutEffect, useRef } from "react";

/**
 * A scroller without a visible scrollbar: each edge fades (globals.css, .scroll-fade) while there
 * is more to scroll that way. The mask sits on the inner scroller, which takes every prop but
 * `className`, so the outer element's background and its focus ring (drawn for the scroller) stay
 * solid.
 */
export function ScrollFade({
  className,
  wheelX = false,
  children,
  ...scroller
}: HTMLAttributes<HTMLDivElement> & {
  /** A row: a mouse wheel scrolls it sideways, then the page once the row reaches its end. */
  wheelX?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!wheelX || !el) return;
    const onWheel = (event: WheelEvent) => {
      // A trackpad already scrolls sideways.
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const end = el.scrollWidth - el.clientWidth;
      const left = Math.max(0, Math.min(end, el.scrollLeft + event.deltaY));
      if (left === el.scrollLeft) return;
      event.preventDefault();
      el.scrollLeft = left;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wheelX]);

  // Before the first paint, so a scroller mounted on the client never shows a frame unfaded.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const right = el.scrollWidth - el.clientWidth - el.scrollLeft;
      const bottom = el.scrollHeight - el.clientHeight - el.scrollTop;
      el.toggleAttribute("data-fade-top", el.scrollTop > 1);
      el.toggleAttribute("data-fade-bottom", bottom > 1);
      el.toggleAttribute("data-fade-left", el.scrollLeft > 1);
      el.toggleAttribute("data-fade-right", right > 1);
    };
    // The scroller resizes with the window; its content changes with tabs, scenes, and controls.
    const sizes = new ResizeObserver(update);
    const observe = () => {
      sizes.disconnect();
      sizes.observe(el);
      for (const child of el.children) sizes.observe(child);
      update();
    };
    const content = new MutationObserver(observe);
    content.observe(el, { childList: true, subtree: true, characterData: true });
    el.addEventListener("scroll", update, { passive: true });
    // The first fades are simply there; later changes transition.
    el.setAttribute("data-instant", "");
    observe();
    void getComputedStyle(el).getPropertyValue("--fade-bottom");
    el.removeAttribute("data-instant");
    return () => {
      el.removeEventListener("scroll", update);
      content.disconnect();
      sizes.disconnect();
    };
  }, []);

  return (
    <div className={`scroll-fade-host ${className ?? ""}`}>
      <div ref={ref} {...scroller} className="scroll-fade">
        {children}
      </div>
    </div>
  );
}
