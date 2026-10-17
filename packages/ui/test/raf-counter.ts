// Idle cost (PRD success metrics): zero rAF callbacks and zero running CSS/WAAPI animations.
// Imported first in setup.ts, before any component or Base UI module.
let calls = 0;
const native = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
  calls++;
  return native(cb);
};

// getAnimations() misses animations that start and end inside the window, so record every start.
const started: string[] = [];
const onStart = (event: Event) => {
  started.push(
    event instanceof AnimationEvent
      ? event.animationName
      : `transition:${(event as TransitionEvent).propertyName}`,
  );
};
document.addEventListener("animationstart", onStart, true);
document.addEventListener("transitionrun", onStart, true);
const nativeAnimate = Element.prototype.animate;
Element.prototype.animate = function (this: Element, ...args: Parameters<Element["animate"]>) {
  started.push("WAAPI");
  return nativeAnimate.apply(this, args);
};

const rafCounter = {
  reset() {
    calls = 0;
  },
  get count() {
    return calls;
  },
};

const nextFrame = () => new Promise<void>((resolve) => native(() => resolve()));
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const running = () =>
  document
    .getAnimations()
    .filter((animation) => animation.playState === "running")
    .map((animation) =>
      animation instanceof CSSAnimation ? animation.animationName : animation.constructor.name,
    );

/** Waits for `quietMs` without rAF calls or running animations; throws after `maxMs`. */
export async function settle({
  quietMs = 100,
  maxMs = 2000,
}: {
  quietMs?: number;
  maxMs?: number;
} = {}): Promise<void> {
  const deadline = performance.now() + maxMs;
  await nextFrame();
  await nextFrame();
  while (performance.now() < deadline) {
    rafCounter.reset();
    await sleep(quietMs);
    if (rafCounter.count === 0 && running().length === 0) return;
  }
  const stillRunning = running();
  throw new Error(
    `rAF or animations did not stop within ${maxMs} ms${stillRunning.length ? `: ${stillRunning.join(", ")}` : ""}`,
  );
}

/** Call after settle(): counts rAF calls and animations running or started during `ms`. */
export async function measureIdle(
  ms = 3000,
): Promise<{ rafCalls: number; runningAnimations: string[] }> {
  rafCounter.reset();
  started.length = 0;
  await sleep(ms);
  return {
    rafCalls: rafCounter.count,
    runningAnimations: [...new Set([...started, ...running()])],
  };
}
