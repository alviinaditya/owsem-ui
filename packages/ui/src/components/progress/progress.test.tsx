import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Progress } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const el = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  return {
    screen,
    bar: el(".ow-progress"),
    track: el(".ow-progress__track"),
    fill: el(".ow-progress__indicator"),
  };
}

/** Resolves a value (e.g. `var(--ow-accent)`) of `color` to its computed form in `scope`. */
function resolve(value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty("color", value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue("color");
  probe.remove();
  return computed;
}

const TRACK = "color-mix(in oklab, var(--ow-fg) 10%, transparent)";

/** How far the fill's end sits from the track's start, as a share of the track's width. */
const reach = (track: HTMLElement, fill: HTMLElement) =>
  (fill.getBoundingClientRect().right - track.getBoundingClientRect().left) /
  track.getBoundingClientRect().width;

describe("Progress", () => {
  test("is Base UI's progressbar, named by its label, with the value said once", async () => {
    const { bar } = await mount(
      <Progress.Root value={40}>
        <Progress.Label>Uploading</Progress.Label>
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>,
    );
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuetext")).toBe("40%");
    const label = bar.querySelector(".ow-progress__label") as HTMLElement;
    expect(bar.getAttribute("aria-labelledby")).toBe(label.id);
    const value = bar.querySelector(".ow-progress__value") as HTMLElement;
    expect(value.textContent).toBe("40%");
    expect(value.getAttribute("aria-hidden")).toBe("true");
    expect(bar.hasAttribute("data-progressing")).toBe(true);
  });

  test("draws its own Track and Indicator without children; Track draws its Indicator", async () => {
    const bare = await mount(<Progress.Root value={10} aria-label="A" />);
    const track = await mount(
      <Progress.Root value={10} aria-label="B">
        <Progress.Track />
      </Progress.Root>,
    );
    for (const { bar } of [bare, track]) {
      expect(bar.querySelectorAll(".ow-progress__track")).toHaveLength(1);
      expect(bar.querySelectorAll(".ow-progress__indicator")).toHaveLength(1);
    }
  });

  test("with children it draws no Track of its own: the Track is one of them", async () => {
    const none = await mount(
      <Progress.Root value={10}>
        <Progress.Label>Name</Progress.Label>
        <Progress.Value />
      </Progress.Root>,
    );
    expect(none.bar.querySelectorAll(".ow-progress__track")).toHaveLength(0);
    const given = await mount(
      <Progress.Root value={10}>
        <Progress.Label>Name</Progress.Label>
        <Progress.Track className="mine" />
      </Progress.Root>,
    );
    expect(given.bar.querySelectorAll(".ow-progress__track")).toHaveLength(1);
    expect(given.track.className).toBe("ow-progress__track mine");
    expect(given.bar.querySelectorAll(".ow-progress__indicator")).toHaveLength(1);
  });

  test("Base UI's inline width and height are not written, and a style of yours is merged after", async () => {
    const { track, fill } = await mount(
      <div style={{ inlineSize: 200 }}>
        <Progress.Root value={25} aria-label="A">
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      </div>,
    );
    expect(fill.style.width).toBe("");
    expect(fill.style.height).toBe("");
    expect(getComputedStyle(fill).width).toBe("200px");
    const own = await mount(
      <div style={{ inlineSize: 200 }}>
        <Progress.Root value={25} aria-label="B">
          <Progress.Track>
            <Progress.Indicator style={{ width: "50%" }} />
          </Progress.Track>
        </Progress.Root>
        <Progress.Root value={25} aria-label="C">
          <Progress.Track>
            <Progress.Indicator style={() => ({ width: "30%" })} />
          </Progress.Track>
        </Progress.Root>
      </div>,
    );
    const [object, fn] = [
      ...own.screen.container.querySelectorAll<HTMLElement>(".ow-progress__indicator"),
    ];
    expect(object?.style.width).toBe("50%");
    expect(getComputedStyle(object as Element).width).toBe("100px");
    expect(getComputedStyle(fn as Element).width).toBe("60px");
    expect(track.getBoundingClientRect().width).toBe(200);
  });

  test("an Indicator of your own replaces the drawn one", async () => {
    const { bar, fill } = await mount(
      <Progress.Root value={10} aria-label="A">
        <Progress.Track>
          <Progress.Indicator className="mine" />
        </Progress.Track>
      </Progress.Root>,
    );
    expect(bar.querySelectorAll(".ow-progress__indicator")).toHaveLength(1);
    expect(fill.className).toBe("ow-progress__indicator mine");
  });

  test("lays the label at the start and the value at the end, above the track", async () => {
    const { bar, track } = await mount(
      <div style={{ inlineSize: 300 }}>
        <Progress.Root value={40}>
          <Progress.Label>Uploading</Progress.Label>
          <Progress.Value />
          <Progress.Track />
        </Progress.Root>
      </div>,
    );
    const box = (selector: string) =>
      (bar.querySelector(selector) as HTMLElement).getBoundingClientRect();
    const [label, value, groove] = [
      box(".ow-progress__label"),
      box(".ow-progress__value"),
      track.getBoundingClientRect(),
    ];
    expect(label.left).toBe(bar.getBoundingClientRect().left);
    expect(value.right).toBeCloseTo(bar.getBoundingClientRect().right, 0);
    expect(label.bottom).toBeLessThanOrEqual(groove.top);
    expect(value.bottom).toBeLessThanOrEqual(groove.top);
    expect(groove.width).toBeCloseTo(300, 0);
    expect(
      getComputedStyle(bar.querySelector(".ow-progress__value") as Element).fontVariantNumeric,
    ).toBe("tabular-nums");
  });

  test("with no label or value the track is all there is, with no gap above it", async () => {
    const { bar, track } = await mount(<Progress.Root value={40} aria-label="Plain" />);
    expect(track.getBoundingClientRect().top).toBe(bar.getBoundingClientRect().top);
    expect(bar.getBoundingClientRect().height).toBe(8);
  });

  test("sizes: a 4, 8, or 12 px pill track", async () => {
    const heights: number[] = [];
    for (const size of ["sm", "md", "lg"] as const) {
      const { bar, track } = await mount(
        <Progress.Root value={40} size={size} aria-label={size} />,
      );
      expect(bar.dataset.size).toBe(size);
      heights.push(track.getBoundingClientRect().height);
      expect(getComputedStyle(track).borderTopLeftRadius).toBe("999px");
    }
    expect(heights).toEqual([4, 8, 12]);
  });

  test("the track is a 10% tint of the text color and the fill the accent, both pills", async () => {
    const { track, fill } = await mount(<Progress.Root value={40} aria-label="A" />);
    expect(getComputedStyle(track).backgroundColor).toBe(resolve(TRACK));
    expect(getComputedStyle(fill).backgroundColor).toBe(resolve("var(--ow-accent)"));
    expect(getComputedStyle(fill).borderTopLeftRadius).toBe("999px");
    expect(getComputedStyle(track).overflow).toBe("hidden");
  });

  test("the fill has 3:1 against the track and the page, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = composite(resolve("var(--ow-bg)"));
      const track = composite(resolve("var(--ow-bg)"), resolve(TRACK));
      const fill = composite(resolve("var(--ow-accent)"));
      expect(contrast(fill, page)).toBeGreaterThanOrEqual(3);
      expect(contrast(fill, track)).toBeGreaterThanOrEqual(3);
    }
  });

  test("the fill is as wide as the track and reaches the value with a transform, not a width", async () => {
    const { track, fill } = await mount(
      <div style={{ inlineSize: 200 }}>
        <Progress.Root value={25} aria-label="A" />
      </div>,
    );
    // Base UI's inline width is not written; the class sizes the fill.
    expect(fill.style.width).toBe("");
    expect(getComputedStyle(fill).width).toBe("200px");
    expect(fill.getBoundingClientRect().height).toBe(8);
    expect(reach(track, fill)).toBeCloseTo(0.25, 2);
  });

  test("min and max set the scale, and a value past them is clamped", async () => {
    const { track, fill } = await mount(
      <div style={{ inlineSize: 200 }}>
        <Progress.Root value={30} min={10} max={50} aria-label="A" />
        <Progress.Root value={250} aria-label="B" />
        <Progress.Root value={-4} aria-label="C" />
      </div>,
    );
    expect(reach(track, fill)).toBeCloseTo(0.5, 2);
    const [over, under] = [...document.querySelectorAll<HTMLElement>(".ow-progress")].slice(-2);
    const [a, b] = [over, under].map((bar) => ({
      track: bar?.querySelector(".ow-progress__track") as HTMLElement,
      fill: bar?.querySelector(".ow-progress__indicator") as HTMLElement,
    }));
    expect(reach(a?.track as HTMLElement, a?.fill as HTMLElement)).toBeCloseTo(1, 2);
    expect(reach(b?.track as HTMLElement, b?.fill as HTMLElement)).toBeCloseTo(0, 2);
  });

  test("a change of value moves the fill on a transition of translate", async () => {
    function Bar({ value }: { value: number }) {
      return (
        <div style={{ inlineSize: 200 }}>
          <Progress.Root value={value} aria-label="A" />
        </div>
      );
    }
    const screen = await render(<Bar value={10} />);
    const fill = screen.container.querySelector(".ow-progress__indicator") as HTMLElement;
    const track = screen.container.querySelector(".ow-progress__track") as HTMLElement;
    expect(fill.getAnimations()).toEqual([]);
    await screen.rerender(<Bar value={90} />);
    await expect
      .poll(() => fill.getAnimations().map((a) => (a as CSSTransition).transitionProperty))
      .toContain("translate");
    expect(getComputedStyle(fill).transitionDuration).toBe("0.4s");
    // Mid-way, it is between the two.
    const [move] = fill.getAnimations();
    if (!move) throw new Error("no transition");
    move.pause();
    move.currentTime = 100;
    expect(reach(track, fill)).toBeGreaterThan(0.1);
    expect(reach(track, fill)).toBeLessThan(0.9);
    move.finish();
    expect(reach(track, fill)).toBeCloseTo(0.9, 2);
  });

  test("under reduced motion the fill goes to its place with no transition", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { fill } = await mount(<Progress.Root value={40} aria-label="A" />);
    expect(getComputedStyle(fill).transitionProperty).toBe("none");
    expect(fill.getAnimations()).toEqual([]);
  });

  test("right to left: the fill grows from the right", async () => {
    const { track, fill } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl" style={{ inlineSize: 200 }}>
          <Progress.Root value={25} aria-label="A" />
        </div>
      </DirectionProvider>,
    );
    const [groove, bar] = [track.getBoundingClientRect(), fill.getBoundingClientRect()];
    expect(bar.left - groove.left).toBeCloseTo(150, 0);
    expect(bar.right - groove.left).toBeCloseTo(350, 0);
    expect((groove.right - bar.left) / groove.width).toBeCloseTo(0.25, 2);
  });

  test("a format and getAriaValueText reach the value and the bar", async () => {
    const { bar } = await mount(
      <Progress.Root
        value={3}
        max={8}
        format={{ style: "unit", unit: "megabyte" }}
        getAriaValueText={(formatted) => `${formatted} of 8 MB`}
        aria-label="Upload"
      >
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>,
    );
    expect(bar.querySelector(".ow-progress__value")?.textContent).toBe("3 MB");
    expect(bar.getAttribute("aria-valuetext")).toBe("3 MB of 8 MB");
  });

  test("a function child of Value gets the formatted value", async () => {
    const { bar } = await mount(
      <Progress.Root value={40} aria-label="A">
        <Progress.Value>{(formatted, value) => `${value} · ${formatted}`}</Progress.Value>
        <Progress.Track />
      </Progress.Root>,
    );
    expect(bar.querySelector(".ow-progress__value")?.textContent).toBe("40 · 40%");
  });

  test("completes: data-complete on every part", async () => {
    const { bar, track, fill } = await mount(<Progress.Root value={100} aria-label="A" />);
    for (const el of [bar, track, fill]) expect(el.hasAttribute("data-complete")).toBe(true);
  });
});

describe("Progress, indeterminate", () => {
  test("value null: no aria-valuenow, a segment that travels the track on a CSS animation", async () => {
    const { bar, track, fill } = await mount(<Progress.Root value={null} aria-label="Loading" />);
    expect(bar.hasAttribute("aria-valuenow")).toBe(false);
    expect(bar.hasAttribute("data-indeterminate")).toBe(true);
    expect(fill.hasAttribute("data-indeterminate")).toBe(true);
    const style = getComputedStyle(fill);
    expect(style.animationName).toBe("ow-progress-travel");
    expect(style.animationIterationCount).toBe("infinite");
    expect(style.width).toBe(`${track.getBoundingClientRect().width * 0.4}px`);
    const [travel] = fill.getAnimations();
    if (!travel) throw new Error("no animation");
    travel.pause();
    travel.currentTime = 0;
    expect(fill.getBoundingClientRect().right).toBeLessThanOrEqual(
      track.getBoundingClientRect().left + 0.5,
    );
    travel.currentTime = 800;
    const mid = fill.getBoundingClientRect();
    expect(mid.left).toBeGreaterThan(track.getBoundingClientRect().left - 1);
    expect(mid.right).toBeLessThan(track.getBoundingClientRect().right + 1);
  });

  test("it moves with a transform only: no width, no rAF", async () => {
    const { fill } = await mount(<Progress.Root value={null} aria-label="Loading" />);
    const props = fill
      .getAnimations()
      .flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().flatMap((k) => Object.keys(k)));
    expect(props).toContain("translate");
    expect(props).not.toContain("width");
    expect(props).not.toContain("left");
  });

  test("setting a value stops it, and removing the part leaves nothing running", async () => {
    function Bar({ value }: { value: number | null }) {
      return <Progress.Root value={value} aria-label="Loading" />;
    }
    const screen = await render(<Bar value={null} />);
    const fill = screen.container.querySelector(".ow-progress__indicator") as HTMLElement;
    expect(fill.getAnimations().map((a) => (a as CSSAnimation).animationName)).toEqual([
      "ow-progress-travel",
    ]);
    await screen.rerender(<Bar value={30} />);
    await expect.poll(() => getComputedStyle(fill).animationName).toBe("none");
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await screen.rerender(<Bar value={null} />);
    await expect.poll(() => fill.getAnimations().length).toBe(1);
    screen.unmount();
    expect(document.getAnimations().filter((a) => a.playState === "running")).toEqual([]);
  });

  test("right to left, the segment travels from the right", async () => {
    const { track, fill } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl" style={{ inlineSize: 200 }}>
          <Progress.Root value={null} aria-label="Loading" />
        </div>
      </DirectionProvider>,
    );
    const [travel] = fill.getAnimations();
    if (!travel) throw new Error("no animation");
    travel.pause();
    travel.currentTime = 0;
    expect(fill.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      track.getBoundingClientRect().right - 0.5,
    );
  });

  test("under reduced motion nothing moves: a still segment in the middle, which no value is", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { track, fill } = await mount(
      <div style={{ inlineSize: 200 }}>
        <Progress.Root value={null} aria-label="Loading" />
      </div>,
    );
    expect(getComputedStyle(fill).animationName).toBe("none");
    expect(fill.getAnimations()).toEqual([]);
    const [groove, segment] = [track.getBoundingClientRect(), fill.getBoundingClientRect()];
    expect(segment.width).toBeCloseTo(80, 0);
    expect(segment.left - groove.left).toBeCloseTo(60, 0);
    expect(groove.right - segment.right).toBeCloseTo(60, 0);
  });
});

describe("Progress, around it", () => {
  test("more contrast draws the track's edge in --ow-edge", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const { track } = await mount(<Progress.Root value={40} aria-label="A" />);
    await commands.setContrast("more");
    expect(getComputedStyle(track).outlineColor).toBe(resolve("var(--ow-edge)"));
    expect(getComputedStyle(track).outlineWidth).toBe("1px");
  });

  test("forced colors: the track keeps its edge and the fill is Highlight", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { track, fill } = await mount(<Progress.Root value={40} aria-label="A" />);
    await commands.setForcedColors("active");
    expect(getComputedStyle(track).outlineStyle).toBe("solid");
    expect(getComputedStyle(track).outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(fill).backgroundColor).toBe(resolve("Highlight"));
  });

  test("prints its fill", async () => {
    const { track, fill } = await mount(<Progress.Root value={40} aria-label="A" />);
    expect(getComputedStyle(track).printColorAdjust).toBe("exact");
    expect(getComputedStyle(fill).printColorAdjust).toBe("exact");
  });

  test("passes className, style, render, and ref through on every part", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      track: createRef<HTMLDivElement>(),
      fill: createRef<HTMLDivElement>(),
      value: createRef<HTMLSpanElement>(),
      label: createRef<HTMLSpanElement>(),
    };
    const { bar, track, fill } = await mount(
      <Progress.Root ref={refs.root} value={40} className="mine" style={{ marginInline: "3px" }}>
        <Progress.Label ref={refs.label} className="l" style={{ opacity: 0.5 }}>
          Name
        </Progress.Label>
        <Progress.Value ref={refs.value} className="v" render={<output />} />
        <Progress.Track ref={refs.track} className="t">
          <Progress.Indicator ref={refs.fill} className="i" />
        </Progress.Track>
      </Progress.Root>,
    );
    expect(refs.root.current).toBe(bar);
    expect(refs.track.current).toBe(track);
    expect(refs.fill.current).toBe(fill);
    expect(refs.value.current?.tagName).toBe("OUTPUT");
    expect(refs.label.current?.style.opacity).toBe("0.5");
    expect(bar.className).toBe("ow-progress ow-progress--md mine");
    expect(bar.style.marginInline).toBe("3px");
    expect(bar.style.getPropertyValue("--_value")).toBe("40");
    expect(track.className).toBe("ow-progress__track t");
    expect(fill.className).toBe("ow-progress__indicator i");
    expect(refs.label.current?.className).toBe("ow-progress__label l");
    expect(refs.value.current?.className).toBe("ow-progress__value v");
  });

  test("a style function keeps the fill's value", async () => {
    const { bar } = await mount(
      <Progress.Root
        value={60}
        aria-label="A"
        style={(state) => ({ opacity: state.status === "progressing" ? 0.5 : 1 })}
      />,
    );
    expect(bar.style.opacity).toBe("0.5");
    expect(bar.style.getPropertyValue("--_value")).toBe("60");
  });

  test("a theme token set on a bar changes it alone", async () => {
    const tokens = { "--ow-accent": "rgb(7, 8, 9)", "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties;
    const { fill, track } = await mount(<Progress.Root value={40} aria-label="A" style={tokens} />);
    expect(getComputedStyle(fill).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(track).backgroundColor).not.toBe(resolve(TRACK));
    expect(getComputedStyle(track).backgroundColor).toBe(resolve(TRACK, track));
  });

  test("an unlayered rule on a className beats its own value", async () => {
    const sheet = document.createElement("style");
    sheet.textContent =
      ".brand-track { background-color: rgb(1, 2, 3); height: 20px; } .brand-fill { background-color: rgb(4, 5, 6); }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { track, fill } = await mount(
      <Progress.Root value={40} aria-label="A">
        <Progress.Track className="brand-track">
          <Progress.Indicator className="brand-fill" />
        </Progress.Track>
      </Progress.Root>,
    );
    expect(getComputedStyle(track).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(track.getBoundingClientRect().height).toBe(20);
    expect(getComputedStyle(fill).backgroundColor).toBe("rgb(4, 5, 6)");
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <Progress.Root value={40} aria-label="A">
        <Progress.Label>Name</Progress.Label>
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>,
    );
    expect(html).toContain("ow-progress__indicator");
    expect(html).toContain("--_value:40");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, determinate or not", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, inlineSize: 300 }}>
        <Progress.Root value={40}>
          <Progress.Label>Uploading</Progress.Label>
          <Progress.Value />
          <Progress.Track />
        </Progress.Root>
        <Progress.Root value={null} size="sm" aria-label="Loading" />
        <Progress.Root value={100} size="lg" aria-label="Done" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a change too", async () => {
    function Bar({ value }: { value: number }) {
      return <Progress.Root value={value} aria-label="A" />;
    }
    const screen = await render(<Bar value={10} />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await screen.rerender(<Bar value={70} />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

test("every part has its data-slot", async () => {
  const { screen } = await mount(
    <Progress.Root value={40}>
      <Progress.Label>Name</Progress.Label>
      <Progress.Value />
      <Progress.Track />
    </Progress.Root>,
  );
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "progress",
    "progress-label",
    "progress-value",
    "progress-track",
    "progress-indicator",
  ]);
});
