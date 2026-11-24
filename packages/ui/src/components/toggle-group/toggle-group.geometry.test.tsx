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
      close(rect(group).height, height + 8);
      for (const item of items) close(rect(item).height, height);
      const first = insets(group, items[0] as Element);
      const last = insets(group, items.at(-1) as Element);
      for (const gap of [first.top, first.bottom, first.left, last.right]) close(gap, 4);
    }
  });

  test("icon-only items are as tall as labeled ones: the group keeps the control height", async () => {
    const { groups, itemsOf } = await mount(
      <ToggleGroup.Root aria-label="Icons" defaultValue={["a"]}>
        <ToggleGroup.Item value="a" aria-label="A">
          {ICON}
        </ToggleGroup.Item>
        <ToggleGroup.Item value="b" aria-label="B">
          {ICON}
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    close(rect(groups[0] as Element).height, 40);
    for (const item of itemsOf(groups[0] as Element)) close(rect(item).height, 32);
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
  });

  test("a solid thumb sits on the same pixels as a soft one, also between pixels", async () => {
    // Each group is shifted by a fraction of a pixel, as a zoom of 110% does to its neighbors.
    const { groups, thumbOf, itemsOf } = await mount(
      <div>
        {[undefined, "solid" as const].map((variant) => (
          <div key={variant ?? "soft"} style={{ paddingBlockStart: 0.3, paddingInlineStart: 0.4 }}>
            <Group pressed="b" variant={variant} />
          </div>
        ))}
      </div>,
    );
    const [soft, solid] = groups as [HTMLElement, HTMLElement];
    const local = (group: HTMLElement) => {
      const box = rect(thumbOf(group));
      const track = rect(group);
      return [box.left - track.left, box.top - track.top, box.width, box.height];
    };
    for (const [a, b] of local(soft).map((n, i) => [n, local(solid)[i] as number] as const)) {
      close(a, b);
    }
    for (const group of [soft, solid]) {
      const thumb = thumbOf(group);
      for (const side of keyGaps(itemsOf(group)[1] as Element, thumb)) close(side, 0);
      const style = getComputedStyle(thumb);
      expect(style.borderTopWidth).toBe(getComputedStyle(group).paddingTop);
      expect(style.borderBottomWidth).toBe(style.borderTopWidth);
    }
    expect(getComputedStyle(thumbOf(solid)).borderTopLeftRadius).toBe(
      getComputedStyle(thumbOf(soft)).borderTopLeftRadius,
    );
  });
});
