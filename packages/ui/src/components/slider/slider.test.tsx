import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { rect } from "../../../test/geometry.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Field } from "../field";
import { Fieldset } from "../fieldset";
import { Form } from "../form";
import { Slider } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const el = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  return {
    screen,
    slider: el(".ow-slider"),
    control: el(".ow-slider__control"),
    track: el(".ow-slider__track"),
    fill: el(".ow-slider__indicator"),
    thumb: el(".ow-slider__thumb"),
    input: el<HTMLInputElement>("input[type=range]"),
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

/** What the thumb is placed against: the track without its transparent ends. */
const padBox = (el: HTMLElement) =>
  new DOMRect(
    el.getBoundingClientRect().left + el.clientLeft,
    el.getBoundingClientRect().top + el.clientTop,
    el.clientWidth,
    el.clientHeight,
  );

const TRACK = "color-mix(in oklab, var(--ow-fg) 10%, transparent)";
const centerX = (el: Element) =>
  el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2;
const centerY = (el: Element) =>
  el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2;
const wide = (ui: ReactNode, width = 300) => <div style={{ inlineSize: width }}>{ui}</div>;

describe("Slider", () => {
  test("the shortest use is named, has one thumb, and says its value", async () => {
    const { slider, input } = await mount(
      wide(<Slider.Root defaultValue={40} aria-label="Volume" />),
    );
    expect(slider.getAttribute("role")).toBe("group");
    expect(input.type).toBe("range");
    expect(input.getAttribute("aria-label")).toBe("Volume");
    expect(input.value).toBe("40");
    expect(input.getAttribute("aria-valuenow")).toBe("40");
    // Named once: the thumb carries the name, not the group around it.
    expect(slider.hasAttribute("aria-label")).toBe(false);
    expect(document.querySelectorAll(".ow-slider__thumb")).toHaveLength(1);
  });

  test("aria-describedby reaches the thumb it describes", async () => {
    const { input } = await mount(
      wide(
        <>
          <p id="hint">Between 0 and 100</p>
          <Slider.Root defaultValue={40} aria-label="Volume" aria-describedby="hint" />
        </>,
      ),
    );
    expect(input.getAttribute("aria-describedby")).toBe("hint");
  });

  test("a Label names it by aria-labelledby, and Value is the output the thumb belongs to", async () => {
    const { slider, input } = await mount(
      wide(
        <Slider.Root defaultValue={40}>
          <Slider.Label>Volume</Slider.Label>
          <Slider.Value />
          <Slider.Control />
        </Slider.Root>,
      ),
    );
    const label = slider.querySelector(".ow-slider__label") as HTMLElement;
    const value = slider.querySelector(".ow-slider__value") as HTMLElement;
    expect(value.tagName).toBe("OUTPUT");
    expect(value.textContent).toBe("40");
    expect(slider.getAttribute("aria-labelledby")).toBe(label.id);
    expect(input.getAttribute("aria-labelledby")).toBe(label.id);
    expect(value.getAttribute("for")).toBe(input.id);
  });

  test("Control without children draws a Track, and Track draws its Indicator and thumb", async () => {
    const { screen } = await mount(
      wide(
        <Slider.Root defaultValue={40} aria-label="A">
          <Slider.Control />
        </Slider.Root>,
      ),
    );
    const count = (selector: string) => screen.container.querySelectorAll(selector).length;
    expect(count(".ow-slider__track")).toBe(1);
    expect(count(".ow-slider__indicator")).toBe(1);
    expect(count(".ow-slider__thumb")).toBe(1);
  });

  test("with children it draws nothing of its own, and parts you give replace the drawn ones", async () => {
    const none = await mount(
      wide(
        <Slider.Root defaultValue={40}>
          <Slider.Label>Name</Slider.Label>
        </Slider.Root>,
      ),
    );
    expect(none.screen.container.querySelectorAll(".ow-slider__control")).toHaveLength(0);
    const given = await mount(
      wide(
        <Slider.Root defaultValue={40}>
          <Slider.Control>
            <Slider.Track className="t">
              <Slider.Thumb className="mine" aria-label="Own" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>,
      ),
    );
    const { screen } = given;
    expect(screen.container.querySelectorAll(".ow-slider__indicator")).toHaveLength(0);
    expect(screen.container.querySelectorAll(".ow-slider__thumb")).toHaveLength(1);
    expect(given.thumb.className).toBe("ow-slider__thumb mine");
    expect(given.track.className).toBe("ow-slider__track t");
    // With children the name stays where Base UI puts it: a thumb of your own is named by you.
    expect(given.input.getAttribute("aria-label")).toBe("Own");
  });

  test("a range draws a thumb for each value, in order, named, with a start and end", async () => {
    const { screen, slider } = await mount(
      wide(<Slider.Root defaultValue={[20, 80]} aria-label="Price" />),
    );
    const inputs = [...screen.container.querySelectorAll<HTMLInputElement>("input[type=range]")];
    expect(inputs.map((input) => input.value)).toEqual(["20", "80"]);
    expect(inputs.map((input) => input.getAttribute("aria-label"))).toEqual(["Price", "Price"]);
    expect(inputs.map((input) => input.getAttribute("aria-valuetext"))).toEqual([
      "20 start range",
      "80 end range",
    ]);
    // The group is named too, since two thumbs share the name.
    expect(slider.getAttribute("aria-label")).toBe("Price");
    expect(screen.container.querySelectorAll(".ow-slider__thumb")).toHaveLength(2);
  });

  test("the Value of a range reads both numbers, and a format and a function child apply", async () => {
    const { screen } = await mount(
      wide(
        <>
          <Slider.Root defaultValue={[20, 80]} aria-label="A">
            <Slider.Value />
            <Slider.Control />
          </Slider.Root>
          <Slider.Root
            defaultValue={0.5}
            min={0}
            max={1}
            step={0.01}
            format={{ style: "percent" }}
            aria-label="B"
          >
            <Slider.Value />
            <Slider.Control />
          </Slider.Root>
          <Slider.Root defaultValue={3} aria-label="C">
            <Slider.Value>{(formatted, values) => `${values[0]} of ${formatted[0]}`}</Slider.Value>
            <Slider.Control />
          </Slider.Root>
        </>,
      ),
    );
    const values = [...screen.container.querySelectorAll(".ow-slider__value")].map(
      (el) => el.textContent,
    );
    expect(values).toEqual(["20 – 80", "50%", "3 of 3"]);
  });

  test("the keyboard steps, pages, and goes home and end", async () => {
    const { input } = await mount(
      wide(<Slider.Root defaultValue={50} step={5} largeStep={20} aria-label="A" />),
    );
    input.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(input.value).toBe("55");
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(input.value).toBe("45");
    await userEvent.keyboard("{PageUp}");
    expect(input.value).toBe("65");
    await userEvent.keyboard("{Home}");
    expect(input.value).toBe("0");
    await userEvent.keyboard("{End}");
    expect(input.value).toBe("100");
  });

  test("a keyboard step shows the focus ring, and a press does not", async () => {
    const { thumb, input, control } = await mount(
      wide(<Slider.Root defaultValue={50} aria-label="A" />),
    );
    await userEvent.click(control, { position: { x: 30, y: 12 } });
    await expect.poll(() => document.activeElement).toBe(input);
    expect(getComputedStyle(thumb).outlineStyle).toBe("none");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => getComputedStyle(thumb).outlineStyle).toBe("solid");
    expect(getComputedStyle(thumb).outlineColor).toBe(resolve("var(--ow-focus)"));
    expect(getComputedStyle(thumb).outlineWidth).toBe("2px");
  });

  test("a press on the track moves the nearest thumb to it, rounded to the step", async () => {
    const { control, track, input } = await mount(
      wide(<Slider.Root defaultValue={0} step={10} aria-label="A" />),
    );
    const box = padBox(track);
    const at = box.left + box.width * 0.5 - control.getBoundingClientRect().left;
    await userEvent.click(control, { position: { x: at, y: 12 } });
    await expect.poll(() => input.value).toBe("50");
  });

  test("a press on the middle of the control gives the middle value, at either edge the ends", async () => {
    const { control, input } = await mount(
      wide(<Slider.Root defaultValue={0} aria-label="A" />, 300),
    );
    const box = control.getBoundingClientRect();
    await userEvent.click(control, { position: { x: box.width / 2, y: 12 } });
    await expect.poll(() => Number(input.value)).toBeCloseTo(50, 0);
    await userEvent.click(control, { position: { x: box.width - 1, y: 12 } });
    await expect.poll(() => Number(input.value)).toBe(100);
    await userEvent.click(control, { position: { x: 1, y: 12 } });
    await expect.poll(() => Number(input.value)).toBe(0);
  });

  test("dragging follows the pointer at once: the thumb is never on a transition of its place", async () => {
    onTestFinished(() => commands.mouse("up"));
    const { control, thumb, track, input } = await mount(
      wide(<Slider.Root defaultValue={10} aria-label="A" />),
    );
    const box = padBox(track);
    await userEvent.hover(thumb);
    await commands.mouse("down");
    await expect.poll(() => thumb.hasAttribute("data-dragging")).toBe(true);
    // Only the grow is eased; no property of its place is.
    const eased = getComputedStyle(thumb).transitionProperty.split(", ");
    expect(eased).toEqual(["scale"]);
    for (const share of [0.3, 0.7, 0.55]) {
      await userEvent.hover(control, {
        position: { x: box.left + box.width * share - control.getBoundingClientRect().left, y: 12 },
        force: true,
      });
      await expect.poll(() => Number(input.value)).toBeCloseTo(share * 100, -1);
      // Within the frame: the thumb's center is where the value is, no animation of place runs.
      expect(
        thumb
          .getAnimations()
          .map((animation) => (animation as CSSTransition).transitionProperty)
          .filter((property) => property !== "scale"),
      ).toEqual([]);
      expect(
        Math.abs(centerX(thumb) - (box.left + (box.width * Number(input.value)) / 100)),
      ).toBeLessThan(1);
    }
    await commands.mouse("up");
    await expect.poll(() => thumb.hasAttribute("data-dragging")).toBe(false);
  });

  test("the thumb and the fill sit where the value is, by Base UI's inset and size", async () => {
    const { track, fill, thumb } = await mount(
      wide(<Slider.Root defaultValue={25} aria-label="A" />, 300),
    );
    const box = padBox(track);
    // Drawn half a thumb (10px) longer at its start, to the groove's start.
    expect(fill.getBoundingClientRect().width).toBeCloseTo(box.width * 0.25 + 10, 0);
    expect(fill.getBoundingClientRect().right).toBeCloseTo(box.left + box.width * 0.25, 0);
    expect(centerX(thumb)).toBeCloseTo(box.left + box.width * 0.25, 0);
    expect(centerY(thumb)).toBeCloseTo(centerY(track), 0);
  });

  test("min, max, and step set the scale, and a controlled value is shown as given", async () => {
    function Controlled({ value }: { value: number }) {
      return wide(
        <Slider.Root
          value={value}
          min={10}
          max={50}
          step={5}
          onValueChange={() => {}}
          aria-label="A"
        />,
      );
    }
    const screen = await render(<Controlled value={30} />);
    const input = screen.container.querySelector("input") as HTMLInputElement;
    const track = screen.container.querySelector(".ow-slider__track") as HTMLElement;
    const thumb = screen.container.querySelector(".ow-slider__thumb") as HTMLElement;
    expect(input.min).toBe("10");
    expect(input.max).toBe("50");
    expect(input.step).toBe("5");
    expect(centerX(thumb)).toBeCloseTo(padBox(track).left + padBox(track).width * 0.5, 0);
    await screen.rerender(<Controlled value={50} />);
    expect(centerX(thumb)).toBeCloseTo(padBox(track).right, 0);
  });

  test("a disabled slider ignores the pointer and the keyboard, and is dimmed", async () => {
    const { control, input, thumb } = await mount(
      wide(<Slider.Root defaultValue={40} disabled aria-label="A" />),
    );
    expect(input.disabled).toBe(true);
    await userEvent.click(control, { position: { x: 200, y: 12 } });
    expect(input.value).toBe("40");
    expect(getComputedStyle(control).opacity).toBe("0.5");
    expect(getComputedStyle(control).cursor).toBe("not-allowed");
    expect(thumb.hasAttribute("data-disabled")).toBe(true);
  });

  test("it submits with a form under its name, one entry for each thumb", async () => {
    const screen = await render(
      <form>
        <Slider.Root name="volume" defaultValue={40} aria-label="A" />
        <Slider.Root name="range" defaultValue={[10, 90]} aria-label="B" />
      </form>,
    );
    const data = new FormData(screen.container.querySelector("form") as HTMLFormElement);
    expect(data.getAll("volume")).toEqual(["40"]);
    expect(data.getAll("range")).toEqual(["10", "90"]);
  });

  test("a Field names it with its label, and its error turns the fill critical", async () => {
    const { screen, input, fill } = await mount(
      wide(
        <Field.Root name="vol" invalid>
          <Field.Label>Volume</Field.Label>
          <Slider.Root defaultValue={40} />
          <Field.Error match>Too loud</Field.Error>
        </Field.Root>,
      ),
    );
    expect(input.getAttribute("aria-labelledby")).toBe(
      screen.container.querySelector("[data-slot=field-label]")?.id,
    );
    expect(getComputedStyle(fill).backgroundColor).toBe(resolve("var(--ow-critical-solid)"));
    expect(screen.container.textContent).toContain("Too loud");
  });

  test("inside a Fieldset and a Form, a required value is validated and a server error shows", async () => {
    const screen = await render(
      <Form errors={{ vol: "Too loud" }}>
        <Fieldset.Root>
          <Fieldset.Legend>Sound</Fieldset.Legend>
          <Field.Root name="vol">
            <Field.Label>Volume</Field.Label>
            <Slider.Root defaultValue={40} />
            <Field.Error />
          </Field.Root>
        </Fieldset.Root>
      </Form>,
    );
    expect(screen.container.textContent).toContain("Too loud");
    expect(screen.container.querySelector(".ow-slider__indicator[data-invalid]")).not.toBeNull();
    expect(
      screen.container.querySelector("fieldset")?.getAttribute("aria-labelledby") ?? "legend",
    ).toBeTruthy();
  });
});

describe("Slider, looks", () => {
  test("sizes: a 4, 6, or 8 px pill track with a 16, 20, or 24 px round thumb", async () => {
    const tracks: number[] = [];
    const thumbs: number[] = [];
    for (const size of ["sm", "md", "lg"] as const) {
      const { slider, track, thumb } = await mount(
        wide(<Slider.Root defaultValue={40} size={size} aria-label={size} />),
      );
      expect(slider.dataset.size).toBe(size);
      tracks.push(padBox(track).height);
      thumbs.push(thumb.getBoundingClientRect().width);
      expect(thumb.getBoundingClientRect().height).toBe(thumb.getBoundingClientRect().width);
      expect(getComputedStyle(track).borderTopLeftRadius).toBe("999px");
      expect(getComputedStyle(thumb).borderTopLeftRadius).toBe("50%");
    }
    expect(tracks).toEqual([4, 6, 8]);
    expect(thumbs).toEqual([16, 20, 24]);
  });

  test("a part takes the size of its Root, whether the Root draws it or not", async () => {
    const { control, thumb, track } = await mount(
      wide(
        <Slider.Root defaultValue={40} size="lg" aria-label="A">
          <Slider.Control>
            <Slider.Track>
              <Slider.Thumb />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>,
      ),
    );
    expect(padBox(track).height).toBe(8);
    expect(thumb.getBoundingClientRect().width).toBe(24);
    expect(control.getBoundingClientRect().height).toBe(24);
  });

  test("the track is a 10% tint of the text color, the fill the accent, the thumb white with the surface shadow", async () => {
    const { track, fill, thumb } = await mount(
      wide(<Slider.Root defaultValue={40} aria-label="A" />),
    );
    expect(getComputedStyle(track).backgroundColor).toBe(resolve(TRACK));
    expect(getComputedStyle(fill).backgroundColor).toBe(resolve("var(--ow-accent)"));
    expect(getComputedStyle(thumb).backgroundColor).toBe(resolve("var(--ow-on-accent)"));
    const probe = document.createElement("div");
    probe.style.boxShadow = "var(--ow-surface-shadow)";
    document.body.append(probe);
    const shadow = getComputedStyle(probe).boxShadow;
    probe.remove();
    expect(getComputedStyle(thumb).boxShadow).toBe(shadow);
    expect(getComputedStyle(fill).borderTopLeftRadius).toBe("999px");
  });

  test("the fill has 3:1 against the track and the page, and the thumb 3:1 against the fill, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const seen: Record<string, number> = {};
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = composite(resolve("var(--ow-bg)"));
      const track = composite(resolve("var(--ow-bg)"), resolve(TRACK));
      const fill = composite(resolve("var(--ow-accent)"));
      const key = composite(resolve("var(--ow-on-accent)"));
      seen[`${theme} fill/page`] = contrast(fill, page);
      seen[`${theme} fill/track`] = contrast(fill, track);
      seen[`${theme} key/fill`] = contrast(key, fill);
      expect(contrast(fill, page)).toBeGreaterThanOrEqual(3);
      expect(contrast(fill, track)).toBeGreaterThanOrEqual(3);
      expect(contrast(key, fill)).toBeGreaterThanOrEqual(3);
    }
    console.info("slider contrast", JSON.stringify(seen));
  });

  test("the thumb grows a little under a mouse and while dragged, on a transition of scale", async () => {
    onTestFinished(() => commands.mouse("up"));
    const { thumb, track } = await mount(wide(<Slider.Root defaultValue={40} aria-label="A" />));
    expect(Number(getComputedStyle(thumb).scale)).toBe(1);
    expect(getComputedStyle(thumb).transitionProperty).toBe("scale");
    expect(getComputedStyle(thumb).transitionDuration).toBe("0.573s");
    await userEvent.hover(thumb);
    await expect.poll(() => Number.parseFloat(getComputedStyle(thumb).scale)).toBeCloseTo(1.1, 2);
    await commands.mouse("down");
    await expect.poll(() => thumb.hasAttribute("data-dragging")).toBe(true);
    await expect.poll(() => Number.parseFloat(getComputedStyle(thumb).scale)).toBeCloseTo(1.15, 2);
    expect(getComputedStyle(thumb).transitionDuration).toBe("0.12s");
    await commands.mouse("up");
    await userEvent.hover(track);
    await expect.poll(() => Number(getComputedStyle(thumb).scale)).toBe(1);
  });

  test("under reduced motion the thumb does not grow and nothing is eased", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { thumb } = await mount(wide(<Slider.Root defaultValue={40} aria-label="A" />));
    await userEvent.hover(thumb);
    expect(getComputedStyle(thumb).scale).toBe("none");
    expect(getComputedStyle(thumb).transitionProperty).toBe("none");
  });

  test("a range fills between its thumbs", async () => {
    const { track, fill, screen } = await mount(
      wide(<Slider.Root defaultValue={[20, 70]} aria-label="A" />, 300),
    );
    const box = padBox(track);
    const bar = fill.getBoundingClientRect();
    // The fill's start lies half a thumb under the first thumb, so it never shows outside them.
    expect(bar.left - box.left).toBeCloseTo(box.width * 0.2 - 10, 0);
    expect(bar.width).toBeCloseTo(box.width * 0.5 + 10, 0);
    const [a, b] = [...screen.container.querySelectorAll(".ow-slider__thumb")];
    expect(centerX(a as Element)).toBeCloseTo(bar.left + 10, 0);
    expect(rect(a as Element).left).toBeCloseTo(bar.left, 0);
    expect(centerX(b as Element)).toBeCloseTo(bar.right, 0);
  });

  test("right to left: the fill grows from the right, the thumb is where the value is, and the arrows are mirrored", async () => {
    const { track, fill, thumb, input } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl" style={{ inlineSize: 300 }}>
          <Slider.Root defaultValue={25} aria-label="A" />
        </div>
      </DirectionProvider>,
    );
    const box = padBox(track);
    // Half a thumb past the track, which is the groove's own end.
    expect(fill.getBoundingClientRect().right).toBeCloseTo(box.right + 10, 0);
    expect(centerX(thumb)).toBeCloseTo(box.right - box.width * 0.25, 0);
    input.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(input.value).toBe("26");
  });

  test("upright it is a column with a height, the fill grows up, and ArrowUp raises it", async () => {
    const { slider, track, fill, thumb, input, control } = await mount(
      <Slider.Root orientation="vertical" defaultValue={25} aria-label="A" />,
    );
    expect(slider.getBoundingClientRect().height).toBe(192);
    const box = padBox(track);
    expect(box.width).toBe(6);
    expect(box.height).toBeGreaterThan(150);
    expect(fill.getBoundingClientRect().bottom).toBeCloseTo(box.bottom + 10, 0);
    expect(fill.getBoundingClientRect().height).toBeCloseTo(box.height * 0.25 + 10, 0);
    expect(centerY(thumb)).toBeCloseTo(box.bottom - box.height * 0.25, 0);
    expect(control.getBoundingClientRect().width).toBe(24);
    input.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("26");
    expect(input.getAttribute("aria-orientation")).toBe("vertical");
  });

  test("an upright slider takes the height you give it", async () => {
    const { slider, track } = await mount(
      <Slider.Root
        orientation="vertical"
        defaultValue={25}
        aria-label="A"
        style={{ blockSize: 300 }}
      />,
    );
    expect(slider.getBoundingClientRect().height).toBe(300);
    expect(padBox(track).height).toBeGreaterThan(250);
  });

  test("the invalid fill is critical, and the thumb stays the key", async () => {
    const { fill, thumb } = await mount(
      wide(
        <Field.Root invalid>
          <Slider.Root defaultValue={40} aria-label="A" />
        </Field.Root>,
      ),
    );
    expect(getComputedStyle(fill).backgroundColor).toBe(resolve("var(--ow-critical-solid)"));
    expect(getComputedStyle(thumb).backgroundColor).toBe(resolve("var(--ow-on-accent)"));
  });
});

describe("Slider, around it", () => {
  test("more contrast draws the track's edge and the thumb's, in the 3:1 edge color", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const { track, thumb } = await mount(wide(<Slider.Root defaultValue={40} aria-label="A" />));
    await commands.setContrast("more");
    expect(getComputedStyle(track).outlineColor).toBe(resolve("var(--ow-edge)"));
    expect(getComputedStyle(thumb).boxShadow).toContain(resolve("var(--ow-edge)"));
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const edge = composite(resolve("var(--ow-edge)"));
      const page = composite(resolve("var(--ow-bg)"));
      expect(contrast(edge, page)).toBeGreaterThanOrEqual(3);
    }
    delete root.dataset.theme;
  });

  test("forced colors: the track keeps its edge, the fill is Highlight, the key is drawn solid with a border", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { track, fill, thumb } = await mount(
      wide(<Slider.Root defaultValue={40} aria-label="A" />),
    );
    await commands.setForcedColors("active");
    expect(getComputedStyle(track).outlineStyle).toBe("solid");
    expect(getComputedStyle(fill).backgroundColor).toBe(resolve("Highlight"));
    expect(getComputedStyle(thumb).borderTopWidth).toBe("2px");
    expect(getComputedStyle(thumb).borderTopColor).toBe(resolve("CanvasText"));
    expect(getComputedStyle(thumb).boxShadow).toBe("none");
  });

  test("forced colors: a disabled slider is gray", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { fill, thumb, control } = await mount(
      wide(<Slider.Root defaultValue={40} disabled aria-label="A" />),
    );
    await commands.setForcedColors("active");
    expect(getComputedStyle(fill).backgroundColor).toBe(resolve("GrayText"));
    expect(getComputedStyle(thumb).borderTopColor).toBe(resolve("GrayText"));
    expect(getComputedStyle(control).opacity).toBe("1");
  });

  test("prints its track, fill, and thumb", async () => {
    const { track, fill, thumb } = await mount(
      wide(<Slider.Root defaultValue={40} aria-label="A" />),
    );
    expect(getComputedStyle(track).printColorAdjust).toBe("exact");
    for (const el of [fill, thumb]) expect(getComputedStyle(el).printColorAdjust).toBe("exact");
  });

  test("the control and the thumb are targets of at least 24px, and a finger may pan across the other axis", async () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const { control, thumb } = await mount(
        wide(<Slider.Root defaultValue={40} size={size} aria-label="A" />),
      );
      expect(control.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
      const hit = getComputedStyle(thumb, "::before");
      const reach = thumb.getBoundingClientRect().height - 2 * Number.parseFloat(hit.top);
      expect(Math.abs(reach)).toBeGreaterThanOrEqual(24);
      expect(getComputedStyle(control).touchAction).toBe("pan-y");
    }
    const upright = await mount(
      <Slider.Root orientation="vertical" defaultValue={40} aria-label="A" />,
    );
    expect(getComputedStyle(upright.control).touchAction).toBe("pan-x");
  });

  test("a touch that turns into a pan ends the drag cleanly, as Base UI's touch listeners do", async () => {
    const { control, thumb, input } = await mount(
      wide(<Slider.Root defaultValue={40} aria-label="A" />),
    );
    const at = { clientX: centerX(thumb), clientY: centerY(thumb) };
    const touch = (target: Element, x: number) =>
      new Touch({ identifier: 7, target, clientX: x, clientY: at.clientY });
    thumb.dispatchEvent(
      new PointerEvent("pointerdown", {
        ...at,
        pointerType: "touch",
        isPrimary: true,
        bubbles: true,
        button: 0,
        buttons: 1,
      }),
    );
    control.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        changedTouches: [touch(thumb, at.clientX)],
      }),
    );
    // The browser takes the gesture as a pan: it cancels the pointer; the finger carries on.
    document.dispatchEvent(new PointerEvent("pointercancel", { pointerType: "touch" }));
    document.dispatchEvent(
      new TouchEvent("touchmove", { changedTouches: [touch(thumb, at.clientX + 30)] }),
    );
    document.dispatchEvent(
      new TouchEvent("touchmove", { changedTouches: [touch(thumb, at.clientX + 40)] }),
    );
    document.dispatchEvent(
      new TouchEvent("touchmove", { changedTouches: [touch(thumb, at.clientX + 50)] }),
    );
    await expect.poll(() => Number(input.value)).toBeGreaterThan(40);
    document.dispatchEvent(
      new TouchEvent("touchend", { changedTouches: [touch(thumb, at.clientX + 50)] }),
    );
    await expect.poll(() => thumb.hasAttribute("data-dragging")).toBe(false);
  });

  test("passes className, style, render, and ref through on every part, and each has its data-slot", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      label: createRef<HTMLDivElement>(),
      value: createRef<HTMLOutputElement>(),
      control: createRef<HTMLDivElement>(),
      track: createRef<HTMLDivElement>(),
      fill: createRef<HTMLDivElement>(),
      thumb: createRef<HTMLDivElement>(),
    };
    const { slider, screen } = await mount(
      wide(
        <Slider.Root
          ref={refs.root}
          defaultValue={40}
          className="mine"
          style={{ marginInline: "3px" }}
        >
          <Slider.Label ref={refs.label} className="l" style={{ opacity: 0.5 }}>
            Name
          </Slider.Label>
          <Slider.Value ref={refs.value} className="v" />
          <Slider.Control ref={refs.control} className="c">
            <Slider.Track ref={refs.track} className="t">
              <Slider.Indicator ref={refs.fill} className="i" />
              <Slider.Thumb ref={refs.thumb} className="th" render={<span />} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>,
      ),
    );
    expect(refs.root.current).toBe(slider);
    expect(slider.className).toBe("ow-slider ow-slider--md mine");
    expect(slider.style.marginInline).toBe("3px");
    expect(refs.label.current?.className).toBe("ow-slider__label l");
    expect(refs.label.current?.style.opacity).toBe("0.5");
    expect(refs.value.current?.className).toBe("ow-slider__value v");
    expect(refs.control.current?.className).toBe("ow-slider__control c");
    expect(refs.track.current?.className).toBe("ow-slider__track t");
    expect(refs.fill.current?.className).toBe("ow-slider__indicator i");
    expect(refs.thumb.current?.className).toBe("ow-slider__thumb th");
    expect(refs.thumb.current?.tagName).toBe("SPAN");
    const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
      el.getAttribute("data-slot"),
    );
    expect(slots).toEqual([
      "slider",
      "slider-label",
      "slider-value",
      "slider-control",
      "slider-track",
      "slider-indicator",
      "slider-thumb",
    ]);
  });

  test("a theme token set on a slider changes it alone", async () => {
    const tokens = { "--ow-accent": "rgb(7, 8, 9)", "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties;
    const { fill, track } = await mount(
      wide(<Slider.Root defaultValue={40} aria-label="A" style={tokens} />),
    );
    expect(getComputedStyle(fill).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(track).backgroundColor).toBe(resolve(TRACK, track));
    expect(getComputedStyle(track).backgroundColor).not.toBe(resolve(TRACK));
  });

  test("an unlayered rule on a className beats its own value", async () => {
    const sheet = document.createElement("style");
    sheet.textContent =
      ".brand-track { background-color: rgb(1, 2, 3); height: 20px; } .brand-thumb { background-color: rgb(4, 5, 6); }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { track, thumb } = await mount(
      wide(
        <Slider.Root defaultValue={40} aria-label="A">
          <Slider.Control>
            <Slider.Track className="brand-track">
              <Slider.Thumb className="brand-thumb" aria-label="A" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>,
      ),
    );
    expect(getComputedStyle(track).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(padBox(track).height).toBe(20);
    expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(4, 5, 6)");
  });

  test("renders on the server, without warnings, with its thumbs placed", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const single = renderToString(<Slider.Root defaultValue={40} aria-label="A" />);
    const range = renderToString(<Slider.Root defaultValue={[20, 80]} aria-label="A" />);
    expect(single).toContain("ow-slider__thumb");
    expect(single).toContain("inset-inline-start:40%");
    expect(range.match(/ow-slider__thumb/g)).toHaveLength(2);
    expect(range).toContain("inset-inline-start:20%");
    expect(range).toContain("inset-inline-start:80%");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark: single, range, upright, with a label, disabled", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, inlineSize: 300 }}>
        <Slider.Root defaultValue={40}>
          <Slider.Label>Volume</Slider.Label>
          <Slider.Value />
          <Slider.Control />
        </Slider.Root>
        <Slider.Root defaultValue={[20, 60]} size="sm" aria-label="Price" />
        <Slider.Root defaultValue={30} size="lg" aria-label="Large" />
        <Slider.Root orientation="vertical" defaultValue={30} aria-label="Upright" />
        <Slider.Root defaultValue={30} disabled aria-label="Off" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a change too", async () => {
    function Bar({ value }: { value: number }) {
      return wide(<Slider.Root value={value} onValueChange={() => {}} aria-label="A" />);
    }
    const screen = await render(<Bar value={10} />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await screen.rerender(<Bar value={70} />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
