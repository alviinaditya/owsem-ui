import { type CSSProperties, useState } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, nested, TOL } from "../../../test/geometry.ts";
import { Select, type SelectSize } from "./index";

// FR-9's rule at line-height 1.25: the trigger's --py as Button's, rows as Menu's (40px at lg).
const SIZES: Record<SelectSize, { trigger: number; row: number; icon: number }> = {
  sm: { trigger: 32, row: 32, icon: 15 },
  md: { trigger: 40, row: 33, icon: 16 },
  lg: { trigger: 48, row: 40, icon: 18 },
};
const VALUES = ["apple", "banana", "cherry", "mango"];

function Fruits({
  size,
  value,
  wrapper,
  values = VALUES,
  width = 200,
}: {
  size: SelectSize;
  value: string | null;
  wrapper?: CSSProperties;
  values?: string[];
  width?: number;
}) {
  const [items] = useState(() => values.map((v) => ({ value: v, label: v.toUpperCase() })));
  return (
    <div style={{ padding: "160px 120px", ...wrapper }}>
      <Select.Root items={items} defaultOpen defaultValue={value} size={size}>
        <Select.Trigger aria-label="Fruit" style={{ inlineSize: width }} placeholder="Pick" />
        <Select.Popup>
          {items.map((item) => (
            <Select.Item key={item.value} value={item.value}>
              {item.label}
            </Select.Item>
          ))}
        </Select.Popup>
      </Select.Root>
    </div>
  );
}

const el = (selector: string) => document.querySelector(selector) as HTMLElement;

/** Open, then finish the open transition, so boxes are at full size. Over the trigger by default. */
async function landed(side = "none") {
  await expect
    .poll(() => document.querySelector(".ow-select__popup:not([data-starting-style])"))
    .not.toBeNull();
  await expect.poll(() => el(".ow-select__popup").getAttribute("data-side")).toBe(side);
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
}

const selectedText = () => el('[aria-selected="true"] .ow-select__item-text');

describe("Select geometry (FR-9, FR-10, FR-10b)", () => {
  for (const [size, expected] of Object.entries(SIZES) as [SelectSize, typeof SIZES.md][]) {
    test(`${size}: a ${expected.trigger} px trigger, ${expected.row} px rows, icons even, one radius`, async () => {
      await render(<Fruits size={size} value="cherry" />);
      await landed();
      const trigger = el(".ow-select__trigger");
      expect(trigger.getBoundingClientRect().height).toBeCloseTo(expected.trigger, 1);
      const icon = el(".ow-select__icon");
      expect(icon.getBoundingClientRect().width).toBeCloseTo(expected.icon, 1);
      const gap = insets(trigger, icon);
      expect(Math.abs(gap.right - gap.top)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(gap.top - gap.bottom)).toBeLessThanOrEqual(TOL);
      const rows = [...document.querySelectorAll<HTMLElement>(".ow-select__item")];
      expect(rows).toHaveLength(4);
      for (const row of rows) {
        expect(row.getBoundingClientRect().height).toBeCloseTo(expected.row, 1);
      }
      const row = rows[0] as HTMLElement;
      const check = el(".ow-select__item-indicator");
      expect(check.getBoundingClientRect().width).toBeCloseTo(expected.icon, 1);
      // At the row's end, as even from its edge as the trigger's icon is. At sm the rows give up the
      // popup's 4px padding at the sides, so the text and the check line up with the trigger's.
      const inset = insets(row, check);
      const sideLess = size === "sm" ? 4 : 0;
      expect(Math.abs(inset.right + sideLess - inset.top)).toBeLessThanOrEqual(TOL);
      // One radius outside, and the rows follow it, less the padding (TK-8).
      const ring = nested(el(".ow-select__popup"), row);
      expect(ring.outerDelta).toBeLessThanOrEqual(TOL);
      expect(ring.innerDelta).toBeLessThanOrEqual(TOL);
      expect(ring.insetDelta).toBeLessThanOrEqual(TOL);
    });

    test(`${size}: the selected text lands on the trigger's, and the popup ends where it ends`, async () => {
      // Fractional offsets, as at 110% zoom or in a centered layout.
      await render(
        <Fruits size={size} value="cherry" wrapper={{ padding: "160.37px 120.73px" }} />,
      );
      await landed();
      const trigger = el(".ow-select__trigger").getBoundingClientRect();
      const value = el(".ow-select__value").getBoundingClientRect();
      const text = selectedText().getBoundingClientRect();
      expect(Math.abs(text.left - value.left)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(text.top - value.top)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(text.height - value.height)).toBeLessThanOrEqual(TOL);
      // It covers the trigger at its width: the check sits at the end, where the trigger's icon is.
      const popup = el(".ow-select__popup").getBoundingClientRect();
      expect(Math.abs(popup.right - trigger.right)).toBeLessThanOrEqual(TOL);
      expect(popup.left).toBeLessThanOrEqual(trigger.left + TOL);
      const icon = el(".ow-select__icon").getBoundingClientRect();
      const check = el('[aria-selected="true"] .ow-select__item-indicator').getBoundingClientRect();
      expect(Math.abs(check.right - icon.right)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(check.top - icon.top)).toBeLessThanOrEqual(TOL);
    });

    test(`${size}: over a narrow trigger it grows to fit an item's text and check, cutting none`, async () => {
      await render(
        <Fruits
          size={size}
          value="apple"
          values={["apple", "a much longer dragon fruit"]}
          width={120}
        />,
      );
      await landed();
      const trigger = el(".ow-select__trigger").getBoundingClientRect();
      const popup = el(".ow-select__popup").getBoundingClientRect();
      expect(popup.width).toBeGreaterThan(trigger.width + 20);
      for (const text of document.querySelectorAll<HTMLElement>(".ow-select__item-text")) {
        expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
      }
      // The selected text still lands on the trigger's.
      const value = el(".ow-select__value").getBoundingClientRect();
      expect(
        Math.abs(selectedText().getBoundingClientRect().left - value.left),
      ).toBeLessThanOrEqual(TOL);
    });

    for (const [where, value] of [
      ["first", "apple"],
      ["last", "mango"],
    ] as const) {
      test(`${size}: with the ${where} item selected, the popup still covers the trigger`, async () => {
        await render(<Fruits size={size} value={value} />);
        await landed();
        const trigger = el(".ow-select__trigger").getBoundingClientRect();
        const value2 = el(".ow-select__value").getBoundingClientRect();
        const text = selectedText().getBoundingClientRect();
        expect(Math.abs(text.top - value2.top)).toBeLessThanOrEqual(TOL);
        const popup = el(".ow-select__popup").getBoundingClientRect();
        expect(popup.top).toBeLessThanOrEqual(trigger.top + TOL);
        expect(popup.bottom).toBeGreaterThanOrEqual(trigger.bottom - TOL);
      });
    }
  }

  test("a list longer than the screen still lands, with both arrows, in the popup's edge", async () => {
    const years = Array.from({ length: 60 }, (_, i) => String(2000 + i));
    await render(
      <div style={{ padding: "160px 120px" }}>
        <Select.Root defaultOpen defaultValue="2030">
          <Select.Trigger aria-label="Year" />
          <Select.Popup>
            {years.map((year) => (
              <Select.Item key={year} value={year}>
                {year}
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Root>
      </div>,
    );
    await landed();
    const value = el(".ow-select__value").getBoundingClientRect();
    const text = selectedText().getBoundingClientRect();
    expect(Math.abs(text.left - value.left)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(text.top - value.top)).toBeLessThanOrEqual(TOL);
    await expect.poll(() => document.querySelector(".ow-select__scroll-up-arrow")).not.toBeNull();
    await expect.poll(() => document.querySelector(".ow-select__scroll-down-arrow")).not.toBeNull();
    const popup = el(".ow-select__popup");
    const list = el(".ow-select__list");
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    // Inside the screen, and the arrows inside the popup's 1px edge.
    expect(popup.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    const up = insets(popup, el(".ow-select__scroll-up-arrow"));
    expect(up.top).toBeCloseTo(1, 1);
    expect(up.left).toBeCloseTo(1, 1);
    const down = insets(popup, el(".ow-select__scroll-down-arrow"));
    expect(down.bottom).toBeCloseTo(1, 1);
  });

  test("beside the trigger (multiple), the popup is at least as wide as it", async () => {
    await render(
      <div style={{ padding: "160px 120px" }}>
        <Select.Root multiple defaultOpen defaultValue={["apple"]}>
          <Select.Trigger aria-label="Fruits" style={{ inlineSize: 260 }} />
          <Select.Popup>
            {VALUES.map((value) => (
              <Select.Item key={value} value={value}>
                {value}
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Root>
      </div>,
    );
    await landed("bottom");
    const trigger = el(".ow-select__trigger").getBoundingClientRect();
    const popup = el(".ow-select__popup").getBoundingClientRect();
    expect(Math.abs(popup.width - trigger.width)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(popup.left - trigger.left)).toBeLessThanOrEqual(TOL);
    expect(popup.top).toBeGreaterThan(trigger.bottom);
  });

  test("an empty value holds the trigger's height", async () => {
    await render(
      <Select.Root defaultValue={null}>
        <Select.Trigger aria-label="Fruit" />
        <Select.Popup>
          <Select.Item value="a">A</Select.Item>
        </Select.Popup>
      </Select.Root>,
    );
    expect(el(".ow-select__trigger").getBoundingClientRect().height).toBeCloseTo(40, 1);
  });

  test("--py set through style drives the trigger's height, floored at 24px (FR-14)", async () => {
    await render(
      <>
        <Select.Root defaultValue="a">
          <Select.Trigger
            aria-label="Tall"
            data-testid="tall"
            style={{ "--py": "1em" } as CSSProperties}
          />
          <Select.Popup>
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Root>
        <Select.Root defaultValue="a">
          <Select.Trigger
            aria-label="Tiny"
            data-testid="tiny"
            style={{ "--py": "0px" } as CSSProperties}
          />
          <Select.Popup>
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Root>
      </>,
    );
    expect(el('[data-testid="tall"]').getBoundingClientRect().height).toBeCloseTo(45.5, 1);
    expect(el('[data-testid="tiny"]').getBoundingClientRect().height).toBeCloseTo(24, 1);
  });
});
