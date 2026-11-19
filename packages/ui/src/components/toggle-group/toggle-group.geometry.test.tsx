import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, nested, rect, TOL } from "../../../test/geometry.ts";
import { ToggleGroup } from "./index";

const ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h16M4 12h10M4 18h13" />
  </svg>
);

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const groups = [...screen.container.querySelectorAll<HTMLElement>(".ow-toggle-group")];
  const thumbOf = (group: Element) =>
    group.querySelector<HTMLElement>(".ow-toggle-group__thumb") as HTMLElement;
  const itemsOf = (group: Element) => [...group.querySelectorAll<HTMLElement>("button")];
  return { groups, thumbOf, itemsOf };
}

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

/** Gaps from an item to the thumb's key, inside the clear border that keeps the track's padding. */
function keyGaps(item: Element, thumb: Element): number[] {
  const gap = insets(item, thumb);
  const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
  return [gap.top, gap.right, gap.bottom, gap.left].map((side) => side + border);
}

function Group({
  pressed = "b",
  ...props
}: Partial<ToggleGroup.Root.Props> & { pressed?: string }) {
  return (
    <ToggleGroup.Root aria-label="Group" defaultValue={[pressed]} {...props}>
      <ToggleGroup.Item value="a">One</ToggleGroup.Item>
      <ToggleGroup.Item value="b">Two words</ToggleGroup.Item>
      <ToggleGroup.Item value="c">Three</ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}

describe("Toggle Group geometry", () => {
  test("items are the size's control height (FR-11), 4px inside the track on every side", async () => {
    const { groups, itemsOf } = await mount(
      <>
        <Group size="sm" />
        <Group size="md" />
        <Group size="lg" />
      </>,
    );
    for (const [i, height] of [24, 32, 40].entries()) {
      const group = groups[i] as HTMLElement;
      const items = itemsOf(group);
      for (const item of items) close(rect(item).height, height);
      const first = insets(group, items[0] as Element);
      const last = insets(group, items.at(-1) as Element);
      for (const gap of [first.top, first.bottom, first.left, last.right]) close(gap, 4);
    }
  });

  test("the thumb covers the pressed item exactly; the track takes the one radius, the items less the inset (TK-8)", async () => {
    const { groups, thumbOf, itemsOf } = await mount(
      <>
        <Group pressed="a" />
        <Group pressed="b" size="lg" />
      </>,
    );
    for (const [i, group] of groups.entries()) {
      const thumb = thumbOf(group);
      const pressed = itemsOf(group)[i] as HTMLElement;
      for (const side of keyGaps(pressed, thumb)) close(side, 0);
      // The first item's thumb reaches the track's start corner with the track's radius; inside
      // its 4px clear border the key has the items' radius.
      if (i === 0) {
        const r = nested(group, thumb);
        expect(r.outerDelta).toBeLessThanOrEqual(TOL);
        expect(r.innerDelta).toBeLessThanOrEqual(TOL);
        expect(r.insetDelta).toBeLessThanOrEqual(TOL);
      }
      const radius = (el: Element) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
      const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
      close(radius(thumb) - border, radius(pressed));
    }
  });

  test("the thumb lands exactly on the next pressed item", async () => {
    const { groups, thumbOf, itemsOf } = await mount(<Group pressed="a" />);
    const group = groups[0] as HTMLElement;
    const last = itemsOf(group)[2] as HTMLElement;
    last.click();
    // Finish the slide rather than wait for idle: WebKit in CI can keep frames coming long after
    // it (idle cost has its own test).
    const thumb = thumbOf(group);
    await expect.poll(() => thumb.getAnimations().length).toBeGreaterThan(0);
    for (const animation of thumb.getAnimations()) animation.finish();
    for (const side of keyGaps(last, thumb)) close(side, 0);
  });

  test("an icon sits as far from the edges as from the top; alone, its item is square (FR-10)", async () => {
    const { groups, itemsOf } = await mount(
      <ToggleGroup.Root aria-label="Align" defaultValue={["left"]} size="sm">
        <ToggleGroup.Item value="left" aria-label="Left">
          {ICON}
        </ToggleGroup.Item>
        <ToggleGroup.Item value="list">
          {ICON}
          List
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const [iconOnly, withText] = itemsOf(groups[0] as Element) as [HTMLElement, HTMLElement];
    close(rect(iconOnly).width, rect(iconOnly).height);
    const alone = insets(iconOnly, iconOnly.querySelector("svg") as Element);
    for (const side of [alone.right, alone.bottom, alone.left]) close(side, alone.top);
    const lead = insets(withText, withText.querySelector("svg") as Element);
    close(lead.left, lead.top);
    close(rect(withText.querySelector("svg") as Element).width, 15);
  });

  test("equal items share the width, stretched or not", async () => {
    const { groups, itemsOf } = await mount(
      <>
        <Group equal />
        <div style={{ display: "flex", inlineSize: 420 }}>
          <Group equal style={{ flex: 1 }} />
        </div>
      </>,
    );
    const [natural, stretched] = groups as [HTMLElement, HTMLElement];
    const widths = (group: Element) => itemsOf(group).map((item) => rect(item).width);
    const [first = 0, ...rest] = widths(natural);
    for (const width of rest) close(width, first);
    close(rect(stretched).width, 420);
    // 420 less 4px padding on each side and two 2px gaps, in three.
    for (const width of widths(stretched)) close(width, (420 - 8 - 4) / 3);
  });

  test("right to left, the thumb is under the first item, on the right (FR-16)", async () => {
    const { groups, thumbOf, itemsOf } = await mount(
      <div dir="rtl">
        <Group pressed="a" />
      </div>,
    );
    const group = groups[0] as HTMLElement;
    const first = itemsOf(group)[0] as HTMLElement;
    close(insets(group, first).right, 4);
    for (const side of keyGaps(first, thumbOf(group))) close(side, 0);
  });

  test("the stretch grows from the leading edge, so the key never passes its item", async () => {
    const { groups, thumbOf, itemsOf } = await mount(<Group pressed="c" />);
    const group = groups[0] as HTMLElement;
    const thumb = thumbOf(group);
    await expect.poll(() => thumb.hasAttribute("data-visible")).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    (itemsOf(group)[0] as HTMLElement).click();
    const find = () =>
      thumb
        .getAnimations({ subtree: true })
        .find((a) => (a.effect as KeyframeEffect).pseudoElement === "::before");
    await expect.poll(find).toBeDefined();
    // Going left, the left edge leads and stays put: the origin is on it.
    for (const frame of ((find() as Animation).effect as KeyframeEffect).getKeyframes()) {
      expect(String(frame.transformOrigin).startsWith("0% 50%")).toBe(true);
    }
  });
});
