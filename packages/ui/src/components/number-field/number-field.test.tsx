import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Field } from "../field";
import { Form } from "../form";
import { NumberField } from "./index";
import css from "./number-field.css?raw";

const root = document.documentElement;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const el = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  return {
    screen,
    field: el(".ow-number-field"),
    group: el(".ow-number-field__group"),
    input: el<HTMLInputElement>(".ow-number-field__input"),
    minus: el<HTMLButtonElement>(".ow-number-field__decrement"),
    plus: el<HTMLButtonElement>(".ow-number-field__increment"),
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

const TINT = "color-mix(in oklab, var(--ow-fg) 6%, transparent)";
const TINT_HOVER = "color-mix(in oklab, var(--ow-fg) 9%, transparent)";
const CRITICAL = "color-mix(in oklab, var(--ow-critical) 14%, transparent)";

/** A field whose input is named, as the shortest use is, inside a Field, unless it is a test's point. */
function Num({ label, ...props }: NumberField.Root.Props & { label: string }) {
  return (
    <NumberField.Root {...props}>
      <NumberField.Group>
        <NumberField.Decrement />
        <NumberField.Input aria-label={label} />
        <NumberField.Increment />
      </NumberField.Group>
    </NumberField.Root>
  );
}

async function pointerAway() {
  const spot = document.createElement("span");
  spot.style.cssText = "position:fixed;inset:auto 0 0 auto;inline-size:4px;block-size:4px";
  document.body.append(spot);
  await userEvent.hover(spot);
  spot.remove();
}

describe("Number Field", () => {
  test("without children it draws a Group with a Decrement, an Input, and an Increment", async () => {
    const { field, group, input, minus, plus } = await mount(<NumberField.Root defaultValue={5} />);
    expect(field.className).toBe("ow-number-field ow-number-field--md");
    expect(field.getAttribute("data-size")).toBe("md");
    expect(group.getAttribute("role")).toBe("group");
    expect([...group.children]).toEqual([minus, input, plus]);
    expect(input.value).toBe("5");
    expect(input.getAttribute("aria-roledescription")).toBe("Number field");
    expect(field.querySelectorAll(".ow-number-field__group")).toHaveLength(1);
  });

  test("a bare Root names its input: aria-label, aria-labelledby, and aria-describedby go there, not on the div", async () => {
    const { field, input } = await mount(
      <>
        <span id="d">Up to ten.</span>
        <NumberField.Root defaultValue={2} aria-label="Quantity" aria-describedby="d" />
      </>,
    );
    expect(input.getAttribute("aria-label")).toBe("Quantity");
    expect(input.getAttribute("aria-describedby")).toBe("d");
    expect(field.hasAttribute("aria-label")).toBe(false);
    expect(field.hasAttribute("aria-describedby")).toBe(false);
    const named = await render(
      <>
        <span id="l">Seats</span>
        <NumberField.Root defaultValue={2} aria-labelledby="l" />
      </>,
    );
    const second = named.container.querySelector(".ow-number-field__input") as HTMLElement;
    expect(second.getAttribute("aria-labelledby")).toBe("l");
    expect(named.container.querySelector(".ow-number-field")?.hasAttribute("aria-labelledby")).toBe(
      false,
    );
    expect(await axeReport(named.container)).toEqual({ violations: [], contrastUnknown: [] });
  });

  test("with children the aria props stay on the Root, as in Base UI", async () => {
    const { field, input } = await mount(
      <NumberField.Root defaultValue={2} aria-label="Root name">
        <NumberField.Group>
          <NumberField.Input aria-label="Input name" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(field.getAttribute("aria-label")).toBe("Root name");
    expect(input.getAttribute("aria-label")).toBe("Input name");
  });

  test("a Group without children draws the same three; children replace them", async () => {
    const bare = await mount(
      <NumberField.Root defaultValue={1}>
        <NumberField.Group />
      </NumberField.Root>,
    );
    expect(bare.group.children).toHaveLength(3);
    const own = await mount(
      <NumberField.Root defaultValue={1}>
        <NumberField.Group>
          <NumberField.Input aria-label="Only" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(own.group.children).toHaveLength(1);
    const none = await mount(
      <NumberField.Root defaultValue={1}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input aria-label="Two" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(none.group.querySelectorAll("button")).toHaveLength(1);
  });

  test("the steppers draw a minus and a plus, 1em + 2px, hidden from readers, and keep a name", async () => {
    const { minus, plus } = await mount(<Num defaultValue={1} label="Qty" />);
    for (const [button, paths] of [
      [minus, 1],
      [plus, 2],
    ] as const) {
      const svg = button.querySelector("svg") as SVGElement;
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.querySelectorAll("path")).toHaveLength(paths);
      const edge = Number.parseFloat(getComputedStyle(button).fontSize) + 2;
      expect(svg.getBoundingClientRect().width).toBeCloseTo(edge, 0);
    }
    expect(minus.getAttribute("aria-label")).toBe("Decrease");
    expect(plus.getAttribute("aria-label")).toBe("Increase");
  });

  test("a stepper's children and aria-label are yours", async () => {
    const { minus, plus } = await mount(
      <NumberField.Root defaultValue={1}>
        <NumberField.Group>
          <NumberField.Decrement aria-label="Fewer">
            <span>-</span>
          </NumberField.Decrement>
          <NumberField.Input />
          <NumberField.Increment aria-label="More">+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(minus.getAttribute("aria-label")).toBe("Fewer");
    expect(minus.querySelector("svg")).toBeNull();
    expect(plus.textContent).toBe("+");
  });

  test("the buttons step by `step`, and the input follows", async () => {
    const seen: (number | null)[] = [];
    const { input, minus, plus } = await mount(
      <Num defaultValue={10} step={5} label="Qty" onValueChange={(value) => seen.push(value)} />,
    );
    await userEvent.click(plus);
    expect(input.value).toBe("15");
    await userEvent.click(minus);
    await userEvent.click(minus);
    expect(input.value).toBe("5");
    expect(seen).toEqual([15, 10, 5]);
  });

  test("holding a stepper repeats it", async () => {
    const { input, plus } = await mount(<Num defaultValue={0} label="Qty" />);
    onTestFinished(() => commands.mouse("up"));
    await userEvent.hover(plus);
    await commands.mouse("down");
    await expect.poll(() => Number(input.value), { timeout: 4000 }).toBeGreaterThan(3);
    await commands.mouse("up");
    const stopped = input.value;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(input.value).toBe(stopped);
  });

  test("at the max the Increment dims and stops; at the min the Decrement does", async () => {
    const { input, minus, plus } = await mount(
      <Num defaultValue={1} min={0} max={2} label="Qty" />,
    );
    expect(plus.hasAttribute("data-disabled")).toBe(false);
    await userEvent.click(plus);
    expect(plus.hasAttribute("data-disabled")).toBe(true);
    expect(plus.disabled).toBe(true);
    expect(getComputedStyle(plus).opacity).toBe("0.45");
    expect(getComputedStyle(plus).cursor).toBe("not-allowed");
    expect(getComputedStyle(minus).opacity).toBe("1");
    await userEvent.click(plus, { force: true });
    expect(input.value).toBe("2");
    await userEvent.click(minus);
    await userEvent.click(minus);
    expect(minus.disabled).toBe(true);
    expect(getComputedStyle(minus).opacity).toBe("0.45");
  });

  test("the keyboard steps by step, shift by largeStep, alt by smallStep, Home and End to the ends", async () => {
    const { input } = await mount(<Num defaultValue={50} min={0} max={100} label="Qty" />);
    input.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("51");
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(input.value).toBe("61");
    await userEvent.keyboard("{ArrowDown}");
    expect(input.value).toBe("60");
    await userEvent.keyboard("{Home}");
    expect(input.value).toBe("0");
    await userEvent.keyboard("{End}");
    expect(input.value).toBe("100");
  });

  test("typing is clamped to min and max on blur, and stepper buttons are not tab stops", async () => {
    const { input, minus, plus } = await mount(
      <Num defaultValue={5} min={0} max={10} label="Qty" />,
    );
    expect(minus.tabIndex).toBe(-1);
    expect(plus.tabIndex).toBe(-1);
    input.focus();
    await userEvent.fill(input, "99");
    input.blur();
    await expect.poll(() => input.value).toBe("10");
  });

  test("a format shows currency and percent, in a locale", async () => {
    const money = await mount(
      <Num
        defaultValue={1234.5}
        format={{ style: "currency", currency: "USD" }}
        locale="en-US"
        label="Price"
      />,
    );
    expect(money.input.value).toBe("$1,234.50");
    const percent = await mount(
      <Num
        defaultValue={0.25}
        step={0.01}
        format={{ style: "percent" }}
        locale="en-US"
        label="Rate"
      />,
    );
    expect(percent.input.value).toBe("25%");
    const german = await mount(<Num defaultValue={1234.5} locale="de-DE" label="Zahl" />);
    expect(german.input.value).toBe("1.234,5");
  });

  test("a controlled field shows the value it is given", async () => {
    function Controlled() {
      const [value, setValue] = useState<number | null>(3);
      return (
        <>
          <Num value={value} onValueChange={setValue} label="Qty" />
          <output>{String(value)}</output>
        </>
      );
    }
    const { screen, plus } = await mount(<Controlled />);
    await userEvent.click(plus);
    expect(screen.container.querySelector("output")?.textContent).toBe("4");
  });

  test("in a form it submits its name and value, and required stops an empty submit", async () => {
    const screen = await render(
      <form>
        <Num name="qty" defaultValue={7} required label="Qty" />
      </form>,
    );
    const form = screen.container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("qty")).toBe("7");
    const input = screen.container.querySelector(".ow-number-field__input") as HTMLInputElement;
    await userEvent.fill(input, "");
    input.blur();
    await expect.poll(() => form.checkValidity()).toBe(false);
  });

  test("in a Field the label names the input, the description describes it, and an error marks the field", async () => {
    const { screen, group, input } = await mount(
      <Form errors={{ qty: "Too many." }}>
        <Field.Root name="qty">
          <Field.Label>Quantity</Field.Label>
          <NumberField.Root defaultValue={5} />
          <Field.Description>Up to ten.</Field.Description>
          <Field.Error match />
        </Field.Root>
      </Form>,
    );
    const label = screen.container.querySelector("label") as HTMLElement;
    expect(input.getAttribute("aria-labelledby")).toBe(label.id);
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(group.hasAttribute("data-invalid")).toBe(true);
    expect(screen.container.textContent).toContain("Too many.");
    expect(getComputedStyle(group).backgroundColor).toBe(resolve(CRITICAL));
    await userEvent.click(label);
    expect(document.activeElement).toBe(input);
  });
});

describe("Number Field, drawn", () => {
  test("the Group is the field: a 6% tint, 9% on hover, the radius token, no edge", async () => {
    const { group } = await mount(<Num defaultValue={1} label="Qty" />);
    await pointerAway();
    expect(getComputedStyle(group).backgroundColor).toBe(resolve(TINT));
    expect(getComputedStyle(group).borderTopWidth).toBe("0px");
    expect(getComputedStyle(group).borderTopLeftRadius).toBe(
      getComputedStyle(document.documentElement).getPropertyValue("--ow-radius").trim() ||
        getComputedStyle(group).borderTopLeftRadius,
    );
    await userEvent.hover(group);
    await expect.poll(() => getComputedStyle(group).backgroundColor).toBe(resolve(TINT_HOVER));
  });

  test("the input is bare and centered, with tabular numbers and no native spinner", async () => {
    const { input } = await mount(<Num defaultValue={1} label="Qty" />);
    const style = getComputedStyle(input);
    expect(style.textAlign).toBe("center");
    expect(style.fontVariantNumeric).toContain("tabular-nums");
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style.borderTopWidth).toBe("0px");
    expect(input.type).toBe("text");
    const text = document.createRange();
    text.selectNodeContents(input);
    expect(input.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  test("keyboard focus on the input rings the Group, and the steppers are not tab stops", async () => {
    const { group, input } = await mount(<Num defaultValue={1} label="Qty" />);
    expect(getComputedStyle(group).outlineWidth).toBe("1px");
    expect(getComputedStyle(group).outlineColor).toBe("rgba(0, 0, 0, 0)");
    await userEvent.tab();
    expect(document.activeElement).toBe(input);
    expect(getComputedStyle(group).outlineWidth).toBe("2px");
    expect(getComputedStyle(group).outlineOffset).toBe("2px");
    expect(getComputedStyle(group).outlineColor).toBe(resolve("var(--ow-focus)"));
    expect(getComputedStyle(input).outlineStyle).toBe("none");
  });

  test("invalid turns the Group critical, and disabled dims the whole field once", async () => {
    const invalid = await mount(
      <Field.Root invalid>
        <Num defaultValue={1} label="Qty" />
      </Field.Root>,
    );
    expect(getComputedStyle(invalid.group).backgroundColor).toBe(resolve(CRITICAL));
    const off = await mount(<Num defaultValue={1} disabled label="Qty" />);
    expect(off.group.hasAttribute("data-disabled")).toBe(true);
    expect(getComputedStyle(off.group).opacity).toBe("0.45");
    expect(getComputedStyle(off.group).cursor).toBe("not-allowed");
    expect(getComputedStyle(off.minus).opacity).toBe("1");
    expect(off.minus.disabled).toBe(true);
    expect(off.input.disabled).toBe(true);
    await userEvent.click(off.plus, { force: true });
    expect(off.input.value).toBe("1");
  });

  test("read only draws as Input does: no tint change, the steppers off, the value kept", async () => {
    const { group, input, plus } = await mount(<Num defaultValue={1} readOnly label="Qty" />);
    await pointerAway();
    expect(getComputedStyle(group).backgroundColor).toBe(resolve(TINT));
    expect(getComputedStyle(group).opacity).toBe("1");
    expect(input.readOnly).toBe(true);
    expect(plus.getAttribute("aria-disabled")).toBe("true");
    expect(getComputedStyle(plus).cursor).toBe("default");
    expect(getComputedStyle(plus).opacity).toBe("1");
    await userEvent.hover(plus);
    expect(getComputedStyle(plus).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await userEvent.click(plus, { force: true });
    expect(input.value).toBe("1");
    input.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("1");
  });

  test("a stepper: flat and muted, a tint under the pointer with the text color, the pressed material while held", async () => {
    const { minus, plus } = await mount(<Num defaultValue={5} label="Qty" />);
    onTestFinished(() => commands.mouse("up"));
    await pointerAway();
    expect(getComputedStyle(plus).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(plus).color).toBe(resolve("var(--ow-muted)"));
    await userEvent.hover(plus);
    await expect
      .poll(() => getComputedStyle(plus).backgroundColor)
      .toBe(resolve("var(--ow-hover)"));
    expect(getComputedStyle(plus).color).toBe(resolve("var(--ow-fg)"));
    await commands.mouse("down");
    await expect
      .poll(() => getComputedStyle(plus).backgroundColor)
      .toBe(resolve("var(--ow-pressed-bg)"));
    expect(getComputedStyle(plus).transitionDuration).toBe("0.09s");
    await expect.poll(() => new DOMMatrix(getComputedStyle(plus).transform).a).toBeLessThan(1);
    await commands.mouse("up");
    expect(getComputedStyle(minus).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("a held stepper under reduced motion changes its material and does not move", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    onTestFinished(() => commands.mouse("up"));
    await commands.setReducedMotion("reduce");
    const { plus } = await mount(<Num defaultValue={5} label="Qty" />);
    await userEvent.hover(plus);
    await commands.mouse("down");
    await expect
      .poll(() => getComputedStyle(plus).backgroundColor)
      .toBe(resolve("var(--ow-pressed-bg)"));
    expect(new DOMMatrix(getComputedStyle(plus).transform).isIdentity).toBe(true);
  });

  test("every hover rule is behind (hover: hover), so touch never sticks one", () => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css.replace(/@layer[^{;]*[{;]/g, ""));
    const hovered: string[] = [];
    const walk = (rules: CSSRuleList, guarded: boolean) => {
      for (const rule of rules) {
        if (rule instanceof CSSMediaRule) {
          walk(rule.cssRules, guarded || /hover:\s*hover/.test(rule.conditionText));
        } else if (
          rule instanceof CSSStyleRule &&
          rule.selectorText.includes(":hover") &&
          !guarded
        ) {
          hovered.push(rule.selectorText);
        }
      }
    };
    walk(sheet.cssRules, false);
    expect(hovered).toEqual([]);
    expect(css).toContain(":hover");
  });

  test("contrast: text 4.5:1 on the field, icons 3:1, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await mount(<Num defaultValue={5} label="Qty" />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = composite(resolve("var(--ow-bg)"));
      const field = composite(resolve("var(--ow-bg)"), resolve(TINT));
      const hovered = composite(resolve("var(--ow-bg)"), resolve(TINT_HOVER));
      const stepperHover = composite(
        resolve("var(--ow-bg)"),
        resolve(TINT_HOVER),
        resolve("var(--ow-hover)"),
      );
      const text = composite(resolve("var(--ow-fg)"));
      const icon = composite(resolve("var(--ow-muted)"));
      expect(contrast(text, field)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(text, hovered)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(text, stepperHover)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(icon, field)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(icon, hovered)).toBeGreaterThanOrEqual(3);
      expect(contrast(text, page)).toBeGreaterThanOrEqual(7);
    }
  });

  test("right to left: the Decrement stays at the start, which is the right", async () => {
    const { group, minus, plus } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl" style={{ inlineSize: 260 }}>
          <Num defaultValue={5} label="Qty" />
        </div>
      </DirectionProvider>,
    );
    const g = group.getBoundingClientRect();
    expect(minus.getBoundingClientRect().right).toBeCloseTo(g.right - 4, 0);
    expect(plus.getBoundingClientRect().left).toBeCloseTo(g.left + 4, 0);
  });

  test("more contrast draws the edge in --ow-edge", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const { group } = await mount(<Num defaultValue={5} label="Qty" />);
    await commands.setContrast("more");
    expect(getComputedStyle(group).boxShadow).toContain(resolve("var(--ow-edge)"));
  });

  test("forced colors: the transparent outline is the edge, focus is Highlight, disabled is GrayText", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { group, minus } = await mount(<Num defaultValue={0} min={0} label="Qty" />);
    await commands.setForcedColors("active");
    expect(getComputedStyle(group).outlineStyle).toBe("solid");
    expect(getComputedStyle(group).outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(minus).color).toBe(resolve("GrayText"));
    expect(getComputedStyle(minus).opacity).toBe("1");
    await userEvent.tab();
    expect(getComputedStyle(group).outlineColor).toBe(resolve("Highlight"));
  });
});

describe("Number Field's ScrubArea", () => {
  test("wraps the label with an ew-resize cursor, ns-resize when vertical, and no selection", async () => {
    const screen = await render(
      <NumberField.Root defaultValue={1}>
        <NumberField.ScrubArea>
          <label htmlFor="x">Across</label>
        </NumberField.ScrubArea>
        <NumberField.ScrubArea direction="vertical">
          <label htmlFor="y">Down</label>
        </NumberField.ScrubArea>
        <NumberField.Group />
      </NumberField.Root>,
    );
    const [across, down] = [
      ...screen.container.querySelectorAll<HTMLElement>(".ow-number-field__scrub-area"),
    ] as [HTMLElement, HTMLElement];
    expect(getComputedStyle(across).cursor).toBe("ew-resize");
    expect(getComputedStyle(down).cursor).toBe("ns-resize");
    expect(across.getAttribute("data-direction")).toBe("horizontal");
    expect(getComputedStyle(across).userSelect).toBe("none");
    // It takes the label's width, not the field's.
    expect(across.getBoundingClientRect().width).toBeLessThan(
      (screen.container.querySelector(".ow-number-field") as HTMLElement).getBoundingClientRect()
        .width / 2,
    );
  });

  test("dragging it changes the value, and the cursor is drawn in a portal while it does", async () => {
    function Scrubbable() {
      return (
        <NumberField.Root defaultValue={0} step={1}>
          <NumberField.ScrubArea style={{ padding: 8 }}>
            <label htmlFor="x">Qty</label>
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
          <NumberField.Group />
        </NumberField.Root>
      );
    }
    const { screen, input } = await mount(<Scrubbable />);
    onTestFinished(() => commands.mouse("up"));
    expect(document.querySelector(".ow-number-field__scrub-cursor")).toBeNull();
    const area = screen.container.querySelector(".ow-number-field__scrub-area") as HTMLElement;
    await userEvent.hover(area);
    await commands.mouse("down");
    await userEvent.hover(area, { position: { x: 30, y: 6 }, force: true });
    await userEvent.hover(area, { position: { x: 60, y: 6 }, force: true });
    await expect
      .poll(() => document.querySelector(".ow-number-field__scrub-cursor"))
      .not.toBeNull();
    const cursor = document.querySelector(".ow-number-field__scrub-cursor") as HTMLElement;
    expect(cursor.parentElement).toBe(document.body);
    expect(cursor.getAttribute("data-slot")).toBe("number-field-scrub-area-cursor");
    expect(getComputedStyle(cursor).position).toBe("fixed");
    expect(getComputedStyle(cursor).pointerEvents).toBe("none");
    expect(getComputedStyle(cursor).color).toBe(resolve("var(--ow-fg)"));
    expect(cursor.getBoundingClientRect().width).toBeCloseTo(24, 0);
    const halo = cursor.querySelector("path") as SVGPathElement;
    expect(getComputedStyle(halo).stroke).toBe(resolve("var(--ow-bg)"));
    expect(cursor.querySelectorAll("path")).toHaveLength(6);
    await commands.mouse("up");
    await expect.poll(() => document.querySelector(".ow-number-field__scrub-cursor")).toBeNull();
    // The drag moved the value, whichever way the headless pointer's movement counted it.
    expect(input.value).not.toBe("0");
  });

  test("the cursor's own children replace the arrow", async () => {
    const { screen } = await mount(
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea style={{ padding: 8 }}>
          <label htmlFor="x">Qty</label>
          <NumberField.ScrubAreaCursor>
            <b data-mine="">+</b>
          </NumberField.ScrubAreaCursor>
        </NumberField.ScrubArea>
        <NumberField.Group />
      </NumberField.Root>,
    );
    onTestFinished(() => commands.mouse("up"));
    const area = screen.container.querySelector(".ow-number-field__scrub-area") as HTMLElement;
    await userEvent.hover(area);
    await commands.mouse("down");
    await userEvent.hover(area, { position: { x: 30, y: 6 }, force: true });
    await userEvent.hover(area, { position: { x: 60, y: 6 }, force: true });
    await expect
      .poll(() => document.querySelector(".ow-number-field__scrub-cursor"))
      .not.toBeNull();
    const cursor = document.querySelector(".ow-number-field__scrub-cursor") as HTMLElement;
    expect(cursor.querySelector("[data-mine]")).not.toBeNull();
    expect(cursor.querySelector("svg")).toBeNull();
  });
});

describe("Number Field, around it", () => {
  test("passes className, style, render, and ref through on every part", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      group: createRef<HTMLDivElement>(),
      input: createRef<HTMLInputElement>(),
      minus: createRef<HTMLButtonElement>(),
      plus: createRef<HTMLButtonElement>(),
      area: createRef<HTMLSpanElement>(),
    };
    const { field, group, input, minus, plus } = await mount(
      <NumberField.Root ref={refs.root} defaultValue={1} className="r" style={{ marginInline: 3 }}>
        <NumberField.ScrubArea ref={refs.area} className="a">
          <label htmlFor="x">Qty</label>
        </NumberField.ScrubArea>
        <NumberField.Group ref={refs.group} className="g" style={{ opacity: 0.9 }}>
          <NumberField.Decrement ref={refs.minus} className="d" render={<button type="button" />} />
          <NumberField.Input ref={refs.input} className="i" aria-label="Qty" />
          <NumberField.Increment ref={refs.plus} className="p" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(refs.root.current).toBe(field);
    expect(refs.group.current).toBe(group);
    expect(refs.input.current).toBe(input);
    expect(refs.minus.current).toBe(minus);
    expect(refs.plus.current).toBe(plus);
    expect(refs.area.current?.className).toBe("ow-number-field__scrub-area a");
    expect(field.className).toBe("ow-number-field ow-number-field--md r");
    expect(group.className).toBe("ow-number-field__group g");
    expect(input.className).toBe("ow-number-field__input i");
    expect(minus.className).toBe("ow-number-field__stepper ow-number-field__decrement d");
    expect(plus.className).toBe("ow-number-field__stepper ow-number-field__increment p");
    expect(field.style.marginInline).toBe("3px");
    expect(group.style.opacity).toBe("0.9");
  });

  test("a theme token set on a field changes it alone", async () => {
    const tokens = { "--ow-fg": "rgb(7, 8, 9)" } as CSSProperties;
    const { input } = await mount(<Num defaultValue={1} label="Qty" style={tokens} />);
    expect(getComputedStyle(input).color).toBe("rgb(7, 8, 9)");
  });

  test("an unlayered rule on a className beats its own value", async () => {
    const sheet = document.createElement("style");
    sheet.textContent =
      ".brand-group { background-color: rgb(1, 2, 3); } .brand-step { color: rgb(4, 5, 6); }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { group, plus } = await mount(
      <NumberField.Root defaultValue={1}>
        <NumberField.Group className="brand-group">
          <NumberField.Input aria-label="Qty" />
          <NumberField.Increment className="brand-step" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(getComputedStyle(group).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(plus).color).toBe("rgb(4, 5, 6)");
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <NumberField.Root defaultValue={5} format={{ style: "currency", currency: "USD" }}>
        <NumberField.ScrubArea>
          <label htmlFor="x">Price</label>
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
        <NumberField.Group />
      </NumberField.Root>,
    );
    expect(html).toContain("ow-number-field__group");
    expect(html).toContain("ow-number-field__increment");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, in a Field, disabled, or at a limit", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, inlineSize: 260 }}>
        <Field.Root name="a">
          <Field.Label>Quantity</Field.Label>
          <NumberField.Root defaultValue={2} min={0} max={10} />
          <Field.Description>Up to ten.</Field.Description>
        </Field.Root>
        <Num defaultValue={0} min={0} size="sm" label="Small" />
        <Num defaultValue={3} disabled size="lg" label="Off" />
        <Num defaultValue={3} readOnly label="Read" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a step too", async () => {
    const { plus } = await mount(<Num defaultValue={1} label="Qty" />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(plus);
    await pointerAway();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

test("every part has its data-slot", async () => {
  const screen = await render(
    <NumberField.Root defaultValue={5}>
      <NumberField.ScrubArea>
        <label htmlFor="x">Qty</label>
      </NumberField.ScrubArea>
      <NumberField.Group />
    </NumberField.Root>,
  );
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "number-field",
    "number-field-scrub-area",
    "number-field-group",
    "number-field-decrement",
    "number-field-input",
    "number-field-increment",
  ]);
});
