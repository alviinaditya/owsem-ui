import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { rect, TOL } from "../../../test/geometry.ts";
import { Slider, type SliderSize } from "./index";

// A thumb is 16, 20, or 24 px on a 4, 6, or 8 px track, centered on it, and flush with the slider's
// ends at the minimum and the maximum, since the control pads each end by half a thumb.
const SIZES: [SliderSize, number, number][] = [
  ["sm", 4, 16],
  ["md", 6, 20],
  ["lg", 8, 24],
];

/** What the thumb is placed against: the track without its transparent ends. */
const padBox = (el: HTMLElement) =>
  new DOMRect(
    rect(el).left + el.clientLeft,
    rect(el).top + el.clientTop,
    el.clientWidth,
    el.clientHeight,
  );

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

async function mount(ui: ReactNode, dir: "ltr" | "rtl" = "ltr", width = 300) {
  const screen = await render(
    <DirectionProvider direction={dir}>
      <div dir={dir} style={{ inlineSize: width }}>
        {ui}
      </div>
    </DirectionProvider>,
  );
  const q = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  return {
    screen,
    slider: q(".ow-slider"),
    control: q(".ow-slider__control"),
    track: q(".ow-slider__track"),
    fill: q(".ow-slider__indicator"),
    thumb: q(".ow-slider__thumb"),
  };
}

describe("Slider geometry", () => {
  test.each(SIZES)(
    "%s: the track and thumb are exact and share a center line",
    async (size, groove, key) => {
      const { track, thumb, control } = await mount(
        <Slider.Root defaultValue={40} size={size} aria-label="A" />,
      );
      close(rect(track).height, groove);
      close(rect(thumb).width, key);
      close(rect(thumb).height, key);
      close(rect(thumb).top + rect(thumb).height / 2, rect(track).top + rect(track).height / 2);
      close(rect(control).height, Math.max(key, 24));
      close(rect(track).top + rect(track).height / 2, rect(control).top + rect(control).height / 2);
    },
  );

  test.each(SIZES)(
    "%s: the thumb is flush with the slider's ends at the minimum and the maximum",
    async (size) => {
      const min = await mount(<Slider.Root defaultValue={0} size={size} aria-label="A" />);
      close(rect(min.thumb).left, rect(min.slider).left);
      close(rect(min.track).left, rect(min.slider).left);
      close(padBox(min.track).left - rect(min.slider).left, rect(min.thumb).width / 2);
      const max = await mount(<Slider.Root defaultValue={100} size={size} aria-label="A" />);
      close(rect(max.thumb).right, rect(max.slider).right);
      close(rect(max.fill).right, padBox(max.track).right);
    },
  );

  test.each(SIZES)(
    "%s: a hit area of 24px each way around the thumb, and the control is as tall",
    async (size, _groove, key) => {
      const { thumb, control } = await mount(
        <Slider.Root defaultValue={40} size={size} aria-label="A" />,
      );
      const reach = getComputedStyle(thumb, "::before");
      const side = key - 2 * Number.parseFloat(reach.top);
      expect(side).toBeGreaterThanOrEqual(24 - TOL);
      expect(rect(control).height).toBeGreaterThanOrEqual(24 - TOL);
    },
  );

  test("the label is at the start and the value at the end, above the control, which gets the whole width", async () => {
    const { slider, control, screen } = await mount(
      <Slider.Root defaultValue={40}>
        <Slider.Label>Volume</Slider.Label>
        <Slider.Value />
        <Slider.Control />
      </Slider.Root>,
    );
    const label = screen.container.querySelector(".ow-slider__label") as HTMLElement;
    const value = screen.container.querySelector(".ow-slider__value") as HTMLElement;
    close(rect(label).left, rect(slider).left);
    close(rect(value).right, rect(slider).right);
    expect(rect(label).bottom).toBeLessThanOrEqual(rect(control).top + TOL);
    close(rect(control).width, 300);
    close(rect(control).top - rect(label).bottom, 8);
  });

  test("with no label or value the control is all there is", async () => {
    const { slider, control } = await mount(<Slider.Root defaultValue={40} aria-label="A" />);
    close(rect(control).top, rect(slider).top);
    close(rect(slider).height, 24);
  });

  test("right to left: the thumb at the minimum is at the right end and the fill grows leftward", async () => {
    const min = await mount(<Slider.Root defaultValue={0} aria-label="A" />, "rtl");
    close(rect(min.thumb).right, rect(min.slider).right);
    const max = await mount(<Slider.Root defaultValue={100} aria-label="A" />, "rtl");
    close(rect(max.thumb).left, rect(max.slider).left);
    close(rect(max.fill).left, padBox(max.track).left);
  });

  test.each(SIZES)(
    "%s: upright, the thumb is centered on the track and flush at the ends",
    async (size, groove, key) => {
      const min = await mount(
        <Slider.Root orientation="vertical" defaultValue={0} size={size} aria-label="A" />,
      );
      close(rect(min.track).width, groove);
      close(rect(min.thumb).left + key / 2, rect(min.track).left + groove / 2);
      close(rect(min.thumb).bottom, rect(min.slider).bottom);
      const max = await mount(
        <Slider.Root orientation="vertical" defaultValue={100} size={size} aria-label="A" />,
      );
      close(rect(max.thumb).top, rect(max.slider).top);
      close(rect(max.control).width, Math.max(key, 24));
    },
  );

  test("upright, a label and a value stack above the control, centered", async () => {
    const { slider, control, screen } = await mount(
      <Slider.Root orientation="vertical" defaultValue={40}>
        <Slider.Label>Volume</Slider.Label>
        <Slider.Value />
        <Slider.Control />
      </Slider.Root>,
    );
    const label = screen.container.querySelector(".ow-slider__label") as HTMLElement;
    const value = screen.container.querySelector(".ow-slider__value") as HTMLElement;
    expect(rect(label).bottom).toBeLessThanOrEqual(rect(value).top + TOL);
    expect(rect(value).bottom).toBeLessThanOrEqual(rect(control).top + TOL);
    close(rect(slider).height, 192);
    close(rect(control).bottom, rect(slider).bottom);
  });

  test("a range's two thumbs sit at their values and the fill runs between their centers", async () => {
    const { screen, track, fill } = await mount(
      <Slider.Root defaultValue={[25, 75]} aria-label="A" />,
    );
    const [a, b] = [...screen.container.querySelectorAll(".ow-slider__thumb")] as HTMLElement[];
    close(
      rect(a as HTMLElement).left + rect(a as HTMLElement).width / 2,
      padBox(track).left + padBox(track).width * 0.25,
    );
    close(
      rect(b as HTMLElement).left + rect(b as HTMLElement).width / 2,
      padBox(track).left + padBox(track).width * 0.75,
    );
    // Drawn half a thumb longer at its start, under the first thumb.
    close(rect(fill).left, padBox(track).left + padBox(track).width * 0.25 - 10);
    close(rect(fill).width, padBox(track).width * 0.5 + 10);
    close(rect(fill).left, rect(a as HTMLElement).left);
    close(rect(fill).right, rect(b as HTMLElement).left + rect(b as HTMLElement).width / 2);
  });

  test.each(SIZES)(
    "%s: the drawn groove's ends are the slider's own edges, and the fill starts at the groove's",
    async (size) => {
      for (const value of [0, 40, 100]) {
        const { slider, track, fill } = await mount(
          <Slider.Root defaultValue={value} size={size} aria-label="A" />,
        );
        const groove = rect(track);
        close(groove.left, rect(slider).left);
        close(groove.right, rect(slider).right);
        close(rect(fill).left, groove.left);
      }
    },
  );

  test("right to left: the groove spans the slider, and the fill starts at its right end", async () => {
    const { slider, track, fill } = await mount(
      <Slider.Root defaultValue={40} aria-label="A" />,
      "rtl",
    );
    const groove = rect(track);
    close(groove.left, rect(slider).left);
    close(groove.right, rect(slider).right);
    close(rect(fill).right, groove.right);
  });

  test.each(SIZES)(
    "%s: upright, the groove spans the slider's control and the fill starts at its bottom",
    async (size) => {
      const { track, fill, control } = await mount(
        <Slider.Root orientation="vertical" defaultValue={40} size={size} aria-label="A" />,
      );
      const groove = rect(track);
      close(groove.top, rect(control).top);
      close(groove.bottom, rect(control).bottom);
      close(rect(fill).bottom, groove.bottom);
    },
  );

  test("a range's fill never shows outside its thumbs, at any pair of values", async () => {
    for (const value of [
      [0, 100],
      [10, 20],
      [45, 55],
    ]) {
      const { screen, fill } = await mount(<Slider.Root defaultValue={value} aria-label="A" />);
      const [a, b] = [...screen.container.querySelectorAll(".ow-slider__thumb")] as HTMLElement[];
      expect(rect(fill).left).toBeGreaterThanOrEqual(rect(a as HTMLElement).left - TOL);
      expect(rect(fill).right).toBeLessThanOrEqual(rect(b as HTMLElement).right + TOL);
    }
  });
});
