import { CSPProvider } from "@base-ui/react/csp-provider";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { ScrollArea } from "./index";

const root = document.documentElement;

const size = { inlineSize: 200, blockSize: 120 } satisfies CSSProperties;
const Long = () => <div style={{ blockSize: 600 }}>Long content</div>;
const Wide = () => <div style={{ inlineSize: 800, blockSize: 600 }}>Wide content</div>;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const all = (part: string) => [
    ...screen.container.querySelectorAll<HTMLElement>(`.ow-scroll-area${part}`),
  ];
  const one = (part: string) => {
    const el = all(part)[0];
    if (!el) throw new Error(`no ${part}`);
    return el;
  };
  return { container: screen.container, all, one };
}

/** Mounts with the scrollbars in place; Base UI adds them once it has measured. */
async function mountMeasured(ui: ReactNode) {
  const mounted = await mount(ui);
  await expect.poll(() => mounted.all("__thumb").length).toBeGreaterThan(0);
  return mounted;
}

/** Resolves a color (e.g. `var(--ow-muted)`) to its computed value inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Scrolls as a person would, so Base UI reports it (it ignores scrolls from code). */
function userScroll(viewport: HTMLElement, top: number) {
  viewport.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
  viewport.scrollTop = top;
}

const opacity = (el: Element) => () => getComputedStyle(el).opacity;

describe("ScrollArea", () => {
  test("with only content, Root draws the other parts, one scrollbar per axis that overflows", async () => {
    const { all, one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <Long />
      </ScrollArea.Root>,
    );
    expect(one("__viewport").parentElement).toBe(one(""));
    expect(one("__content").parentElement).toBe(one("__viewport"));
    expect(one("__content").textContent).toBe("Long content");
    expect(all("__scrollbar").map((bar) => bar.dataset.orientation)).toEqual(["vertical"]);
    expect(one("__thumb").parentElement).toBe(one("__scrollbar"));
    expect(all("__corner")).toEqual([]);
  });

  test("draws both scrollbars and the corner when both axes overflow", async () => {
    const { all } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <Wide />
      </ScrollArea.Root>,
    );
    await expect.poll(() => all("__scrollbar").length).toBe(2);
    await expect.poll(() => all("__corner").length).toBe(1);
    expect(all("__thumb").length).toBe(2);
  });

  test("explicit parts are used as they are, and nothing is added", async () => {
    const { all, one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <ScrollArea.Viewport data-testid="mine">
          <ScrollArea.Content data-testid="my-content">
            <Long />
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar data-testid="my-bar">
          <ScrollArea.Thumb data-testid="my-thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>,
    );
    expect(all("__viewport").length).toBe(1);
    expect(one("__viewport").dataset.testid).toBe("mine");
    expect(all("__content").length).toBe(1);
    expect(one("__content").dataset.testid).toBe("my-content");
    expect(all("__scrollbar").length).toBe(1);
    expect(all("__thumb").length).toBe(1);
    expect(one("__thumb").dataset.testid).toBe("my-thumb");
  });

  test("a Viewport draws Content and a Scrollbar draws Thumb when left out", async () => {
    const { all, one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <ScrollArea.Viewport>
          <Long />
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar />
      </ScrollArea.Root>,
    );
    expect(one("__content").parentElement).toBe(one("__viewport"));
    expect(all("__thumb").length).toBe(1);
  });

  test("a Root with a Viewport and no Scrollbar scrolls without one", async () => {
    const { all, one } = await mount(
      <ScrollArea.Root style={size}>
        <ScrollArea.Viewport>
          <Long />
        </ScrollArea.Viewport>
      </ScrollArea.Root>,
    );
    await expect.poll(() => one("__viewport").hasAttribute("data-has-overflow-y")).toBe(true);
    expect(all("__scrollbar")).toEqual([]);
  });

  test("passes className, style, render, and ref through every part (FR-2, FR-5)", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      viewport: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      scrollbar: createRef<HTMLDivElement>(),
      thumb: createRef<HTMLDivElement>(),
      corner: createRef<HTMLDivElement>(),
    };
    const { all, one } = await mountMeasured(
      <ScrollArea.Root ref={refs.root} className="a" style={{ ...size, marginBlock: "3px" }}>
        <ScrollArea.Viewport
          ref={refs.viewport}
          className={(state) => (state.hasOverflowY ? "b-y" : "b-n")}
          render={<section />}
        >
          <ScrollArea.Content ref={refs.content} className="c">
            <Wide />
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar ref={refs.scrollbar} className="d" style={{ marginInline: "1px" }}>
          <ScrollArea.Thumb ref={refs.thumb} className="e" render={<span />} />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar orientation="horizontal" />
        <ScrollArea.Corner ref={refs.corner} className="f" />
      </ScrollArea.Root>,
    );
    await expect.poll(() => all("__corner").length).toBe(1);
    expect(one("").className).toBe("ow-scroll-area a");
    expect(one("").style.marginBlock).toBe("3px");
    expect(refs.root.current).toBe(one(""));
    expect(one("__viewport").tagName).toBe("SECTION");
    await expect.poll(() => one("__viewport").className).toContain("b-y");
    expect(refs.viewport.current).toBe(one("__viewport"));
    expect(one("__content").className).toBe("ow-scroll-area__content c");
    expect(refs.content.current).toBe(one("__content"));
    expect(one("__scrollbar").className).toBe("ow-scroll-area__scrollbar d");
    expect(one("__scrollbar").style.marginInline).toBe("1px");
    expect(refs.scrollbar.current).toBe(one("__scrollbar"));
    expect(one("__thumb").tagName).toBe("SPAN");
    expect(refs.thumb.current).toBe(one("__thumb"));
    expect(one("__corner").className).toBe("ow-scroll-area__corner f");
    expect(refs.corner.current).toBe(one("__corner"));
  });

  test("takes its size from the parent and from your CSS, a max-height too", async () => {
    const { all } = await mount(
      <div style={{ inlineSize: 300 }}>
        <ScrollArea.Root>
          <div style={{ blockSize: 50 }}>Short</div>
        </ScrollArea.Root>
        <ScrollArea.Root style={{ maxBlockSize: 80 }}>
          <Long />
        </ScrollArea.Root>
      </div>,
    );
    const [short, capped] = all("");
    const [shortView, cappedView] = all("__viewport");
    if (!short || !capped || !shortView || !cappedView) throw new Error("no roots");
    expect(short.getBoundingClientRect()).toMatchObject({ width: 300, height: 50 });
    expect(capped.getBoundingClientRect().height).toBe(80);
    expect(cappedView.clientHeight).toBe(80);
    expect(cappedView.scrollHeight).toBe(600);
    expect(getComputedStyle(short).marginBlockStart).toBe("0px");
    expect(getComputedStyle(short).marginInlineStart).toBe("0px");
  });

  test("the scrollbar takes no room in the layout", async () => {
    const { one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <Long />
      </ScrollArea.Root>,
    );
    expect(getComputedStyle(one("__scrollbar")).position).toBe("absolute");
    expect(one("__viewport").clientWidth).toBe(200);
    expect(one("__content").getBoundingClientRect().width).toBe(200);
  });

  test("hides the native scrollbars from its stylesheet, with no <style> at runtime (NF-4)", async () => {
    const injected =
      'style[href="base-ui-disable-scrollbar"], style[data-href="base-ui-disable-scrollbar"]';
    // Another test's area may have left Base UI's element behind.
    for (const el of document.querySelectorAll(injected)) el.remove();
    const { one } = await mountMeasured(
      <CSPProvider disableStyleElements>
        <ScrollArea.Root style={size}>
          <Long />
        </ScrollArea.Root>
      </CSPProvider>,
    );
    expect(document.querySelectorAll(injected).length).toBe(0);
    expect(getComputedStyle(one("__viewport")).scrollbarWidth).toBe("none");
    expect(getComputedStyle(one("__viewport"), "::-webkit-scrollbar").display).toBe("none");
  });

  test("the scrollbar shows on hover and fades out after, by opacity alone", async () => {
    const { one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <Long />
      </ScrollArea.Root>,
    );
    const bar = one("__scrollbar");
    expect(getComputedStyle(bar).opacity).toBe("0");
    expect(getComputedStyle(bar).transitionProperty).toBe("opacity");

    await userEvent.hover(one("__viewport"));
    await expect.poll(() => bar.hasAttribute("data-hovering")).toBe(true);
    await expect.poll(opacity(bar)).toBe("1");
    expect(getComputedStyle(bar).pointerEvents).toBe("auto");

    await userEvent.unhover(one("__viewport"));
    await expect.poll(opacity(bar)).toBe("0");
  });

  test("the scrollbar shows while scrolling, without hover", async () => {
    const { one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <Long />
      </ScrollArea.Root>,
    );
    const bar = one("__scrollbar");
    const start = one("__thumb").style.transform;
    userScroll(one("__viewport"), 100);
    await expect.poll(() => bar.hasAttribute("data-scrolling")).toBe(true);
    await expect.poll(opacity(bar)).toBe("1");
    expect(one("__thumb").style.transform).not.toBe(start);
    // Base UI drops the state 500 ms after the last scroll.
    await expect.poll(opacity(bar), { timeout: 2000 }).toBe("0");
  });

  test("hidden, it lets the pointer through to the content", async () => {
    const { one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <Long />
      </ScrollArea.Root>,
    );
    const bar = one("__scrollbar");
    expect(getComputedStyle(bar).pointerEvents).toBe("none");
    const { right, top } = one("__thumb").getBoundingClientRect();
    const hit = document.elementFromPoint(right - 1, top + 4);
    expect(one("__viewport").contains(hit)).toBe(true);
    expect(bar.contains(hit)).toBe(false);
  });

  test("dragging the thumb scrolls, and it stays shown while held", async () => {
    onTestFinished(() => commands.mouse("up"));
    const { one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <Long />
      </ScrollArea.Root>,
    );
    const viewport = one("__viewport");
    await userEvent.hover(viewport);
    await expect.poll(opacity(one("__scrollbar"))).toBe("1");
    await userEvent.dragAndDrop(one("__thumb"), one("__scrollbar"), {
      targetPosition: { x: 3, y: 90 },
    });
    await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0);

    await userEvent.hover(one("__thumb"));
    await commands.mouse("down");
    await expect.poll(() => one("__scrollbar").matches(":active")).toBe(true);
    expect(getComputedStyle(one("__scrollbar")).opacity).toBe("1");
  });

  test("the keyboard reaches the viewport and scrolls it, inside a ring (FR-13, FR-15)", async () => {
    const { container, one } = await mountMeasured(
      <>
        <button type="button">Before</button>
        <ScrollArea.Root style={size}>
          <Long />
        </ScrollArea.Root>
      </>,
    );
    const viewport = one("__viewport");
    container.querySelector("button")?.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(viewport);
    expect(viewport.matches(":focus-visible")).toBe(true);

    const ring = getComputedStyle(one(""), "::after");
    expect(ring.outlineWidth).toBe("2px");
    expect(ring.outlineOffset).toBe("-2px");
    expect(ring.outlineColor).toBe(resolveColor("var(--ow-focus)"));
    expect(ring.pointerEvents).toBe("none");

    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0);
  });

  test("a viewport that fits stays out of the tab order", async () => {
    const { one } = await mount(
      <ScrollArea.Root style={size}>
        <p>Short</p>
      </ScrollArea.Root>,
    );
    await settle();
    expect(one("__viewport").tabIndex).toBe(-1);
  });

  test("fades an edge only when asked, as far as has scrolled past it", async () => {
    const { all } = await mountMeasured(
      <>
        <ScrollArea.Root style={size}>
          <Long />
        </ScrollArea.Root>
        <ScrollArea.Root fade style={size}>
          <Long />
        </ScrollArea.Root>
      </>,
    );
    const [plainRoot, fadedRoot] = all("");
    const [plain, faded] = all("__viewport");
    if (!plainRoot || !fadedRoot || !plain || !faded) throw new Error("no roots");
    expect(plainRoot.hasAttribute("data-fade")).toBe(false);
    expect(fadedRoot.hasAttribute("data-fade")).toBe(true);
    expect(getComputedStyle(plain).maskImage).toBe("none");
    expect(getComputedStyle(faded).maskImage).toContain("linear-gradient");

    await expect.poll(() => faded.hasAttribute("data-overflow-y-end")).toBe(true);
    expect(faded.hasAttribute("data-overflow-y-start")).toBe(false);
    const atStart = getComputedStyle(faded).maskImage;
    faded.scrollTop = 10;
    await expect.poll(() => faded.hasAttribute("data-overflow-y-start")).toBe(true);
    expect(faded.style.getPropertyValue("--scroll-area-overflow-y-start")).toBe("10px");
    expect(getComputedStyle(faded).maskImage).not.toBe(atStart);
  });

  test("--fade-size on an ancestor sets how far an edge fades", async () => {
    const mask = async (style: CSSProperties) => {
      const { all } = await mountMeasured(
        <div style={style}>
          <ScrollArea.Root fade style={size}>
            <Long />
          </ScrollArea.Root>
        </div>,
      );
      const viewport = all("__viewport")[0];
      if (!viewport) throw new Error("no viewport");
      viewport.scrollTop = 100;
      await expect.poll(() => viewport.hasAttribute("data-overflow-y-start")).toBe(true);
      return getComputedStyle(viewport).maskImage;
    };
    const standard = await mask({});
    const wider = await mask({ "--fade-size": "48px" } as CSSProperties);
    expect(wider).not.toBe(standard);
  });

  test("follows the text direction (FR-16)", async () => {
    const { one } = await mountMeasured(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <ScrollArea.Root fade style={size}>
            <Wide />
          </ScrollArea.Root>
        </div>
      </DirectionProvider>,
    );
    const area = one("").getBoundingClientRect();
    const vertical = one('__scrollbar[data-orientation="vertical"]').getBoundingClientRect();
    expect(vertical.left - area.left).toBeLessThan(area.right - vertical.right);
    expect(getComputedStyle(one("__viewport")).maskImage).toContain("to left");
  });

  test("reads the theme tokens in light and dark, at 3:1 on the panel and the page (DP-6)", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { one } = await mountMeasured(
      <ScrollArea.Root style={size}>
        <Long />
      </ScrollArea.Root>,
    );
    const thumb = one("__thumb");
    const seen = new Set<string>();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const fill = getComputedStyle(thumb).backgroundColor;
      seen.add(fill);
      expect(fill).toBe(resolveColor("color-mix(in oklab, var(--ow-muted) 72%, transparent)"));
      expect(getComputedStyle(one("")).borderRadius).toBe(
        getComputedStyle(root).getPropertyValue("--ow-radius"),
      );
      for (const surface of ["--ow-bg", "--ow-panel"]) {
        const under = resolveColor(`var(${surface})`);
        expect(contrast(composite(under, fill), composite(under))).toBeGreaterThanOrEqual(3);
      }
    }
    expect(seen.size).toBe(2);
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const { all } = await mountMeasured(
      <>
        <ScrollArea.Root style={{ ...size, "--ow-muted": "rgb(255, 0, 0)" } as CSSProperties}>
          <Long />
        </ScrollArea.Root>
        <ScrollArea.Root style={size}>
          <Long />
        </ScrollArea.Root>
      </>,
    );
    await expect.poll(() => all("__thumb").length).toBe(2);
    const [red, plain] = all("__thumb");
    if (!red || !plain) throw new Error("no thumbs");
    expect(getComputedStyle(red).backgroundColor).toBe(
      resolveColor("color-mix(in oklab, rgb(255, 0, 0) 72%, transparent)"),
    );
    expect(getComputedStyle(plain).backgroundColor).toBe(
      resolveColor("color-mix(in oklab, var(--ow-muted) 72%, transparent)"),
    );
  });

  test("an unlayered rule on a className beats its own values", async () => {
    const { one } = await mountMeasured(
      <>
        <style>{`
          .my-bar { inline-size: 10px; }
          .my-thumb { background-color: rgb(0, 128, 0); }
          .my-area { border-radius: 3px; }
        `}</style>
        <ScrollArea.Root className="my-area" style={size}>
          <ScrollArea.Viewport>
            <Long />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="my-bar">
            <ScrollArea.Thumb className="my-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </>,
    );
    expect(one("__scrollbar").getBoundingClientRect().width).toBe(10);
    expect(one("__thumb").getBoundingClientRect().width).toBe(10);
    expect(getComputedStyle(one("__thumb")).backgroundColor).toBe("rgb(0, 128, 0)");
    expect(getComputedStyle(one("")).borderRadius).toBe("3px");
  });

  test("with only content, plain CSS reaches the parts through Root's className", async () => {
    const { one } = await mountMeasured(
      <>
        <style>{`
          .my-list .ow-scroll-area__scrollbar { inline-size: 12px; }
          .my-list .ow-scroll-area__thumb { background-color: rgb(0, 0, 255); }
        `}</style>
        <ScrollArea.Root className="my-list" style={size}>
          <Long />
        </ScrollArea.Root>
      </>,
    );
    expect(one("__thumb").getBoundingClientRect().width).toBe(12);
    expect(getComputedStyle(one("__thumb")).backgroundColor).toBe("rgb(0, 0, 255)");
  });

  test("font-size scales the scrollbar", async () => {
    const { one } = await mountMeasured(
      <ScrollArea.Root style={{ ...size, fontSize: 32 }}>
        <Long />
      </ScrollArea.Root>,
    );
    expect(one("__scrollbar").getBoundingClientRect().width).toBe(12);
  });

  test("the thumb stays visible in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { container, one } = await mountMeasured(
      <>
        <button type="button">Before</button>
        <ScrollArea.Root style={size}>
          <Long />
        </ScrollArea.Root>
      </>,
    );
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const fill = getComputedStyle(one("__thumb")).backgroundColor;
    expect(fill).toBe(resolveColor("CanvasText"));
    expect(fill).not.toBe(getComputedStyle(document.body).backgroundColor);

    container.querySelector("button")?.focus();
    await userEvent.tab();
    expect(getComputedStyle(one(""), "::after").outlineColor).toBe(resolveColor("Highlight"));
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { container, one } = await mountMeasured(
      <main>
        <ScrollArea.Root fade style={size}>
          <div style={{ blockSize: 600 }}>
            <p>Long content</p>
            <a href="#end">A link inside</a>
          </div>
        </ScrollArea.Root>
      </main>,
    );
    await userEvent.hover(one("__viewport"));
    await expect.poll(opacity(one("__scrollbar"))).toBe("1");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await mountMeasured(
      <ScrollArea.Root fade style={size}>
        <Long />
      </ScrollArea.Root>,
    );
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
