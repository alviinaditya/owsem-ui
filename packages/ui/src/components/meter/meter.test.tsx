import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Meter, type MeterTone } from "./index";

const root = document.documentElement;
const TONES: MeterTone[] = ["accent", "good", "warning", "critical"];

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const el = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  return {
    screen,
    bar: el(".ow-meter"),
    track: el(".ow-meter__track"),
    fill: el(".ow-meter__indicator"),
  };
}

/** Resolves a value (e.g. `var(--ow-good)`) of `color` to its computed form in `scope`. */
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

describe("Meter", () => {
  test("is Base UI's meter, named by its label, with the value said once", async () => {
    const { bar } = await mount(
      <Meter.Root value={62}>
        <Meter.Label>Storage</Meter.Label>
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>,
    );
    expect(bar.getAttribute("role")).toBe("meter");
    expect(bar.getAttribute("aria-valuenow")).toBe("62");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuetext")).toBe("62%");
    const label = bar.querySelector(".ow-meter__label") as HTMLElement;
    expect(bar.getAttribute("aria-labelledby")).toBe(label.id);
    const value = bar.querySelector(".ow-meter__value") as HTMLElement;
    expect(value.textContent).toBe("62%");
    expect(value.getAttribute("aria-hidden")).toBe("true");
  });

  test("draws its own Track and Indicator without children; Track draws its Indicator", async () => {
    const bare = await mount(<Meter.Root value={10} aria-label="A" />);
    const track = await mount(
      <Meter.Root value={10} aria-label="B">
        <Meter.Track />
      </Meter.Root>,
    );
    for (const { bar } of [bare, track]) {
      expect(bar.querySelectorAll(".ow-meter__track")).toHaveLength(1);
      expect(bar.querySelectorAll(".ow-meter__indicator")).toHaveLength(1);
    }
  });

  test("with children it draws no Track of its own: the Track is one of them", async () => {
    const none = await mount(
      <Meter.Root value={10}>
        <Meter.Label>Name</Meter.Label>
        <Meter.Value />
      </Meter.Root>,
    );
    expect(none.bar.querySelectorAll(".ow-meter__track")).toHaveLength(0);
    const given = await mount(
      <Meter.Root value={10}>
        <Meter.Label>Name</Meter.Label>
        <Meter.Track className="mine" />
      </Meter.Root>,
    );
    expect(given.bar.querySelectorAll(".ow-meter__track")).toHaveLength(1);
    expect(given.track.className).toBe("ow-meter__track mine");
    expect(given.bar.querySelectorAll(".ow-meter__indicator")).toHaveLength(1);
  });

  test("Base UI's inline width and height are not written, and a style of yours is merged after", async () => {
    const { track, fill } = await mount(
      <div style={{ inlineSize: 200 }}>
        <Meter.Root value={25} aria-label="A">
          <Meter.Track>
            <Meter.Indicator />
          </Meter.Track>
        </Meter.Root>
      </div>,
    );
    expect(fill.style.width).toBe("");
    expect(fill.style.height).toBe("");
    expect(getComputedStyle(fill).width).toBe("200px");
    const own = await mount(
      <div style={{ inlineSize: 200 }}>
        <Meter.Root value={25} aria-label="B">
          <Meter.Track>
            <Meter.Indicator style={{ width: "50%" }} />
          </Meter.Track>
        </Meter.Root>
        <Meter.Root value={25} aria-label="C">
          <Meter.Track>
            <Meter.Indicator style={() => ({ width: "30%" })} />
          </Meter.Track>
        </Meter.Root>
      </div>,
    );
    const [object, fn] = [
      ...own.screen.container.querySelectorAll<HTMLElement>(".ow-meter__indicator"),
    ];
    expect(object?.style.width).toBe("50%");
    expect(getComputedStyle(object as Element).width).toBe("100px");
    expect(getComputedStyle(fn as Element).width).toBe("60px");
    expect(track.getBoundingClientRect().width).toBe(200);
  });

  test("an Indicator of your own replaces the drawn one", async () => {
    const { bar, fill } = await mount(
      <Meter.Root value={10} aria-label="A">
        <Meter.Track>
          <Meter.Indicator className="mine" />
        </Meter.Track>
      </Meter.Root>,
    );
    expect(bar.querySelectorAll(".ow-meter__indicator")).toHaveLength(1);
    expect(fill.className).toBe("ow-meter__indicator mine");
  });

  test("lays the label at the start and the value at the end, above the track", async () => {
    const { bar, track } = await mount(
      <div style={{ inlineSize: 300 }}>
        <Meter.Root value={62}>
          <Meter.Label>Storage</Meter.Label>
          <Meter.Value />
          <Meter.Track />
        </Meter.Root>
      </div>,
    );
    const box = (selector: string) =>
      (bar.querySelector(selector) as HTMLElement).getBoundingClientRect();
    const [label, value, groove] = [
      box(".ow-meter__label"),
      box(".ow-meter__value"),
      track.getBoundingClientRect(),
    ];
    expect(label.left).toBe(bar.getBoundingClientRect().left);
    expect(value.right).toBeCloseTo(bar.getBoundingClientRect().right, 0);
    expect(label.bottom).toBeLessThanOrEqual(groove.top);
    expect(value.bottom).toBeLessThanOrEqual(groove.top);
    expect(groove.width).toBeCloseTo(300, 0);
    expect(
      getComputedStyle(bar.querySelector(".ow-meter__value") as Element).fontVariantNumeric,
    ).toBe("tabular-nums");
  });

  test("with no label or value the track is all there is, with no gap above it", async () => {
    const { bar, track } = await mount(<Meter.Root value={40} aria-label="Plain" />);
    expect(track.getBoundingClientRect().top).toBe(bar.getBoundingClientRect().top);
    expect(bar.getBoundingClientRect().height).toBe(8);
  });

  test("sizes: a 4, 8, or 12 px pill track", async () => {
    const heights: number[] = [];
    for (const size of ["sm", "md", "lg"] as const) {
      const { bar, track } = await mount(<Meter.Root value={40} size={size} aria-label={size} />);
      expect(bar.dataset.size).toBe(size);
      heights.push(track.getBoundingClientRect().height);
      expect(getComputedStyle(track).borderTopLeftRadius).toBe("999px");
    }
    expect(heights).toEqual([4, 8, 12]);
  });

  test("the track is a 10% tint of the text color; the fill is the accent by default", async () => {
    const { bar, track, fill } = await mount(<Meter.Root value={40} aria-label="A" />);
    expect(bar.dataset.tone).toBe("accent");
    expect(getComputedStyle(track).backgroundColor).toBe(resolve(TRACK));
    expect(getComputedStyle(fill).backgroundColor).toBe(resolve("var(--ow-accent)"));
    expect(getComputedStyle(fill).borderTopLeftRadius).toBe("999px");
    expect(getComputedStyle(track).overflow).toBe("hidden");
  });

  test("a tone takes the fill from its token, and no other part changes", async () => {
    for (const tone of TONES) {
      const { bar, track, fill } = await mount(
        <Meter.Root value={40} tone={tone} aria-label="A" />,
      );
      expect(bar.dataset.tone).toBe(tone);
      expect(getComputedStyle(fill).backgroundColor).toBe(resolve(`var(--ow-${tone})`));
      expect(getComputedStyle(track).backgroundColor).toBe(resolve(TRACK));
    }
  });

  test("every tone's fill has 3:1 against the track and the page, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = composite(resolve("var(--ow-bg)"));
      const track = composite(resolve("var(--ow-bg)"), resolve(TRACK));
      for (const tone of TONES) {
        const fill = composite(resolve(`var(--ow-${tone})`));
        expect(contrast(fill, page), `${tone} on the page, ${theme}`).toBeGreaterThanOrEqual(3);
        expect(contrast(fill, track), `${tone} on the track, ${theme}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test("the fill is as wide as the track and reaches the value with a transform, not a width", async () => {
    const { track, fill } = await mount(
      <div style={{ inlineSize: 200 }}>
        <Meter.Root value={25} aria-label="A" />
      </div>,
    );
    // Base UI's inline width is not written; the class sizes the fill.
    expect(fill.style.width).toBe("");
    expect(getComputedStyle(fill).width).toBe("200px");
    expect(fill.getBoundingClientRect().height).toBe(8);
    expect(reach(track, fill)).toBeCloseTo(0.25, 2);
  });

  test("min and max set the scale, and a value past them is clamped", async () => {
    const screen = await render(
      <div style={{ inlineSize: 200 }}>
        <Meter.Root value={30} min={10} max={50} aria-label="A" />
        <Meter.Root value={250} aria-label="B" />
        <Meter.Root value={-4} aria-label="C" />
      </div>,
    );
    const [a, b, c] = [...screen.container.querySelectorAll<HTMLElement>(".ow-meter")].map(
      (bar) => ({
        track: bar.querySelector(".ow-meter__track") as HTMLElement,
        fill: bar.querySelector(".ow-meter__indicator") as HTMLElement,
      }),
    );
    expect(reach(a?.track as HTMLElement, a?.fill as HTMLElement)).toBeCloseTo(0.5, 2);
    expect(reach(b?.track as HTMLElement, b?.fill as HTMLElement)).toBeCloseTo(1, 2);
    expect(reach(c?.track as HTMLElement, c?.fill as HTMLElement)).toBeCloseTo(0, 2);
  });

  test("a change of value moves the fill on a transition of translate", async () => {
    function Bar({ value }: { value: number }) {
      return (
        <div style={{ inlineSize: 200 }}>
          <Meter.Root value={value} aria-label="A" />
        </div>
      );
    }
    const screen = await render(<Bar value={10} />);
    const fill = screen.container.querySelector(".ow-meter__indicator") as HTMLElement;
    const track = screen.container.querySelector(".ow-meter__track") as HTMLElement;
    expect(fill.getAnimations()).toEqual([]);
    await screen.rerender(<Bar value={90} />);
    await expect
      .poll(() => fill.getAnimations().map((a) => (a as CSSTransition).transitionProperty))
      .toContain("translate");
    expect(getComputedStyle(fill).transitionDuration).toBe("0.4s");
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
    const { fill } = await mount(<Meter.Root value={40} aria-label="A" />);
    expect(getComputedStyle(fill).transitionProperty).toBe("none");
    expect(fill.getAnimations()).toEqual([]);
  });

  test("right to left: the fill grows from the right", async () => {
    const { track, fill } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl" style={{ inlineSize: 200 }}>
          <Meter.Root value={25} aria-label="A" />
        </div>
      </DirectionProvider>,
    );
    const [groove, bar] = [track.getBoundingClientRect(), fill.getBoundingClientRect()];
    expect(bar.left - groove.left).toBeCloseTo(150, 0);
    expect((groove.right - bar.left) / groove.width).toBeCloseTo(0.25, 2);
  });

  test("a format and getAriaValueText reach the value and the bar", async () => {
    const { bar } = await mount(
      <Meter.Root
        value={62}
        max={100}
        format={{ style: "unit", unit: "gigabyte" }}
        getAriaValueText={(formatted) => `${formatted} used of 100 GB`}
        aria-label="Storage"
      >
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>,
    );
    expect(bar.querySelector(".ow-meter__value")?.textContent).toBe("62 GB");
    expect(bar.getAttribute("aria-valuetext")).toBe("62 GB used of 100 GB");
  });

  test("a function child of Value gets the formatted value", async () => {
    const { bar } = await mount(
      <Meter.Root value={62} aria-label="A">
        <Meter.Value>{(formatted, value) => `${value} · ${formatted}`}</Meter.Value>
        <Meter.Track />
      </Meter.Root>,
    );
    expect(bar.querySelector(".ow-meter__value")?.textContent).toBe("62 · 62%");
  });
});

describe("Meter, around it", () => {
  test("more contrast draws the track's edge in --ow-edge", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const { track } = await mount(<Meter.Root value={40} aria-label="A" />);
    await commands.setContrast("more");
    expect(getComputedStyle(track).outlineColor).toBe(resolve("var(--ow-edge)"));
    expect(getComputedStyle(track).outlineWidth).toBe("1px");
  });

  test("forced colors: the track keeps its edge and every tone's fill is Highlight", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const screen = await render(
      <div>
        {TONES.map((tone) => (
          <Meter.Root key={tone} value={40} tone={tone} aria-label={tone} />
        ))}
      </div>,
    );
    await commands.setForcedColors("active");
    for (const track of screen.container.querySelectorAll(".ow-meter__track")) {
      expect(getComputedStyle(track).outlineStyle).toBe("solid");
      expect(getComputedStyle(track).outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    }
    for (const fill of screen.container.querySelectorAll(".ow-meter__indicator")) {
      expect(getComputedStyle(fill).backgroundColor).toBe(resolve("Highlight"));
    }
  });

  test("prints its fill", async () => {
    const { track, fill } = await mount(<Meter.Root value={40} aria-label="A" />);
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
      <Meter.Root
        ref={refs.root}
        value={40}
        tone="good"
        className="mine"
        style={{ marginInline: "3px" }}
      >
        <Meter.Label ref={refs.label} className="l" style={{ opacity: 0.5 }}>
          Name
        </Meter.Label>
        <Meter.Value ref={refs.value} className="v" render={<output />} />
        <Meter.Track ref={refs.track} className="t">
          <Meter.Indicator ref={refs.fill} className="i" />
        </Meter.Track>
      </Meter.Root>,
    );
    expect(refs.root.current).toBe(bar);
    expect(refs.track.current).toBe(track);
    expect(refs.fill.current).toBe(fill);
    expect(refs.value.current?.tagName).toBe("OUTPUT");
    expect(refs.label.current?.style.opacity).toBe("0.5");
    expect(bar.className).toBe("ow-meter ow-meter--md ow-meter--good mine");
    expect(bar.style.marginInline).toBe("3px");
    expect(bar.style.getPropertyValue("--_value")).toBe("40");
    expect(track.className).toBe("ow-meter__track t");
    expect(fill.className).toBe("ow-meter__indicator i");
    expect(refs.label.current?.className).toBe("ow-meter__label l");
    expect(refs.value.current?.className).toBe("ow-meter__value v");
  });

  test("a style function keeps the fill's value", async () => {
    const { bar } = await mount(
      <Meter.Root value={60} aria-label="A" style={() => ({ opacity: 0.5 })} />,
    );
    expect(bar.style.opacity).toBe("0.5");
    expect(bar.style.getPropertyValue("--_value")).toBe("60");
  });

  test("a theme token set on a meter changes it alone", async () => {
    const tokens = { "--ow-good": "rgb(7, 8, 9)", "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties;
    const { fill, track } = await mount(
      <Meter.Root value={40} tone="good" aria-label="A" style={tokens} />,
    );
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
      <Meter.Root value={40} aria-label="A">
        <Meter.Track className="brand-track">
          <Meter.Indicator className="brand-fill" />
        </Meter.Track>
      </Meter.Root>,
    );
    expect(getComputedStyle(track).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(track.getBoundingClientRect().height).toBe(20);
    expect(getComputedStyle(fill).backgroundColor).toBe("rgb(4, 5, 6)");
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <Meter.Root value={62} tone="warning" aria-label="A">
        <Meter.Label>Name</Meter.Label>
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>,
    );
    expect(html).toContain("ow-meter__indicator");
    expect(html).toContain("--_value:62");
    expect(html).toContain("ow-meter--warning");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, in every tone", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, inlineSize: 300 }}>
        {TONES.map((tone) => (
          <Meter.Root key={tone} value={62} tone={tone}>
            <Meter.Label>{tone}</Meter.Label>
            <Meter.Value />
            <Meter.Track />
          </Meter.Root>
        ))}
        <Meter.Root value={10} size="sm" aria-label="Small" />
        <Meter.Root value={90} size="lg" aria-label="Large" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a change too", async () => {
    function Bar({ value }: { value: number }) {
      return <Meter.Root value={value} aria-label="A" />;
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
    <Meter.Root value={40}>
      <Meter.Label>Name</Meter.Label>
      <Meter.Value />
      <Meter.Track />
    </Meter.Root>,
  );
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual(["meter", "meter-label", "meter-value", "meter-track", "meter-indicator"]);
});

// ---- Parts of a whole: Group, Segment, Legend ----

const PARTS = [
  ["focus", 14, "Focus"],
  ["meetings", 9, "Meetings"],
  ["reviews", 6, "Reviews"],
  ["support", 3, "Support"],
] as const;

/** The breakdown of the docs: a week of 40 hours, 32 of them in four parts. */
function Breakdown({
  group,
  width = 400,
  value = 32,
  size,
}: {
  group?: Partial<Meter.Group.Props>;
  width?: number;
  value?: number;
  size?: Meter.Root.Props["size"];
}) {
  return (
    <div style={{ inlineSize: width }}>
      <Meter.Group {...group}>
        {(shown) => (
          <>
            <Meter.Root value={value} max={40} size={size} aria-label="Week">
              <Meter.Value>{() => shown ?? "none"}</Meter.Value>
              <Meter.Track>
                {PARTS.map(([name, hours]) => (
                  <Meter.Segment key={name} name={name} value={hours} />
                ))}
              </Meter.Track>
            </Meter.Root>
            <Meter.Legend aria-label="Parts">
              {PARTS.map(([name, hours, text]) => (
                <Meter.LegendItem key={name} name={name}>
                  {text} <Meter.LegendValue>{hours} h</Meter.LegendValue>
                </Meter.LegendItem>
              ))}
            </Meter.Legend>
          </>
        )}
      </Meter.Group>
    </div>
  );
}

async function breakdown(ui: ReactNode) {
  const screen = await render(ui);
  const all = <T extends HTMLElement>(selector: string) => [
    ...screen.container.querySelectorAll<T>(selector),
  ];
  const first = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  return {
    screen,
    bar: first(".ow-meter"),
    track: first(".ow-meter__track"),
    legend: first(".ow-meter__legend"),
    segments: all(".ow-meter__segment"),
    items: all<HTMLButtonElement>(".ow-meter__legend-item"),
    shown: () => first(".ow-meter__value").textContent,
  };
}

const pressed = (items: HTMLElement[]) => items.map((item) => item.getAttribute("aria-pressed"));
const dimmed = (segments: HTMLElement[]) => segments.map((one) => one.hasAttribute("data-dimmed"));
const lit = (segments: HTMLElement[]) => segments.map((one) => one.hasAttribute("data-active"));

/** A transition of the opacity ends at once, so a style can be read at its end. */
const finish = (...els: Element[]) => {
  for (const el of els) for (const move of el.getAnimations()) move.finish();
};

describe("Meter.Group state", () => {
  test("pressing an item makes its part active, and pressing it again clears it", async () => {
    const { items, segments, shown } = await breakdown(<Breakdown />);
    expect(pressed(items)).toEqual(["false", "false", "false", "false"]);
    expect(dimmed(segments)).toEqual([false, false, false, false]);
    await userEvent.click(items[1] as HTMLElement);
    expect(pressed(items)).toEqual(["false", "true", "false", "false"]);
    expect(lit(segments)).toEqual([false, true, false, false]);
    expect(dimmed(segments)).toEqual([true, false, true, true]);
    expect(shown()).toBe("meetings");
    await userEvent.click(items[2] as HTMLElement);
    expect(pressed(items)).toEqual(["false", "false", "true", "false"]);
    await userEvent.click(items[2] as HTMLElement);
    // The pointer is still over it, so its part is still shown until it leaves.
    await userEvent.unhover(items[2] as HTMLElement);
    expect(pressed(items)).toEqual(["false", "false", "false", "false"]);
    expect(dimmed(segments)).toEqual([false, false, false, false]);
    expect(shown()).toBe("none");
  });

  test("defaultActive starts a part active", async () => {
    const { items, shown } = await breakdown(<Breakdown group={{ defaultActive: "focus" }} />);
    expect(pressed(items)).toEqual(["true", "false", "false", "false"]);
    expect(shown()).toBe("focus");
  });

  test("controlled: the active prop wins and onActiveChange says what was asked", async () => {
    const onActiveChange = vi.fn();
    const { items, screen } = await breakdown(
      <Breakdown group={{ active: "reviews", onActiveChange }} />,
    );
    expect(pressed(items)).toEqual(["false", "false", "true", "false"]);
    await userEvent.click(items[0] as HTMLElement);
    expect(onActiveChange).toHaveBeenLastCalledWith("focus");
    expect(pressed(items)).toEqual(["false", "false", "true", "false"]);
    await userEvent.click(items[2] as HTMLElement);
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
    expect(pressed(items)).toEqual(["false", "false", "true", "false"]);
    await screen.rerender(<Breakdown group={{ active: null, onActiveChange }} />);
    expect(pressed(items)).toEqual(["false", "false", "false", "false"]);
  });

  test("uncontrolled, it also tells onActiveChange", async () => {
    const onActiveChange = vi.fn();
    const { items } = await breakdown(<Breakdown group={{ onActiveChange }} />);
    await userEvent.click(items[3] as HTMLElement);
    await userEvent.click(items[3] as HTMLElement);
    expect(onActiveChange.mock.calls).toEqual([["support"], [null]]);
  });

  test("hovering an item shows its part over the active one, and leaving brings it back", async () => {
    const { items, segments, shown } = await breakdown(
      <Breakdown group={{ defaultActive: "focus" }} />,
    );
    await userEvent.hover(items[2] as HTMLElement);
    expect(shown()).toBe("reviews");
    expect(lit(segments)).toEqual([false, false, true, false]);
    // Only the press is a choice: aria-pressed stays on the active part.
    expect(pressed(items)).toEqual(["true", "false", "false", "false"]);
    await userEvent.unhover(items[2] as HTMLElement);
    expect(shown()).toBe("focus");
    expect(lit(segments)).toEqual([true, false, false, false]);
  });

  test("hovering a segment with a mouse shows its part; a touch does not", async () => {
    const { segments, shown } = await breakdown(<Breakdown />);
    await userEvent.hover(segments[1] as HTMLElement);
    expect(shown()).toBe("meetings");
    expect(dimmed(segments)).toEqual([true, false, true, true]);
    await userEvent.unhover(segments[1] as HTMLElement);
    expect(shown()).toBe("none");
    const touch = (type: string, target: Element) =>
      target.dispatchEvent(
        new PointerEvent(type, { pointerType: "touch", bubbles: true, composed: true }),
      );
    touch("pointerover", segments[2] as HTMLElement);
    touch("pointerenter", segments[2] as HTMLElement);
    expect(shown()).toBe("none");
  });

  test("the children function gets the shown part", async () => {
    const seen: (string | null)[] = [];
    await breakdown(
      <Meter.Group defaultActive="a">
        {(shown) => {
          seen.push(shown);
          return <Meter.Root value={1} aria-label="A" />;
        }}
      </Meter.Group>,
    );
    expect(seen[0]).toBe("a");
  });

  test("works without a Group: nothing is active and nothing happens", async () => {
    const { items, segments } = await breakdown(
      <div style={{ inlineSize: 300 }}>
        <Meter.Root value={10} aria-label="A">
          <Meter.Track>
            <Meter.Segment name="a" value={6} />
            <Meter.Segment name="b" value={4} />
          </Meter.Track>
        </Meter.Root>
        <Meter.Legend>
          <Meter.LegendItem name="a">A</Meter.LegendItem>
          <Meter.LegendItem name="b">B</Meter.LegendItem>
        </Meter.Legend>
      </div>,
    );
    await userEvent.click(items[0] as HTMLElement);
    await userEvent.hover(items[1] as HTMLElement);
    await userEvent.hover(segments[0] as HTMLElement);
    expect(pressed(items)).toEqual(["false", "false"]);
    expect(dimmed(segments)).toEqual([false, false]);
    expect(lit(segments)).toEqual([false, false]);
  });

  test("a handler of yours runs, and preventDefault keeps the press from choosing", async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { items } = await breakdown(
      <Meter.Group>
        <Meter.Root value={1} aria-label="A" />
        <Meter.Legend>
          <Meter.LegendItem name="a" onClick={onClick}>
            A
          </Meter.LegendItem>
          <Meter.LegendItem name="b">B</Meter.LegendItem>
        </Meter.Legend>
      </Meter.Group>,
    );
    await userEvent.click(items[0] as HTMLElement);
    expect(onClick).toHaveBeenCalledOnce();
    expect(pressed(items)).toEqual(["false", "false"]);
    await userEvent.click(items[1] as HTMLElement);
    expect(pressed(items)).toEqual(["false", "true"]);
  });

  test("the keyboard reaches each item in turn, and Space and Enter press it", async () => {
    const { items } = await breakdown(<Breakdown />);
    await userEvent.tab();
    expect(document.activeElement).toBe(items[0]);
    await userEvent.keyboard(" ");
    expect(pressed(items)).toEqual(["true", "false", "false", "false"]);
    await userEvent.tab();
    expect(document.activeElement).toBe(items[1]);
    await userEvent.keyboard("{Enter}");
    expect(pressed(items)).toEqual(["false", "true", "false", "false"]);
    await userEvent.keyboard("{Enter}");
    expect(pressed(items)).toEqual(["false", "false", "false", "false"]);
  });

  test("a disabled item cannot be pressed", async () => {
    const { items } = await breakdown(
      <Meter.Group>
        <Meter.Legend>
          <Meter.LegendItem name="a" disabled>
            A
          </Meter.LegendItem>
        </Meter.Legend>
      </Meter.Group>,
    );
    await userEvent.click(items[0] as HTMLElement, { force: true });
    expect(pressed(items)).toEqual(["false"]);
  });
});

describe("Meter with parts: what a screen reader gets", () => {
  test("the meter keeps its role and values; nothing in it can take focus", async () => {
    const { bar, legend, items } = await breakdown(<Breakdown />);
    expect(bar.getAttribute("role")).toBe("meter");
    expect(bar.getAttribute("aria-valuenow")).toBe("32");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("40");
    expect(bar.getAttribute("aria-label")).toBe("Week");
    expect(
      bar.querySelectorAll("button, a, input, select, textarea, [tabindex], [contenteditable]"),
    ).toHaveLength(0);
    expect(bar.contains(legend)).toBe(false);
    expect(legend.getAttribute("role")).toBe("group");
    expect(legend.getAttribute("aria-label")).toBe("Parts");
    for (const item of items) {
      expect(item.tagName).toBe("BUTTON");
      expect(item.getAttribute("type")).toBe("button");
    }
  });

  test("choosing a part changes no meter value", async () => {
    const { bar, items } = await breakdown(<Breakdown />);
    await userEvent.click(items[0] as HTMLElement);
    expect(bar.getAttribute("aria-valuenow")).toBe("32");
    expect(bar.getAttribute("aria-valuetext")).toBe("80%");
  });
});

describe("Meter.Segment's width", () => {
  test("a value outside the range is clamped, and NaN is nothing", async () => {
    const { segments } = await breakdown(
      <Meter.Root value={100} aria-label="A">
        <Meter.Track>
          <Meter.Segment value={500} />
          <Meter.Segment value={-5} />
          <Meter.Segment value={Number.NaN} />
        </Meter.Track>
      </Meter.Root>,
    );
    expect(segments.map((one) => one.style.getPropertyValue("--_share"))).toEqual([
      "100",
      "0",
      "0",
    ]);
    expect(segments.map((one) => one.hasAttribute("data-empty"))).toEqual([false, true, true]);
    expect(segments.map((one) => getComputedStyle(one).display)).toEqual(["block", "none", "none"]);
  });

  test("the rest is one more pill from the Root's value, and no element of yours", async () => {
    const { track, bar } = await breakdown(<Breakdown />);
    expect(track.children).toHaveLength(4);
    const rest = getComputedStyle(track, "::after");
    expect(rest.content).toBe('""');
    expect(rest.backgroundColor).toBe(resolve(TRACK));
    expect(rest.borderTopLeftRadius).toBe("999px");
    expect(rest.flexGrow).toBe("20");
    expect(bar.hasAttribute("data-full")).toBe(false);
  });

  test("a full meter draws no rest", async () => {
    const { track, bar } = await breakdown(<Breakdown value={40} />);
    expect(bar.hasAttribute("data-full")).toBe(true);
    expect(getComputedStyle(track, "::after").display).toBe("none");
  });

  test("a track with parts is a row with no groove and no clip, and one without keeps its own", async () => {
    const { track } = await breakdown(<Breakdown />);
    const style = getComputedStyle(track);
    expect([style.display, style.overflow, style.columnGap]).toEqual(["flex", "visible", "3px"]);
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style.outlineStyle).toBe("none");
    const plain = await mount(<Meter.Root value={40} aria-label="A" />);
    expect(getComputedStyle(plain.track).overflow).toBe("hidden");
    expect(getComputedStyle(plain.track, "::after").content).toBe("none");
  });
});

describe("Meter's colors by position", () => {
  const STEPS = [0, 22, 44, 66, 88];
  const mix = (step: number) => `color-mix(in oklab, var(--ow-accent), var(--ow-fg) ${step}%)`;

  function Parts({ count }: { count: number }) {
    const names = Array.from({ length: count }, (_, i) => `p${i}`);
    return (
      <Meter.Group>
        <Meter.Root value={count} max={count + 1} aria-label="A">
          <Meter.Track>
            {names.map((name) => (
              <Meter.Segment key={name} name={name} value={1} />
            ))}
          </Meter.Track>
        </Meter.Root>
        <Meter.Legend>
          {names.map((name) => (
            <Meter.LegendItem key={name} name={name}>
              {name}
            </Meter.LegendItem>
          ))}
        </Meter.Legend>
      </Meter.Group>
    );
  }

  test("step from the accent toward the text color, and start over at the sixth", async () => {
    const { segments, items } = await breakdown(<Parts count={7} />);
    const want = [...STEPS, ...STEPS].slice(0, 7).map((step) => resolve(mix(step)));
    expect(segments.map((one) => getComputedStyle(one).backgroundColor)).toEqual(want);
    // The dots take their segment's color by position.
    expect(items.map((one) => getComputedStyle(one, "::before").backgroundColor)).toEqual(want);
    expect(new Set(want.slice(0, 5)).size).toBe(5);
  });

  test("every step has 3:1 against the page, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { segments, items } = await breakdown(<Parts count={5} />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = composite(resolve("var(--ow-bg)"));
      for (const [i, one] of segments.entries()) {
        const color = composite(getComputedStyle(one).backgroundColor);
        const ratio = contrast(color, page);
        expect(ratio, `${STEPS[i]}% on the page, ${theme}`).toBeGreaterThanOrEqual(3);
        const dot = composite(getComputedStyle(items[i] as Element, "::before").backgroundColor);
        expect(contrast(dot, page), `dot ${STEPS[i]}%, ${theme}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test("a tone paints the part in its token, and the legend item matches it", async () => {
    const { segments, items } = await breakdown(
      <Meter.Group>
        <Meter.Root value={4} max={10} aria-label="A">
          <Meter.Track>
            {TONES.map((tone) => (
              <Meter.Segment key={tone} name={tone} value={1} tone={tone} />
            ))}
          </Meter.Track>
        </Meter.Root>
        <Meter.Legend>
          {TONES.map((tone) => (
            <Meter.LegendItem key={tone} name={tone} tone={tone}>
              {tone}
            </Meter.LegendItem>
          ))}
        </Meter.Legend>
      </Meter.Group>,
    );
    const want = TONES.map((tone) => resolve(`var(--ow-${tone})`));
    expect(segments.map((one) => getComputedStyle(one).backgroundColor)).toEqual(want);
    expect(items.map((one) => getComputedStyle(one, "::before").backgroundColor)).toEqual(want);
    expect(segments.map((one) => one.dataset.tone)).toEqual(TONES);
  });
});

describe("Meter's shown part", () => {
  test("the others step back to 0.38 on a fade; the rest and the shown part do not", async () => {
    const { segments, items, track } = await breakdown(<Breakdown />);
    const opacity = () => segments.map((one) => getComputedStyle(one).opacity);
    expect(opacity()).toEqual(["1", "1", "1", "1"]);
    await userEvent.click(items[0] as HTMLElement);
    expect(getComputedStyle(segments[1] as Element).transitionProperty).toBe("opacity");
    expect(getComputedStyle(segments[1] as Element).transitionDuration).toBe("0.18s");
    expect(getComputedStyle(segments[1] as Element).transitionTimingFunction).toBe(resolveEase());
    finish(...segments);
    expect(opacity()).toEqual(["1", "0.38", "0.38", "0.38"]);
    expect(getComputedStyle(track, "::after").opacity).toBe("1");
    expect(getComputedStyle(track, "::after").transitionDuration).toBe("0s");
    await userEvent.click(items[0] as HTMLElement);
    await userEvent.unhover(items[0] as HTMLElement);
    finish(...segments);
    expect(opacity()).toEqual(["1", "1", "1", "1"]);
  });
});

/** The ease-out token, as a computed timing function. */
function resolveEase(): string {
  const probe = document.createElement("span");
  probe.style.transitionTimingFunction = "var(--ow-ease-out)";
  document.body.append(probe);
  const value = getComputedStyle(probe).transitionTimingFunction;
  probe.remove();
  return value;
}

describe("Meter.Group's size", () => {
  test("reaches the Root and the Legend; their own size wins", async () => {
    const sizes = (ui: ReactNode) =>
      breakdown(ui).then(({ bar, legend, track }) => [
        bar.dataset.size,
        legend.dataset.size,
        track.getBoundingClientRect().height,
        getComputedStyle(legend).fontSize,
      ]);
    expect(await sizes(<Breakdown />)).toEqual(["md", "md", 8, "13px"]);
    expect(await sizes(<Breakdown group={{ size: "lg" }} />)).toEqual(["lg", "lg", 12, "14px"]);
    expect(await sizes(<Breakdown group={{ size: "sm" }} />)).toEqual(["sm", "sm", 4, "12px"]);
    expect(await sizes(<Breakdown group={{ size: "sm" }} size="lg" />)).toEqual([
      "lg",
      "sm",
      12,
      "12px",
    ]);
  });

  test("a Legend's own size wins over the Group's", async () => {
    const { legend } = await breakdown(
      <Meter.Group size="lg">
        <Meter.Legend size="sm" aria-label="A" />
      </Meter.Group>,
    );
    expect(legend.dataset.size).toBe("sm");
  });
});

describe("Meter.Legend's items", () => {
  test("are pills at least 24px tall at every size, flat and muted until hovered", async () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const { items } = await breakdown(<Breakdown group={{ size }} />);
      for (const item of items) {
        expect(item.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
        expect(getComputedStyle(item).borderTopLeftRadius).toBe("999px");
        expect(getComputedStyle(item).backgroundColor).toBe("rgba(0, 0, 0, 0)");
        expect(getComputedStyle(item).color).toBe(resolve("var(--ow-muted)"));
      }
    }
  });

  test("a dot in the part's color, then the text, then the value, muted and tabular", async () => {
    const { items } = await breakdown(<Breakdown />);
    const item = items[0] as HTMLElement;
    const dot = getComputedStyle(item, "::before");
    expect(dot.content).toBe('""');
    expect(dot.borderTopLeftRadius).toBe("50%");
    const value = item.querySelector(".ow-meter__legend-value") as HTMLElement;
    expect(getComputedStyle(value).color).toBe(resolve("var(--ow-muted)"));
    expect(getComputedStyle(value).fontVariantNumeric).toBe("tabular-nums");
    expect(item.textContent).toBe("Focus 14 h");
  });

  test("hovering tints an item and turns its text to the text color", async () => {
    const { items } = await breakdown(<Breakdown />);
    await userEvent.hover(items[1] as HTMLElement);
    expect(getComputedStyle(items[1] as Element).backgroundColor).toBe(resolve("var(--ow-hover)"));
    expect(getComputedStyle(items[1] as Element).color).toBe(resolve("var(--ow-fg)"));
  });

  test("a pressed item is a soft Toggle that is on, its value in the same color", async () => {
    const { items } = await breakdown(<Breakdown group={{ defaultActive: "focus" }} />);
    const item = items[0] as HTMLElement;
    const on = resolve("color-mix(in oklab, var(--ow-accent) 70%, var(--ow-fg))");
    expect(getComputedStyle(item).backgroundColor).toBe(
      resolve("color-mix(in oklab, var(--ow-accent) 14%, transparent)"),
    );
    expect(getComputedStyle(item).color).toBe(on);
    const value = item.querySelector(".ow-meter__legend-value") as HTMLElement;
    expect(getComputedStyle(value).color).toBe(on);
    // The others' values stay muted.
    const other = items[1]?.querySelector(".ow-meter__legend-value") as HTMLElement;
    expect(getComputedStyle(other).color).toBe(resolve("var(--ow-muted)"));
  });

  test("text has 4.5:1 on the page, hovered and pressed, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { items } = await breakdown(<Breakdown group={{ defaultActive: "focus" }} />);
    await userEvent.hover(items[1] as HTMLElement);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = composite(resolve("var(--ow-bg)"));
      const look = (item: Element, part: Element = item) => {
        const style = getComputedStyle(item);
        const ground = composite(resolve("var(--ow-bg)"), style.backgroundColor);
        return contrast(composite(getComputedStyle(part).color), ground);
      };
      const value = (i: number) => items[i]?.querySelector(".ow-meter__legend-value") as Element;
      expect(look(items[2] as Element), `muted, ${theme}`).toBeGreaterThanOrEqual(4.5);
      expect(look(items[2] as Element, value(2)), `muted value, ${theme}`).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(look(items[1] as Element), `hovered, ${theme}`).toBeGreaterThanOrEqual(4.5);
      expect(look(items[0] as Element), `pressed, ${theme}`).toBeGreaterThanOrEqual(4.5);
      expect(look(items[0] as Element, value(0)), `pressed value, ${theme}`).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(page).toBeTruthy();
    }
  });

  test("held down, it goes in to 0.97 on the 90ms ease; it lets go on the settle spring", async () => {
    const { items } = await breakdown(<Breakdown />);
    const item = items[0] as HTMLElement;
    expect(getComputedStyle(item).transitionProperty).toBe("transform");
    expect(getComputedStyle(item).transitionDuration).toBe(
      resolveDuration("var(--ow-spring-settle-duration)"),
    );
    await userEvent.hover(item);
    await commands.mouse("down");
    onTestFinished(() => commands.mouse("up"));
    expect(item.matches(":active")).toBe(true);
    expect(getComputedStyle(item).transitionDuration).toBe("0.09s");
    finish(item);
    expect(getComputedStyle(item).transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    await userEvent.unhover(item);
  });

  test("under reduced motion a press does not scale, and the fade stays", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { items, segments } = await breakdown(<Breakdown group={{ defaultActive: "focus" }} />);
    const item = items[1] as HTMLElement;
    await userEvent.hover(item);
    await commands.mouse("down");
    onTestFinished(() => commands.mouse("up"));
    finish(item);
    expect(getComputedStyle(item).transform).toBe("none");
    expect(getComputedStyle(segments[1] as Element).transitionProperty).toBe("opacity");
    await userEvent.unhover(item);
  });

  test("keyboard focus draws the ring", async () => {
    const { items } = await breakdown(<Breakdown />);
    await userEvent.tab();
    const style = getComputedStyle(items[0] as Element);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineColor).toBe(resolve("var(--ow-focus)"));
  });
});

describe("Meter with parts, around it", () => {
  test("more contrast brings the parts' and the rest's edges back", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const { segments, track } = await breakdown(<Breakdown />);
    await commands.setContrast("more");
    for (const one of segments) {
      expect(getComputedStyle(one).outlineColor).toBe(resolve("var(--ow-edge)"));
      expect(getComputedStyle(one).outlineWidth).toBe("1px");
    }
    expect(getComputedStyle(track, "::after").outlineColor).toBe(resolve("var(--ow-edge)"));
  });

  test("forced colors: parts keep an edge; shown is Highlight, the others gray, a pressed item Highlight", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { segments, items, track } = await breakdown(<Breakdown />);
    await commands.setForcedColors("active");
    const fills = () => segments.map((one) => getComputedStyle(one).backgroundColor);
    expect(fills()).toEqual(Array(4).fill(resolve("CanvasText")));
    for (const one of segments) expect(getComputedStyle(one).outlineStyle).toBe("solid");
    expect(getComputedStyle(track, "::after").outlineStyle).toBe("solid");
    await userEvent.click(items[1] as HTMLElement);
    finish(...segments);
    expect(fills()).toEqual([
      resolve("GrayText"),
      resolve("Highlight"),
      resolve("GrayText"),
      resolve("GrayText"),
    ]);
    expect(getComputedStyle(items[1] as Element).backgroundColor).toBe(resolve("Highlight"));
    expect(getComputedStyle(items[1] as Element).color).toBe(resolve("HighlightText"));
  });

  test("prints its colors", async () => {
    const { segments, items, track } = await breakdown(<Breakdown />);
    expect(getComputedStyle(segments[0] as Element).printColorAdjust).toBe("exact");
    expect(getComputedStyle(track, "::after").printColorAdjust).toBe("exact");
    expect(getComputedStyle(items[0] as Element, "::before").printColorAdjust).toBe("exact");
  });

  test("passes className, style, and ref through, and has its data-slot, on every new part", async () => {
    const refs = {
      group: createRef<HTMLDivElement>(),
      segment: createRef<HTMLSpanElement>(),
      legend: createRef<HTMLDivElement>(),
      item: createRef<HTMLButtonElement>(),
      value: createRef<HTMLSpanElement>(),
    };
    const { screen } = await breakdown(
      <Meter.Group ref={refs.group} className="g" style={{ opacity: 0.9 }}>
        <Meter.Root value={4} aria-label="A">
          <Meter.Track>
            <Meter.Segment
              ref={refs.segment}
              name="a"
              value={4}
              className="s"
              style={{ opacity: 0.8 }}
            />
          </Meter.Track>
        </Meter.Root>
        <Meter.Legend ref={refs.legend} className="l" aria-label="L">
          <Meter.LegendItem
            ref={refs.item}
            name="a"
            className="i"
            render={<button type="button" />}
          >
            A{" "}
            <Meter.LegendValue ref={refs.value} className="v">
              4
            </Meter.LegendValue>
          </Meter.LegendItem>
        </Meter.Legend>
      </Meter.Group>,
    );
    expect(refs.group.current?.className).toBe("g");
    expect(refs.group.current?.dataset.slot).toBe("meter-group");
    expect(refs.group.current?.style.opacity).toBe("0.9");
    expect(refs.segment.current?.className).toBe("ow-meter__segment s");
    expect(refs.segment.current?.dataset.slot).toBe("meter-segment");
    expect(refs.segment.current?.style.opacity).toBe("0.8");
    expect(refs.segment.current?.style.getPropertyValue("--_share")).toBe("4");
    expect(refs.legend.current?.className).toBe("ow-meter__legend ow-meter__legend--md l");
    expect(refs.legend.current?.dataset.slot).toBe("meter-legend");
    expect(refs.item.current?.className).toBe("ow-meter__legend-item i");
    expect(refs.item.current?.dataset.slot).toBe("meter-legend-item");
    expect(refs.value.current?.className).toBe("ow-meter__legend-value v");
    expect(refs.value.current?.dataset.slot).toBe("meter-legend-value");
    expect(screen.container.querySelector("[data-slot=meter-group]")).toBe(refs.group.current);
  });

  test("a legend item can render as another element", async () => {
    const { screen } = await breakdown(
      <Meter.Group>
        <Meter.Legend>
          <Meter.LegendItem name="a" nativeButton={false} render={<div />}>
            A
          </Meter.LegendItem>
        </Meter.Legend>
      </Meter.Group>,
    );
    const item = screen.container.querySelector(".ow-meter__legend-item") as HTMLElement;
    expect(item.tagName).toBe("DIV");
    expect(item.getAttribute("role")).toBe("button");
    await userEvent.click(item);
    expect(item.getAttribute("aria-pressed")).toBe("true");
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(<Breakdown group={{ defaultActive: "focus" }} />);
    expect(html).toContain("ow-meter__segment");
    expect(html).toContain("ow-meter__legend-item");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("--_share:35");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, with a part picked", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Breakdown group={{ defaultActive: "meetings" }} />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a press and a hover too", async () => {
    const { items } = await breakdown(<Breakdown />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.hover(items[1] as HTMLElement);
    await userEvent.click(items[1] as HTMLElement);
    await userEvent.unhover(items[1] as HTMLElement);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

function resolveDuration(value: string): string {
  const probe = document.createElement("span");
  probe.style.transitionDuration = value;
  document.body.append(probe);
  const computed = getComputedStyle(probe).transitionDuration;
  probe.remove();
  return computed;
}
