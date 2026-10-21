import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Popover } from "./index";

const root = document.documentElement;

/** A share popover: a title, a description, a field, and a Close button, with an arrow. */
function Share({
  open,
  side,
  popupStyle,
}: {
  open?: boolean;
  side?: Popover.PopoverPositionerProps["side"];
  popupStyle?: CSSProperties;
}) {
  return (
    <Popover.Root {...(open === undefined ? {} : { defaultOpen: open })}>
      <Popover.Trigger style={{ margin: 80 }}>Share</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side={side}>
          <Popover.Popup style={popupStyle}>
            <Popover.Arrow />
            <Popover.Title>Share the draft</Popover.Title>
            <Popover.Description>Anyone with the link can read it.</Popover.Description>
            <input aria-label="Link" defaultValue="owsem.dev/d/42" />
            <Popover.Close>Done</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const popup = () => document.querySelector<HTMLElement>(".ow-popover-popup");
const arrow = () => document.querySelector<HTMLElement>(".ow-popover-arrow") as HTMLElement;
const trigger = () => document.querySelector<HTMLElement>("button") as HTMLElement;
const gone = () => expect.poll(popup, { timeout: 1000 }).toBeNull();

/** Resolves a value (e.g. `var(--ow-panel)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

describe("Popover", () => {
  test("is Base UI's popover: a named dialog that opens, takes focus, and gives it back", async () => {
    await render(<Share />);
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    const dialog = popup() as HTMLElement;
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe(
      document.querySelector(".ow-popover-title")?.id,
    );
    expect(dialog.getAttribute("aria-describedby")).toBe(
      document.querySelector(".ow-popover-description")?.id,
    );
    expect(document.querySelector(".ow-popover-title")?.tagName).toBe("H2");
    await expect.poll(() => dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(trigger());
    // A click outside shuts it too, and so does Close.
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await gone();
    await userEvent.click(trigger());
    await userEvent.click(document.querySelector(".ow-popover-popup button") as HTMLElement);
    await gone();
  });

  test("opens from a trigger placed elsewhere, or from code, through a handle", async () => {
    const handle = Popover.createHandle();
    await render(
      <>
        <Popover.Trigger handle={handle} id="far">
          Far
        </Popover.Trigger>
        <Popover.Root handle={handle}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Title>Details</Popover.Title>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </>,
    );
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    handle.close();
    await gone();
    handle.open("far");
    await expect.poll(popup).not.toBeNull();
  });

  test("grows from its trigger: 0.96 and transparent to full, 180 ms ease-out", async () => {
    const runs: { property: string; frames: Keyframe[] }[] = [];
    const onRun = (event: TransitionEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("ow-popover-popup")) return;
      const transition = target
        .getAnimations()
        .find((a) => (a as CSSTransition).transitionProperty === event.propertyName);
      const effect = transition?.effect as KeyframeEffect | undefined;
      runs.push({ property: event.propertyName, frames: effect?.getKeyframes() ?? [] });
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Share />);
    await userEvent.click(trigger());
    await expect.poll(() => runs.length).toBe(2);
    expect(runs.find((run) => run.property === "transform")?.frames[0]?.transform).toBe(
      "scale(0.96)",
    );
    expect(runs.find((run) => run.property === "opacity")?.frames[0]?.opacity).toBe("0");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.transitionDuration).toBe("0.18s, 0.18s");
    expect(style.transitionTimingFunction).toBe(
      "cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.23, 1, 0.32, 1)",
    );
    await settle();
  });

  test("opened from the keyboard, it appears at once (data-instant)", async () => {
    await render(<Share />);
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.dataset.instant).toBe("click");
    expect(getComputedStyle(popup() as HTMLElement).transitionProperty).toBe("none");
  });

  test("under reduced motion it fades without growing (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const runs: string[] = [];
    const onRun = (event: TransitionEvent) => runs.push(event.propertyName);
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Share />);
    await userEvent.click(trigger());
    await expect.poll(() => runs).toContain("opacity");
    await settle();
    expect(runs).not.toContain("transform");
  });

  test("passes className, style, render, and ref through its parts (FR-2, FR-5)", async () => {
    const refs = {
      positioner: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      arrow: createRef<HTMLDivElement>(),
      title: createRef<HTMLHeadingElement>(),
      description: createRef<HTMLParagraphElement>(),
    };
    await render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner ref={refs.positioner} className="p" style={{ zIndex: 3 }}>
            <Popover.Popup ref={refs.popup} className={() => "u"} render={<section />}>
              <Popover.Arrow ref={refs.arrow} className="a" />
              <Popover.Title ref={refs.title} className="t" render={<h3>Title</h3>} />
              <Popover.Description ref={refs.description} className="d">
                Text
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.positioner.current?.className).toBe("ow-popover-positioner p");
    expect(refs.positioner.current?.style.zIndex).toBe("3");
    expect(refs.popup.current?.className).toBe("ow-popover-popup u");
    expect(refs.popup.current?.tagName).toBe("SECTION");
    expect(refs.arrow.current?.className).toBe("ow-popover-arrow a");
    expect(refs.title.current?.className).toBe("ow-popover-title t");
    expect(refs.title.current?.tagName).toBe("H3");
    expect(refs.description.current?.className).toBe("ow-popover-description d");
  });

  test("sits on the panel material with the popup shadow; its arrow matches, light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(surface);
      expect(style.backgroundColor).toBe(resolve("color", "var(--ow-panel)"));
      expect(style.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
      expect(style.color).toBe(resolve("color", "var(--ow-fg)"));
      expect(
        getComputedStyle(document.querySelector(".ow-popover-description") as Element).color,
      ).toBe(resolve("color", "var(--ow-muted)"));
      // The arrow wears the popup's surface and shadow, so its edges are the panel's.
      const tip = getComputedStyle(arrow(), "::before");
      expect(tip.backgroundColor).toBe(resolve("color", "var(--ow-panel)"));
      expect(tip.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
    }
  });

  test("component tokens override the theme tokens", async () => {
    const tokens = {
      "--ow-popover-bg": "rgb(1, 2, 3)",
      "--ow-popover-shadow": "none",
      "--ow-popover-fg": "rgb(4, 5, 6)",
      "--ow-popover-muted": "rgb(7, 8, 9)",
    } as CSSProperties;
    await render(<Share open popupStyle={tokens} />);
    await expect.poll(popup).not.toBeNull();
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style.boxShadow).toBe("none");
    expect(style.color).toBe("rgb(4, 5, 6)");
    expect(
      getComputedStyle(document.querySelector(".ow-popover-description") as Element).color,
    ).toBe("rgb(7, 8, 9)");
    const tip = getComputedStyle(arrow(), "::before");
    expect(tip.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(tip.boxShadow).toBe("none");
  });

  test("keeps its edge and its arrow's in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    const tip = getComputedStyle(arrow(), "::before");
    expect(tip.outlineWidth).toBe("1px");
    expect(tip.outlineColor).toBe(style.color);
  });

  test("follows the text direction, also in the portal (FR-16)", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Share side="inline-end" open />
        </div>
      </DirectionProvider>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(document.querySelector(".ow-popover-positioner")?.getAttribute("dir")).toBe("rtl");
    const box = (popup() as HTMLElement).getBoundingClientRect();
    const tip = arrow().getBoundingClientRect();
    expect(box.right).toBeLessThanOrEqual(trigger().getBoundingClientRect().left);
    // Centered on the popup's right edge, its visible half pointing right.
    expect(tip.left + tip.width / 2).toBeCloseTo(box.right, 0);
    expect(getComputedStyle(arrow()).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <Share open />
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(document.body)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, open", async () => {
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
