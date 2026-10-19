/**
 * Glide (PRD, Core): one highlight that glides to the item nearest the pointer.
 *
 * - The nearest enabled item wins, gaps included, so the highlight never blinks between items.
 * - It moves by `transform` only, through a CSS transition (glide.css): no frames when idle.
 * - A click in a gap goes to the lit item, within `gapClick.maxDistance`.
 * - Focus is never moved. Keyboard-driven components light items with `setActive()`.
 */

export type GlideAxis = "x" | "y" | "xy";

export interface GlideOptions {
  /** Which descendants are items. Default `"[data-glide-item]"`. */
  items?: string | undefined;
  /** `"y"` for lists and menus (default), `"x"` for tabs and toggle groups, `"xy"` for grids. */
  axis?: GlideAxis | undefined;
  /** Beyond this many px from every item, nothing is lit. Default: anywhere in the container. */
  maxDistance?: number | undefined;
  /** Px the lit item keeps winning by in a gap, so the highlight does not flicker. Default `2`. */
  hysteresis?: number | undefined;
  /** Ms before the highlight fades once the pointer leaves. Default `70`. */
  hideDelay?: number | undefined;
  /** Forward a click in a gap to the lit item. `false` turns it off. Default `{ maxDistance: 16 }`. */
  gapClick?: boolean | { maxDistance: number } | undefined;
  isDisabled?: ((item: HTMLElement) => boolean) | undefined;
  onChange?: ((item: HTMLElement | null) => void) | undefined;
}

export interface Glide {
  /** The lit item, or null. */
  readonly active: HTMLElement | null;
  /** Lights an item (or none) without a pointer, e.g. for keyboard highlight. */
  setActive(item: HTMLElement | null): void;
  /** Re-reads positions after items move under a still pointer. */
  refresh(): void;
  destroy(): void;
}

/** Set on the lit item. */
export const ACTIVE_ATTR = "data-glide-active";

const DISABLED = ':disabled, [aria-disabled="true"], [data-disabled]';

interface Hit {
  item: HTMLElement;
  rect: DOMRect;
  distance: number;
}

/**
 * Wires Glide to `container` (positioned by glide.css) and `highlight`, an element
 * inside it with the `ow-glide` class. `options` is read on every event, so it can change.
 */
export function createGlide(
  container: HTMLElement,
  highlight: HTMLElement,
  options: GlideOptions | (() => GlideOptions) = {},
): Glide {
  const read = typeof options === "function" ? options : () => options;
  let active: HTMLElement | null = null;
  let pointer: { x: number; y: number } | null = null;
  let down: { x: number; y: number } | null = null;
  // The size the highlight was shown at; moves scale from it.
  let base = { width: 1, height: 1 };
  let visible = false;
  let hideTimer = 0;
  let pressTimer = 0;

  container.setAttribute("data-glide", "");

  const disabled = (item: HTMLElement) => read().isDisabled?.(item) ?? item.matches(DISABLED);

  function distance(x: number, y: number, r: DOMRect): number {
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    const axis = read().axis ?? "y";
    return axis === "y" ? dy : axis === "x" ? dx : Math.hypot(dx, dy);
  }

  function nearest(x: number, y: number): Hit | null {
    const zone = container.getBoundingClientRect();
    if (x < zone.left || x > zone.right || y < zone.top || y > zone.bottom) return null;
    let best: Hit | null = null;
    let current: Hit | null = null;
    for (const item of container.querySelectorAll<HTMLElement>(
      read().items ?? "[data-glide-item]",
    )) {
      if (disabled(item)) continue;
      const rect = item.getBoundingClientRect();
      // Collapsed or hidden.
      if (rect.width === 0 || rect.height === 0) continue;
      const hit = { item, rect, distance: distance(x, y, rect) };
      if (item === active) current = hit;
      if (!best || hit.distance < best.distance) best = hit;
    }
    // In a gap, the lit item keeps winning by `hysteresis`; an item under the pointer always wins.
    if (best && current && best !== current && best.distance > 0) {
      if (current.distance - best.distance <= (read().hysteresis ?? 2)) best = current;
    }
    if (!best || best.distance > (read().maxDistance ?? Number.POSITIVE_INFINITY)) return null;
    return best;
  }

  /** Writes the highlight's geometry as custom properties; the CSS turns them into a transform. */
  function place(rect: DOMRect, snap: boolean): void {
    const box = container.getBoundingClientRect();
    if (snap) base = { width: Math.max(rect.width, 1), height: Math.max(rect.height, 1) };
    const style = highlight.style;
    if (snap) highlight.setAttribute("data-instant", "");
    style.setProperty("--_w", `${base.width}px`);
    style.setProperty("--_h", `${base.height}px`);
    style.setProperty(
      "--_x",
      `${rect.left - box.left - container.clientLeft + container.scrollLeft}px`,
    );
    style.setProperty(
      "--_y",
      `${rect.top - box.top - container.clientTop + container.scrollTop}px`,
    );
    style.setProperty("--_sx", String(rect.width / base.width));
    style.setProperty("--_sy", String(rect.height / base.height));
    if (snap) {
      // Commit the jump before transitions come back.
      void highlight.offsetWidth;
      highlight.removeAttribute("data-instant");
    }
  }

  function light(hit: Hit | null): void {
    const item = hit?.item ?? null;
    if (item !== active) {
      active?.removeAttribute(ACTIVE_ATTR);
      item?.setAttribute(ACTIVE_ATTR, "");
    }
    const changed = item !== active;
    active = item;
    if (hit) {
      // First appearance: in place, fading in. After that: glide.
      place(hit.rect, !visible);
      if (!visible) highlight.setAttribute("data-visible", "");
      visible = true;
    } else if (visible) {
      visible = false;
      highlight.removeAttribute("data-visible");
      highlight.removeAttribute("data-pressed");
    }
    if (changed) read().onChange?.(item);
  }

  const track = (x: number, y: number) => {
    clearTimeout(hideTimer);
    pointer = { x, y };
    light(nearest(x, y));
  };
  const refresh = () => {
    if (pointer) track(pointer.x, pointer.y);
    else if (active) {
      const rect = active.getBoundingClientRect();
      light(rect.width && rect.height ? { item: active, rect, distance: 0 } : null);
    }
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "touch") track(event.clientX, event.clientY);
  };
  const onLeave = () => {
    pointer = null;
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => light(null), read().hideDelay ?? 70);
  };
  const gapLimit = () => {
    const gap = read().gapClick ?? true;
    return gap === false ? -1 : gap === true ? 16 : gap.maxDistance;
  };
  const onDown = (event: PointerEvent) => {
    // Pointer coordinates are fractional; click coordinates are rounded, so decide with these.
    down = { x: event.clientX, y: event.clientY };
    if (event.button !== 0 || !active) return;
    const onItem = (event.target as Element).closest(read().items ?? "[data-glide-item]");
    const hit = onItem ? null : nearest(event.clientX, event.clientY);
    const pressed = onItem ? onItem === active : hit?.item === active && hit.distance <= gapLimit();
    if (!pressed) return;
    clearTimeout(pressTimer);
    highlight.setAttribute("data-pressed", "");
  };
  const onUp = () => {
    clearTimeout(pressTimer);
    pressTimer = window.setTimeout(() => highlight.removeAttribute("data-pressed"), 90);
  };
  const onClick = (event: MouseEvent) => {
    // A click on any item, disabled ones included, belongs to that item.
    if ((event.target as Element).closest(read().items ?? "[data-glide-item]")) return;
    const near =
      down && Math.abs(down.x - event.clientX) < 1.5 && Math.abs(down.y - event.clientY) < 1.5;
    const point = near && down ? down : { x: event.clientX, y: event.clientY };
    const hit = nearest(point.x, point.y);
    if (!hit || hit.distance > gapLimit()) return;
    // click() runs the item's action without moving focus.
    hit.item.click();
  };

  const resize = new ResizeObserver(refresh);
  resize.observe(container);
  container.addEventListener("pointermove", onMove, { passive: true });
  container.addEventListener("pointerleave", onLeave);
  container.addEventListener("pointerdown", onDown);
  container.addEventListener("click", onClick);
  // Scrolling moves items under a still pointer: the container's own, or a scroller around it.
  window.addEventListener("scroll", refresh, { passive: true, capture: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  return {
    get active() {
      return active;
    },
    setActive(item) {
      if (!item) return light(null);
      const rect = item.getBoundingClientRect();
      light({ item, rect, distance: 0 });
    },
    refresh,
    destroy() {
      clearTimeout(hideTimer);
      clearTimeout(pressTimer);
      resize.disconnect();
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("click", onClick);
      window.removeEventListener("scroll", refresh, { capture: true });
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      active?.removeAttribute(ACTIVE_ATTR);
      container.removeAttribute("data-glide");
    },
  };
}
