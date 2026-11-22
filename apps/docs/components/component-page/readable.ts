let paint: CanvasRenderingContext2D | null | undefined;

/** A color as #RRGGBB, or rgba() when see-through; `probe` resolves it in the preview's scheme. */
export function readable(value: string, probe: HTMLElement): string {
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
