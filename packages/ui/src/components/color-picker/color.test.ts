import { describe, expect, test } from "vitest";
import {
  formatColor,
  type HSVA,
  hslaToHsva,
  hsvaToHsla,
  hsvaToRgba,
  keepHue,
  parseColor,
  rgbaToHex,
  rgbaToHsva,
  toColorResult,
} from "./color";

const hex = (input: string) => {
  const color = parseColor(input);
  return color ? rgbaToHex(hsvaToRgba(color)) : null;
};

describe("color math", () => {
  test("rgb survives a round trip through hsv, for every 15th step of each channel", () => {
    for (let r = 0; r <= 255; r += 15) {
      for (let g = 0; g <= 255; g += 15) {
        for (let b = 0; b <= 255; b += 15) {
          const rgba = { r, g, b, a: 1 };
          expect(hsvaToRgba(rgbaToHsva(rgba))).toEqual(rgba);
        }
      }
    }
  });

  test("hsl survives a round trip through hsv", () => {
    for (const h of [0, 47, 180, 359]) {
      for (const s of [0, 12.5, 50, 100]) {
        for (const l of [0, 3, 50, 97, 100]) {
          const back = hsvaToHsla(hslaToHsva({ h, s, l, a: 0.4 }));
          expect(back.h).toBe(h);
          expect(back.l).toBeCloseTo(l, 9);
          // Black and white have no saturation to keep.
          if (l > 0 && l < 100) expect(back.s).toBeCloseTo(s, 9);
          expect(back.a).toBe(0.4);
        }
      }
    }
  });

  test("hex and alpha survive formatting and parsing", () => {
    for (const value of ["#000000", "#ffffff", "#7c6ab8", "#7c6ab800", "#7c6ab880", "#0a0b0cfe"]) {
      const color = parseColor(value);
      if (!color) throw new Error(value);
      expect(formatColor(color, "hex")).toBe(value);
    }
  });

  test("keeps the hue of grays, and the saturation of black", () => {
    const prev: HSVA = { h: 210, s: 60, v: 80, a: 1 };
    expect(keepHue({ h: 0, s: 0, v: 50, a: 1 }, prev)).toEqual({ h: 210, s: 0, v: 50, a: 1 });
    expect(keepHue({ h: 0, s: 0, v: 0, a: 1 }, prev)).toEqual({ h: 210, s: 60, v: 0, a: 1 });
    expect(keepHue({ h: 30, s: 40, v: 50, a: 1 }, prev)).toEqual({ h: 30, s: 40, v: 50, a: 1 });
  });

  test("a result holds every model, rounded as the fields show them", () => {
    const color = parseColor("#7c6ab8");
    if (!color) throw new Error("no color");
    expect(toColorResult(color)).toEqual({
      hex: "#7c6ab8",
      rgb: { r: 124, g: 106, b: 184, a: 1 },
      hsl: { h: 254, s: 35, l: 57, a: 1 },
      hsv: { h: 254, s: 42, v: 72, a: 1 },
    });
  });
});

describe("parseColor", () => {
  test("reads hex in every length, with or without #, in any case", () => {
    expect(hex("#f00")).toBe("#ff0000");
    expect(hex("F00")).toBe("#ff0000");
    expect(hex("#f008")).toBe("#ff000088");
    expect(hex("  #7C6AB8 ")).toBe("#7c6ab8");
    expect(hex("7c6ab880")).toBe("#7c6ab880");
  });

  test("reads rgb() with commas or spaces, alpha as a number or a percentage", () => {
    expect(hex("rgb(124, 106, 184)")).toBe("#7c6ab8");
    expect(hex("rgba(124, 106, 184, 0.5)")).toBe("#7c6ab880");
    expect(hex("rgb(124 106 184 / 50%)")).toBe("#7c6ab880");
    expect(hex("rgb(100% 0% 50%)")).toBe("#ff0080");
    // Out of range is clamped.
    expect(hex("rgb(300, -4, 0, 2)")).toBe("#ff0000");
  });

  test("reads hsl() with any hue unit, wrapping the hue", () => {
    expect(hex("hsl(120, 100%, 50%)")).toBe("#00ff00");
    expect(hex("hsl(120deg 100% 50%)")).toBe("#00ff00");
    expect(hex("hsl(0.5turn 100% 50%)")).toBe("#00ffff");
    expect(hex(`hsl(${Math.PI}rad 100% 50%)`)).toBe("#00ffff");
    expect(hex("hsla(-120, 100%, 50%, 0.25)")).toBe("#0000ff40");
  });

  test("rejects anything else", () => {
    for (const input of [
      "",
      "#12",
      "#12345",
      "#ggg",
      "red",
      "rgb(1, 2)",
      "hsl(a, b, c)",
      "hsl(1foo 2% 3%)",
      "rgb(1, 2, 3, 4, 5)",
    ]) {
      expect(parseColor(input)).toBeNull();
    }
  });
});

describe("formatColor", () => {
  const parsed = parseColor("#7c6ab8");
  if (!parsed) throw new Error("no color");
  const color = { ...parsed, a: 0.5 };

  test("writes hex, rgb, and hsl, with alpha only when translucent", () => {
    expect(formatColor(color)).toBe("#7c6ab880");
    expect(formatColor(color, "rgb")).toBe("rgba(124, 106, 184, 0.5)");
    expect(formatColor(color, "hsl")).toBe("hsla(254, 35%, 57%, 0.5)");
    expect(formatColor({ ...color, a: 1 }, "rgb")).toBe("rgb(124, 106, 184)");
    expect(formatColor({ ...color, a: 1 }, "hsl")).toBe("hsl(254, 35%, 57%)");
  });

  test("drops alpha when asked", () => {
    expect(formatColor(color, "hex", false)).toBe("#7c6ab8");
    expect(formatColor(color, "rgb", false)).toBe("rgb(124, 106, 184)");
    expect(formatColor(color, "hsl", false)).toBe("hsl(254, 35%, 57%)");
  });
});
