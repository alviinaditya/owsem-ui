// Generated from core/scroll-lock.ts by scripts/build-tailwind.ts; do not edit.
import { useEffect, useState } from "react";

/**
 * A scroll lock that leaves the page's overflow alone. Setting `overflow: hidden` on the page, as
 * Base UI's modal lock does, stops Chrome from compositing its scroll, and every line of text is
 * drawn again a little differently while a menu is open. Here the page stays scrollable to the
 * browser: the wheel, scroll keys, and anything else that moves it (a dragged scrollbar) are held
 * back, except inside the open popups. Opened by touch, it does not lock, as Base UI does not.
 *
 * Base UI still locks the page its own way where it must (a Select laid over its trigger, which
 * cannot follow a scroll). While this lock holds the page, those style changes to <html> and
 * <body> are put back before the browser draws, to the values they had when this lock began, so
 * a lock that was there first (a Dialog's) stays.
 */

const KEYS = new Set([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"]);
/** What a page lock writes on <html> and <body>, Base UI's included. */
const PAGE_STYLE = [
  "overflow",
  "overflow-x",
  "overflow-y",
  "scrollbar-gutter",
  "position",
  "height",
  "width",
  "box-sizing",
  "scroll-behavior",
];
let unguard: (() => void) | null = null;
const regions = new Set<Element>();
let held: [number, number] | null = null;
let lastPointer = "mouse";

const inRegion = (target: EventTarget | null) =>
  target instanceof Node && [...regions].some((region) => region.contains(target));

/** Whether something inside a region can still scroll the way the wheel turns. */
function canScroll(target: EventTarget | null, dx: number, dy: number): boolean {
  for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (dy && /auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
      const room = dy < 0 ? el.scrollTop : el.scrollHeight - el.clientHeight - el.scrollTop;
      if (room > 1) return true;
    }
    if (dx && /auto|scroll/.test(style.overflowX) && el.scrollWidth > el.clientWidth) {
      const left = Math.abs(el.scrollLeft);
      const room = dx < 0 ? left : el.scrollWidth - el.clientWidth - left;
      if (room > 1) return true;
    }
    if (regions.has(el)) break;
  }
  return false;
}

function onWheel(event: WheelEvent) {
  if (!inRegion(event.target) || !canScroll(event.target, event.deltaX, event.deltaY)) {
    event.preventDefault();
  }
}

function onKey(event: KeyboardEvent) {
  const target = event.target;
  if (!KEYS.has(event.key) || inRegion(target)) return;
  if (target instanceof Element && target.closest("input, textarea, select, [contenteditable]")) {
    return;
  }
  event.preventDefault();
}

function onScroll() {
  if (held && (window.scrollX !== held[0] || window.scrollY !== held[1])) {
    window.scrollTo(held[0], held[1]);
  }
}

/** Keeps the page's own lock styles as they are now, until the returned function is called. */
function guardPageStyle(): () => void {
  const els = [document.documentElement, document.body];
  const kept = els.map((el) => PAGE_STYLE.map((name) => el.style.getPropertyValue(name)));
  const putBack = () => {
    els.forEach((el, i) => {
      PAGE_STYLE.forEach((name, j) => {
        const value = kept[i]?.[j] ?? "";
        if (el.style.getPropertyValue(name) === value) return;
        if (value) el.style.setProperty(name, value);
        else el.style.removeProperty(name);
      });
    });
  };
  const observer = new MutationObserver(putBack);
  for (const el of els) observer.observe(el, { attributes: true, attributeFilter: ["style"] });
  return () => observer.disconnect();
}

function onPointer(event: PointerEvent) {
  lastPointer = event.pointerType;
}

/** Starts noting the last pointer type, so a lock knows whether touch opened its popup. */
export function trackPointerType(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("pointerdown", onPointer, { capture: true, passive: true });
}

/** Locks the page's scroll while `region` is open; scrolling inside it still works. */
export function lockScroll(region: Element): () => void {
  if (lastPointer === "touch") return () => {};
  if (regions.size === 0) {
    held = [window.scrollX, window.scrollY];
    unguard = guardPageStyle();
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  regions.add(region);
  return () => {
    if (!regions.delete(region) || regions.size > 0) return;
    held = null;
    unguard?.();
    unguard = null;
    window.removeEventListener("wheel", onWheel, { capture: true });
    window.removeEventListener("keydown", onKey, { capture: true });
    window.removeEventListener("scroll", onScroll);
  };
}

/** Locks the page's scroll while `region` is mounted and `enabled`. */
export function useScrollLock(region: Element | null, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !region) return;
    return lockScroll(region);
  }, [region, enabled]);
}

/**
 * For a Root that keeps Base UI's `modal` (Dialog, Popover): follows whether it is open, so the
 * lock goes by open state, not by mount, and notes the pointer type. Pass the result's
 * `onOpenChange` on to Base UI.
 */
export function useOpenState<Details extends { isCanceled?: boolean }>(props: {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, details: Details) => void) | undefined;
}): { open: boolean; onOpenChange: (open: boolean, details: Details) => void } {
  const [opened, setOpened] = useState(props.defaultOpen ?? false);
  useEffect(trackPointerType, []);
  const { onOpenChange } = props;
  return {
    open: props.open ?? opened,
    onOpenChange: (next: boolean, details: Details) => {
      onOpenChange?.(next, details);
      if (!details.isCanceled) setOpened(next);
    },
  };
}
