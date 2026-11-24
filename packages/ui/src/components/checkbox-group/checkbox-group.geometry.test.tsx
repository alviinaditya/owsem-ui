import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, rect, TOL } from "../../../test/geometry.ts";
import { Checkbox } from "../checkbox";
import { CheckboxGroup, type CheckboxGroupSize } from "./index";

const SIZES: Record<CheckboxGroupSize, { box: number; row: number }> = {
  sm: { box: 19, row: 32 },
  md: { box: 20, row: 40 },
  lg: { box: 22, row: 48 },
};

function Options(props: Partial<CheckboxGroup.Props>) {
  return (
    <CheckboxGroup aria-label="Toppings" defaultValue={["a"]} {...props}>
      <label>
        <Checkbox.Root value="a" />
        Cheese
      </label>
      <label>
        <Checkbox.Root value="b" />
        Olives
      </label>
    </CheckboxGroup>
  );
}

async function mount(ui: ReactNode, dir: "ltr" | "rtl" = "ltr") {
  const screen = await render(<div dir={dir}>{ui}</div>);
  const groups = [...screen.container.querySelectorAll<HTMLElement>(".ow-checkbox-group")];
  const rowsOf = (group: Element) => [...group.querySelectorAll<HTMLElement>("label")];
  const boxOf = (row: Element) => row.querySelector(".ow-checkbox") as HTMLElement;
  return { groups, rowsOf, boxOf };
}

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

describe("Checkbox Group geometry", () => {
  test("a row is Button's height and the box the font size plus 6px, in every size", async () => {
    const { groups, rowsOf, boxOf } = await mount(
      <>
        <Options size="sm" />
        <Options size="md" />
        <Options size="lg" />
      </>,
    );
    for (const [i, { box, row }] of Object.values(SIZES).entries()) {
      for (const el of rowsOf(groups[i] as Element)) {
        close(rect(el).height, row);
        close(rect(boxOf(el)).width, box);
        close(rect(boxOf(el)).height, box);
      }
    }
  });

  test("the box sits as far from the row's start as from its top and bottom", async () => {
    const { groups, rowsOf, boxOf } = await mount(
      <>
        <Options size="sm" />
        <Options size="md" />
        <Options size="lg" />
      </>,
    );
    for (const group of groups) {
      const [row] = rowsOf(group) as [HTMLElement];
      const gap = insets(row, boxOf(row));
      close(gap.left, gap.top);
      close(gap.bottom, gap.top);
    }
  });

  test("rows stack with no gap, and the group is as wide as its widest row", async () => {
    const { groups, rowsOf } = await mount(<Options />);
    const [first, second] = rowsOf(groups[0] as Element) as [HTMLElement, HTMLElement];
    close(rect(second).top, rect(first).bottom);
    const widest = Math.max(rect(first).width, rect(second).width);
    close(rect(groups[0] as Element).width, widest);
  });

  test("in a right-to-left page the box is at the right, as far from that edge", async () => {
    const { groups, rowsOf, boxOf } = await mount(<Options />, "rtl");
    const [row] = rowsOf(groups[0] as Element) as [HTMLElement];
    const gap = insets(row, boxOf(row));
    close(gap.right, gap.top);
    expect(gap.left).toBeGreaterThan(gap.right);
  });

  test("a label that wraps keeps the box on its first line", async () => {
    const { groups, rowsOf, boxOf } = await mount(
      <div style={{ inlineSize: 120 }}>
        <CheckboxGroup aria-label="Long">
          <label>
            <Checkbox.Root value="a" />A label long enough to wrap onto several lines
          </label>
        </CheckboxGroup>
      </div>,
    );
    const [row] = rowsOf(groups[0] as Element) as [HTMLElement];
    expect(rect(row).height).toBeGreaterThan(SIZES.md.row);
    const gap = insets(row, boxOf(row));
    close(gap.top, (SIZES.md.row - SIZES.md.box) / 2);
  });
});
