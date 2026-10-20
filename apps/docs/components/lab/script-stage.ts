import { animate } from "motion/react";
import type { ScriptStage } from "./types";

const REDUCED = "(prefers-reduced-motion: reduce)";

interface Spot {
  x: number;
  y: number;
}

/** Where a person would aim: a little in from the start of the target, halfway down. */
const aim = (rect: DOMRect): Spot => ({
  x: rect.left + Math.min(rect.width / 2, 44),
  y: rect.top + rect.height / 2,
});

// Runs that hold focus, each with the elements it keeps focus out of (see holdFocus).
const holds = new Set<(el: HTMLElement) => boolean>();
let restoreFocus = () => {};

/**
 * Keeps focus out of the elements `skip` matches until the returned function is called: the
 * demo's answers to a drawn press (Base UI's come a frame or more later) must not take focus from
 * the visitor.
 */
function holdFocus(skip: (el: HTMLElement) => boolean): () => void {
  if (holds.size === 0) {
    const focus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
      for (const held of holds) if (held(this)) return;
      focus.call(this, options);
    };
    restoreFocus = () => {
      HTMLElement.prototype.focus = focus;
    };
  }
  holds.add(skip);
  return () => {
    if (holds.delete(skip) && holds.size === 0) restoreFocus();
  };
}

/**
 * The tools for one run of a scene script. The pointer is drawn by `ghost` and sends real pointer
 * events (untrusted), so hover effects such as Glide react as they would to a person; it clicks
 * with `click()` and drags with `drag()`, both leaving focus alone. Every step rejects once
 * `signal` aborts.
 */
export function createScriptStage(
  body: HTMLElement,
  demo: HTMLElement,
  ghost: HTMLElement,
  signal: AbortSignal,
): ScriptStage & { release: () => void } {
  let at: Spot | null = null;
  let over: Element | null = null;

  // A move by default; a press sends button 0 with buttons 1, a release button 0 alone.
  const fire = (type: string, target: Element, spot: Spot, { button = -1, buttons = 0 } = {}) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: type !== "pointerenter" && type !== "pointerleave",
        cancelable: true,
        composed: true,
        clientX: spot.x,
        clientY: spot.y,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        button,
        buttons,
      }),
    );

  // Focus stays where the visitor left it: out of the demo, and out of popups it portals beside
  // the page's root, for the whole run (see holdFocus).
  const root = [...document.body.children].find((child) => child.contains(body));
  const releaseFocus = holdFocus(
    (el) => demo.contains(el) || (root !== undefined && !root.contains(el)),
  );
  signal.addEventListener("abort", releaseFocus, { once: true });

  // A press. A drawn pointer is no active pointer, so capturing it throws in some browsers
  // (Firefox): captures are skipped while it is sent.
  const press = (target: Element, spot: Spot) => {
    const capture = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function (this: Element, id: number) {
      try {
        capture.call(this, id);
      } catch {
        // Not an active pointer.
      }
    };
    try {
      fire("pointerdown", target, spot, { button: 0, buttons: 1 });
    } finally {
      Element.prototype.setPointerCapture = capture;
    }
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

  // Glides the pointer to `to`, calling `step` on the way and once there.
  const travel = async (to: Spot, step: (spot: Spot) => void) => {
    signal.throwIfAborted();
    if (!at) {
      // The pointer fades in a little below and beside its first target.
      at = { x: to.x + 48, y: to.y + 64 };
      place(at);
      ghost.dataset.on = "";
      await wait(180);
    }
    if (matchMedia(REDUCED).matches) {
      step(to);
      return;
    }
    const from = at;
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const move = animate(0, 1, {
      duration: Math.min(0.75, Math.max(0.3, distance / 480)),
      ease: "easeInOut",
      onUpdate: (t) => step({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }),
    });
    await until(move.finished, () => move.stop());
  };

  const point = async (target: Element): Promise<Spot> => {
    const to = aim(target.getBoundingClientRect());
    await travel(to, moveTo);
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
      press(pressed, spot);
      try {
        await wait(120);
      } finally {
        fire("pointerup", pressed, spot, { button: 0 });
        delete ghost.dataset.down;
      }
      // A mouse's click (detail 1): Base UI treats a detail-0 click as the keyboard's, and skips
      // the animation it would show.
      target.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: 1,
          clientX: spot.x,
          clientY: spot.y,
        }),
      );
    },
    async drag(target, path) {
      const spot = ({ x, y }: Spot): Spot => {
        const box = target.getBoundingClientRect();
        return { x: box.left + x * box.width, y: box.top + y * box.height };
      };
      const [first, ...rest] = path;
      if (!first) return;
      await travel(spot(first), moveTo);
      const pressed = over ?? target;
      ghost.dataset.down = "";
      press(pressed, spot(first));
      try {
        for (const next of rest) {
          await travel(spot(next), (to) => {
            at = to;
            place(to);
            fire("pointermove", pressed, to, { buttons: 1 });
          });
        }
      } finally {
        // Let go even when stopped halfway, so nothing stays pressed.
        fire("pointerup", pressed, at ?? spot(first), { button: 0 });
        delete ghost.dataset.down;
      }
    },
    release() {
      releaseFocus();
      if (at) hover(null, at);
      at = null;
      delete ghost.dataset.on;
      delete ghost.dataset.down;
    },
  };
}
