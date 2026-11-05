import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Checkbox } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(ui);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-checkbox")];
}

async function one(ui: ReactNode): Promise<HTMLElement> {
  const [box] = await mount(ui);
  if (!box) throw new Error("no checkbox");
  return box;
}

const indicator = (box: Element) => box.querySelector<HTMLElement>(".ow-checkbox__indicator");
const glyph = (box: Element, name: "check" | "minus") => {
  const el = box.querySelector(`[data-glyph="${name}"]`);
  if (!el) throw new Error(`no ${name} glyph`);
  return el;
};

/** Resolves a value (e.g. `var(--ow-accent)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

/** A token's value as an opaque rgb triplet. */
const tone = (token: string) => composite(resolve("color", `var(${token})`));

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Parks the pointer in the bottom corner, off any box an earlier test left it over. */
async function pointerAway() {
  const spot = document.createElement("span");
  spot.style.cssText = "position:fixed;inset:auto 0 0 auto;inline-size:4px;block-size:4px";
  document.body.append(spot);
  await userEvent.hover(spot);
  spot.remove();
}

describe("Checkbox", () => {
  test("the shortest usage works: a label around a Root, which draws its own Indicator", async () => {
    const screen = await render(
      <label>
        <Checkbox.Root /> Run the tests
      </label>,
    );
    const box = screen.getByRole("checkbox", { name: "Run the tests" }).element() as HTMLElement;
    expect(box.getAttribute("aria-checked")).toBe("false");
    // Base UI's Indicator is there only while it shows something.
    expect(indicator(box)).toBeNull();
    await userEvent.click(box);
    expect(box.getAttribute("aria-checked")).toBe("true");
    expect(box.hasAttribute("data-checked")).toBe(true);
    expect(indicator(box)?.hasAttribute("data-checked")).toBe(true);
    expect(glyph(box, "check").getAttribute("aria-hidden")).toBe("true");
  });

  test("a press on the label's text toggles the box", async () => {
    const screen = await render(
      <label>
        <Checkbox.Root /> <span>Run the tests</span>
      </label>,
    );
    const box = screen.getByRole("checkbox", { name: "Run the tests" }).element();
    await userEvent.click(screen.getByText("Run the tests"));
    expect(box.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(box);
    // The pointer does not show the focus ring.
    expect(box.matches(":focus-visible")).toBe(false);
  });

  test("Space toggles it from the keyboard, and Enter does not", async () => {
    const box = await one(<Checkbox.Root aria-label="Run the tests" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(box);
    await userEvent.keyboard(" ");
    expect(box.getAttribute("aria-checked")).toBe("true");
    await userEvent.keyboard("{Enter}");
    expect(box.getAttribute("aria-checked")).toBe("true");
  });

  test("works controlled and uncontrolled (FR-4)", async () => {
    const changes: boolean[] = [];
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox.Root
          aria-label="Controlled"
          checked={checked}
          onCheckedChange={(next) => {
            changes.push(next);
            setChecked(next);
          }}
        />
      );
    }
    const [controlled, uncontrolled] = await mount(
      <>
        <Controlled />
        <Checkbox.Root aria-label="Uncontrolled" defaultChecked />
      </>,
    );
    if (!controlled || !uncontrolled) throw new Error("no checkboxes");
    await userEvent.click(controlled);
    expect(changes).toEqual([true]);
    expect(controlled.getAttribute("aria-checked")).toBe("true");
    expect(uncontrolled.getAttribute("aria-checked")).toBe("true");
    await userEvent.click(uncontrolled);
    expect(uncontrolled.getAttribute("aria-checked")).toBe("false");
  });

  test("submits with a plain form, through Base UI's name and value", async () => {
    const screen = await render(
      <form>
        <Checkbox.Root aria-label="Tests" name="task" value="tests" defaultChecked />
        <Checkbox.Root aria-label="Tag" name="task" value="tag" />
      </form>,
    );
    const form = screen.container.querySelector("form");
    if (!form) throw new Error("no form");
    expect(new FormData(form).getAll("task")).toEqual(["tests"]);
  });

  test("indeterminate reads as mixed and shows the minus", async () => {
    const box = await one(<Checkbox.Root aria-label="All" indeterminate />);
    expect(box.getAttribute("aria-checked")).toBe("mixed");
    expect(box.hasAttribute("data-indeterminate")).toBe(true);
    expect(box.hasAttribute("data-checked")).toBe(false);
    expect(getComputedStyle(glyph(box, "minus")).opacity).toBe("1");
    expect(getComputedStyle(glyph(box, "check")).opacity).toBe("0");
  });

  test("a disabled box ignores presses, and a read-only one keeps its state", async () => {
    const [disabled, readOnly] = await mount(
      <>
        <Checkbox.Root aria-label="Disabled" disabled />
        <Checkbox.Root aria-label="Read only" readOnly defaultChecked />
      </>,
    );
    if (!disabled || !readOnly) throw new Error("no checkboxes");
    expect(disabled.hasAttribute("data-disabled")).toBe(true);
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(getComputedStyle(disabled).cursor).toBe("not-allowed");
    await userEvent.click(disabled, { force: true });
    expect(disabled.getAttribute("aria-checked")).toBe("false");
    expect(readOnly.getAttribute("aria-readonly")).toBe("true");
    await userEvent.click(readOnly);
    expect(readOnly.getAttribute("aria-checked")).toBe("true");
    expect(getComputedStyle(readOnly).transform).toBe("none");
  });

  test("passes className, style, render, and ref through on both parts (FR-2, FR-5)", async () => {
    const rootRef = createRef<HTMLElement>();
    const indicatorRef = createRef<HTMLSpanElement>();
    const [byString, byFunction, rendered] = await mount(
      <>
        <Checkbox.Root
          ref={rootRef}
          aria-label="A"
          defaultChecked
          className="mine"
          style={{ marginInline: "3px" }}
        >
          <Checkbox.Indicator
            ref={indicatorRef}
            className="mine-too"
            style={{ marginInline: "1px" }}
          />
        </Checkbox.Root>
        <Checkbox.Root
          aria-label="B"
          defaultChecked
          className={(state) => (state.checked ? "is-on" : "is-off")}
        >
          <Checkbox.Indicator
            render={<i />}
            className={(state) => (state.checked ? "on" : "off")}
          />
        </Checkbox.Root>
        <Checkbox.Root aria-label="C" render={<b />} />
      </>,
    );
    expect(rootRef.current).toBe(byString);
    expect(byString?.className).toBe("ow-checkbox mine");
    expect(byString?.style.marginInline).toBe("3px");
    expect(indicatorRef.current?.className).toBe("ow-checkbox__indicator mine-too");
    expect(indicatorRef.current?.style.marginInline).toBe("1px");
    expect(byFunction?.className).toBe("ow-checkbox is-on");
    expect(byFunction?.querySelector("i")?.className).toBe("ow-checkbox__indicator on");
    expect(rendered?.tagName).toBe("B");
    expect(rendered?.getAttribute("role")).toBe("checkbox");
  });

  test("children replace the Indicator and the glyphs, with any node", async () => {
    const [own, none, node, pair] = await mount(
      <>
        <Checkbox.Root aria-label="Own Indicator" defaultChecked>
          <Checkbox.Indicator data-testid="own">
            <svg data-testid="star" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <Checkbox.Root aria-label="Nothing inside" defaultChecked>
          {null}
        </Checkbox.Root>
        <Checkbox.Root aria-label="A node" defaultChecked>
          <Checkbox.Indicator>
            <span data-testid="text">✓</span>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <Checkbox.Root aria-label="A marked pair" indeterminate>
          <Checkbox.Indicator>
            <i data-glyph="check">✓</i>
            <i data-glyph="minus">–</i>
          </Checkbox.Indicator>
        </Checkbox.Root>
      </>,
    );
    if (!own || !none || !node || !pair) throw new Error("no checkboxes");
    expect(own.querySelector("[data-glyph]")).toBeNull();
    // Any svg fills the box, whatever size it asks for.
    const star = own.querySelector("svg");
    expect(star?.getBoundingClientRect().width).toBeCloseTo(own.getBoundingClientRect().width, 1);
    expect(indicator(none)).toBeNull();
    expect(node.querySelector("[data-glyph]")).toBeNull();
    expect(node.textContent).toBe("✓");
    // A marked pair takes the same crossfade.
    expect(getComputedStyle(glyph(pair, "minus")).opacity).toBe("1");
    expect(getComputedStyle(glyph(pair, "check")).opacity).toBe("0");
  });

  test("marks its size, with md as the default", async () => {
    const [md, sm, lg] = await mount(
      <>
        <Checkbox.Root aria-label="md" />
        <Checkbox.Root aria-label="sm" size="sm" />
        <Checkbox.Root aria-label="lg" size="lg" />
      </>,
    );
    expect(md?.dataset.size).toBe("md");
    expect(sm?.dataset.size).toBe("sm");
    expect(lg?.dataset.size).toBe("lg");
  });

  test("off is the well with its edge, on the primary material, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [off, on, mixed] = await mount(
      <>
        <Checkbox.Root aria-label="Off" />
        <Checkbox.Root aria-label="On" defaultChecked />
        <Checkbox.Root aria-label="Mixed" indeterminate />
      </>,
    );
    if (!off || !on || !mixed) throw new Error("no checkboxes");
    await pointerAway();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(getComputedStyle(off).backgroundColor).toBe(resolve("color", "var(--ow-well-bg)"));
      expect(getComputedStyle(off).boxShadow).toBe(
        resolve("box-shadow", "inset 0 0 0 1px var(--ow-edge)"),
      );
      for (const box of [on, mixed]) {
        expect(getComputedStyle(box).backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
        expect(getComputedStyle(box).boxShadow).toBe(
          resolve("box-shadow", "var(--ow-primary-shadow)"),
        );
        expect(getComputedStyle(box).color).toBe(resolve("color", "var(--ow-on-accent)"));
      }
      expect(getComputedStyle(glyph(on, "check")).stroke).toBe(
        resolve("color", "var(--ow-on-accent)"),
      );
    }
  });

  test("its edge, fill, and glyph hold 3:1 in light and dark (DP-6)", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const edge = tone("--ow-edge");
      const accent = tone("--ow-accent");
      for (const surface of ["--ow-bg", "--ow-panel", "--ow-well-bg"]) {
        expect(contrast(edge, tone(surface)), `${theme} edge on ${surface}`).toBeGreaterThan(3);
      }
      for (const surface of ["--ow-bg", "--ow-panel"]) {
        expect(contrast(accent, tone(surface)), `${theme} fill on ${surface}`).toBeGreaterThan(3);
      }
      expect(contrast(tone("--ow-on-accent"), accent), `${theme} glyph`).toBeGreaterThan(3);
    }
  });

  test("fills change at once: only the press moves on the box (DP-5)", async () => {
    const box = await one(<Checkbox.Root aria-label="Run" />);
    await pointerAway();
    expect(getComputedStyle(box).transitionProperty).toBe("transform");
    box.click();
    await expect.poll(() => box.hasAttribute("data-checked")).toBe(true);
    expect(getComputedStyle(box).backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
  });

  test("the glyphs crossfade with a small scale on the settle spring", async () => {
    function Parent() {
      const [mixed, setMixed] = useState(false);
      return (
        <>
          <Checkbox.Root aria-label="All" defaultChecked indeterminate={mixed} />
          <button type="button" onClick={() => setMixed((value) => !value)}>
            Mix
          </button>
        </>
      );
    }
    const screen = await render(<Parent />);
    const box = screen.getByRole("checkbox").element();
    const check = glyph(box, "check");
    const minus = glyph(box, "minus");
    expect(getComputedStyle(check).opacity).toBe("1");
    expect(getComputedStyle(check).transform).toBe("none");
    expect(getComputedStyle(minus).opacity).toBe("0");
    expect(getComputedStyle(minus).transform).toBe("matrix(0.8, 0, 0, 0.8, 0, 0)");
    expect(getComputedStyle(minus).transitionDuration).toBe("0.12s, 0.573s");

    await userEvent.click(screen.getByRole("button"));
    expect(box.getAttribute("aria-checked")).toBe("mixed");
    await expect.poll(() => getComputedStyle(minus).opacity).toBe("1");
    await expect.poll(() => getComputedStyle(minus).transform).toBe("none");
    await expect.poll(() => getComputedStyle(check).opacity).toBe("0");
    await expect.poll(() => getComputedStyle(check).transform).toBe("matrix(0.8, 0, 0, 0.8, 0, 0)");
  });

  test("the glyph comes in from the small scale, and the Indicator leaves when off", async () => {
    const box = await one(<Checkbox.Root aria-label="Run" />);
    box.click();
    await expect.poll(() => indicator(box)).not.toBeNull();
    const check = glyph(box, "check");
    await expect.poll(() => getComputedStyle(check).opacity).toBe("1");
    await expect.poll(() => getComputedStyle(check).transform).toBe("none");
    box.click();
    await expect.poll(() => indicator(box)).toBeNull();
    expect(box.getAttribute("aria-checked")).toBe("false");
  });

  test("a load with the box checked does not animate", async () => {
    const box = await one(<Checkbox.Root aria-label="Run" defaultChecked />);
    expect(indicator(box)?.hasAttribute("data-starting-style")).toBe(false);
    expect(getComputedStyle(glyph(box, "check")).opacity).toBe("1");
  });

  test("is tinted under the pointer, on the box or on its label", async () => {
    const screen = await render(
      <label>
        <Checkbox.Root /> <span>Run</span>
      </label>,
    );
    const box = screen.getByRole("checkbox").element();
    await pointerAway();
    expect(getComputedStyle(box).backgroundImage).toBe("none");
    await userEvent.hover(screen.getByText("Run"));
    expect(getComputedStyle(box).backgroundImage).toContain("linear-gradient");
    await pointerAway();
    await userEvent.hover(box);
    expect(getComputedStyle(box).backgroundImage).toContain("linear-gradient");
  });

  test("a press goes in to 0.97, keeps its edge, and lets go on the settle spring (DP-4)", async () => {
    const box = await one(<Checkbox.Root aria-label="Run" />);
    await userEvent.hover(box);
    await commands.mouse("down");
    await wait(150);
    const held = getComputedStyle(box);
    expect(held.transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    expect(held.backgroundColor).toBe(resolve("color", "var(--ow-pressed-bg)"));
    expect(held.boxShadow).toBe(resolve("box-shadow", "inset 0 0 0 1px var(--ow-edge)"));
    expect(held.transitionDuration).toBe("0.09s");
    await commands.mouse("up");
    expect(box.getAttribute("aria-checked")).toBe("true");
    expect(getComputedStyle(box).transitionDuration).toBe("0.573s");
    await expect.poll(() => getComputedStyle(box).transform).toBe("none");
  });

  test("a checked box darkens while held, and its label presses it too", async () => {
    const screen = await render(
      <label>
        <Checkbox.Root defaultChecked /> <span>Run</span>
      </label>,
    );
    const box = screen.getByRole("checkbox").element();
    await userEvent.hover(screen.getByText("Run"));
    await commands.mouse("down");
    await wait(150);
    expect(getComputedStyle(box).transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    expect(getComputedStyle(box).backgroundColor).toBe(
      resolve("color", "color-mix(in oklab, var(--ow-accent), black 10%)"),
    );
    await commands.mouse("up");
  });

  test("under reduced motion the fills change and nothing moves (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const box = await one(<Checkbox.Root aria-label="Run" defaultChecked />);
    expect(getComputedStyle(glyph(box, "minus")).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(getComputedStyle(glyph(box, "minus")).opacity).toBe("0");
    await userEvent.hover(box);
    await commands.mouse("down");
    await wait(150);
    expect(getComputedStyle(box).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(getComputedStyle(box).backgroundColor).toBe(
      resolve("color", "color-mix(in oklab, var(--ow-accent), black 10%)"),
    );
    await commands.mouse("up");
  });

  test("shows a 2px focus ring 2px out, from the focus token (FR-13)", async () => {
    const box = await one(<Checkbox.Root aria-label="Run" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(box);
    const style = getComputedStyle(box);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
  });

  test("a theme token set on it changes it alone, and one around it reaches it (TK-9)", async () => {
    const tokens = {
      "--ow-accent": "rgb(255, 0, 0)",
      "--ow-primary-shadow": "none",
      "--ow-on-accent": "rgb(0, 0, 255)",
      "--ow-well-bg": "rgb(0, 128, 0)",
      "--ow-edge": "rgb(1, 2, 3)",
      "--ow-radius": "20px",
    } as CSSProperties;
    const [off, on, inside, other] = await mount(
      <>
        <Checkbox.Root aria-label="Off" style={tokens} />
        <Checkbox.Root aria-label="On" style={tokens} defaultChecked />
        <span style={tokens}>
          <Checkbox.Root aria-label="Inside" defaultChecked />
        </span>
        <Checkbox.Root aria-label="Other" defaultChecked />
      </>,
    );
    if (!off || !on || !inside || !other) throw new Error("no checkboxes");
    await pointerAway();
    expect(getComputedStyle(off).backgroundColor).toBe("rgb(0, 128, 0)");
    expect(getComputedStyle(off).boxShadow).toBe("rgb(1, 2, 3) 0px 0px 0px 1px inset");
    expect(getComputedStyle(off).borderTopLeftRadius).toBe("10px");
    expect(getComputedStyle(on).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(on).boxShadow).toBe("none");
    expect(getComputedStyle(glyph(on, "check")).stroke).toBe("rgb(0, 0, 255)");
    expect(getComputedStyle(inside).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(other).backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
  });

  test("an unlayered rule on a className beats the component's own values", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = `
      .mine { background-color: rgb(1, 2, 3); border-radius: 0; font-size: 30px; }
      .mine-glyph { opacity: 0.5; }
    `;
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const [off, on, held] = await mount(
      <>
        <Checkbox.Root aria-label="Off" className="mine" />
        <Checkbox.Root aria-label="On" className="mine" size="lg" defaultChecked>
          <Checkbox.Indicator className="mine-glyph" />
        </Checkbox.Root>
        <Checkbox.Root aria-label="Held" className="mine" />
      </>,
    );
    if (!off || !on || !held) throw new Error("no checkboxes");
    await pointerAway();
    for (const box of [off, on]) {
      expect(getComputedStyle(box).backgroundColor).toBe("rgb(1, 2, 3)");
      expect(getComputedStyle(box).borderTopLeftRadius).toBe("0px");
      expect(getComputedStyle(box).fontSize).toBe("30px");
    }
    const ownIndicator = on.querySelector(".mine-glyph");
    if (!ownIndicator) throw new Error("no indicator");
    expect(getComputedStyle(ownIndicator).opacity).toBe("0.5");
    await userEvent.hover(held);
    await commands.mouse("down");
    await wait(150);
    expect(getComputedStyle(held).backgroundColor).toBe("rgb(1, 2, 3)");
    await commands.mouse("up");
  });

  test("keeps an edge and shows on as the system highlight in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const [off, on, mixed, disabled, disabledOn] = await mount(
      <>
        <Checkbox.Root aria-label="Off" />
        <Checkbox.Root aria-label="On" defaultChecked />
        <Checkbox.Root aria-label="Mixed" indeterminate />
        <Checkbox.Root aria-label="Disabled" disabled />
        <Checkbox.Root aria-label="Disabled, on" disabled defaultChecked />
      </>,
    );
    if (!off || !on || !mixed || !disabled || !disabledOn) throw new Error("no checkboxes");
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const edge = getComputedStyle(off);
    expect(edge.outlineStyle).toBe("solid");
    expect(edge.outlineWidth).toBe("1px");
    expect(edge.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    for (const box of [on, mixed]) {
      expect(getComputedStyle(box).backgroundColor).toBe(resolve("color", "Highlight"));
      expect(getComputedStyle(box).color).toBe(resolve("color", "HighlightText"));
    }
    expect(getComputedStyle(glyph(on, "check")).stroke).toBe(resolve("color", "HighlightText"));
    expect(getComputedStyle(disabled).outlineColor).toBe(resolve("color", "GrayText"));
    expect(getComputedStyle(disabled).opacity).toBe("1");
    expect(getComputedStyle(disabledOn).backgroundColor).toBe(resolve("color", "GrayText"));
  });

  test("follows the text direction (FR-16)", async () => {
    const screen = await render(
      <label dir="rtl" style={{ display: "flex", inlineSize: 200 }}>
        <Checkbox.Root defaultChecked />
        <span>Run</span>
      </label>,
    );
    const box = screen.getByRole("checkbox").element();
    const text = screen.getByText("Run").element();
    // Inline start is the right side in RTL, and the glyph is not mirrored.
    expect(box.getBoundingClientRect().left).toBeGreaterThan(text.getBoundingClientRect().left);
    expect(getComputedStyle(glyph(box, "check")).transform).toBe("none");
  });

  test("works in a portal, and takes the theme of its container", async () => {
    const container = document.createElement("div");
    container.dataset.theme = "dark";
    document.body.append(container);
    onTestFinished(() => container.remove());
    await render(createPortal(<Checkbox.Root aria-label="Run" />, container));
    const box = container.querySelector(".ow-checkbox");
    if (!box) throw new Error("no checkbox");
    await userEvent.click(box);
    expect(box.getAttribute("aria-checked")).toBe("true");
    expect(getComputedStyle(box).backgroundColor).toBe(
      resolve("color", "var(--ow-accent)", container),
    );
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 12, justifyItems: "start" }}>
        <label>
          <Checkbox.Root /> Off
        </label>
        <label>
          <Checkbox.Root defaultChecked /> Checked
        </label>
        <label>
          <Checkbox.Root indeterminate /> Mixed
        </label>
        <label>
          <Checkbox.Root disabled /> Disabled
        </label>
        <Checkbox.Root aria-label="Named" size="lg" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await mount(
      <>
        <Checkbox.Root aria-label="Off" />
        <Checkbox.Root aria-label="On" defaultChecked />
        <Checkbox.Root aria-label="Mixed" indeterminate />
      </>,
    );
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
