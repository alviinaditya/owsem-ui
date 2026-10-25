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
function resolveShadow(value: string): string {
  const probe = document.createElement("span");
  probe.style.boxShadow = value;
  document.body.append(probe);
  const shadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  return shadow;
}

describe("Kbd", () => {
  test("renders a kbd with its text", async () => {
    const [key] = await mount(<Kbd>⌘K</Kbd>);
    expect(key?.tagName).toBe("KBD");
    expect(key?.textContent).toBe("⌘K");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const ref = createRef<HTMLElement>();
    const [byString, rendered] = await mount(
      <>
        <Kbd ref={ref} className="mine" style={{ marginInline: "3px" }} title="Search">
          K
        </Kbd>
        <Kbd render={<span />}>Esc</Kbd>
      </>,
    );
    expect(ref.current).toBe(byString);
    expect(byString?.className).toBe("ow-kbd mine");
    expect(byString?.style.marginInline).toBe("3px");
    expect(byString?.title).toBe("Search");
    expect(rendered?.tagName).toBe("SPAN");
    expect(rendered?.className).toBe("ow-kbd");
  });

  test("draws a raised keycap from the theme tokens, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [key] = await mount(<Kbd>K</Kbd>);
    if (!key) throw new Error("no key");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(key);
      expect(style.backgroundColor).toBe(resolveColor("var(--ow-raised-bg)"));
      expect(style.boxShadow).toBe(resolveShadow("var(--ow-raised-shadow)"));
      expect(style.color).toBe(resolveColor("var(--ow-muted)"));
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

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const [key] = await mount(
      <Kbd style={{ "--ow-raised-bg": "rgb(255, 0, 0)" } as CSSProperties}>K</Kbd>,
    );
    if (!key) throw new Error("no key");
    expect(getComputedStyle(key).backgroundColor).toBe("rgb(255, 0, 0)");
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
