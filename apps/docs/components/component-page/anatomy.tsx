"use client";

import { Popover } from "owsem-ui/base";
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type Dictionary, format } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { withPrefix } from "@/lib/token-setup";
import { useTokenSetup } from "../token-setup";
import { readable } from "./readable";
import type { Part } from "./types";

/** How long the overlay stays after Inspect is turned off: the specimen's glide back. */
export const ANATOMY_LEAVE_MS = 340;

/** Below this preview width the sheet keeps part names, height, and padding only. */
const NARROW_WIDTH = 768;
const EDGE = 12;
/** Room kept free at the bottom when the page has no picker. */
const BOTTOM = 64;
/** Gap kept between the sheet and the preview bar above it, and the picker below it. */
const CLEAR = 12;
/** Free height under which the summary goes, and under which the header goes. */
const TIGHT = 320;
const VERY_TIGHT = 220;
const LABEL_H = 24;
const TAG_H = 18;
const ROW = 32;
const HEADER_H = 44;
/** The sheet draws in once. */
const REVEAL_MS = 1000;
/** The specimen's glide between the demo's instance and the middle, both ways. */
const GLIDE_MS = 320;
/** The cross-fade between the demo's instance and the specimen. */
const FADE_MS = 150;
/** Where the specimen starts or ends when the example has no instance to come from. */
const POP = 0.85;
const MAX_ZOOM = 4;

interface R {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Tone = "padding" | "gap" | "measure" | "size";

interface Tag extends R {
  key: string;
  tone: Tone;
  text: string;
}

interface Line {
  key: string;
  tone: Tone;
  d: string;
  /** Extension lines are dotted and fainter. */
  ext?: boolean;
}

interface Label extends R {
  name: string;
  /** The outline the name points at (the root's, for a part that covers it). */
  target: string;
  /** The dot on the part's outline, and the leader to the label. */
  dot: { x: number; y: number };
  leader: string;
}

type Seg = [number, number, number, number];

const cross2 = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number =>
  (by - ay) * (cx - ax) - (cy - ay) * (bx - ax);

/** Distance from a point to a segment. */
function pointSeg(x: number, y: number, [x1, y1, x2, y2]: Seg): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len)) : 0;
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

/** Two leaders cross, touch, or run along each other (closer than `gap`). */
function segsClash(a: Seg, b: Seg, gap = 4): boolean {
  const d1 = cross2(a[0], a[1], a[2], a[3], b[0], b[1]);
  const d2 = cross2(a[0], a[1], a[2], a[3], b[2], b[3]);
  const d3 = cross2(b[0], b[1], b[2], b[3], a[0], a[1]);
  const d4 = cross2(b[0], b[1], b[2], b[3], a[2], a[3]);
  if (d1 * d2 < 0 && d3 * d4 < 0) return true;
  return (
    pointSeg(a[0], a[1], b) < gap ||
    pointSeg(a[2], a[3], b) < gap ||
    pointSeg(b[0], b[1], a) < gap ||
    pointSeg(b[2], b[3], a) < gap
  );
}

/** A segment passes through the inside of a box (shrunk by `inset`). */
function segHitsBox([x1, y1, x2, y2]: Seg, r: R, inset = 2): boolean {
  const l = r.x + inset;
  const t = r.y + inset;
  const rt = r.x + r.w - inset;
  const b = r.y + r.h - inset;
  if (rt <= l || b <= t) return false;
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  for (const [p, q] of [
    [-dx, x1 - l],
    [dx, rt - x1],
    [-dy, y1 - t],
    [dy, b - y1],
  ] as [number, number][]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const u = q / p;
      if (p < 0) t0 = Math.max(t0, u);
      else t1 = Math.min(t1, u);
      if (t0 > t1) return false;
    }
  }
  return true;
}

const within = (outer: R, inner: R, tol: number): boolean =>
  outer.x <= inner.x + tol &&
  outer.y <= inner.y + tol &&
  outer.x + outer.w >= inner.x + inner.w - tol &&
  outer.y + outer.h >= inner.y + inner.h - tol;

/** The pixel-grid edges the outline rect is drawn on. */
function edges(r: R) {
  const l = Math.round(r.x) + 0.5;
  const t = Math.round(r.y) + 0.5;
  return {
    l,
    t,
    r: l + Math.max(0, Math.round(r.w) - 1),
    b: t + Math.max(0, Math.round(r.h) - 1),
  };
}

const pathOf = (points: [number, number][]): string =>
  points.map(([x, y], i) => `${i ? "L" : "M"}${fmt(x)} ${fmt(y)}`).join("");

/** Pulls sorted positions apart to a minimum gap, keeping their order, inside [lo, hi]. */
function spread(ys: number[], gap: number, lo: number, hi: number): number[] {
  const out = [...ys];
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 1; i < out.length; i++) {
      const d = (out[i - 1] as number) + gap - (out[i] as number);
      if (d > 0.01) {
        out[i - 1] = (out[i - 1] as number) - d / 2;
        out[i] = (out[i] as number) + d / 2;
        moved = true;
      }
    }
    for (let i = 0; i < out.length; i++) out[i] = Math.max(lo, Math.min(hi, out[i] as number));
    if (!moved) break;
  }
  return out;
}

interface Facts {
  height: number;
  width: number;
  pad: [number, number, number, number];
  radius: number;
  gap: number | null;
}

interface Model {
  width: number;
  height: number;
  root: R;
  radius: number;
  tints: (R & { tone: "padding" | "gap" })[];
  outlines: (R & { radius: number; name: string })[];
  lines: Line[];
  tags: Tag[];
  labels: Label[];
  header: { x: number; y: number; w: number; mode: "full" | "title" | "none" };
  facts: Facts;
  values: string[];
}

/** Where the specimen goes: a translate and scale (the CSS properties, not transform). */
interface Plan {
  tx: number;
  ty: number;
  k: number;
}

const fmt = (n: number): string => String(Math.round(n * 10) / 10);
const px = (value: string): number => Number.parseFloat(value) || 0;
/** A coordinate on the pixel grid's middle, so a 1px line stays crisp. */
const crisp = (n: number): number => Math.round(n) + 0.5;
const hit = (a: R, b: R, pad = 0): boolean =>
  a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const reduced = (): boolean => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A corner radius in CSS px: a length, or a share of the box. */
function radiusOf(style: CSSStyleDeclaration, w: number, h: number): number {
  const value = style.borderTopLeftRadius.split(" ")[0] ?? "0";
  const n = px(value);
  const r = value.endsWith("%") ? (n / 100) * Math.min(w, h) : n;
  return Math.min(r, w / 2, h / 2);
}

function easingOf(body: HTMLElement): string {
  return (
    getComputedStyle(body).getPropertyValue("--ow-spring-glide").trim() ||
    "cubic-bezier(0.2, 0.7, 0.2, 1)"
  );
}

const pairOf = (value: string): number[] =>
  value === "none" ? [] : value.split(" ").map((v) => Number.parseFloat(v));

const cancelAll = (el: HTMLElement, id: string) => {
  for (const animation of el.getAnimations()) if (animation.id === id) animation.cancel();
};

/** Moves the specimen to a plan from where it is now: the `translate` and `scale` properties. */
function glideTo(el: HTMLElement, plan: Plan, ms: number, easing: string) {
  const style = getComputedStyle(el);
  const from = { translate: style.translate, scale: style.scale };
  cancelAll(el, "sp-glide");
  const to = {
    translate: `${plan.tx.toFixed(2)}px ${plan.ty.toFixed(2)}px`,
    scale: String(plan.k),
  };
  el.style.translate = to.translate;
  el.style.scale = to.scale;
  if (ms <= 0 || reduced()) return;
  el.animate([from, to], { duration: ms, easing }).id = "sp-glide";
}

/** Sets the plan with no motion, before the first paint. */
function place(el: HTMLElement, plan: Plan) {
  cancelAll(el, "sp-glide");
  el.style.translate = `${plan.tx.toFixed(2)}px ${plan.ty.toFixed(2)}px`;
  el.style.scale = String(plan.k);
}

/** Cross-fades the specimen in (a faint grey wireframe) or out (back to colour as it lands). */
function fade(
  el: HTMLElement,
  to: "in" | "out",
  delay = 0,
  from?: { opacity: string; filter: string },
) {
  const style = getComputedStyle(el);
  const start = from ?? { opacity: style.opacity, filter: style.filter };
  cancelAll(el, "sp-fade");
  const end =
    to === "in"
      ? { opacity: "0.5", filter: "grayscale(1)" }
      : { opacity: "0", filter: "grayscale(0)" };
  el.style.opacity = end.opacity;
  el.style.filter = end.filter;
  el.animate([start, end], { duration: FADE_MS, delay, easing: "ease", fill: "backwards" }).id =
    "sp-fade";
}

const scaleOf = (el: HTMLElement): number => pairOf(getComputedStyle(el).scale)[0] ?? 1;

/**
 * The plan that puts the root's centre at `point` (in the preview's coordinates) at scale `k`:
 * the specimen scales about its own centre, so the root's offset from it scales too.
 */
function planAt(wrap: HTMLElement, root: HTMLElement, point: { x: number; y: number }, k: number) {
  const k0 = scaleOf(wrap);
  const w = wrap.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  const dx = (r.left + r.width / 2 - (w.left + w.width / 2)) / k0;
  const dy = (r.top + r.height / 2 - (w.top + w.height / 2)) / k0;
  return {
    tx: point.x - (wrap.offsetLeft + wrap.offsetWidth / 2) - dx * k,
    ty: point.y - (wrap.offsetTop + wrap.offsetHeight / 2) - dy * k,
    k,
  };
}

/**
 * The box the specimen leaves and returns to: the demo's first instance of the root part, else
 * (the demo shows only a trigger, or no wrapper) what the demo shows, so it always lands on
 * something real.
 */
function originOf(demo: HTMLElement, body: HTMLElement, selector: string) {
  const box = body.getBoundingClientRect();
  const found = (r: DOMRect) => ({
    x: r.left - box.left + r.width / 2,
    y: r.top - box.top + r.height / 2,
    w: r.width,
    h: r.height,
  });
  for (const el of demo.querySelectorAll<HTMLElement>(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return found(r);
  }
  let left = Number.POSITIVE_INFINITY;
  let top = left;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = right;
  const stack = [...(demo.querySelector(".cp-demo")?.children ?? [])];
  for (const el of stack) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    } else stack.push(...el.children);
  }
  return right > left ? found(new DOMRect(left, top, right - left, bottom - top)) : null;
}

/** The scale at which the specimen's root fits inside the origin box (never larger than it). */
function fitScale(origin: { w: number; h: number }, root: DOMRect, k0: number) {
  return Math.min(origin.w / (root.width / k0), origin.h / (root.height / k0));
}

interface Env {
  body: HTMLElement;
  /** The specimen's wrapper in the overlay. */
  wrap: HTMLElement;
  parts: readonly Part[];
  openPart: string | null;
  charWidth: number;
  probe: HTMLElement;
}

interface Measured {
  model: Model;
  plan: Plan;
  /** Where the specimen's root centre rests, in the preview's coordinates. */
  goal: { x: number; y: number };
}

/**
 * Plans the specimen's move to the middle of the preview, and lays out its spec sheet as it will
 * stand there. Everything is measured from the DOM, so it is true to what is on screen: the
 * measured boxes are mapped from where the specimen is now to where it is going.
 */
function measure(env: Env): Measured | null {
  const { body, wrap, parts, charWidth } = env;
  const root0 = parts[0];
  if (!root0) return null;
  const root = wrap.querySelector<HTMLElement>(root0.selector);
  if (!root) return null;
  if (!root.getBoundingClientRect().width) return null;

  const bodyBox = body.getBoundingClientRect();
  const W = bodyBox.width;
  const H = bodyBox.height;
  const narrow = W < NARROW_WIDTH;
  const left = EDGE;
  const right = W - EDGE;
  // The free area: under the preview bar and above the picker (which sits above an open sheet).
  const barEl = body.parentElement?.querySelector<HTMLElement>(".cp-bar");
  const pickerEl = body.parentElement?.querySelector<HTMLElement>(".cp-picker");
  const barBottom = barEl
    ? Math.max(...[...barEl.children].map((c) => c.getBoundingClientRect().bottom)) - bodyBox.top
    : 0;
  const top0 = Math.max(0, Math.round(barBottom + CLEAR));
  const bottom = pickerEl
    ? Math.round(pickerEl.getBoundingClientRect().top - bodyBox.top - CLEAR)
    : H - BOTTOM;
  const free = bottom - top0;
  const tight = free < TIGHT;
  const veryTight = free < VERY_TIGHT;
  // Dimensions beyond height and padding need a wide, tall sheet.
  const dense = !narrow && !tight;
  const headerMode: Model["header"]["mode"] = veryTight ? "none" : tight ? "title" : "full";
  const headerH = headerMode === "full" ? HEADER_H : 26;
  // Short or narrow: the header owns the strip under the bar and the sheet takes what is left.
  const reserve = narrow || tight;
  const top = reserve && headerMode !== "none" ? top0 + headerH + 8 : top0;
  const visW = right + EDGE - left;
  const visH = bottom - top;

  // Where the specimen is now (it may be mid-glide), and where it is going.
  const style = getComputedStyle(root);
  const k0 = scaleOf(wrap);
  const cur = root.getBoundingClientRect();
  const now: R = {
    x: cur.left - bodyBox.left,
    y: cur.top - bodyBox.top,
    w: cur.width,
    h: cur.height,
  };
  const centre = { x: now.x + now.w / 2, y: now.y + now.h / 2 };
  const natural = { w: now.w / k0, h: now.h / k0 };
  const frac = narrow ? 0.22 : 0.3;

  // Parts that sit one above another take their names in a column beside the specimen; parts in
  // a row, above and below. Judged by which direction has clear lines out of the parts.
  const flat = (el: Element): R => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };
  const everyEl = new Set<HTMLElement>();
  for (const p of parts.slice(1)) {
    for (const el of wrap.querySelectorAll<HTMLElement>(p.selector))
      if (el !== root) everyEl.add(el);
  }
  const everyBox = [...everyEl]
    .map((el) => ({ el, r: flat(el) }))
    .filter(({ r }) => r.w > 0 && r.h > 0);
  const own = parts
    .slice(1)
    .map((p) => wrap.querySelector<HTMLElement>(p.selector))
    .filter((el): el is HTMLElement => !!el && el !== root)
    .map((el) => ({ el, r: flat(el) }))
    .filter(({ r }) => r.w > 0 && r.h > 0)
    .filter(({ r }) => Math.abs(r.w - cur.width) > 4 || Math.abs(r.h - cur.height) > 4);
  let sideClear = 0;
  let rowClear = 0;
  for (const { el, r } of own) {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const rest = everyBox.filter(
      (o) => o.el !== el && !within(o.r, r, 1.5) && !within(r, o.r, 1.5),
    );
    const free = (test: (o: R) => boolean) => !rest.some((o) => test(o.r));
    const rowHit = (o: R) => o.y < cy && o.y + o.h > cy;
    const colHit = (o: R) => o.x < cx && o.x + o.w > cx;
    if (
      free((o) => rowHit(o) && o.x + o.w > r.x + r.w + 1) ||
      free((o) => rowHit(o) && o.x < r.x - 1)
    ) {
      sideClear++;
    }
    if (
      free((o) => colHit(o) && o.y + o.h > r.y + r.h + 1) ||
      free((o) => colHit(o) && o.y < r.y - 1)
    ) {
      rowClear++;
    }
  }
  const hull = (axis: "x" | "y") => {
    const lo = Math.min(...own.map(({ r }) => (axis === "x" ? r.x : r.y)));
    const hi = Math.max(...own.map(({ r }) => (axis === "x" ? r.x + r.w : r.y + r.h)));
    return hi - lo;
  };
  const stacked =
    own.length >= 2 &&
    (sideClear !== rowClear ? sideClear > rowClear : hull("y") > hull("x") * 0.7);
  const nameW = Math.max(0, ...parts.map((p) => Math.ceil(p.name.length * charWidth) + 22));
  const RUN = narrow ? 40 : 46;
  const bothSides = stacked && parts.length * (LABEL_H + 6) > (bottom - top) * 0.9;
  const rightRes = nameW + RUN;
  // On a phone the names take what the specimen leaves; its height stays in the header.
  const leftRes = bothSides ? rightRes : narrow ? 0 : 72;
  const zoom = (side: boolean) => {
    const room = side ? visW - leftRes - rightRes : visW;
    return Math.max(
      side && narrow ? 0.45 : 1,
      Math.min(
        MAX_ZOOM,
        Math.min(frac * visH, narrow ? 96 : 160) / natural.h,
        Math.min((narrow ? 0.6 : 0.5) * visW, room) / natural.w,
      ),
    );
  };
  const sideFits = stacked && natural.w * zoom(true) <= visW - leftRes - rightRes + 1;
  const sideMode = sideFits;
  const k = zoom(sideMode);
  const goal = {
    x: sideMode ? left + leftRes + (visW - leftRes - rightRes) / 2 : W / 2,
    y: top + visH / 2,
  };
  const plan = planAt(wrap, root, goal, k);
  const m = k / k0;
  const s = k;
  const map = (r: R): R => ({
    x: goal.x + (r.x - centre.x) * m,
    y: goal.y + (r.y - centre.y) * m,
    w: r.w * m,
    h: r.h * m,
  });
  const rel = (el: Element | Range): R => {
    const r = el.getBoundingClientRect();
    return map({ x: r.left - bodyBox.left, y: r.top - bodyBox.top, w: r.width, h: r.height });
  };
  const rr = map(now);

  const pad: Facts["pad"] = [
    px(style.paddingTop),
    px(style.paddingRight),
    px(style.paddingBottom),
    px(style.paddingLeft),
  ];
  const [pt, pr, pb, pl] = pad.map((v) => v * s) as [number, number, number, number];
  let radius = radiusOf(style, rr.w / s, rr.h / s);
  if (!radius) radius = radiusOf(getComputedStyle(root, "::before"), rr.w / s, rr.h / s);

  const reserved: R[] = [];
  const tags: Tag[] = [];
  const lines: Line[] = [];
  const tint: Model["tints"] = [];
  const tagWidth = (text: string) => Math.ceil(text.length * charWidth) + 10;
  /**
   * Puts a tag at the first candidate centre inside the sheet and clear of the others (and of the
   * demo's own text, outside the box); a candidate may carry the leader that joins it to its line.
   */
  const addTag = (
    key: string,
    tone: Tone,
    text: string,
    spots: [number, number, string?][],
  ): boolean => {
    const w = tagWidth(text);
    for (const [cx, cy, leader] of spots) {
      const rect = { x: Math.round(cx - w / 2), y: Math.round(cy - TAG_H / 2), w, h: TAG_H };
      if (
        rect.x < left ||
        rect.x + rect.w > right + EDGE ||
        rect.y < (reserve ? top : 4) ||
        rect.y + rect.h > (reserve ? bottom : H - 4)
      ) {
        continue;
      }
      if (reserved.some((other) => hit(rect, other, 1))) continue;
      reserved.push(rect);
      tags.push({ key, tone, text, ...rect });
      if (leader) {
        lines.push({ key: `${key}-lead`, tone, ext: true, d: leader });
        const n = [...leader.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
        const [x0 = 0, y0 = 0] = n;
        const horizontal = leader.includes("H");
        const end = n[2] ?? 0;
        reserved.push(
          horizontal
            ? { x: Math.min(x0, end), y: y0 - 1, w: Math.abs(end - x0), h: 2 }
            : { x: x0 - 1, y: Math.min(y0, end), w: 2, h: Math.abs(end - y0) },
        );
      }
      return true;
    }
    return false;
  };
  /** A dimension line with end ticks, along one axis. */
  const dimension = (key: string, tone: Tone, a: [number, number], b: [number, number]): void => {
    const horizontal = a[1] === b[1];
    const [ax, ay] = [crisp(a[0]), crisp(a[1])];
    const [bx, by] = [crisp(b[0]), crisp(b[1])];
    const tick = horizontal
      ? `M${ax} ${ay - 4.5}V${ay + 4.5}M${bx} ${by - 4.5}V${by + 4.5}`
      : `M${ax - 4.5} ${ay}H${ax + 4.5}M${bx - 4.5} ${by}H${bx + 4.5}`;
    lines.push({ key, tone, d: `M${ax} ${ay}L${bx} ${by}${tick}` });
  };

  // Height on the side with room; the radius marker takes the other top corner.
  let heightSide: "left" | "right" | null = null;
  const hLabel = `h ${fmt(rr.h / s)}`;
  const hx = Math.round(rr.x - 22);
  const hxr = Math.round(rr.x + rr.w + 22);
  const hw = tagWidth(hLabel);
  // With the names in a column on the right, the height stays on the left (and goes when both
  // sides carry names; the header still gives it).
  if (
    !bothSides &&
    !(sideMode && narrow) &&
    addTag("height", "measure", hLabel, [[hx - 6 - hw / 2, rr.y + rr.h / 2]])
  ) {
    heightSide = "left";
  } else if (
    !sideMode &&
    addTag("height", "measure", hLabel, [[hxr + 6 + hw / 2, rr.y + rr.h / 2]])
  ) {
    heightSide = "right";
  }
  if (heightSide) {
    const x = heightSide === "left" ? hx : hxr;
    const edgeX = heightSide === "left" ? rr.x : rr.x + rr.w;
    dimension("height", "measure", [x, rr.y], [x, rr.y + rr.h]);
    const toward = heightSide === "left" ? 1 : -1;
    lines.push({
      key: "height-ext",
      tone: "measure",
      ext: true,
      d: `M${crisp(edgeX - toward * 3)} ${crisp(rr.y)}H${crisp(x + toward * 6)}M${crisp(edgeX - toward * 3)} ${crisp(rr.y + rr.h)}H${crisp(x + toward * 6)}`,
    });
  }

  // Parts in the specimen.
  interface Found {
    part: Part;
    el: HTMLElement;
    box: R;
    cover: boolean;
    isRoot: boolean;
  }
  const found: Found[] = [];
  for (const [i, part] of parts.entries()) {
    const el =
      i === 0
        ? root
        : root.matches(part.selector)
          ? root
          : root.querySelector<HTMLElement>(part.selector);
    if (!el) continue;
    const box = i === 0 ? rr : rel(el);
    if (box.w <= 0 || box.h <= 0) continue;
    const cover =
      i > 0 &&
      Math.abs(box.x - rr.x) <= 2 &&
      Math.abs(box.y - rr.y) <= 2 &&
      Math.abs(box.w - rr.w) <= 4 &&
      Math.abs(box.h - rr.h) <= 4;
    found.push({ part, el, box, cover, isRoot: i === 0 });
  }

  // Root width, and the size of parts that ask for it, below the specimen.
  let belowEdge = rr.y + rr.h;
  const sized = !dense ? [] : found.filter((f) => f.part.size && !f.cover && !f.isRoot);
  if (dense && sized.length) {
    const y = Math.round(rr.y + rr.h + 26);
    if (y + 12 < bottom) {
      for (const f of sized) {
        const text = `${fmt(f.box.w / s)}×${fmt(f.box.h / s)}`;
        const tw = tagWidth(text);
        const spots: [number, number][] = [
          [f.box.x + f.box.w + 8 + tw / 2, y],
          [f.box.x - 8 - tw / 2, y],
        ];
        const ok = addTag(`size-${f.part.name}`, "size", text, sideMode ? spots.reverse() : spots);
        if (!ok) continue;
        dimension(`size-${f.part.name}`, "size", [f.box.x, y], [f.box.x + f.box.w, y]);
        lines.push({
          key: `size-ext-${f.part.name}`,
          tone: "size",
          ext: true,
          d: `M${crisp(f.box.x)} ${crisp(f.box.y + f.box.h + 2)}V${crisp(y - 5)}M${crisp(f.box.x + f.box.w)} ${crisp(f.box.y + f.box.h + 2)}V${crisp(y - 5)}`,
        });
        belowEdge = Math.max(belowEdge, y + 9);
      }
    }
  }
  if (dense) {
    const y = Math.round(belowEdge + (belowEdge > rr.y + rr.h ? 28 : 26));
    const text = `w ${fmt(rr.w / s)}`;
    const tw = tagWidth(text);
    if (
      y + 12 < bottom &&
      addTag(
        "width",
        "measure",
        text,
        sideMode
          ? [
              [rr.x - 8 - tw / 2, y],
              [rr.x + rr.w + 8 + tw / 2, y],
            ]
          : [
              [rr.x + rr.w + 8 + tw / 2, y],
              [rr.x - 8 - tw / 2, y],
            ],
      )
    ) {
      dimension("width", "measure", [rr.x, y], [rr.x + rr.w, y]);
      lines.push({
        key: "width-ext",
        tone: "measure",
        ext: true,
        d: `M${crisp(rr.x)} ${crisp(rr.y + rr.h + 3)}V${crisp(y - 5)}M${crisp(rr.x + rr.w)} ${crisp(rr.y + rr.h + 3)}V${crisp(y - 5)}`,
      });
      belowEdge = Math.max(belowEdge, y + 9);
    }
  }

  // The radius marker on a top corner: a line out from the arc, with its value.
  if (dense && radius >= 2) {
    const r = radius * s;
    const sides: ("left" | "right")[] = sideMode
      ? ["left"]
      : heightSide === "right"
        ? ["left", "right"]
        : ["right", "left"];
    for (const side of sides) {
      const dir = side === "right" ? 1 : -1;
      const cx = side === "right" ? rr.x + rr.w - r : rr.x + r;
      const cy = rr.y + r;
      const px0 = cx + dir * r * Math.SQRT1_2;
      const py0 = cy - r * Math.SQRT1_2;
      const px2 = cx + dir * (r + 14) * Math.SQRT1_2;
      const py2 = cy - (r + 14) * Math.SQRT1_2;
      const text = `r ${fmt(radius)}`;
      const w = tagWidth(text);
      if (addTag("radius", "measure", text, [[px2 + dir * (w / 2 + 3), py2 - 4]])) {
        lines.push({
          key: "radius",
          tone: "measure",
          d: `M${crisp(px0)} ${crisp(py0)}L${crisp(px2)} ${crisp(py2)}`,
        });
        break;
      }
    }
  }

  // Padding: tinted strips with a measured line and a number each. A strip too small for its
  // number sends it outside the box, with a short leader.
  const mid = rr.y + rr.h / 2;
  const innerH = Math.max(0, rr.h - pt - pb);
  const strips: [string, R, "h" | "v", number][] = [
    ["pt", { x: rr.x, y: rr.y, w: rr.w, h: pt }, "v", pad[0]],
    ["pb", { x: rr.x, y: rr.y + rr.h - pb, w: rr.w, h: pb }, "v", pad[2]],
    ["pl", { x: rr.x, y: rr.y + pt, w: pl, h: innerH }, "h", pad[3]],
    ["pr", { x: rr.x + rr.w - pr, y: rr.y + pt, w: pr, h: innerH }, "h", pad[1]],
  ];
  for (const [key, strip, axis, value] of strips) {
    if (strip.w < 1 || strip.h < 1) continue;
    tint.push({ ...strip, tone: "padding" });
    // Padding numbers need room: tiny zoom keeps the boxes and the summary only.
    if (veryTight || k < 1.6) continue;
    const text = fmt(value);
    const tw = tagWidth(text);
    if (axis === "h") {
      const y = Math.round(mid);
      const cx = strip.x + strip.w / 2;
      const up = rr.y - 16 - TAG_H / 2;
      const spots: [number, number, string?][] = [];
      if (strip.w >= tw + 6) spots.push([cx, y - 5 - TAG_H / 2]);
      spots.push([cx, up, `M${crisp(cx)} ${crisp(up + TAG_H / 2)}V${crisp(y)}`]);
      if (addTag(key, "padding", text, spots)) {
        dimension(key, "padding", [strip.x, y], [strip.x + strip.w, y]);
      }
    } else {
      for (const f of [0.5, 0.3, 0.7, 0.15, 0.85]) {
        const x = Math.round(rr.x + rr.w * f);
        const sy = strip.y + strip.h / 2;
        const out = rr.x + rr.w + 20;
        const spots: [number, number, string?][] = [];
        if (strip.h >= TAG_H + 4) spots.push([x + 8 + tw / 2, sy]);
        spots.push([out + tw / 2, sy, `M${crisp(x)} ${crisp(sy)}H${crisp(out)}`]);
        if (addTag(key, "padding", text, spots)) {
          dimension(key, "padding", [x, strip.y], [x, strip.y + strip.h]);
          break;
        }
      }
    }
  }

  // Gaps: the space between the specimen's own children, tinted, with the distance.
  let gap: number | null = null;
  const children = [...root.children]
    .filter((c): c is HTMLElement => {
      if (!(c instanceof HTMLElement)) return false;
      const cs = getComputedStyle(c);
      if (cs.display === "none" || cs.position === "absolute" || cs.position === "fixed") {
        return false;
      }
      const r = c.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    })
    .map(rel);
  if (children.length > 1) {
    const first = children[0] as R;
    const horizontal = children.every(
      (c) => c.y + c.h / 2 >= first.y && c.y + c.h / 2 <= first.y + first.h,
    );
    const sorted = [...children].sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
    const head = sorted[0] as R;
    let end = horizontal ? head.x + head.w : head.y + head.h;
    for (const next of sorted.slice(1)) {
      const start = horizontal ? next.x : next.y;
      const size = start - end;
      if (size >= 1) {
        const strip: R = horizontal
          ? { x: end, y: rr.y + pt, w: size, h: innerH }
          : { x: rr.x + pl, y: end, w: Math.max(0, rr.w - pl - pr), h: size };
        tint.push({ ...strip, tone: "gap" });
        const text = fmt(size / s);
        gap ??= size / s;
        const key = `gap-${tint.length}`;
        const tw = tagWidth(text);
        const cx = strip.x + strip.w / 2;
        const cy = strip.y + strip.h / 2;
        if (dense) {
          if (horizontal) {
            const y = Math.round(mid);
            const up = rr.y - 16 - TAG_H / 2;
            const spots: [number, number, string?][] = [];
            if (strip.w >= tw + 6) spots.push([cx, y + 5 + TAG_H / 2]);
            spots.push([cx, up, `M${crisp(cx)} ${crisp(up + TAG_H / 2)}V${crisp(y)}`]);
            if (addTag(key, "gap", text, spots)) {
              dimension(key, "gap", [strip.x, y], [strip.x + strip.w, y]);
            }
          } else {
            const out = rr.x + rr.w + 20;
            const spots: [number, number, string?][] = [];
            if (strip.h >= TAG_H + 4) spots.push([cx + 8 + tw / 2, cy]);
            spots.push([out + tw / 2, cy, `M${crisp(cx)} ${crisp(cy)}H${crisp(out)}`]);
            if (addTag(key, "gap", text, spots)) {
              dimension(key, "gap", [cx, strip.y], [cx, strip.y + strip.h]);
            }
          }
        }
      }
      end = Math.max(end, horizontal ? next.x + next.w : next.y + next.h);
    }
  }

  // Outlines: the root and every part in the specimen, except a layer that covers the root.
  const outlines: Model["outlines"] = [];
  for (const f of found) {
    if (f.cover) continue;
    const r = f.isRoot
      ? radius * s
      : radiusOf(getComputedStyle(f.el), f.box.w / s, f.box.h / s) * s;
    outlines.push({ ...f.box, radius: r, name: f.part.name });
  }

  // Names. Each dot sits on its part's outline; a leader never crosses another part (its own
  // ancestors aside), another leader, or a tag.
  const labels: Label[] = [];
  // Every other element that matches a part (a second radio, another row): also in the way.
  const usedEls = new Set(found.map((f) => f.el));
  const extras: R[] = [...everyEl]
    .filter((el) => !usedEls.has(el))
    .map(rel)
    .filter((r) => r.w > 0 && r.h > 0);
  // The specimen's text: a leader never crosses it.
  const texts: R[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width > 0 && r.height > 0) {
        texts.push(
          map({ x: r.left - bodyBox.left, y: r.top - bodyBox.top, w: r.width, h: r.height }),
        );
      }
    }
  }
  const legs: Seg[] = [];
  const baseOf = (f: Found): R => (f.cover ? rr : f.box);
  const obstaclesOf = (f: Found): R[] =>
    found
      .filter((g) => g !== f && !g.cover && !within(g.box, baseOf(f), 1.5))
      .map((g) => g.box)
      .concat(extras.filter((o) => !within(o, baseOf(f), 1.5) && !within(baseOf(f), o, 1.5)))
      .concat(texts.filter((o) => !within(baseOf(f), o, 1.5)));
  const targetOf = (f: Found): string => (f.cover ? (parts[0]?.name ?? f.part.name) : f.part.name);
  const labelW = (f: Found) => Math.ceil(f.part.name.length * charWidth) + 22;
  const blocked = (seg: Seg, f: Found, gap = 4): boolean =>
    obstaclesOf(f).some((o) => segHitsBox(seg, o)) ||
    reserved.some((o) => segHitsBox(seg, o, -2)) ||
    legs.some((other) => segsClash(seg, other, gap));

  // The names stay in the order of their anchors, so leaders keep parallel and never cross.
  const extent = (dir: 1 | -1): number => {
    const xs = [dir > 0 ? rr.x + rr.w : rr.x];
    for (const g of found) xs.push(dir > 0 ? g.box.x + g.box.w : g.box.x);
    for (const t of reserved) {
      if (t.y < rr.y + rr.h && t.y + t.h > rr.y && (t.x + t.w / 2 - (rr.x + rr.w / 2)) * dir > 0) {
        xs.push(dir > 0 ? t.x + t.w : t.x);
      }
    }
    return dir > 0 ? Math.max(...xs) + 16 : Math.min(...xs) - 16;
  };

  const sideNames = (): boolean => {
    const items = found
      // Small parts claim their spots first; the big ones have more edge to choose from.
      .map((f) => ({ f, c: baseOf(f).h }))
      .sort((a, b) => (a.f.isRoot ? -1 : b.f.isRoot ? 1 : a.c - b.c));
    const jog = { 1: extent(1), [-1]: extent(-1) } as Record<number, number>;
    interface Pick {
      f: Found;
      dir: 1 | -1;
      ax: number;
      ay: number;
    }
    const picks: Pick[] = [];
    let idx = 0;
    for (const { f } of items) {
      const base = baseOf(f);
      const e = edges(base);
      const rad =
        f.isRoot || f.cover
          ? radius * s
          : Math.min(radiusOf(getComputedStyle(f.el), base.w / s, base.h / s) * s, base.h / 2);
      const pref: (1 | -1)[] = bothSides && idx % 2 === 1 ? [-1, 1] : [1, -1];
      idx++;
      const fractions = f.isRoot
        ? [0, 0.5, 0.3, 0.7]
        : f.cover
          ? [0.8, 0.65, 0.5, 0.3]
          : [0.5, 0.35, 0.65, 0.2, 0.8];
      let chosen: Pick | null = null;
      const tiers: [number, number[]][] = [
        [9, []],
        [5, [0.1, 0.9, 0.25, 0.75]],
        [3, [0.05, 0.15, 0.4, 0.6, 0.45, 0.55, 0.95]],
      ];
      // The preferred side first, but a clean far side beats a cramped near one.
      const tries = [
        ...tiers.slice(0, 2).flatMap((t) => pref.map((dir) => [dir, t] as const)),
        ...pref.map((dir) => [dir, tiers[2] as [number, number[]]] as const),
      ];
      outer: for (const [dir, [gapNeed, extra]] of tries) {
        for (const frac of [...fractions, ...extra]) {
          const ay =
            f.isRoot && frac === 0
              ? e.t + rad * (1 - Math.SQRT1_2)
              : Math.min(e.b - rad, Math.max(e.t + rad, e.t + (e.b - e.t) * frac));
          const ax =
            f.isRoot && frac === 0
              ? dir > 0
                ? e.r - rad * (1 - Math.SQRT1_2)
                : e.l + rad * (1 - Math.SQRT1_2)
              : dir > 0
                ? e.r
                : e.l;
          const seg: Seg = [ax, ay, jog[dir] as number, ay];
          if (blocked(seg, f, gapNeed)) continue;
          chosen = { f, dir, ax, ay };
          legs.push(seg);
          break outer;
        }
      }
      if (!chosen) {
        return false;
      }
      picks.push(chosen);
    }
    const out: Label[] = [];
    for (const dir of [1, -1] as const) {
      const group = picks.filter((p) => p.dir === dir).sort((a, b) => a.ay - b.ay);
      if (!group.length) continue;
      const lo = (reserve ? top : 4) + LABEL_H / 2;
      const hi = (reserve ? bottom : H - 4) - LABEL_H / 2;
      const ys = spread(
        group.map((p) => p.ay),
        LABEL_H + 6,
        lo,
        hi,
      );
      for (const [i, p] of group.entries()) {
        const ly = ys[i] as number;
        const w = labelW(p.f);
        const edgeX = (jog[dir] as number) + dir * (narrow ? 20 : 28);
        const x = dir > 0 ? edgeX : edgeX - w;
        if (x < left || x + w > right + EDGE) {
          return false;
        }
        const rect: R = { x: Math.round(x), y: Math.round(ly - LABEL_H / 2), w, h: LABEL_H };
        if (reserved.some((o) => hit(rect, o, 2))) {
          return false;
        }
        const points: [number, number][] =
          Math.abs(ly - p.ay) < 0.75
            ? [
                [p.ax, p.ay],
                [edgeX, p.ay],
              ]
            : [
                [p.ax, p.ay],
                [jog[dir] as number, p.ay],
                [edgeX, ly],
              ];
        out.push({
          ...rect,
          name: p.f.part.name,
          target: targetOf(p.f),
          dot: { x: p.ax, y: p.ay },
          leader: pathOf(points),
        });
      }
    }
    labels.push(...out);
    return true;
  };

  const rowNames = () => {
    const placed: R[] = [];
    const order = [...found].sort((a, b) => (a.isRoot ? -1 : b.isRoot ? 1 : a.box.x - b.box.x));
    let flip = 0;
    const lead = tight ? 18 : 32;
    const row0 = tight ? LABEL_H + 4 : ROW;
    const aboveTop = (row: number) => rr.y - lead - LABEL_H - row * row0;
    const belowTop = (row: number) => belowEdge + lead - 2 + row * row0;
    const spots = new Map<Found, "above" | "below">();
    for (const f of order) {
      const dTop = f.box.y - rr.y;
      const dBottom = rr.y + rr.h - (f.box.y + f.box.h);
      const near = Math.abs(dTop - dBottom) > 0.25 * rr.h;
      spots.set(
        f,
        f.isRoot || f.part.size
          ? "above"
          : f.cover
            ? "below"
            : near
              ? dTop < dBottom
                ? "above"
                : "below"
              : flip++ % 2 === 0
                ? "below"
                : "above",
      );
    }
    const done = new Set<Found>();
    const clearOfAll = (rect: R) => ![...reserved, ...placed].some((other) => hit(rect, other, 3));
    for (const f of order) {
      const w = labelW(f);
      const prefer = spots.get(f) ?? "above";
      const sides: ("above" | "below")[] =
        prefer === "above" ? ["above", "below"] : ["below", "above"];
      const fractions = f.isRoot
        ? [0.12, 0.3, 0.88]
        : f.cover
          ? [0.85, 0.65, 0.15]
          : [0.5, 0.25, 0.75, 0.1, 0.9];
      const base = baseOf(f);
      const e = edges(base);
      const rad = Math.min(
        f.isRoot || f.cover
          ? radius * s
          : radiusOf(getComputedStyle(f.el), base.w / s, base.h / s) * s,
        base.w / 2,
      );
      // A part with no clean way above or below goes out to the side instead.
      const toSide = (): boolean => {
        const w = labelW(f);
        const dirs: (1 | -1)[] =
          heightSide === "left"
            ? [1, -1]
            : heightSide === "right"
              ? [-1, 1]
              : base.x + base.w / 2 < rr.x + rr.w / 2
                ? [-1, 1]
                : [1, -1];
        for (const dir of dirs) {
          const jx = extent(dir);
          const edgeX = jx + dir * (narrow ? 20 : 28);
          const x = Math.round(dir > 0 ? edgeX : edgeX - w);
          if (x < left || x + w > right + EDGE) continue;
          for (const frac of [0.5, 0.3, 0.7, 0.15, 0.85]) {
            const ay = Math.min(e.b - rad, Math.max(e.t + rad, e.t + (e.b - e.t) * frac));
            const ax = dir > 0 ? e.r : e.l;
            const run: Seg = [ax, ay, jx, ay];
            if (blocked(run, f, 9) || placed.some((o) => segHitsBox(run, o, -3))) continue;
            for (const off of [0, 30, -30, 60, -60]) {
              const ly = ay + off;
              const rect: R = { x, y: Math.round(ly - LABEL_H / 2), w, h: LABEL_H };
              if (rect.y < top || rect.y + LABEL_H > bottom || !clearOfAll(rect)) continue;
              const diag: Seg = [jx, ay, edgeX, ly];
              if (off && blocked(diag, f, 9)) continue;
              placed.push(rect);
              legs.push(run);
              if (off) legs.push(diag);
              labels.push({
                ...rect,
                name: f.part.name,
                target: targetOf(f),
                dot: { x: ax, y: ay },
                leader: pathOf(
                  off
                    ? [
                        [ax, ay],
                        [jx, ay],
                        [edgeX, ly],
                      ]
                    : [
                        [ax, ay],
                        [edgeX, ay],
                      ],
                ),
              });
              return true;
            }
          }
        }
        return false;
      };
      // Parts nested in another part reach out through it: never through a sibling.
      for (const pass of [0, 1]) {
        if (pass === 1 && !done.has(f) && toSide()) done.add(f);
        if (done.has(f)) break;
        for (const side of sides) {
          for (let row = 0; row < 3 && !done.has(f); row++) {
            const y = side === "above" ? aboveTop(row) : belowTop(row);
            if (y < top || y + LABEL_H > bottom) continue;
            for (const frac of fractions) {
              const dx = Math.min(
                e.r - rad,
                Math.max(e.l + rad, Math.round(e.l + (e.r - e.l) * frac) + 0.5),
              );
              const dy = side === "above" ? e.t : e.b;
              for (const shift of [0, 16, -16, 32, -32, 52, -52, 80, -80]) {
                const x = Math.round(dx + shift - w / 2);
                const rect: R = { x, y, w, h: LABEL_H };
                if (x < left || x + w > right + EDGE) continue;
                if (!clearOfAll(rect)) continue;
                const edgeY = side === "above" ? y + LABEL_H : y;
                const jogY = side === "above" ? edgeY + 10 : edgeY - 10;
                const lx = Math.round(x + w / 2) + 0.5;
                const points: [number, number][] =
                  shift === 0
                    ? [
                        [dx, dy],
                        [dx, edgeY],
                      ]
                    : [
                        [dx, dy],
                        [dx, jogY],
                        [lx, jogY],
                        [lx, edgeY],
                      ];
                const segs: Seg[] = points
                  .slice(1)
                  .map((q, i) => [
                    (points[i] as [number, number])[0],
                    (points[i] as [number, number])[1],
                    q[0],
                    q[1],
                  ]);
                // The first pass insists on a clean leader; the second takes what is left.
                if (
                  segs.some((seg) => placed.some((o) => segHitsBox(seg, o, -3))) ||
                  (pass === 0 && segs.some((seg) => blocked(seg, f)))
                ) {
                  continue;
                }
                placed.push(rect);
                legs.push(...segs);
                labels.push({
                  ...rect,
                  name: f.part.name,
                  target: targetOf(f),
                  dot: { x: dx, y: dy },
                  leader: pathOf(points),
                });
                done.add(f);
                break;
              }
              if (done.has(f)) break;
            }
          }
          if (done.has(f)) break;
        }
        if (done.has(f)) break;
      }
    }
  };
  if (!(sideMode && sideNames())) {
    labels.length = 0;
    legs.length = 0;
    rowNames();
  }

  // The header above everything on top; else under everything below.
  const headerW = Math.min(right + EDGE - left, 560);
  const topMost = Math.min(rr.y, ...labels.map((l) => l.y), ...tags.map((t) => t.y));
  let headerY = Math.max(reserve ? top0 : 0, topMost - 18 - headerH);
  const hx0 = Math.max(
    left,
    Math.min(rr.x - (heightSide === "left" ? 36 : 0), right + EDGE - headerW),
  );
  if (!reserve && headerY < Math.max(8, top0)) {
    const lowest = Math.max(
      rr.y + rr.h,
      ...labels.map((l) => l.y + l.h),
      ...tags.map((t) => t.y + t.h),
    );
    headerY = Math.min(lowest + 18, H - headerH - 4);
  }

  // Token values for the open part's popover.
  let values: string[] = [];
  const open = parts.find((p) => p.name === env.openPart);
  const openEl = found.find((f) => f.part === open)?.el;
  if (open?.tokens && openEl) {
    const cs = getComputedStyle(openEl);
    values = Object.values(open.tokens).map((from) =>
      readable(cs.getPropertyValue(from).trim(), env.probe),
    );
  }

  return {
    plan,
    goal,
    model: {
      width: W,
      height: H,
      root: rr,
      radius: radius * s,
      tints: tint,
      outlines,
      lines,
      tags,
      labels,
      header: { x: Math.round(hx0), y: Math.round(headerY), w: headerW, mode: headerMode },
      facts: {
        height: rr.h / s,
        width: rr.w / s,
        pad,
        radius: dense ? radius : 0,
        gap: dense ? gap : null,
      },
      values,
    },
  };
}

interface AnatomyProps {
  /** Turned off: the specimen glides back and the sheet fades; nothing in it takes focus. */
  leaving: boolean;
  /** The component's display name. */
  name: string;
  parts: readonly Part[];
  /** One complete instance of the component, rendered inert in the overlay. */
  specimen: ReactNode;
  lang: Lang;
  labels: Dictionary["cp"];
  bodyRef: RefObject<HTMLDivElement | null>;
  demoRef: RefObject<HTMLDivElement | null>;
  /** The part whose popover is open. */
  openPart: string | null;
  onOpenPart: (name: string | null) => void;
}

/** One part's note, and its tokens with their values in use. */
function PartInfo({ part, lang, values }: { part: Part; lang: Lang; values: readonly string[] }) {
  const { prefix } = useTokenSetup();
  return (
    <div className="cp-part-card" data-place="pop">
      <Popover.Title className="cp-part-card-name">{part.name}</Popover.Title>
      <p className="cp-part-card-note">{part.note[lang]}</p>
      {part.tokens ? (
        <ul>
          {Object.keys(part.tokens).map((token, i) => {
            const value = values[i] ?? "";
            const color = value.startsWith("#") || value.startsWith("rgba");
            return (
              <li key={token}>
                <span
                  className="cp-part-card-swatch"
                  data-empty={color ? undefined : ""}
                  style={color ? { background: value } : undefined}
                />
                <code>{withPrefix(token, prefix)}</code>
                <span className="cp-part-card-value" title={value}>
                  {value}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Inspect as an anatomy spec sheet of one complete, magnified specimen of the component. The
 * specimen is a real element in this overlay (not a clone of the demo), a faint grey wireframe. It
 * morphs (FLIP) from the demo's first instance of the root part to the middle of the preview, the
 * demo fading out as it fades in, and back the same way; the specimen moves by the `translate` and
 * `scale` properties on its wrapper, so nothing reflows. Dashed outlines, padding and gap tints,
 * measured dimensions, and part names with leaders are drawn over it at screen size. Everything is
 * measured from the DOM, again when the preview, the token setup, or the theme changes (no frame
 * loop).
 */
export function Anatomy({
  leaving,
  name,
  parts,
  specimen,
  lang,
  labels,
  bodyRef,
  demoRef,
  openPart,
  onOpenPart,
}: AnatomyProps) {
  const clipId = useId();
  const { prefix } = useTokenSetup();
  const rootRef = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [revealing, setRevealing] = useState(true);
  // The name under the pointer or focus: its part lights up and the rest step back.
  const [hot, setHot] = useState<string | null>(null);
  const latest = useRef({ parts, openPart, leaving, prefix });
  latest.current = { parts, openPart, leaving, prefix };
  const signature = useRef("");
  const frame = useRef(0);
  // "new" until the first placement; "on" while shown; "off" once sent back to the demo.
  const phase = useRef<"new" | "on" | "off">("new");
  const applied = useRef<Plan | null>(null);
  // The next move glides (a layout change) instead of just following (a resize).
  const glide = useRef(false);
  const settle = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setRevealing(false), REVEAL_MS);
    return () => clearTimeout(timer);
  }, []);

  const compute = useRef(() => {});
  compute.current = () => {
    const body = bodyRef.current;
    const demo = demoRef.current;
    const wrap = wrapRef.current;
    const mark = probe.current;
    const sheet = rootRef.current;
    const rootPart = latest.current.parts[0];
    if (!body || !demo || !wrap || !mark || !sheet || !rootPart) return;
    const easing = easingOf(body);
    const now = latest.current;
    const specimenRoot = wrap.querySelector<HTMLElement>(rootPart.selector);

    if (now.leaving) {
      if (phase.current === "off" || !specimenRoot) return;
      phase.current = "off";
      applied.current = null;
      // The mirror of the open: glide and shrink onto the demo's instance, crossing into it.
      const origin = originOf(demo, body, rootPart.selector);
      const k0 = scaleOf(wrap);
      const root0 = specimenRoot.getBoundingClientRect();
      const bodyBox = body.getBoundingClientRect();
      const here = specimenRoot.getBoundingClientRect();
      const plan = origin
        ? planAt(wrap, specimenRoot, origin, fitScale(origin, root0, k0))
        : planAt(
            wrap,
            specimenRoot,
            {
              x: here.left - bodyBox.left + here.width / 2,
              y: here.top - bodyBox.top + here.height / 2,
            },
            k0 * POP,
          );
      glideTo(wrap, plan, GLIDE_MS, easing);
      fade(wrap, "out", Math.max(0, GLIDE_MS - FADE_MS));
      return;
    }

    const result = measure({
      ...now,
      body,
      wrap,
      charWidth: mark.getBoundingClientRect().width / 10,
      probe: mark,
    });
    if (!result) return;
    const { plan, goal } = result;

    const was = applied.current;
    const same =
      was &&
      Math.abs(was.tx - plan.tx) < 0.5 &&
      Math.abs(was.ty - plan.ty) < 0.5 &&
      Math.abs(was.k - plan.k) < 0.002;
    if (!same) {
      applied.current = plan;
      if (phase.current === "new") {
        // Mount: sit exactly over the demo's instance before the first paint, then grow to the
        // middle. Without an instance to come from, pop in from the middle.
        phase.current = "on";
        glide.current = false;
        if (!reduced()) {
          const origin = originOf(demo, body, rootPart.selector);
          const r0 = specimenRoot?.getBoundingClientRect();
          if (origin && specimenRoot && r0?.height) {
            place(wrap, planAt(wrap, specimenRoot, origin, fitScale(origin, r0, scaleOf(wrap))));
          } else if (specimenRoot) {
            place(wrap, planAt(wrap, specimenRoot, goal, plan.k * POP));
          }
        }
        wrap.style.opacity = "0";
        fade(wrap, "in", 0, { opacity: "0", filter: "grayscale(0)" });
        glideTo(wrap, plan, GLIDE_MS, easing);
      } else if (phase.current === "off") {
        phase.current = "on";
        fade(wrap, "in");
        glideTo(wrap, plan, GLIDE_MS, easing);
      } else {
        // The layout moved (the Docs panel): glide, with the sheet waiting.
        const ms = glide.current ? GLIDE_MS : 0;
        glide.current = false;
        glideTo(wrap, plan, ms, easing);
        if (ms) {
          sheet.dataset.settling = "";
          clearTimeout(settle.current);
          settle.current = window.setTimeout(() => {
            delete sheet.dataset.settling;
            compute.current();
          }, ms);
        }
      }
    }

    const key = JSON.stringify(result.model);
    if (key === signature.current) return;
    signature.current = key;
    setModel(result.model);
  };

  // Right away when what is drawn changes; frame-coalesced when the page or the preview changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each of these is a new sheet to measure
  useLayoutEffect(() => {
    if (phase.current === "on" && !latest.current.leaving) glide.current = true;
    compute.current();
  }, [parts, openPart, leaving, prefix]);

  useEffect(() => {
    const body = bodyRef.current;
    const demo = demoRef.current;
    const wrap = wrapRef.current;
    if (!body || !demo || !wrap) return;
    const schedule = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        compute.current();
      });
    };
    // The demo is behind the specimen: out of the tab order and the accessibility tree.
    demo.inert = true;
    const resize = new ResizeObserver(schedule);
    resize.observe(body);
    resize.observe(wrap);
    const theme = new MutationObserver(schedule);
    theme.observe(document.documentElement, { attributes: true });
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      clearTimeout(settle.current);
      resize.disconnect();
      theme.disconnect();
      scheme.removeEventListener("change", schedule);
      demo.inert = false;
    };
  }, [bodyRef, demoRef]);

  const active = hot ?? openPart;
  const target = model?.labels.find((l) => l.name === active)?.target;
  const t = labels;
  const facts = model?.facts;
  const summary = facts
    ? [
        `${t.specHeight} ${fmt(facts.height)}`,
        facts.pad.some(Boolean) ? `${t.specPadding} ${facts.pad.map(fmt).join(",")}` : null,
        facts.radius ? `${t.specRadius} ${fmt(facts.radius)}` : null,
        facts.gap ? `${t.specGap} ${fmt(facts.gap)}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div
      ref={rootRef}
      className="sp"
      data-reveal={revealing ? "" : undefined}
      data-leaving={leaving ? "" : undefined}
      inert={leaving}
    >
      <div ref={wrapRef} className="sp-specimen" aria-hidden="true" inert>
        {specimen}
      </div>
      <span ref={probe} className="sp-probe" aria-hidden="true">
        0000000000
      </span>
      {model ? (
        // A modal specimen (Alert Dialog) hides the page from assistive technology, live regions
        // aside: this keeps the part buttons reachable, and "off" announces nothing.
        <div className="sp-ui" aria-live="off">
          <div className="sp-sheet" data-hot={target ? "" : undefined}>
            <svg
              className="sp-svg"
              width={model.width}
              height={model.height}
              viewBox={`0 0 ${model.width} ${model.height}`}
              aria-hidden="true"
            >
              <defs>
                <clipPath id={clipId}>
                  <rect
                    x={model.root.x}
                    y={model.root.y}
                    width={model.root.w}
                    height={model.root.h}
                    rx={model.radius}
                  />
                </clipPath>
              </defs>
              <g clipPath={`url(#${clipId})`}>
                {model.tints.map((tint, i) => (
                  <rect
                    // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list per measure
                    key={i}
                    className="sp-tint"
                    data-tone={tint.tone}
                    x={tint.x}
                    y={tint.y}
                    width={tint.w}
                    height={tint.h}
                  />
                ))}
              </g>
              {model.outlines.map((o) => (
                <rect
                  key={o.name}
                  className="sp-outline"
                  x={crisp(o.x)}
                  y={crisp(o.y)}
                  width={Math.max(0, Math.round(o.w) - 1)}
                  height={Math.max(0, Math.round(o.h) - 1)}
                  rx={o.radius}
                  data-part={o.name}
                  data-root={o.name === parts[0]?.name ? "" : undefined}
                  data-on={o.name === target ? "" : undefined}
                />
              ))}
              {model.lines.map((line) => (
                <path
                  key={line.key}
                  className={line.ext ? "sp-ext" : "sp-line"}
                  data-tone={line.tone}
                  d={line.d}
                  pathLength={1}
                />
              ))}
              {model.labels.map((l) => (
                <g
                  key={l.name}
                  className="sp-leader"
                  data-part={l.name}
                  data-on={l.name === active ? "" : undefined}
                >
                  <path d={l.leader} pathLength={1} />
                  <circle cx={l.dot.x} cy={l.dot.y} r={3} />
                </g>
              ))}
            </svg>
            {model.header.mode === "none" ? null : (
              <div
                className="sp-header"
                style={{
                  transform: `translate(${model.header.x}px, ${model.header.y}px)`,
                  inlineSize: model.header.w,
                }}
              >
                <div className="sp-head-row">
                  <p className="sp-title">{format(t.anatomy, { name })}</p>
                </div>
                {model.header.mode === "full" ? <p className="sp-summary">[{summary}]</p> : null}
              </div>
            )}
            {model.tags.map((tag, i) => (
              <span
                key={tag.key}
                className="sp-tag"
                data-tone={tag.tone}
                data-kind={tag.key.replace(/-.*/, "")}
                aria-hidden="true"
                style={
                  {
                    transform: `translate(${tag.x}px, ${tag.y}px)`,
                    inlineSize: tag.w,
                    "--i": i,
                  } as CSSProperties
                }
              >
                {tag.text}
              </span>
            ))}
            {model.labels.map((l, i) => {
              const part = parts.find((p) => p.name === l.name);
              return (
                <Popover.Root
                  key={l.name}
                  open={openPart === l.name}
                  onOpenChange={(next) => onOpenPart(next ? l.name : null)}
                >
                  <Popover.Trigger
                    className="sp-label"
                    aria-label={format(t.partLabel, { name: l.name })}
                    data-part={l.name}
                    onPointerEnter={() => setHot(l.name)}
                    onPointerLeave={() => setHot(null)}
                    onFocus={() => setHot(l.name)}
                    onBlur={() => setHot(null)}
                    style={
                      {
                        insetInlineStart: l.x,
                        insetBlockStart: l.y,
                        inlineSize: l.w,
                        "--i": model.tags.length + i,
                      } as CSSProperties
                    }
                  >
                    {l.name}
                  </Popover.Trigger>
                  {part ? (
                    <Popover.Portal>
                      <Popover.Positioner side="top" sideOffset={10} collisionPadding={8}>
                        <Popover.Popup className="sp-pop" aria-label={l.name}>
                          <PartInfo part={part} lang={lang} values={model.values} />
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  ) : null}
                </Popover.Root>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
