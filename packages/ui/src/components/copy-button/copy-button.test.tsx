import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { CopyButton, type CopyButtonProps } from "./index";

/** Replaces the Clipboard API for one test; `fail` makes it refuse. */
function clipboard({ fail = false, missing = false } = {}) {
  const writeText = vi.fn((_text: string) =>
    fail ? Promise.reject(new DOMException("Denied", "NotAllowedError")) : Promise.resolve(),
  );
  const own = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: missing ? undefined : { writeText },
  });
  onTestFinished(() => {
    if (own) Object.defineProperty(navigator, "clipboard", own);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  });
  return writeText;
}

// A press after a paint, as a visitor's would be: an icon never styled has nothing to leave from.
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function mount(props: Partial<CopyButtonProps> = {}) {
  const screen = await render(
    <div style={{ display: "flex", gap: 8 }}>
      <CopyButton value="pnpm add owsem-ui" {...props} />
    </div>,
  );
  await frame();
  await frame();
  const button = screen.container.querySelector<HTMLElement>(".ow-copy-button");
  const status = screen.container.querySelector<HTMLElement>('[role="status"]');
  if (!button || !status) throw new Error("not mounted");
  /** The icons on show, leaving ones left out. */
  const icons = () =>
    [...button.querySelectorAll(".ow-icon-morph__item:not([data-ending-style]) svg")].map((svg) =>
      svg.classList.contains("ow-copy-button__check") ? "check" : "copy",
    );
  return { screen, button, status, icons };
}

/** Resolves a value of `property` (e.g. a token) to its computed form. */
function resolve(property: string, value: string): string {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  document.body.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

const popup = () => document.querySelector<HTMLElement>(".ow-tooltip__popup");

/** The Tooltip's words on show while it is open, else null; the leaving word is hidden. */
const tip = () => {
  const el = popup();
  if (!el) return null;
  return el.querySelector(".ow-copy-button__tip-text[data-visible]")?.textContent ?? null;
};

const nameOf = (el: Element) =>
  el.getAttribute("aria-label") ??
  [...el.querySelectorAll(".ow-copy-button__label-text")]
    .filter((word) => getComputedStyle(word).visibility === "visible")
    .map((word) => word.textContent)
    .join("");

describe("Copy Button", () => {
  test("is a ghost Button with the copy icon, named Copy, and a quiet status region", async () => {
    const { button, status, icons } = await mount();
    expect(button.tagName).toBe("BUTTON");
    expect(button.className).toBe("ow-button ow-copy-button");
    expect(button.dataset.variant).toBe("ghost");
    expect(button.hasAttribute("data-icon-only")).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("Copy");
    expect(icons()).toEqual(["copy"]);
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(status.textContent).toBe("");
    expect(status.parentElement).toBe(button.parentElement);
    expect(button.contains(status)).toBe(false);
  });

  test("copies its value: the icon turns into a check, Copied is announced, and both go back", async () => {
    const writeText = clipboard();
    const onCopy = vi.fn();
    const { button, status, icons } = await mount({ timeout: 300, onCopy });
    await userEvent.click(button);
    expect(writeText).toHaveBeenCalledWith("pnpm add owsem-ui");
    await expect.poll(icons).toEqual(["check"]);
    expect(onCopy).toHaveBeenCalledWith("pnpm add owsem-ui");
    expect(button.hasAttribute("data-copied")).toBe(true);
    expect(status.textContent).toBe("Copied");
    // The name stays: the status says what happened.
    expect(button.getAttribute("aria-label")).toBe("Copy");
    await expect.poll(icons, { timeout: 1000 }).toEqual(["copy"]);
    expect(button.hasAttribute("data-copied")).toBe(false);
    expect(status.textContent).toBe("");
  });

  test("reads a function value at the moment of the click", async () => {
    const writeText = clipboard();
    let text = "first";
    const { button } = await mount({ value: () => text });
    text = "second";
    await userEvent.click(button);
    expect(writeText).toHaveBeenCalledWith("second");
  });

  test("while it shows Copied it is busy: aria-disabled, and a click does not copy again", async () => {
    const writeText = clipboard();
    const onCopy = vi.fn();
    const { button, icons } = await mount({ timeout: 400, onCopy });
    expect(button.hasAttribute("aria-disabled")).toBe(false);
    await userEvent.click(button);
    await expect.poll(icons).toEqual(["check"]);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    // Busy, not disabled: it keeps its focus and its look.
    expect(button.hasAttribute("data-disabled")).toBe(false);
    expect(document.activeElement).toBe(button);
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
    // The time does not start over: the icon comes back on the first copy's clock.
    await expect.poll(icons, { timeout: 1000 }).toEqual(["copy"]);
    expect(button.hasAttribute("aria-disabled")).toBe(false);
    await userEvent.click(button);
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  test("icon only, its Tooltip says Copy on hover and turns to Copied in place, then back while the pointer stays", async () => {
    clipboard();
    const { screen, button, icons } = await mount({ timeout: 400 });
    // The pointer may still rest where an earlier test left it.
    await userEvent.unhover(button);
    await expect.poll(tip, { timeout: 1000 }).toBeNull();
    await userEvent.hover(button);
    await expect.poll(tip, { timeout: 2000 }).toBe("Copy");
    // The Tooltip names nothing new: the button keeps its own name.
    expect(screen.getByRole("button", { name: "Copy" }).element()).toBe(button);
    const before = popup();
    await userEvent.click(button);
    await expect.poll(tip).toBe("Copied");
    await expect.poll(icons).toEqual(["check"]);
    // The same popup: it never closed on the press, and it stays open while copied.
    expect(popup()).toBe(before);
    expect(before?.hasAttribute("data-ending-style")).toBe(false);
    expect(before?.hasAttribute("data-open")).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(popup()).toBe(before);
    // The icon comes back: the words turn back in the same popup, as the pointer is still there.
    await expect.poll(icons, { timeout: 1000 }).toEqual(["copy"]);
    await expect.poll(tip, { timeout: 1000 }).toBe("Copy");
    expect(popup()).toBe(before);
  });

  test("the Tooltip holds both words, only the one on show is read, and it takes the popup's width", async () => {
    clipboard();
    const { button, icons } = await mount({ timeout: 400 });
    await userEvent.unhover(button);
    await userEvent.hover(button);
    await expect.poll(tip, { timeout: 2000 }).toBe("Copy");
    const words = () => [...document.querySelectorAll(".ow-copy-button__tip-text")];
    expect(words().map((word) => word.getAttribute("aria-hidden"))).toEqual([null, "true"]);
    await userEvent.click(button);
    await expect.poll(icons).toEqual(["check"]);
    expect(words().map((word) => word.getAttribute("aria-hidden"))).toEqual(["true", null]);
    // The cell is sized to the word on show, so the popup eases to it.
    const tipEl = document.querySelector<HTMLElement>(".ow-copy-button__tip");
    const shown = document.querySelector(".ow-copy-button__tip-text[data-visible]");
    expect(Number.parseFloat(tipEl?.style.inlineSize ?? "")).toBeCloseTo(
      shown?.getBoundingClientRect().width ?? 0,
      0,
    );
  });

  test("each word sits centered in the popup, the longer one too, in both directions", async () => {
    clipboard();
    const { button, icons } = await mount({
      timeout: 500,
      labels: { copy: "Salin", copied: "Tersalin" },
    });
    await userEvent.unhover(button);
    await userEvent.hover(button);
    await expect.poll(tip, { timeout: 2000 }).toBe("Salin");
    const gaps = () => {
      const pop = popup()?.getBoundingClientRect();
      const word = document
        .querySelector(".ow-copy-button__tip-text[data-visible]")
        ?.getBoundingClientRect();
      if (!pop || !word) throw new Error("missing");
      return [word.left - pop.left, pop.right - word.right];
    };
    const even = () => {
      const [left, right] = gaps();
      expect(Math.abs((left as number) - (right as number))).toBeLessThanOrEqual(0.5);
    };
    // Let the width ease settle before measuring.
    const rest = () => new Promise((resolve) => setTimeout(resolve, 400));
    await rest();
    even();
    await userEvent.click(button);
    await expect.poll(tip).toBe("Tersalin");
    await rest();
    even();
    await expect.poll(icons, { timeout: 1500 }).toEqual(["copy"]);
    await expect.poll(tip, { timeout: 1000 }).toBe("Salin");
    await rest();
    even();
  });

  test("the Tooltip still closes when the pointer leaves", async () => {
    clipboard();
    const { button } = await mount({ timeout: 300 });
    await userEvent.hover(button);
    await expect.poll(tip, { timeout: 2000 }).toBe("Copy");
    await userEvent.unhover(button);
    await expect.poll(tip, { timeout: 1500 }).toBeNull();
  });

  test("from the keyboard, the Tooltip shows Copied too", async () => {
    clipboard();
    const { button } = await mount({ timeout: 300 });
    button.focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(tip).toBe("Copied");
    await expect.poll(tip, { timeout: 1500 }).toBeNull();
  });

  test("a refused copy calls onError and shows nothing copied", async () => {
    clipboard({ fail: true });
    const onCopy = vi.fn();
    const onError = vi.fn();
    const { button, status, icons } = await mount({ onCopy, onError });
    await userEvent.click(button);
    await expect.poll(() => onError.mock.calls.length).toBe(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(DOMException);
    expect(onCopy).not.toHaveBeenCalled();
    expect(icons()).toEqual(["copy"]);
    expect(status.textContent).toBe("");
  });

  test("without the Clipboard API (not a secure context), it fails the same way", async () => {
    clipboard({ missing: true });
    const onError = vi.fn();
    const { button } = await mount({ onError });
    await userEvent.click(button);
    await expect.poll(() => onError.mock.calls.length).toBe(1);
    expect(button.hasAttribute("data-copied")).toBe(false);
  });

  test("onClick runs first, and preventDefault keeps it from copying", async () => {
    const writeText = clipboard();
    const { button } = await mount({ onClick: (event) => event.preventDefault() });
    await userEvent.click(button);
    expect(writeText).not.toHaveBeenCalled();
  });

  test("with a label, both words hold the width, and the one on show names it", async () => {
    clipboard();
    const { button, icons } = await mount({
      showLabel: true,
      labels: { copy: "Salin", copied: "Tersalin" },
    });
    expect(button.hasAttribute("aria-label")).toBe(false);
    expect(button.hasAttribute("data-icon-only")).toBe(false);
    expect(nameOf(button)).toBe("Salin");
    const width = button.offsetWidth;
    await userEvent.click(button);
    await expect.poll(icons).toEqual(["check"]);
    expect(nameOf(button)).toBe("Tersalin");
    expect(button.offsetWidth).toBe(width);
    // The words are on show, so no Tooltip repeats them.
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(tip()).toBeNull();
  });

  test("duration sets the length of the icon's swap and the check's draw", async () => {
    clipboard();
    const { button } = await mount({ duration: "300ms" });
    const morph = button.querySelector(".ow-icon-morph") as HTMLElement;
    expect(button.style.getPropertyValue("--_duration")).toBe("300ms");
    expect(morph.style.getPropertyValue("--_duration")).toBe("300ms");
    await userEvent.click(button);
    await expect.poll(() => button.querySelector(".ow-copy-button__check path")).toBeTruthy();
    const path = button.querySelector(".ow-copy-button__check path") as Element;
    expect(getComputedStyle(path).animationDuration).toBe("0.3s");
    // Without it, both keep the settle spring's.
    const plain = await mount();
    expect(plain.button.style.getPropertyValue("--_duration")).toBe("");
  });

  test("passes the Button's props, className, and ref through", async () => {
    const ref = createRef<HTMLElement>();
    const screen = await render(
      <CopyButton
        ref={ref}
        value="x"
        variant="outline"
        size="sm"
        className="mine"
        aria-label="Copy the command"
        disabled
      />,
    );
    const button = screen.container.querySelector("button");
    expect(ref.current).toBe(button);
    expect(button?.className).toBe("ow-button ow-copy-button mine");
    expect(button?.dataset.variant).toBe("outline");
    expect(button?.dataset.size).toBe("sm");
    expect(button?.getAttribute("aria-label")).toBe("Copy the command");
    expect(button?.disabled).toBe(true);
  });

  test("renders on the server with the copy icon, and nothing copied", () => {
    const html = renderToString(<CopyButton value="x" />);
    expect(html).toContain('aria-label="Copy"');
    expect(html).not.toContain("ow-copy-button__check");
    expect(html).not.toContain("data-copied");
  });

  test("the check draws its stroke in as it enters, on the settle spring", async () => {
    clipboard();
    const { button } = await mount();
    await userEvent.click(button);
    await expect.poll(() => button.querySelector(".ow-copy-button__check path")).toBeTruthy();
    const path = button.querySelector(".ow-copy-button__check path") as SVGPathElement;
    expect(path.getAttribute("pathLength")).toBe("1");
    const draw = path.getAnimations().find((a) => a instanceof CSSAnimation) as CSSAnimation;
    expect(draw.animationName).toBe("ow-copy-button-draw");
    const style = getComputedStyle(path);
    expect(style.animationDuration).toBe(
      resolve("animation-duration", "var(--ow-spring-settle-duration)"),
    );
    expect(style.animationTimingFunction).toBe(
      resolve("animation-timing-function", "var(--ow-spring-settle)"),
    );
    // From its end, the short stroke, to its start.
    const frames = (draw.effect as KeyframeEffect).getKeyframes();
    expect([frames[0]?.strokeDashoffset, frames.at(-1)?.strokeDashoffset]).toEqual(["-1px", "0px"]);
  });

  test("with reduced motion, the check is just there (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    clipboard();
    const { button, icons } = await mount();
    await userEvent.click(button);
    await expect.poll(icons).toEqual(["check"]);
    const path = button.querySelector(".ow-copy-button__check path") as Element;
    expect(path.getAnimations()).toEqual([]);
  });

  test("has no axe violations, before and after a copy, with a label too", async () => {
    clipboard();
    const check = async (container: Element) => {
      const { violations, contrastUnknown } = await axeReport(container);
      expect(violations).toEqual([]);
      // axe cannot see the Button's face (a pseudo-element); Button's tests check its contrast.
      for (const target of contrastUnknown) {
        expect(container.querySelector(target)?.closest(".ow-button")).not.toBeNull();
      }
    };
    const { screen, button } = await mount();
    await check(screen.container);
    await userEvent.click(button);
    await check(screen.container);
    const labelled = await mount({ showLabel: true, variant: "outline" });
    await check(labelled.screen.container);
  });

  test("runs no rAF and no animations when idle, after a copy too", async () => {
    clipboard();
    const { button, icons } = await mount({ timeout: 300 });
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(button);
    await expect.poll(icons).toEqual(["check"]);
    await expect.poll(icons, { timeout: 1000 }).toEqual(["copy"]);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
