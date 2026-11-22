/**
 * The sidebar's current-page marker: a liquid background behind the active item, with a small dot
 * in the gutter. It lives in the scrolling content, so it scrolls with the list.
 *
 * - At rest it is a tinted background plus a dot at the background's start end.
 * - To a new item: the background shrinks into a drop at its start end (the color deepens), the
 *   drop drips to the new item (it pulls away from a remnant on a metaball neck that thins and
 *   snaps, and stretches into a teardrop with speed), lands with a small splat, and spreads out to
 *   fill the new background. The color leaves the dot, which stays.
 * - Every move takes the same time, near or far. A re-pick mid-way changes course, with no remnant.
 * - The shapes are crisp SVG, redrawn by requestAnimationFrame only while moving. The first
 *   placement, a resize, reduced motion and `--ow-motion-scale: 0` jump. Idle runs nothing.
 * - A click on an item moves it there at once, before the page's `active` follows. If `active`
 *   lands elsewhere it follows that; if nothing changes within `PENDING_MS` it goes back.
 * - The item's text styling arrives when the liquid lands: `data-landed` marks that item, and
 *   `data-away` an active item the liquid has left.
 */

export interface Indicator {
  destroy(): void;
}

export const PENDING_MS = 3000;

const ITEM = ".ow-sidebar__link";
const LIST = ".ow-sidebar__list";
const DISABLED = '[data-disabled], [aria-disabled="true"]';
const SVG = "http://www.w3.org/2000/svg";

const D = 14; // the drop
const RD = D / 2;
const BEAD = 3.5; // the dot the drop leaves
const T_SHRINK = 0.16; // seconds
const T_DRIP = 0.3;
const T_FILL = 0.36;
const STRETCH = 0.011; // teardrop length per px/s
const STRETCH_MAX = 13;

/** An item's box in the root's scrolling content: inline coordinates from the start edge. */
interface Place {
  u: number;
  top: number;
  w: number;
  h: number;
  r: number;
  /** The dot's center: the middle of the gutter. */
  c: number;
}

/** The background: the item's row, inset 1px above and below. */
interface Rect {
  u: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

type Phase = "rest" | "shrink" | "drip" | "fill";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIn = (t: number) => t * t * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const backOut = (t: number, s = 1.7) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

type Pt = [number, number];
const f = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

/** The neck between two circles (a metaball bridge, drawn crisp); empty when apart. */
function metaball(r1: number, r2: number, c1: Pt, c2: Pt, spread = 0.5, handle = 2.4): string {
  const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]);
  if (r1 < 0.3 || r2 < 0.3 || d > r1 + r2 * 2.5 || d <= Math.abs(r1 - r2)) return "";
  const half = Math.PI / 2;
  const u1 = d < r1 + r2 ? Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d)) : 0;
  const u2 = d < r1 + r2 ? Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d)) : 0;
  const between = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
  const maxSpread = Math.acos((r1 - r2) / d);
  const a1 = between + u1 + (maxSpread - u1) * spread;
  const a2 = between - u1 - (maxSpread - u1) * spread;
  const a3 = between + Math.PI - u2 - (Math.PI - u2 - maxSpread) * spread;
  const a4 = between - Math.PI + u2 + (Math.PI - u2 - maxSpread) * spread;
  const at = (c: Pt, a: number, r: number): Pt => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  const p1 = at(c1, a1, r1);
  const p2 = at(c1, a2, r1);
  const p3 = at(c2, a3, r2);
  const p4 = at(c2, a4, r2);
  const k =
    Math.min(spread * handle, Math.hypot(p3[0] - p1[0], p3[1] - p1[1]) / (r1 + r2)) *
    Math.min(1, (d * 2) / (r1 + r2));
  const h1 = at(p1, a1 - half, r1 * k);
  const h2 = at(p2, a2 + half, r1 * k);
  const h3 = at(p3, a3 + half, r2 * k);
  const h4 = at(p4, a4 - half, r2 * k);
  return `M${f(p1)}C${f(h1)} ${f(h3)} ${f(p3)}A${r2} ${r2} 0 ${d > r1 ? 1 : 0} 0 ${f(p4)}C${f(h4)} ${f(h2)} ${f(p2)}Z`;
}

/** The outline around two circles on a vertical line (a teardrop, no waist). */
function hull(x: number, y1: number, r1: number, y2: number, r2: number): string {
  const d = Math.abs(y2 - y1);
  if (d <= Math.abs(r1 - r2) + 0.1) return "";
  const base = y2 > y1 ? Math.PI / 2 : -Math.PI / 2;
  const phi = Math.acos((r1 - r2) / d);
  const pt = (y: number, r: number, a: number) =>
    `${(x + r * Math.cos(a)).toFixed(2)} ${(y + r * Math.sin(a)).toFixed(2)}`;
  return `M${pt(y1, r1, base + phi)}L${pt(y2, r2, base + phi)}L${pt(y2, r2, base - phi)}L${pt(y1, r1, base - phi)}Z`;
}

export function createIndicator(root: HTMLElement, pill: HTMLElement): Indicator {
  const shape = (tag: string, name: string) => {
    const el = document.createElementNS(SVG, tag);
    el.setAttribute("class", name);
    return el;
  };
  const svg = shape("svg", "ow-sidebar__liquid");
  svg.setAttribute("width", "1");
  svg.setAttribute("height", "1");
  svg.setAttribute("aria-hidden", "true");
  const neck = shape("path", "ow-sidebar__liquid-part");
  const rem = shape("circle", "ow-sidebar__liquid-part");
  const tail = shape("path", "ow-sidebar__liquid-part");
  const back = shape("circle", "ow-sidebar__liquid-part");
  const body = shape("rect", "ow-sidebar__liquid-part");
  const bead = shape("circle", "ow-sidebar__liquid-dot");
  for (const el of [neck, rem, tail, back, body, bead]) svg.append(el);
  pill.append(svg);

  let rtl = false;
  let at: HTMLElement | null = null; // where the liquid is, or is going
  let landed: HTMLElement | null = null; // the item that shows as active
  let dest: Place | null = null; // `at`'s box now
  let phase: Phase = "rest";
  let t = 0;
  let rect: Rect | null = null; // the background now
  let from: Rect | null = null; // where the shrink started
  let anchor = 0; // the dot's center, inline
  let drip = { y0: 0, y1: 0, rem: true };
  let y = 0; // the drop's center while it drips
  let tailLen = 0;
  let tail0 = 0;
  let dir = 1;
  let mix = 0; // how deep the color is: 0 the background's, 1 the drop's
  let mix0 = 0;
  let beadR = BEAD;
  let raf = 0;
  let last = 0;
  let pending: HTMLElement | null = null;
  let timer = 0;

  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** The time multiplier: --ow-motion-scale, 0 for none. */
  const motion = () => {
    const scale = Number.parseFloat(getComputedStyle(pill).getPropertyValue("--ow-motion-scale"));
    return Number.isFinite(scale) && scale >= 0 ? scale : 1;
  };
  /** Inline coordinate to the SVG's x: the SVG sits at the inline start edge. */
  const X = (u: number) => (rtl ? -u : u);

  function measure(el: HTMLElement): Place | null {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const box = root.getBoundingClientRect();
    const sx = Math.abs(box.width - root.offsetWidth) < 1 ? 1 : box.width / root.offsetWidth;
    const sy = Math.abs(box.height - root.offsetHeight) < 1 ? 1 : box.height / root.offsetHeight;
    rtl = getComputedStyle(root).direction === "rtl";
    const gutter = Number.parseFloat(
      getComputedStyle(el.closest(LIST) ?? el).paddingInlineStart || "0",
    );
    const u = rtl ? (box.right - r.right) / sx : (r.left - box.left) / sx - root.clientLeft;
    return {
      u,
      top: (r.top - box.top) / sy - root.clientTop + root.scrollTop,
      w: r.width / sx,
      h: r.height / sy,
      r: Number.parseFloat(getComputedStyle(el).borderStartStartRadius) || 0,
      c: u + (Number.isFinite(gutter) ? gutter : 0) / 2,
    };
  }

  const bg = (p: Place): Rect => ({ u: p.u, y: p.top + 1, w: p.w, h: p.h - 2, r: p.r });
  const centre = (p: Place) => p.top + p.h / 2;

  /** The item's text styling follows the liquid: `data-landed` on it, `data-away` on a left one. */
  function land(el: HTMLElement | null): void {
    landed = el;
    for (const item of root.querySelectorAll<HTMLElement>(ITEM)) {
      item.toggleAttribute("data-landed", item === el);
      item.toggleAttribute("data-away", item !== el && item.hasAttribute("data-active"));
    }
  }

  function draw(): void {
    const set = (el: Element, name: string, value: string | number) =>
      el.setAttribute(name, typeof value === "number" ? value.toFixed(2) : value);
    // The dot at the background's start end (while it drips, the drop is the dot).
    set(bead, "cx", X(anchor));
    set(bead, "cy", rect ? rect.y + rect.h / 2 : 0);
    set(bead, "r", phase !== "drip" && rect ? beadR : 0);
    // The liquid deepens as it gathers into a drop and pales as it spreads.
    svg.style.setProperty("--_mix", `${(mix * 100).toFixed(1)}%`);
    const hide = () => {
      set(tail, "d", "");
      set(back, "r", 0);
      set(rem, "r", 0);
      set(neck, "d", "");
    };
    // The tail: the drop stretched by its speed (pulled back in as it splats).
    const tailFrom = (cy: number, r1: number) => {
      const r2 = RD * 0.55 * (phase === "fill" && tail0 > 0 ? 0.3 + 0.7 * (tailLen / tail0) : 1);
      const ty = cy - dir * tailLen;
      set(back, "cx", X(anchor));
      set(back, "cy", ty);
      set(back, "r", tailLen > 0.5 ? r2 : 0);
      set(tail, "d", tailLen > 0.5 ? hull(X(anchor), cy, r1, ty, r2) : "");
    };
    if (phase === "drip") {
      set(body, "x", X(anchor) - RD);
      set(body, "y", y - RD);
      set(body, "width", D);
      set(body, "height", D);
      set(body, "rx", RD);
      tailFrom(y, RD);
      // Where it left from: a remnant that holds on by a neck, thins, snaps and draws back.
      const k = clamp01(t / T_DRIP);
      const rr = drip.rem ? RD * 0.85 * (1 - smooth(0.08, 0.62, k)) : 0;
      set(rem, "cx", X(anchor));
      set(rem, "cy", drip.y0);
      set(rem, "r", rr);
      set(neck, "d", rr > 0.4 ? metaball(rr, RD, [X(anchor), drip.y0], [X(anchor), y], 0.55) : "");
      return;
    }
    hide();
    if (!rect) {
      set(body, "width", 0);
      set(body, "height", 0);
      return;
    }
    set(body, "x", rtl ? -(rect.u + rect.w) : rect.u);
    set(body, "y", rect.y);
    set(body, "width", Math.max(0, rect.w));
    set(body, "height", Math.max(0, rect.h));
    set(body, "rx", Math.max(0, Math.min(rect.r, rect.w / 2, rect.h / 2)));
    if (phase === "fill" && tailLen > 0.5)
      tailFrom(rect.y + rect.h / 2, Math.min(rect.h, rect.w) / 2);
  }

  function startDrip(y0: number, withRemnant: boolean): void {
    phase = "drip";
    t = 0;
    drip = { y0, y1: dest ? centre(dest) : y0, rem: withRemnant };
    y = y0;
  }

  /** One step of the motion; true when it has come to rest. */
  function step(dt: number): boolean {
    t += dt;
    if (phase === "shrink" && from) {
      // To a drop at the background's start end.
      const k = clamp01(t / T_SHRINK);
      const cy = from.y + from.h / 2;
      const ew = easeIn(k);
      const eh = easeInOut(k);
      rect = {
        u: lerp(from.u, anchor - RD, eh),
        y: lerp(from.y, cy - RD, eh),
        w: lerp(from.w, D, ew),
        h: lerp(from.h, D, eh),
        r: lerp(from.r, RD, eh),
      };
      // The color gathers late, as it becomes the drop, so the text stays readable.
      mix = lerp(mix0, 1, k ** 4);
      beadR = lerp(BEAD, RD, eh);
      if (k >= 1) {
        if (dest && Math.abs(centre(dest) - cy) > 0.5) startDrip(cy, true);
        else {
          phase = "fill";
          t = 0;
          tail0 = tailLen = 0;
          drip = { y0: cy, y1: cy, rem: false };
        }
      }
    } else if (phase === "drip") {
      const k = clamp01(t / T_DRIP);
      // It lets go slowly, then falls faster and faster (and lands fast).
      y = lerp(drip.y0, drip.y1, k * k);
      const v = ((drip.y1 - drip.y0) * 2 * k) / T_DRIP;
      // The tail trails behind; on a change of course the old one is drawn in before a new one grows.
      const heading = Math.sign(drip.y1 - drip.y0) || 1;
      if (heading !== dir && tailLen > 0.6) tailLen *= Math.max(0, 1 - dt * 30);
      else {
        dir = heading;
        tailLen += (Math.min(STRETCH_MAX, Math.abs(v) * STRETCH) - tailLen) * Math.min(1, dt * 40);
      }
      if (k >= 1) {
        phase = "fill";
        t = 0;
        y = drip.y1;
        tail0 = tailLen;
        land(at);
      }
    }
    if (phase === "fill") {
      // It splats where it lands, then spreads out to fill the background.
      const k = clamp01(t / T_FILL);
      if (dest) {
        const to = bg(dest);
        const splat = smooth(0, 0.07, k) * (1 - smooth(0.07, 0.3, k));
        const w0 = D * (1 + 0.4 * splat);
        const h0 = D * (1 - 0.32 * splat);
        const ew = easeOut(smooth(0.06, 1, k));
        const eh = backOut(smooth(0.1, 1, k));
        const h = lerp(h0, to.h, eh);
        rect = {
          u: lerp(anchor - w0 / 2, to.u, ew),
          y: drip.y1 - h / 2,
          w: lerp(w0, to.w, ew),
          h,
          r: lerp(RD, to.r, ew),
        };
        // The color leaves the dot quickly: the dot keeps the accent.
        mix = 1 - smooth(0.02, 0.5, k);
        beadR = lerp(RD, BEAD, easeOut(smooth(0.04, 0.5, k)));
        tailLen = tail0 * (1 - easeOut(clamp01(k / 0.16)));
        if (landed !== at) land(at);
      }
      if (k >= 1) {
        phase = "rest";
        rect = dest ? bg(dest) : null;
        mix = 0;
        beadR = BEAD;
      }
    }
    draw();
    return phase === "rest";
  }

  const tick = (now: number) => {
    const scale = motion();
    const real = Math.min(0.1, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    // A scale of 0 should not get here; if it changed mid-move, finish at once.
    const done = scale <= 0 ? step(T_SHRINK + T_DRIP + T_FILL) : step(real / scale);
    raf = done ? 0 : requestAnimationFrame(tick);
    if (done) pill.removeAttribute("data-moving");
  };
  function go(): void {
    if (raf) return;
    last = 0;
    pill.setAttribute("data-moving", "");
    raf = requestAnimationFrame(tick);
  }
  function stop(): void {
    cancelAnimationFrame(raf);
    raf = 0;
    pill.removeAttribute("data-moving");
  }

  /** It is simply there: the first placement, a resize, reduced motion. */
  function rest(el: HTMLElement, place: Place): void {
    stop();
    at = el;
    dest = place;
    anchor = place.c;
    phase = "rest";
    rect = bg(place);
    mix = 0;
    beadR = BEAD;
    land(el);
    draw();
  }

  function sync(): void {
    const item = pending ?? root.querySelector<HTMLElement>(`${ITEM}[data-active]`);
    const place = item && measure(item);
    if (!item || !place) {
      stop();
      at = null;
      dest = null;
      rect = null;
      phase = "rest";
      land(null);
      draw();
      pill.removeAttribute("data-visible");
      return;
    }
    pill.setAttribute("data-visible", "");
    if (!at || still() || motion() <= 0) {
      rest(item, place);
      return;
    }
    dest = place;
    if (item === at) {
      // The layout moved (a resize, a late font) or `active` followed the click.
      anchor = place.c;
      if (phase === "rest") {
        rect = bg(place);
        land(item);
        draw();
      } else if (phase === "drip") drip.y1 = centre(place);
      else land(landed);
      return;
    }
    // A new item: shrink from wherever the background is now.
    at = item;
    anchor = place.c;
    if (phase === "rest" || phase === "fill") {
      phase = "shrink";
      t = 0;
      mix0 = mix;
      tail0 = tailLen = 0;
      from = rect ? { ...rect } : null;
      land(null);
    } else if (phase === "drip") {
      // Already falling: change course from where it is (same time again, no remnant).
      startDrip(y, false);
    }
    // (Shrinking: it will drip to the new one when it is a drop.)
    go();
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
      stop();
      mutations.disconnect();
      sizes.disconnect();
      root.removeEventListener("click", onClick);
      svg.remove();
      for (const item of root.querySelectorAll(ITEM)) {
        item.removeAttribute("data-landed");
        item.removeAttribute("data-away");
      }
    },
  };
}
