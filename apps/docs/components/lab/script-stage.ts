import { animate } from "motion/react";
import type { ScriptStage } from "./types";

const REDUCED = "(prefers-reduced-motion: reduce)";

const MOUSE: Partial<Record<string, string>> = {
  pointerover: "mouseover",
  pointerenter: "mouseenter",
  pointermove: "mousemove",
  pointerdown: "mousedown",
  pointerup: "mouseup",
  pointerout: "mouseout",
  pointerleave: "mouseleave",
};

interface Spot {
  x: number;
  y: number;
}

/** Where a person would aim: a little in from the start of the target, halfway down. */
const aim = (rect: DOMRect): Spot => ({
  x: rect.left + Math.min(rect.width / 2, 44),
  y: rect.top + rect.height / 2,
});

/**
 * The tools for one run of a scene script. The pointer is drawn by `ghost` and sends real pointer
 * and mouse events (untrusted), so hover effects such as Glide and tooltips react as they would to
 * a person; it clicks with `click()`, which leaves focus alone. Every step rejects once `signal`
 * aborts.
 */
export function createScriptStage(
  body: HTMLElement,
  demo: HTMLElement,
  ghost: HTMLElement,
  signal: AbortSignal,
): ScriptStage & { release: () => void } {
  let at: Spot | null = null;
  let over: Element | null = null;

  // `pressed` undefined is a move, true a press, false a release. Each also sends the mouse event
  // a browser sends after it: tooltips listen to those, and menus open on mousedown.
  const fire = (type: string, target: Element, spot: Spot, pressed?: boolean) => {
    const init = {
      bubbles: type !== "pointerenter" && type !== "pointerleave",
      cancelable: true,
      composed: true,
      clientX: spot.x,
      clientY: spot.y,
      button: pressed === undefined ? -1 : 0,
      buttons: pressed ? 1 : 0,
    };
    target.dispatchEvent(
      new PointerEvent(type, { ...init, pointerId: 1, pointerType: "mouse", isPrimary: true }),
    );
    const mouse = MOUSE[type];
    if (mouse) target.dispatchEvent(new MouseEvent(mouse, { ...init, button: 0 }));
  };

  // An element and its ancestors inside the demo, innermost first.
  const chain = (el: Element | null) => {
    const list: Element[] = [];
    for (let node = el; node && demo.contains(node); node = node.parentElement) list.push(node);
    return list;
  };

  // Out of one element and into the next, with the enter and leave events a browser sends.
  const hover = (next: Element | null, spot: Spot) => {
    if (next === over) return;
    const from = chain(over);
    const to = chain(next);
    if (over) fire("pointerout", over, spot);
    for (const el of from) if (!to.includes(el)) fire("pointerleave", el, spot);
    if (next) fire("pointerover", next, spot);
    for (const el of to.reverse()) if (!from.includes(el)) fire("pointerenter", el, spot);
    over = next;
  };

  const place = (spot: Spot) => {
    const box = body.getBoundingClientRect();
    ghost.style.transform = `translate(${(spot.x - box.left).toFixed(1)}px, ${(spot.y - box.top).toFixed(1)}px)`;
  };

  const moveTo = (spot: Spot) => {
    at = spot;
    place(spot);
    const hit = document.elementFromPoint(spot.x, spot.y);
    const next = hit && demo.contains(hit) ? hit : null;
    hover(next, spot);
    if (next) fire("pointermove", next, spot);
  };

  // Settles with `promise`, or rejects as soon as the run is stopped.
  const until = (promise: PromiseLike<unknown>, onStop?: () => void) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        onStop?.();
        reject(signal.reason);
        return;
      }
      const stop = () => {
        onStop?.();
        reject(signal.reason);
      };
      signal.addEventListener("abort", stop, { once: true });
      promise.then(() => {
        signal.removeEventListener("abort", stop);
        resolve();
      });
    });

  const wait = (ms: number) => {
    let timer = 0;
    return until(
      new Promise((resolve) => {
        timer = window.setTimeout(resolve, ms);
      }),
      () => clearTimeout(timer),
    );
  };

  const point = async (target: Element): Promise<Spot> => {
    signal.throwIfAborted();
    const to = aim(target.getBoundingClientRect());
    if (!at) {
      // The pointer fades in a little below and beside its first target.
      at = { x: to.x + 48, y: to.y + 64 };
      place(at);
      ghost.dataset.on = "";
      await wait(180);
    }
    if (matchMedia(REDUCED).matches) {
      moveTo(to);
      return to;
    }
    const from = at;
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const move = animate(0, 1, {
      duration: Math.min(0.75, Math.max(0.3, distance / 480)),
      ease: "easeInOut",
      onUpdate: (t) => moveTo({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }),
    });
    await until(move.finished, () => move.stop());
    return to;
  };

  return {
    get(selector) {
      const el = demo.querySelector<HTMLElement>(selector);
      if (!el) throw new Error(`Scene script: nothing in the demo matches ${selector}.`);
      return el;
    },
    wait,
    async point(target) {
      await point(target);
    },
    async click(target) {
      const spot = await point(target);
      const pressed = over ?? target;
      ghost.dataset.down = "";
      fire("pointerdown", pressed, spot, true);
      try {
        await wait(120);
      } finally {
        fire("pointerup", pressed, spot, false);
        delete ghost.dataset.down;
      }
      (target as HTMLElement).click();
    },
    release() {
      if (at) hover(null, at);
      at = null;
      delete ghost.dataset.on;
      delete ghost.dataset.down;
    },
  };
}
