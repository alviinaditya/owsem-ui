/**
 * The segmented thumb: the raised key under the pressed item of a single-selection group.
 *
 * - It rests where layout puts the pressed item's box, untransformed, so it is painted on the
 *   same pixels as the item; a thumb placed by translate fell between pixels at a fractional
 *   zoom. It slides there by `translate` and `transform` through CSS transitions
 *   (toggle-group.css), which end at none, so it costs no frames once it lands.
 * - Its first placement after mount is instant: nothing sweeps in on load or hydration. After
 *   that, a new pressed item slides it there (FLIP); a resize snaps it.
 * - While the pointer holds an item, the item presses in, and the thumb with it when the item is
 *   the one it sits under. Keys press without it: a keyboard change needs no motion to be felt.
 */

export interface Thumb {
  destroy(): void;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const DISABLED = ':disabled, [aria-disabled="true"], [data-disabled]';
// A quick tap still shows the whole press (DP-4).
const PRESS_MS = 90;

const px = (n: number) => `${n}px`;
const same = (a: Box, b: Box) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.w - b.w), Math.abs(a.h - b.h)) <
  0.01;

/**
 * Wires the thumb to `root`, whose items match `items`; it sits under the one with the `pressed`
 * attribute (Code Block's tabs are `data-active`).
 */
export function createThumb(
  root: HTMLElement,
  thumb: HTMLElement,
  items: string,
  pressed = "data-pressed",
): Thumb {
  // The item the thumb is under, and its box; null while hidden.
  let on: HTMLElement | null = null;
  let last: Box | null = null;
  let placed = false;
  let held: HTMLElement | null = null;
  // Whether the hold started on the thumb's item: a thumb arriving under a held item stays as is.
  let heldThumb = false;
  let heldAt = 0;
  let releaseTimer = 0;

  root.setAttribute("data-thumb", "");

  /**
   * An element's box from the root's padding edge, in the root's own px: a scaled ancestor (the
   * Lab's fitted stage, a dialog growing in) is divided out, and so is the element's press scale.
   * A root that scrolls carries the thumb with its items, so its scroll is added back.
   */
  function measure(el: HTMLElement): Box | null {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const box = root.getBoundingClientRect();
    // offset sizes are whole px: anything under 1px apart is rounding, not a scale.
    const sx = Math.abs(box.width - root.offsetWidth) < 1 ? 1 : box.width / root.offsetWidth;
    const sy = Math.abs(box.height - root.offsetHeight) < 1 ? 1 : box.height / root.offsetHeight;
    const style = getComputedStyle(el);
    const press = Number.parseFloat(style.scale) || 1;
    // The thumb's clear border is the track's padding; the key is what is inside it.
    const inset = el === thumb ? 2 * Number.parseFloat(style.borderTopWidth) : 0;
    const w = rect.width / sx / press - inset;
    const h = rect.height / sy / press - inset;
    return {
      x: (rect.left + rect.width / 2 - box.left) / sx - w / 2 - root.clientLeft + root.scrollLeft,
      y: (rect.top + rect.height / 2 - box.top) / sy - h / 2 - root.clientTop + root.scrollTop,
      w,
      h,
    };
  }

  /** Transforms the thumb, laid out at `box`, about its centre to look like `look`. */
  function draw(box: Box, look: Box): void {
    const style = thumb.style;
    style.setProperty("--_dx", px(look.x + (look.w - box.w) / 2 - box.x));
    style.setProperty("--_dy", px(look.y + (look.h - box.h) / 2 - box.y));
    style.setProperty("--_sx", String(look.w / box.w));
    style.setProperty("--_sy", String(look.h / box.h));
  }

  function updateHeld(): void {
    thumb.toggleAttribute("data-held", heldThumb && held === on);
  }

  function sync(): void {
    const item = root.hasAttribute("data-multiple")
      ? null
      : root.querySelector<HTMLElement>(`${items}[${pressed}]`);
    const to = item && measure(item);
    if (!item || !to) {
      on = null;
      last = null;
      thumb.removeAttribute("data-visible");
      updateHeld();
      return;
    }
    if (item === on && last && same(to, last)) return;
    // From one item to another, it slides from wherever it is now, mid-flight included.
    const from = item !== on && on !== null ? measure(thumb) : null;
    thumb.setAttribute("data-instant", "");
    thumb.style.setProperty("--_x", px(to.x));
    thumb.style.setProperty("--_y", px(to.y));
    thumb.style.setProperty("--_w", px(to.w));
    thumb.style.setProperty("--_h", px(to.h));
    draw(to, from ?? to);
    if (!placed) thumb.setAttribute("data-visible", "");
    // Commit the start before transitions come back.
    void thumb.offsetWidth;
    thumb.removeAttribute("data-instant");
    if (from) draw(to, to);
    // Shown again after none was pressed: it fades in where it is.
    thumb.setAttribute("data-visible", "");
    placed = true;
    on = item;
    last = to;
    updateHeld();
  }

  function hold(item: HTMLElement): void {
    clearTimeout(releaseTimer);
    if (held !== item) held?.removeAttribute("data-held");
    held = item;
    heldThumb = item === on;
    heldAt = performance.now();
    item.setAttribute("data-held", "");
    updateHeld();
  }

  function release(): void {
    if (!held) return;
    clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(
      () => {
        held?.removeAttribute("data-held");
        held = null;
        updateHeld();
      },
      Math.max(0, heldAt + PRESS_MS - performance.now()),
    );
  }

  const onPointerDown = (event: PointerEvent) => {
    const item = (event.target as Element).closest<HTMLElement>(items);
    if (event.button === 0 && item && root.contains(item) && !item.matches(DISABLED)) hold(item);
  };

  // Snaps to its item when anything resizes: the group, an item, a font that loads late.
  const sizes = new ResizeObserver(sync);
  const observeSizes = () => {
    sizes.disconnect();
    sizes.observe(root);
    for (const item of root.querySelectorAll(items)) sizes.observe(item);
  };
  const mutations = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList")) observeSizes();
    sync();
  });
  mutations.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [pressed, "data-multiple"],
  });
  observeSizes();
  root.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  sync();

  return {
    destroy() {
      clearTimeout(releaseTimer);
      mutations.disconnect();
      sizes.disconnect();
      root.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      held?.removeAttribute("data-held");
      root.removeAttribute("data-thumb");
    },
  };
}
