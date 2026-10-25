import { describe, expect, onTestFinished, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { Button, IconButton } from "../button";
import { CopyButton } from "./index";

function clipboard() {
  const own = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: () => Promise.resolve() },
  });
  onTestFinished(() => {
    if (own) Object.defineProperty(navigator, "clipboard", own);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  });
}

// A Lucide-sized icon, as a Button would hold one.
const Glyph = () => (
  <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" />
  </svg>
);

const box = (el: Element | null | undefined) => {
  if (!el) throw new Error("missing");
  return el.getBoundingClientRect();
};
const same = (a: DOMRect, b: DOMRect) =>
  Math.abs(a.width - b.width) <= TOL && Math.abs(a.height - b.height) <= TOL;

describe.each(["sm", "md", "lg"] as const)("Copy Button geometry, %s", (size) => {
  test("icon only, it is an IconButton of that size, icon and all", async () => {
    const screen = await render(
      <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
        <CopyButton value="x" size={size} />
        <IconButton size={size} aria-label="Copy" icon={<Glyph />} />
      </div>,
    );
    const [copy, plain] = [...screen.container.querySelectorAll(".ow-button")];
    expect(same(box(copy), box(plain))).toBe(true);
    expect(same(box(copy?.querySelector("svg")), box(plain?.querySelector("svg")))).toBe(true);
  });

  test("with a label, it keeps its width when Copied shows, as wide as the longer word", async () => {
    clipboard();
    const screen = await render(
      <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
        <CopyButton value="x" size={size} showLabel variant="outline" />
        <Button size={size} variant="outline" startIcon={<Glyph />}>
          Copied
        </Button>
      </div>,
    );
    const [copy, longer] = [...screen.container.querySelectorAll<HTMLElement>(".ow-button")];
    if (!copy || !longer) throw new Error("missing");
    expect(same(box(copy), box(longer))).toBe(true);
    await userEvent.click(copy);
    await expect.poll(() => copy.hasAttribute("data-copied")).toBe(true);
    // Layout sizes: the press scales the box for a moment.
    expect(copy.offsetWidth).toBe(longer.offsetWidth);
    expect(copy.offsetHeight).toBe(longer.offsetHeight);
  });
});
