import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { insets, nested, rect, TOL } from "../../../test/geometry.ts";
import { Tabs } from "./index";

const ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h16M4 12h10M4 18h13" />
  </svg>
);

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const lists = [...screen.container.querySelectorAll<HTMLElement>(".ow-tabs__list")];
  const thumbOf = (list: Element) =>
    list.querySelector<HTMLElement>(".ow-tabs__indicator") as HTMLElement;
  const tabsOf = (list: Element) => [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
  return { screen, lists, thumbOf, tabsOf };
}

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

/** Gaps from a tab to the indicator's key, inside the clear border that keeps the well's padding. */
function keyGaps(tab: Element, thumb: Element): number[] {
  const gap = insets(tab, thumb);
  const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
  return [gap.top, gap.right, gap.bottom, gap.left].map((side) => side + border);
}

function Sample({
  active = "b",
  size,
  orientation,
}: {
  active?: string;
  size?: Tabs.List.Props["size"];
  orientation?: Tabs.Root.Props["orientation"];
}) {
  return (
    <Tabs.Root defaultValue={active} orientation={orientation}>
      <Tabs.List aria-label="Sample" size={size}>
        <Tabs.Tab value="a">One</Tabs.Tab>
        <Tabs.Tab value="b">Two words</Tabs.Tab>
        <Tabs.Tab value="c">Three</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value={active}>Panel</Tabs.Panel>
    </Tabs.Root>
  );
}

describe("Tabs geometry", () => {
  test("tabs are the size's control height (FR-11), 4px inside the well on every side", async () => {
    const { lists, tabsOf } = await mount(
      <>
        <Sample size="sm" />
        <Sample size="md" />
        <Sample size="lg" />
      </>,
    );
    for (const [i, height] of [24, 32, 40].entries()) {
      const list = lists[i] as HTMLElement;
      const tabs = tabsOf(list);
      close(rect(list).height, height + 8);
      for (const tab of tabs) close(rect(tab).height, height);
      const first = insets(list, tabs[0] as Element);
      const last = insets(list, tabs.at(-1) as Element);
      for (const gap of [first.top, first.bottom, first.left, last.right]) close(gap, 4);
    }
  });

  test("the indicator covers the active tab exactly; the well takes the one radius, the tabs less the inset (TK-8)", async () => {
    const { lists, thumbOf, tabsOf } = await mount(
      <>
        <Sample active="a" />
        <Sample active="b" size="lg" />
      </>,
    );
    for (const [i, list] of lists.entries()) {
      const thumb = thumbOf(list);
      const active = tabsOf(list)[i] as HTMLElement;
      for (const side of keyGaps(active, thumb)) close(side, 0);
      // The first tab's indicator reaches the well's start corner with the well's radius; inside
      // its 4px clear border the key has the tabs' radius.
      if (i === 0) {
        const r = nested(list, thumb);
        expect(r.outerDelta).toBeLessThanOrEqual(TOL);
        expect(r.innerDelta).toBeLessThanOrEqual(TOL);
        expect(r.insetDelta).toBeLessThanOrEqual(TOL);
      }
      const radius = (el: Element) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
      const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
      close(radius(thumb) - border, radius(active));
    }
  });

  test("the indicator lands exactly on the next active tab", async () => {
    const { lists, thumbOf, tabsOf } = await mount(<Sample active="a" />);
    const list = lists[0] as HTMLElement;
    const last = tabsOf(list)[2] as HTMLElement;
    last.click();
    // Finish the slide rather than wait for idle: WebKit in CI can keep frames coming long after
    // it (idle cost has its own test).
    const thumb = thumbOf(list);
    await expect.poll(() => thumb.getAnimations().length).toBeGreaterThan(0);
    for (const animation of thumb.getAnimations()) animation.finish();
    for (const side of keyGaps(last, thumb)) close(side, 0);
  });

  test("an icon sits as far from the edges as from the top; alone, its tab is square (FR-10)", async () => {
    const { lists, tabsOf } = await mount(
      <Tabs.Root defaultValue="left">
        <Tabs.List aria-label="Align" size="sm">
          <Tabs.Tab value="left" aria-label="Left">
            {ICON}
          </Tabs.Tab>
          <Tabs.Tab value="list">
            {ICON}
            List
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    const [iconOnly, withText] = tabsOf(lists[0] as Element) as [HTMLElement, HTMLElement];
    close(rect(iconOnly).width, rect(iconOnly).height);
    const alone = insets(iconOnly, iconOnly.querySelector("svg") as Element);
    for (const side of [alone.right, alone.bottom, alone.left]) close(side, alone.top);
    const lead = insets(withText, withText.querySelector("svg") as Element);
    close(lead.left, lead.top);
    close(rect(withText.querySelector("svg") as Element).width, 15);
  });

  test("vertical: the list beside the panel, tabs as wide as the widest, the indicator on the active one", async () => {
    const { screen, lists, thumbOf, tabsOf } = await mount(
      <div style={{ inlineSize: 400, blockSize: 300, display: "flex" }}>
        <Sample orientation="vertical" />
      </div>,
    );
    const list = lists[0] as HTMLElement;
    const tabs = tabsOf(list);
    const well = rect(list);
    for (const tab of tabs) close(rect(tab).width, well.width - 8);
    close(well.height, tabs.reduce((sum, tab) => sum + rect(tab).height, 0) + 2 * 2 + 8);
    for (const side of keyGaps(tabs[1] as Element, thumbOf(list))) close(side, 0);
    const panel = rect(screen.container.querySelector(".ow-tabs__panel") as Element);
    expect(panel.left).toBeGreaterThan(well.right);
    close(panel.top, well.top);
  });

  test("a list held short scrolls in its own axis, in either orientation", async () => {
    const { lists, tabsOf, thumbOf } = await mount(
      <>
        <div style={{ inlineSize: 120 }}>
          <Sample />
        </div>
        <div style={{ blockSize: 80, display: "flex" }}>
          <Sample orientation="vertical" active="c" />
        </div>
      </>,
    );
    const [across, down] = lists as [HTMLElement, HTMLElement];
    close(rect(across).width, 120);
    expect(across.scrollWidth).toBeGreaterThan(across.clientWidth);
    close(rect(down).height, 80);
    expect(down.scrollHeight).toBeGreaterThan(down.clientHeight);
    for (const side of keyGaps(tabsOf(across)[1] as Element, thumbOf(across))) close(side, 0);
    for (const side of keyGaps(tabsOf(down)[2] as Element, thumbOf(down))) close(side, 0);
  });

  test("the panel's height does not squeeze the list", async () => {
    const { lists, screen } = await mount(
      <Tabs.Root defaultValue="a" style={{ blockSize: 100 }}>
        <Tabs.List aria-label="Short" size="md">
          <Tabs.Tab value="a">A</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">
          <div style={{ blockSize: 400 }} />
        </Tabs.Panel>
      </Tabs.Root>,
    );
    close(rect(lists[0] as Element).height, 40);
    expect(rect(screen.container.querySelector(".ow-tabs__panel") as Element).height).toBeCloseTo(
      400,
      0,
    );
  });

  test("right to left, the indicator is under the first tab, on the right (FR-16)", async () => {
    const { lists, thumbOf, tabsOf } = await mount(
      <div dir="rtl">
        <Sample active="a" />
      </div>,
    );
    const list = lists[0] as HTMLElement;
    const first = tabsOf(list)[0] as HTMLElement;
    close(insets(list, first).right, 4);
    for (const side of keyGaps(first, thumbOf(list))) close(side, 0);
  });

  test("hovering another tab while the indicator travels never moves it or restarts its stretch", async () => {
    const { lists, thumbOf, tabsOf } = await mount(<Sample active="c" />);
    const list = lists[0] as HTMLElement;
    const thumb = thumbOf(list);
    const [first, , third] = tabsOf(list) as [HTMLElement, HTMLElement, HTMLElement];
    await userEvent.unhover(first);
    await expect.poll(() => thumb.hasAttribute("data-visible")).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Each position with the slide's own time, so that positions are judged in the slide's order and
    // not in the order the frames were read.
    const slides = new Set<Animation>();
    const samples: { time: number; center: number }[] = [];
    const landed: number[] = [];
    let sampling = true;
    const slide = () =>
      thumb
        .getAnimations()
        .find((a) => a instanceof CSSTransition && a.transitionProperty === "translate");
    const sample = () => {
      const running = slide();
      const box = thumb.getBoundingClientRect();
      const center = box.left + box.width / 2;
      if (running) {
        slides.add(running);
        samples.push({ time: Number(running.currentTime), center });
      } else if (slides.size > 0) {
        landed.push(center);
      }
      if (sampling) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    const stretch = () =>
      thumb
        .getAnimations({ subtree: true })
        .find((a) => (a.effect as KeyframeEffect).pseudoElement === "::before");
    // A slow runner can outlast the 520 ms stretch while the clicks are still being sent, so
    // hold it open from the frame it starts until the hover has been checked.
    let slowed = true;
    const slow = () => {
      const running = stretch();
      if (running) running.playbackRate = 0.02;
      if (slowed) requestAnimationFrame(slow);
    };
    requestAnimationFrame(slow);
    await userEvent.click(first);
    await expect.poll(stretch).toBeDefined();
    const key = stretch();
    expect(key?.playState).toBe("running");
    const style = thumb.getAttribute("style");
    // The pointer moves onto the tab the indicator is leaving.
    await userEvent.hover(third);
    expect(thumb.getAttribute("style")).toBe(style);
    expect(stretch()).toBe(key);
    expect(key?.playState).toBe("running");
    slowed = false;
    if (key) key.playbackRate = 1;
    await new Promise((resolve) => setTimeout(resolve, 900));
    sampling = false;
    // One slide from start to end, and travelling left it never steps back to the right (the press
    // release may breathe a pixel).
    expect(slides.size).toBe(1);
    expect(samples.length).toBeGreaterThan(2);
    samples.sort((a, b) => a.time - b.time);
    const back = samples.filter(
      (at, i) => i > 0 && at.center > (samples[i - 1]?.center ?? 0) + 0.5,
    );
    expect(back, JSON.stringify(samples)).toEqual([]);
    // Once there, it stays there.
    expect(landed.length).toBeGreaterThan(2);
    for (const center of landed) close(center, rect(first).left + rect(first).width / 2);
    // The thumb reaches out by the well's padding, 4px, around its key.
    close(rect(thumb).left + 4, rect(first).left);
  });

  test("the stretch grows from the leading edge: the key never passes its tab or the well", async () => {
    const { lists, thumbOf, tabsOf } = await mount(<Sample active="c" />);
    const list = lists[0] as HTMLElement;
    const thumb = thumbOf(list);
    const [first] = tabsOf(list) as [HTMLElement];
    await expect.poll(() => thumb.hasAttribute("data-visible")).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const key = () => {
      const box = thumb.getBoundingClientRect();
      const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
      const style = getComputedStyle(thumb, "::before");
      const scale = new DOMMatrixReadOnly(style.transform).a;
      const origin = Number.parseFloat(style.transformOrigin);
      const left = box.left + border + origin - origin * scale;
      return { left, right: left + (box.width - 2 * border) * scale };
    };
    let passed = 0;
    let outside = 0;
    let sampling = true;
    const sample = () => {
      const { left } = key();
      passed = Math.max(passed, first.getBoundingClientRect().left - left);
      outside = Math.max(outside, list.getBoundingClientRect().left - left);
      if (sampling) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    first.click();
    // Read the frames inside the poll: the stretch may be over by the next look.
    let frames: Keyframe[] = [];
    await expect
      .poll(() => {
        const stretch = thumb
          .getAnimations({ subtree: true })
          .find((a) => (a.effect as KeyframeEffect).pseudoElement === "::before");
        if (stretch) frames = (stretch.effect as KeyframeEffect).getKeyframes();
        return frames.length;
      })
      .toBeGreaterThan(0);
    // Going left, the left edge leads and stays put: the origin is on it.
    for (const frame of frames) {
      expect(String(frame.transformOrigin).startsWith("0% 50%")).toBe(true);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    sampling = false;
    expect(passed).toBeLessThanOrEqual(0.5);
    expect(outside).toBeLessThanOrEqual(0.5);
  });
});
