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
