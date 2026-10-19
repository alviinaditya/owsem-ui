import { type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
// Straight from the modules: core/index also pulls Base UI providers this test does not need.
import { ACTIVE_ATTR as GLIDE_ACTIVE_ATTR, type GlideOptions } from "./glide";
import { GlideHighlight, useGlide } from "./use-glide";

function List({
  options,
  disabled = [],
  onPick,
  row = false,
}: {
  options?: GlideOptions;
  disabled?: string[];
  onPick?: (label: string) => void;
  row?: boolean;
}) {
  const glide = useGlide<HTMLDivElement>(options);
  return (
    <div
      ref={glide.ref}
      data-testid="list"
      style={{
        display: "flex",
        flexDirection: row ? "row" : "column",
        gap: 12,
        padding: 8,
        width: row ? "max-content" : 200,
      }}
    >
      <GlideHighlight glide={glide} />
      {["One", "Two", "Three"].map((label) => (
        <button
          key={label}
          type="button"
          data-glide-item=""
          disabled={disabled.includes(label)}
          style={{ blockSize: 32, inlineSize: row ? 60 + label.length * 10 : undefined }}
          onClick={() => onPick?.(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const list = screen.container.querySelector<HTMLElement>('[data-testid="list"]');
  const highlight = screen.container.querySelector<HTMLElement>(".ow-glide");
  const items = [...screen.container.querySelectorAll<HTMLElement>("[data-glide-item]")];
  if (!list || !highlight) throw new Error("not mounted");
  return { screen, list, highlight, items };
}

const box = (el: Element) => el.getBoundingClientRect();
const lit = (items: HTMLElement[]) =>
  items.filter((item) => item.hasAttribute(GLIDE_ACTIVE_ATTR)).map((item) => item.textContent);

function pointer(target: Element, type: string, x: number, y: number, pointerType = "mouse") {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerType, button: 0 }),
  );
}

/** Moves the pointer to (x, y) inside `list`, as the browser would report it. */
const move = (list: Element, x: number, y: number) => pointer(list, "pointermove", x, y);

describe("Glide", () => {
  test("lights the item under the pointer and the nearest one in a gap", async () => {
    const { list, highlight, items } = await mount(<List />);
    const [one, two] = items.map(box);
    if (!one || !two) throw new Error("no items");
    const x = one.left + 20;

    move(list, x, one.top + 10);
    expect(lit(items)).toEqual(["One"]);
    expect(highlight.hasAttribute("data-visible")).toBe(true);

    // 3px into the 12px gap below One, then 3px above Two.
    move(list, x, one.bottom + 3);
    expect(lit(items)).toEqual(["One"]);
    move(list, x, two.top - 3);
    expect(lit(items)).toEqual(["Two"]);

    // The highlight covers Two: offset from the container's padding box, at Two's size.
    const frame = box(list);
    const style = highlight.style;
    expect(style.getPropertyValue("--_x")).toBe(`${two.left - frame.left}px`);
    expect(style.getPropertyValue("--_y")).toBe(`${two.top - frame.top}px`);
    expect(Number(style.getPropertyValue("--_sx"))).toBeCloseTo(1);
    expect(Number(style.getPropertyValue("--_sy"))).toBeCloseTo(1);
  });

  test("lands on the item inside a scaled ancestor", async () => {
    const { list, highlight, items } = await mount(
      <div style={{ transform: "scale(0.5)", transformOrigin: "0 0" }}>
        <List />
      </div>,
    );
    const two = items[1] && box(items[1]);
    if (!two) throw new Error("no items");
    move(list, two.left + 5, two.top + 5);
    // As drawn on screen, the highlight covers Two exactly.
    const h = box(highlight);
    expect([h.left, h.top, h.width, h.height]).toEqual(
      [two.left, two.top, two.width, two.height].map((v) => expect.closeTo(v, 0)),
    );
  });

  test("keeps the lit item through the middle of a gap (hysteresis)", async () => {
    const { list, items } = await mount(<List />);
    const [one, two] = items.map(box);
    if (!one || !two) throw new Error("no items");
    const middle = (one.bottom + two.top) / 2;
    move(list, one.left + 20, one.top + 10);
    // 1px past the middle, Two is 2px closer: not enough to switch.
    move(list, one.left + 20, middle + 1);
    expect(lit(items)).toEqual(["One"]);
    move(list, one.left + 20, middle + 2);
    expect(lit(items)).toEqual(["Two"]);
  });

  test("skips disabled items", async () => {
    const { list, items } = await mount(<List disabled={["Two"]} />);
    const two = items[1] && box(items[1]);
    if (!two) throw new Error("no items");
    move(list, two.left + 20, two.top + 10);
    expect(lit(items)).not.toContain("Two");
  });

  test("measures along the axis it is given", async () => {
    const { list, items } = await mount(<List row options={{ axis: "x" }} />);
    const two = items[1] && box(items[1]);
    if (!two) throw new Error("no items");
    // Below the row but within Two's columns: only x counts.
    move(list, two.left + 5, box(list).bottom - 1);
    expect(lit(items)).toEqual(["Two"]);
  });

  test("scales to items of other sizes and keeps the corners round", async () => {
    const { list, highlight, items } = await mount(<List row options={{ axis: "x" }} />);
    const [one, three] = [items[0], items[2]].map((item) => item && box(item));
    if (!one || !three) throw new Error("no items");
    move(list, one.left + 5, one.top + 5);
    move(list, three.left + 5, three.top + 5);
    const sx = Number(highlight.style.getPropertyValue("--_sx"));
    expect(sx).toBeCloseTo(three.width / one.width);
    const radius = Number.parseFloat(getComputedStyle(highlight).borderTopLeftRadius);
    expect(radius * sx).toBeCloseTo(8);
  });

  test("forwards a click in a gap to the lit item, without moving focus", async () => {
    const picked: string[] = [];
    const { list, items } = await mount(<List onPick={(label) => picked.push(label)} />);
    const [one, two] = items.map(box);
    if (!one || !two) throw new Error("no items");
    const outside = document.createElement("input");
    document.body.append(outside);
    onTestFinished(() => outside.remove());
    outside.focus();

    const y = one.bottom + 3;
    move(list, one.left + 20, y);
    pointer(list, "pointerdown", one.left + 20, y);
    list.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: one.left + 20, clientY: y }),
    );
    expect(picked).toEqual(["One"]);
    expect(document.activeElement).toBe(outside);
  });

  test("does not forward clicks beyond gapClick.maxDistance, or with gapClick off", async () => {
    const picked: string[] = [];
    const { list, items } = await mount(
      <List options={{ gapClick: { maxDistance: 2 } }} onPick={(label) => picked.push(label)} />,
    );
    const one = items[0] && box(items[0]);
    if (!one) throw new Error("no items");
    const y = one.bottom + 4;
    move(list, one.left + 20, y);
    list.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: one.left + 20, clientY: y }),
    );
    expect(picked).toEqual([]);
  });

  test("fades out a moment after the pointer leaves, and ignores touch", async () => {
    const { list, highlight, items } = await mount(<List options={{ hideDelay: 30 }} />);
    const one = items[0] && box(items[0]);
    if (!one) throw new Error("no items");
    move(list, one.left + 20, one.top + 10);
    list.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(highlight.hasAttribute("data-visible")).toBe(false);
    expect(lit(items)).toEqual([]);

    pointer(list, "pointermove", one.left + 20, one.top + 10, "touch");
    expect(lit(items)).toEqual([]);
  });

  test("lights an item from code, for keyboard highlight", async () => {
    function Keyboard() {
      const glide = useGlide<HTMLDivElement>();
      const [active, setActive] = useState(0);
      return (
        <div ref={glide.ref} data-testid="list">
          <GlideHighlight glide={glide} />
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              data-glide-item=""
              onFocus={(event) => {
                setActive(i);
                glide.setActive(event.currentTarget);
              }}
            >
              {active === i ? "Active" : "Item"}
            </button>
          ))}
        </div>
      );
    }
    const { items, highlight } = await mount(<Keyboard />);
    items[1]?.focus();
    expect(items[1]?.hasAttribute(GLIDE_ACTIVE_ATTR)).toBe(true);
    expect(highlight.hasAttribute("data-visible")).toBe(true);
  });

  test("moves by transform only, and only fades under reduced motion (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    const { highlight } = await mount(<List />);
    expect(getComputedStyle(highlight).transitionProperty).toBe("transform, opacity");
    await commands.setReducedMotion("reduce");
    expect(getComputedStyle(highlight).transitionProperty).toBe("opacity");
  });

  test("outlines the lit item in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { highlight } = await mount(<List />);
    await commands.setForcedColors("active");
    const style = getComputedStyle(highlight);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
  });

  test("is hidden from assistive technology, with no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete document.documentElement.dataset.theme;
    });
    const { screen, list, highlight, items } = await mount(
      <main>
        <List />
      </main>,
    );
    const one = items[0] && box(items[0]);
    if (one) move(list, one.left + 20, one.top + 10);
    expect(highlight.getAttribute("aria-hidden")).toBe("true");
    for (const theme of ["light", "dark"]) {
      document.documentElement.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations once the glide lands", async () => {
    const { list, items } = await mount(<List />);
    const [one, three] = [items[0], items[2]].map((item) => item && box(item));
    if (!one || !three) throw new Error("no items");
    move(list, one.left + 20, one.top + 10);
    move(list, three.left + 20, three.top + 10);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("cleans up when unmounted", async () => {
    const { screen, list, items } = await mount(<List />);
    const one = items[0] && box(items[0]);
    if (one) move(list, one.left + 20, one.top + 10);
    screen.unmount();
    expect(list.hasAttribute("data-glide")).toBe(false);
    expect(items[0]?.hasAttribute(GLIDE_ACTIVE_ATTR)).toBe(false);
  });
});
