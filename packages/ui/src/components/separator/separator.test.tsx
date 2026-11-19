import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Separator } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(ui);
  return [...screen.container.querySelectorAll<HTMLElement>('[role="separator"]')];
}

/** Resolves a color (e.g. `var(--ow-line)`) to its computed rgb() inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

describe("Separator", () => {
  test("renders Base UI's separator with its orientation", async () => {
    const [horizontal, vertical] = await mount(
      <>
        <Separator />
        <Separator orientation="vertical" />
      </>,
    );
    expect(horizontal?.getAttribute("aria-orientation")).toBe("horizontal");
    expect(horizontal?.dataset.orientation).toBe("horizontal");
    expect(vertical?.getAttribute("aria-orientation")).toBe("vertical");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const ref = createRef<HTMLDivElement>();
    const [byString, byFunction, rendered] = await mount(
      <>
        <Separator ref={ref} className="mine" style={{ marginBlock: "3px" }} />
        <Separator orientation="vertical" className={(state) => `is-${state.orientation}`} />
        <Separator render={<span />} />
      </>,
    );
    expect(ref.current).toBe(byString);
    expect(byString?.className).toBe("ow-separator mine");
    expect(byString?.style.marginBlock).toBe("3px");
    expect(byFunction?.className).toBe("ow-separator is-vertical");
    expect(rendered?.tagName).toBe("SPAN");
    expect(rendered?.className).toBe("ow-separator");
  });

  test("draws one hairline in the line color, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [line] = await mount(<Separator />);
    if (!line) throw new Error("no separator");

    const colors: string[] = [];
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(line);
      expect(style.borderBlockStartWidth).toBe("1px");
      expect(style.borderBlockEndWidth).toBe("0px");
      expect(style.borderInlineStartWidth).toBe("0px");
      expect(style.borderBlockStartColor).toBe(resolveColor("var(--ow-line)"));
      colors.push(style.borderBlockStartColor);
    }
    expect(colors[0]).not.toBe(colors[1]);
  });

  test("stretches only along its length in flex and grid containers", async () => {
    const lines = await mount(
      <>
        <div style={{ display: "flex", blockSize: "40px" }}>
          <span>A</span>
          <Separator orientation="vertical" />
          <span>B</span>
        </div>
        <div style={{ display: "grid", gridAutoFlow: "column", inlineSize: "600px" }}>
          <span>A</span>
          <Separator orientation="vertical" />
          <span>B</span>
        </div>
        <div style={{ display: "grid", blockSize: "300px", inlineSize: "400px" }}>
          <p>A</p>
          <Separator />
          <p>B</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Separator />
        </div>
      </>,
    );
    const [flexRow, gridColumn, gridRows, flexColumn] = lines.map((line) => {
      const { width, height } = line.getBoundingClientRect();
      return { width, height };
    });
    expect(flexRow).toEqual({ width: 1, height: 40 });
    expect(gridColumn?.width).toBe(1);
    expect(gridRows).toEqual({ width: 400, height: 1 });
    expect(flexColumn?.width).toBe(document.body.clientWidth);
  });

  test("follows the text direction (FR-16)", async () => {
    const [line] = await mount(
      <div dir="rtl" style={{ display: "flex" }}>
        <Separator orientation="vertical" />
      </div>,
    );
    if (!line) throw new Error("no separator");
    const style = getComputedStyle(line);
    // Inline start is the right side in RTL.
    expect(style.borderRightWidth).toBe("1px");
    expect(style.borderRightColor).toBe(resolveColor("var(--ow-line)"));
    expect(style.borderLeftWidth).toBe("0px");
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const [line] = await mount(
      <Separator style={{ "--ow-line": "rgb(255, 0, 0)" } as CSSProperties} />,
    );
    if (!line) throw new Error("no separator");
    expect(getComputedStyle(line).borderBlockStartColor).toBe("rgb(255, 0, 0)");
  });

  test("stays visible in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const [line] = await mount(<Separator />);
    if (!line) throw new Error("no separator");
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const style = getComputedStyle(line);
    expect(style.borderBlockStartWidth).toBe("1px");
    expect(style.borderBlockStartColor).toBe(resolveColor("CanvasText"));
    expect(style.borderBlockStartColor).not.toBe(getComputedStyle(document.body).backgroundColor);
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <p>Above</p>
        <Separator />
        <p>Below</p>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await mount(<Separator />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
