// Generated from core/use-ripple.ts by scripts/build-tailwind.ts; do not edit.
import { mergeProps } from "@base-ui/react/merge-props";
import { type PointerEvent, type RefObject, useRef } from "react";

const HELD = "data-held";

/** Restarts the ripple at the press point: a CSS transition, so nothing runs per frame. */
function startRipple(button: HTMLElement, ripple: HTMLElement, event: PointerEvent): void {
  const box = button.getBoundingClientRect();
  const style = getComputedStyle(button);
  const w = Number.parseFloat(style.width);
  const h = Number.parseFloat(style.height);
  // Layout px per screen px: undoes the press scale and any scaled ancestor.
  const k = box.width ? w / box.width : 1;
  const x = (event.clientX - box.left) * k;
  const y = (event.clientY - box.top) * k;
  ripple.style.setProperty("--_x", `${x}px`);
  ripple.style.setProperty("--_y", `${y}px`);
  ripple.style.setProperty("--_d", `${2 * Math.hypot(Math.max(x, w - x), Math.max(y, h - y))}px`);
  delete ripple.dataset.state;
  // Reading the style applies the reset, so the transition starts from the press point.
  getComputedStyle(ripple).opacity;
  ripple.dataset.state = "on";
}

// The event type is left open, so a handler of Base UI (whose event has an extra method) fits.
type Handler = ((event: never) => void) | undefined;

interface PointerHandlers {
  onPointerDown?: Handler;
  onPointerUp?: Handler;
  onPointerLeave?: Handler;
  onPointerCancel?: Handler;
}

/**
 * The held attribute and the ripple of a pressable element. Put `ref` on the ripple element and
 * spread the result of `props(handlers)` on the root; the user's handlers run first and can
 * cancel the press with `preventDefault()`.
 */
export function useRipple(): {
  ref: RefObject<HTMLSpanElement | null>;
  props: <H extends PointerHandlers>(handlers: H) => H;
} {
  const ref = useRef<HTMLSpanElement>(null);
  const release = (button: HTMLElement) => {
    button.removeAttribute(HELD);
    if (ref.current?.dataset.state === "on") ref.current.dataset.state = "off";
  };
  const own = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.defaultPrevented || event.button !== 0) return;
      event.currentTarget.setAttribute(HELD, "");
      if (ref.current) startRipple(event.currentTarget, ref.current, event);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => release(event.currentTarget),
    onPointerLeave: (event: PointerEvent<HTMLElement>) => release(event.currentTarget),
    onPointerCancel: (event: PointerEvent<HTMLElement>) => release(event.currentTarget),
  };
  return {
    ref,
    props: (handlers) => mergeProps<"button">(own as never, handlers as never) as never,
  };
}
