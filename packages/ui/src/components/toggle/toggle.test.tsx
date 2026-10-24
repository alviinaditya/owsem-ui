import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Toggle } from "./index";

const root = document.documentElement;

// An on toggle's fill: the raised key, tinted toward its text.
const ON = "color-mix(in oklab, var(--ow-raised-bg), var(--ow-fg) 8%)";

const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l3 7h7l-6 4 2 8-6-5-6 5 2-8-6-4h7z" />
  </svg>
);

async function mount(ui: ReactNode): Promise<HTMLButtonElement[]> {
  const screen = await render(ui);
  return [...screen.container.querySelectorAll<HTMLButtonElement>(".ow-toggle")];
}

async function one(ui: ReactNode): Promise<HTMLButtonElement> {
  const [toggle] = await mount(ui);
  if (!toggle) throw new Error("no toggle");
  return toggle;
}

/** Resolves a value (e.g. `var(--ow-raised-bg)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Parks the pointer in the bottom corner, off any toggle an earlier test left it over. */
async function pointerAway() {
  const spot = document.createElement("span");
  spot.style.cssText = "position:fixed;inset:auto 0 0 auto;inline-size:4px;block-size:4px";
  document.body.append(spot);
  await userEvent.hover(spot);
  spot.remove();
}

describe("Toggle", () => {
  test("is Base UI's toggle: aria-pressed and data-pressed follow a click", async () => {
    const toggle = await one(<Toggle aria-label="Favorite" startIcon={<Star />} />);
    expect(toggle.tagName).toBe("BUTTON");
    expect(toggle.type).toBe("button");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.hasAttribute("data-pressed")).toBe(false);
    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.hasAttribute("data-pressed")).toBe(true);
  });

  test("Space and Enter toggle it from the keyboard", async () => {
    const toggle = await one(<Toggle>Pin</Toggle>);
    await userEvent.tab();
    expect(document.activeElement).toBe(toggle);
    await userEvent.keyboard(" ");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard("{Enter}");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  test("works controlled and uncontrolled (FR-4)", async () => {
    const changes: boolean[] = [];
    function Controlled() {
      const [pressed, setPressed] = useState(false);
      return (
        <Toggle
          pressed={pressed}
          onPressedChange={(next) => {
            changes.push(next);
            setPressed(next);
          }}
        >
          Wrap
        </Toggle>
      );
    }
    const [controlled, uncontrolled] = await mount(
      <>
        <Controlled />
        <Toggle defaultPressed>Pin</Toggle>
      </>,
    );
    if (!controlled || !uncontrolled) throw new Error("no toggles");
    await userEvent.click(controlled);
    expect(changes).toEqual([true]);
    expect(controlled.getAttribute("aria-pressed")).toBe("true");
    expect(uncontrolled.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(uncontrolled);
    expect(uncontrolled.getAttribute("aria-pressed")).toBe("false");
  });

  test("a disabled toggle ignores presses", async () => {
    const toggle = await one(<Toggle disabled>Pin</Toggle>);
    expect(toggle.disabled).toBe(true);
    expect(toggle.hasAttribute("data-disabled")).toBe(true);
    await userEvent.click(toggle, { force: true });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const ref = createRef<HTMLButtonElement>();
    const [byString, byFunction, rendered] = await mount(
      <>
        <Toggle ref={ref} className="mine" style={{ marginInline: "3px" }}>
          A
        </Toggle>
        <Toggle defaultPressed className={(state) => (state.pressed ? "is-on" : "is-off")}>
          B
        </Toggle>
        <Toggle render={<span />} nativeButton={false}>
          C
        </Toggle>
      </>,
    );
    expect(ref.current).toBe(byString);
    expect(byString?.className).toBe("ow-toggle mine");
    expect(byString?.style.marginInline).toBe("3px");
    expect(byFunction?.className).toBe("ow-toggle is-on");
    expect(rendered?.tagName).toBe("SPAN");
    expect(rendered?.getAttribute("role")).toBe("button");
  });

  test("marks its size, with md as the default, and its icons as decorative", async () => {
    const [md, sm, iconOnly] = await mount(
      <>
        <Toggle startIcon={<Star />}>Star</Toggle>
        <Toggle size="sm" endIcon={<Star />}>
          Star
        </Toggle>
        <Toggle aria-label="Star" startIcon={<Star />} />
      </>,
    );
    expect(md?.dataset.size).toBe("md");
    expect(sm?.dataset.size).toBe("sm");
    expect(md?.hasAttribute("data-icon-only")).toBe(false);
    expect(iconOnly?.hasAttribute("data-icon-only")).toBe(true);
    const icon = md?.querySelector(".ow-toggle__icon");
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(icon?.getAttribute("data-side")).toBe("start");
    expect(sm?.querySelector(".ow-toggle__icon")?.getAttribute("data-side")).toBe("end");
  });

  test("is flat while off and the raised key while on, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [off, on] = await mount(
      <>
        <Toggle>Off</Toggle>
        <Toggle defaultPressed>On</Toggle>
      </>,
    );
    if (!off || !on) throw new Error("no toggles");
    await pointerAway();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const offStyle = getComputedStyle(off);
      expect(offStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(offStyle.boxShadow).toBe("none");
      expect(offStyle.color).toBe(resolve("color", "var(--ow-muted)"));
      const onStyle = getComputedStyle(on);
      expect(onStyle.backgroundColor).toBe(resolve("color", ON));
      // Apart from a surface of the key's own color, such as a white panel in light.
      expect(onStyle.backgroundColor).not.toBe(resolve("color", "var(--ow-raised-bg)"));
      expect(onStyle.boxShadow).toBe(resolve("box-shadow", "var(--ow-raised-shadow)"));
      expect(onStyle.color).toBe(resolve("color", "var(--ow-fg)"));
    }
  });

  test("is tinted on hover while off, and keeps its edges while on", async () => {
    const [off, on] = await mount(
      <>
        <Toggle>Off</Toggle>
        <Toggle defaultPressed>On</Toggle>
      </>,
    );
    if (!off || !on) throw new Error("no toggles");
    await userEvent.hover(off);
    expect(getComputedStyle(off).backgroundColor).toBe(resolve("color", "var(--ow-hover)"));
    expect(getComputedStyle(off).color).toBe(resolve("color", "var(--ow-fg)"));
    await userEvent.hover(on);
    // The key tints a few percent further toward its text under the pointer; its edges stay.
    expect(getComputedStyle(on).backgroundColor).toBe(
      resolve("color", "color-mix(in oklab, var(--ow-raised-bg), var(--ow-fg) 12%)"),
    );
    expect(getComputedStyle(on).boxShadow).toBe(resolve("box-shadow", "var(--ow-raised-shadow)"));
  });

  test("a press goes in to 0.97 in the pressed material, then lets go raised (DP-4)", async () => {
    const toggle = await one(<Toggle>Pin</Toggle>);
    await pointerAway();
    toggle.focus();
    await userEvent.keyboard("{Space>}");
    await wait(150);
    const held = getComputedStyle(toggle);
    expect(held.transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    expect(held.backgroundColor).toBe(resolve("color", "var(--ow-pressed-bg)"));
    expect(held.boxShadow).toBe(resolve("box-shadow", "var(--ow-pressed-shadow)"));
    expect(held.transitionDuration).toBe("0.09s");
    await userEvent.keyboard("{/Space}");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(getComputedStyle(toggle).backgroundColor).toBe(resolve("color", ON));
    // The release rides the settle spring.
    expect(getComputedStyle(toggle).transitionDuration).toBe("0.573s");
    await settle();
    expect(getComputedStyle(toggle).transform).toBe("none");
  });

  test("under reduced motion a press changes the material only (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const toggle = await one(<Toggle>Pin</Toggle>);
    toggle.focus();
    await userEvent.keyboard("{Space>}");
    await wait(150);
    expect(getComputedStyle(toggle).transform).toBe("none");
    expect(getComputedStyle(toggle).backgroundColor).toBe(resolve("color", "var(--ow-pressed-bg)"));
    await userEvent.keyboard("{/Space}");
  });

  test("shows a 2px focus ring 2px out, from the focus token (FR-13)", async () => {
    const toggle = await one(<Toggle>Pin</Toggle>);
    await userEvent.tab();
    expect(document.activeElement).toBe(toggle);
    const style = getComputedStyle(toggle);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const tokens = {
      "--ow-muted": "rgb(1, 2, 3)",
      "--ow-raised-bg": "rgb(255, 0, 0)",
      "--ow-raised-shadow": "none",
      "--ow-fg": "rgb(0, 0, 255)",
      "--ow-pressed-bg": "rgb(0, 128, 0)",
    } as CSSProperties;
    const [off, on, other] = await mount(
      <>
        <Toggle style={tokens}>Off</Toggle>
        <Toggle style={tokens} defaultPressed>
          On
        </Toggle>
        <Toggle defaultPressed>Other</Toggle>
      </>,
    );
    if (!off || !on || !other) throw new Error("no toggles");
    await pointerAway();
    expect(getComputedStyle(off).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(on).backgroundColor).toBe(
      resolve("color", "color-mix(in oklab, rgb(255, 0, 0), rgb(0, 0, 255) 8%)"),
    );
    expect(getComputedStyle(on).boxShadow).toBe("none");
    expect(getComputedStyle(on).color).toBe("rgb(0, 0, 255)");
    expect(getComputedStyle(other).backgroundColor).toBe(resolve("color", ON));
    off.focus();
    await userEvent.keyboard("{Space>}");
    expect(getComputedStyle(off).backgroundColor).toBe("rgb(0, 128, 0)");
    await userEvent.keyboard("{/Space}");
  });

  test("keeps an edge and shows on as the system highlight in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const [off, on] = await mount(
      <>
        <Toggle>Off</Toggle>
        <Toggle defaultPressed>On</Toggle>
      </>,
    );
    if (!off || !on) throw new Error("no toggles");
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const edge = getComputedStyle(off);
    expect(edge.outlineStyle).toBe("solid");
    expect(edge.outlineWidth).toBe("1px");
    expect(edge.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(on).backgroundColor).toBe(resolve("color", "Highlight"));
    expect(getComputedStyle(on).color).toBe(resolve("color", "HighlightText"));
  });

  test("follows the text direction (FR-16)", async () => {
    const toggle = await one(
      <div dir="rtl">
        <Toggle startIcon={<Star />}>Star</Toggle>
      </div>,
    );
    const icon = toggle.querySelector<HTMLElement>(".ow-toggle__icon");
    if (!icon) throw new Error("no icon");
    // Inline start is the right side in RTL: the icon sits there, pulled toward the edge.
    const box = toggle.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    expect(box.right - iconBox.right).toBeLessThan(iconBox.left - box.left);
    expect(Number.parseFloat(getComputedStyle(icon).marginRight)).toBeLessThan(0);
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Toggle startIcon={<Star />}>Star</Toggle>
        <Toggle defaultPressed startIcon={<Star />}>
          Starred
        </Toggle>
        <Toggle aria-label="Favorite" startIcon={<Star />} />
        <Toggle disabled>Disabled</Toggle>
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
        <Toggle>Off</Toggle>
        <Toggle defaultPressed>On</Toggle>
      </>,
    );
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
