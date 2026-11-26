import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { PreviewCard } from "./index";

const root = document.documentElement;

/** A link with a card: a title and a line, an arrow. Opens at once, so no test waits for 600 ms. */
function Docs({
  open,
  side,
  popupStyle,
  delay = 0,
}: {
  open?: boolean;
  side?: PreviewCard.PreviewCardPositionerProps["side"];
  popupStyle?: CSSProperties;
  delay?: number;
}) {
  return (
    <PreviewCard.Root {...(open === undefined ? {} : { defaultOpen: open })}>
      <PreviewCard.Trigger href="/docs" delay={delay} closeDelay={0} style={{ margin: 80 }}>
        The docs
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side={side}>
          <PreviewCard.Popup style={popupStyle}>
            <PreviewCard.Arrow />
            <h3>The docs</h3>
            <p>Every component, with a preview and how to install it.</p>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

const popup = () => document.querySelector<HTMLElement>(".ow-preview-card__popup");
const arrow = () => document.querySelector<HTMLElement>(".ow-preview-card__arrow") as HTMLElement;
const link = () => document.querySelector<HTMLElement>("a") as HTMLElement;
const gone = () => expect.poll(popup, { timeout: 1000 }).toBeNull();

/** Resolves a value (e.g. `var(--ow-raised-bg)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

describe("PreviewCard", () => {
  test("opens when the pointer rests on the link, and shuts when it leaves", async () => {
    await render(<Docs />);
    await userEvent.hover(link());
    await expect.poll(popup).not.toBeNull();
    // The card is not announced: it is a plain box next to the link, with no role of its own.
    expect(popup()?.getAttribute("role")).toBeNull();
    expect(link().getAttribute("aria-expanded")).toBeNull();
    await userEvent.hover(document.documentElement, { position: { x: 1270, y: 790 }, force: true });
    await gone();
  });

  test("keyboard focus opens it, and Escape shuts it", async () => {
    await render(<Docs />);
    await userEvent.tab();
    expect(document.activeElement).toBe(link());
    await expect.poll(popup).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("waits for its delay: 600 ms by default", async () => {
    await render(<Docs delay={600} />);
    const started = performance.now();
    await userEvent.hover(link());
    await expect.poll(popup, { timeout: 4000 }).not.toBeNull();
    expect(performance.now() - started).toBeGreaterThanOrEqual(500);
  });

  test("opens from a trigger placed elsewhere, or from code, through a handle", async () => {
    const handle = PreviewCard.createHandle();
    await render(
      <>
        <PreviewCard.Trigger handle={handle} id="far" href="/far">
          Far
        </PreviewCard.Trigger>
        <PreviewCard.Root handle={handle}>
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Details</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>
      </>,
    );
    handle.open("far");
    await expect.poll(popup).not.toBeNull();
    handle.close();
    await gone();
  });

  describe("the link", () => {
    test("takes the color around it, with a quiet underline and no other styling", async () => {
      await render(
        <PreviewCard.Root>
          <p style={{ color: "rgb(10, 20, 30)", fontSize: 20, fontWeight: 500 }}>
            Read <PreviewCard.Trigger href="/docs">the docs</PreviewCard.Trigger>
          </p>
        </PreviewCard.Root>,
      );
      const style = getComputedStyle(link());
      expect(link().tagName).toBe("A");
      expect(style.color).toBe("rgb(10, 20, 30)");
      expect(style.textDecorationLine).toBe("underline");
      expect(style.textDecorationThickness).toBe("1px");
      expect(style.fontSize).toBe("20px");
      expect(style.fontWeight).toBe("500");
      expect(style.display).toBe("inline");
      // Quieter than the text, and darker under the pointer.
      const resting = style.textDecorationColor;
      expect(resting).not.toBe(style.color);
      await userEvent.hover(link());
      await expect.poll(() => getComputedStyle(link()).textDecorationColor).not.toBe(resting);
      await expect.poll(() => getComputedStyle(link()).textDecorationColor).toBe("rgb(10, 20, 30)");
    });

    test("its underline keeps 3:1 against the page, light and dark", async () => {
      onTestFinished(() => {
        delete root.dataset.theme;
      });
      await render(<Docs />);
      for (const theme of ["light", "dark"]) {
        root.dataset.theme = theme;
        const page = composite(resolve("color", "var(--ow-bg)"));
        const line = composite(
          resolve("color", "var(--ow-bg)"),
          getComputedStyle(link()).textDecorationColor,
        );
        expect(contrast(line, page)).toBeGreaterThanOrEqual(3);
        expect(contrast(composite(getComputedStyle(link()).color), page)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    });

    test("keyboard focus draws the ring, 2px outside; forced colors use Highlight", async () => {
      onTestFinished(() => commands.setForcedColors("none"));
      await render(<Docs delay={600} />);
      await userEvent.tab();
      expect(document.activeElement).toBe(link());
      const style = getComputedStyle(link());
      expect(style.outlineStyle).toBe("solid");
      expect(style.outlineWidth).toBe("2px");
      expect(style.outlineOffset).toBe("2px");
      expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
      await commands.setForcedColors("active");
      await expect
        .poll(() => getComputedStyle(link()).outlineColor)
        .toBe(resolve("color", "Highlight"));
    });
  });

  test("grows from its trigger: 0.96 and transparent to full, 180 ms ease-out", async () => {
    const runs: { property: string; frames: Keyframe[] }[] = [];
    const onRun = (event: TransitionEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("ow-preview-card__popup")) return;
      const transition = target
        .getAnimations()
        .find((a) => (a as CSSTransition).transitionProperty === event.propertyName);
      const effect = transition?.effect as KeyframeEffect | undefined;
      runs.push({ property: event.propertyName, frames: effect?.getKeyframes() ?? [] });
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Docs />);
    await userEvent.hover(link());
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

  test("under reduced motion it fades without growing", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const runs: string[] = [];
    const onRun = (event: TransitionEvent) => runs.push(event.propertyName);
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Docs />);
    await userEvent.hover(link());
    await expect.poll(() => runs).toContain("opacity");
    await settle();
    expect(runs).not.toContain("transform");
  });

  test("passes className, style, render, and ref through its parts", async () => {
    const refs = {
      trigger: createRef<HTMLAnchorElement>(),
      positioner: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      arrow: createRef<HTMLDivElement>(),
    };
    await render(
      <PreviewCard.Root defaultOpen>
        <PreviewCard.Trigger ref={refs.trigger} className="r" href="/docs">
          Docs
        </PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner ref={refs.positioner} className="p" style={{ zIndex: 3 }}>
            <PreviewCard.Popup ref={refs.popup} className="u" render={<section />}>
              <PreviewCard.Arrow ref={refs.arrow} className="a" />
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.trigger.current?.className).toBe("ow-preview-card__trigger r");
    expect(refs.positioner.current?.className).toBe("ow-preview-card__positioner p");
    expect(refs.positioner.current?.style.zIndex).toBe("3");
    expect(refs.popup.current?.className).toBe("ow-preview-card__popup u");
    expect(refs.popup.current?.tagName).toBe("SECTION");
    expect(refs.arrow.current?.className).toBe("ow-preview-card__arrow a");
  });

  test("sits on the raised fill with the popup shadow; its arrow matches, light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(<Docs open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(surface);
      expect(style.backgroundColor).toBe(resolve("color", "var(--ow-raised-bg)"));
      expect(style.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
      expect(style.color).toBe(resolve("color", "var(--ow-fg)"));
      expect(style.padding).toBe("16px");
      const tip = getComputedStyle(arrow(), "::before");
      expect(tip.backgroundColor).toBe(resolve("color", "var(--ow-raised-bg)"));
      expect(tip.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
    }
  });

  test("a theme token set on it changes it alone", async () => {
    const tokens = {
      "--ow-raised-bg": "rgb(1, 2, 3)",
      "--ow-popup-shadow": "none",
      "--ow-fg": "rgb(4, 5, 6)",
    } as CSSProperties;
    await render(<Docs open popupStyle={tokens} />);
    await expect.poll(popup).not.toBeNull();
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style.boxShadow).toBe("none");
    expect(style.color).toBe("rgb(4, 5, 6)");
    const tip = getComputedStyle(arrow(), "::before");
    expect(tip.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(link()).color).toBe(resolve("color", "var(--ow-fg)"));
  });

  test("data-theme on the Portal themes the card", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    root.dataset.theme = "light";
    await render(
      <PreviewCard.Root defaultOpen>
        <PreviewCard.Trigger href="/docs">Docs</PreviewCard.Trigger>
        <PreviewCard.Portal data-theme="dark">
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Details</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    const portal = popup()?.closest<HTMLElement>('[data-theme="dark"]');
    expect(portal).not.toBeNull();
    const dark = resolve("color", "var(--ow-raised-bg)", portal as HTMLElement);
    expect(dark).not.toBe(resolve("color", "var(--ow-raised-bg)"));
    expect(getComputedStyle(popup() as HTMLElement).backgroundColor).toBe(dark);
  });

  test("is at most 20rem wide, and no wider than the room", async () => {
    await render(
      <PreviewCard.Root defaultOpen>
        <PreviewCard.Trigger href="/docs">Docs</PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner>
            <PreviewCard.Popup>
              <div style={{ inlineSize: 900 }}>Wide</div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    const rem = Number.parseFloat(getComputedStyle(root).fontSize);
    expect((popup() as HTMLElement).getBoundingClientRect().width).toBeLessThanOrEqual(
      20 * rem + 1,
    );
  });

  test("more contrast adds a 1px --ow-edge ring to the popup", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    await render(<Docs open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    const shadow = getComputedStyle(surface).boxShadow;
    await commands.setContrast("more");
    const ring = resolve("box-shadow", "0 0 0 1px var(--ow-edge)");
    expect(getComputedStyle(surface).boxShadow).toBe(`${shadow}, ${ring}`);
  });

  test("keeps its edge and its arrow's in forced colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Docs open />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    const tip = getComputedStyle(arrow(), "::before");
    expect(tip.outlineWidth).toBe("1px");
    expect(tip.outlineColor).toBe(style.color);
  });

  test("follows the text direction, also in the portal", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Docs side="inline-end" open />
        </div>
      </DirectionProvider>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(document.querySelector(".ow-preview-card__positioner")?.getAttribute("dir")).toBe("rtl");
    const box = (popup() as HTMLElement).getBoundingClientRect();
    const tip = arrow().getBoundingClientRect();
    expect(box.right).toBeLessThanOrEqual(link().getBoundingClientRect().left);
    expect(tip.left + tip.width / 2).toBeCloseTo(box.right, 0);
    expect(getComputedStyle(arrow()).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <Docs open />
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(document.body)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, shut and open", async () => {
    await render(<Docs />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.hover(link());
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("does not hold the page: no scroll lock, no inert page", async () => {
    await render(<Docs open />);
    await expect.poll(popup).not.toBeNull();
    const held = !document.body.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }),
    );
    expect(held).toBe(false);
    expect(link().closest("[inert]")).toBeNull();
  });
});

test("every part has its data-slot", async () => {
  await render(
    <PreviewCard.Root defaultOpen>
      <PreviewCard.Trigger href="/docs">Docs</PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner>
          <PreviewCard.Popup>
            <PreviewCard.Arrow />
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="preview-card-popup"]'))
    .not.toBeNull();
  const slots = [...document.querySelectorAll('[data-slot^="preview-card"]')].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "preview-card-trigger",
    "preview-card-positioner",
    "preview-card-popup",
    "preview-card-arrow",
  ]);
});
