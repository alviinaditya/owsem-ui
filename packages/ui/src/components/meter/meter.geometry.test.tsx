import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { Meter } from "./index";

const PARTS = [
  ["focus", 14],
  ["meetings", 9],
  ["reviews", 6],
  ["support", 3],
] as const;

/** A week of 40 hours with 32 of them in four parts, and a legend. */
function Breakdown({
  width = 400,
  value = 32,
  size,
}: {
  width?: number;
  value?: number;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div style={{ inlineSize: width }}>
      <Meter.Group size={size}>
        <Meter.Root value={value} max={40} aria-label="Week">
          <Meter.Track>
            {PARTS.map(([name, hours]) => (
              <Meter.Segment key={name} name={name} value={hours} />
            ))}
          </Meter.Track>
        </Meter.Root>
        <Meter.Legend aria-label="Parts">
          {PARTS.map(([name, hours]) => (
            <Meter.LegendItem key={name} name={name}>
              {name} <Meter.LegendValue>{hours} h</Meter.LegendValue>
            </Meter.LegendItem>
          ))}
        </Meter.Legend>
      </Meter.Group>
    </div>
  );
}

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const first = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  const all = <T extends HTMLElement>(selector: string) => [
    ...screen.container.querySelectorAll<T>(selector),
  ];
  const track = first(".ow-meter__track");
  const segments = all(".ow-meter__segment");
  return {
    track,
    segments,
    items: all<HTMLButtonElement>(".ow-meter__legend-item"),
    legend: first(".ow-meter__legend"),
    /** The widths of the parts, then the rest, which is drawn after them. */
    widths: () => [
      ...segments.map((one) => one.getBoundingClientRect().width),
      Number.parseFloat(getComputedStyle(track, "::after").width),
    ],
  };
}

const sum = (list: number[]) => list.reduce((total, one) => total + one, 0);

describe("Meter parts' geometry", () => {
  for (const width of [137, 200, 280, 337.5, 400, 640]) {
    test(`at ${width}px the pills and the gaps add up to the track, each its share`, async () => {
      const { track, widths } = await mount(<Breakdown width={width} />);
      const all = widths();
      const groove = track.getBoundingClientRect().width;
      // Five pills, four gaps of 3px.
      expect(sum(all) + 4 * 3).toBeGreaterThan(groove - TOL);
      expect(sum(all) + 4 * 3).toBeLessThan(groove + TOL);
      const free = groove - 12;
      for (const [i, hours] of [14, 9, 6, 3, 8].entries()) {
        expect(all[i], `pill ${i}`).toBeGreaterThan((hours / 40) * free - TOL);
        expect(all[i], `pill ${i}`).toBeLessThan((hours / 40) * free + TOL);
      }
    });
  }

  test("each part starts where the one before ends, and a gap of 3px lies between", async () => {
    const { segments } = await mount(<Breakdown />);
    const boxes = segments.map((one) => one.getBoundingClientRect());
    for (const [i, box] of boxes.entries()) {
      const before = boxes[i - 1];
      if (before) expect(box.left - before.right).toBeCloseTo(3, 0);
    }
  });

  test("a full meter has no rest: the last part ends at the track's end", async () => {
    const { track, segments } = await mount(
      <div style={{ inlineSize: 300 }}>
        <Meter.Root value={10} max={10} aria-label="A">
          <Meter.Track>
            <Meter.Segment value={6} />
            <Meter.Segment value={4} />
          </Meter.Track>
        </Meter.Root>
      </div>,
    );
    const groove = track.getBoundingClientRect();
    const [a, b] = segments.map((one) => one.getBoundingClientRect());
    expect(getComputedStyle(track, "::after").display).toBe("none");
    expect(a?.left).toBeCloseTo(groove.left, 0);
    expect(b?.right).toBeCloseTo(groove.right, 0);
    expect((a?.width ?? 0) + (b?.width ?? 0) + 3).toBeCloseTo(groove.width, 0);
  });

  test("an empty meter is all rest, and a part of nothing takes no room", async () => {
    const { track, widths } = await mount(
      <div style={{ inlineSize: 300 }}>
        <Meter.Root value={0} aria-label="A">
          <Meter.Track>
            <Meter.Segment value={0} />
          </Meter.Track>
        </Meter.Root>
      </div>,
    );
    expect(widths().at(-1)).toBeCloseTo(track.getBoundingClientRect().width, 0);
  });

  test("min and max set the range: the parts are their share of the span", async () => {
    const { track, segments } = await mount(
      <div style={{ inlineSize: 203 }}>
        <Meter.Root value={30} min={10} max={50} aria-label="A">
          <Meter.Track>
            <Meter.Segment value={12} />
            <Meter.Segment value={8} />
          </Meter.Track>
        </Meter.Root>
      </div>,
    );
    // The fill covers 20 of the span of 40; two gaps leave 197px.
    const [a, b] = segments.map((one) => one.getBoundingClientRect().width);
    const rest = Number.parseFloat(getComputedStyle(track, "::after").width);
    expect(a).toBeCloseTo(0.3 * 197, 0);
    expect(b).toBeCloseTo(0.2 * 197, 0);
    expect(rest).toBeCloseTo(0.5 * 197, 0);
  });

  test("the pills are all the bar's height, and none is thicker once picked", async () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const { segments, items, track } = await mount(<Breakdown size={size} />);
      const bar = { sm: 4, md: 8, lg: 12 }[size];
      const heights = () => segments.map((one) => one.getBoundingClientRect().height);
      expect(heights()).toEqual([bar, bar, bar, bar]);
      expect(getComputedStyle(track, "::after").height).toBe(`${bar}px`);
      await userEvent.click(items[0] as HTMLElement);
      expect(heights()).toEqual([bar, bar, bar, bar]);
      expect(track.getBoundingClientRect().height).toBe(bar);
    }
  });

  test("a part is never thinner than the bar is thick, so a small one is still seen", async () => {
    const { segments } = await mount(
      <div style={{ inlineSize: 300 }}>
        <Meter.Root value={1} aria-label="A">
          <Meter.Track>
            <Meter.Segment value={0.2} />
            <Meter.Segment value={0.8} />
          </Meter.Track>
        </Meter.Root>
      </div>,
    );
    expect(segments[0]?.getBoundingClientRect().width).toBeGreaterThanOrEqual(8 - TOL);
  });

  test("in a right-to-left page the first part is at the right and the rest at the left", async () => {
    const { track, segments, widths } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Breakdown />
        </div>
      </DirectionProvider>,
    );
    const groove = track.getBoundingClientRect();
    const boxes = segments.map((one) => one.getBoundingClientRect());
    expect(boxes[0]?.right).toBeCloseTo(groove.right, 0);
    for (const [i, box] of boxes.entries()) {
      const before = boxes[i - 1];
      if (before) expect(before.left - box.right).toBeCloseTo(3, 0);
    }
    const rest = widths().at(-1) ?? 0;
    expect(boxes[3]?.left).toBeCloseTo(groove.left + rest + 3, 0);
  });
});

describe("Meter legend's geometry", () => {
  test("the first dot lines up with the start of the bar, in either direction", async () => {
    for (const dir of ["ltr", "rtl"] as const) {
      const { track, items } = await mount(
        <DirectionProvider direction={dir}>
          <div dir={dir}>
            <Breakdown />
          </div>
        </DirectionProvider>,
      );
      const item = items[0] as HTMLElement;
      const box = item.getBoundingClientRect();
      const groove = track.getBoundingClientRect();
      const pad = getComputedStyle(item);
      if (dir === "ltr") {
        expect(box.left + Number.parseFloat(pad.paddingLeft)).toBeCloseTo(groove.left, 0);
      } else {
        expect(box.right - Number.parseFloat(pad.paddingRight)).toBeCloseTo(groove.right, 0);
      }
    }
  });

  test("the legend sits below the bar, outside it, and wraps when it is narrow", async () => {
    const wide = await mount(<Breakdown width={900} />);
    const narrow = await mount(<Breakdown width={110} />);
    const bar = narrow.track.getBoundingClientRect();
    expect(narrow.legend.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar.bottom);
    expect(narrow.legend.getBoundingClientRect().height).toBeGreaterThan(
      wide.legend.getBoundingClientRect().height,
    );
  });

  test("an item is at least 24px tall at every size", async () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const { items } = await mount(<Breakdown size={size} />);
      for (const item of items) {
        expect(item.getBoundingClientRect().height).toBeGreaterThanOrEqual(24 - TOL);
      }
    }
  });
});
