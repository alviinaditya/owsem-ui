import { type ForwardedRef, type RefCallback, useCallback, useEffect, useRef } from "react";

/** What a field's shake reads as invalid (Base UI's attribute, or the author's). */
export const INVALID = '[data-invalid], [aria-invalid="true"]';
/** Set while the field is valid, so only a field that becomes invalid shakes (input.css). */
export const ARMED_ATTR = "data-armed";

/**
 * Arms a field for its shake while it is valid. One that is already invalid at first render, or
 * from the server, stays unarmed until it turns valid, so it never shakes on mount. Returns the ref
 * to give the element; the forwarded `ref` still gets it.
 */
export function useShakeGate<T extends HTMLElement>(forwarded: ForwardedRef<T>): RefCallback<T> {
  const node = useRef<T | null>(null);
  useEffect(() => {
    const el = node.current;
    if (!el) return;
    const arm = () => {
      if (!el.matches(INVALID)) el.setAttribute(ARMED_ATTR, "");
    };
    arm();
    const watch = new MutationObserver(arm);
    watch.observe(el, { attributes: true, attributeFilter: ["data-invalid", "aria-invalid"] });
    return () => watch.disconnect();
  }, []);
  return useCallback(
    (el: T | null) => {
      node.current = el;
      if (typeof forwarded === "function") forwarded(el);
      else if (forwarded) forwarded.current = el;
    },
    [forwarded],
  );
}
