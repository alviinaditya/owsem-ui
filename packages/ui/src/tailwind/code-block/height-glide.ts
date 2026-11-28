// Generated from components/code-block by scripts/build-tailwind.ts; do not edit.
/**
 * The block's height between two snippets. Switching tabs swaps the panel at once, and a block of
 * another height would make everything under it jump. Instead the root's height eases from the old
 * to the new on the glide spring, clipped while it moves, and the new code fades in. Text is never
 * scaled. Nothing runs on the first render, with reduced motion (the fade stays), or when the
 * motion scale is 0.
 */

import { prefersReducedMotion } from "../lib/reduced-motion";

export interface HeightGlide {
  /** Call after the DOM shows the new snippet, before paint. */
  change(): void;
  destroy(): void;
}

const FADE_MS = 180;
const RISE = 3;

// A CSS time, "400ms" or "0.4s", in ms.
const ms = (time: string) => {
  const n = Number.parseFloat(time);
  return time.trim().endsWith("ms") ? n : n * 1000;
};

const heightOf = (el: HTMLElement) => Number.parseFloat(getComputedStyle(el).height);

export function createHeightGlide(root: HTMLElement, shown: () => HTMLElement | null): HeightGlide {
  let settled = heightOf(root);
  let height: Animation | null = null;
  let fade: Animation | null = null;

  // The height at rest, for the next change to start from.
  const sizes = new ResizeObserver(() => {
    if (!height) settled = heightOf(root);
  });
  sizes.observe(root);

  return {
    change() {
      if (typeof root.animate !== "function") {
        settled = heightOf(root);
        return;
      }
      // Mid-glide it starts from where the height is; at rest, from the last one seen.
      const from = height ? heightOf(root) : settled;
      height?.cancel();
      fade?.cancel();
      height = fade = null;
      const to = heightOf(root);
      settled = to;
      const style = getComputedStyle(root);
      const scale = Number.parseFloat(style.getPropertyValue("--ow-motion-scale"));
      const motion = Number.isFinite(scale) ? scale : 1;
      if (motion <= 0) return;
      const still = prefersReducedMotion();
      const next = shown();
      if (next) {
        const mine = next.animate(
          [
            { opacity: 0, transform: `translateY(${still ? 0 : RISE * motion}px)` },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: FADE_MS,
            easing: style.getPropertyValue("--ow-ease-out").trim() || "ease-out",
          },
        );
        fade = mine;
        mine.onfinish = mine.oncancel = () => {
          if (fade === mine) fade = null;
        };
      }
      if (still || Number.isNaN(from) || Math.abs(from - to) < 0.5) return;
      const duration = ms(style.getPropertyValue("--ow-spring-glide-duration"));
      const mine = root.animate(
        [
          { height: `${from}px`, overflow: "clip" },
          { height: `${to}px`, overflow: "clip" },
        ],
        {
          duration: Number.isFinite(duration) ? duration : 400,
          easing: style.getPropertyValue("--ow-spring-glide").trim() || "ease-out",
        },
      );
      height = mine;
      mine.onfinish = mine.oncancel = () => {
        if (height !== mine) return;
        height = null;
        settled = heightOf(root);
      };
    },
    destroy() {
      sizes.disconnect();
      height?.cancel();
      fade?.cancel();
    },
  };
}
