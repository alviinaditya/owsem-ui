import type { CSSProperties, ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, rect, TOL, usedRadius } from "../../../test/geometry.ts";
import { Radio, RadioGroup } from "./index";

function Options(props: Partial<RadioGroup.Props<string>>) {
  return (
    <RadioGroup aria-label="Delivery" defaultValue="a" {...props}>
      <label>
        <Radio.Root value="a" />
        Standard
      </label>
      <label>
        <Radio.Root value="b" />
        Express shipping
      </label>
    </RadioGroup>
  );
}

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const groups = [...screen.container.querySelectorAll<HTMLElement>(".ow-radio-group")];
  const rowsOf = (group: Element) => [...group.querySelectorAll<HTMLElement>("label")];
  const radioOf = (el: Element) => el.querySelector(".ow-radio-group__radio") as HTMLElement;
  return { groups, rowsOf, radioOf };
}

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

describe("Radio Group geometry", () => {
  test("the circle is the font size plus 2px (FR-10), round, and a row is Button's height (FR-11)", async () => {
    const { groups, rowsOf, radioOf } = await mount(
      <>
        <Options size="sm" />
        <Options size="md" />
        <Options size="lg" />
      </>,
    );
    for (const [i, [circle, height]] of [
      [15, 29.25],
      [16, 38.5],
      [18, 48],
    ].entries()) {
      for (const row of rowsOf(groups[i] as Element)) {
        const radio = radioOf(row);
        close(rect(radio).width, circle as number);
        close(rect(radio).height, circle as number);
        close(usedRadius(radio), (circle as number) / 2);
        close(rect(row).height, height as number);
      }
    }
  });

  test("the radio sits as far from the row's start as from its top and bottom (FR-10)", async () => {
    const { groups, rowsOf, radioOf } = await mount(
      <>
        <Options size="sm" />
        <Options size="md" />
        <Options size="lg" />
      </>,
    );
    for (const group of groups) {
      const [row] = rowsOf(group) as [HTMLElement];
      const gap = insets(row, radioOf(row));
      close(gap.left, gap.top);
      close(gap.bottom, gap.top);
    }
  });

  test("the dot's box is the circle's, with a clear border as wide on every side", async () => {
    const { groups, radioOf } = await mount(
      <>
        <Options size="sm" />
        <Options size="md" />
        <Options size="lg" />
      </>,
    );
    for (const group of groups) {
      const radio = radioOf(group);
      const dot = radio.querySelector(".ow-radio-group__indicator") as HTMLElement;
      const gap = insets(radio, dot);
      for (const side of [gap.top, gap.right, gap.bottom, gap.left]) close(side, 0);
      const style = getComputedStyle(dot);
      for (const side of ["Right", "Bottom", "Left"] as const) {
        expect(style[`border${side}Width`]).toBe(style.borderTopWidth);
      }
      expect(Number.parseFloat(style.borderTopWidth)).toBeGreaterThanOrEqual(4);
    }
  });

  test("the press target is at least 24px around the circle, and adds no layout (FR-14)", async () => {
    const { groups, radioOf } = await mount(
      <>
        <Options size="sm" />
        <Options size="lg" />
        <Options style={{ fontSize: "30px" }} />
      </>,
    );
    for (const [i, group] of groups.entries()) {
      const radio = radioOf(group);
      const target = rect({ el: radio, pseudo: "::before" });
      const expected = i === 2 ? rect(radio).width : 24;
      close(target.width, expected);
      close(target.height, expected);
      close(target.left + target.width / 2, rect(radio).left + rect(radio).width / 2);
      close(target.top + target.height / 2, rect(radio).top + rect(radio).height / 2);
    }

    // The hit test reaches the radio in the area around the circle.
    const [group] = groups as [HTMLElement];
    const radio = radioOf(group);
    const box = rect(radio);
    expect(document.elementFromPoint(box.left - 3, box.top - 3)).toBe(radio);
  });

  test("font-size scales it all, and --py and --icon can be set through style (FR-11)", async () => {
    const { groups, rowsOf, radioOf } = await mount(
      <>
        <Options style={{ fontSize: "24px" }} />
        <Options style={{ "--py": "0.25em" } as CSSProperties} />
        <RadioGroup aria-label="Own" defaultValue="a">
          <label style={{ "--py": "1em" } as CSSProperties}>
            <Radio.Root value="a" style={{ "--icon": "20px" } as CSSProperties} />
            Own
          </label>
        </RadioGroup>
      </>,
    );
    const [scaled, dense, own] = groups as [HTMLElement, HTMLElement, HTMLElement];
    const [row] = rowsOf(scaled) as [HTMLElement];
    close(rect(radioOf(row)).width, 26);
    close(rect(row).height, 2 * 0.75 * 24 + 1.25 * 24);
    // The block padding never drops a row below a 24px target.
    close(rect(rowsOf(dense)[0] as Element).height, 24);
    const [ownRow] = rowsOf(own) as [HTMLElement];
    close(rect(ownRow).height, 2 * 14 + 1.25 * 14);
    close(rect(radioOf(ownRow)).width, 20);
  });

  test("the group has no margin and no width: it fits its rows, and stretches when asked", async () => {
    const { groups, rowsOf } = await mount(
      <>
        <Options />
        <Options style={{ inlineSize: 400 }} />
        <div style={{ display: "flex", flexDirection: "column", inlineSize: 500 }}>
          <Options />
        </div>
      </>,
    );
    const [natural, wide, stretched] = groups as [HTMLElement, HTMLElement, HTMLElement];
    expect(getComputedStyle(natural).margin).toBe("0px");
    const [first, second] = rowsOf(natural) as [HTMLElement, HTMLElement];
    close(rect(first).width, rect(natural).width);
    close(rect(second).width, rect(natural).width);
    expect(rect(natural).width).toBeLessThan(250);
    close(rect(wide).width, 400);
    close(rect(rowsOf(wide)[0] as Element).width, 400);
    close(rect(stretched).width, 500);
  });

  test("a rule on the group lays it out in a row, and the highlight takes no room", async () => {
    const { groups, rowsOf } = await mount(
      <Options style={{ flexDirection: "row", gap: "8px" }} />,
    );
    const [group] = groups as [HTMLElement];
    const [first, second] = rowsOf(group) as [HTMLElement, HTMLElement];
    close(rect(first).top, rect(second).top);
    close(rect(second).left - rect(first).right, 8);
    close(rect(first).left, rect(group).left);
    close(rect(second).right, rect(group).right);
  });

  test("a label that wraps keeps the radio on its first line", async () => {
    const { rowsOf, radioOf, groups } = await mount(
      <div style={{ inlineSize: 140 }}>
        <RadioGroup aria-label="Long">
          <label>
            <Radio.Root value="a" />A long label that wraps onto more than one line here
          </label>
        </RadioGroup>
      </div>,
    );
    const [row] = rowsOf(groups[0] as Element) as [HTMLElement];
    const gap = insets(row, radioOf(row));
    expect(rect(row).height).toBeGreaterThan(50);
    close(gap.top, gap.left);
  });

  test("right to left, the radio is at the start, on the right (FR-16)", async () => {
    const { groups, rowsOf, radioOf } = await mount(
      <div dir="rtl">
        <Options />
      </div>,
    );
    const [row] = rowsOf(groups[0] as Element) as [HTMLElement];
    const gap = insets(row, radioOf(row));
    close(gap.right, gap.top);
    expect(gap.left).toBeGreaterThan(gap.right);
  });
});
