import { type ComponentProps, useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { Sidebar } from "./index";
import { PENDING_MS } from "./sidebar.indicator";

const root = document.documentElement;
const items = [
  ["/button", "Button"],
  ["/badge", "Badge"],
  ["/input", "Input"],
  ["/switch", "Switch"],
] as const;

function Nav({ active, ...props }: { active?: string } & ComponentProps<typeof Sidebar.Indicator>) {
  return (
    <Sidebar.Provider>
      <Sidebar.Root style={{ blockSize: 400 }}>
        <Sidebar.Content>
          <Sidebar.Indicator {...props} />
          <Sidebar.Group>
            <Sidebar.GroupLabel>Display</Sidebar.GroupLabel>
            <Sidebar.List>
              {items.slice(0, 2).map(([href, name]) => (
                <Sidebar.Item key={href} href={href} active={href === active}>
                  {name}
                </Sidebar.Item>
              ))}
            </Sidebar.List>
          </Sidebar.Group>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Forms</Sidebar.GroupLabel>
            <Sidebar.List>
              {items.slice(2).map(([href, name]) => (
                <Sidebar.Item key={href} href={href} active={href === active}>
                  {name}
                </Sidebar.Item>
              ))}
            </Sidebar.List>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar.Root>
    </Sidebar.Provider>
  );
}

function Switcher() {
  const [active, setActive] = useState("/button");
  return (
    <>
      <button type="button" onClick={() => setActive("/input")}>
        go
      </button>
      <Nav active={active} />
    </>
  );
}

const q = (selector: string) => document.querySelector<HTMLElement>(selector) as HTMLElement;
const link = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(".ow-sidebar__link")].find((a) =>
    a.textContent?.startsWith(name),
  ) as HTMLElement;
const pill = () => q(".ow-sidebar__indicator");
const mid = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.top + r.height / 2;
};
const settled = (name: string) => () => Math.abs(mid(pill()) - mid(link(name)));
const mine = () =>
  document.getAnimations().filter((a) => (a.effect as KeyframeEffect).target === pill());
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

afterEach(async () => {
  vi.useRealTimers();
  await commands.setReducedMotion("no-preference");
  root.style.removeProperty("--ow-accent");
  root.style.removeProperty("--ow-motion-scale");
});

describe("Sidebar.Indicator", () => {
  test("lands centered on the active item, in the gutter, with no animation", async () => {
    await render(<Nav active="/input" />);
    await expect.poll(settled("Input")).toBeLessThan(0.6);
    expect(pill().hasAttribute("data-visible")).toBe(true);
    await expect.poll(() => getComputedStyle(pill()).opacity).toBe("1");
    const p = pill().getBoundingClientRect();
    const l = link("Input").getBoundingClientRect();
    const label = q(".ow-sidebar__group-label").getBoundingClientRect();
    expect(p.right).toBeLessThanOrEqual(l.left + 0.5);
    expect(p.left).toBeGreaterThanOrEqual(label.left - 0.5);
    expect(p.width).toBe(3);
    // Only the fade-in: it never slides in.
    expect(
      mine().filter((a) => (a as CSSTransition).transitionProperty !== "opacity"),
    ).toHaveLength(0);
  });

  test("group labels stay in the flow: no layer of their own, no background", async () => {
    await render(<Nav active="/button" />);
    const label = q(".ow-sidebar__group-label");
    const style = getComputedStyle(label);
    expect(style.position).toBe("static");
    expect(style.zIndex).toBe("auto");
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    const list = q(".ow-sidebar__list").getBoundingClientRect();
    expect(label.getBoundingClientRect().bottom).toBeLessThanOrEqual(list.top + 0.5);
  });

  test("is hidden with no active item", async () => {
    await render(<Nav />);
    await frame();
    expect(pill().hasAttribute("data-visible")).toBe(false);
    expect(getComputedStyle(pill()).opacity).toBe("0");
  });

  test("follows an active change, and the active item has no fill", async () => {
    await commands.setReducedMotion("reduce");
    const screen = await render(<Switcher />);
    await expect.poll(settled("Button")).toBeLessThan(0.6);
    await screen.getByText("go").click();
    await expect.poll(settled("Input")).toBeLessThan(0.6);
    expect(getComputedStyle(link("Input")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("moves on click before active changes, and returns after the delay", async () => {
    await commands.setReducedMotion("reduce");
    await render(<Nav active="/button" />);
    await expect.poll(settled("Button")).toBeLessThan(0.6);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    link("Switch").addEventListener("click", (e) => e.preventDefault());
    link("Switch").click();
    expect(settled("Switch")()).toBeLessThan(0.6);
    vi.advanceTimersByTime(PENDING_MS - 100);
    expect(settled("Switch")()).toBeLessThan(0.6);
    vi.advanceTimersByTime(200);
    expect(settled("Button")()).toBeLessThan(0.6);
  });

  test("a modified click or a disabled item does not move it", async () => {
    await commands.setReducedMotion("reduce");
    await render(<Nav active="/button" />);
    await expect.poll(settled("Button")).toBeLessThan(0.6);
    link("Switch").addEventListener("click", (e) => e.preventDefault());
    link("Switch").dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    expect(settled("Button")()).toBeLessThan(0.6);
  });

  test("Enter on an item moves it", async () => {
    await commands.setReducedMotion("reduce");
    await render(<Nav active="/button" />);
    await expect.poll(settled("Button")).toBeLessThan(0.6);
    link("Switch").addEventListener("click", (e) => e.preventDefault());
    link("Switch").focus();
    await userEvent.keyboard("{Enter}");
    expect(settled("Switch")()).toBeLessThan(0.6);
  });

  test("travels with a leading-edge stretch, and idle has no animations or frames", async () => {
    const screen = await render(<Switcher />);
    await expect.poll(settled("Button")).toBeLessThan(0.6);
    await screen.getByText("go").click();
    await expect.poll(() => mine().length).toBeGreaterThan(0);
    const key = mine().find((a) => (a.effect as KeyframeEffect).pseudoElement === "::before");
    const frames = (key?.effect as KeyframeEffect | undefined)?.getKeyframes() ?? [];
    // Down: the bottom edge leads.
    expect(frames[0]?.transformOrigin).toBe("50% 100%");
    await expect.poll(settled("Input"), { timeout: 2000 }).toBeLessThan(0.6);
    await expect.poll(() => mine().length, { timeout: 2000 }).toBe(0);
  });

  test("reduced motion: it jumps, with no stretch", async () => {
    await commands.setReducedMotion("reduce");
    const screen = await render(<Switcher />);
    await expect.poll(settled("Button")).toBeLessThan(0.6);
    expect(getComputedStyle(pill()).transitionProperty).not.toContain("translate");
    await screen.getByText("go").click();
    await expect.poll(settled("Input")).toBeLessThan(0.6);
    expect(mine()).toHaveLength(0);
  });

  test("has its own layer, the accent, and a pill shape", async () => {
    root.style.setProperty("--ow-accent", "rgb(1, 2, 3)");
    await render(<Nav active="/button" />);
    expect(getComputedStyle(pill()).willChange).toContain("translate");
    const key = getComputedStyle(pill(), "::before");
    expect(key.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(key.willChange).toBe("transform");
    expect(Number.parseFloat(key.borderTopLeftRadius)).toBeGreaterThanOrEqual(1.5);
  });

  test("className beats the layer and the ref and render reach it", async () => {
    const style = document.createElement("style");
    style.textContent = ".mine-pill { block-size: 24px; }";
    document.head.append(style);
    try {
      await render(<Nav active="/button" className="mine-pill" />);
      expect(pill().getBoundingClientRect().height).toBe(24);
      await expect.poll(settled("Button")).toBeLessThan(0.6);
    } finally {
      style.remove();
    }
  });

  test("has no axe violations", async () => {
    const screen = await render(<Nav active="/button" />);
    expect((await axeReport(screen.container)).violations).toEqual([]);
  });
});
