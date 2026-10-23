import type { CSSProperties, ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, rect, TOL, usedRadius } from "../../../test/geometry.ts";
import { Button, type ButtonSize, type ButtonVariant, IconButton } from "./index";

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M12 5v14" />
  </svg>
);

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
];
// FR-11: font size and height per size, at line-height 1.25.
const SIZES: [ButtonSize, number, number][] = [
  ["sm", 13, 29.25],
  ["md", 14, 38.5],
  ["lg", 16, 48],
];

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(<div style={{ display: "flex", gap: 12, padding: 12 }}>{ui}</div>);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-button")];
}

const icon = (button: Element, side: "start" | "end") => {
  const el = button.querySelector(`.ow-button__icon[data-side="${side}"]`);
  if (!el) throw new Error(`no ${side} icon`);
  return el;
};

describe("Button geometry", () => {
  test.each(SIZES)("%s: every variant is 2 × --py + 1lh tall (FR-9, FR-11)", async (size, _, h) => {
    const buttons = await mount(
      <>
        {VARIANTS.map((variant) => (
          <Button key={variant} variant={variant} size={size} startIcon={<Plus />}>
            {variant}
          </Button>
        ))}
        <Button size={size} soft>
          Soft
        </Button>
        <Button size={size}>Text only</Button>
        <IconButton size={size} icon={<Plus />} aria-label="Add" />
      </>,
    );
    for (const button of buttons) {
      expect(Math.abs(rect(button).height - h), button.textContent ?? "").toBeLessThanOrEqual(TOL);
    }
  });

  test.each(SIZES)(
    "%s: icons are font + 2px, as far from the edge as from the top (FR-10)",
    async (size, font) => {
      const [button] = await mount(
        <Button size={size} startIcon={<Plus />} endIcon={<Plus />}>
          Next
        </Button>,
      );
      if (!button) throw new Error("no button");
      for (const side of ["start", "end"] as const) {
        const box = rect(icon(button, side));
        expect(box.width).toBeCloseTo(font + 2, 1);
        expect(box.height).toBeCloseTo(font + 2, 1);
        const gap = insets(button, icon(button, side));
        expect(Math.abs(gap.top - gap.bottom)).toBeLessThanOrEqual(TOL);
        const edge = side === "start" ? gap.left : gap.right;
        expect(Math.abs(edge - gap.top), `${side} edge`).toBeLessThanOrEqual(TOL);
      }
    },
  );

  test.each(SIZES)(
    "%s: an icon-only button is square, as tall as the others (FR-10a)",
    async (size, _, h) => {
      const [button] = await mount(<IconButton size={size} icon={<Plus />} aria-label="Add" />);
      if (!button) throw new Error("no button");
      const box = rect(button);
      expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(box.height - h)).toBeLessThanOrEqual(TOL);
      const gap = insets(button, icon(button, "start"));
      for (const side of [gap.right, gap.bottom, gap.left]) {
        expect(Math.abs(side - gap.top)).toBeLessThanOrEqual(TOL);
      }
    },
  );

  test("a smaller --py never makes a target under 24px (FR-14)", async () => {
    const buttons = await mount(
      <>
        <Button size="sm" style={{ "--py": "0px" } as CSSProperties}>
          Tight
        </Button>
        <IconButton
          size="sm"
          icon={<Plus />}
          aria-label="Add"
          style={{ "--py": "0px" } as CSSProperties}
        />
      </>,
    );
    for (const button of buttons) {
      const box = rect(button);
      expect(box.height).toBeGreaterThanOrEqual(24 - TOL);
      expect(box.width).toBeGreaterThanOrEqual(24 - TOL);
    }
  });

  test("the face fills the button exactly, with nothing around it", async () => {
    const buttons = await mount(
      VARIANTS.filter((variant) => variant !== "link").map((variant) => (
        <Button key={variant} variant={variant}>
          Save
        </Button>
      )),
    );
    for (const button of buttons) {
      const gap = insets(button, { el: button, pseudo: "::before" });
      for (const side of Object.values(gap)) expect(side).toBeCloseTo(0, 1);
      expect(usedRadius({ el: button, pseudo: "::before" })).toBeCloseTo(usedRadius(button), 1);
    }
  });

  test("loading keeps the width, with the spinner in the icon's place or centered (FR-23)", async () => {
    const screen = await render(
      <div style={{ display: "flex", gap: 12 }}>
        <Button loading={false} startIcon={<Plus />}>
          Save changes
        </Button>
        <Button loading={false}>Save changes</Button>
        <IconButton loading={false} icon={<Plus />} aria-label="Add" />
      </div>,
    );
    const buttons = [...screen.container.querySelectorAll<HTMLElement>(".ow-button")];
    const before = buttons.map((b) => rect(b).width);
    await screen.rerender(
      <div style={{ display: "flex", gap: 12 }}>
        <Button loading startIcon={<Plus />}>
          Save changes
        </Button>
        <Button loading>Save changes</Button>
        <IconButton loading icon={<Plus />} aria-label="Add" />
      </div>,
    );
    expect(buttons.map((b) => rect(b).width)).toEqual(before);
    const [withIcon, centered] = buttons;
    if (!withIcon || !centered) throw new Error("no buttons");
    const spinner = withIcon.querySelector(".ow-button__spinner");
    if (!spinner) throw new Error("no spinner");
    // Once it has scaled in, the spinner fills the icon's cell exactly. Finish the scale-in rather
    // than wait for it: WebKit can hold transitions in a test frame.
    for (const animation of screen.container.getAnimations({ subtree: true })) {
      if (animation instanceof CSSTransition) animation.finish();
    }
    const slot = icon(withIcon, "start");
    expect(rect(spinner).width).toBeCloseTo(rect(slot).width, 1);
    for (const side of Object.values(insets(slot, spinner))) {
      expect(Math.abs(side)).toBeLessThanOrEqual(TOL);
    }
    const middle = centered.querySelector(":scope > .ow-button__spinner");
    if (!middle) throw new Error("no centered spinner");
    const gap = insets(centered, middle);
    expect(Math.abs(gap.left - gap.right)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(gap.top - gap.bottom)).toBeLessThanOrEqual(TOL);
  });
});
