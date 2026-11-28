/** The marker of a Table of Contents on its path, as screen points: where its dash starts and ends. */
export function run(marker: Element) {
  if (!(marker instanceof SVGPathElement)) throw new Error("the marker is a path");
  const style = getComputedStyle(marker);
  const from = -Number.parseFloat(style.strokeDashoffset);
  const len = Number.parseFloat(style.strokeDasharray);
  const ctm = marker.getScreenCTM();
  if (!ctm) throw new Error("not rendered");
  const at = (n: number) => {
    const point = marker.getPointAtLength(n);
    return new DOMPoint(point.x, point.y).matrixTransform(ctm);
  };
  return { from, len, start: at(from), end: at(from + len) };
}
