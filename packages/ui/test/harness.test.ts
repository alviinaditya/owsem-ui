import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { axeReport } from "./a11y.ts";
import { measureIdle, settle } from "./raf-counter.ts";

const root = document.documentElement;

function mount(html: string): HTMLElement {
  const main = document.createElement("main");
  main.innerHTML = html;
  document.body.append(main);
  onTestFinished(() => main.remove());
  return main;
}

/** Every --ow-* token declared in the loaded stylesheets, so new tokens are covered automatically. */
function tokenNames(): string[] {
  const names = new Set<string>();
  const visit = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        for (const property of rule.style) if (property.startsWith("--ow-")) names.add(property);
      }
      if ("cssRules" in rule) visit((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of document.styleSheets) visit(sheet.cssRules);
  return [...names].sort();
}

/** WCAG contrast ratio of two #rrggbb colors. */
function contrast(a = "", b = ""): number {
  const luminance = (hex: string) => {
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function themeOf(element: Element): Record<string, string> {
  const style = getComputedStyle(element);
  return Object.fromEntries([
    ["color-scheme", style.colorScheme],
    // Whitespace in a custom property is kept as written; a wrapped value is still the same value.
    ...tokenNames().map((name) => [name, style.getPropertyValue(name).trim().replace(/\s+/g, " ")]),
  ]);
}

describe("styles.css", () => {
  test("declares the layer order before any other rule (FR-8)", () => {
    const layerOrder = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .find((rule) => rule instanceof CSSLayerStatementRule);
    expect(layerOrder?.nameList).toEqual(["owsem.tokens", "owsem.components"]);
  });

  test("defines theme tokens on :root", () => {
    expect(tokenNames()).toEqual(expect.arrayContaining(["--ow-accent", "--ow-bg", "--ow-fg"]));
  });
});

describe("light, dark, and system themes (TK-5)", () => {
  test("system follows prefers-color-scheme and matches the explicit themes", async () => {
    onTestFinished(async () => {
      delete root.dataset.theme;
      await commands.setColorScheme("light");
    });

    await commands.setColorScheme("light");
    const light = themeOf(root);
    root.dataset.theme = "dark";
    const dark = themeOf(root);
    expect(light["color-scheme"]).toBe("light");
    expect(dark["color-scheme"]).toBe("dark");
    expect(dark["--ow-bg"]).not.toBe(light["--ow-bg"]);

    // The dark set is written twice (media query and [data-theme="dark"]); both must match.
    delete root.dataset.theme;
    await commands.setColorScheme("dark");
    expect(themeOf(root)).toEqual(dark);

    root.dataset.theme = "light";
    expect(themeOf(root)).toEqual(light);
  });

  test("the accent stands out from the background in both themes (WCAG 1.4.11)", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const tokens = themeOf(root);
      expect(contrast(tokens["--ow-accent"], tokens["--ow-bg"]), theme).toBeGreaterThanOrEqual(3);
    }
  });

  test("text reads at 4.5:1, and focus and control edges stand out at 3:1 (FR-12, DP-6)", () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    // [foreground, background, minimum ratio]
    const pairs = [
      ["--ow-fg", "--ow-bg", 4.5],
      ["--ow-muted", "--ow-bg", 4.5],
      ["--ow-muted", "--ow-well-bg", 4.5],
      ["--ow-muted", "--ow-raised-bg", 4.5],
      ["--ow-muted", "--ow-panel", 4.5],
      ["--ow-good", "--ow-bg", 4.5],
      ["--ow-warning", "--ow-bg", 4.5],
      ["--ow-critical", "--ow-bg", 4.5],
      ["--ow-on-accent", "--ow-accent", 4.5],
      ["--ow-on-primary", "--ow-primary-bg", 4.5],
      ["--ow-tooltip-fg", "--ow-tooltip-bg", 4.5],
      ["--ow-focus", "--ow-bg", 3],
      ["--ow-edge", "--ow-bg", 3],
      ["--ow-edge", "--ow-well-bg", 3],
    ] as const;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const tokens = themeOf(root);
      for (const [fg, bg, min] of pairs) {
        expect(contrast(tokens[fg], tokens[bg]), `${theme}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(
          min,
        );
      }
    }
  });

  test("the depth materials and springs are valid CSS (TK-7, FR-21)", () => {
    const tokens = themeOf(root);
    for (const material of ["panel", "raised", "well", "pressed", "socket", "primary"]) {
      const shadow = tokens[`--ow-${material}-shadow`] ?? "";
      expect(CSS.supports("box-shadow", shadow), material).toBe(true);
    }
    for (const spring of ["travel", "settle", "glide"]) {
      const easing = tokens[`--ow-spring-${spring}`] ?? "";
      expect(CSS.supports("transition-timing-function", easing), spring).toBe(true);
      expect(
        CSS.supports("transition-duration", tokens[`--ow-spring-${spring}-duration`] ?? ""),
      ).toBe(true);
    }
  });

  test("nested themes work in both directions", () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    root.dataset.theme = "light";
    const light = themeOf(root);
    root.dataset.theme = "dark";
    const dark = themeOf(root);

    const nested = mount('<div data-theme="light"></div>').firstElementChild as HTMLElement;
    expect(themeOf(nested)).toEqual(light);

    root.dataset.theme = "light";
    nested.dataset.theme = "dark";
    expect(themeOf(nested)).toEqual(dark);
  });
});

describe("axe harness", () => {
  test("reports nothing for semantic markup", async () => {
    const main = mount('<h1>OwsemUI</h1><button type="button">Save</button>');
    expect(await axeReport(main)).toEqual({ violations: [], contrastUnknown: [] });
  });

  test("canary: catches target-size and contrast over gradients", async () => {
    const small = "all:unset;display:inline-block;inline-size:10px;block-size:10px";
    const main = mount(
      `<button type="button" aria-label="Close" style="${small}"></button>` +
        `<button type="button" aria-label="Open" style="${small}"></button>` +
        '<p style="background:linear-gradient(#fff,#000);color:#888">text</p>',
    );
    const report = await axeReport(main);
    expect(report.violations.map((v) => v.id)).toContain("target-size");
    expect(report.contrastUnknown).toEqual(["p"]);
  });
});

describe("idle-cost harness", () => {
  test("an empty page runs no rAF and no animations", async () => {
    await settle();
    expect(await measureIdle(500)).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("canary: settle() fails when a rAF loop never stops", async () => {
    let running = true;
    onTestFinished(() => {
      running = false;
    });
    const loop = () => {
      if (running) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    await expect(settle({ maxMs: 500 })).rejects.toThrow(/did not stop/);
  });

  test("canary: settle() fails when an animation never stops", async () => {
    const box = mount("<div></div>").firstElementChild as HTMLElement;
    const animation = box.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 200,
      iterations: Number.POSITIVE_INFINITY,
    });
    onTestFinished(() => animation.cancel());
    await expect(settle({ maxMs: 500 })).rejects.toThrow(/did not stop/);
  });

  test("canary: measureIdle sees animations that start and end inside the window", async () => {
    const box = mount("<div></div>").firstElementChild as HTMLElement;
    await settle();
    const timer = setTimeout(() => box.animate([{ opacity: 0 }, { opacity: 1 }], 50), 100);
    onTestFinished(() => clearTimeout(timer));
    const idle = await measureIdle(400);
    expect(idle.runningAnimations).toContain("WAAPI");
  });
});
