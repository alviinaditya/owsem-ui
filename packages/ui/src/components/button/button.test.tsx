import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Button, ButtonIcon, buttonStyles, IconButton } from "./index";

const root = document.documentElement;

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M12 5v14" />
  </svg>
);

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(ui);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-button")];
}

async function one(ui: ReactNode): Promise<HTMLElement> {
  const [button] = await mount(ui);
  if (!button) throw new Error("no button");
  return button;
}

/** Resolves a color (e.g. `var(--ow-raised-bg)`) to its computed rgb() inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Resolves a box-shadow token the way a box-shadow property computes it. */
function resolveShadow(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.boxShadow = value;
  scope.append(probe);
  const shadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  return shadow;
}

const face = (button: Element) => getComputedStyle(button, "::before");
const scaleOf = (transform: string) =>
  transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;

const pointer = (type: string, target: Element, x: number, y: number) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );

/** Every variant once, plus soft, icon-only, loading, disabled, and a styled link. */
function Gallery() {
  return (
    <main style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 12 }}>
      {(["primary", "secondary", "outline", "ghost", "link", "destructive"] as const).map(
        (variant) => (
          <Button key={variant} variant={variant} startIcon={<Plus />}>
            {variant}
          </Button>
        ),
      )}
      {(["primary", "secondary", "destructive"] as const).map((variant) => (
        <Button key={variant} variant={variant} soft size="sm">
          Soft {variant}
        </Button>
      ))}
      <IconButton icon={<Plus />} aria-label="Add" size="sm" />
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
      <a href="#next" {...buttonStyles({ variant: "outline" })}>
        Next page
      </a>
    </main>
  );
}

describe("Button", () => {
  test("renders Base UI's button, with its variant and size", async () => {
    const button = await one(<Button>Save</Button>);
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.dataset.variant).toBe("primary");
    expect(button.dataset.size).toBe("md");
    expect(button.textContent).toBe("Save");
    // The ripple layer is decorative.
    expect(button.querySelector(".ow-button__layer")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const ref = createRef<HTMLElement>();
    const [byString, byFunction, rendered] = await mount(
      <>
        <Button ref={ref} className="mine" style={{ marginBlock: "3px" }}>
          A
        </Button>
        <Button disabled className={(state) => (state.disabled ? "is-off" : "is-on")}>
          B
        </Button>
        <Button render={<span />} nativeButton={false}>
          C
        </Button>
      </>,
    );
    expect(ref.current).toBe(byString);
    expect(byString?.className).toBe("ow-button mine");
    expect(byString?.style.marginBlock).toBe("3px");
    expect(byFunction?.className).toBe("ow-button is-off");
    expect(rendered?.tagName).toBe("SPAN");
    expect(rendered?.getAttribute("role")).toBe("button");
  });

  test("clicks, and ignores clicks while disabled", async () => {
    const onClick = vi.fn();
    const [on, off] = await mount(
      <>
        <Button onClick={onClick}>On</Button>
        <Button onClick={onClick} disabled>
          Off
        </Button>
      </>,
    );
    if (!on || !off) throw new Error("no buttons");
    await userEvent.click(on);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(off.hasAttribute("disabled")).toBe(true);
    expect(off.hasAttribute("data-disabled")).toBe(true);
    off.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("loading ignores presses but keeps focus, and says it is busy (FR-23)", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <Button onClick={onClick} loading={false} startIcon={<Plus />}>
        Save
      </Button>,
    );
    const button = screen.container.querySelector<HTMLElement>(".ow-button");
    if (!button) throw new Error("no button");
    button.focus();
    await screen.rerender(
      <Button onClick={onClick} loading startIcon={<Plus />}>
        Save
      </Button>,
    );
    expect(document.activeElement).toBe(button);
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.hasAttribute("data-loading")).toBe(true);
    // Playwright skips aria-disabled elements unless forced.
    await userEvent.click(button, { force: true });
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).not.toHaveBeenCalled();
    // The spinner takes the start icon's place; the label stays readable.
    const spinner = button.querySelector('[data-side="start"] .ow-button__spinner');
    expect(spinner).not.toBeNull();
    expect(button.textContent).toBe("Save");
    await screen.rerender(
      <Button onClick={onClick} loading={false} startIcon={<Plus />}>
        Save
      </Button>,
    );
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.hasAttribute("aria-busy")).toBe(false);
  });

  test("without a start icon, the spinner is centered and the content keeps its box", async () => {
    const [plain, never] = await mount(
      <>
        <Button loading endIcon={<Plus />}>
          Save
        </Button>
        <Button>Never loads</Button>
      </>,
    );
    if (!plain || !never) throw new Error("no buttons");
    const spinner = plain.querySelector(":scope > .ow-button__spinner");
    expect(spinner).not.toBeNull();
    const label = plain.querySelector(".ow-button__label");
    await expect.poll(() => label && getComputedStyle(label).opacity).toBe("0");
    expect(label?.getBoundingClientRect().width).toBeGreaterThan(0);
    // A button that never loads renders no spinner.
    expect(never.querySelector(".ow-button__spinner")).toBeNull();
  });

  test("IconButton is square, ghost by default, and named by aria-label", async () => {
    const button = await one(<IconButton icon={<Plus />} aria-label="Add" />);
    expect(button.getAttribute("aria-label")).toBe("Add");
    expect(button.dataset.variant).toBe("ghost");
    expect(button.hasAttribute("data-icon-only")).toBe(true);
    expect(button.querySelector(".ow-button__label")).toBeNull();
    expect(button.querySelector(".ow-button__icon")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("buttonStyles() styles a link, which keeps its own semantics", async () => {
    const screen = await render(
      <a href="#next" {...buttonStyles({ variant: "outline", size: "sm", className: "mine" })}>
        Next
        <ButtonIcon side="end">
          <Plus />
        </ButtonIcon>
      </a>,
    );
    const link = screen.container.querySelector("a");
    expect(link?.className).toBe("ow-button mine");
    expect(link?.dataset.variant).toBe("outline");
    expect(link?.dataset.size).toBe("sm");
    expect(link?.getAttribute("role")).toBeNull();
    expect(link && getComputedStyle(link).display).toBe("inline-flex");
    expect(link?.querySelector('.ow-button__icon[data-side="end"]')).not.toBeNull();
  });

  test("paints each variant from the materials, in light and dark (DP-7)", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const [primary, secondary, outline, ghost, destructive, soft] = await mount(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="primary" soft>
          Soft
        </Button>
      </>,
    );
    if (!primary || !secondary || !outline || !ghost || !destructive || !soft) {
      throw new Error("no buttons");
    }
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(face(secondary).backgroundColor).toBe(resolveColor("var(--ow-raised-bg)"));
      expect(face(secondary).boxShadow).toBe(resolveShadow("var(--ow-raised-shadow)"));
      expect(face(primary).backgroundColor).toBe(resolveColor("var(--ow-accent)"));
      expect(face(primary).boxShadow).toBe(resolveShadow("var(--ow-primary-shadow)"));
      expect(getComputedStyle(primary).color).toBe(resolveColor("var(--ow-on-accent)"));
      // The critical fill with the primary's crisp edges, and the page background as its text.
      expect(face(destructive).backgroundColor).toBe(resolveColor("var(--ow-critical)"));
      expect(face(destructive).boxShadow).toBe(resolveShadow("var(--ow-primary-shadow)"));
      expect(getComputedStyle(destructive).color).toBe(resolveColor("var(--ow-bg)"));
      expect(face(outline).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(face(outline).boxShadow).toBe(resolveShadow("inset 0 0 0 1px var(--ow-edge)"));
      expect(face(ghost).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(face(ghost).boxShadow).toBe("none");
      expect(getComputedStyle(ghost).color).toBe(resolveColor("var(--ow-fg)"));
      // No socket around any variant.
      for (const button of [primary, secondary, outline, ghost, destructive, soft]) {
        expect(getComputedStyle(button, "::after").content).toBe("none");
      }
    }
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const [button, other] = await mount(
      <>
        <Button
          variant="primary"
          style={
            {
              "--ow-accent": "rgb(255, 0, 0)",
              "--ow-on-accent": "rgb(0, 0, 255)",
              "--ow-radius": "4px",
            } as CSSProperties
          }
        >
          Save
        </Button>
        <Button variant="primary">Other</Button>
      </>,
    );
    if (!button || !other) throw new Error("no buttons");
    expect(face(button).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(getComputedStyle(button).color).toBe("rgb(0, 0, 255)");
    expect(getComputedStyle(button).borderTopLeftRadius).toBe("4px");
    expect(face(button).borderTopLeftRadius).toBe("4px");
    expect(face(other).backgroundColor).toBe(resolveColor("var(--ow-accent)"));
  });

  test("hover tints the face with --ow-hover, and leaves its edges alone", async () => {
    const screen = await render(
      <>
        <Button variant="secondary">Secondary</Button>
        <p>Away</p>
      </>,
    );
    const button = screen.container.querySelector<HTMLElement>(".ow-button");
    if (!button) throw new Error("no button");
    // The pointer may still rest where an earlier test clicked.
    await userEvent.hover(screen.getByText("Away"));
    expect(face(button).backgroundImage).toContain("rgba(0, 0, 0, 0)");
    await userEvent.hover(button);
    expect(face(button).backgroundImage).toContain(resolveColor("var(--ow-hover)"));
    expect(face(button).boxShadow).toBe(resolveShadow("var(--ow-raised-shadow)"));
    await userEvent.unhover(button);
  });

  test("a press scales the button into the pressed material (DP-4)", async () => {
    const button = await one(<Button variant="secondary">Press</Button>);
    const box = button.getBoundingClientRect();
    pointer("pointerdown", button, box.left + 10, box.top + 10);
    expect(button.hasAttribute("data-held")).toBe(true);
    expect(face(button).backgroundColor).toBe(resolveColor("var(--ow-pressed-bg)"));
    expect(face(button).boxShadow).toBe(resolveShadow("var(--ow-pressed-shadow)"));
    // In within 90 ms.
    expect(getComputedStyle(button).transitionDuration).toBe("0.09s");
    await expect.poll(() => scaleOf(getComputedStyle(button).transform)).toBeCloseTo(0.97, 3);
    pointer("pointerup", button, box.left + 10, box.top + 10);
    expect(button.hasAttribute("data-held")).toBe(false);
    // Released with the settle spring and its duration.
    const style = getComputedStyle(button);
    expect(style.transitionDuration).toBe("1.03s");
    expect(style.transitionTimingFunction).toContain("linear(");
  });

  test("held down, ghost takes the pressed pair, and solid fills keep their edges", async () => {
    const [ghost, outline, primary, destructive] = await mount(
      <>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="destructive">Delete</Button>
      </>,
    );
    if (!ghost || !outline || !primary || !destructive) throw new Error("no buttons");
    for (const button of [ghost, outline, primary, destructive]) {
      const box = button.getBoundingClientRect();
      pointer("pointerdown", button, box.left + 5, box.top + 5);
    }
    expect(face(ghost).backgroundColor).toBe(resolveColor("var(--ow-pressed-bg)"));
    expect(face(ghost).boxShadow).toBe(resolveShadow("var(--ow-pressed-shadow)"));
    // Outline keeps its line over the pressed fill.
    expect(face(outline).backgroundColor).toBe(resolveColor("var(--ow-pressed-bg)"));
    expect(face(outline).boxShadow).toBe(resolveShadow("inset 0 0 0 1px var(--ow-edge)"));
    // Solid fills darken a little.
    const darker = (fill: string) => resolveColor(`color-mix(in oklab, ${fill}, black 10%)`);
    expect(face(primary).backgroundColor).toBe(darker("var(--ow-accent)"));
    expect(face(primary).boxShadow).toBe(resolveShadow("var(--ow-primary-shadow)"));
    expect(face(destructive).backgroundColor).toBe(darker("var(--ow-critical)"));
    expect(face(destructive).boxShadow).toBe(resolveShadow("var(--ow-primary-shadow)"));
    for (const button of [ghost, outline, primary, destructive]) {
      const box = button.getBoundingClientRect();
      pointer("pointerup", button, box.left + 5, box.top + 5);
    }
  });

  test("ripples from the press point, then fades on release (Tactile)", async () => {
    const button = await one(<Button variant="secondary">Ripple</Button>);
    const ripple = button.querySelector<HTMLElement>(".ow-button__ripple");
    if (!ripple) throw new Error("no ripple");
    const box = button.getBoundingClientRect();
    pointer("pointerdown", button, box.left + 12, box.top + 8);
    expect(ripple.dataset.state).toBe("on");
    expect(Number.parseFloat(ripple.style.getPropertyValue("--_x"))).toBeCloseTo(12, 0);
    expect(Number.parseFloat(ripple.style.getPropertyValue("--_y"))).toBeCloseTo(8, 0);
    // Large enough to reach the farthest corner from the press point.
    const far = Math.hypot(box.width - 12, box.height - 8);
    expect(Number.parseFloat(ripple.style.getPropertyValue("--_d"))).toBeCloseTo(2 * far, 0);
    const moving = ripple.getAnimations().map((a) => (a as CSSTransition).transitionProperty);
    expect(moving.sort()).toEqual(["opacity", "transform"]);
    pointer("pointerup", button, box.left + 12, box.top + 8);
    expect(ripple.dataset.state).toBe("off");
    await expect.poll(() => getComputedStyle(ripple).opacity).toBe("0");
  });

  test("links neither ripple nor scale; they dim and underline", async () => {
    const button = await one(<Button variant="link">Docs</Button>);
    expect(button.querySelector(".ow-button__ripple")).toBeNull();
    expect(face(button).content).toBe("none");
    await userEvent.hover(button);
    expect(getComputedStyle(button).textDecorationColor).toBe(getComputedStyle(button).color);
    await userEvent.unhover(button);
  });

  test("draws a focus ring 2px outside the face (FR-13)", async () => {
    const [primary, ghost] = await mount(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="ghost">Ghost</Button>
      </>,
    );
    if (!primary || !ghost) throw new Error("no buttons");
    await userEvent.tab();
    expect(document.activeElement).toBe(primary);
    let style = getComputedStyle(primary);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineColor).toBe(resolveColor("var(--ow-focus)"));
    expect(style.outlineOffset).toBe("2px");
    await userEvent.tab();
    style = getComputedStyle(ghost);
    expect(style.outlineOffset).toBe("2px");
  });

  test("puts the start icon at the start in RTL (FR-16)", async () => {
    const button = await one(
      <div dir="rtl">
        <Button startIcon={<Plus />}>Save</Button>
      </div>,
    );
    const icon = button.querySelector(".ow-button__icon");
    const label = button.querySelector(".ow-button__label");
    if (!icon || !label) throw new Error("no parts");
    expect(icon.getBoundingClientRect().left).toBeGreaterThan(label.getBoundingClientRect().left);
    expect(Number.parseFloat(getComputedStyle(icon).marginRight)).toBeLessThan(0);
  });

  test("keeps still under reduced motion: material only, no ripple (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const button = await one(
      <Button variant="secondary" loading startIcon={<Plus />}>
        Save
      </Button>,
    );
    const spinner = button.querySelector(".ow-button__spinner svg");
    expect(spinner && getComputedStyle(spinner).animationName).toBe("ow-button-pulse");
    const still = await one(<Button variant="secondary">Press</Button>);
    const box = still.getBoundingClientRect();
    pointer("pointerdown", still, box.left + 5, box.top + 5);
    expect(face(still).backgroundColor).toBe(resolveColor("var(--ow-pressed-bg)"));
    expect(getComputedStyle(still).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    const ripple = still.querySelector(".ow-button__ripple");
    expect(ripple && getComputedStyle(ripple).display).toBe("none");
    pointer("pointerup", still, box.left + 5, box.top + 5);
  });

  test("stays visible in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const button = await one(<Button variant="secondary">Save</Button>);
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const style = getComputedStyle(button);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.outlineColor).not.toBe(getComputedStyle(document.body).backgroundColor);
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    expect(getComputedStyle(button).outlineColor).toBe(resolveColor("Highlight"));
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(<Gallery />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const { violations, contrastUnknown } = await axeReport(screen.container);
      expect(violations).toEqual([]);
      // axe cannot see the face (a pseudo-element); the next test checks those labels itself.
      for (const target of contrastUnknown) {
        expect(document.querySelector(target)?.closest(".ow-button")).not.toBeNull();
      }
    }
  });

  test("labels keep 4.5:1 on their face, in light and dark (FR-12)", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const buttons = await mount(<Gallery />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = getComputedStyle(document.body).backgroundColor;
      for (const button of buttons) {
        if (button.hasAttribute("data-disabled")) continue;
        const surface = composite(page, face(button).backgroundColor);
        const text = composite(page, getComputedStyle(button).color);
        expect
          .soft(contrast(text, surface), `${theme} ${button.textContent}`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test("runs no rAF and no animations when idle, after a press too", async () => {
    const button = await one(<Button variant="secondary">Idle</Button>);
    const box = button.getBoundingClientRect();
    pointer("pointerdown", button, box.left + 5, box.top + 5);
    pointer("pointerup", button, box.left + 5, box.top + 5);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
