/**
 * The sidebar's current-page pill: it sits in the gutter beside the active item, inside the
 * scrolling content, and travels to a new item along y.
 *
 * - It rests where layout puts the item (translate), so it scrolls with the list. The first
 *   placement, a resize and reduced motion jump; nothing animates while idle.
 * - It is gooey like the segmented thumb: while it travels, its key (the ::before) stretches from
 *   the leading edge, which arrives with the box and never passes it, and the tail catches up. No
 *   squash, no rebound; only transform and translate move.
 * - A click on an item moves it there at once, before the page's `active` follows. If `active`
 *   lands elsewhere it follows that; if nothing changes within `PENDING_MS` it goes back.
 */

export interface Indicator {
  destroy(): void;
}

export const PENDING_MS = 3000;

const ITEM = ".ow-sidebar__link";
const DISABLED = '[data-disabled], [aria-disabled="true"]';

// The stretch beyond the pill's own size: 0.4 up to 1.4 by distance (in tens of sizes).
const STRETCH_MIN = 0.4;
const STRETCH_MAX = 1.4;
const MS_MIN = 260;
const MS_MAX = 460;

export function createIndicator(root: HTMLElement, pill: HTMLElement): Indicator {
  let on: HTMLElement | null = null;
  let lastY = Number.NaN;
  let lastX = Number.NaN;
  let pending: HTMLElement | null = null;
  let timer = 0;
  let blob: Animation | null = null;
  let blobOrigin = "";

  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** The item's centre from the root's padding edge, in the root's own px, plus its start edge. */
  function measure(el: HTMLElement): { y: number; x: number } | null {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const box = root.getBoundingClientRect();
    const sx = Math.abs(box.width - root.offsetWidth) < 1 ? 1 : box.width / root.offsetWidth;
    const sy = Math.abs(box.height - root.offsetHeight) < 1 ? 1 : box.height / root.offsetHeight;
    const rtl = getComputedStyle(root).direction === "rtl";
    return {
      y: (rect.top + rect.height / 2 - box.top) / sy - root.clientTop + root.scrollTop,
      x: rtl ? (box.right - rect.right) / sx : (rect.left - box.left) / sx - root.clientLeft,
    };
  }

  function currentScale(): number {
    if (!blob) return 1;
    const matrix = getComputedStyle(pill, "::before").transform;
    if (!matrix || matrix === "none") return 1;
    return new DOMMatrixReadOnly(matrix).d;
  }

  function stretch(distance: number, down: boolean, ms: number): void {
    if (typeof pill.animate !== "function" || still()) return;
    const scale = Number.parseFloat(getComputedStyle(pill).getPropertyValue("--ow-motion-scale"));
    const motion = Number.isFinite(scale) ? scale : 1;
    if (motion <= 0) return;
    const amount =
      (STRETCH_MIN +
        (STRETCH_MAX - STRETCH_MIN) * Math.min(1, distance / (pill.offsetHeight * 10))) *
      motion;
    // The leading edge (toward the destination) is fixed; the tail stretches behind and catches up.
    const origin = down ? "50% 100%" : "50% 0%";
    const start = blob && origin === blobOrigin ? currentScale() : 1;
    blob?.cancel();
    blobOrigin = origin;
    const along = (n: number) => `scale(1, ${n})`;
    blob = pill.animate(
      [
        { transform: along(start), offset: 0, easing: "cubic-bezier(0.7, 0, 0.84, 0)" },
        { transform: along(1 + amount), offset: 0.3, easing: "cubic-bezier(0.25, 0, 0.35, 1)" },
        { transform: along(1), offset: 0.65, easing: "ease-out" },
        { transform: along(1), offset: 1 },
      ].map((frame) => ({ ...frame, transformOrigin: origin })),
      { duration: ms, pseudoElement: "::before" },
    );
    const mine = blob;
    mine.onfinish = () => {
      if (blob === mine) blob = null;
    };
  }

  function sync(): void {
    const item = pending ?? root.querySelector<HTMLElement>(`${ITEM}[data-active]`);
    const to = item && measure(item);
    if (!item || !to) {
      on = null;
      lastY = Number.NaN;
      pill.removeAttribute("data-visible");
      return;
    }
    const y = to.y - pill.offsetHeight / 2;
    if (item === on && Math.abs(y - lastY) < 0.01 && Math.abs(to.x - lastX) < 0.01) return;
    const move = on !== null && item !== on && !Number.isNaN(lastY) && !still();
    const distance = Math.abs(y - lastY);
    const ms = MS_MIN + (MS_MAX - MS_MIN) * Math.min(1, distance / 480);
    if (move) pill.style.setProperty("--_ms", String(Math.round(ms)));
    else {
      pill.setAttribute("data-instant", "");
      blob?.cancel();
      blob = null;
    }
    pill.style.setProperty("--_x", `${to.x}px`);
    pill.style.setProperty("--_y", `${y}px`);
    if (!move) {
      void pill.offsetWidth;
      pill.removeAttribute("data-instant");
    } else if (distance >= 1) stretch(distance, y > lastY, ms);
    pill.setAttribute("data-visible", "");
    on = item;
    lastY = y;
    lastX = to.x;
  }

  function settle(): void {
    clearTimeout(timer);
    pending = null;
    sync();
  }

  const onClick = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const item = (event.target as Element).closest<HTMLElement>(ITEM);
    if (!item || !root.contains(item) || item.matches(DISABLED)) return;
    const target = item.getAttribute("target");
    if (target && target !== "_self") return;
    pending = item;
    clearTimeout(timer);
    timer = window.setTimeout(settle, PENDING_MS);
    sync();
  };

  // Resizes (the group, an item, a font that loads late) re-place it.
  const sizes = new ResizeObserver(() => sync());
  const observeSizes = () => {
    sizes.disconnect();
    sizes.observe(root);
    for (const item of root.querySelectorAll(ITEM)) sizes.observe(item);
  };
  const mutations = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList")) observeSizes();
    // The page's own state arrived: follow it.
    if (records.some((record) => record.attributeName === "data-active")) settle();
    else sync();
  });
  mutations.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-active"],
  });
  observeSizes();
  root.addEventListener("click", onClick);
  sync();

  return {
    destroy() {
      clearTimeout(timer);
      blob?.cancel();
      mutations.disconnect();
      sizes.disconnect();
      root.removeEventListener("click", onClick);
    },
  };
}
