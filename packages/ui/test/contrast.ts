import { expect } from "vitest";

/** Paints `colors` in order on one pixel: the composite of a translucent tint over a page. */
export function composite(...colors: string[]): number[] {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("no canvas");
  for (const color of colors) {
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
  }
  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}

/** WCAG contrast ratio of two rgb triplets. */
export function contrast(a: number[], b: number[]): number {
  const lum = (rgb: number[]) => {
    const [r = 0, g = 0, b = 0] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** The tint a hovered solid fill takes in both themes: black darkens any fill. */
export const SOLID_HOVER_TINT = "color-mix(in oklab, black 5%, transparent)";

/** A color (e.g. `var(--ow-accent)`) as its computed color string. */
export function resolvedColor(value: string): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** The painted colors (rgb triplets) of one solid fill and its label. */
export interface SolidPaint {
  resting: number[];
  hovered: number[];
  held: number[];
  text: number[];
  /** What the fill painted when hover laid the `--ow-hover` tint over it, as before. */
  before: number[];
}

/**
 * One solid fill, hovered, in `theme`: the label keeps 4.5:1 on it, it differs from the resting
 * and the held fill, and in light it is the very color `--ow-hover` painted. Returns the ratios
 * (now, before) for the record.
 */
export function checkSolidHover(label: string, theme: string, paint: SolidPaint): number[] {
  const now = contrast(paint.text, paint.hovered);
  expect(now, `${label} ${theme}`).toBeGreaterThanOrEqual(4.5);
  expect(paint.hovered, `${label} ${theme} vs resting`).not.toEqual(paint.resting);
  expect(paint.hovered, `${label} ${theme} vs held`).not.toEqual(paint.held);
  if (theme === "light") expect(paint.hovered, `${label} light`).toEqual(paint.before);
  return [now, contrast(paint.text, paint.before)];
}
