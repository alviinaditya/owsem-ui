import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Tooltip } from "./index";

const root = document.documentElement;

/** An icon button with a tooltip: its name, then its shortcut. */
function Labelled({
  name,
  shortcut,
  open,
  arrow = true,
  side,
  delay = 150,
  positioner,
}: {
  name: string;
  shortcut?: string;
  open?: boolean;
  arrow?: boolean;
  side?: Tooltip.TooltipPositionerProps["side"];
  delay?: number;
  positioner?: Partial<Tooltip.TooltipPositionerProps>;
}) {
  return (
    <Tooltip.Root {...(open === undefined ? {} : { open })}>
      <Tooltip.Trigger aria-label={name} delay={delay} style={{ margin: 60 }}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} {...positioner}>
          <Tooltip.Popup>
            {arrow ? <Tooltip.Arrow /> : null}
            {name}
            {shortcut ? <kbd>{shortcut}</kbd> : null}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

async function mount(ui: ReactNode) {
  return render(ui);
}

const popup = () => document.querySelector<HTMLElement>(".ow-tooltip-popup");
const popups = () => [...document.querySelectorAll<HTMLElement>(".ow-tooltip-popup")];
const button = (name: string) => {
  const el = document.querySelector<HTMLElement>(`[aria-label="${name}"]`);
  if (!el) throw new Error(`no ${name}`);
  return el;
};

/** Resolves a value (e.g. `var(--ow-tooltip-bg)`) to its computed color in `scope`. */
function resolve(value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  return computed;
}

/** Parks the pointer in the bottom corner, away from every trigger. */
async function pointerAway() {
  const spot = document.createElement("span");
  spot.style.cssText = "position:fixed;inset:auto 0 0 auto;inline-size:4px;block-size:4px";
  document.body.append(spot);
  await userEvent.hover(spot);
  spot.remove();
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const gone = () => expect.poll(popup, { timeout: 1000 }).toBeNull();

describe("Tooltip", () => {
  test("opens on hover after its delay, and keeps the trigger's own name", async () => {
    await mount(<Labelled name="Bold" shortcut="⌘B" />);
    await pointerAway();
    await userEvent.hover(button("Bold"));
    await wait(60);
    expect(popup()).toBeNull();
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.textContent).toBe("Bold⌘B");
    expect(popup()?.hasAttribute("data-instant")).toBe(false);
    expect(button("Bold").getAttribute("aria-label")).toBe("Bold");
    expect(button("Bold").hasAttribute("data-popup-open")).toBe(true);
    await pointerAway();
    await gone();
  });

  test("keyboard focus opens it at once, unanimated; Escape shuts it", async () => {
    await mount(<Labelled name="Bold" />);
    await pointerAway();
    await userEvent.tab();
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.dataset.instant).toBe("focus");
    expect(getComputedStyle(popup() as HTMLElement).transitionDuration).toBe("0s");
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("once one is open, the next opens at once, unanimated (delay group)", async () => {
    await mount(
      <Tooltip.Provider delay={300}>
        <Labelled name="Bold" delay={300} />
        <Labelled name="Italic" delay={300} />
      </Tooltip.Provider>,
    );
    await pointerAway();
    await userEvent.hover(button("Bold"));
    await expect.poll(popup, { timeout: 1500 }).not.toBeNull();
    const opened = performance.now();
    await userEvent.hover(button("Italic"));
    await expect.poll(() => popups().find((p) => p.textContent === "Italic")).toBeTruthy();
    expect(performance.now() - opened).toBeLessThan(250);
    const italic = popups().find((p) => p.textContent === "Italic");
    expect(italic?.dataset.instant).toBe("delay");
    expect(getComputedStyle(italic as HTMLElement).transitionDuration).toBe("0s");
    await pointerAway();
  });

  test("grows from its trigger: 0.97 and transparent to full, 125 ms ease-out", async () => {
    const screen = await mount(<Labelled name="Bold" open={false} />);
    const runs: { property: string; frames: Keyframe[] }[] = [];
    const onRun = (event: TransitionEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("ow-tooltip-popup")) return;
      const transition = target
        .getAnimations()
        .find((a) => (a as CSSTransition).transitionProperty === event.propertyName);
      const effect = transition?.effect as KeyframeEffect | undefined;
      runs.push({ property: event.propertyName, frames: effect?.getKeyframes() ?? [] });
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await screen.rerender(<Labelled name="Bold" open />);
    await expect.poll(() => runs.length).toBe(2);
    const transform = runs.find((run) => run.property === "transform");
    expect(transform?.frames[0]?.transform).toBe("scale(0.97)");
    expect(transform?.frames[1]?.transform).toBe("none");
    expect(runs.find((run) => run.property === "opacity")?.frames[0]?.opacity).toBe("0");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.transitionDuration).toBe("0.125s, 0.125s");
    expect(style.transitionTimingFunction).toBe(
      "cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.23, 1, 0.32, 1)",
    );
    // The scale's origin is the trigger's edge, which Base UI writes on the positioner.
    const positioner = document.querySelector<HTMLElement>(".ow-tooltip-positioner");
    expect(style.transformOrigin).not.toBe("");
    expect(positioner?.style.getPropertyValue("--transform-origin")).toMatch(/px/);
    await settle();
  });

  test("under reduced motion it appears and goes without animation (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    let runs = 0;
    const onRun = () => runs++;
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    const screen = await mount(<Labelled name="Bold" open={false} />);
    await screen.rerender(<Labelled name="Bold" open />);
    await expect.poll(popup).not.toBeNull();
    expect(getComputedStyle(popup() as HTMLElement).transitionProperty).toBe("none");
    await screen.rerender(<Labelled name="Bold" open={false} />);
    await gone();
    expect(runs).toBe(0);
  });

  test("passes className, style, render, and ref through its parts (FR-2, FR-5)", async () => {
    const refs = {
      positioner: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      arrow: createRef<HTMLDivElement>(),
    };
    await mount(
      <Tooltip.Root open>
        <Tooltip.Trigger aria-label="Bold">B</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner ref={refs.positioner} className="p" style={{ zIndex: 3 }}>
            <Tooltip.Popup ref={refs.popup} className={() => "u"} render={<section />}>
              <Tooltip.Arrow ref={refs.arrow} className="a" />
              Bold
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(refs.positioner.current?.className).toBe("ow-tooltip-positioner p");
    expect(refs.positioner.current?.style.zIndex).toBe("3");
    expect(refs.popup.current?.className).toBe("ow-tooltip-popup u");
    expect(refs.popup.current?.tagName).toBe("SECTION");
    expect(refs.arrow.current?.className).toBe("ow-tooltip-arrow a");
    expect(refs.arrow.current?.getAttribute("aria-hidden")).toBe("true");
  });

  test("is solid and dark, with no material, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await mount(<Labelled name="Bold" shortcut="B" open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    const arrow = document.querySelector(".ow-tooltip-arrow") as HTMLElement;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(surface);
      expect(style.backgroundColor).toBe(resolve("var(--ow-tooltip-bg)"));
      expect(style.color).toBe(resolve("var(--ow-tooltip-fg)"));
      expect(style.boxShadow).toBe("none");
      expect(getComputedStyle(arrow).backgroundColor).toBe(resolve("var(--ow-tooltip-bg)"));
    }
  });

  test("its corners and the shortcut's come from the control radius (FR-10b)", async () => {
    await mount(<Labelled name="Bold" shortcut="B" open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    expect(getComputedStyle(surface).borderRadius).toBe("6px");
    expect(getComputedStyle(surface.querySelector("kbd") as Element).borderRadius).toBe("4px");
  });

  test("its tokens restyle it, set on the page or on a part", async () => {
    function Scoped() {
      // A container from state: Base UI waits while it is null.
      const [container, setContainer] = useState<HTMLDivElement | null>(null);
      const tokens = { "--ow-tooltip-bg": "rgb(1, 2, 3)" } as CSSProperties;
      return (
        <div ref={setContainer} style={tokens}>
          <Tooltip.Root open>
            <Tooltip.Trigger aria-label="Bold">B</Tooltip.Trigger>
            <Tooltip.Portal container={container}>
              <Tooltip.Positioner style={{ "--ow-tooltip-fg": "rgb(4, 5, 6)" } as CSSProperties}>
                <Tooltip.Popup>Bold</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      );
    }
    await mount(<Scoped />);
    await expect.poll(popup).not.toBeNull();
    expect(getComputedStyle(popup() as HTMLElement).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(popup() as HTMLElement).color).toBe("rgb(4, 5, 6)");
  });

  test("keeps an edge and its arrow in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await mount(<Labelled name="Bold" open />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("1px");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    const arrow = getComputedStyle(document.querySelector(".ow-tooltip-arrow") as HTMLElement);
    expect(arrow.backgroundColor).toBe(style.color);
  });

  test("follows the text direction, also in the portal (FR-16)", async () => {
    await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Labelled name="Bold" side="inline-end" open />
        </div>
      </DirectionProvider>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    const positioner = document.querySelector(".ow-tooltip-positioner") as HTMLElement;
    expect(positioner.getAttribute("dir")).toBe("rtl");
    // Inline end is the left, and the arrow points back right, at the trigger.
    const trigger = button("Bold").getBoundingClientRect();
    const box = (popup() as HTMLElement).getBoundingClientRect();
    const arrowEl = document.querySelector(".ow-tooltip-arrow") as HTMLElement;
    const arrow = arrowEl.getBoundingClientRect();
    expect(box.right).toBeLessThanOrEqual(trigger.left);
    // The triangle fills the box's half by the popup, mirrored to point right.
    expect(arrow.left).toBeCloseTo(box.right - 1, 1);
    expect(arrow.left + arrow.width / 2).toBeLessThanOrEqual(trigger.left);
    expect(getComputedStyle(arrowEl).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await mount(
      <main>
        <Labelled name="Bold" shortcut="⌘B" open />
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(document.body)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, open or shut", async () => {
    const screen = await mount(<Labelled name="Bold" open />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await screen.rerender(<Labelled name="Bold" open={false} />);
    await settle();
    expect(await measureIdle(1000)).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
