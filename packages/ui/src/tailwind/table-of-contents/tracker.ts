// Generated from components/table-of-contents by scripts/build-tailwind.ts; do not edit.
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
 * - The rail is one SVG path through the links: a vertical run beside each link, at its level's x,
 *   and where two links change level a bend from one x to the other, the same S-curve as Tree Rail
 *   Nav's branches, spanning the end of one link and the start of the next. It is redrawn when the
 *   nav or its content changes size. Right to left, x is measured from the right and the SVG is
 *   mirrored in CSS.
 * - The marker is a second path, the same one, dashed so that only the current link's run shows. It
 *   moves by the dash's start and length through CSS transitions, so it travels along the path,
 *   bends included. Its first placement, and a redraw, are instant.
 * - Everything runs from scroll, resize, and mutation events: no frames while idle.
 */

import { tableOfContentsSlots } from "./table-of-contents-variants";

export interface Tracker {
  destroy(): void;
}

/** Where a link's run lies along the path: its arc length from the start, and its length. */
interface Run {
  from: number;
  len: number;
}

interface Link {
  el: HTMLElement;
  x: number;
  top: number;
  bottom: number;
}

/** The reading line, as a share of the scroll area's height from its top. */
const LINE = 0.3;
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
// The parts are found by their data-slot, never by class.
const LINK = '[data-slot="table-of-contents-link"]';
const RAIL = '[data-slot="table-of-contents-list"][data-depth="1"]';
const NS = "http://www.w3.org/2000/svg";
/** The tallest a bend is: it spans the end of one link and the start of the next, half in each. */
const BEND = 14;

const px = (n: number) => `${n}px`;
const round = (n: number) => Math.round(n * 100) / 100;
const same = (a: Run, b: Run) => Math.abs(a.from - b.from) < 0.01 && Math.abs(a.len - b.len) < 0.01;

// The S-curve of Tree Rail Nav's branches (curve() in tree-rail.ts).
const curve = (x0: number, y0: number, x1: number, y1: number) => {
  const k = (y1 - y0) / 2;
  return `C${x0} ${round(y0 + k)} ${x1} ${round(y1 - k)} ${x1} ${y1}`;
};

/** The length of that curve, by 32 chords. */
function curveLength(x0: number, y0: number, x1: number, y1: number): number {
  const k = (y1 - y0) / 2;
  let length = 0;
  let lx = x0;
  let ly = y0;
  for (let i = 1; i <= 32; i++) {
    const t = i / 32;
    const u = 1 - t;
    const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const x = (a + b) * x0 + (c + d) * x1;
    const y = a * y0 + b * (y0 + k) + c * (y1 - k) + d * y1;
    length += Math.hypot(x - lx, y - ly);
    lx = x;
    ly = y;
  }
  return length;
}

function svgPath(svg: SVGSVGElement, attrs: Record<string, string>): SVGPathElement {
  const path = document.createElementNS(NS, "path");
  for (const [name, value] of Object.entries(attrs)) path.setAttribute(name, value);
  return svg.appendChild(path);
}

/** Wires tracking and the rail to `root`, the nav that holds the links, and its `svg`. */
export function createTracker(root: HTMLElement, svg: SVGSVGElement): Tracker {
  const doc = root.ownerDocument;
  const win = doc.defaultView ?? window;
  let links: HTMLElement[] = [];
  // The targets' scroll area; null for the window.
  let area: HTMLElement | null = null;
  let bound: HTMLElement | Window | null = null;
  let current: HTMLElement | null = null;
  let pinned: HTMLElement | null = null;
  // The marker's paths; the markup stays out of React so redraws never re-render.
  svg.replaceChildren();
  const line = svgPath(svg, { class: tableOfContentsSlots.line });
  const marker = svgPath(svg, {
    class: tableOfContentsSlots.marker,
    "data-slot": "table-of-contents-marker",
  });
  // The path of the rail, and each link's run on it.
  let runs = new Map<HTMLElement, Run>();
  let drawn = "";
  // The link the marker is on, and its run; null while hidden.
  let on: HTMLElement | null = null;
  let last: Run | null = null;
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

  /**
   * Draws the rail through the links and finds each link's run on it. A link's x is its list's
   * inline start edge, moved in by the link's indent; where two links differ in x, a bend takes
   * the end of the first and the start of the second. Returns whether the path changed.
   */
  function measure(): boolean {
    const rtl = getComputedStyle(root).direction === "rtl";
    const width = root.clientWidth;
    // The path's x grows from the inline start, so that right to left the SVG only mirrors.
    const inline = (r: { left: number; right: number }) => (rtl ? width - r.right : r.left);
    // The path is the 1px rail's centre; the marker is wider, and moved over so that the rail is
    // its outer edge.
    const railHalf = (Number.parseFloat(getComputedStyle(line).strokeWidth) || 1) / 2;
    const markHalf = (Number.parseFloat(getComputedStyle(marker).strokeWidth) || 2) / 2;
    const starts = new Map<Element, number>();
    const boxes: {
      el: HTMLElement;
      rail: Element | null;
      start: number;
      top: number;
      h: number;
    }[] = [];
    for (const el of links) {
      const rect = el.getBoundingClientRect();
      if (!rect.height) continue;
      const own = local(rect);
      const rail = el.closest(RAIL);
      const start = inline(own);
      boxes.push({ el, rail, start, top: own.top, h: own.height });
      if (rail) starts.set(rail, Math.min(starts.get(rail) ?? start, start));
    }
    const items: Link[] = boxes.map(({ el, rail, start, top, h }) => {
      const edge = rail ? inline(local(rail.getBoundingClientRect())) : start;
      const indent = rail ? start - (starts.get(rail) ?? start) : 0;
      return { el, x: round(edge + indent + railHalf), top: round(top), bottom: round(top + h) };
    });

    const next = new Map<HTMLElement, Run>();
    let d = "";
    let length = 0;
    let y = 0;
    for (const [i, item] of items.entries()) {
      const after = items[i + 1];
      if (i === 0) {
        d = `M${item.x} ${item.top}`;
        y = item.top;
      } else if (y < item.top) {
        // The way down to a link on the same level as the one above it.
        d += `V${item.top}`;
        length += item.top - y;
        y = item.top;
      }
      const from = length;
      const bend = after && after.x !== item.x;
      const span = bend
        ? Math.min(BEND, (item.bottom - item.top) / 2, (after.bottom - after.top) / 2)
        : 0;
      // The run ends where its bend begins: half of it above the two links' shared edge.
      const end = bend
        ? Math.max(y, (item.bottom + after.top) / 2 - span / 2)
        : Math.max(y, item.bottom);
      d += `V${round(end)}`;
      length += end - y;
      y = end;
      next.set(item.el, { from, len: length - from });
      if (bend) {
        const to = round(end + span);
        d += curve(item.x, round(end), after.x, to);
        length += curveLength(item.x, round(end), after.x, to);
        y = to;
      }
    }
    const changed = d !== drawn;
    drawn = d;
    runs = next;
    line.setAttribute("d", d);
    marker.setAttribute("d", d);
    marker.setAttribute("transform", `translate(${markHalf - railHalf} 0)`);
    return changed;
  }

  /** Puts the marker on the current link's run; `snap` skips the travel. */
  function place(snap = false): void {
    const run = current ? runs.get(current) : undefined;
    if (!current || !run) {
      on = null;
      last = null;
      marker.removeAttribute("data-visible");
      return;
    }
    if (current === on && last && same(run, last)) return;
    // From one link to the next it travels along the path from wherever it is now, mid-flight
    // included: a transition that starts mid-way continues from the value it has.
    const instant = snap || on === null || !placed;
    if (instant) marker.setAttribute("data-instant", "");
    if (!placed) marker.setAttribute("data-visible", "");
    marker.style.setProperty("--_from", px(run.from));
    marker.style.setProperty("--_len", px(run.len));
    if (instant) {
      // Commit the start before transitions come back.
      void getComputedStyle(marker).strokeDashoffset;
      marker.removeAttribute("data-instant");
    }
    // Shown again after no link was current: it fades in where it is.
    marker.setAttribute("data-visible", "");
    placed = true;
    on = current;
    last = run;
  }

  function update(snap = false): void {
    if (pinned && !links.includes(pinned)) pinned = null;
    const next = pinned ?? reading();
    if (next === current) return;
    current?.removeAttribute("aria-current");
    current?.removeAttribute("data-current");
    current = next;
    current?.setAttribute("aria-current", "location");
    current?.setAttribute("data-current", "");
    place(snap);
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

  /** Redraws the rail, and puts the marker where its link now is. */
  function redraw(): void {
    const snap = measure();
    update(snap);
    place(snap);
  }

  const sizes = new ResizeObserver(redraw);

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
    redraw();
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
  measure();
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
      svg.replaceChildren();
    },
  };
}
