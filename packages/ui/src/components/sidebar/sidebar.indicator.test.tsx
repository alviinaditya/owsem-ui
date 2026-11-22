import { type ComponentProps, createRef, type Ref, useState } from "react";
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

// The Indicator's ref goes through its own prop.
function Nav({
  active,
  indicatorRef,
  ...props
}: { active?: string; indicatorRef?: Ref<HTMLSpanElement> } & ComponentProps<
  typeof Sidebar.Indicator
>) {
  return (
    <Sidebar.Provider>
      <Sidebar.Root style={{ blockSize: 400 }}>
        <Sidebar.Content>
          <Sidebar.Indicator {...props} ref={indicatorRef} />
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
      <button type="button" onClick={() => setActive("/switch")}>
        go far
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
const body = () => q(".ow-sidebar__liquid rect");
const dot = () => q(".ow-sidebar__liquid-dot");
const mid = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.top + r.height / 2;
};
/** How far the background and the dot are from sitting on the item (0 when they do). */
const off = (name: string) => () => {
  const l = link(name).getBoundingClientRect();
  const b = body().getBoundingClientRect();
  return Math.max(
    Math.abs(mid(body()) - mid(link(name))),
    Math.abs(mid(dot()) - mid(link(name))),
    Math.abs(b.left - l.left),
    Math.abs(b.right - l.right),
  );
};
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const slow = (scale: number) => root.style.setProperty("--ow-motion-scale", String(scale));

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await commands.setReducedMotion("no-preference");
  root.style.removeProperty("--ow-accent");
  root.style.removeProperty("--ow-motion-scale");
});

describe("Sidebar.Indicator", () => {
  test("at rest: the background spans the row, the dot sits in the gutter, nothing moves", async () => {
    await render(<Nav active="/input" />);
    await expect.poll(off("Input")).toBeLessThan(0.6);
    expect(pill().hasAttribute("data-visible")).toBe(true);
    expect(pill().hasAttribute("data-moving")).toBe(false);
    await expect.poll(() => getComputedStyle(pill()).opacity).toBe("1");
    const l = link("Input").getBoundingClientRect();
    const b = body().getBoundingClientRect();
    expect(Math.abs(b.height - (l.height - 2))).toBeLessThan(0.6);
    const d = dot().getBoundingClientRect();
    expect(Math.abs(d.left + d.width / 2 - (l.left + 6))).toBeLessThan(0.6);
    expect(Math.abs(d.width - 7)).toBeLessThan(0.6);
    expect(link("Input").hasAttribute("data-landed")).toBe(true);
    expect(link("Button").hasAttribute("data-landed")).toBe(false);
    // Only the fade-in runs; nothing slides in.
    const running = document
      .getAnimations()
      .filter((a) => (a.effect as KeyframeEffect | null)?.target === pill());
    expect(
      running.filter((a) => (a as CSSTransition).transitionProperty !== "opacity"),
    ).toHaveLength(0);
  });

  test("the rows read the accent: the dot is the accent, the background a tint of it", async () => {
    root.style.setProperty("--ow-accent", "rgb(1, 2, 3)");
    await render(<Nav active="/button" />);
    await expect.poll(off("Button")).toBeLessThan(0.6);
    expect(getComputedStyle(dot()).fill).toBe("rgb(1, 2, 3)");
    const tint = getComputedStyle(body()).fill;
    expect(tint).not.toBe("rgb(1, 2, 3)");
    expect(tint).not.toBe("none");
    expect(getComputedStyle(pill()).willChange).toContain("opacity");
  });

  test("it is behind the rows and takes no space", async () => {
    await render(<Nav active="/button" />);
    expect(getComputedStyle(pill()).zIndex).toBe("-1");
    expect(pill().getBoundingClientRect().width).toBe(0);
    expect(q(".ow-sidebar__liquid").getAttribute("aria-hidden")).toBe("true");
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

  test("reduced motion: it follows an active change by jumping", async () => {
    await commands.setReducedMotion("reduce");
    const screen = await render(<Switcher />);
    await expect.poll(off("Button")).toBeLessThan(0.6);
    await screen.getByText("go", { exact: true }).click();
    await expect.poll(off("Input")).toBeLessThan(0.6);
    expect(pill().hasAttribute("data-moving")).toBe(false);
    expect(link("Input").hasAttribute("data-landed")).toBe(true);
    expect(link("Button").hasAttribute("data-landed")).toBe(false);
  });

  test("--ow-motion-scale: 0 jumps too", async () => {
    slow(0);
    const screen = await render(<Switcher />);
    await expect.poll(off("Button")).toBeLessThan(0.6);
    await screen.getByText("go", { exact: true }).click();
    await expect.poll(off("Input")).toBeLessThan(0.6);
    expect(pill().hasAttribute("data-moving")).toBe(false);
  });

  test("moves on click before active changes, and returns after the delay", async () => {
    await commands.setReducedMotion("reduce");
    await render(<Nav active="/button" />);
    await expect.poll(off("Button")).toBeLessThan(0.6);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    link("Switch").addEventListener("click", (e) => e.preventDefault());
    link("Switch").click();
    expect(off("Switch")()).toBeLessThan(0.6);
    vi.advanceTimersByTime(PENDING_MS - 100);
    expect(off("Switch")()).toBeLessThan(0.6);
    vi.advanceTimersByTime(200);
    expect(off("Button")()).toBeLessThan(0.6);
  });

  test("a modified click or a disabled item does not move it", async () => {
    await commands.setReducedMotion("reduce");
    await render(<Nav active="/button" />);
    await expect.poll(off("Button")).toBeLessThan(0.6);
    link("Switch").addEventListener("click", (e) => e.preventDefault());
    link("Switch").dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    expect(off("Button")()).toBeLessThan(0.6);
  });

  test("Enter on an item moves it", async () => {
    await commands.setReducedMotion("reduce");
    await render(<Nav active="/button" />);
    await expect.poll(off("Button")).toBeLessThan(0.6);
    link("Switch").addEventListener("click", (e) => e.preventDefault());
    link("Switch").focus();
    await userEvent.keyboard("{Enter}");
    expect(off("Switch")()).toBeLessThan(0.6);
  });

  test("a move shrinks, drips and fills, then lands on the new item and goes idle", async () => {
    slow(4);
    const screen = await render(<Switcher />);
    await expect.poll(off("Button")).toBeLessThan(0.6);
    await screen.getByText("go", { exact: true }).click();
    await expect.poll(() => pill().hasAttribute("data-moving")).toBe(true);
    // Not landed yet: the old item has lost its look, the new one has not gained it.
    expect(link("Input").hasAttribute("data-landed")).toBe(false);
    expect(link("Button").hasAttribute("data-landed")).toBe(false);
    // While it drips, a teardrop path is drawn.
    await expect
      .poll(() => (q(".ow-sidebar__liquid path:nth-of-type(2)").getAttribute("d") ?? "").length, {
        timeout: 4000,
      })
      .toBeGreaterThan(0);
    await expect.poll(off("Input"), { timeout: 6000 }).toBeLessThan(0.6);
    await expect.poll(() => pill().hasAttribute("data-moving"), { timeout: 3000 }).toBe(false);
    expect(link("Input").hasAttribute("data-landed")).toBe(true);
    expect(q(".ow-sidebar__liquid path").getAttribute("d")).toBe("");
    // Idle: no animation frame is asked for.
    const raf = vi.spyOn(window, "requestAnimationFrame");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(raf).not.toHaveBeenCalled();
  });

  test("a re-pick mid-drip changes course and ends on the new item", async () => {
    slow(4);
    const screen = await render(<Switcher />);
    await expect.poll(off("Button")).toBeLessThan(0.6);
    await screen.getByText("go", { exact: true }).click();
    await expect
      .poll(() => (q(".ow-sidebar__liquid path:nth-of-type(2)").getAttribute("d") ?? "").length, {
        timeout: 4000,
      })
      .toBeGreaterThan(0);
    await screen.getByText("go far").click();
    await expect.poll(off("Switch"), { timeout: 8000 }).toBeLessThan(0.6);
    await expect.poll(() => pill().hasAttribute("data-moving"), { timeout: 3000 }).toBe(false);
    expect(link("Switch").hasAttribute("data-landed")).toBe(true);
    expect(link("Input").hasAttribute("data-landed")).toBe(false);
  });

  test("className and the ref reach the span", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Nav active="/button" className="mine-pill" indicatorRef={ref} />);
    expect(pill().classList.contains("mine-pill")).toBe(true);
    expect(pill().classList.contains("ow-sidebar__indicator")).toBe(true);
    expect(ref.current).toBe(pill());
  });

  test("has no axe violations", async () => {
    const screen = await render(<Nav active="/button" />);
    expect((await axeReport(screen.container)).violations).toEqual([]);
  });

  describe("loading pulse", () => {
    const pulse = () => q(".ow-sidebar__pulse");
    const arrive: { fn: () => void } = { fn: () => {} };
    function Pending() {
      const [active, setActive] = useState("/button");
      arrive.fn = () => setActive("/switch");
      return <Nav active={active} />;
    }
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const click = () => {
      link("Switch").addEventListener("click", (e) => e.preventDefault());
      link("Switch").click();
    };
    const waiting = () => pill().hasAttribute("data-waiting");

    test("shows only after the move ends, on the dot, with CSS animations on transform and opacity", async () => {
      await render(<Pending />);
      await expect.poll(off("Button")).toBeLessThan(0.6);
      click();
      expect(waiting()).toBe(false);
      await expect.poll(() => pill().hasAttribute("data-moving")).toBe(true);
      expect(waiting()).toBe(false);
      await expect.poll(waiting).toBe(true);
      expect(pill().hasAttribute("data-moving")).toBe(false);
      expect(Math.abs(mid(pulse()) - mid(link("Switch")))).toBeLessThan(0.6);
      const p = pulse().getBoundingClientRect();
      const d = dot().getBoundingClientRect();
      expect(Math.abs(p.left + p.width / 2 - (d.left + d.width / 2))).toBeLessThan(0.6);
      expect(Math.abs(p.width - 7)).toBeLessThan(0.6);
      const anims = pulse().getAnimations({ subtree: true });
      expect(anims.length).toBe(2);
      for (const a of anims) {
        expect(a).toBeInstanceOf(CSSAnimation);
        for (const frame of (a.effect as KeyframeEffect).getKeyframes()) {
          const props = Object.keys(frame).filter(
            (k) => !["offset", "computedOffset", "easing", "composite"].includes(k),
          );
          for (const k of props) expect(["transform", "opacity"]).toContain(k);
        }
      }
    });

    test("runs no requestAnimationFrame while pulsing", async () => {
      await render(<Pending />);
      await expect.poll(off("Button")).toBeLessThan(0.6);
      click();
      await expect.poll(waiting).toBe(true);
      const spy = vi.spyOn(window, "requestAnimationFrame");
      await wait(400);
      expect(waiting()).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    test("stops when active arrives, and the dot stays", async () => {
      await render(<Pending />);
      await expect.poll(off("Button")).toBeLessThan(0.6);
      click();
      await expect.poll(waiting).toBe(true);
      arrive.fn();
      await expect.poll(waiting).toBe(false);
      expect(getComputedStyle(pulse()).display).toBe("none");
      expect(off("Switch")()).toBeLessThan(0.6);
    });

    test("the revert after PENDING_MS stops it before the move back", async () => {
      await render(<Pending />);
      await expect.poll(off("Button")).toBeLessThan(0.6);
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      click();
      for (let i = 0; i < 120 && !waiting(); i++) await frame();
      expect(waiting()).toBe(true);
      vi.advanceTimersByTime(PENDING_MS);
      expect(waiting()).toBe(false);
      expect(pill().hasAttribute("data-moving")).toBe(true);
    });

    test("an early active never pulses", async () => {
      await render(<Pending />);
      await expect.poll(off("Button")).toBeLessThan(0.6);
      let seen = false;
      new MutationObserver(() => {
        if (waiting()) seen = true;
      }).observe(pill(), { attributes: true, attributeFilter: ["data-waiting"] });
      link("Switch").addEventListener("click", (e) => {
        e.preventDefault();
        arrive.fn();
      });
      link("Switch").click();
      await expect.poll(off("Switch")).toBeLessThan(0.6);
      await wait(300);
      expect(seen).toBe(false);
      expect(waiting()).toBe(false);
    });

    test("a new click stops it and starts the normal move", async () => {
      await render(<Pending />);
      await expect.poll(off("Button")).toBeLessThan(0.6);
      click();
      await expect.poll(waiting).toBe(true);
      link("Input").addEventListener("click", (e) => e.preventDefault());
      link("Input").click();
      expect(waiting()).toBe(false);
      expect(pill().hasAttribute("data-moving")).toBe(true);
    });

    test("reduced motion: no animation", async () => {
      await commands.setReducedMotion("reduce");
      await render(<Pending />);
      await expect.poll(off("Button")).toBeLessThan(0.6);
      click();
      await expect.poll(off("Switch")).toBeLessThan(0.6);
      expect(pulse().getAnimations({ subtree: true })).toHaveLength(0);
    });
  });
});
