"use client";

import { type HTMLAttributes, useEffect, useRef } from "react";

/**
 * A scroller without a visible scrollbar: each edge fades (globals.css, .scroll-fade) while there
 * is more to scroll that way. The mask sits on the inner scroller, which takes every prop but
 * `className`, so the outer element's background and its focus ring (drawn for the scroller) stay
 * solid.
 */
export function ScrollFade({ className, children, ...scroller }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    observe();
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
