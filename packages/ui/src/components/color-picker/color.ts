/** Hue 0 to 360, saturation and value (brightness) 0 to 100, alpha 0 to 1. */
export interface HSVA {
  h: number;
  s: number;
  v: number;
  a: number;
}

/** Red, green, and blue 0 to 255, alpha 0 to 1. */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Hue 0 to 360, saturation and lightness 0 to 100, alpha 0 to 1. */
export interface HSLA {
  h: number;
  s: number;
  l: number;
  a: number;
}

export type ColorFormat = "hex" | "rgb" | "hsl";

/** A color in every model, rounded as the inputs show it (hex and rgb are exact). */
export interface ColorResult {
  hex: string;
  rgb: RGBA;
  hsl: HSLA;
  hsv: HSVA;
}

export const clamp = (n: number, min = 0, max = 1): number => Math.min(max, Math.max(min, n));

const round = (n: number, digits = 0) => {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

export function hsvaToRgba({ h, s, v, a }: HSVA): RGBA {
  const sat = s / 100;
  const val = v / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return round((val - val * sat * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return { r: f(5), g: f(3), b: f(1), a };
}

export function rgbaToHsva({ r, g, b, a }: RGBA): HSVA {
  const max = Math.max(r, g, b) / 255;
  const d = max - Math.min(r, g, b) / 255;
  let h = 0;
  if (d) {
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? (d / max) * 100 : 0, v: max * 100, a };
}

export function hsvaToHsla({ h, s, v, a }: HSVA): HSLA {
  const val = v / 100;
  const l = val * (1 - s / 200);
  const sl = l === 0 || l === 1 ? 0 : (val - l) / Math.min(l, 1 - l);
  return { h, s: sl * 100, l: l * 100, a };
}

export function hslaToHsva({ h, s, l, a }: HSLA): HSVA {
  const light = l / 100;
  const v = light + (s / 100) * Math.min(light, 1 - light);
  return { h, s: v ? (1 - light / v) * 200 : 0, v: v * 100, a };
}

const hex2 = (n: number) => round(n).toString(16).padStart(2, "0");

/** `#rrggbb`, or `#rrggbbaa` when the color is translucent (or `alpha` says so). */
export function rgbaToHex({ r, g, b, a }: RGBA, alpha: boolean = round(a * 255) < 255): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${alpha ? hex2(a * 255) : ""}`;
}

// Degrees per hue unit; a bare number is degrees.
const HUE_UNITS: Record<string, number> = { deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 };

/**
 * Reads `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` (the `#` is optional), `rgb()` and `hsl()` with
 * commas or spaces and an optional alpha, as a number or a percentage. Returns null otherwise.
 */
export function parseColor(input: string): HSVA | null {
  const text = input.trim().toLowerCase();

  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(text)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex;
    const byte = (i: number) => Number.parseInt(full.slice(i, i + 2), 16);
    return rgbaToHsva({
      r: byte(0),
      g: byte(2),
      b: byte(4),
      a: full.length === 8 ? byte(6) / 255 : 1,
    });
  }

  const fn = /^(rgba?|hsla?)\((.*)\)$/.exec(text);
  if (!fn?.[1] || fn[2] === undefined) return null;
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const nums = parts.map((p) => Number.parseFloat(p));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const [p0 = "", p1 = "", p2 = "", p3] = parts;
  const [n0 = 0, n1 = 0, n2 = 0, n3 = 1] = nums;
  const percent = (p: string) => p.endsWith("%");
  const a = clamp(p3 !== undefined && percent(p3) ? n3 / 100 : n3);

  if (fn[1].startsWith("rgb")) {
    const channel = (p: string, n: number) => clamp(percent(p) ? (n / 100) * 255 : n, 0, 255);
    return rgbaToHsva({ r: channel(p0, n0), g: channel(p1, n1), b: channel(p2, n2), a });
  }
  const unit = HUE_UNITS[/[a-z]+$/.exec(p0)?.[0] ?? "deg"];
  if (unit === undefined) return null;
  return hslaToHsva({
    h: (((n0 * unit) % 360) + 360) % 360,
    s: clamp(n1, 0, 100),
    l: clamp(n2, 0, 100),
    a,
  });
}

/** Writes a color as hex (`#rrggbb[aa]`), `rgb()`/`rgba()`, or `hsl()`/`hsla()`. */
export function formatColor(color: HSVA, format: ColorFormat = "hex", alpha = true): string {
  if (format === "hex") return rgbaToHex(hsvaToRgba({ ...color, a: alpha ? color.a : 1 }));
  const a = alpha ? round(color.a, 2) : 1;
  if (format === "rgb") {
    const { r, g, b } = hsvaToRgba(color);
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  }
  const { h, s, l } = hsvaToHsla(color);
  const body = `${round(h) % 360}, ${round(s)}%, ${round(l)}%`;
  return a < 1 ? `hsla(${body}, ${a})` : `hsl(${body})`;
}

export function toColorResult(color: HSVA): ColorResult {
  const rgb = hsvaToRgba(color);
  const hsl = hsvaToHsla(color);
  return {
    hex: rgbaToHex(rgb),
    rgb,
    hsl: { h: round(hsl.h), s: round(hsl.s), l: round(hsl.l), a: hsl.a },
    hsv: { h: round(color.h), s: round(color.s), v: round(color.v), a: color.a },
  };
}

/** Keeps the hue (and, on black, the saturation) of `prev` where `next` has none, so grays do not jump. */
export function keepHue(next: HSVA, prev: HSVA): HSVA {
  if (next.v === 0) return { ...next, h: prev.h, s: prev.s };
  if (next.s === 0) return { ...next, h: prev.h };
  return next;
}
