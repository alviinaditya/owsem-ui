// Generated from core/resting-anchor.ts by scripts/build-tailwind.ts; do not edit.
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
  const width = rect.width / m.a;
  const height = rect.height / m.d;
  // Scaled ancestors scale the transform's offsets too.
  const kx = ancestorScale(width, box.offsetWidth);
  const ky = ancestorScale(height, box.offsetHeight);
  return new DOMRect(
    rect.left - kx * (ox * (1 - m.a) + m.e),
    rect.top - ky * (oy * (1 - m.d) + m.f),
    width,
    height,
  );
}

/** Offset sizes are whole px: anything under 1px apart is rounding, not a scale. */
const ancestorScale = (size: number, offset: number) =>
  offset && Math.abs(size - offset) >= 1 ? size / offset : 1;

// Less than this many px apart, two measures are of the same box.
const SAME = 0.05;
const boxes = new WeakMap<Element, DOMRect>();

/**
 * The resting box, the same one for as long as it has not moved. What is left of a transform taken
 * off differs a little from frame to frame, and Base UI rounds a popup to device pixels: with the
 * trigger on half a pixel, that moved the popup back and forth while the press was settling.
 */
export function steadyRect(el: Element): DOMRect {
  const box = restingRect(el);
  const last = boxes.get(el);
  const same =
    last &&
    Math.abs(last.left - box.left) < SAME &&
    Math.abs(last.top - box.top) < SAME &&
    Math.abs(last.width - box.width) < SAME &&
    Math.abs(last.height - box.height) < SAME;
  if (same) return last;
  boxes.set(el, box);
  return box;
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
    return { getBoundingClientRect: () => steadyRect(trigger), contextElement: trigger };
  }, []);
  return { ref, anchor };
}
