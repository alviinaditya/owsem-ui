import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Switch } from "./index";

const root = document.documentElement;

const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l3 7h7l-6 4 2 8-6-5-6 5 2-8-6-4h7z" />
  </svg>
);

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(ui);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-switch")];
}

async function one(ui: ReactNode): Promise<HTMLElement> {
  const [track] = await mount(ui);
  if (!track) throw new Error("no switch");
  return track;
}

const thumbOf = (track: Element) => track.querySelector(".ow-switch__thumb") as HTMLElement;

/** Resolves a value (e.g. `var(--ow-edge)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

/** The off track: a tint of the text color, one step up on hover. */
const REST = "color-mix(in oklab, var(--ow-fg) 10%, transparent)";
const HOVER = "color-mix(in oklab, var(--ow-fg) 13%, transparent)";

/** Parks the pointer in the bottom corner, off any switch an earlier test left it over. */
async function pointerAway() {
  const spot = document.createElement("span");
  spot.style.cssText = "position:fixed;inset:auto 0 0 auto;inline-size:4px;block-size:4px";
  document.body.append(spot);
  await userEvent.hover(spot);
  spot.remove();
}

/** An unlayered stylesheet for one test, as an app's own CSS would be. */
function unlayered(css: string) {
  const sheet = document.createElement("style");
  sheet.textContent = css;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
}

/** How far the thumb sits from where layout puts it. */
const shift = (track: HTMLElement) =>
  thumbOf(track).getBoundingClientRect().left -
  track.getBoundingClientRect().left -
  thumbOf(track).offsetLeft;

/** Where the thumb is from the track's start, without its stretch, which is not the position. */
const placed = (thumb: HTMLElement) => {
  thumb.style.scale = "none";
  thumb.style.setProperty("--_lean", "0");
  const left =
    thumb.getBoundingClientRect().left -
    (thumb.closest(".ow-switch") as HTMLElement).getBoundingClientRect().left;
  thumb.style.removeProperty("scale");
  thumb.style.removeProperty("--_lean");
  return left;
};

const running = (el: Element) =>
  el.getAnimations().map((animation) => (animation as CSSTransition).transitionProperty);

const finish = (el: Element) => {
  for (const animation of el.getAnimations()) animation.finish();
};

describe("Switch", () => {
  test("draws its own Thumb without children, and is Base UI's switch", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    expect(track.getAttribute("role")).toBe("switch");
    expect(track.getAttribute("aria-checked")).toBe("false");
    expect(track.hasAttribute("data-unchecked")).toBe(true);
    expect(track.querySelectorAll(".ow-switch__thumb")).toHaveLength(1);
    await userEvent.click(track);
    expect(track.getAttribute("aria-checked")).toBe("true");
    expect(track.hasAttribute("data-checked")).toBe(true);
    expect(thumbOf(track).hasAttribute("data-checked")).toBe(true);
  });

  test("children replace its Thumb, and the Thumb can hold an icon", async () => {
    const track = await one(
      <Switch.Root aria-label="Favorite">
        <Switch.Thumb className="mine">
          <Star />
        </Switch.Thumb>
      </Switch.Root>,
    );
    expect(track.querySelectorAll(".ow-switch__thumb")).toHaveLength(1);
    expect(thumbOf(track).className).toBe("ow-switch__thumb mine");
    expect(thumbOf(track).querySelector("svg")).not.toBeNull();
  });

  test("Space and Enter switch it from the keyboard", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(track);
    await userEvent.keyboard(" ");
    expect(track.getAttribute("aria-checked")).toBe("true");
    await userEvent.keyboard("{Enter}");
    expect(track.getAttribute("aria-checked")).toBe("false");
  });

  test("works controlled and uncontrolled (FR-4)", async () => {
    const changes: boolean[] = [];
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Switch.Root
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
        <Switch.Root aria-label="Uncontrolled" defaultChecked />
      </>,
    );
    if (!controlled || !uncontrolled) throw new Error("no switches");
    await userEvent.click(controlled);
    expect(changes).toEqual([true]);
    expect(controlled.getAttribute("aria-checked")).toBe("true");
    expect(uncontrolled.getAttribute("aria-checked")).toBe("true");
    await userEvent.click(uncontrolled);
    expect(uncontrolled.getAttribute("aria-checked")).toBe("false");
  });

  test("disabled and read-only ignore presses", async () => {
    const [disabled, readOnly] = await mount(
      <>
        <Switch.Root aria-label="Disabled" disabled />
        <Switch.Root aria-label="Read only" readOnly />
      </>,
    );
    if (!disabled || !readOnly) throw new Error("no switches");
    await userEvent.click(disabled, { force: true });
    await userEvent.click(readOnly);
    expect(disabled.getAttribute("aria-checked")).toBe("false");
    expect(disabled.hasAttribute("data-disabled")).toBe(true);
    expect(readOnly.getAttribute("aria-checked")).toBe("false");
    expect(readOnly.hasAttribute("data-readonly")).toBe(true);
  });

  test("a wrapping label names it and switches it", async () => {
    await mount(
      // biome-ignore lint/a11y/noLabelWithoutControl: Switch.Root renders the input
      <label>
        <Switch.Root />
        <span>Wi-Fi</span>
      </label>,
    );
    const track = page.getByRole("switch", { name: "Wi-Fi" });
    await expect.element(track).toHaveAttribute("aria-checked", "false");
    await userEvent.click(page.getByText("Wi-Fi"));
    await expect.element(track).toHaveAttribute("aria-checked", "true");
  });

  test("submits with a plain form through Base UI's name and value", async () => {
    const screen = await render(
      <form>
        <Switch.Root aria-label="Alerts" name="alerts" value="yes" uncheckedValue="no" />
      </form>,
    );
    const form = screen.container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("alerts")).toBe("no");
    await userEvent.click(form.querySelector(".ow-switch") as HTMLElement);
    await expect.poll(() => new FormData(form).get("alerts")).toBe("yes");
  });

  test("passes className, style, render, and ref through on both parts (FR-2, FR-5)", async () => {
    const trackRef = createRef<HTMLElement>();
    const thumbRef = createRef<HTMLSpanElement>();
    const [plain, rendered] = await mount(
      <>
        <Switch.Root ref={trackRef} aria-label="A" className="mine" style={{ marginInline: "3px" }}>
          <Switch.Thumb ref={thumbRef} className="key" style={{ opacity: 0.5 }} />
        </Switch.Root>
        <Switch.Root aria-label="C" render={<button type="button" />} nativeButton>
          <Switch.Thumb render={<i />} />
        </Switch.Root>
      </>,
    );
    if (!plain || !rendered) throw new Error("no switches");
    expect(trackRef.current).toBe(plain);
    expect(thumbRef.current).toBe(thumbOf(plain));
    expect(plain.className).toBe("ow-switch ow-switch--md mine");
    expect(plain.style.marginInline).toBe("3px");
    expect(thumbOf(plain).className).toBe("ow-switch__thumb key");
    expect(thumbOf(plain).style.opacity).toBe("0.5");
    expect(rendered.tagName).toBe("BUTTON");
    expect(thumbOf(rendered).tagName).toBe("I");
  });

  test("marks its size, with md as the default", async () => {
    const [md, sm, lg] = await mount(
      <>
        <Switch.Root aria-label="A" />
        <Switch.Root aria-label="B" size="sm" />
        <Switch.Root aria-label="C" size="lg" />
      </>,
    );
    expect(md?.dataset.size).toBe("md");
    expect(sm?.dataset.size).toBe("sm");
    expect(lg?.dataset.size).toBe("lg");
  });

  test("off is a tint with no edge, on the accent; the thumb is a white key with the surface shadow in both", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [off, on] = await mount(
      <>
        <Switch.Root aria-label="Off" />
        <Switch.Root aria-label="On" defaultChecked />
      </>,
    );
    if (!off || !on) throw new Error("no switches");
    await pointerAway();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(getComputedStyle(off).backgroundColor).toBe(resolve("color", REST));
      expect(getComputedStyle(off).boxShadow).toBe("none");
      expect(getComputedStyle(on).backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
      expect(getComputedStyle(on).boxShadow).toBe(
        resolve("box-shadow", "var(--ow-primary-shadow)"),
      );
      for (const track of [off, on]) {
        const thumb = getComputedStyle(thumbOf(track));
        expect(thumb.backgroundColor).toBe(resolve("color", "var(--ow-on-accent)"));
        expect(thumb.boxShadow).toBe("none");
        // The shadow is on the key inside the clear border, not on the border.
        expect(getComputedStyle(thumbOf(track), "::before").boxShadow).toBe(
          resolve("box-shadow", "var(--ow-surface-shadow)"),
        );
      }
    }
  });

  test("hover, on it or its label, steps the track up; focus adds the ring and no edge", async () => {
    const screen = await render(
      <label>
        <Switch.Root /> <span>Wi-Fi</span>
      </label>,
    );
    const track = screen.getByRole("switch").element() as HTMLElement;
    await pointerAway();
    expect(getComputedStyle(track).backgroundColor).toBe(resolve("color", REST));
    await userEvent.hover(track);
    expect(getComputedStyle(track).backgroundColor).toBe(resolve("color", HOVER));
    await pointerAway();
    await userEvent.hover(screen.getByText("Wi-Fi"));
    expect(getComputedStyle(track).backgroundColor).toBe(resolve("color", HOVER));
    await pointerAway();
    await userEvent.tab();
    expect(document.activeElement).toBe(track);
    expect(getComputedStyle(track).boxShadow).toBe("none");
    expect(getComputedStyle(track).outlineWidth).toBe("2px");
  });

  test("more contrast draws the edge in --ow-edge", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    await commands.setContrast("more");
    expect(getComputedStyle(track).boxShadow).toBe(
      resolve("box-shadow", "inset 0 0 0 1px var(--ow-edge)"),
    );
  });

  test("the on fill and the focus ring have 3:1 against the page and a panel, in both themes (DP-6)", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      for (const surface of ["var(--ow-bg)", "var(--ow-panel)"]) {
        const behind = composite(resolve("color", surface));
        for (const state of ["var(--ow-focus)", "var(--ow-accent)"]) {
          expect(contrast(composite(resolve("color", state)), behind)).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  test("an icon in the thumb has 3:1 against the key, off and on, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const track = await one(
      <Switch.Root aria-label="Dark mode">
        <Switch.Thumb>
          <Star />
        </Switch.Thumb>
      </Switch.Root>,
    );
    const thumb = thumbOf(track);
    for (const checked of [false, true]) {
      if (track.hasAttribute("data-checked") !== checked) track.click();
      await expect.poll(() => thumb.hasAttribute("data-checked")).toBe(checked);
      for (const theme of ["light", "dark"]) {
        root.dataset.theme = theme;
        const style = getComputedStyle(thumb);
        const key = composite(style.backgroundColor);
        expect(contrast(composite(style.color), key)).toBeGreaterThanOrEqual(3);
        // The ink is a theme token, never the text color that turns near-white in dark.
        const ink = resolve("color", checked ? "var(--ow-accent)" : "var(--ow-edge)");
        expect(style.color).toBe(ink);
      }
    }
  });

  test("the fill changes at once, while the thumb travels on the spring and rests on layout", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    const thumb = thumbOf(track);
    // A transition needs a style to start from.
    expect(shift(track)).toBe(0);
    track.click();
    await expect.poll(() => running(thumb)).toContain("--_switch-travel");
    expect(running(track)).toEqual([]);
    expect(getComputedStyle(track).backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
    // Layout moves it at once, and translate covers the distance.
    const [travel] = thumb.getAnimations();
    if (!travel) throw new Error("no travel");
    travel.pause();
    travel.currentTime = 0;
    expect(thumb.offsetLeft).toBe(20);
    expect(shift(track)).toBe(-20);
    travel.finish();
    expect(shift(track)).toBe(0);
  });

  test("changing its mind mid-travel turns back from where the thumb is", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    const thumb = thumbOf(track);
    expect(shift(track)).toBe(0);
    track.click();
    await expect.poll(() => running(thumb)).toContain("--_switch-travel");
    const [there] = thumb.getAnimations();
    if (!there) throw new Error("no travel");
    there.pause();
    there.currentTime = 200;
    const at = placed(thumb);
    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThan(20);
    track.click();
    await expect.poll(() => track.getAttribute("aria-checked")).toBe("false");
    const [back] = thumb.getAnimations();
    if (!back) throw new Error("no travel back");
    back.pause();
    back.currentTime = 0;
    const from = placed(thumb);
    expect(Math.abs(from - at)).toBeLessThanOrEqual(0.5);
    back.finish();
    expect(shift(track)).toBe(0);
  });

  test("mid-travel the thumb stretches along its path from its leading edge, and rests at its own size", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    const thumb = thumbOf(track);
    const rest = thumb.getBoundingClientRect();
    track.click();
    await expect.poll(() => running(thumb)).toContain("--_switch-travel");
    const [travel] = thumb.getAnimations();
    if (!travel) throw new Error("no travel");
    travel.pause();
    travel.currentTime = 200;
    const stretched = thumb.getBoundingClientRect().width / rest.width;
    expect(stretched).toBeGreaterThan(1.05);
    expect(stretched).toBeLessThanOrEqual(1.3);
    // Going toward the end, its end edge leads and stays on its place; the tail reaches back.
    const stretchedBox = thumb.getBoundingClientRect();
    thumb.style.scale = "none";
    thumb.style.setProperty("--_lean", "0");
    const plain = thumb.getBoundingClientRect();
    thumb.style.removeProperty("scale");
    thumb.style.removeProperty("--_lean");
    expect(Math.abs(stretchedBox.right - plain.right)).toBeLessThanOrEqual(0.5);
    expect(stretchedBox.left).toBeLessThan(plain.left - 1);
    travel.finish();
    expect(thumb.getBoundingClientRect().width).toBe(rest.width);
  });

  test("the tail never moves back: the thumb's start edge only goes forward along the whole travel", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    const thumb = thumbOf(track);
    const start = track.getBoundingClientRect().left;
    track.click();
    await expect.poll(() => running(thumb)).toContain("--_switch-travel");
    const [travel] = thumb.getAnimations();
    if (!travel) throw new Error("no travel");
    travel.pause();
    let last = Number.NEGATIVE_INFINITY;
    for (let ms = 0; ms <= 650; ms += 10) {
      travel.currentTime = ms;
      const left = thumb.getBoundingClientRect().left - start;
      expect(left).toBeGreaterThanOrEqual(last - 0.05);
      last = left;
    }
    travel.finish();
  });

  test("letting go of a held press carries on from the held shape: nothing jumps as the state flips", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    const thumb = thumbOf(track);
    const rest = thumb.getBoundingClientRect();
    await userEvent.hover(track);
    await commands.mouse("down");
    onTestFinished(() => commands.mouse("up"));
    await expect.poll(() => thumb.getBoundingClientRect().width).toBeGreaterThan(rest.width + 1);
    const held = thumb.getBoundingClientRect();
    await commands.mouse("up");
    await expect.poll(() => track.getAttribute("aria-checked")).toBe("true");
    // The first frame after the flip: both transitions at their start.
    for (const animation of thumb.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }
    const first = thumb.getBoundingClientRect();
    expect(Math.abs(first.left - held.left)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(first.right - held.right)).toBeLessThanOrEqual(0.5);
  });

  test("a held press widens the thumb toward its travel and squashes its height, and lets go on the settle spring", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    const thumb = thumbOf(track);
    const rest = thumb.getBoundingClientRect();
    await userEvent.hover(track);
    await commands.mouse("down");
    onTestFinished(() => commands.mouse("up"));
    await expect.poll(() => thumb.getBoundingClientRect().width).toBeGreaterThan(rest.width + 1);
    const held = thumb.getBoundingClientRect();
    // It grows toward where it will go, from its start edge, and is a little shorter.
    expect(held.height).toBeLessThan(rest.height);
    expect(Math.abs(held.left - rest.left)).toBeLessThanOrEqual(0.5);
    expect(getComputedStyle(thumb).transitionDuration.split(",")[1]?.trim()).toBe("0.09s");
    await commands.mouse("up");
    await expect.poll(() => track.getAttribute("aria-checked")).toBe("true");
    expect(getComputedStyle(thumb).transitionDuration.split(",")[1]?.trim()).toBe("0.573s");
    finish(thumb);
    await expect.poll(() => shift(track)).toBe(0);
    expect(thumb.getBoundingClientRect().width).toBe(rest.width);
  });

  test("a press on a disabled or read-only switch does not squash it", async () => {
    const [disabled, readOnly] = await mount(
      <>
        <Switch.Root aria-label="Disabled" disabled />
        <Switch.Root aria-label="Read only" readOnly />
      </>,
    );
    for (const track of [disabled, readOnly]) {
      if (!track) throw new Error("no switch");
      const before = thumbOf(track).getBoundingClientRect().width;
      await userEvent.hover(track, { force: true });
      await commands.mouse("down");
      await new Promise((done) => setTimeout(done, 150));
      expect(thumbOf(track).getBoundingClientRect().width).toBe(before);
      await commands.mouse("up");
    }
  });

  test("under reduced motion it goes to its place with no travel and no squash (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    const thumb = thumbOf(track);
    const rest = thumb.getBoundingClientRect();
    expect(getComputedStyle(thumb).transitionProperty).toBe("none");
    await userEvent.hover(track);
    await commands.mouse("down");
    onTestFinished(() => commands.mouse("up"));
    await new Promise((done) => setTimeout(done, 150));
    expect(thumb.getBoundingClientRect().width).toBe(rest.width);
    await commands.mouse("up");
    await expect.poll(() => track.getAttribute("aria-checked")).toBe("true");
    expect(running(thumb)).toEqual([]);
    expect(shift(track)).toBe(0);
  });

  test("shows a 2px focus ring 2px out, from the focus token (FR-13)", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(track);
    const style = getComputedStyle(track);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
  });

  test("a theme token set on a part changes it alone (TK-9)", async () => {
    const tokens = {
      "--ow-fg": "rgb(1, 2, 3)",
      "--ow-accent": "rgb(7, 8, 9)",
    } as CSSProperties;
    const [off, on, other] = await mount(
      <>
        <Switch.Root aria-label="Off" style={tokens} />
        <Switch.Root aria-label="On" defaultChecked style={tokens}>
          <Switch.Thumb style={{ "--ow-on-accent": "rgb(255, 0, 0)" } as CSSProperties} />
        </Switch.Root>
        <Switch.Root aria-label="Other" defaultChecked />
      </>,
    );
    if (!off || !on || !other) throw new Error("no switches");
    await pointerAway();
    // Its track follows the text color it sets, not the page's.
    expect(getComputedStyle(off).backgroundColor).toBe(resolve("color", REST, off));
    expect(getComputedStyle(off).backgroundColor).not.toBe(resolve("color", REST));
    expect(getComputedStyle(on).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(thumbOf(on)).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(thumbOf(off)).backgroundColor).toBe(
      resolve("color", "var(--ow-on-accent)"),
    );
    expect(getComputedStyle(other).backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
  });

  test("a theme token on an ancestor reaches both parts", async () => {
    const screen = await render(
      <div
        style={{ "--ow-accent": "rgb(7, 8, 9)", "--ow-on-accent": "rgb(1, 2, 3)" } as CSSProperties}
      >
        <Switch.Root aria-label="On" defaultChecked />
      </div>,
    );
    const track = screen.container.querySelector(".ow-switch") as HTMLElement;
    expect(getComputedStyle(track).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(thumbOf(track)).backgroundColor).toBe("rgb(1, 2, 3)");
  });

  test("an unlayered rule on a className beats its own value, on and off", async () => {
    unlayered(`
      .brand { background-color: rgb(1, 2, 3); border-radius: 0; }
      .brand-key { background-color: rgb(4, 5, 6); }
    `);
    const [off, on] = await mount(
      <>
        <Switch.Root aria-label="Off" className="brand">
          <Switch.Thumb className="brand-key" />
        </Switch.Root>
        <Switch.Root aria-label="On" defaultChecked className="brand">
          <Switch.Thumb className="brand-key" />
        </Switch.Root>
      </>,
    );
    if (!off || !on) throw new Error("no switches");
    for (const track of [off, on]) {
      expect(getComputedStyle(track).backgroundColor).toBe("rgb(1, 2, 3)");
      expect(getComputedStyle(track).borderTopLeftRadius).toBe("0px");
      expect(getComputedStyle(thumbOf(track)).backgroundColor).toBe("rgb(4, 5, 6)");
    }
  });

  test("keeps its edge and shows its state in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const [off, on, disabled] = await mount(
      <>
        <Switch.Root aria-label="Off" />
        <Switch.Root aria-label="On" defaultChecked />
        <Switch.Root aria-label="Disabled" disabled defaultChecked />
      </>,
    );
    if (!off || !on || !disabled) throw new Error("no switches");
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const edge = getComputedStyle(off);
    expect(edge.outlineStyle).toBe("solid");
    expect(edge.outlineWidth).toBe("1px");
    expect(edge.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(thumbOf(off)).backgroundColor).toBe(resolve("color", "CanvasText"));
    // The clear border stays clear, so the key keeps its gaps.
    expect(getComputedStyle(thumbOf(off)).borderTopColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(on).backgroundColor).toBe(resolve("color", "Highlight"));
    expect(getComputedStyle(thumbOf(on)).backgroundColor).toBe(resolve("color", "HighlightText"));
    expect(getComputedStyle(disabled).backgroundColor).toBe(resolve("color", "GrayText"));
    expect(getComputedStyle(disabled).opacity).toBe("1");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, justifyItems: "start" }}>
        <Switch.Root aria-label="Off" />
        <Switch.Root aria-label="On" defaultChecked />
        {/* biome-ignore lint/a11y/noLabelWithoutControl: Switch.Root renders the input */}
        <label>
          <Switch.Root size="sm" /> Labelled
        </label>
        <Switch.Root aria-label="Icon">
          <Switch.Thumb>
            <Star />
          </Switch.Thumb>
        </Switch.Root>
        <Switch.Root aria-label="Disabled" disabled />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a change too", async () => {
    const track = await one(<Switch.Root aria-label="Wi-Fi" />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    track.click();
    await expect.poll(() => running(thumbOf(track))).toContain("--_switch-travel");
    finish(thumbOf(track));
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

test("every part has its data-slot", async () => {
  const screen = await render(<Switch.Root aria-label="S" />);
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual(["switch", "switch-thumb"]);
});
