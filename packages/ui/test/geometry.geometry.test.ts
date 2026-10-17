import { describe, expect, onTestFinished, test } from "vitest";
import { concentric, insets, TOL, usedRadius } from "./geometry.ts";

// Self-tests for the geometry helpers in every engine of the geometry project.
function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

describe("geometry helpers", () => {
  test("insets measures all four sides", () => {
    const host = mount(
      '<div id="o" style="box-sizing:border-box;inline-size:100px;block-size:40px;padding:4px 6px"><div id="i" style="block-size:100%"></div></div>',
    );
    const i = insets(host.querySelector("#o") as Element, host.querySelector("#i") as Element);
    expect(i.top).toBeCloseTo(4, 1);
    expect(i.bottom).toBeCloseTo(4, 1);
    expect(i.left).toBeCloseTo(6, 1);
    expect(i.right).toBeCloseTo(6, 1);
  });

  test("usedRadius clamps a pill radius to half the height", () => {
    const host = mount(
      '<div style="inline-size:120px;block-size:30px;border-radius:9999px"></div>',
    );
    expect(usedRadius(host.firstElementChild as Element)).toBeCloseTo(15, 1);
  });

  test("usedRadius resolves percentages against the box", () => {
    const host = mount('<div style="inline-size:40px;block-size:40px;border-radius:25%"></div>');
    expect(usedRadius(host.firstElementChild as Element)).toBeCloseTo(10, 1);
  });

  test("concentric: outer radius = inner radius + padding (FR-10b)", () => {
    const host = mount(
      '<div id="o" style="box-sizing:border-box;inline-size:120px;padding:4px;border-radius:12px"><div id="i" style="block-size:30px;border-radius:8px"></div></div>',
    );
    const r = concentric(host.querySelector("#o") as Element, host.querySelector("#i") as Element);
    expect(r.delta).toBeLessThanOrEqual(TOL);
    expect(r.insetDelta).toBeLessThanOrEqual(TOL);
  });

  test("concentric measures pseudo-elements", () => {
    const style = document.createElement("style");
    style.textContent =
      ".gx-socket{position:relative;inline-size:120px;block-size:40px}.gx-socket::before{content:'';position:absolute;inset:0;border-radius:14px}.gx-control{position:absolute;inset:4px;border-radius:10px}";
    document.head.append(style);
    onTestFinished(() => style.remove());
    const host = mount('<div class="gx-socket"><div class="gx-control"></div></div>');
    const socket = host.firstElementChild as Element;
    const r = concentric({ el: socket, pseudo: "::before" }, socket.firstElementChild as Element);
    expect(r.delta).toBeLessThanOrEqual(TOL);
  });
});
