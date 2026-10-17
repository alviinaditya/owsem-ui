/** Geometry tolerance in px. */
export const TOL = 0.5;

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** A measured surface: an element or one of its pseudo-elements (e.g. `.socket::before`). */
export type Surface = Element | { el: Element; pseudo: "::before" | "::after" };

const parts = (surface: Surface) =>
  surface instanceof Element ? { el: surface, pseudo: undefined } : surface;

/** The painted box. A pseudo-element's box is the host box minus its insets. */
export function rect(surface: Surface): DOMRect {
  const { el, pseudo } = parts(surface);
  const host = el.getBoundingClientRect();
  if (!pseudo) return host;
  const style = getComputedStyle(el, pseudo);
  const inset = (prop: string) => Number.parseFloat(style.getPropertyValue(prop)) || 0;
  const top = inset("top");
  const left = inset("left");
  return new DOMRect(
    host.left + left,
    host.top + top,
    host.width - left - inset("right"),
    host.height - top - inset("bottom"),
  );
}

export function insets(outer: Surface, inner: Surface): Insets {
  const o = rect(outer);
  const i = rect(inner);
  return {
    top: i.top - o.top,
    right: o.right - i.right,
    bottom: o.bottom - i.bottom,
    left: i.left - o.left,
  };
}

/**
 * The used top-left radius: percentages resolved against the box, and oversized radii scaled
 * down per the CSS corner-overlap rule (so 9999px becomes half the control height).
 */
export function usedRadius(surface: Surface): number {
  const { el, pseudo } = parts(surface);
  const style = getComputedStyle(el, pseudo);
  const { width: w, height: h } = rect(surface);
  const corner = (prop: string, size: number) => {
    const value = style.getPropertyValue(prop).trim().split(/\s+/)[0] ?? "0";
    return value.endsWith("%") ? (Number.parseFloat(value) / 100) * size : Number.parseFloat(value);
  };
  const tl = corner("border-top-left-radius", w);
  const tr = corner("border-top-right-radius", w);
  const br = corner("border-bottom-right-radius", w);
  const bl = corner("border-bottom-left-radius", w);
  const ratio = (size: number, a: number, b: number) => (a + b > 0 ? size / (a + b) : 1);
  const f = Math.min(1, ratio(w, tl, tr), ratio(w, bl, br), ratio(h, tl, bl), ratio(h, tr, br));
  return tl * f;
}

/** FR-10b: outer radius = inner radius + the padding between them (top and left must match). */
export function concentric(
  outer: Surface,
  inner: Surface,
): { rOuter: number; expected: number; delta: number; insetDelta: number } {
  const gap = insets(outer, inner);
  const rOuter = usedRadius(outer);
  const expected = usedRadius(inner) + gap.top;
  return {
    rOuter,
    expected,
    delta: Math.abs(rOuter - expected),
    insetDelta: Math.abs(gap.top - gap.left),
  };
}
