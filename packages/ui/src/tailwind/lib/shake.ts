// Generated from core/shake.ts by scripts/build-tailwind.ts; do not edit.
import { type Ref, type RefCallback, useCallback, useEffect, useRef } from "react";
import { useMergedRefs } from "./merge-refs";

/** What a field's shake reads as invalid (Base UI's attribute, or the author's). */
export const INVALID = '[data-invalid], [aria-invalid="true"]';
/** Set while the field is valid, so only a field that becomes invalid shakes. */
export const ARMED_ATTR = "data-armed";

/**
 * Arms a field for its shake while it is valid. One that is already invalid at first render, or
 * from the server, stays unarmed until it turns valid, so it never shakes on mount. Returns the ref
 * to give the element; the caller's `ref` still gets it.
 */
export function useShakeGate<T extends HTMLElement>(
  forwarded?: Ref<T> | undefined,
): RefCallback<T> {
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
  const track = useCallback((el: T | null) => {
    node.current = el;
  }, []);
  return useMergedRefs(track, forwarded);
}
