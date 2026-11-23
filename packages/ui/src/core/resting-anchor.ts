import { type Ref, type RefCallback, useCallback, useRef } from "react";
import { useMergedRefs } from "./merge-refs";

/** A box Base UI measures in place of the trigger; scroll and resize follow the trigger. */
export interface RestingAnchor {
  getBoundingClientRect: () => DOMRect;
  contextElement: Element;
}

/**
 * A popup's anchor at its trigger's resting box. A press scales the trigger, and the popup
 * opens while it is still settling: placed from the pressed box, it lands a device pixel off, then
 * jumps when Base UI measures again as the trigger grows back. This anchor undoes the trigger's own
 * scale and translate, so every measure gives the box it rests at.
 */

/** The element's box without its own `translate`, `scale`, and `transform` (scale and move only). */
export function restingRect(el: Element): DOMRect {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  if (style.translate.includes("%")) return rect;
  const m = new DOMMatrix();
  if (style.translate !== "none") {
    const [tx = 0, ty = 0] = style.translate.split(" ").map(Number.parseFloat);
    m.translateSelf(tx, ty);
  }
  if (style.scale !== "none") {
    const [sx = 1, sy = sx] = style.scale.split(" ").map(Number.parseFloat);
    m.scaleSelf(sx, sy);
  }
  if (style.transform !== "none") m.multiplySelf(new DOMMatrix(style.transform));
  if (m.isIdentity || m.b || m.c || m.a <= 0 || m.d <= 0) return rect;
  const [ox = 0, oy = 0] = style.transformOrigin.split(" ").map(Number.parseFloat);
  const box = el as HTMLElement;
  // Scaled ancestors scale the transform's offsets too.
  const kx = box.offsetWidth ? rect.width / (m.a * box.offsetWidth) : 1;
  const ky = box.offsetHeight ? rect.height / (m.d * box.offsetHeight) : 1;
  return new DOMRect(
    rect.left - kx * (ox * (1 - m.a) + m.e),
    rect.top - ky * (oy * (1 - m.d) + m.f),
    rect.width / m.a,
    rect.height / m.d,
  );
}

/** The open trigger whose aria-controls names the positioner or something inside it. */
function findTrigger(positioner: Element): Element | null {
  const ids = [positioner, ...positioner.querySelectorAll("[id]")]
    .map((el) => el.id)
    .filter(Boolean);
  for (const id of ids) {
    const trigger = positioner.ownerDocument.querySelector(
      `[aria-expanded="true"][aria-controls~="${CSS.escape(id)}"]`,
    );
    if (trigger) return trigger;
  }
  return null;
}

/**
 * For a Positioner: a ref for its element and an `anchor` for Base UI. With no trigger found, the
 * anchor is null and Base UI uses its own. Not for context menus, whose anchor is the pointer.
 */
export function useRestingAnchor<T extends Element>(
  forwarded: Ref<T> | undefined,
): { ref: RefCallback<T>; anchor: () => RestingAnchor | null } {
  const own = useRef<T | null>(null);
  const track = useCallback((node: T | null) => {
    own.current = node;
  }, []);
  const ref = useMergedRefs(track, forwarded);
  const anchor = useCallback((): RestingAnchor | null => {
    const trigger = own.current && findTrigger(own.current);
    if (!trigger) return null;
    return { getBoundingClientRect: () => restingRect(trigger), contextElement: trigger };
  }, []);
  return { ref, anchor };
}
