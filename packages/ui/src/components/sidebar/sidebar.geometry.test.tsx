import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { TOL } from "../../../test/geometry.ts";
import { Sidebar } from "./index";

async function mount(dir: "ltr" | "rtl") {
  const screen = await render(
    <div dir={dir}>
      <Sidebar.Provider>
        <Sidebar.Root style={{ inlineSize: 200, blockSize: 300 }}>
          <Sidebar.Content>
            <Sidebar.Group>
              <Sidebar.GroupLabel>Display</Sidebar.GroupLabel>
              <Sidebar.List>
                <Sidebar.Item href="#a" active>
                  Button
                </Sidebar.Item>
                <Sidebar.Item href="#b">
                  A label that is far too long to fit in two hundred pixels
                  <Sidebar.ItemBadge>New</Sidebar.ItemBadge>
                </Sidebar.Item>
                <Sidebar.Item href="#c">Input</Sidebar.Item>
              </Sidebar.List>
            </Sidebar.Group>
            <Sidebar.Group>
              <Sidebar.GroupLabel>Forms</Sidebar.GroupLabel>
              <Sidebar.List>
                <Sidebar.Item href="#d">Select</Sidebar.Item>
              </Sidebar.List>
            </Sidebar.Group>
          </Sidebar.Content>
        </Sidebar.Root>
      </Sidebar.Provider>
    </div>,
  );
  const all = (selector: string) => [...screen.container.querySelectorAll<HTMLElement>(selector)];
  return { all, one: (selector: string) => all(selector)[0] as HTMLElement };
}

describe.each(["ltr", "rtl"] as const)("Sidebar geometry, %s", (dir) => {
  test("items are 32px tall, 2px apart, with 10px inline padding after the 12px gutter", async () => {
    const { all } = await mount(dir);
    const links = all(".ow-sidebar__link");
    const [a, b, c] = links.map((l) => l.getBoundingClientRect());
    if (!a || !b || !c) throw new Error("no links");
    for (const r of [a, b, c]) expect(Math.abs(r.height - 32)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(b.top - a.bottom - 2)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(c.top - b.bottom - 2)).toBeLessThanOrEqual(TOL);
    const label = (links[0] as HTMLElement)
      .querySelector(".ow-sidebar__label")
      ?.getBoundingClientRect();
    if (!label) throw new Error("no label");
    const inset = dir === "ltr" ? label.left - a.left : a.right - label.right;
    expect(Math.abs(inset - 22)).toBeLessThanOrEqual(TOL);
  });

  test("a long label is cut with an ellipsis and keeps the badge in the row", async () => {
    const { all } = await mount(dir);
    const long = all(".ow-sidebar__link")[1] as HTMLElement;
    const label = long.querySelector(".ow-sidebar__label") as HTMLElement;
    const badge = long.querySelector(".ow-sidebar__badge") as HTMLElement;
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    const row = long.getBoundingClientRect();
    const b = badge.getBoundingClientRect();
    const l = label.getBoundingClientRect();
    expect(b.left).toBeGreaterThanOrEqual(row.left - TOL);
    expect(b.right).toBeLessThanOrEqual(row.right + TOL);
    expect(l.right <= b.left + TOL || l.left >= b.right - TOL).toBe(true);
    expect(row.height).toBeLessThanOrEqual(32 + TOL);
  });

  test("a group after the first starts 20px below the one before", async () => {
    const { all } = await mount(dir);
    const [first, second] = all(".ow-sidebar__group").map((g) => g.getBoundingClientRect());
    if (!first || !second) throw new Error("no groups");
    expect(Math.abs(second.top - first.bottom - 20)).toBeLessThanOrEqual(TOL);
  });

  test("the group label is 12px uppercase, muted", async () => {
    const { one } = await mount(dir);
    const style = getComputedStyle(one(".ow-sidebar__group-label"));
    expect(style.fontSize).toBe("12px");
    expect(style.textTransform).toBe("uppercase");
    expect(style.fontWeight).toBe("500");
  });
});
