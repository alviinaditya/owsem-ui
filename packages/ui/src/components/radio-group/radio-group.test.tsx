import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Radio, RadioGroup } from "./index";

const root = document.documentElement;
const OPTIONS = ["Standard", "Express", "Pickup"] as const;

function Options(props: Partial<RadioGroup.Props<string>>) {
  return (
    <RadioGroup aria-label="Delivery" defaultValue="express" {...props}>
      {OPTIONS.map((name) => (
        <label key={name}>
          <Radio.Root value={name.toLowerCase()} />
          {name}
        </label>
      ))}
    </RadioGroup>
  );
}

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const group = screen.container.querySelector<HTMLElement>(".ow-radio-group");
  if (!group) throw new Error("no group");
  const row = (name: string) => {
    const el = [...group.querySelectorAll("label")].find((label) => label.textContent === name);
    if (!el) throw new Error(`no row ${name}`);
    return el;
  };
  const radio = (name: string) => row(name).querySelector(".ow-radio-group__radio") as HTMLElement;
  const dot = (name: string) =>
    radio(name).querySelector<HTMLElement>(".ow-radio-group__indicator");
  const highlight = group.querySelector(".ow-glide") as HTMLElement;
  return { screen, group, row, radio, dot, highlight };
}

const checked = (radio: Element) => radio.getAttribute("aria-checked") === "true";

/** Resolves a value (e.g. `var(--ow-accent)`) of `property` to its computed form in `scope`. */
function resolve(
  property: "color" | "background-color" | "box-shadow",
  value: string,
  scope: Element = document.body,
) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

const edge = (color = "var(--ow-edge)") => `inset 0 0 0 1px ${color}`;

/** Parks the pointer in the bottom corner, off any row an earlier test left it over. */
async function pointerAway() {
  const spot = document.createElement("span");
  spot.style.cssText = "position:fixed;inset:auto 0 0 auto;inline-size:4px;block-size:4px";
  document.body.append(spot);
  await userEvent.hover(spot);
  spot.remove();
}

/** An unlayered stylesheet, as an app's own CSS. */
function appCss(text: string) {
  const style = document.createElement("style");
  style.textContent = text;
  document.head.append(style);
  onTestFinished(() => style.remove());
}

describe("Radio Group", () => {
  test("is Base UI's radio group: one checked radio, each named by its row", async () => {
    const { group, radio, screen } = await mount(<Options />);
    expect(group.getAttribute("role")).toBe("radiogroup");
    expect(group.getAttribute("aria-label")).toBe("Delivery");
    expect(checked(radio("Express"))).toBe(true);
    expect(checked(radio("Standard"))).toBe(false);
    expect(radio("Express").hasAttribute("data-checked")).toBe(true);
    expect(radio("Standard").hasAttribute("data-unchecked")).toBe(true);
    expect(screen.getByRole("radio", { name: "Pickup" }).element()).toBe(radio("Pickup"));
    expect(group.querySelector(".ow-glide")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("the shortest usage draws its Indicator; children replace it", async () => {
    const { group } = await mount(
      <RadioGroup aria-label="Marks" defaultValue="a">
        <Radio.Root value="a" aria-label="Dot" />
        <Radio.Root value="a" aria-label="Own node">
          <i data-testid="own" />
        </Radio.Root>
        <Radio.Root value="a" aria-label="Own glyph">
          <Radio.Indicator className="glyph">
            <svg viewBox="0 0 24 24" aria-hidden="true" />
          </Radio.Indicator>
        </Radio.Root>
        <Radio.Root value="b" aria-label="Off" />
      </RadioGroup>,
    );
    const [dot, own, glyph, off] = group.querySelectorAll(".ow-radio-group__radio");
    expect(dot?.querySelector(".ow-radio-group__indicator:empty")).not.toBeNull();
    expect(own?.querySelector(".ow-radio-group__indicator")).toBeNull();
    expect(own?.querySelector("[data-testid='own']")).not.toBeNull();
    // Off, the Indicator is not mounted.
    expect(off?.querySelector(".ow-radio-group__indicator")).toBeNull();
    // A glyph replaces the dot.
    const mark = glyph?.querySelector(".glyph") as HTMLElement;
    expect(mark.className).toBe("ow-radio-group__indicator glyph");
    expect(getComputedStyle(mark).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(mark).borderTopWidth).toBe("0px");
    const svg = mark.querySelector("svg") as SVGElement;
    expect(svg.getBoundingClientRect().width).toBeCloseTo(mark.getBoundingClientRect().width, 0);
  });

  test("a press on the radio or on the row's text picks it, once", async () => {
    const changes: string[] = [];
    const { radio, row } = await mount(<Options onValueChange={(value) => changes.push(value)} />);
    await userEvent.click(radio("Pickup"));
    expect(checked(radio("Pickup"))).toBe(true);
    expect(checked(radio("Express"))).toBe(false);
    await userEvent.click(row("Standard"), { position: { x: 60, y: 10 } });
    expect(checked(radio("Standard"))).toBe(true);
    expect(changes).toEqual(["pickup", "standard"]);
  });

  test("works controlled and uncontrolled (FR-4)", async () => {
    const changes: string[] = [];
    function Controlled() {
      const [value, setValue] = useState("standard");
      return (
        <Options
          value={value}
          onValueChange={(next) => {
            changes.push(next);
            if (next !== "pickup") setValue(next);
          }}
        />
      );
    }
    const { radio } = await mount(<Controlled />);
    await userEvent.click(radio("Express"));
    expect(checked(radio("Express"))).toBe(true);
    // The owner of the value turned this one down.
    await userEvent.click(radio("Pickup"));
    expect(checked(radio("Pickup"))).toBe(false);
    expect(checked(radio("Express"))).toBe(true);
    expect(changes).toEqual(["express", "pickup"]);
  });

  test("the keyboard comes from Base UI: one tab stop, arrows move and pick, Space picks", async () => {
    const { radio, screen } = await mount(
      <>
        <Options />
        <button type="button">After</button>
      </>,
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(radio("Express"));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(radio("Pickup"));
    expect(checked(radio("Pickup"))).toBe(true);
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(radio("Standard"));
    await userEvent.keyboard("{ArrowUp}");
    expect(checked(radio("Pickup"))).toBe(true);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button").element());
  });

  test("with nothing checked, Tab reaches the first radio, and Space picks it", async () => {
    const { radio } = await mount(<Options defaultValue={undefined} />);
    await userEvent.tab();
    expect(document.activeElement).toBe(radio("Standard"));
    expect(checked(radio("Standard"))).toBe(false);
    await userEvent.keyboard(" ");
    expect(checked(radio("Standard"))).toBe(true);
  });

  test("disabled and read-only radios ignore presses; the arrows skip disabled ones", async () => {
    const group = await mount(
      <RadioGroup aria-label="Delivery" defaultValue="standard">
        <label>
          <Radio.Root value="standard" />
          Standard
        </label>
        <label>
          <Radio.Root value="express" disabled />
          Express
        </label>
        <label>
          <Radio.Root value="pickup" />
          Pickup
        </label>
      </RadioGroup>,
    );
    expect(group.radio("Express").hasAttribute("data-disabled")).toBe(true);
    expect(getComputedStyle(group.row("Express")).cursor).toBe("not-allowed");
    await userEvent.click(group.row("Express"), { force: true });
    expect(checked(group.radio("Express"))).toBe(false);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    expect(checked(group.radio("Pickup"))).toBe(true);

    const whole = await mount(<Options disabled />);
    expect(whole.group.hasAttribute("data-disabled")).toBe(true);
    await userEvent.click(whole.row("Pickup"), { force: true });
    expect(checked(whole.radio("Express"))).toBe(true);

    const readOnly = await mount(<Options readOnly />);
    expect(readOnly.radio("Pickup").hasAttribute("data-readonly")).toBe(true);
    await userEvent.click(readOnly.row("Pickup"));
    expect(checked(readOnly.radio("Pickup"))).toBe(false);
    expect(checked(readOnly.radio("Express"))).toBe(true);
  });

  test("works in a plain form with Base UI's name", async () => {
    const screen = await render(
      <form>
        <Options name="delivery" />
      </form>,
    );
    const form = screen.container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("delivery")).toBe("express");
    const pickup = screen.getByRole("radio", { name: "Pickup" });
    await userEvent.click(pickup);
    expect(new FormData(form).get("delivery")).toBe("pickup");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const groupRef = createRef<HTMLDivElement>();
    const radioRef = createRef<HTMLSpanElement>();
    const dotRef = createRef<HTMLSpanElement>();
    const { group } = await mount(
      <RadioGroup
        ref={groupRef}
        aria-label="Marks"
        defaultValue="a"
        className="mine-group"
        style={{ marginInline: "3px" }}
      >
        <Radio.Root ref={radioRef} value="a" className="mine-radio" style={{ marginInline: "4px" }}>
          <Radio.Indicator
            ref={dotRef}
            className={(state) => (state.checked ? "is-on" : "is-off")}
            style={{ marginInline: "5px" }}
            render={<b />}
          />
        </Radio.Root>
        <Radio.Root value="b" aria-label="Button" nativeButton render={<button type="button" />} />
      </RadioGroup>,
    );
    expect(groupRef.current).toBe(group);
    expect(group.className).toBe("ow-radio-group mine-group");
    expect(group.style.marginInline).toBe("3px");
    expect(radioRef.current?.className).toBe("ow-radio-group__radio mine-radio");
    expect(radioRef.current?.style.marginInline).toBe("4px");
    expect(dotRef.current?.tagName).toBe("B");
    expect(dotRef.current?.className).toBe("ow-radio-group__indicator is-on");
    expect(dotRef.current?.style.marginInline).toBe("5px");
    const button = group.querySelector("button") as HTMLElement;
    expect(button.getAttribute("role")).toBe("radio");
    expect(button.className).toBe("ow-radio-group__radio");
  });

  test("off is the well with a crisp edge, and on the accent with a dot, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { radio, dot } = await mount(<Options />);
    await pointerAway();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const off = getComputedStyle(radio("Standard"));
      expect(off.backgroundColor).toBe(resolve("background-color", "var(--ow-well-bg)"));
      expect(off.boxShadow).toBe(resolve("box-shadow", edge()));
      const on = getComputedStyle(radio("Express"));
      expect(on.backgroundColor).toBe(resolve("background-color", "var(--ow-accent)"));
      expect(on.boxShadow).toBe(resolve("box-shadow", "var(--ow-primary-shadow)"));
      expect(getComputedStyle(dot("Express") as Element).backgroundColor).toBe(
        resolve("background-color", "var(--ow-on-accent)"),
      );
    }
  });

  test("the edge, the fill, and the dot keep 3:1 in light and dark (DP-6)", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await mount(<Options />);
    const color = (token: string) => composite(resolve("color", `var(${token})`));
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      for (const surface of ["--ow-bg", "--ow-panel"]) {
        expect(contrast(color("--ow-edge"), color(surface))).toBeGreaterThanOrEqual(3);
        expect(contrast(color("--ow-accent"), color(surface))).toBeGreaterThanOrEqual(3);
      }
      expect(contrast(color("--ow-edge"), color("--ow-well-bg"))).toBeGreaterThanOrEqual(3);
      expect(contrast(color("--ow-on-accent"), color("--ow-accent"))).toBeGreaterThanOrEqual(3);
    }
  });

  test("the fill changes at once, and the dot scales in on the settle spring", async () => {
    const { radio, dot } = await mount(<Options />);
    // The first render does not animate.
    expect((dot("Express") as Element).getAnimations()).toEqual([]);
    expect(getComputedStyle(radio("Express")).transitionProperty).toBe("transform");
    await userEvent.click(radio("Pickup"));
    expect(getComputedStyle(radio("Pickup")).backgroundColor).toBe(
      resolve("background-color", "var(--ow-accent)"),
    );
    await expect.poll(() => dot("Express")).toBeNull();
    const arriving = dot("Pickup") as HTMLElement;
    const style = getComputedStyle(arriving);
    expect(style.transitionProperty).toBe("transform, opacity");
    expect(style.transitionDuration.split(", ")[0]).toBe("0.573s");
    await expect
      .poll(() =>
        arriving
          .getAnimations()
          .some((a) => a instanceof CSSTransition && a.transitionProperty === "transform"),
      )
      .toBe(true);
    await expect.poll(() => getComputedStyle(arriving).transform).toBe("none");
    await expect.poll(() => getComputedStyle(arriving).opacity).toBe("1");
  });

  test("with keepMounted, an unchecked Indicator stays hidden and small", async () => {
    const { group } = await mount(
      <RadioGroup aria-label="Marks" defaultValue="a">
        <Radio.Root value="a" aria-label="On">
          <Radio.Indicator keepMounted />
        </Radio.Root>
        <Radio.Root value="b" aria-label="Off">
          <Radio.Indicator keepMounted />
        </Radio.Root>
      </RadioGroup>,
    );
    const [on, off] = group.querySelectorAll(".ow-radio-group__indicator");
    expect(getComputedStyle(on as Element).opacity).toBe("1");
    expect(getComputedStyle(off as Element).opacity).toBe("0");
    expect(getComputedStyle(off as Element).transform).toBe("matrix(0.5, 0, 0, 0.5, 0, 0)");
  });

  test("Glide lights the row under the pointer, and no other", async () => {
    const { row, highlight, group } = await mount(<Options />);
    await pointerAway();
    expect(group.querySelector("[data-glide-active]")).toBeNull();
    await userEvent.hover(row("Pickup"));
    expect(row("Pickup").hasAttribute("data-glide-active")).toBe(true);
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    await userEvent.hover(row("Standard"));
    expect(row("Standard").hasAttribute("data-glide-active")).toBe(true);
    expect(row("Pickup").hasAttribute("data-glide-active")).toBe(false);
  });

  test("Glide skips disabled and read-only rows, and radios without a row", async () => {
    const { group, row } = await mount(
      <RadioGroup aria-label="Delivery" defaultValue="standard">
        <label>
          <Radio.Root value="standard" disabled />
          Standard
        </label>
        <label>
          <Radio.Root value="express" readOnly />
          Express
        </label>
        <Radio.Root value="pickup" aria-label="Pickup" data-bare="" />
        <label htmlFor="other">Other</label>
      </RadioGroup>,
    );
    await pointerAway();
    for (const target of [
      row("Standard"),
      row("Express"),
      row("Other"),
      group.querySelector("[data-bare]") as HTMLElement,
    ]) {
      await userEvent.hover(target, { force: true });
      expect(group.querySelector("[data-glide-active]")).toBeNull();
    }
  });

  test("a caption in the group is left alone: not lit, and a press picks nothing", async () => {
    const { row, radio, screen } = await mount(
      <RadioGroup aria-labelledby="caption">
        <div id="caption" style={{ paddingBlockEnd: "24px" }}>
          Delivery
        </div>
        {OPTIONS.map((name) => (
          <label key={name}>
            <Radio.Root value={name.toLowerCase()} />
            {name}
          </label>
        ))}
      </RadioGroup>,
    );
    const caption = screen.container.querySelector("#caption") as HTMLElement;
    await userEvent.hover(caption, { position: { x: 4, y: 4 } });
    expect(row("Standard").hasAttribute("data-glide-active")).toBe(false);
    await userEvent.click(caption, { position: { x: 4, y: 4 } });
    expect(checked(radio("Standard"))).toBe(false);
    expect(screen.getByRole("radiogroup", { name: "Delivery" }).element()).toBeTruthy();
  });

  test("Glide does not get in the way of a layout from className", async () => {
    appCss(`
      .across { flex-direction: row; gap: 24px; }
      .cells { display: grid; grid-template-columns: 1fr 1fr; inline-size: 400px; }
    `);
    for (const className of ["across", "cells"]) {
      const { row, highlight, group } = await mount(<Options className={className} />);
      const rows = OPTIONS.map(row);
      // The highlight takes no cell and no gap.
      const first = rows[0]?.getBoundingClientRect() as DOMRect;
      const box = group.getBoundingClientRect();
      expect(first.left).toBeCloseTo(box.left, 0);
      expect(first.top).toBeCloseTo(box.top, 0);
      for (const name of OPTIONS) {
        await userEvent.hover(row(name));
        expect(row(name).hasAttribute("data-glide-active")).toBe(true);
        for (const animation of highlight.getAnimations()) animation.finish();
        const lit = highlight.getBoundingClientRect();
        const under = row(name).getBoundingClientRect();
        expect(Math.abs(lit.left - under.left)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(lit.top - under.top)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(lit.width - under.width)).toBeLessThanOrEqual(0.5);
      }
    }
  });

  test("Glide finds rows nested in a wrapper, such as Field.Item", async () => {
    const { row } = await mount(
      <RadioGroup aria-label="Delivery">
        <div>
          <label>
            <Radio.Root value="a" />
            Nested
          </label>
        </div>
      </RadioGroup>,
    );
    await userEvent.hover(row("Nested"));
    expect(row("Nested").hasAttribute("data-glide-active")).toBe(true);
  });

  test("holding a row goes in to 0.97 with the pressed fill, and the edge stays (DP-4)", async () => {
    const { row, radio } = await mount(<Options />);
    await userEvent.hover(row("Standard"));
    await commands.mouse("down");
    const off = radio("Standard");
    await expect.poll(() => getComputedStyle(off).transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    expect(getComputedStyle(off).backgroundColor).toBe(
      resolve("background-color", "var(--ow-pressed-bg)"),
    );
    expect(getComputedStyle(off).boxShadow).toBe(resolve("box-shadow", edge()));
    expect(getComputedStyle(off).transitionDuration).toBe("0.09s");
    await commands.mouse("up");
    expect(getComputedStyle(off).transitionDuration).toBe("0.573s");
    await expect.poll(() => getComputedStyle(off).transform).toBe("none");
    expect(checked(off)).toBe(true);

    // A checked radio keeps its edges, and its fill darkens.
    await userEvent.hover(off);
    await commands.mouse("down");
    await expect.poll(() => getComputedStyle(off).transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    expect(getComputedStyle(off).backgroundColor).toBe(
      resolve("background-color", "color-mix(in oklab, var(--ow-accent), black 10%)"),
    );
    expect(getComputedStyle(off).boxShadow).toBe(resolve("box-shadow", "var(--ow-primary-shadow)"));
    await commands.mouse("up");
  });

  test("a disabled row does not press in", async () => {
    const { row, radio } = await mount(<Options disabled />);
    await userEvent.hover(row("Standard"), { force: true });
    await commands.mouse("down");
    expect(row("Standard").matches(":active")).toBe(true);
    expect(getComputedStyle(radio("Standard")).transform).toBe("none");
    await commands.mouse("up");
  });

  test("shows a 2px focus ring 2px out from the keyboard, not from a press (FR-13)", async () => {
    const { radio, row } = await mount(<Options />);
    await userEvent.tab();
    const style = getComputedStyle(radio("Express"));
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));

    await userEvent.click(row("Pickup"), { position: { x: 60, y: 10 } });
    expect(document.activeElement).toBe(radio("Pickup"));
    expect(radio("Pickup").matches(":focus-visible")).toBe(false);
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const tokens = {
      "--ow-well-bg": "rgb(1, 2, 3)",
      "--ow-edge": "rgb(4, 5, 6)",
      "--ow-accent": "rgb(255, 0, 0)",
      "--ow-primary-shadow": "none",
      "--ow-on-accent": "rgb(0, 0, 255)",
      "--ow-focus": "rgb(0, 128, 0)",
    } as CSSProperties;
    const { group } = await mount(
      <RadioGroup aria-label="Marks" defaultValue="a">
        <Radio.Root value="a" aria-label="On" style={tokens} />
        <Radio.Root value="b" aria-label="Off" style={tokens} />
        <Radio.Root value="a" aria-label="Other" />
      </RadioGroup>,
    );
    const [on, off, other] = group.querySelectorAll<HTMLElement>(".ow-radio-group__radio");
    if (!on || !off || !other) throw new Error("no radios");
    expect(getComputedStyle(off).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(off).boxShadow).toBe("rgb(4, 5, 6) 0px 0px 0px 1px inset");
    expect(getComputedStyle(on).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(on).boxShadow).toBe("none");
    expect(getComputedStyle(on.querySelector("span") as Element).backgroundColor).toBe(
      "rgb(0, 0, 255)",
    );
    expect(getComputedStyle(other).backgroundColor).toBe(
      resolve("background-color", "var(--ow-accent)"),
    );
    expect(getComputedStyle(other.querySelector("span") as Element).backgroundColor).toBe(
      resolve("background-color", "var(--ow-on-accent)"),
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(on);
    expect(getComputedStyle(on).outlineColor).toBe("rgb(0, 128, 0)");
  });

  test("a token set around the group, on the group, or on the Indicator reaches its parts", async () => {
    const { group, radio, dot } = await mount(
      <div style={{ "--ow-accent": "rgb(255, 0, 0)", "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties}>
        <Options style={{ "--ow-well-bg": "rgb(0, 255, 0)" } as CSSProperties} />
      </div>,
    );
    expect(getComputedStyle(group).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(radio("Express")).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(radio("Standard")).backgroundColor).toBe("rgb(0, 255, 0)");
    expect(dot("Express")).not.toBeNull();

    const own = await mount(
      <RadioGroup aria-label="Own" defaultValue="a">
        <Radio.Root value="a" aria-label="On">
          <Radio.Indicator style={{ "--ow-on-accent": "rgb(9, 9, 9)" } as CSSProperties} />
        </Radio.Root>
      </RadioGroup>,
    );
    const mark = own.group.querySelector(".ow-radio-group__indicator") as Element;
    expect(getComputedStyle(mark).backgroundColor).toBe("rgb(9, 9, 9)");
  });

  test("an unlayered rule on a className beats the component's own value", async () => {
    appCss(`
      .app-group { flex-direction: row; color: rgb(1, 2, 3); font-size: 20px; }
      .app-radio { background-color: rgb(4, 5, 6); box-shadow: none; }
      .app-radio[data-checked] { background-color: rgb(7, 8, 9); }
      .app-dot { background-color: rgb(10, 11, 12); }
    `);
    const { group } = await mount(
      <RadioGroup aria-label="Marks" className="app-group" defaultValue="a">
        <Radio.Root value="a" aria-label="On" className="app-radio">
          <Radio.Indicator className="app-dot" />
        </Radio.Root>
        <Radio.Root value="b" aria-label="Off" className="app-radio" />
      </RadioGroup>,
    );
    const style = getComputedStyle(group);
    expect(style.flexDirection).toBe("row");
    expect(style.color).toBe("rgb(1, 2, 3)");
    expect(style.fontSize).toBe("20px");
    const [on, off] = group.querySelectorAll(".ow-radio-group__radio");
    expect(getComputedStyle(off as Element).backgroundColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(off as Element).boxShadow).toBe("none");
    expect(getComputedStyle(on as Element).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(group.querySelector(".app-dot") as Element).backgroundColor).toBe(
      "rgb(10, 11, 12)",
    );
  });

  test("keeps an edge and shows on as the system highlight in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { radio, dot } = await mount(<Options />);
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const off = getComputedStyle(radio("Standard"));
    expect(off.outlineStyle).toBe("solid");
    expect(off.outlineWidth).toBe("1px");
    expect(off.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(radio("Express")).backgroundColor).toBe(resolve("color", "Highlight"));
    expect(getComputedStyle(dot("Express") as Element).backgroundColor).toBe(
      resolve("color", "HighlightText"),
    );
  });

  test("under reduced motion nothing moves: a press and the dot change color only (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { row, radio, group } = await mount(
      <RadioGroup aria-label="Delivery" defaultValue="standard">
        <label>
          <Radio.Root value="standard">
            <Radio.Indicator keepMounted />
          </Radio.Root>
          Standard
        </label>
        <label>
          <Radio.Root value="express">
            <Radio.Indicator keepMounted />
          </Radio.Root>
          Express
        </label>
      </RadioGroup>,
    );
    const hidden = group.querySelectorAll(".ow-radio-group__indicator")[1] as Element;
    expect(getComputedStyle(hidden).opacity).toBe("0");
    expect(getComputedStyle(hidden).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    await userEvent.hover(row("Express"));
    await commands.mouse("down");
    await expect
      .poll(() => getComputedStyle(radio("Express")).backgroundColor)
      .toBe(resolve("background-color", "var(--ow-pressed-bg)"));
    expect(getComputedStyle(radio("Express")).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    await commands.mouse("up");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Options />
        <Options aria-label="Small" size="sm" />
        <Options aria-label="Disabled" disabled />
        <RadioGroup aria-label="Alone" defaultValue="a">
          <Radio.Root value="a" aria-label="Without a row" />
        </RadioGroup>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a change too", async () => {
    const { radio } = await mount(<Options />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(radio("Pickup"));
    await pointerAway();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
