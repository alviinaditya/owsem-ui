import { type CSSProperties, createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { IconMorph, type IconMorphProps } from "./index";

function Glyph({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg data-icon={name} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function Swap({ name, ...props }: { name: string | null } & Omit<IconMorphProps, "children">) {
  return <IconMorph {...props}>{name ? <Glyph key={name} name={name} /> : null}</IconMorph>;
}

// Two frames: a swap after a paint, as a visitor's would be. An element never styled has nothing
// to transition from, and rAF callbacks run before the frame's style.
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const painted = async () => {
  await frame();
  await frame();
};

async function mount(name: string | null = "copy", props: Omit<IconMorphProps, "children"> = {}) {
  const screen = await render(<Swap name={name} {...props} />);
  await painted();
  const root = screen.container.querySelector<HTMLElement>(".ow-icon-morph");
  if (!root) throw new Error("not mounted");
  const items = () => [...root.querySelectorAll<HTMLElement>(":scope > .ow-icon-morph__item")];
  const item = (icon: string) => {
    const el = root.querySelector(`[data-icon="${icon}"]`)?.parentElement;
    if (!el) throw new Error(`no ${icon}`);
    return el;
  };
  /** Each item as icon:state, in DOM order. */
  const shape = () =>
    items().map((el) => {
      const icon = el.querySelector("[data-icon]")?.getAttribute("data-icon");
      const state = el.hasAttribute("data-ending-style")
        ? "leaving"
        : el.hasAttribute("data-starting-style")
          ? "starting"
          : "shown";
      return `${icon}:${state}`;
    });
  const show = (next: string | null, more: Omit<IconMorphProps, "children"> = props) =>
    screen.rerender(<Swap name={next} {...more} />);
  return { screen, root, items, item, shape, show };
}

const transitions = (el: Element) =>
  el
    .getAnimations()
    .filter((a): a is CSSTransition => a instanceof CSSTransition)
    .map((a) => a.transitionProperty)
    .sort();

/** Where each running transition on `el` ends. */
const ends = (el: Element) =>
  Object.fromEntries(
    el
      .getAnimations()
      .filter((a): a is CSSTransition => a instanceof CSSTransition)
      .map((a) => {
        const frames = (a.effect as KeyframeEffect).getKeyframes();
        const property = a.transitionProperty;
        return [property, String(frames.at(-1)?.[property])];
      }),
  );

/** Resolves a value of `property` (e.g. a token) to its computed form inside `scope`. */
function resolve(property: string, value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

describe("Icon Morph", () => {
  test("renders its icon in one item, and animates nothing on the first render", async () => {
    const { root, items, shape } = await mount();
    expect(root.tagName).toBe("SPAN");
    expect(shape()).toEqual(["copy:shown"]);
    expect(items()[0]?.className).toBe("ow-icon-morph__item");
    expect(items()[0]?.hasAttribute("aria-hidden")).toBe(false);
    expect(document.getAnimations()).toEqual([]);
  });

  test("passes className, style, other props, and ref through", async () => {
    const ref = createRef<HTMLSpanElement>();
    const screen = await render(
      <IconMorph ref={ref} className="mine" style={{ color: "red" }} data-test="">
        <Glyph key="copy" name="copy" />
      </IconMorph>,
    );
    const root = screen.container.querySelector<HTMLElement>("[data-test]");
    expect(ref.current).toBe(root);
    expect(root?.className).toBe("ow-icon-morph mine");
    expect(root?.style.color).toBe("red");
  });

  test("renders on the server as it hydrates: the icon, no states", () => {
    const html = renderToString(<Swap name="copy" />);
    expect(html).toContain('data-icon="copy"');
    expect(html).not.toContain("data-starting-style");
    expect(html).not.toContain("data-ending-style");
    expect(html).not.toContain('aria-hidden="true"><svg');
  });

  test("a new key: the old icon leaves, hidden from assistive technology, as the new one enters", async () => {
    const { items, item, shape, show } = await mount();
    await show("check");
    expect(shape()).toEqual(["copy:leaving", "check:shown"]);
    expect(item("copy").getAttribute("aria-hidden")).toBe("true");
    expect(item("check").hasAttribute("aria-hidden")).toBe(false);
    // Both move from their last state: the starting style was applied before it came off.
    expect(transitions(item("check"))).toEqual(["filter", "opacity", "scale"]);
    expect(transitions(item("copy"))).toEqual(["filter", "opacity", "scale"]);
    expect(Number(getComputedStyle(item("check")).opacity)).toBeLessThan(0.5);
    await settle();
    // Polled: the last transition can end just before settle() looks, a moment before React
    // drops the icon.
    await expect.poll(shape).toEqual(["check:shown"]);
    expect(getComputedStyle(items()[0] as Element).opacity).toBe("1");
  });

  test("the same key updates the icon in place", async () => {
    const screen = await render(
      <IconMorph>
        <Glyph key="copy" name="copy" size={16} />
      </IconMorph>,
    );
    await painted();
    const item = screen.container.querySelector(".ow-icon-morph__item");
    await screen.rerender(
      <IconMorph>
        <Glyph key="copy" name="copy" size={20} />
      </IconMorph>,
    );
    const items = screen.container.querySelectorAll(".ow-icon-morph__item");
    expect(items.length).toBe(1);
    expect(items[0]).toBe(item);
    expect(item?.querySelector("svg")?.getAttribute("width")).toBe("20");
    expect(document.getAnimations()).toEqual([]);
  });

  test("rapid changes keep at most one leaving icon, and nodes never move", async () => {
    const { items, shape, show } = await mount("a");
    // Each icon is well on its way in before the next: the way back is as short as the way it
    // came, and must outlast the checks on a busy machine.
    const midway = () => new Promise((resolve) => setTimeout(resolve, 150));
    await show("b");
    const b = items()[1];
    await midway();
    await show("c");
    expect(shape()).toEqual(["b:leaving", "c:shown"]);
    // The leaving icon kept its node, so its transition kept going.
    expect(items()[0]).toBe(b);
    await midway();
    await show("d");
    expect(shape()).toEqual(["c:leaving", "d:shown"]);
    await settle();
    await expect.poll(shape).toEqual(["d:shown"]);
  });

  test("an icon that comes back mid-swap turns around where it is", async () => {
    const { items, shape, show } = await mount("copy");
    const copy = items()[0];
    await show("check");
    await new Promise((resolve) => setTimeout(resolve, 60));
    const faded = Number(getComputedStyle(copy as Element).opacity);
    expect(faded).toBeLessThan(1);
    await show("copy");
    expect(shape()).toEqual(["copy:shown", "check:leaving"]);
    expect(items()[0]).toBe(copy);
    // From where it was, not from hidden.
    expect(Number(getComputedStyle(copy as Element).opacity)).toBeGreaterThan(faded - 0.05);
    expect(transitions(copy as Element)).toContain("opacity");
    await show("check");
    expect(shape()).toEqual(["copy:leaving", "check:shown"]);
    await settle();
    await expect.poll(shape).toEqual(["check:shown"]);
  });

  test("without an icon it shows none: the old one leaves, and the next enters from nothing", async () => {
    const { shape, show, item } = await mount("copy");
    await show(null);
    expect(shape()).toEqual(["copy:leaving"]);
    await show("check");
    expect(shape()).toEqual(["copy:leaving", "check:shown"]);
    expect(transitions(item("check"))).toEqual(["filter", "opacity", "scale"]);
    await settle();
    await expect.poll(shape).toEqual(["check:shown"]);
  });

  test("starts with no icon, and animates the first one that arrives", async () => {
    const { shape, show, item } = await mount(null);
    expect(shape()).toEqual([]);
    await show("copy");
    expect(transitions(item("copy"))).toEqual(["filter", "opacity", "scale"]);
    await settle();
    await expect.poll(shape).toEqual(["copy:shown"]);
  });

  test("a hidden icon swaps at once, with nothing left behind", async () => {
    const { shape, show } = await mount("copy", { style: { display: "none" } });
    await show("check");
    expect(shape()).toEqual(["check:shown"]);
  });

  test("moves on the settle spring, and shrinks and blurs as far as the motion scale says (TK-9)", async () => {
    const { root, item, show } = await mount();
    await show("check");
    const leaving = getComputedStyle(item("copy"));
    const spring = resolve("transition-timing-function", "var(--ow-spring-settle)");
    const duration = resolve("transition-duration", "var(--ow-spring-settle-duration)");
    expect(leaving.transitionTimingFunction).toBe([spring, spring, spring].join(", "));
    expect(leaving.transitionDuration).toBe([duration, duration, duration].join(", "));
    // At motion scale 1: out to half its size and a 3px blur, in to rest.
    expect(ends(item("copy"))).toEqual({ opacity: "0", scale: "0.5", filter: "blur(3px)" });
    expect(ends(item("check"))).toEqual({ opacity: "1", scale: "none", filter: "none" });
    await settle();

    root.style.setProperty("--ow-motion-scale", "0");
    await show("copy");
    expect(ends(item("check"))).toEqual({ opacity: "0", scale: "1", filter: "blur(0px)" });
  });

  test("with reduced motion, only a short crossfade (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { item, shape, show } = await mount();
    await show("check");
    expect(transitions(item("copy"))).toEqual(["opacity"]);
    expect(transitions(item("check"))).toEqual(["opacity"]);
    const leaving = getComputedStyle(item("copy"));
    expect([leaving.scale, leaving.filter, leaving.transitionDuration]).toEqual([
      "none",
      "none",
      "0.15s",
    ]);
    await settle({ maxMs: 500 });
    expect(shape()).toEqual(["check:shown"]);
  });

  test("has no axe violations, mid-swap and after", async () => {
    const screen = await render(
      <button type="button" aria-label="Copy">
        <Swap name="copy" />
      </button>,
    );
    const button = screen.container.querySelector("button") as HTMLElement;
    await painted();
    await screen.rerender(
      <button type="button" aria-label="Copied">
        <Swap name="check" />
      </button>,
    );
    expect(await axeReport(button)).toEqual({ violations: [], contrastUnknown: [] });
    await settle();
    expect(await axeReport(button)).toEqual({ violations: [], contrastUnknown: [] });
  });

  test("runs no rAF and no animations when idle, after a swap too", async () => {
    const { show } = await mount();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await show("check");
    await show("copy");
    await show("check");
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("swaps with a style set on it, such as a token (TK-9)", async () => {
    const { item, show } = await mount("copy", {
      style: { "--ow-spring-settle-duration": "400ms" } as CSSProperties,
    });
    await show("check");
    expect(getComputedStyle(item("copy")).transitionDuration).toBe("0.4s, 0.4s, 0.4s");
  });
});
