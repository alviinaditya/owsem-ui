import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, rect, TOL } from "../../../test/geometry.ts";
import { Input } from "../input";
import { Combobox, type ComboboxSize } from "./index";

// A Combobox's field is as tall as an Input of its size; its buttons are that less 4px on each side,
// and a chip is a 24px pill centered on the first line.
const SIZES: [ComboboxSize, number, number, number][] = [
  ["sm", 32, 24, 15],
  ["md", 40, 32, 16],
  ["lg", 48, 40, 18],
];
const FRUITS = ["Apple", "Banana", "Cherry"];

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

const q = (selector: string) => document.querySelector(selector) as HTMLElement;

function Single({ size }: { size: ComboboxSize }) {
  return (
    <Combobox.Root items={FRUITS} size={size} defaultValue="Apple">
      <Combobox.InputGroup>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Clear />
        <Combobox.Trigger />
      </Combobox.InputGroup>
    </Combobox.Root>
  );
}

function Chips({ size, picks = 2 }: { size: ComboboxSize; picks?: number }) {
  return (
    <Combobox.Root items={FRUITS} size={size} multiple defaultValue={FRUITS.slice(0, picks)}>
      <Combobox.InputGroup>
        <Combobox.Chips>
          <Combobox.Value>
            {(value: string[]) =>
              value.map((fruit) => (
                <Combobox.Chip key={fruit}>
                  {fruit}
                  <Combobox.ChipRemove aria-label={`Remove ${fruit}`} />
                </Combobox.Chip>
              ))
            }
          </Combobox.Value>
          <Combobox.Input aria-label="Fruits" />
        </Combobox.Chips>
        <Combobox.Clear />
        <Combobox.Trigger />
      </Combobox.InputGroup>
    </Combobox.Root>
  );
}

describe("Combobox geometry", () => {
  test.each(SIZES)(
    "%s: the field is as tall as an Input, and the buttons fit it",
    async (size, height, side, icon) => {
      await render(
        <div style={{ inlineSize: 320, display: "grid", gap: 8 }}>
          <Single size={size} />
          <Input size={size} aria-label="Input" />
        </div>,
      );
      const field = q('[data-slot="combobox-input-group"]');
      close(rect(field).height, height);
      close(rect(field).height, rect(q(".ow-input")).height);
      for (const button of [
        q('[data-slot="combobox-trigger"]'),
        q('[data-slot="combobox-clear"]'),
      ]) {
        close(rect(button).width, side);
        close(rect(button).height, side);
        close(insets(field, button).top, 4);
        close(insets(field, button).bottom, 4);
      }
      close(rect(q('[data-slot="combobox-icon"]')).width, icon);
      close(insets(field, q('[data-slot="combobox-trigger"]')).right, 4);
    },
  );

  test.each(SIZES)("%s: the bare input's text starts where an Input's text does", async (size) => {
    await render(
      <div style={{ inlineSize: 320, display: "grid", gap: 8 }}>
        <Combobox.Root items={FRUITS} size={size}>
          <Combobox.InputGroup>
            <Combobox.Input aria-label="Fruit" />
          </Combobox.InputGroup>
        </Combobox.Root>
        <Input size={size} aria-label="Input" />
      </div>,
    );
    const mine = q('[data-slot="combobox-input"]');
    const input = q(".ow-input");
    const start = (el: HTMLElement) =>
      rect(el).left + Number.parseFloat(getComputedStyle(el).paddingLeft);
    close(
      start(mine) - rect(q('[data-slot="combobox-input-group"]')).left,
      start(input) - rect(input).left,
    );
  });

  test.each(SIZES)(
    "%s: with chips the field is still that tall, and a chip is 24px",
    async (size, height) => {
      await render(
        <div style={{ inlineSize: 360 }}>
          <Chips size={size} />
        </div>,
      );
      const field = q('[data-slot="combobox-input-group"]');
      close(rect(field).height, height);
      for (const chip of document.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]')) {
        close(rect(chip).height, 24);
        const offset = rect(chip).top + rect(chip).height / 2 - (rect(field).top + height / 2);
        close(offset, 0);
      }
      const remove = q('[data-slot="combobox-chip-remove"]');
      close(rect(remove).width, 24);
      close(rect(remove).height, 24);
    },
  );

  test("the first chip starts 4px in, and the chips wrap with the input after them", async () => {
    await render(
      <div style={{ inlineSize: 170 }}>
        <Chips size="md" picks={3} />
      </div>,
    );
    const field = q('[data-slot="combobox-input-group"]');
    const chips = [...document.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]')];
    close(insets(field, chips[0] as HTMLElement).left, 4);
    // Three chips do not fit one line: the field grows, and nothing leaves it.
    expect(rect(field).height).toBeGreaterThan(40);
    for (const chip of chips) {
      expect(rect(chip).right).toBeLessThanOrEqual(rect(field).right + TOL);
    }
    const input = q('[data-slot="combobox-input"]');
    expect(rect(input).right).toBeLessThanOrEqual(rect(field).right + TOL);
  });

  test("right to left: the buttons sit at the start, 4px in, and the chips start at the right", async () => {
    await render(
      <div dir="rtl" style={{ inlineSize: 360 }}>
        <Chips size="md" />
      </div>,
    );
    const field = q('[data-slot="combobox-input-group"]');
    close(rect(field).right - rect(q('[data-slot="combobox-chip"]')).right, 4);
    close(rect(q('[data-slot="combobox-trigger"]')).left - rect(field).left, 4);
  });

  test("a popup is as wide as the field and sits 6px under it", async () => {
    await render(
      <div style={{ inlineSize: 300, margin: "0 40px", paddingBlockEnd: 260 }}>
        <Combobox.Root items={FRUITS} defaultOpen>
          <Combobox.InputGroup>
            <Combobox.Input aria-label="Fruit" />
          </Combobox.InputGroup>
          <Combobox.Popup>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Root>
      </div>,
    );
    await expect
      .poll(() => q('[data-slot="combobox-popup"]:not([data-starting-style])'))
      .not.toBeNull();
    for (const animation of document.getAnimations()) animation.finish();
    const field = rect(q('[data-slot="combobox-input-group"]'));
    const popup = rect(q('[data-slot="combobox-popup"]'));
    expect([popup.width, popup.left, popup.top - field.bottom]).toEqual([
      field.width,
      field.left,
      6,
    ]);
  });
});
