import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Kbd } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(ui);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-kbd")];
}

/** Resolves a color (e.g. `var(--ow-raised-bg)`) to its computed rgb() inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Resolves a shadow token to its computed value. */
function _resolveShadow(value: string): string {
  const probe = document.createElement("span");
  probe.style.boxShadow = value;
  document.body.append(probe);
  const shadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  return shadow;
}

const KEY = "color-mix(in oklab, var(--ow-fg) 8%, transparent)";

describe("Kbd", () => {
  test("renders a kbd with its text", async () => {
    const [key] = await mount(<Kbd>⌘K</Kbd>);
    expect(key?.tagName).toBe("KBD");
    expect(key?.textContent).toBe("⌘K");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const ref = createRef<HTMLElement>();
    const [plain, rendered] = await mount(
      <>
        <Kbd ref={ref} className="mine" style={{ marginInline: "3px" }} title="Search">
          K
        </Kbd>
        <Kbd render={<span />}>Esc</Kbd>
      </>,
    );
    expect(ref.current).toBe(plain);
    expect(plain?.className).toBe("ow-kbd mine");
    expect(plain?.style.marginInline).toBe("3px");
    expect(plain?.title).toBe("Search");
    expect(rendered?.tagName).toBe("SPAN");
    expect(rendered?.className).toBe("ow-kbd");
  });

  test("draws a keycap as a small key, a tint of the text color with no shadow, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [key] = await mount(<Kbd>K</Kbd>);
    if (!key) throw new Error("no key");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(key);
      expect(style.backgroundColor).toBe(resolveColor(KEY));
      expect(style.boxShadow).toBe("none");
      expect(style.color).toBe(
        resolveColor("color-mix(in oklab, var(--ow-muted) 70%, var(--ow-fg))"),
      );
    }
  });

  test("takes its size from the text around it, in the same proportions", async () => {
    const keys = await mount(
      <>
        <p style={{ fontSize: 12 }}>
          <Kbd>K</Kbd>
        </p>
        <p style={{ fontSize: 16 }}>
          <Kbd>K</Kbd>
        </p>
      </>,
    );
    const [small, large] = keys.map((key) => key.getBoundingClientRect());
    if (!small || !large) throw new Error("no keys");
    expect(Number.parseFloat(getComputedStyle(keys[0] as Element).fontSize)).toBe(9);
    expect(Number.parseFloat(getComputedStyle(keys[1] as Element).fontSize)).toBe(12);
    expect(large.height / small.height).toBeCloseTo(16 / 12, 1);
    // A single key is at least square-ish: 1.75em wide.
    expect(small.width).toBeGreaterThanOrEqual(1.75 * 9 - 0.01);
  });

  test("a capital label sits in the middle of the key, as far from the top as from the bottom", async () => {
    // Trimming needs the browser to know text-box; where it does not, the line box centers it.
    if (!CSS.supports("text-box", "trim-both cap alphabetic")) return;
    const [key] = await mount(
      <p style={{ fontSize: 16 }}>
        <Kbd>K</Kbd>
      </p>,
    );
    if (!key?.firstChild) throw new Error("no key");
    const style = getComputedStyle(key);
    const canvas = document.createElement("canvas").getContext("2d");
    if (!canvas) throw new Error("no canvas");
    canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const glyph = canvas.measureText("K");
    const range = document.createRange();
    range.selectNodeContents(key.firstChild);
    const text = range.getBoundingClientRect();
    const box = key.getBoundingClientRect();
    const baseline = text.top + glyph.fontBoundingBoxAscent;
    const above = baseline - glyph.actualBoundingBoxAscent - box.top;
    const below = box.bottom - baseline - glyph.actualBoundingBoxDescent;
    expect(Math.abs(above - below)).toBeLessThanOrEqual(0.5);
    // Trimmed, the padding alone gives the 1.5em height.
    expect(box.height).toBeCloseTo(1.5 * Number.parseFloat(style.fontSize), 1);
  });

  test("a key with an icon stays flex: the icon and the text keep their gap", async () => {
    const [key] = await mount(
      <Kbd>
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" />
        Shift
      </Kbd>,
    );
    if (!key) throw new Error("no key");
    const style = getComputedStyle(key);
    expect(style.display).toBe("inline-flex");
    expect(style.columnGap).toBe(`${0.25 * Number.parseFloat(style.fontSize)}px`);
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const [key] = await mount(
      <Kbd style={{ "--ow-fg": "rgb(255, 0, 0)" } as CSSProperties}>K</Kbd>,
    );
    if (!key) throw new Error("no key");
    expect(getComputedStyle(key).backgroundColor).not.toBe(resolveColor(KEY));
  });

  test("keeps its edge in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const [key] = await mount(<Kbd>K</Kbd>);
    if (!key) throw new Error("no key");
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const style = getComputedStyle(key);
    expect(style.outlineWidth).toBe("1px");
    expect(style.outlineColor).not.toBe(getComputedStyle(document.body).backgroundColor);
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <p>
          Press <Kbd>⌘K</Kbd> to search, or <Kbd>Esc</Kbd> to close.
        </p>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await mount(<Kbd>K</Kbd>);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

test("every part has its data-slot", async () => {
  const screen = await render(<Kbd>K</Kbd>);
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual(["kbd"]);
});
