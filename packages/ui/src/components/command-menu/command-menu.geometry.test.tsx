import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, TOL, usedRadius } from "../../../test/geometry.ts";
import { CommandMenu, type CommandMenuSize } from "./index";

// FR-11: height 2 × --_py + 1lh, icon font + 2px, and the icon as far from the edge on every side.
const SIZES: Record<CommandMenuSize, { height: number; icon: number; edge: number }> = {
  sm: { height: 29.25, icon: 15, edge: 7.125 },
  md: { height: 38.5, icon: 16, edge: 11.25 },
  lg: { height: 48, icon: 18, edge: 15 },
};

const icon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

async function mount(size: CommandMenuSize) {
  const screen = await render(
    <CommandMenu.Root items={[{ value: "Pages", items: ["Home", "Settings"] }]} defaultOpen>
      <CommandMenu.Trigger size={size}>Search</CommandMenu.Trigger>
      <CommandMenu.Popup aria-label="Commands" size={size}>
        <CommandMenu.Input aria-label="Search" placeholder="Search" />
        <CommandMenu.List>
          {(group: { value: string; items: string[] }) => (
            <CommandMenu.Group key={group.value} items={group.items}>
              <CommandMenu.GroupLabel>{group.value}</CommandMenu.GroupLabel>
              <CommandMenu.Collection>
                {(item: string) => (
                  <CommandMenu.Item key={item} value={item}>
                    <CommandMenu.ItemIcon>{icon}</CommandMenu.ItemIcon>
                    <CommandMenu.ItemLabel>{item}</CommandMenu.ItemLabel>
                  </CommandMenu.Item>
                )}
              </CommandMenu.Collection>
            </CommandMenu.Group>
          )}
        </CommandMenu.List>
      </CommandMenu.Popup>
    </CommandMenu.Root>,
  );
  const get = (selector: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`no ${selector}`);
    return el;
  };
  await expect.poll(() => document.querySelector(".ow-command-menu-item")).not.toBeNull();
  return { screen, get };
}

/** An icon's distance to each edge of its control. */
function iconEdges(control: Element, svg: Element) {
  const gap = insets(control, svg);
  return [gap.top, gap.bottom, gap.left];
}

describe.each(Object.keys(SIZES) as CommandMenuSize[])("Command Menu geometry, %s", (size) => {
  const expected = SIZES[size];

  test("items follow the --py rule, with the icon as far from every edge (FR-9, FR-10)", async () => {
    const { get } = await mount(size);
    const item = get(".ow-command-menu-item");
    const svg = get(".ow-command-menu-item-icon");
    expect(item.getBoundingClientRect().height).toBeCloseTo(expected.height, 1);
    expect(svg.getBoundingClientRect().width).toBeCloseTo(expected.icon, 1);
    for (const edge of iconEdges(item, svg)) expect(edge).toBeCloseTo(expected.edge, 0);
  });

  test("the trigger is as tall as other controls, its icon placed the same way", async () => {
    const { get } = await mount(size);
    const trigger = get(".ow-command-menu-trigger");
    const svg = get(".ow-command-menu-trigger > .ow-command-menu-icon");
    expect(trigger.getBoundingClientRect().height).toBeCloseTo(expected.height, 1);
    expect(svg.getBoundingClientRect().width).toBeCloseTo(expected.icon, 1);
    for (const edge of iconEdges(trigger, svg)) expect(edge).toBeCloseTo(expected.edge, 0);
  });

  test("the panel's radius is the item's plus the padding between them (FR-10b)", async () => {
    const { get } = await mount(size);
    const popup = get(".ow-command-menu-popup");
    const list = get(".ow-command-menu-list");
    const item = get(".ow-command-menu-item");
    const pad = insets(list, item).left;
    expect(insets(popup, item).left).toBeCloseTo(pad, 1);
    expect(Math.abs(usedRadius(popup) - (usedRadius(item) + pad))).toBeLessThanOrEqual(TOL);
  });

  test("the search row and the group labels line up with the items", async () => {
    const { get } = await mount(size);
    const itemIcon = get(".ow-command-menu-item-icon").getBoundingClientRect();
    const fieldIcon = get(".ow-command-menu-field > .ow-command-menu-icon").getBoundingClientRect();
    const label = get(".ow-command-menu-item-label").getBoundingClientRect();
    const input = get(".ow-command-menu-input").getBoundingClientRect();
    expect(fieldIcon.left).toBeCloseTo(itemIcon.left, 0);
    expect(fieldIcon.width).toBeCloseTo(itemIcon.width, 1);
    expect(input.left).toBeCloseTo(label.left, 0);
    // The group's name starts where its items' icons do.
    const group = get(".ow-command-menu-group-label");
    const range = document.createRange();
    range.selectNodeContents(group);
    expect(range.getBoundingClientRect().left).toBeCloseTo(itemIcon.left, 0);
  });
});
