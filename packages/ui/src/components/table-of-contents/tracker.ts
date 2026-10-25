/**
 * Tracking for Table of Contents: which link's section is being read, and the marker beside it.
 * Framework-free; the React parts render the markup.
 *
 * - A link's target is the element whose id its hash names. The current link is the one whose
 *   target is the lowest to have crossed the reading line, 30% down the targets' scroll area (their
 *   nearest scrolling ancestor, or the window). At the very end of the area it is the last link,
 *   since a short last section never reaches the line. Until a target crosses it, none is.
 * - A clicked link stays current until the visitor scrolls by themselves: a wheel, a touch, or a
 *   scroll key.
 * - The marker rests where layout puts the current link's box on the rail, untransformed, and
 *   slides there from where it was by `translate` and `scale` through CSS transitions that end at
 *   none (FLIP, as Toggle Group's thumb). Its first placement is instant.
 * - Everything runs from scroll, resize, and mutation events: no frames while idle.
 */

export interface Tracker {
  destroy(): void;
}

/** Class names of every part (FR-6a). */
export const cls = {
  root: "ow-table-of-contents",
  list: "ow-table-of-contents__list",
  item: "ow-table-of-contents__item",
  link: "ow-table-of-contents__link",
  marker: "ow-table-of-contents__marker",
} as const;

interface Box {
  x: number;
  y: number;
  h: number;
}

/** The reading line, as a share of the scroll area's height from its top. */
const LINE = 0.3;
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
const LINK = `.${cls.link}`;
const RAIL = `.${cls.list}[data-depth="1"]`;

const px = (n: number) => `${n}px`;
const same = (a: Box, b: Box) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.h - b.h)) < 0.01;

/** Wires tracking and the marker to `root`, the nav that holds the links. */
export function createTracker(root: HTMLElement, marker: HTMLElement): Tracker {
  const doc = root.ownerDocument;
  const win = doc.defaultView ?? window;
  let links: HTMLElement[] = [];
  // The targets' scroll area; null for the window.
  let area: HTMLElement | null = null;
  let bound: HTMLElement | Window | null = null;
  let current: HTMLElement | null = null;
  let pinned: HTMLElement | null = null;
  // The link the marker is beside, and its box; null while hidden.
  let on: HTMLElement | null = null;
  let last: Box | null = null;
  let placed = false;

  const targetOf = (link: Element): HTMLElement | null => {
    const href = link.getAttribute("href") ?? "";
    const hash = href.indexOf("#");
    if (hash < 0 || hash === href.length - 1) return null;
    const id = href.slice(hash + 1);
    try {
      return doc.getElementById(decodeURIComponent(id));
    } catch {
      return doc.getElementById(id);
    }
  };

  /** The nearest ancestor that scrolls vertically, or null for the window. */
  const scrollerOf = (el: Element | null): HTMLElement | null => {
    for (let node = el?.parentElement; node; node = node.parentElement) {
      if (node === doc.body || node === doc.documentElement) return null;
      if (/auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) return node;
    }
    return null;
  };

  /** The link whose section is being read, or null. */
  function reading(): HTMLElement | null {
    const scroller = area ?? doc.scrollingElement ?? doc.documentElement;
    const box = area?.getBoundingClientRect();
    const line = box ? box.top + box.height * LINE : doc.documentElement.clientHeight * LINE;
    let found: HTMLElement | null = null;
    let lowest = Number.NEGATIVE_INFINITY;
    let end: HTMLElement | null = null;
    for (const link of links) {
      const rect = targetOf(link)?.getBoundingClientRect();
      // No target, or one that is not rendered.
      if (!rect || (!rect.width && !rect.height)) continue;
      end = link;
      if (rect.top <= line && rect.top > lowest) {
        found = link;
        lowest = rect.top;
      }
    }
    const max = scroller.scrollHeight - scroller.clientHeight;
    return max > 1 && scroller.scrollTop >= max - 1 ? end : found;
  }

  /** A rect from the root's padding edge, in the root's own px (a scaled ancestor divided out). */
  function local(rect: DOMRect): { left: number; right: number; top: number; height: number } {
    const box = root.getBoundingClientRect();
    // offset sizes are whole px: anything under 1px apart is rounding, not a scale.
    const sx = Math.abs(box.width - root.offsetWidth) < 1 ? 1 : box.width / root.offsetWidth;
    const sy = Math.abs(box.height - root.offsetHeight) < 1 ? 1 : box.height / root.offsetHeight;
    return {
      left: (rect.left - box.left) / sx - root.clientLeft,
      right: (rect.right - box.left) / sx - root.clientLeft,
      top: (rect.top - box.top) / sy - root.clientTop,
      height: rect.height / sy,
    };
  }

  /** Where the marker rests beside `link`: on the rail at its list's inline start, as tall as it. */
  function boxOf(link: HTMLElement): Box | null {
    const rect = link.getBoundingClientRect();
    if (!rect.height) return null;
    const list = link.closest<HTMLElement>(RAIL) ?? link;
    const rail = local(list.getBoundingClientRect());
    const own = local(rect);
    const rtl = getComputedStyle(list).direction === "rtl";
    return {
      x: rtl ? rail.right - marker.offsetWidth : rail.left,
      y: own.top,
      h: own.height,
    };
  }

  /** Transforms the marker, laid out at `box`, about its centre to look like `look`. */
  function draw(box: Box, look: Box): void {
    const style = marker.style;
    style.setProperty("--_dx", px(look.x - box.x));
    style.setProperty("--_dy", px(look.y + look.h / 2 - (box.y + box.h / 2)));
    style.setProperty("--_sy", String(look.h / box.h));
  }

  function place(): void {
    const to = current && boxOf(current);
    if (!current || !to) {
      on = null;
      last = null;
      marker.removeAttribute("data-visible");
      return;
    }
    if (current === on && last && same(to, last)) return;
    // From one link to the next, it slides from wherever it is now, mid-flight included.
    let from: Box | null = null;
    if (current !== on && on !== null) {
      const now = local(marker.getBoundingClientRect());
      from = { x: now.left, y: now.top, h: now.height };
    }
    marker.setAttribute("data-instant", "");
    marker.style.setProperty("--_x", px(to.x));
    marker.style.setProperty("--_y", px(to.y));
    marker.style.setProperty("--_h", px(to.h));
    draw(to, from ?? to);
    if (!placed) marker.setAttribute("data-visible", "");
    // Commit the start before transitions come back.
    void marker.offsetWidth;
    marker.removeAttribute("data-instant");
    if (from) draw(to, to);
    // Shown again after no link was current: it fades in where it is.
    marker.setAttribute("data-visible", "");
    placed = true;
    on = current;
    last = to;
  }

  function update(): void {
    if (pinned && !links.includes(pinned)) pinned = null;
    const next = pinned ?? reading();
    if (next === current) return;
    current?.removeAttribute("aria-current");
    current?.removeAttribute("data-current");
    current = next;
    current?.setAttribute("aria-current", "location");
    current?.setAttribute("data-current", "");
    place();
  }

  const onScroll = () => update();
  // The visitor scrolls by themselves: the reading line decides again.
  const release = (event: Event) => {
    if (!pinned) return;
    if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) return;
    pinned = null;
    update();
  };
  const onClick = (event: MouseEvent) => {
    // A click that opens a new tab or window leaves this page where it is.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLElement>(LINK) : null;
    if (!link || !root.contains(link)) return;
    pinned = link;
    update();
  };

  const sizes = new ResizeObserver(() => {
    update();
    place();
  });

  function unbind(): void {
    bound?.removeEventListener("scroll", onScroll);
    bound?.removeEventListener("wheel", release);
    bound?.removeEventListener("touchstart", release);
    bound = null;
  }

  /** Reads the links, and listens to their targets' scroll area. */
  function collect(): void {
    links = [...root.querySelectorAll<HTMLElement>(LINK)];
    let first: HTMLElement | null = null;
    for (const link of links) {
      first = targetOf(link);
      if (first) break;
    }
    area = scrollerOf(first);
    const next = area ?? win;
    if (next !== bound) {
      unbind();
      next.addEventListener("scroll", onScroll, { passive: true });
      next.addEventListener("wheel", release, { passive: true });
      next.addEventListener("touchstart", release, { passive: true });
      bound = next;
    }
    sizes.disconnect();
    sizes.observe(root);
    sizes.observe(area ?? doc.documentElement);
  }

  const mutations = new MutationObserver(() => {
    collect();
    update();
    place();
  });
  mutations.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["href"],
  });

  root.addEventListener("click", onClick);
  win.addEventListener("keydown", release);
  win.addEventListener("resize", onScroll);
  collect();
  update();

  return {
    destroy() {
      mutations.disconnect();
      sizes.disconnect();
      unbind();
      root.removeEventListener("click", onClick);
      win.removeEventListener("keydown", release);
      win.removeEventListener("resize", onScroll);
      current?.removeAttribute("aria-current");
      current?.removeAttribute("data-current");
      marker.removeAttribute("data-visible");
      marker.removeAttribute("style");
    },
  };
}
