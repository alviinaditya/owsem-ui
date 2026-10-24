import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { concentric, insets, rect, TOL } from "../../../test/geometry.ts";
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
  test("items are the size's control height (FR-11), 3px inside the track on every side", async () => {
    const { groups, itemsOf } = await mount(
      <>
        <Group size="sm" />
        <Group size="md" />
        <Group size="lg" />
      </>,
    );
    for (const [i, height] of [29.25, 38.5, 48].entries()) {
      const group = groups[i] as HTMLElement;
      const items = itemsOf(group);
      for (const item of items) close(rect(item).height, height);
      const first = insets(group, items[0] as Element);
      const last = insets(group, items.at(-1) as Element);
      for (const gap of [first.top, first.bottom, first.left, last.right]) close(gap, 3);
    }
  });

  test("the thumb covers the pressed item exactly, its radius concentric with the track (FR-10b)", async () => {
    const { groups, thumbOf, itemsOf } = await mount(
      <>
        <Group pressed="a" />
        <Group pressed="b" size="lg" />
      </>,
    );
    for (const [i, group] of groups.entries()) {
      const thumb = thumbOf(group);
      const pressed = itemsOf(group)[i] as HTMLElement;
      const gap = insets(pressed, thumb);
      for (const side of [gap.top, gap.right, gap.bottom, gap.left]) close(side, 0);
      // The first item's thumb touches the track's start corner: 3px in, radius + 3px out.
      if (i === 0) {
        const r = concentric(group, thumb);
        expect(r.delta).toBeLessThanOrEqual(TOL);
        expect(r.insetDelta).toBeLessThanOrEqual(TOL);
      }
      expect(getComputedStyle(thumb).borderTopLeftRadius).toBe(
        getComputedStyle(pressed).borderTopLeftRadius,
      );
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
    const gap = insets(last, thumb);
    for (const side of [gap.top, gap.right, gap.bottom, gap.left]) close(side, 0);
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
    // 420 less 3px padding on each side and two 2px gaps, in three.
    for (const width of widths(stretched)) close(width, (420 - 6 - 4) / 3);
  });

  test("right to left, the thumb is under the first item, on the right (FR-16)", async () => {
    const { groups, thumbOf, itemsOf } = await mount(
      <div dir="rtl">
        <Group pressed="a" />
      </div>,
    );
    const group = groups[0] as HTMLElement;
    const first = itemsOf(group)[0] as HTMLElement;
    close(insets(group, first).right, 3);
    const gap = insets(first, thumbOf(group));
    for (const side of [gap.top, gap.right, gap.bottom, gap.left]) close(side, 0);
  });
});
