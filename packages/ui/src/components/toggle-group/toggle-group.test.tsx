import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { checkSolidHover, composite, contrast, SOLID_HOVER_TINT } from "../../../test/contrast.ts";
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
  const thumb = screen.container.querySelector<HTMLElement>(".ow-toggle-group__thumb");
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

/**
 * Whether the thumb's key (inside the clear border that keeps the track's padding) covers the
 * element exactly (within 0.5 px), as drawn now.
 */
function over(thumb: Element, el: Element): boolean {
  const a = thumb.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
  return [
    a.left + border - b.left,
    a.top + border - b.top,
    b.right - (a.right - border),
    b.bottom - (a.bottom - border),
  ].every((d) => Math.abs(d) <= 0.5);
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

/** Resolves a box-shadow or a background-image the way `resolveColor` does a color. */
function resolveProp(property: "box-shadow" | "background-image", value: string): string {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  document.body.append(probe);
  const resolved = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return resolved;
}

/** The accent tint of the thumb, and of a pressed key, over the raised fill. */
const TRACK = "color-mix(in oklab, var(--ow-fg) 6%, transparent)";
const TINT = "color-mix(in oklab, var(--ow-accent) 14%, var(--ow-raised-bg))";
/** The pressed item's text: the accent, leaning toward the text color. */
const ON = "color-mix(in oklab, var(--ow-accent) 70%, var(--ow-fg))";

/** The thumb's key: its ::before, which thumb.ts stretches. */
const keyOf = (thumb: Element) => getComputedStyle(thumb, "::before");

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
    expect(group.querySelector(".ow-toggle-group__thumb")?.getAttribute("aria-hidden")).toBe(
      "true",
    );

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
        <ToggleGroup.Item ref={itemRef} value="left" className="on" style={{ marginInline: "1px" }}>
          Left
        </ToggleGroup.Item>
        <ToggleGroup.Item value="right" render={<span />} nativeButton={false}>
          Right
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(rootRef.current).toBe(group);
    expect(group.className).toBe("ow-toggle-group ow-toggle-group--soft ow-toggle-group--md mine");
    expect(group.style.marginBlock).toBe("3px");
    expect(itemRef.current).toBe(item("Left"));
    expect(item("Left").className).toBe("ow-toggle-group__item on");
    expect(item("Left").style.marginInline).toBe("1px");
    const span = group.querySelector('span[role="button"]');
    expect(span?.className).toBe("ow-toggle-group__item");
    expect(span?.textContent).toBe("Right");
  });

  test("draws a tinted track and an accent-tint thumb from the theme tokens, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { group, thumb, item } = await mount(<Views />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const track = getComputedStyle(group);
      expect(track.backgroundColor, theme).toBe(resolveColor(TRACK));
      // The track is a tint of the text color with no shadow; the thumb is a tint, with no edge.
      expect(track.boxShadow, theme).toBe("none");
      expect(getComputedStyle(thumb).boxShadow, theme).toBe("none");
      expect(keyOf(thumb).content, theme).toBe('""');
      expect(keyOf(thumb).backgroundColor, theme).toBe(resolveColor(TINT));
      // Labels change color with a short transition; the pressed one takes the accent.
      await expect
        .poll(() => getComputedStyle(item("Week")).color, { message: theme })
        .toBe(resolveColor(ON));
      await expect
        .poll(() => getComputedStyle(item("Day")).color, { message: theme })
        .toBe(resolveColor("var(--ow-muted)"));
    }
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const { group, thumb, item } = await mount(
      <Views
        style={
          {
            "--ow-accent": "rgb(1, 2, 3)",
            "--ow-raised-bg": "rgb(4, 5, 6)",
            "--ow-fg": "rgb(7, 8, 9)",
            "--ow-muted": "rgb(10, 11, 12)",
          } as CSSProperties
        }
      />,
    );
    expect(getComputedStyle(group).backgroundColor).toBe(resolveColor(TRACK, group));
    expect(getComputedStyle(group).backgroundColor).not.toBe(resolveColor(TRACK));
    expect(keyOf(thumb).backgroundColor).toBe(resolveColor(TINT, group));
    expect(getComputedStyle(thumb).boxShadow).toBe("none");
    expect(getComputedStyle(item("Week")).color).toBe(resolveColor(ON, group));
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

  test("stretches the key along the way, from its leading edge, and settles back to rest", async () => {
    const { thumb, item } = await mount(<Views />);
    const stretches = () =>
      thumb
        .getAnimations({ subtree: true })
        .filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement === "::before");
    expect(stretches()).toEqual([]);
    item("Month").click();
    // Read the frames inside the poll: the stretch may be over by the next look.
    let frames: Keyframe[] = [];
    await expect
      .poll(() => {
        const [stretch, ...others] = stretches();
        if (stretch) frames = (stretch.effect as KeyframeEffect).getKeyframes();
        return stretch ? 1 + others.length : 0;
      })
      .toBe(1);
    // Moving toward the end, it grows from its end edge, the leading one, and only transform animates.
    expect(frames.every((f) => f.transformOrigin === "100% 50%")).toBe(true);
    expect(frames.map((f) => f.transform)).toEqual([
      "scale(1, 1)",
      expect.stringMatching(/^scale\(1\.[1-3]\d*, 1\)$/),
      // Back to its size, and it stays: no squash below 1, no rebound.
      "scale(1, 1)",
      "scale(1, 1)",
    ]);
    await expect.poll(() => stretches().length).toBe(0);
    expect(keyOf(thumb).transform).toBe("none");
  });

  test("with reduced motion, the key does not stretch (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { thumb, item } = await mount(<Views />);
    item("Month").click();
    await expect.poll(() => over(thumb, item("Month"))).toBe(true);
    expect(thumb.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation)).toEqual(
      [],
    );
    expect(
      thumb
        .getAnimations({ subtree: true })
        .some((a) => (a.effect as KeyframeEffect | null)?.pseudoElement === "::before"),
    ).toBe(false);
  });

  test("snaps, without sliding, when the items resize", async () => {
    const { group, thumb, item } = await mount(<Views />);
    group.style.fontSize = "20px";
    await expect.poll(() => over(thumb, item("Week"))).toBe(true);
    expect(transitions(thumb)).toEqual([]);
  });

  test("rests as far from the track above as below at any zoom, untransformed", async () => {
    // The thumb spans the track's height and keeps its padding as a clear border: its edges round
    // to the track's pixels and both borders round alike. Between pixels, as text above leaves it.
    const { group, thumb } = await mount(
      <div style={{ paddingBlockStart: 0.3 }}>
        <Views />
      </div>,
    );
    const track = group.getBoundingClientRect();
    const box = thumb.getBoundingClientRect();
    expect(box.top).toBeCloseTo(track.top, 1);
    expect(box.bottom).toBeCloseTo(track.bottom, 1);
    const style = getComputedStyle(thumb);
    expect(style.borderTopWidth).toBe(getComputedStyle(group).paddingTop);
    expect(style.borderBottomWidth).toBe(style.borderTopWidth);
    // The key is the ::before, inside the clear border.
    expect(getComputedStyle(thumb, "::before").position).toBe("absolute");
    expect([style.translate, style.transform]).toEqual(["0px", "matrix(1, 0, 0, 1, 0, 0)"]);
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

  test("with multiple selection, each pressed item is a tinted key and there is no thumb", async () => {
    const { thumb, item } = await mount(<Views multiple defaultValue={["day", "month"]} />);
    expect(getComputedStyle(thumb).opacity).toBe("0");
    const raised = (name: string) =>
      getComputedStyle(item(name)).backgroundColor === resolveColor(TINT);
    expect(raised("Day")).toBe(true);
    expect(raised("Month")).toBe(true);
    expect(raised("Week")).toBe(false);
    expect(getComputedStyle(item("Day")).boxShadow).toBe("none");
  });

  test("a hovered key shifts its fill a little; the thumb does not", async () => {
    const hover = (group: Element, el: Element) => {
      const r = el.getBoundingClientRect();
      group.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
          pointerType: "mouse",
        }),
      );
    };
    const raised = resolveColor(TINT);

    // The selected segment is not an action.
    const single = await mount(<Views />);
    hover(single.group, single.item("Week"));
    expect(single.item("Week").hasAttribute("data-glide-active")).toBe(true);
    expect(keyOf(single.thumb).backgroundColor).toBe(raised);

    const multiple = await mount(<Views multiple defaultValue={["day", "month"]} />);
    hover(multiple.group, multiple.item("Month"));
    expect(getComputedStyle(multiple.item("Month")).backgroundColor).not.toBe(raised);
    expect(getComputedStyle(multiple.item("Month")).boxShadow).toBe("none");
    expect(getComputedStyle(multiple.item("Day")).backgroundColor).toBe(raised);
  });

  test("the pressed item raises itself until the thumb is placed", async () => {
    const { group, item } = await mount(<Views />);
    const background = () => getComputedStyle(item("Week")).backgroundColor;
    expect(background()).toBe("rgba(0, 0, 0, 0)");
    // As in server-rendered HTML before hydration.
    group.removeAttribute("data-thumb");
    expect(background()).toBe(resolveColor(TINT));
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
    expect(keyOf(thumb).backgroundColor).toBe(resolveColor("Highlight"));
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

describe("Toggle Group, solid", () => {
  const SHADOW = "var(--ow-primary-shadow)";
  const HOVER = `linear-gradient(${SOLID_HOVER_TINT} 0 0)`;

  test("marks its variant, with soft as the default, as a class and as data-variant", async () => {
    const solid = await mount(<Views variant="solid" size="lg" className="mine" />);
    expect(solid.group.className).toBe(
      "ow-toggle-group ow-toggle-group--solid ow-toggle-group--lg mine",
    );
    expect(solid.group.dataset.variant).toBe("solid");
    const plain = await mount(<Views />);
    expect(plain.group.dataset.variant).toBe("soft");
  });

  test("the thumb is the accent with the primary Button's edge, and the pressed label goes on it, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { group, thumb, item } = await mount(<Views variant="solid" />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      // The track is soft's.
      expect(getComputedStyle(group).backgroundColor, theme).toBe(resolveColor(TRACK));
      expect(keyOf(thumb).backgroundColor, theme).toBe(resolveColor("var(--ow-accent)"));
      expect(keyOf(thumb).boxShadow, theme).toBe(resolveProp("box-shadow", SHADOW));
      expect(getComputedStyle(thumb).boxShadow, theme).toBe("none");
      await expect
        .poll(() => getComputedStyle(item("Week")).color, { message: theme })
        .toBe(resolveColor("var(--ow-on-accent)"));
      await expect
        .poll(() => getComputedStyle(item("Day")).color, { message: theme })
        .toBe(resolveColor("var(--ow-muted)"));
    }
  });

  test("a theme token set on it changes it alone", async () => {
    const { thumb } = await mount(
      <Views variant="solid" style={{ "--ow-accent": "rgb(255, 0, 0)" } as CSSProperties} />,
    );
    expect(keyOf(thumb).backgroundColor).toBe("rgb(255, 0, 0)");
    const other = await mount(<Views variant="solid" />);
    expect(keyOf(other.thumb).backgroundColor).toBe(resolveColor("var(--ow-accent)"));
  });

  test("the thumb sits on the same pixels as soft's, and presses the same", async () => {
    const soft = await mount(<Views />);
    const solid = await mount(<Views variant="solid" />);
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return [r.width, r.height].map((n) => Math.round(n * 100) / 100);
    };
    expect(box(solid.thumb)).toEqual(box(soft.thumb));
    expect(over(solid.thumb, solid.item("Week"))).toBe(true);
    const style = getComputedStyle(solid.thumb);
    const reference = getComputedStyle(soft.thumb);
    for (const name of [
      "borderTopWidth",
      "borderRadius",
      "transitionProperty",
      "transitionDuration",
    ] as const) {
      expect(style[name], name).toBe(reference[name]);
    }
    expect(getComputedStyle(solid.thumb, "::before").borderRadius).toBe(
      getComputedStyle(soft.thumb, "::before").borderRadius,
    );
  });

  test("with multiple selection, each pressed item is an accent key; a hovered one is 5% black deeper", async () => {
    const hover = (group: Element, el: Element) => {
      const r = el.getBoundingClientRect();
      group.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
          pointerType: "mouse",
        }),
      );
    };
    const { group, thumb, item } = await mount(
      <Views variant="solid" multiple defaultValue={["day", "month"]} />,
    );
    expect(getComputedStyle(thumb).opacity).toBe("0");
    const accent = resolveColor("var(--ow-accent)");
    for (const name of ["Day", "Month"]) {
      const style = getComputedStyle(item(name));
      expect(style.backgroundColor, name).toBe(accent);
      expect(style.boxShadow, name).toBe(resolveProp("box-shadow", SHADOW));
      expect(style.backgroundImage, name).toBe("none");
      expect(style.color, name).toBe(resolveColor("var(--ow-on-accent)"));
    }
    expect(getComputedStyle(item("Week")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    hover(group, item("Month"));
    expect(item("Month").hasAttribute("data-glide-active")).toBe(true);
    const lit = getComputedStyle(item("Month"));
    expect(lit.backgroundColor).toBe(accent);
    expect(lit.backgroundImage).toBe(resolveProp("background-image", HOVER));
    expect(getComputedStyle(item("Day")).backgroundImage).toBe("none");
  });

  test("a hovered solid key keeps 4.5:1 for its label on the darkened fill, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const hover = (group: Element, el: Element) => {
      const r = el.getBoundingClientRect();
      group.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
          pointerType: "mouse",
        }),
      );
    };
    const { group, item } = await mount(
      <Views variant="solid" multiple defaultValue={["day", "month"]} />,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      hover(group, item("Week"));
      const style = getComputedStyle(item("Day"));
      const resting = composite(style.backgroundColor);
      expect(style.backgroundImage, theme).toBe("none");
      hover(group, item("Day"));
      expect(item("Day").hasAttribute("data-glide-active")).toBe(true);
      const lit = getComputedStyle(item("Day"));
      expect(lit.backgroundImage, theme).toBe(resolveProp("background-image", HOVER));
      const tint = resolveColor(SOLID_HOVER_TINT);
      // A held key keeps its fill and presses in, so the fill to differ from is the resting one.
      const ratios = checkSolidHover("toggle group solid", theme, {
        resting,
        hovered: composite(lit.backgroundColor, tint),
        held: resting,
        text: composite(lit.color),
        before: composite(lit.backgroundColor, resolveColor("var(--ow-hover)")),
      });
      console.info(`solid hover group ${theme}: ${ratios.map((r) => r.toFixed(2))} (now, before)`);
    }
  });

  test("a disabled pressed key keeps its fill and dims its text toward it", async () => {
    const { item } = await mount(
      <Views variant="solid" multiple defaultValue={["day"]} disabled />,
    );
    const style = getComputedStyle(item("Day"));
    expect(style.backgroundColor).toBe(resolveColor("var(--ow-accent)"));
    expect(style.color).toBe(
      resolveColor("color-mix(in oklab, var(--ow-on-accent) 60%, transparent)"),
    );
  });

  test("the pressed item is the accent key until the thumb is placed", async () => {
    const { group, item } = await mount(<Views variant="solid" />);
    group.removeAttribute("data-thumb");
    const style = getComputedStyle(item("Week"));
    expect(style.backgroundColor).toBe(resolveColor("var(--ow-accent)"));
    expect(style.boxShadow).toBe(resolveProp("box-shadow", SHADOW));
  });

  test("reads: the label has 4.5:1 on the fill, and the fill 3:1 on the track and the page, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { group, thumb, item } = await mount(<Views variant="solid" />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await expect
        .poll(() => getComputedStyle(item("Week")).color, { message: theme })
        .toBe(resolveColor("var(--ow-on-accent)"));
      const page = composite(getComputedStyle(document.body).backgroundColor);
      const track = composite(
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(group).backgroundColor,
      );
      const fill = composite(keyOf(thumb).backgroundColor);
      expect(
        contrast(composite(getComputedStyle(item("Week")).color), fill),
        theme,
      ).toBeGreaterThanOrEqual(4.5);
      expect(contrast(fill, track), theme).toBeGreaterThanOrEqual(3);
      expect(contrast(fill, page), theme).toBeGreaterThanOrEqual(3);
    }
  });

  test("hovered, a pressed solid item keeps its text on the fill; a lit one turns at once, as in soft", async () => {
    const hover = (group: Element, el: Element) => {
      const r = el.getBoundingClientRect();
      group.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
          pointerType: "mouse",
        }),
      );
    };
    const { group, item } = await mount(<Views variant="solid" />);
    await settle();
    hover(group, item("Week"));
    expect(item("Week").hasAttribute("data-glide-active")).toBe(true);
    expect(getComputedStyle(item("Week")).color).toBe(resolveColor("var(--ow-on-accent)"));
    hover(group, item("Day"));
    expect(item("Day").hasAttribute("data-glide-active")).toBe(true);
    const lit = getComputedStyle(item("Day"));
    expect(lit.transitionDelay).toBe("0s, 0s");
    expect(lit.transitionDuration.split(",")[0]).toBe("0.15s");
    await expect.poll(() => getComputedStyle(item("Day")).color).toBe(resolveColor("var(--ow-fg)"));
  });

  test("the label turns as the thumb reaches or leaves it; no delay with multiple, reduced motion, or a lit item", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    const { item } = await mount(<Views variant="solid" />);
    const delay = (el: Element) => getComputedStyle(el).transitionDelay;
    const time = (el: Element) => getComputedStyle(el).transitionDuration.split(",")[0];
    // 22% of the travel's 650 ms to arrive, 18% to leave, and a 40 ms turn.
    expect(delay(item("Week"))).toBe("0.143s, 0s");
    expect(time(item("Week"))).toBe("0.04s");
    expect(delay(item("Day"))).toBe("0.117s, 0s");
    expect(time(item("Day"))).toBe("0.04s");
    const soft = await mount(<Views />);
    for (const name of ["Week", "Day"]) {
      expect(delay(soft.item(name))).toBe("0s, 0s");
      expect(time(soft.item(name))).toBe("0.15s");
    }
    const multiple = await mount(<Views variant="solid" multiple defaultValue={["day"]} />);
    for (const name of ["Day", "Week"]) expect(delay(multiple.item(name))).toBe("0s, 0s");
    await commands.setReducedMotion("reduce");
    for (const name of ["Week", "Day"]) expect(delay(item(name))).toBe("0s, 0s");
  });

  /**
   * Seeks every animation of a move (the thumb's slide and stretch, both labels' color) to each
   * 5 ms step of 0 to 700 ms and counts the steps where a label is under 3:1 against what is under
   * its centre: the key, or the track. It runs no clock, so it cannot be flaky.
   */
  async function unreadable(from: string, to: string) {
    const { group, thumb, item } = await mount(<Views variant="solid" defaultValue={[from]} />);
    await settle();
    const track = composite(
      getComputedStyle(document.body).backgroundColor,
      getComputedStyle(group).backgroundColor,
    );
    const fill = composite(keyOf(thumb).backgroundColor);
    const named = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
    const arriving = item(named(to));
    const leaving = item(named(from));
    // The colors are read before the click, so the transitions start from them.
    const before = [getComputedStyle(arriving).color, getComputedStyle(leaving).color];
    expect(before[0]).not.toBe(before[1]);
    arriving.click();
    await expect
      .poll(
        () =>
          thumb.getAnimations({ subtree: true }).length > 0 &&
          arriving.getAnimations().length > 0 &&
          leaving.getAnimations().length > 0,
      )
      .toBe(true);
    const all = [
      ...thumb.getAnimations({ subtree: true }),
      ...arriving.getAnimations(),
      ...leaving.getAnimations(),
    ];
    for (const animation of all) animation.pause();
    // The key's extent at this moment, with the stretch along the way.
    const key = () => {
      const box = thumb.getBoundingClientRect();
      const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
      const style = keyOf(thumb);
      const scale = style.transform === "none" ? 1 : new DOMMatrixReadOnly(style.transform).a;
      const origin = Number.parseFloat(style.transformOrigin);
      const left = box.left + border + origin * (1 - scale);
      return [left, left + (box.width - 2 * border) * scale];
    };
    const readable = (el: HTMLElement) => {
      const label = el.getBoundingClientRect();
      const [start = 0, end = 0] = key();
      const middle = (label.left + label.right) / 2;
      const under = middle >= start && middle <= end ? fill : track;
      return contrast(composite(getComputedStyle(el).color), under);
    };
    const bad = { arriving: 0, leaving: 0 };
    for (let at = 0; at <= 700; at += 5) {
      for (const animation of all) animation.currentTime = at;
      if (readable(arriving) < 3) bad.arriving += 5;
      if (readable(leaving) < 3) bad.leaving += 5;
    }
    // Settled, both read.
    for (const animation of all) animation.finish();
    expect(readable(arriving)).toBeGreaterThanOrEqual(4.5);
    expect(readable(leaving)).toBeGreaterThanOrEqual(4.5);
    return bad;
  }

  test("the label stays readable while the thumb travels, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    // Measured at 5 ms steps (worst of the three moves): light 60 and 70 ms, dark 20 and 50 ms.
    // With no delays, the arriving label is unreadable for 205 ms in light, the leaving one for
    // 170 ms in light and 165 ms in dark.
    const limits = { light: { arriving: 70, leaving: 80 }, dark: { arriving: 30, leaving: 60 } };
    for (const theme of ["light", "dark"] as const) {
      root.dataset.theme = theme;
      const worst = { arriving: 0, leaving: 0 };
      for (const [from, to] of [
        ["day", "week"],
        ["day", "month"],
        ["month", "day"],
      ] as const) {
        const bad = await unreadable(from, to);
        worst.arriving = Math.max(worst.arriving, bad.arriving);
        worst.leaving = Math.max(worst.leaving, bad.leaving);
      }
      expect(worst.arriving, `${theme} arriving`).toBeLessThanOrEqual(limits[theme].arriving);
      expect(worst.leaving, `${theme} leaving`).toBeLessThanOrEqual(limits[theme].leaving);
    }
  });

  test("forced colors: the thumb is Highlight with no edge, and the label turns at once", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { thumb, item } = await mount(<Views variant="solid" />);
    await commands.setForcedColors("active");
    expect(keyOf(thumb).backgroundColor).toBe(resolveColor("Highlight"));
    expect(keyOf(thumb).boxShadow).toBe("none");
    await expect
      .poll(() => getComputedStyle(item("Week")).color)
      .toBe(resolveColor("HighlightText"));
    expect(getComputedStyle(item("Week")).transitionDelay).toBe("0s, 0s");
    const multiple = await mount(<Views variant="solid" multiple defaultValue={["day"]} />);
    const key = getComputedStyle(multiple.item("Day"));
    expect(key.backgroundColor).toBe(resolveColor("Highlight"));
    expect(key.boxShadow).toBe("none");
    expect(key.color).toBe(resolveColor("HighlightText"));
  });

  test("has no axe violations in light and dark, single and multiple", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    // axe does not see the thumb's key (a pseudo-element) under the pressed label: on a light page
    // it reads white on the track. The single group is checked in dark, and for its contrast in
    // the test of the fill above.
    const keys = await render(
      <main>
        <Views
          variant="solid"
          multiple
          defaultValue={["day", "month"]}
          size="sm"
          aria-label="Days"
        />
        <Views variant="solid" disabled size="lg" aria-label="Locked" />
      </main>,
    );
    const single = await render(
      <main>
        <Views variant="solid" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await settle();
      expect(await axeReport(keys.container), theme).toEqual({
        violations: [],
        contrastUnknown: [],
      });
    }
    root.dataset.theme = "dark";
    await settle();
    expect(await axeReport(single.container)).toEqual({ violations: [], contrastUnknown: [] });
  });
});

test("every part has its data-slot", async () => {
  const screen = await render(
    <ToggleGroup.Root aria-label="Align" defaultValue={["left"]}>
      <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
    </ToggleGroup.Root>,
  );
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "toggle-group",
    "glide",
    "toggle-group-thumb",
    "toggle-group-item",
    "toggle-group-label",
  ]);
});
