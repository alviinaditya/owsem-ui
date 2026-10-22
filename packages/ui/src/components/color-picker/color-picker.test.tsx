import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { ColorPicker, ColorPickerPopover } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const q = <T extends HTMLElement = HTMLElement>(
    selector: string,
    scope: ParentNode = document,
  ) => {
    const el = scope.querySelector<T>(selector);
    if (!el) throw new Error(`nothing matches ${selector}`);
    return el;
  };
  return {
    screen,
    q,
    picker: () => q(".ow-color-picker"),
    area: () => q('[role="slider"].ow-color-picker-area'),
    hue: () => q<HTMLInputElement>('[data-channel="hue"] input'),
    alpha: () => q<HTMLInputElement>('[data-channel="alpha"] input'),
    field: (label: string) => q<HTMLInputElement>(`input[aria-label="${label}"]`),
  };
}

const press = (el: Element, key: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));

/** Resolves a value (e.g. `var(--ow-panel)`) to its computed form inside `scope`. */
function resolve(value: string, scope: Element = document.body, property = "color"): string {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

const resolveColor = (value: string, scope?: Element) => resolve(value, scope);
const resolveShadow = (value: string) => resolve(value, document.body, "box-shadow");

/** The largest blur among an element's box shadows, in px. */
function maxBlur(el: Element): number {
  const shadow = getComputedStyle(el).boxShadow;
  if (shadow === "none") return 0;
  return Math.max(
    ...shadow.split(/,(?![^(]*\))/).map((layer) => {
      const lengths = layer.replace(/[a-z-]+\([^)]*\)/g, "").match(/-?[\d.]+px/g) ?? [];
      return Number.parseFloat(lengths[2] ?? "0");
    }),
  );
}

function Controlled({ onChange }: { onChange?: (value: string) => void }) {
  const [color, setColor] = useState("#336699");
  return (
    <>
      <ColorPicker
        value={color}
        onChange={(value) => {
          setColor(value);
          onChange?.(value);
        }}
      />
      <button type="button" onClick={() => setColor("#ff0000")}>
        Red
      </button>
    </>
  );
}

describe("ColorPicker", () => {
  test("renders an area, hue and opacity sliders, fields, and swatches, all named", async () => {
    const { area, hue, alpha, field, q } = await mount(<ColorPicker defaultValue="#7c6ab8" />);
    expect(area().getAttribute("aria-label")).toBe("Saturation and brightness");
    expect(area().getAttribute("aria-valuetext")).toBe("Saturation 42%, Brightness 72%");
    expect(area().tabIndex).toBe(0);
    expect(hue().getAttribute("aria-label")).toBe("Hue");
    expect(hue().getAttribute("aria-valuetext")).toBe("254°");
    expect(alpha().getAttribute("aria-label")).toBe("Opacity");
    expect(alpha().getAttribute("aria-valuetext")).toBe("100%");
    expect(field("Hex").value).toBe("7C6AB8");
    expect(field("Opacity").value).toBe("100");
    expect(q('[role="group"][aria-label="Swatches"]').children).toHaveLength(16);
    expect(q("button[aria-label='Format: HEX']")).toBeTruthy();
  });

  test("passes className, style, other props, and the ref to the panel", async () => {
    const ref = createRef<HTMLDivElement>();
    const { picker } = await mount(
      <ColorPicker ref={ref} className="mine" style={{ marginBlock: "3px" }} data-x="1" />,
    );
    expect(ref.current).toBe(picker());
    expect(picker().className).toBe("ow-color-picker mine");
    expect(picker().style.marginBlock).toBe("3px");
    expect(picker().dataset.x).toBe("1");
  });

  test("translates every label (FR-17)", async () => {
    const { area, hue, field, q } = await mount(
      <ColorPicker
        format="rgb"
        labels={{
          area: "Saturasi dan kecerahan",
          saturation: "Saturasi",
          brightness: "kecerahan",
          hue: "Rona",
          alpha: "Opasitas",
          format: "Format warna",
          red: "Merah",
          swatches: "Contoh warna",
        }}
      />,
    );
    expect(area().getAttribute("aria-label")).toBe("Saturasi dan kecerahan");
    expect(area().getAttribute("aria-valuetext")).toMatch(/^Saturasi \d+%, kecerahan \d+%$/);
    expect(hue().getAttribute("aria-label")).toBe("Rona");
    expect(field("Merah")).toBeTruthy();
    expect(field("Opasitas")).toBeTruthy();
    expect(q('[aria-label="Contoh warna"]')).toBeTruthy();
    expect(q('[aria-label="Format warna: RGB"]')).toBeTruthy();
  });

  test("the area steps saturation and brightness with the keyboard", async () => {
    const onChange = vi.fn();
    const onChangeComplete = vi.fn();
    const { area } = await mount(
      <ColorPicker
        defaultValue="hsl(0, 100%, 25%)"
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />,
    );
    // hsl(0 100% 25%) is saturation 100, brightness 50.
    press(area(), "ArrowLeft");
    await expect
      .poll(() => area().getAttribute("aria-valuetext"))
      .toBe("Saturation 99%, Brightness 50%");
    press(area(), "ArrowUp", { shiftKey: true });
    await expect
      .poll(() => area().getAttribute("aria-valuetext"))
      .toBe("Saturation 99%, Brightness 60%");
    press(area(), "PageDown");
    press(area(), "Home");
    await expect
      .poll(() => area().getAttribute("aria-valuetext"))
      .toBe("Saturation 0%, Brightness 50%");
    press(area(), "End");
    await expect.poll(() => area().getAttribute("aria-valuenow")).toBe("100");
    // Every key is a finished change.
    expect(onChange).toHaveBeenCalledTimes(5);
    expect(onChangeComplete).toHaveBeenCalledTimes(5);
    expect(onChangeComplete).toHaveBeenLastCalledWith(
      "#800000",
      expect.objectContaining({ hex: "#800000" }),
    );
  });

  test("hue and opacity come from Base UI Slider, keyboard and ARIA included", async () => {
    const onChange = vi.fn();
    const onChangeComplete = vi.fn();
    const { hue, alpha } = await mount(
      <ColorPicker
        defaultValue="#ff0000"
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />,
    );
    hue().focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => hue().getAttribute("aria-valuenow")).toBe("1");
    expect(onChange).toHaveBeenLastCalledWith("#ff0400", expect.anything());
    expect(onChangeComplete).toHaveBeenLastCalledWith("#ff0400", expect.anything());

    alpha().focus();
    await userEvent.keyboard("{Home}");
    await expect.poll(() => alpha().getAttribute("aria-valuetext")).toBe("0%");
    expect(onChangeComplete).toHaveBeenLastCalledWith("#ff040000", expect.anything());
  });

  test("dragging calls onChange as it goes, and onChangeComplete once, when let go", async () => {
    const onChange = vi.fn();
    const onChangeComplete = vi.fn();
    const { area } = await mount(
      <ColorPicker
        defaultValue="#ff0000"
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />,
    );
    const { width, height } = area().getBoundingClientRect();
    await userEvent.dragAndDrop(area(), area(), {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: width / 2, y: height / 2 },
    });
    expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(onChangeComplete).toHaveBeenCalledTimes(1);
    // Halfway along and down: saturation and brightness near 50.
    const [, color] = onChangeComplete.mock.calls[0] ?? [];
    expect(color.hsv.s).toBeCloseTo(50, -1);
    expect(color.hsv.v).toBeCloseTo(50, -1);
    expect(onChangeComplete.mock.calls[0]?.[0]).toBe(onChange.mock.lastCall?.[0]);
    expect(area().hasAttribute("data-dragging")).toBe(false);
  });

  test("is controlled by value, and follows it when the app changes it", async () => {
    const onChange = vi.fn();
    const { area, field, screen } = await mount(<Controlled onChange={onChange} />);
    press(area(), "ArrowDown");
    expect(onChange).toHaveBeenCalledTimes(1);
    await expect
      .poll(() => field("Hex").value)
      .toBe(onChange.mock.calls[0]?.[0].slice(1).toUpperCase());
    await screen.getByRole("button", { name: "Red" }).click();
    await expect.poll(() => field("Hex").value).toBe("FF0000");
  });

  test("a controlled value the app does not change stays put", async () => {
    const onChange = vi.fn();
    const { area, field } = await mount(<ColorPicker value="#336699" onChange={onChange} />);
    press(area(), "End");
    expect(onChange).toHaveBeenCalledTimes(1);
    await expect.poll(() => field("Hex").value).toBe("336699");
  });

  test("is uncontrolled with defaultValue", async () => {
    const { area, field } = await mount(<ColorPicker defaultValue="#336699" />);
    press(area(), "End");
    await expect.poll(() => field("Hex").value).toBe("004D99");
  });

  test("reads any CSS color the browser knows, tokens included", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    root.dataset.theme = "light";
    const { screen } = await mount(
      <>
        <ColorPicker value="var(--ow-accent)" />
        <ColorPicker defaultValue="rebeccapurple" />
      </>,
    );
    const [token, named] =
      screen.container.querySelectorAll<HTMLInputElement>('[aria-label="Hex"]');
    await expect.poll(() => token?.value).toBe("7C6AB8");
    expect(named?.value).toBe("663399");
  });

  test("hex applies on Enter or blur and reverts what it cannot read", async () => {
    const onChangeComplete = vi.fn();
    const { field } = await mount(
      <ColorPicker defaultValue="#336699" onChangeComplete={onChangeComplete} />,
    );
    await userEvent.fill(field("Hex"), "0f0");
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => field("Hex").value).toBe("00FF00");
    expect(onChangeComplete).toHaveBeenLastCalledWith("#00ff00", expect.anything());
    await userEvent.fill(field("Hex"), "nope");
    field("Hex").blur();
    await expect.poll(() => field("Hex").value).toBe("00FF00");
    expect(onChangeComplete).toHaveBeenCalledTimes(1);
  });

  test("numbers apply as typed, step with the arrows, and finish on blur", async () => {
    const onChange = vi.fn();
    const onChangeComplete = vi.fn();
    const { field, q } = await mount(
      <ColorPicker
        defaultValue="#000000"
        format="rgb"
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />,
    );
    // The format switch cycles HEX, RGB, HSL; RGB is first here.
    expect(q("button[aria-label='Format: RGB']")).toBeTruthy();
    await userEvent.fill(field("Red"), "200");
    expect(onChange).toHaveBeenLastCalledWith("rgb(200, 0, 0)", expect.anything());
    expect(onChangeComplete).not.toHaveBeenCalled();
    field("Red").blur();
    expect(onChangeComplete).toHaveBeenCalledTimes(1);
    field("Green").focus();
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(onChangeComplete).toHaveBeenLastCalledWith("rgb(200, 10, 0)", expect.anything());
  });

  test("the format switch cycles the fields", async () => {
    const { q, field } = await mount(<ColorPicker defaultValue="#7c6ab8" />);
    const format = q<HTMLButtonElement>(".ow-color-picker-format");
    format.click();
    await expect.poll(() => format.getAttribute("aria-label")).toBe("Format: RGB");
    expect([field("Red").value, field("Green").value, field("Blue").value]).toEqual([
      "124",
      "106",
      "184",
    ]);
    format.click();
    await expect.poll(() => field("Lightness").value).toBe("57");
    expect(field("Hue").value).toBe("254");
    format.click();
    await expect.poll(() => field("Hex").value).toBe("7C6AB8");
  });

  test("a swatch applies its color, and the matching one is pressed", async () => {
    const onChangeComplete = vi.fn();
    const { q } = await mount(
      <ColorPicker
        defaultValue="#22c55e"
        swatches={["#ef4444", { color: "#22c55e", label: "Green" }, "#3b82f680"]}
        onChangeComplete={onChangeComplete}
      />,
    );
    const green = q<HTMLButtonElement>('[aria-label="Green"]');
    const red = q<HTMLButtonElement>('[aria-label="#ef4444"]');
    expect(green.getAttribute("aria-pressed")).toBe("true");
    expect(red.getAttribute("aria-pressed")).toBe("false");
    // Translucent swatches sit on the checkerboard.
    expect(q('[aria-label="#3b82f680"]').hasAttribute("data-alpha")).toBe(true);
    await userEvent.click(red);
    expect(onChangeComplete).toHaveBeenLastCalledWith("#ef4444", expect.anything());
    await expect.poll(() => red.getAttribute("aria-pressed")).toBe("true");
    // One tab stop; arrows move between swatches (Base UI Toggle Group).
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(green);
  });

  test("format sets what the callbacks receive; alpha and the extras can be left out", async () => {
    const onChange = vi.fn();
    const { area, q, screen } = await mount(
      <ColorPicker
        defaultValue="#7c6ab880"
        format="hsl"
        alpha={false}
        inputs={false}
        swatches={false}
        eyeDropper={false}
        onChange={onChange}
      />,
    );
    press(area(), "End");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringMatching(/^hsl\(254, \d+%, \d+%\)$/),
      expect.anything(),
    );
    expect(screen.container.querySelector('[data-channel="alpha"]')).toBeNull();
    expect(screen.container.querySelector(".ow-color-picker-inputs")).toBeNull();
    expect(screen.container.querySelector(".ow-color-picker-swatches")).toBeNull();
    expect(screen.container.querySelector(".ow-color-picker-tool")).toBeNull();
    expect(q(".ow-color-picker-tools").hasAttribute("data-stack")).toBe(false);
  });

  test("the eye dropper picks from the screen where the browser can, keeping the opacity", async () => {
    const open = vi.fn(async () => ({ sRGBHex: "#123456" }));
    vi.stubGlobal(
      "EyeDropper",
      class {
        open = open;
      },
    );
    onTestFinished(() => {
      vi.unstubAllGlobals();
    });
    const onChangeComplete = vi.fn();
    const { q } = await mount(
      <ColorPicker defaultValue="#ff000080" onChangeComplete={onChangeComplete} />,
    );
    await userEvent.click(q('button[aria-label="Pick a color from the screen"]'));
    await expect.poll(() => onChangeComplete.mock.calls.length).toBe(1);
    expect(onChangeComplete).toHaveBeenLastCalledWith("#12345680", expect.anything());
  });

  test("disabled: nothing moves, nothing is focusable by Tab", async () => {
    const onChange = vi.fn();
    const { area, hue, field, picker } = await mount(<ColorPicker disabled onChange={onChange} />);
    expect(picker().hasAttribute("data-disabled")).toBe(true);
    expect(area().tabIndex).toBe(-1);
    expect(area().getAttribute("aria-disabled")).toBe("true");
    expect(hue().disabled).toBe(true);
    expect(field("Hex").disabled).toBe(true);
    press(area(), "End");
    expect(onChange).not.toHaveBeenCalled();
  });

  test("paints from the theme tokens, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { picker, field, q } = await mount(<ColorPicker />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(getComputedStyle(picker()).backgroundColor).toBe(resolveColor("var(--ow-panel)"));
      expect(getComputedStyle(field("Hex")).backgroundColor).toBe(
        resolveColor("var(--ow-well-bg)"),
      );
      expect(getComputedStyle(q(".ow-color-picker-format")).backgroundColor).toBe(
        resolveColor("var(--ow-raised-bg)"),
      );
      expect(getComputedStyle(picker()).boxShadow).toBe(resolveShadow("var(--ow-panel-shadow)"));
      expect(getComputedStyle(q(".ow-color-picker-format")).boxShadow).toBe(
        resolveShadow("var(--ow-raised-shadow)"),
      );
      expect(getComputedStyle(q(".ow-color-picker-swatches")).borderBlockStartColor).toBe(
        resolveColor("var(--ow-line-dark)"),
      );
      // The thumb ring must read on any color, so it is white in both themes.
      expect(getComputedStyle(q(".ow-color-picker-thumb")).borderTopColor).toBe(
        "rgb(255, 255, 255)",
      );
      field("Hex").focus();
      await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
      expect(getComputedStyle(q(".ow-color-picker-format")).outlineColor).toBe(
        resolveColor("var(--ow-focus)"),
      );
    }
  });

  test("draws crisp edges: no part sinks or casts a soft shadow, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { screen, q } = await mount(
      <>
        <ColorPicker defaultValue="#7c6ab880" />
        <ColorPickerPopover />
        <ColorPickerPopover variant="swatch" aria-label="Fill" />
      </>,
    );
    const names = "area track thumb preview tool format input swatch trigger chip".split(" ");
    const parts = [
      ...screen.container.querySelectorAll(names.map((name) => `.ow-color-picker-${name}`).join()),
    ];
    expect(parts.length).toBeGreaterThan(20);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      // A key's top light line may soften by under 1px; nothing else blurs.
      for (const part of parts) expect(maxBlur(part), part.className).toBeLessThanOrEqual(1);
      // The area and the tracks share the swatches' 1px edge.
      const edge = getComputedStyle(q(".ow-color-picker-swatch")).boxShadow;
      expect(edge).toMatch(/ 0px 0px 0px 1px inset$/);
      expect(getComputedStyle(q(".ow-color-picker-area")).boxShadow).toBe(edge);
      expect(getComputedStyle(q(".ow-color-picker-track")).boxShadow).toBe(edge);
    }
  });

  test("a raised key's hover tints its fill and keeps its edge", async () => {
    const { q } = await mount(<ColorPicker />);
    const format = q(".ow-color-picker-format");
    const fill = getComputedStyle(format).backgroundColor;
    const edge = getComputedStyle(format).boxShadow;
    await userEvent.hover(format);
    await expect.poll(() => getComputedStyle(format).backgroundColor).not.toBe(fill);
    expect(getComputedStyle(format).boxShadow).toBe(edge);
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const { screen } = await mount(
      <>
        <ColorPicker
          defaultValue="#ff000080"
          style={{ "--ow-panel": "rgb(1, 2, 3)", "--ow-line": "rgb(7, 8, 9)" } as CSSProperties}
        />
        <ColorPicker defaultValue="#ff000080" />
      </>,
    );
    const [own, other] = screen.container.querySelectorAll(".ow-color-picker");
    if (!own || !other) throw new Error("no pickers");
    const checkers = (el: Element) =>
      getComputedStyle(el.querySelector(".ow-color-picker-preview") as Element).backgroundImage;
    expect(getComputedStyle(own).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(checkers(own)).toContain("rgb(7, 8, 9)");
    expect(getComputedStyle(other).backgroundColor).toBe(resolveColor("var(--ow-panel)"));
    expect(checkers(other)).not.toContain("rgb(7, 8, 9)");
  });

  test("className and style set its width and the area's height", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = ".tall .ow-color-picker-area { block-size: 120px; }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { picker, q } = await mount(<ColorPicker className="tall" style={{ inlineSize: 300 }} />);
    expect(picker().getBoundingClientRect().width).toBe(300);
    expect(q(".ow-color-picker-area").getBoundingClientRect().height).toBe(120);
  });

  test("keeps its colors, and draws edges and focus in system colors, in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { area, picker, field, q } = await mount(<ColorPicker defaultValue="#ff0000" />);
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    // The hue under the area and the swatches keep their own paint.
    expect(getComputedStyle(area()).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(q('[aria-label="#ef4444"]')).backgroundColor).toBe("rgb(239, 68, 68)");
    expect(getComputedStyle(area()).outlineStyle).toBe("solid");
    expect(getComputedStyle(area()).outlineColor).toBe(resolveColor("CanvasText"));
    // Panel and fields: their transparent outline becomes their edge.
    expect(getComputedStyle(picker()).outlineWidth).toBe("1px");
    expect(getComputedStyle(field("Hex")).outlineColor).not.toBe(
      getComputedStyle(picker()).backgroundColor,
    );
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    expect(document.activeElement).toBe(area());
    expect(getComputedStyle(area()).outlineColor).toBe(resolveColor("Highlight"));
  });

  test("mirrors for right-to-left text (FR-16)", async () => {
    const onChange = vi.fn();
    const { area, q } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <ColorPicker defaultValue="hsl(0, 100%, 25%)" onChange={onChange} />
        </div>
      </DirectionProvider>,
    );
    // Saturation grows toward the inline end, the left.
    expect(getComputedStyle(area()).backgroundImage).toContain("to left");
    const box = area().getBoundingClientRect();
    const thumb = q(".ow-color-picker-area .ow-color-picker-thumb").getBoundingClientRect();
    expect(thumb.left + thumb.width / 2).toBeCloseTo(box.left, 0);
    press(area(), "ArrowLeft");
    await expect.poll(() => area().getAttribute("aria-valuenow")).toBe("100");
    press(area(), "ArrowRight");
    await expect.poll(() => area().getAttribute("aria-valuenow")).toBe("99");
    // Base UI mirrors the sliders: hue 0 sits at the right end.
    const track = q('[data-channel="hue"] .ow-color-picker-track').getBoundingClientRect();
    const hueThumb = q('[data-channel="hue"] .ow-color-picker-thumb').getBoundingClientRect();
    expect(hueThumb.left + hueThumb.width / 2).toBeCloseTo(track.right, 0);
    expect(
      getComputedStyle(q('[data-channel="hue"] .ow-color-picker-track')).backgroundImage,
    ).toContain("to left");
  });

  test("a thumb compacts while pressed and springs back (Tactile), but not under reduced motion", async () => {
    const { area } = await mount(<ColorPicker />);
    const thumb = area().querySelector(".ow-color-picker-thumb");
    if (!thumb) throw new Error("no thumb");
    const edge = getComputedStyle(thumb).boxShadow;
    expect(getComputedStyle(thumb).transitionProperty).toBe("scale");
    expect(getComputedStyle(thumb).transitionTimingFunction).toContain("linear(");
    area().dispatchEvent(
      new PointerEvent("pointerdown", { button: 0, pointerId: 1, bubbles: true }),
    );
    await expect.poll(() => area().hasAttribute("data-dragging")).toBe(true);
    await expect.poll(() => getComputedStyle(thumb).scale).toBe("0.88");
    // Only the size moves; the edges stay.
    expect(getComputedStyle(thumb).boxShadow).toBe(edge);
    area().dispatchEvent(new PointerEvent("pointerup", { button: 0, pointerId: 1, bubbles: true }));
    await expect.poll(() => getComputedStyle(thumb).scale, { timeout: 2000 }).toBe("none");

    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    area().dispatchEvent(
      new PointerEvent("pointerdown", { button: 0, pointerId: 1, bubbles: true }),
    );
    await expect.poll(() => area().hasAttribute("data-dragging")).toBe(true);
    expect(getComputedStyle(thumb).scale).toBe("none");
    area().dispatchEvent(new PointerEvent("pointerup", { button: 0, pointerId: 1, bubbles: true }));
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { screen } = await mount(
      <main>
        <ColorPicker defaultValue="#7c6ab880" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a drag too", async () => {
    const { area } = await mount(<ColorPicker />);
    await settle();
    expect(await measureIdle(1500)).toEqual({ rafCalls: 0, runningAnimations: [] });
    const { width } = area().getBoundingClientRect();
    await userEvent.dragAndDrop(area(), area(), {
      sourcePosition: { x: 4, y: 4 },
      targetPosition: { x: width - 4, y: 20 },
    });
    await settle({ maxMs: 3000 });
    expect(await measureIdle(1500)).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

describe("ColorPickerPopover", () => {
  const popup = () => document.querySelector<HTMLElement>('[role="dialog"]');

  test("a trigger shows the color and its value, and opens the picker", async () => {
    const onChange = vi.fn();
    const { screen, q } = await mount(
      <ColorPickerPopover defaultValue="#7c6ab8" format="rgb" onChange={onChange} />,
    );
    const trigger = q<HTMLButtonElement>(".ow-color-picker-trigger", screen.container);
    expect(trigger.textContent).toBe("rgb(124, 106, 184)");
    expect(getComputedStyle(q(".ow-color-picker-chip")).backgroundColor).toBe("rgb(124, 106, 184)");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    await userEvent.click(trigger);
    await expect.poll(popup).toBeTruthy();
    expect(popup()?.getAttribute("aria-label")).toBe("Color picker");
    // Focus moves into the picker, onto the area.
    await expect.poll(() => document.activeElement?.className).toBe("ow-color-picker-area");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => trigger.textContent).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(trigger.textContent).not.toBe("rgb(124, 106, 184)");
    expect(onChange).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    await expect.poll(popup).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test("Escape first drops a field's edit, then closes", async () => {
    const { q } = await mount(<ColorPickerPopover defaultOpen defaultValue="#7c6ab8" />);
    await expect.poll(popup).toBeTruthy();
    const hex = q<HTMLInputElement>('[role="dialog"] input[aria-label="Hex"]');
    await userEvent.fill(hex, "12");
    await userEvent.keyboard("{Escape}");
    expect(hex.value).toBe("7C6AB8");
    expect(popup()).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await expect.poll(popup).toBeNull();
  });

  test("passes className, style, render, props, and the ref to the trigger", async () => {
    const ref = createRef<HTMLButtonElement>();
    const { screen } = await mount(
      <>
        <ColorPickerPopover
          ref={ref}
          className="mine"
          style={{ marginBlock: "3px" }}
          aria-label="Brand"
        />
        <ColorPickerPopover className={(state) => (state.open ? "open" : "shut")} />
        <ColorPickerPopover render={<span />} nativeButton={false} />
      </>,
    );
    const [first, second, third] = screen.container.querySelectorAll<HTMLElement>(
      ".ow-color-picker-trigger",
    );
    expect(ref.current).toBe(first);
    expect(first?.className).toBe("ow-color-picker-trigger mine");
    expect(first?.style.marginBlock).toBe("3px");
    expect(first?.getAttribute("aria-label")).toBe("Brand");
    expect(second?.className).toBe("ow-color-picker-trigger shut");
    expect(third?.tagName).toBe("SPAN");
  });

  test("a swatch trigger is a square of the color; children replace the content", async () => {
    const { screen } = await mount(
      <>
        <ColorPickerPopover variant="swatch" defaultValue="#ff000080" aria-label="Fill" />
        <ColorPickerPopover aria-label="Text">Aa</ColorPickerPopover>
      </>,
    );
    const [swatch, custom] = screen.container.querySelectorAll<HTMLElement>(
      ".ow-color-picker-trigger",
    );
    if (!swatch || !custom) throw new Error("no triggers");
    expect(swatch.textContent).toBe("");
    const box = swatch.getBoundingClientRect();
    expect(box.width).toBeCloseTo(box.height, 1);
    expect(swatch.querySelector(".ow-color-picker-chip")?.hasAttribute("data-alpha")).toBe(true);
    expect(custom.textContent).toBe("Aa");
  });

  test("the popup scales out of the trigger, and only fades under reduced motion", async () => {
    const { q, screen } = await mount(<ColorPickerPopover />);
    await userEvent.click(q(".ow-color-picker-trigger", screen.container));
    await expect.poll(popup).toBeTruthy();
    const style = () => getComputedStyle(popup() as HTMLElement);
    expect(style().transformOrigin).not.toBe("");
    // Base UI puts the trigger's side on the positioner, and the popup inherits it.
    expect(style().getPropertyValue("--transform-origin")).not.toBe("");
    expect(style().transitionProperty).toBe("opacity, transform");
    expect(style().transitionDuration).toBe("0.18s, 0.18s");
    await userEvent.keyboard("{Escape}");
    await expect.poll(popup).toBeNull();

    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    await userEvent.click(q(".ow-color-picker-trigger", screen.container));
    await expect.poll(popup).toBeTruthy();
    expect(style().transitionProperty).toBe("opacity");
  });

  test("the portaled popup keeps the trigger's theme and direction", async () => {
    const { q, screen } = await mount(
      <DirectionProvider direction="rtl">
        <div data-theme="dark" dir="rtl">
          <ColorPickerPopover defaultValue="var(--ow-accent)" />
        </div>
      </DirectionProvider>,
    );
    // The trigger paints the token itself, so it follows the theme around it.
    expect(getComputedStyle(q(".ow-color-picker-chip")).backgroundColor).toBe("rgb(212, 203, 229)");
    await userEvent.click(q(".ow-color-picker-trigger", screen.container));
    await expect.poll(popup).toBeTruthy();
    const positioner = popup()?.parentElement;
    expect(positioner?.getAttribute("data-theme")).toBe("dark");
    expect(positioner?.getAttribute("dir")).toBe("rtl");
    expect(getComputedStyle(q('[role="dialog"] .ow-color-picker')).backgroundColor).toBe(
      resolveColor("var(--ow-panel)", q('[data-theme="dark"]')),
    );
    // The picker opens on the token's color, read beside the trigger.
    expect(q<HTMLInputElement>('[role="dialog"] input[aria-label="Hex"]').value).toBe("D4CBE5");
  });

  test("is controlled by value and open", async () => {
    const onOpenChange = vi.fn();
    const { screen, q } = await mount(
      <ColorPickerPopover value="#336699" open={false} onOpenChange={onOpenChange} />,
    );
    const trigger = q(".ow-color-picker-trigger", screen.container);
    expect(trigger.textContent).toBe("#336699");
    await userEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(popup()).toBeNull();
    screen.rerender(<ColorPickerPopover value="#ff0000" open />);
    await expect.poll(popup).toBeTruthy();
    expect(trigger.textContent).toBe("#ff0000");
  });

  test("disabled: the trigger does not open", async () => {
    const { q, screen } = await mount(<ColorPickerPopover disabled />);
    const trigger = q<HTMLButtonElement>(".ow-color-picker-trigger", screen.container);
    expect(trigger.disabled).toBe(true);
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(popup()).toBeNull();
  });

  test("has no axe violations in light and dark, open and shut", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { screen, q } = await mount(
      <main>
        {/* The name says what the color is for, then its value (the trigger's text). */}
        <span id="brand-label">Brand color</span>
        <ColorPickerPopover id="brand" aria-labelledby="brand-label brand" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
    await userEvent.click(q(".ow-color-picker-trigger", screen.container));
    await expect.poll(popup).toBeTruthy();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(popup() as HTMLElement)).toEqual({
        violations: [],
        contrastUnknown: [],
      });
    }
  });

  test("runs no rAF and no animations when idle, shut or open", async () => {
    const { q, screen } = await mount(<ColorPickerPopover />);
    await settle();
    expect(await measureIdle(1500)).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(q(".ow-color-picker-trigger", screen.container));
    await expect.poll(popup).toBeTruthy();
    await settle({ maxMs: 3000 });
    expect(await measureIdle(1500)).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
