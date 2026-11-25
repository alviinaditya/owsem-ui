import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { checkSolidHover, composite, contrast, SOLID_HOVER_TINT } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Toggle } from "./index";

const root = document.documentElement;

// Solid, as the primary Button: the accent fill, its text and edge, 5% black over the fill when
// hovered, and 10% black while held.
const SOLID_HELD = "color-mix(in oklab, var(--ow-accent), black 10%)";
const SOLID_HOVER = `linear-gradient(${SOLID_HOVER_TINT} 0 0)`;

// An on toggle's fill: a tint of the text color, so it reads on any surface; held, a deeper one.
const ON = "color-mix(in oklab, var(--ow-accent) 14%, transparent)";
const ON_HOVER = "color-mix(in oklab, var(--ow-accent) 18%, transparent)";
const HELD = "color-mix(in oklab, var(--ow-accent) 22%, transparent)";
const ON_FG = "color-mix(in oklab, var(--ow-accent) 70%, var(--ow-fg))";

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
function resolve(
  property: "color" | "box-shadow" | "background-image",
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
    const [plain, rendered] = await mount(
      <>
        <Toggle ref={ref} className="mine" style={{ marginInline: "3px" }}>
          A
        </Toggle>
        <Toggle render={<span />} nativeButton={false}>
          C
        </Toggle>
      </>,
    );
    expect(ref.current).toBe(plain);
    expect(plain?.className).toBe("ow-toggle ow-toggle--soft ow-toggle--md mine");
    expect(plain?.style.marginInline).toBe("3px");
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

  test("is flat while off and a tint of the accent with accent text while on, with no edge, in light and dark", async () => {
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
      expect(onStyle.boxShadow).toBe("none");
      expect(onStyle.color).toBe(resolve("color", ON_FG));
    }
  });

  test("is tinted on hover while off, and steps its tint up while on", async () => {
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
    expect(getComputedStyle(on).backgroundColor).toBe(resolve("color", ON_HOVER));
    expect(getComputedStyle(on).boxShadow).toBe("none");
  });

  test("a press goes in to 0.97 on a deeper tint, then lets go to its own (DP-4)", async () => {
    const toggle = await one(<Toggle>Pin</Toggle>);
    await pointerAway();
    toggle.focus();
    await userEvent.keyboard("{Space>}");
    await wait(150);
    const held = getComputedStyle(toggle);
    expect(held.transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    expect(held.backgroundColor).toBe(resolve("color", HELD));
    expect(held.boxShadow).toBe("none");
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
    expect(getComputedStyle(toggle).backgroundColor).toBe(resolve("color", HELD));
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
      "--ow-fg": "rgb(0, 0, 255)",
      "--ow-accent": "rgb(255, 0, 0)",
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
    expect(getComputedStyle(on).backgroundColor).toBe(resolve("color", ON, on));
    expect(getComputedStyle(on).backgroundColor).not.toBe(resolve("color", ON));
    expect(getComputedStyle(on).boxShadow).toBe("none");
    expect(getComputedStyle(on).color).toBe(resolve("color", ON_FG, on));
    expect(getComputedStyle(other).backgroundColor).toBe(resolve("color", ON));
    off.focus();
    await userEvent.keyboard("{Space>}");
    expect(getComputedStyle(off).backgroundColor).toBe(resolve("color", HELD, off));
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

describe("Toggle, solid", () => {
  test("marks its variant, with soft as the default, as a class and as data-variant", async () => {
    const [soft, solid, plain] = await mount(
      <>
        <Toggle variant="soft">A</Toggle>
        <Toggle variant="solid" size="lg" className="mine">
          B
        </Toggle>
        <Toggle>C</Toggle>
      </>,
    );
    expect(soft?.dataset.variant).toBe("soft");
    expect(plain?.dataset.variant).toBe("soft");
    expect(plain?.className).toBe(soft?.className);
    expect(solid?.dataset.variant).toBe("solid");
    expect(solid?.className).toBe("ow-toggle ow-toggle--solid ow-toggle--lg mine");
  });

  test("is the primary Button's fill, text, and edge while on, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [off, on] = await mount(
      <>
        <Toggle variant="solid">Off</Toggle>
        <Toggle variant="solid" defaultPressed>
          On
        </Toggle>
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
      expect(onStyle.backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
      expect(onStyle.backgroundImage).toBe("none");
      expect(onStyle.color).toBe(resolve("color", "var(--ow-on-accent)"));
      expect(onStyle.boxShadow).toBe(resolve("box-shadow", "var(--ow-primary-shadow)"));
    }
  });

  test("hovered, it lays 5% black over the fill when on and is soft's when off", async () => {
    const [off, on] = await mount(
      <>
        <Toggle variant="solid">Off</Toggle>
        <Toggle variant="solid" defaultPressed>
          On
        </Toggle>
      </>,
    );
    if (!off || !on) throw new Error("no toggles");
    await userEvent.hover(off);
    expect(getComputedStyle(off).backgroundColor).toBe(resolve("color", "var(--ow-hover)"));
    expect(getComputedStyle(off).color).toBe(resolve("color", "var(--ow-fg)"));
    await userEvent.hover(on);
    const style = getComputedStyle(on);
    expect(style.backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
    expect(style.backgroundImage).toBe(resolve("background-image", SOLID_HOVER));
    expect(style.color).toBe(resolve("color", "var(--ow-on-accent)"));
    expect(style.boxShadow).toBe(resolve("box-shadow", "var(--ow-primary-shadow)"));
  });

  test("hovered, a solid toggle's label keeps 4.5:1 on the darkened fill in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [off, on] = await mount(
      <>
        <Toggle variant="solid">Off</Toggle>
        <Toggle variant="solid" defaultPressed>
          On
        </Toggle>
      </>,
    );
    if (!off || !on) throw new Error("no toggles");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await pointerAway();
      const resting = composite(getComputedStyle(on).backgroundColor);
      await userEvent.hover(on);
      const style = getComputedStyle(on);
      expect(style.backgroundImage, theme).toBe(resolve("background-image", SOLID_HOVER));
      const [fill, text] = [style.backgroundColor, style.color];
      const hovered = composite(fill, resolve("color", SOLID_HOVER_TINT));
      on.focus();
      await userEvent.keyboard("{Space>}");
      await wait(150);
      const held = composite(getComputedStyle(on).backgroundColor);
      await userEvent.keyboard("{/Space}");
      // The key press turned it off; turn it back on.
      await userEvent.click(on);
      await pointerAway();
      const ratios = checkSolidHover("toggle solid", theme, {
        resting,
        hovered,
        held,
        text: composite(text),
        before: composite(fill, resolve("color", "var(--ow-hover)")),
      });
      console.info(`solid hover toggle ${theme}: ${ratios.map((r) => r.toFixed(2))} (now, before)`);
      // Off, the solid toggle keeps the soft tint.
      await userEvent.hover(off);
      expect(getComputedStyle(off).backgroundColor, theme).toBe(
        resolve("color", "var(--ow-hover)"),
      );
    }
  });

  test("held while on, it goes in to 0.97 on the fill with 10% black, and keeps its edge", async () => {
    const [off, on] = await mount(
      <>
        <Toggle variant="solid">Off</Toggle>
        <Toggle variant="solid" defaultPressed>
          On
        </Toggle>
      </>,
    );
    if (!off || !on) throw new Error("no toggles");
    await pointerAway();
    on.focus();
    await userEvent.keyboard("{Space>}");
    await wait(150);
    const held = getComputedStyle(on);
    expect(held.transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    expect(held.backgroundColor).toBe(resolve("color", SOLID_HELD));
    expect(held.backgroundImage).toBe("none");
    expect(held.color).toBe(resolve("color", "var(--ow-on-accent)"));
    expect(held.boxShadow).toBe(resolve("box-shadow", "var(--ow-primary-shadow)"));
    await userEvent.keyboard("{/Space}");
    expect(on.getAttribute("aria-pressed")).toBe("false");
    // Held while off it is soft's deepest tint, with accent text.
    off.focus();
    await userEvent.keyboard("{Space>}");
    await wait(150);
    expect(getComputedStyle(off).backgroundColor).toBe(resolve("color", HELD));
    expect(getComputedStyle(off).color).toBe(resolve("color", ON_FG));
    await userEvent.keyboard("{/Space}");
  });

  test("keeps the focus ring and dims when disabled, on or off", async () => {
    const [on, disabled] = await mount(
      <>
        <Toggle variant="solid" defaultPressed>
          On
        </Toggle>
        <Toggle variant="solid" defaultPressed disabled>
          Off
        </Toggle>
      </>,
    );
    if (!on || !disabled) throw new Error("no toggles");
    await userEvent.tab();
    expect(document.activeElement).toBe(on);
    expect(getComputedStyle(on).outlineColor).toBe(resolve("color", "var(--ow-focus)"));
    expect(getComputedStyle(on).outlineWidth).toBe("2px");
    expect(getComputedStyle(disabled).opacity).toBe("0.45");
    expect(getComputedStyle(disabled).backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
  });

  test("a theme token set on it changes it alone", async () => {
    const [custom, other] = await mount(
      <>
        <Toggle
          variant="solid"
          defaultPressed
          style={{ "--ow-accent": "rgb(255, 0, 0)" } as CSSProperties}
        >
          A
        </Toggle>
        <Toggle variant="solid" defaultPressed>
          B
        </Toggle>
      </>,
    );
    if (!custom || !other) throw new Error("no toggles");
    await pointerAway();
    expect(getComputedStyle(custom).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(other).backgroundColor).toBe(resolve("color", "var(--ow-accent)"));
  });

  test("reads: the label has 4.5:1 on the fill, and the fill 3:1 on the page, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const toggle = await one(
      <Toggle variant="solid" defaultPressed>
        On
      </Toggle>,
    );
    await pointerAway();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(toggle);
      const fill = composite(style.backgroundColor);
      const page = composite(getComputedStyle(document.body).backgroundColor);
      expect(contrast(composite(style.color), fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(fill, page)).toBeGreaterThanOrEqual(3);
    }
  });

  test("shows on as the system highlight in forced colors, also hovered and held", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const on = await one(
      <Toggle variant="solid" defaultPressed>
        On
      </Toggle>,
    );
    await commands.setForcedColors("active");
    const style = getComputedStyle(on);
    expect(style.backgroundColor).toBe(resolve("color", "Highlight"));
    expect(style.color).toBe(resolve("color", "HighlightText"));
    expect(style.boxShadow).toBe("none");
    await userEvent.hover(on);
    expect(getComputedStyle(on).backgroundColor).toBe(resolve("color", "Highlight"));
    expect(getComputedStyle(on).backgroundImage).toBe("none");
    expect(getComputedStyle(on).color).toBe(resolve("color", "HighlightText"));
  });

  test("under reduced motion a held press changes the material only", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const on = await one(
      <Toggle variant="solid" defaultPressed>
        On
      </Toggle>,
    );
    on.focus();
    await userEvent.keyboard("{Space>}");
    await wait(150);
    expect(getComputedStyle(on).transform).toBe("none");
    expect(getComputedStyle(on).backgroundColor).toBe(resolve("color", SOLID_HELD));
    await userEvent.keyboard("{/Space}");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Toggle variant="solid" startIcon={<Star />}>
          Star
        </Toggle>
        <Toggle variant="solid" defaultPressed startIcon={<Star />}>
          Starred
        </Toggle>
        <Toggle variant="solid" disabled defaultPressed>
          Disabled
        </Toggle>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });
});

test("every part has its data-slot", async () => {
  const screen = await render(<Toggle aria-label="T" startIcon={<i />} endIcon={<i />} />);
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual(["toggle", "toggle-icon", "toggle-icon"]);
});
