import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { ToggleGroup } from "./index";

const root = document.documentElement;
const VIEWS = ["Day", "Week", "Month"] as const;

function Views(props: Partial<ToggleGroup.Root.Props> & { children?: ReactNode }) {
  return (
    <ToggleGroup.Root aria-label="View" defaultValue={["week"]} {...props}>
      {props.children ??
        VIEWS.map((view) => (
          <ToggleGroup.Item key={view} value={view.toLowerCase()}>
            {view}
          </ToggleGroup.Item>
        ))}
    </ToggleGroup.Root>
  );
}

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const group = screen.container.querySelector<HTMLElement>(".ow-toggle-group");
  const thumb = screen.container.querySelector<HTMLElement>(".ow-toggle-group-thumb");
  if (!group || !thumb) throw new Error("not mounted");
  const item = (name: string) => {
    const el = [...group.querySelectorAll<HTMLElement>("button")].find(
      (button) => button.textContent === name || button.getAttribute("aria-label") === name,
    );
    if (!el) throw new Error(`no item ${name}`);
    return el;
  };
  return { screen, group, thumb, item };
}

/** Whether the thumb covers the element exactly (within 0.5 px), as drawn now. */
function over(thumb: Element, el: Element): boolean {
  const a = thumb.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return [a.left - b.left, a.top - b.top, a.width - b.width, a.height - b.height].every(
    (d) => Math.abs(d) <= 0.5,
  );
}

const transitions = (el: Element) =>
  el
    .getAnimations()
    .filter((a): a is CSSTransition => a instanceof CSSTransition)
    .map((a) => a.transitionProperty)
    .sort();

/** Resolves a color (e.g. `var(--ow-raised-bg)`) to its computed rgb() inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Resolves a shadow token to its computed value. */
function resolveShadow(value: string): string {
  const probe = document.createElement("span");
  probe.style.boxShadow = value;
  document.body.append(probe);
  const shadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  return shadow;
}

describe("Toggle Group", () => {
  test("renders Base UI's toggle group: one pressed item, or several with multiple", async () => {
    const { group, item } = await mount(<Views />);
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("View");
    expect(item("Week").getAttribute("aria-pressed")).toBe("true");
    expect(item("Day").getAttribute("aria-pressed")).toBe("false");
    item("Day").click();
    await expect.poll(() => item("Day").getAttribute("aria-pressed")).toBe("true");
    expect(item("Week").getAttribute("aria-pressed")).toBe("false");
    // The thumb is decoration.
    expect(group.querySelector(".ow-toggle-group-thumb")?.getAttribute("aria-hidden")).toBe("true");

    const multiple = await mount(<Views multiple defaultValue={["day"]} />);
    expect(multiple.group.hasAttribute("data-multiple")).toBe(true);
    multiple.item("Month").click();
    await expect.poll(() => multiple.item("Month").getAttribute("aria-pressed")).toBe("true");
    expect(multiple.item("Day").getAttribute("aria-pressed")).toBe("true");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const rootRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLButtonElement>();
    const { group, item } = await mount(
      <ToggleGroup.Root
        ref={rootRef}
        aria-label="Align"
        className="mine"
        style={{ marginBlock: "3px" }}
        defaultValue={["left"]}
      >
        <ToggleGroup.Item
          ref={itemRef}
          value="left"
          className={(state) => (state.pressed ? "on" : "off")}
          style={{ marginInline: "1px" }}
        >
          Left
        </ToggleGroup.Item>
        <ToggleGroup.Item value="right" render={<span />} nativeButton={false}>
          Right
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(rootRef.current).toBe(group);
    expect(group.className).toBe("ow-toggle-group mine");
    expect(group.style.marginBlock).toBe("3px");
    expect(itemRef.current).toBe(item("Left"));
    expect(item("Left").className).toBe("ow-toggle-group-item on");
    expect(item("Left").style.marginInline).toBe("1px");
    const span = group.querySelector('span[role="button"]');
    expect(span?.className).toBe("ow-toggle-group-item");
    expect(span?.textContent).toBe("Right");
  });

  test("draws a sunken track and a raised thumb from the theme tokens, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { group, thumb, item } = await mount(<Views />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const track = getComputedStyle(group);
      expect(track.backgroundColor, theme).toBe(resolveColor("var(--ow-well-bg)"));
      expect(track.boxShadow, theme).toBe(resolveShadow("var(--ow-well-shadow)"));
      const raised = getComputedStyle(thumb);
      expect(raised.backgroundColor, theme).toBe(resolveColor("var(--ow-raised-bg)"));
      expect(raised.boxShadow, theme).toBe(resolveShadow("var(--ow-raised-shadow)"));
      // Labels change color with a short transition.
      await expect
        .poll(() => getComputedStyle(item("Week")).color, { message: theme })
        .toBe(resolveColor("var(--ow-fg)"));
      await expect
        .poll(() => getComputedStyle(item("Day")).color, { message: theme })
        .toBe(resolveColor("var(--ow-muted)"));
    }
  });

  test("component tokens override the theme tokens", async () => {
    const { group, thumb, item } = await mount(
      <Views
        style={
          {
            "--ow-toggle-group-track": "rgb(1, 2, 3)",
            "--ow-toggle-group-thumb": "rgb(4, 5, 6)",
            "--ow-toggle-group-thumb-shadow": "none",
            "--ow-toggle-group-fg": "rgb(7, 8, 9)",
            "--ow-toggle-group-muted": "rgb(10, 11, 12)",
          } as CSSProperties
        }
      />,
    );
    expect(getComputedStyle(group).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(thumb).boxShadow).toBe("none");
    expect(getComputedStyle(item("Week")).color).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(item("Day")).color).toBe("rgb(10, 11, 12)");
  });

  test("places the thumb under the pressed item on mount, without sliding in", async () => {
    const { thumb, item } = await mount(<Views />);
    expect(over(thumb, item("Week"))).toBe(true);
    expect(getComputedStyle(thumb).opacity).toBe("1");
    expect(transitions(thumb)).toEqual([]);
  });

  test("a value that arrives after mount, as on hydration, appears in place", async () => {
    const { screen, thumb, item } = await mount(<Views value={[]} />);
    expect(getComputedStyle(thumb).opacity).toBe("0");
    screen.rerender(<Views value={["month"]} />);
    await expect.poll(() => over(thumb, item("Month"))).toBe(true);
    expect(getComputedStyle(thumb).opacity).toBe("1");
    expect(transitions(thumb)).toEqual([]);
  });

  test("slides to a newly pressed item by transform, and lands on it", async () => {
    const { thumb, item } = await mount(<Views />);
    item("Month").click();
    await expect.poll(() => transitions(thumb)).toEqual(["transform", "translate"]);
    expect(over(thumb, item("Month"))).toBe(false);
    await settle();
    expect(over(thumb, item("Month"))).toBe(true);
  });

  test("snaps, without sliding, when the items resize", async () => {
    const { group, thumb, item } = await mount(<Views />);
    group.style.fontSize = "20px";
    await expect.poll(() => over(thumb, item("Week"))).toBe(true);
    expect(transitions(thumb)).toEqual([]);
  });

  test("presses in while held, the thumb with its item", async () => {
    const { thumb, item } = await mount(<Views />);
    const week = item("Week");
    week.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(week.hasAttribute("data-held")).toBe(true);
    expect(thumb.hasAttribute("data-held")).toBe(true);
    await expect.poll(() => getComputedStyle(thumb).scale).toBe("0.97");
    expect(getComputedStyle(week).scale).toBe("0.97");
    window.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
    await expect.poll(() => thumb.hasAttribute("data-held")).toBe(false);
    expect(week.hasAttribute("data-held")).toBe(false);
    await settle();
    expect(getComputedStyle(thumb).scale).toBe("none");

    // Holding another item leaves the thumb as it is.
    const day = item("Day");
    day.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(day.hasAttribute("data-held")).toBe(true);
    expect(thumb.hasAttribute("data-held")).toBe(false);
    window.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
  });

  test("with multiple selection, each pressed item is raised and there is no thumb", async () => {
    const { thumb, item } = await mount(<Views multiple defaultValue={["day", "month"]} />);
    expect(getComputedStyle(thumb).opacity).toBe("0");
    const raised = (name: string) =>
      getComputedStyle(item(name)).backgroundColor === resolveColor("var(--ow-raised-bg)");
    expect(raised("Day")).toBe(true);
    expect(raised("Month")).toBe(true);
    expect(raised("Week")).toBe(false);
    expect(getComputedStyle(item("Day")).boxShadow).toBe(resolveShadow("var(--ow-raised-shadow)"));
  });

  test("the pressed item raises itself until the thumb is placed", async () => {
    const { group, item } = await mount(<Views />);
    const background = () => getComputedStyle(item("Week")).backgroundColor;
    expect(background()).toBe("rgba(0, 0, 0, 0)");
    // As in server-rendered HTML before hydration.
    group.removeAttribute("data-thumb");
    expect(background()).toBe(resolveColor("var(--ow-raised-bg)"));
  });

  test("keyboard: Tab enters, arrows, Home, and End move focus, Space and Enter press (FR-15)", async () => {
    const { item } = await mount(
      <>
        <button type="button">Before</button>
        <Views>
          <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
          <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
          <ToggleGroup.Item value="month" disabled>
            Month
          </ToggleGroup.Item>
          <ToggleGroup.Item value="year">Year</ToggleGroup.Item>
        </Views>
      </>,
    );
    item("Day").focus();
    expect(document.activeElement).toBe(item("Day"));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(item("Week"));
    // Disabled items are skipped.
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(item("Year"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(item("Day"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(item("Year"));
    // Arrows only move focus; Space and Enter press.
    expect(item("Year").getAttribute("aria-pressed")).toBe("false");
    await userEvent.keyboard(" ");
    await expect.poll(() => item("Year").getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(item("Day"));
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => item("Day").getAttribute("aria-pressed")).toBe("true");
    // One tab stop: Shift+Tab leaves the group.
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement?.textContent).toBe("Before");
  });

  test("right to left: the first item is on the right, under the thumb, and arrows follow (FR-16)", async () => {
    const { thumb, item } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Views defaultValue={["day"]} />
        </div>
      </DirectionProvider>,
    );
    const day = item("Day").getBoundingClientRect();
    const week = item("Week").getBoundingClientRect();
    expect(day.left).toBeGreaterThan(week.left);
    expect(over(thumb, item("Day"))).toBe(true);
    item("Day").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(item("Week"));
  });

  test("stays legible in forced colors: the pressed item is filled with Highlight (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { group, thumb, item } = await mount(<Views />);
    await commands.setForcedColors("active");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    expect(getComputedStyle(thumb).backgroundColor).toBe(resolveColor("Highlight"));
    await expect
      .poll(() => getComputedStyle(item("Week")).color)
      .toBe(resolveColor("HighlightText"));
    await expect.poll(() => getComputedStyle(item("Day")).color).toBe(resolveColor("CanvasText"));
    // The track's edge: an outline that forced colors paint.
    expect(getComputedStyle(group).outlineStyle).toBe("solid");
    expect(getComputedStyle(group).outlineColor).toBe(resolveColor("CanvasText"));
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Views />
        <Views multiple defaultValue={["day", "month"]} size="sm" aria-label="Days" />
        <ToggleGroup.Root aria-label="Align" defaultValue={["left"]} size="lg">
          <ToggleGroup.Item value="left" aria-label="Left">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M3 12h12M3 18h16" />
            </svg>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="right" aria-label="Right" disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M9 12h12M5 18h16" />
            </svg>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      // Labels change color with a short transition; axe reads the colors once they land.
      await settle();
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a change too", async () => {
    const { item } = await mount(<Views />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    item("Month").click();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("with reduced motion, the thumb moves at once and does not press (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { thumb, item } = await mount(<Views />);
    item("Month").click();
    await expect.poll(() => over(thumb, item("Month"))).toBe(true);
    expect(transitions(thumb)).toEqual([]);
    const month = item("Month");
    month.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(thumb.hasAttribute("data-held")).toBe(true);
    expect(getComputedStyle(thumb).scale).toBe("none");
    expect(getComputedStyle(month).scale).toBe("none");
    window.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
  });
});
