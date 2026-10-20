"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { withPrefix } from "@/lib/token-setup";
import { useTokenSetup } from "../token-setup";
import type { Part } from "./types";

const CHIP_H = 24;
const CHIP_GAP = 30; // from one chip's middle to the next
const EDGE = 16; // chips keep this far from the stage's top and bottom
const COLUMN_GAP = 28; // from the demo to the chips

let paint: CanvasRenderingContext2D | null | undefined;

/** A color as #RRGGBB, or rgba() when see-through; `probe` resolves it in the stage's scheme. */
function readable(value: string, probe: HTMLElement): string {
  if (!value || !CSS.supports("color", value)) return value;
  probe.style.color = value;
  const resolved = getComputedStyle(probe).color;
  paint ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!paint) return resolved;
  paint.clearRect(0, 0, 1, 1);
  paint.fillStyle = resolved;
  paint.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = paint.getImageData(0, 0, 1, 1).data;
  if (a === 255) {
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  }
  return `rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(2))})`;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface InspectProps {
  parts: readonly Part[];
  lang: Lang;
  labels: Dictionary["lab"];
  selected: string;
  onSelect: (name: string) => void;
  bodyRef: RefObject<HTMLDivElement | null>;
  demoRef: RefObject<HTMLDivElement | null>;
  /** Where the part card goes: beside the demo, across the stage under it, or nowhere. */
  card: "side" | "below" | "none";
  /** Reports the tallest part card, which the stage keeps room for. */
  onCardHeight: (height: number) => void;
  /** A narrow stage: the names and the card docked under the demo. */
  compact: boolean;
  /** Docked, the names alone (the docs sheet is open and explains the parts). */
  brief: boolean;
  /** Reports the dock's height, which the stage keeps room for. */
  onDockHeight: (height: number) => void;
}

/** One part's name, note, and tokens with their values in use. */
function PartCard({ part, lang, values }: { part: Part; lang: Lang; values: readonly string[] }) {
  const { prefix } = useTokenSetup();
  return (
    <>
      <p className="lab-part-card-name">{part.name}</p>
      <p className="lab-part-card-note">{part.note[lang]}</p>
      {part.tokens ? (
        <ul>
          {Object.keys(part.tokens).map((token, i) => {
            const value = values[i] ?? "";
            const color = value.startsWith("#") || value.startsWith("rgba");
            return (
              <li key={token}>
                <span
                  className="lab-part-card-swatch"
                  data-empty={color ? undefined : ""}
                  style={color ? { background: value } : undefined}
                />
                <code>{withPrefix(token, prefix)}</code>
                <span className="lab-part-card-value" title={value}>
                  {value}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

/**
 * Inspect (DS-3): an outline on each part of the live demo, the part names in a column beside it,
 * and leader lines between them; the selected part's card lists its public tokens with their live
 * values. Positions follow the demo every frame while Inspect is on, written straight to the DOM.
 * On a narrow stage the names and the card dock under the demo instead, without leader lines.
 */
export function Inspect({
  parts,
  lang,
  labels,
  selected,
  onSelect,
  bodyRef,
  demoRef,
  card,
  onCardHeight,
  compact,
  brief,
  onDockHeight,
}: InspectProps) {
  const sizer = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const boxes = useRef<(HTMLSpanElement | null)[]>([]);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  const leaders = useRef<(SVGGElement | null)[]>([]);
  const probe = useRef<HTMLSpanElement>(null);
  const part = parts.find((p) => p.name === selected) ?? parts[0];
  const [values, setValues] = useState<string[]>([]);

  useEffect(() => {
    let frame = 0;
    let last = "";
    let lastValues = "";
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const body = bodyRef.current;
      const demo = demoRef.current;
      if (!body || !demo) return;
      const stage = body.getBoundingClientRect();
      const els = parts.map((p) => demo.querySelector(p.selector));
      const rects = els.map((el): Box | null => {
        const r = el?.getBoundingClientRect();
        return r && (r.width || r.height)
          ? { x: r.left - stage.left, y: r.top - stage.top, w: r.width, h: r.height }
          : null;
      });
      const edge = demo.getBoundingClientRect().right - stage.left;
      const key = JSON.stringify([compact, stage.width, stage.height, edge, rects]);
      if (key === last) return;
      last = key;

      const widest = Math.max(0, ...chips.current.map((chip) => chip?.offsetWidth ?? 0));
      const column = Math.min(edge + COLUMN_GAP, stage.width - widest - 8);
      // Each chip wants the middle of a small part, or near the top of a large one; then they
      // stack in that order, a chip apart, inside the stage.
      const order = rects
        .map((r, i) => ({ i, r, y: r ? (r.h <= 40 ? r.y + r.h / 2 : r.y + 14) : 0 }))
        .filter((item): item is { i: number; r: Box; y: number } => item.r !== null)
        .sort((a, b) => a.y - b.y || a.i - b.i);
      for (let k = 1; k < order.length; k++) {
        const item = order[k];
        const prev = order[k - 1];
        if (item && prev) item.y = Math.max(item.y, prev.y + CHIP_GAP);
      }
      for (let k = order.length - 1; k >= 0; k--) {
        const item = order[k];
        if (!item) continue;
        const next = order[k + 1];
        const max = next ? next.y - CHIP_GAP : stage.height - EDGE - CHIP_H / 2;
        item.y = Math.max(EDGE + CHIP_H / 2, Math.min(item.y, max));
      }

      // A part missing from the demo (a closed panel's insides, say) drops out until it is back.
      parts.forEach((_, i) => {
        const display = order.some((item) => item.i === i) ? "" : "none";
        for (const el of [boxes.current[i], chips.current[i], leaders.current[i]]) {
          if (el) el.style.display = display;
        }
      });
      order.forEach(({ i, r, y }, k) => {
        const box = boxes.current[i];
        if (box) {
          box.style.transform = `translate(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px)`;
          box.style.width = `${r.w.toFixed(1)}px`;
          box.style.height = `${r.h.toFixed(1)}px`;
        }
        // Docked, the names sit in their row and need no lines.
        if (compact) return;
        const chip = chips.current[i];
        if (chip)
          chip.style.transform = `translate(${column.toFixed(1)}px, ${(y - CHIP_H / 2).toFixed(1)}px)`;
        // From the part's end edge, level with the chip where the part reaches that far; else
        // across, down or up, and across again. The bends stagger so lines never run together.
        const ax = r.x + r.w;
        const ay = r.h > 8 ? Math.max(r.y + 4, Math.min(y, r.y + r.h - 4)) : r.y + r.h / 2;
        const bend = Math.max(ax + 6, column - 8 - (order.length - 1 - k) * 3);
        const d =
          Math.abs(ay - y) < 0.5
            ? `M${ax.toFixed(1)} ${y.toFixed(1)}H${column.toFixed(1)}`
            : `M${ax.toFixed(1)} ${ay.toFixed(1)}H${bend.toFixed(1)}V${y.toFixed(1)}H${column.toFixed(1)}`;
        const leader = leaders.current[i];
        leader?.querySelector("path")?.setAttribute("d", d);
        leader
          ?.querySelector("circle")
          ?.setAttribute("transform", `translate(${ax.toFixed(1)} ${ay.toFixed(1)})`);
      });

      // The card's token values, read where the part is; rendered only when they or the color
      // scheme change.
      const at = part ? els[parts.indexOf(part)] : null;
      const style = at ? getComputedStyle(at) : null;
      const raw = Object.values(part?.tokens ?? {}).map(
        (from) => style?.getPropertyValue(from).trim() ?? "",
      );
      const scheme = `${style?.colorScheme}:${matchMedia("(prefers-color-scheme: dark)").matches}`;
      const valuesKey = `${raw.join("\n")}|${scheme}`;
      if (valuesKey !== lastValues && probe.current) {
        lastValues = valuesKey;
        const resolve = probe.current;
        setValues(raw.map((value) => readable(value, resolve)));
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [parts, part, compact, bodyRef, demoRef]);

  useEffect(() => {
    const el = dock.current;
    if (!compact || !el) return;
    const observer = new ResizeObserver(() => onDockHeight(el.offsetHeight));
    observer.observe(el);
    return () => {
      observer.disconnect();
      onDockHeight(0);
    };
  }, [compact, onDockHeight]);

  useEffect(() => {
    const el = sizer.current;
    if (!el) return;
    const observer = new ResizeObserver(() => onCardHeight(el.offsetHeight));
    observer.observe(el);
    return () => {
      observer.disconnect();
      onCardHeight(0);
    };
  }, [onCardHeight]);

  const names = parts.map((p, i) => (
    <button
      key={p.name}
      ref={(el) => {
        chips.current[i] = el;
      }}
      type="button"
      className="lab-ichip"
      aria-pressed={p === part}
      onClick={() => onSelect(p.name)}
      // Beside the demo a mouse picks by pointing. Docked, the names sit close together over the
      // card, so only a click picks.
      onPointerEnter={(event) => {
        if (!compact && event.pointerType === "mouse") onSelect(p.name);
      }}
    >
      {p.name}
    </button>
  ));

  return (
    <div className="lab-inspect">
      <span ref={probe} hidden />
      {compact ? null : (
        <svg className="lab-inspect-lines" aria-hidden="true">
          {parts.map((p, i) => (
            <g
              key={p.name}
              ref={(el) => {
                leaders.current[i] = el;
              }}
              data-on={p === part ? "" : undefined}
            >
              <path />
              <circle r="2.5" />
            </g>
          ))}
        </svg>
      )}
      {parts.map((p, i) => (
        <span
          key={p.name}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          className="lab-ibox"
          data-on={p === part ? "" : undefined}
          aria-hidden="true"
        />
      ))}
      {compact ? (
        <div ref={dock} className="lab-inspect-dock" data-brief={brief ? "" : undefined}>
          {/* The names wrap, so none hides off the edge. */}
          <fieldset className="lab-ichips">
            <legend className="visually-hidden">{labels.parts}</legend>
            {names}
          </fieldset>
          {/* Every card in one cell, the selected one shown, so the dock keeps one height. */}
          {brief || !part ? null : (
            <div className="lab-inspect-cards">
              {parts.map((p) => (
                <section
                  key={p.name}
                  className="lab-part-card"
                  data-place="dock"
                  data-off={p === part ? undefined : ""}
                  aria-label={p.name}
                >
                  <PartCard part={p} lang={lang} values={p === part ? values : []} />
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <fieldset className="lab-ichips">
            <legend className="visually-hidden">{labels.parts}</legend>
            {names}
          </fieldset>
          {card !== "none" && part ? (
            <section className="lab-part-card" data-place={card} aria-label={part.name}>
              <PartCard part={part} lang={lang} values={values} />
            </section>
          ) : null}
        </>
      )}
      {/* Every card as it would sit under the demo, in one grid cell: as tall as the tallest. */}
      <div ref={sizer} className="lab-part-card-sizer" aria-hidden="true" inert>
        {parts.map((p) => (
          <div key={p.name} className="lab-part-card" data-place="below">
            <PartCard part={p} lang={lang} values={[]} />
          </div>
        ))}
      </div>
    </div>
  );
}
