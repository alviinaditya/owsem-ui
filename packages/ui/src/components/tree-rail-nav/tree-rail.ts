/**
 * The rail of Tree Rail Nav: a base line per level, and a trail from the origin at the top down
 * through each parent to the current item. Framework-free; the React parts render the markup.
 *
 * Geometry is read from the DOM: x positions from the root's --_r0 … --_r2 (one rail per level),
 * y positions from the rows and from the Origin label, when there is one. Redraws run from a ResizeObserver, so they follow panels while they
 * open and close; frames run only while the trail travels (Owsem). The SVG is mirrored in CSS for
 * right-to-left text, so x is always measured from the left.
 */

export interface TreeRailOptions {
  /** Owsem travels: back to the shared branch, then down to the new item, and pulses on arrival. */
  travel: () => boolean;
}

export interface TreeRail {
  refresh(): void;
  destroy(): void;
}

type Segment =
  | { t: "V"; x: number; y0: number; y1: number }
  | { t: "C"; x0: number; y0: number; x1: number; y1: number };
type Route = Segment[] & { limit?: number };

const NS = "http://www.w3.org/2000/svg";
const ROW = "[data-tree-rail-item]";
const PANEL = "[data-tree-rail-panel]";
/** How long a row keeps its tint while it closes: the transition in tree-rail-nav.css, plus a frame. */
const LEAVE_MS = 340;

const round = (n: number) => Math.round(n * 100) / 100;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const curve = (x0: number, y0: number, x1: number, y1: number) => {
  const k = (y1 - y0) / 2;
  return `C${round(x0)} ${round(y0 + k)} ${round(x1)} ${round(y1 - k)} ${round(x1)} ${round(y1)}`;
};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const disabled = (row: Element) =>
  row.matches(':disabled, [aria-disabled="true"], [data-disabled]');

/** The row of the node that holds `panel`. */
const rowOfPanel = (panel: Element) =>
  panel.parentElement?.querySelector<HTMLElement>(`:scope > ${ROW}`) ?? null;
/** The row this row's node hangs from, or null at the top level. */
const parentRow = (row: Element) => {
  const panel = row.parentElement?.closest(PANEL);
  return panel ? rowOfPanel(panel) : null;
};
const chainOf = (row: HTMLElement) => {
  const chain: HTMLElement[] = [];
  for (let r: HTMLElement | null = row; r; r = parentRow(r)) chain.unshift(r);
  return chain;
};
const panelOf = (row: Element) =>
  row.parentElement?.querySelector<HTMLElement>(`:scope > ${PANEL}`) ?? null;
const depthOf = (el: Element) => Number((el as HTMLElement).dataset.depth ?? 1);

// Bézier of a branch: y(t) = y0 + (y1 − y0)·(1.5t(1−t) + t³), always going down.
const bezY = (s: Extract<Segment, { t: "C" }>, t: number) =>
  s.y0 + (s.y1 - s.y0) * (1.5 * t * (1 - t) + t * t * t);

function segLength(s: Segment, tEnd = 1): number {
  if (s.t === "V") return Math.max(0, s.y1 - s.y0);
  const k = (s.y1 - s.y0) / 2;
  const px = [s.x0, s.x0, s.x1, s.x1];
  const py = [s.y0, s.y0 + k, s.y1 - k, s.y1];
  let length = 0;
  let lx = s.x0;
  let ly = s.y0;
  for (let i = 1; i <= 24; i++) {
    const t = (i / 24) * tEnd;
    const u = 1 - t;
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const x = w.reduce((a, wi, j) => a + wi * (px[j] ?? 0), 0);
    const y = w.reduce((a, wi, j) => a + wi * (py[j] ?? 0), 0);
    length += Math.hypot(x - lx, y - ly);
    lx = x;
    ly = y;
  }
  return length;
}
const pathLength = (segs: Segment[]) => segs.reduce((a, s) => a + segLength(s), 0);

/** Length along the route to where it first reaches y = limit (routes only go down). */
function cutAtY(segs: Segment[], limit: number): number {
  if (!(limit < Number.POSITIVE_INFINITY)) return pathLength(segs);
  let length = 0;
  for (const s of segs) {
    if (s.y1 <= limit) {
      length += segLength(s);
      continue;
    }
    if (limit <= s.y0) return length;
    if (s.t === "V") return length + (limit - s.y0);
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 18; k++) {
      const m = (lo + hi) / 2;
      if (bezY(s, m) < limit) lo = m;
      else hi = m;
    }
    return length + segLength(s, lo);
  }
  return length;
}

function toPath(segs: Segment[]): string {
  const s0 = segs[0];
  if (!s0) return "";
  let d = `M${round(s0.t === "V" ? s0.x : s0.x0)} ${round(s0.y0)}`;
  for (const s of segs) d += s.t === "V" ? `V${round(s.y1)}` : curve(s.x0, s.y0, s.x1, s.y1);
  return d;
}

const same = (a: Segment, b: Segment) =>
  a.t === "V" && b.t === "V"
    ? a.x === b.x && a.y0 === b.y0 && a.y1 === b.y1
    : a.t === "C" &&
      b.t === "C" &&
      a.x0 === b.x0 &&
      a.y0 === b.y0 &&
      a.x1 === b.x1 &&
      a.y1 === b.y1;

/** Length two routes share from the top. */
function sharedLength(a: Segment[], b: Segment[]): number {
  let length = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const sa = a[i];
    const sb = b[i];
    if (!sa || !sb) break;
    if (same(sa, sb)) {
      length += segLength(sa);
      continue;
    }
    if (sa.t === "V" && sb.t === "V" && sa.x === sb.x && sa.y0 === sb.y0) {
      length += Math.max(0, Math.min(sa.y1, sb.y1) - sa.y0);
    }
    break;
  }
  return length;
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function createTreeRail(
  tree: HTMLElement,
  svg: SVGSVGElement,
  options: TreeRailOptions,
): TreeRail {
  // The SVG's parts; the markup stays out of React so redraws never re-render.
  svg.replaceChildren();
  const base = svg.appendChild(svgEl("g", { "data-part": "base" }));
  const rootRail = base.appendChild(svgEl("path", {}));
  const origin = svg.appendChild(svgEl("g", { "data-part": "origin" }));
  origin.append(svgEl("circle", { "data-part": "ring", r: "5" }), svgEl("circle", { r: "2.5" }));
  const active = svg.appendChild(svgEl("g", { "data-part": "active" }));
  const trail = active.appendChild(svgEl("path", { "data-part": "trail" }));
  const nodeLayer = svg.appendChild(svgEl("g", { "data-part": "nodes" }));
  const markerLayer = svg.appendChild(svgEl("g", { "data-part": "active" }));
  const marker = markerLayer.appendChild(svgEl("g", { "data-part": "marker" }));
  // Circles sit at 0,0 of a translated group, so CSS and WAAPI scale them about their centre.
  // The surface-coloured stroke on top cuts each dot out of the rail.
  const halo = marker.appendChild(svgEl("circle", { "data-part": "halo", r: "4" }));
  const dot = marker.appendChild(svgEl("circle", { "data-part": "dot", r: "4.5" }));

  const panelPaths = new Map<Element, SVGPathElement>();
  const nodeDots = new Map<HTMLElement, SVGGElement>();
  let rails = [9, 38, 58];
  let originY = 5;
  let lit: { dot: SVGGElement; x: number; y: number }[] = [];
  let target: HTMLElement | null = null;
  let current: { row: HTMLElement | null; length: number } = { row: null, length: 0 };
  let anim: {
    from: HTMLElement;
    fromLength: number;
    to: HTMLElement;
    t0: number;
    duration: number;
  } | null = null;
  let drawn = 0;
  let wasHidden: boolean | null = null;
  let frame = 0;

  const railX = (depth: number) => rails[clamp(depth, 0, rails.length - 1)] ?? 0;

  function measure(): void {
    const style = getComputedStyle(tree);
    rails = [0, 1, 2].map(
      (i) => Number.parseFloat(style.getPropertyValue(`--_r${i}`)) || (rails[i] ?? 0),
    );
    // An Origin label puts the origin at its middle; otherwise the CSS says where it is.
    const label = tree.querySelector<HTMLElement>(":scope > [data-tree-rail-origin]");
    originY = label
      ? label.offsetTop + label.offsetHeight / 2
      : Number.parseFloat(style.getPropertyValue("--_origin-y")) || originY;
    origin.setAttribute("transform", `translate(${rails[0]} ${originY})`);
  }

  /** A panel's box; a closed (hidden) one collapses to the bottom of its row. */
  function panelRect(panel: Element): { top: number; bottom: number } {
    const r = panel.getBoundingClientRect();
    if (r.height > 0 || panel.getClientRects().length > 0) return r;
    const row = rowOfPanel(panel)?.getBoundingClientRect();
    return { top: row?.bottom ?? 0, bottom: row?.bottom ?? 0 };
  }

  // Branches start at the bottom edge of the parent row and land on the first child's dot.
  function branchSpan(panel: Element): number {
    const first = panel.querySelector(ROW);
    if (!first) return 16;
    const r = first.getBoundingClientRect();
    return Math.max(10, r.top + r.height / 2 - panelRect(panel).top);
  }

  /**
   * Origin → down the parent's rail → an S-curve onto the child's rail → … → the row's middle.
   * A panel that is closing only sets `limit`, where the visible trail is cut.
   */
  function route(row: HTMLElement, box: DOMRect): Route {
    const chain = chainOf(row);
    const segs: Route = [];
    let x = railX(0);
    let y = originY;
    let limit = Number.POSITIVE_INFINITY;
    for (let i = 0; i < chain.length - 1; i++) {
      const parent = chain[i];
      const panel = parent && panelOf(parent);
      if (!parent || !panel) break;
      const r = panelRect(panel);
      const pr = parent.getBoundingClientRect();
      limit = Math.min(limit, r.bottom - box.top - pr.height / 2);
      const top = r.top - box.top;
      const xn = railX(i + 1);
      const ys = Math.max(y, top);
      const ye = ys + branchSpan(panel);
      segs.push({ t: "V", x, y0: y, y1: ys }, { t: "C", x0: x, y0: ys, x1: xn, y1: ye });
      x = xn;
      y = ye;
    }
    const r = row.getBoundingClientRect();
    const cy = r.top + r.height / 2 - box.top;
    segs.push({ t: "V", x, y0: y, y1: Math.max(y, cy) });
    segs.limit = limit;
    return segs;
  }

  /** The lowest visible y of `el`, given the panels around it (relative to the tree). */
  function clipOf(el: Element, box: DOMRect): number {
    let clip = Number.POSITIVE_INFINITY;
    for (let p = el.parentElement?.closest(PANEL); p; p = p.parentElement?.closest(PANEL)) {
      clip = Math.min(clip, panelRect(p).bottom - box.top);
    }
    return clip;
  }

  function drawTrail(segs: Segment[], visible: number): void {
    trail.setAttribute("d", toPath(segs));
    const total = trail.getTotalLength();
    const v = clamp(visible, 0, total);
    trail.style.strokeDasharray =
      v >= total - 0.01 ? "none" : `${v.toFixed(2)} ${(total + 20).toFixed(2)}`;
    const p = v > 0 ? trail.getPointAtLength(v) : { x: railX(0), y: originY };
    marker.setAttribute("transform", `translate(${round(p.x)} ${round(p.y)})`);
    drawn = v;
    // Dots light up once the visible trail has passed them.
    let acc = 0;
    const starts = segs.map((s) => {
      const a = acc;
      acc += segLength(s);
      return a;
    });
    for (const n of lit) {
      let on = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (s?.t !== "V" || Math.abs(s.x - n.x) > 0.5 || n.y < s.y0 - 0.5 || n.y > s.y1 + 0.5) {
          continue;
        }
        on = (starts[i] ?? 0) + Math.max(0, n.y - s.y0) <= v + 0.75;
        break;
      }
      n.dot.toggleAttribute("data-lit", on);
    }
  }

  /** Draws as much as asked, cut at a closing panel; true when the target is hidden in one. */
  function drawRoute(segs: Route, want: number, hollow = true): boolean {
    const cut = cutAtY(segs, segs.limit ?? Number.POSITIVE_INFINITY);
    const hidden = cut < Math.min(want, pathLength(segs)) - 0.5;
    drawTrail(segs, hidden ? cut : want);
    marker.toggleAttribute("data-hollow", hollow && hidden);
    return hidden;
  }

  function drawBase(box: DOMRect): void {
    // The rail of a list ends at its last row's dot, or runs on into an open child panel.
    const railEnd = (list: Element | null, clip: number) => {
      const rows = list ? [...list.querySelectorAll(`:scope > li > ${ROW}`)] : [];
      const last = rows.at(-1);
      if (!last) return Number.NEGATIVE_INFINITY;
      const r = last.getBoundingClientRect();
      let end = r.top + r.height / 2 - box.top;
      const child = panelOf(last);
      if (child) {
        const cr = panelRect(child);
        const top = cr.top - box.top;
        const visible = Math.min(cr.bottom - box.top, clip) - top;
        if (visible > 0) end += Math.max(0, top - end) * clamp(visible / 28, 0, 1);
      }
      return end;
    };
    const top = tree.querySelector(":scope > ul");
    const rootEnd = Math.max(originY, railEnd(top, Number.POSITIVE_INFINITY));
    rootRail.setAttribute("d", `M${round(railX(0))} ${round(originY)}V${round(rootEnd)}`);

    const panels = new Set(tree.querySelectorAll(PANEL));
    for (const [panel, path] of panelPaths) {
      if (!panels.has(panel)) {
        path.remove();
        panelPaths.delete(panel);
      }
    }
    for (const panel of panels) {
      let path = panelPaths.get(panel);
      if (!path) {
        path = base.appendChild(svgEl("path", {}));
        panelPaths.set(panel, path);
      }
      const r = panelRect(panel);
      const top = r.top - box.top;
      const clip = Math.min(r.bottom - box.top, clipOf(panel, box));
      if (clip - top < 1) {
        path.removeAttribute("d");
        continue;
      }
      const depth = depthOf(panel);
      const ye = top + branchSpan(panel);
      const end = Math.max(ye, railEnd(panel.querySelector(":scope > ul"), clip));
      const segs: Segment[] = [
        { t: "C", x0: railX(depth - 1), y0: top, x1: railX(depth), y1: ye },
        { t: "V", x: railX(depth), y0: ye, y1: end },
      ];
      const full = pathLength(segs);
      const cut = cutAtY(segs, clip - 3);
      path.setAttribute("d", toPath(segs));
      path.style.strokeDasharray =
        cut >= full - 0.25 ? "none" : `${cut.toFixed(2)} ${(full + 20).toFixed(2)}`;
    }

    // A dot per row on its level's rail, faded out while a closing panel hides the row.
    const rows = new Set(tree.querySelectorAll<HTMLElement>(ROW));
    for (const [row, c] of nodeDots) {
      if (!rows.has(row)) {
        c.remove();
        nodeDots.delete(row);
      }
    }
    lit = [];
    for (const row of rows) {
      let c = nodeDots.get(row);
      if (!c) {
        c = nodeLayer.appendChild(svgEl("g", { "data-part": "node" }));
        c.append(svgEl("circle", { r: "3.25" }));
        nodeDots.set(row, c);
      }
      c.toggleAttribute("data-disabled", disabled(row));
      const r = row.getBoundingClientRect();
      const x = railX(depthOf(row) - 1);
      const y = r.top + r.height / 2 - box.top;
      const shown = r.height > 0 && y <= clipOf(row, box) - r.height / 2 + 0.5;
      c.toggleAttribute("data-hidden", !shown);
      c.toggleAttribute("data-hot", shown && row.hasAttribute("data-glide-active"));
      if (shown) {
        c.setAttribute("transform", `translate(${round(x)} ${round(y)})`);
        lit.push({ dot: c, x, y });
      } else {
        c.removeAttribute("data-lit");
      }
    }
  }

  function land(): void {
    if (!options.travel() || reduced()) return;
    dot.animate([{ transform: "scale(1.7)" }, { transform: "scale(1)" }], {
      duration: 460,
      easing: "cubic-bezier(.34,1.56,.64,1)",
    });
    halo.animate(
      [
        { transform: "scale(1)", opacity: 0.45 },
        { transform: "scale(3.4)", opacity: 0 },
      ],
      { duration: 640, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  }

  function markTrail(): void {
    const chain = target ? chainOf(target) : [];
    for (const row of tree.querySelectorAll(ROW)) {
      row.toggleAttribute("data-trail", chain.includes(row as HTMLElement) && row !== target);
    }
  }

  // A row losing its tint keeps it while it closes (the CSS draws it on leaving rows too).
  const leaving = new Map<HTMLElement, number>();
  function leave(row: HTMLElement): void {
    clearTimeout(leaving.get(row));
    row.setAttribute("data-leaving", "");
    leaving.set(
      row,
      window.setTimeout(() => {
        row.removeAttribute("data-leaving");
        leaving.delete(row);
      }, LEAVE_MS),
    );
  }

  function arrived(row: HTMLElement | null, hidden: boolean): void {
    for (const r of tree.querySelectorAll<HTMLElement>("[data-arrived]")) {
      if (r !== row || hidden) {
        r.removeAttribute("data-arrived");
        leave(r);
      }
    }
    if (row && !hidden) {
      clearTimeout(leaving.get(row));
      leaving.delete(row);
      row.removeAttribute("data-leaving");
      row.setAttribute("data-arrived", "");
    }
  }

  function draw(now: number): void {
    frame = 0;
    const box = tree.getBoundingClientRect();
    drawBase(box);
    if (anim) {
      const a = route(anim.from, box);
      const b = route(anim.to, box);
      const fromLength = Math.min(anim.fromLength, pathLength(a));
      const shared = Math.min(fromLength, sharedLength(a, b));
      const back = fromLength - shared;
      const forward = pathLength(b) - shared;
      const t = clamp((now - anim.t0) / anim.duration, 0, 1);
      const s = easeInOut(t) * (back + forward);
      if (t >= 1) {
        const to = anim.to;
        anim = null;
        current = { row: to, length: Number.POSITIVE_INFINITY };
        const hidden = drawRoute(b, Number.POSITIVE_INFINITY);
        wasHidden = hidden;
        arrived(to, hidden);
        if (!hidden) land();
      } else if (s < back) {
        // Back up to the branch both routes share…
        current = { row: anim.from, length: fromLength - s };
        drawRoute(a, fromLength - s, false);
      } else {
        // …then down to the new row.
        current = { row: anim.to, length: shared + (s - back) };
        drawRoute(b, shared + (s - back), false);
      }
      frame = requestAnimationFrame(draw);
    } else if (current.row) {
      const hidden = drawRoute(route(current.row, box), current.length);
      if (wasHidden !== null && hidden !== wasHidden) {
        arrived(current.row, hidden);
        // A panel opened again: the trail reaches the row once more.
        if (!hidden) land();
      }
      wasHidden = hidden;
    }
  }

  /** Redraws once, unless the trail is travelling (it redraws every frame then). */
  function redraw(): void {
    if (anim) return;
    draw(performance.now());
  }

  function goTo(row: HTMLElement | null): void {
    target = row;
    markTrail();
    active.toggleAttribute("data-on", !!row);
    markerLayer.toggleAttribute("data-on", !!row);
    if (!row) {
      current = { row: null, length: 0 };
      arrived(null, true);
      redraw();
      return;
    }
    const box = tree.getBoundingClientRect();
    const to = route(row, box);
    const first = !current.row;
    if (first || !options.travel() || reduced()) {
      anim = null;
      cancelAnimationFrame(frame);
      current = { row, length: Number.POSITIVE_INFINITY };
      wasHidden = null;
      redraw();
      wasHidden = cutAtY(to, to.limit ?? Number.POSITIVE_INFINITY) < pathLength(to) - 0.5;
      arrived(row, wasHidden);
      return;
    }
    const from = current.row ?? row;
    const a = route(from, box);
    const fromLength = Math.min(drawn, pathLength(a));
    const shared = Math.min(fromLength, sharedLength(a, to));
    const distance = fromLength - shared + (pathLength(to) - shared);
    arrived(null, true);
    if (distance < 0.5) {
      current = { row, length: Number.POSITIVE_INFINITY };
      redraw();
      arrived(row, false);
      land();
      return;
    }
    marker.removeAttribute("data-hollow");
    cancelAnimationFrame(frame);
    anim = {
      from,
      fromLength,
      to: row,
      t0: performance.now(),
      duration: clamp(200 + distance * 1.15, 280, 800),
    };
    frame = requestAnimationFrame(draw);
  }

  /** The deepest current row: on a Lab page, the scene being read rather than its page. */
  const findTarget = () => {
    let best: HTMLElement | null = null;
    for (const row of tree.querySelectorAll<HTMLElement>(`${ROW}[data-current]`)) {
      if (!best || depthOf(row) >= depthOf(best)) best = row;
    }
    return best;
  };

  const sizes = new ResizeObserver((entries) => {
    // A panel clips only while its rows do not fit (it is opening or closing), so an idle one
    // never cuts a focus ring, even one an app pushes outward. Set before paint.
    for (const { target } of entries) {
      if (target.matches(PANEL)) {
        target.toggleAttribute("data-clip", target.scrollHeight > target.clientHeight);
      }
    }
    measure();
    redraw();
  });
  const observe = () => {
    sizes.disconnect();
    sizes.observe(tree);
    for (const panel of tree.querySelectorAll(PANEL)) sizes.observe(panel);
  };
  const mutations = new MutationObserver((records) => {
    if (records.some((r) => r.type === "childList")) observe();
    const next = findTarget();
    if (next !== target) goTo(next);
    else redraw();
  });
  mutations.observe(tree, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-current", "data-glide-active", "hidden"],
  });

  measure();
  observe();
  goTo(findTarget());

  return {
    refresh() {
      measure();
      observe();
      const next = findTarget();
      if (next !== target) goTo(next);
      else redraw();
    },
    destroy() {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      mutations.disconnect();
      svg.replaceChildren();
      for (const timer of leaving.values()) clearTimeout(timer);
      for (const row of tree.querySelectorAll(ROW)) {
        row.removeAttribute("data-trail");
        row.removeAttribute("data-arrived");
        row.removeAttribute("data-leaving");
      }
      for (const panel of tree.querySelectorAll(PANEL)) panel.removeAttribute("data-clip");
    },
  };
}
