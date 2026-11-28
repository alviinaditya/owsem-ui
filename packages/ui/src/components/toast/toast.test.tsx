import { DirectionProvider } from "@base-ui/react/direction-provider";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Toast } from "./index";

const root = document.documentElement;
type Manager = ReturnType<typeof Toast.createToastManager>;

const region = () => document.querySelector<HTMLElement>('[data-slot="toast-viewport"]');
const cards = () => [...document.querySelectorAll<HTMLElement>('[data-slot="toast"]')];
const byText = (text: string) => cards().find((card) => card.textContent?.includes(text));
const one = (selector: string, scope: ParentNode = document) =>
  scope.querySelector<HTMLElement>(selector);

/** The shortest use: a Provider, and a Portal with a Viewport that draws every toast. */
function App({ manager, limit }: { manager: Manager; limit?: number }) {
  return (
    <Toast.Provider toastManager={manager} {...(limit ? { limit } : {})}>
      <Toast.Portal>
        <Toast.Viewport />
      </Toast.Portal>
    </Toast.Provider>
  );
}

/** Ends the transitions now, instead of waiting for them. */
const finish = () => {
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
};

/** Waits until every toast has arrived: the opening style is gone, and its transitions ended. */
async function arrived() {
  await expect
    .poll(() => cards().every((card) => !card.hasAttribute("data-starting-style")))
    .toBe(true);
  finish();
}

/** Shows `count` toasts with the shortest use and waits for them to settle. */
async function shown(count = 1, options: Parameters<Manager["add"]>[0] = {}, limit?: number) {
  const manager = Toast.createToastManager();
  await render(<App manager={manager} {...(limit ? { limit } : {})} />);
  for (let i = 1; i <= count; i++) manager.add({ title: `Toast ${i}`, timeout: 0, ...options });
  await expect.poll(() => cards().length).toBe(count);
  await arrived();
  return manager;
}

const resolve = (property: "color" | "box-shadow", value: string) => {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  document.body.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
};

describe("Toast", () => {
  test("the shortest use: a manager's toast shows its title, description, and close", async () => {
    const manager = await shown(1, { description: "All changes are in." });
    const card = cards()[0] as HTMLElement;
    expect(one(".ow-toast__title", card)?.textContent).toBe("Toast 1");
    expect(one(".ow-toast__description", card)?.textContent).toBe("All changes are in.");
    expect(one(".ow-toast__close", card)?.getAttribute("aria-label")).toBe("Close");
    // No action without `actionProps`, no mark without a type.
    expect(one(".ow-toast__action", card)).toBeNull();
    expect(one(".ow-toast__mark", card)).toBeNull();
    manager.close();
  });

  test("useToastManager adds a toast from a component", async () => {
    function Adder() {
      const manager = Toast.useToastManager();
      return (
        <button type="button" onClick={() => manager.add({ title: "Saved", timeout: 0 })}>
          Save
        </button>
      );
    }
    const screen = await render(
      <Toast.Provider>
        <Adder />
        <Toast.Portal>
          <Toast.Viewport />
        </Toast.Portal>
      </Toast.Provider>,
    );
    await screen.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => byText("Saved")).toBeDefined();
  });

  test("the viewport is a labelled live region; F6 moves focus to it", async () => {
    await shown(1);
    const live = region() as HTMLElement;
    expect(live.getAttribute("role")).toBe("region");
    expect(live.getAttribute("aria-live")).toBe("polite");
    expect(live.getAttribute("aria-label")).toBe("Notifications");
    await userEvent.keyboard("{F6}");
    await expect.poll(() => document.activeElement).toBe(live);
  });

  test("the viewport is as tall as the front card, so its focus ring hugs it", async () => {
    await shown(3);
    const live = region() as HTMLElement;
    const front = (cards()[0] as HTMLElement).getBoundingClientRect();
    const box = live.getBoundingClientRect();
    expect(Math.abs(box.height - front.height)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(box.bottom - front.bottom)).toBeLessThanOrEqual(0.5);
    await userEvent.keyboard("{F6}");
    await expect.poll(() => document.activeElement).toBe(live);
    expect(getComputedStyle(live).outlineStyle).toBe("solid");
    expect(getComputedStyle(live).outlineWidth).toBe("2px");
  });

  test("the label of the viewport can be changed", async () => {
    const manager = Toast.createToastManager();
    await render(
      <Toast.Provider toastManager={manager}>
        <Toast.Portal>
          <Toast.Viewport aria-label="Meldingen" />
        </Toast.Portal>
      </Toast.Provider>,
    );
    manager.add({ title: "Hallo", timeout: 0 });
    await expect.poll(() => cards().length).toBe(1);
    expect(region()?.getAttribute("aria-label")).toBe("Meldingen");
  });

  test("a toast is a dialog named by its title and described by its description", async () => {
    await shown(1, { description: "All changes are in." });
    const card = cards()[0] as HTMLElement;
    const title = one(".ow-toast__title", card) as HTMLElement;
    const text = one(".ow-toast__description", card) as HTMLElement;
    expect(card.getAttribute("role")).toBe("dialog");
    expect(card.getAttribute("aria-labelledby")).toBe(title.id);
    expect(card.getAttribute("aria-describedby")).toBe(text.id);
  });

  describe("the action", () => {
    test("draws a small Button when the toast has actionProps, and calls its onClick", async () => {
      const onClick = vi.fn();
      await shown(1, { actionProps: { children: "Undo", onClick } });
      const action = one(".ow-toast__action") as HTMLElement;
      expect(action.textContent).toBe("Undo");
      expect(action.classList.contains("ow-button")).toBe(true);
      expect(action.classList.contains("ow-button--sm")).toBe(true);
      expect(action.classList.contains("ow-button--secondary")).toBe(true);
      action.click();
      expect(onClick).toHaveBeenCalledOnce();
    });

    test("render swaps the button; a link works", async () => {
      const manager = Toast.createToastManager();
      await render(
        <Toast.Provider toastManager={manager}>
          <Toast.Portal>
            <Toast.Viewport>
              <Toast.Root toast={{ id: "a", title: "Moved", actionProps: { children: "Open" } }}>
                <Toast.Content>
                  <Toast.Title />
                  <Toast.Action render={<a href="/inbox" />} />
                </Toast.Content>
              </Toast.Root>
            </Toast.Viewport>
          </Toast.Portal>
        </Toast.Provider>,
      );
      await expect.poll(() => one("[data-slot=toast-action]")).not.toBeNull();
      const action = one("[data-slot=toast-action]") as HTMLElement;
      expect(action.tagName).toBe("A");
      expect(action.classList.contains("ow-button")).toBe(false);
    });
  });

  describe("close", () => {
    test("dismisses the toast", async () => {
      await shown(2);
      const close = one(".ow-toast__close", byText("Toast 2")) as HTMLElement;
      close.click();
      await expect.poll(() => byText("Toast 2")).toBeUndefined();
      expect(byText("Toast 1")).toBeDefined();
    });

    test("its label can be changed, and its icon replaced", async () => {
      const manager = Toast.createToastManager();
      await render(
        <Toast.Provider toastManager={manager}>
          <Toast.Portal>
            <Toast.Viewport>
              <Toast.Root toast={{ id: "a", title: "Hoi" }}>
                <Toast.Title />
                <Toast.Close aria-label="Sluiten">x</Toast.Close>
              </Toast.Root>
            </Toast.Viewport>
          </Toast.Portal>
        </Toast.Provider>,
      );
      await expect.poll(() => one("[data-slot=toast-close]")).not.toBeNull();
      const close = one("[data-slot=toast-close]") as HTMLElement;
      expect(close.getAttribute("aria-label")).toBe("Sluiten");
      expect(close.textContent).toBe("x");
      expect(close.querySelector("svg")).toBeNull();
    });

    test("is a 24px target in the end corner, with a cross of the font size plus 2px", async () => {
      await shown(1);
      const close = one(".ow-toast__close") as HTMLElement;
      const box = close.getBoundingClientRect();
      const card = cards()[0]?.getBoundingClientRect() as DOMRect;
      expect(box.width).toBe(24);
      expect(box.height).toBe(24);
      expect(card.right - box.right).toBe(8);
      expect(box.top - card.top).toBe(8);
      expect(one("svg", close)?.getBoundingClientRect().width).toBe(16);
    });

    test("Escape on a focused toast dismisses it", async () => {
      await shown(2);
      (byText("Toast 2") as HTMLElement).focus();
      await userEvent.keyboard("{Escape}");
      await expect.poll(() => byText("Toast 2")).toBeUndefined();
    });
  });

  describe("type", () => {
    for (const type of ["success", "error", "warning", "info", "loading"] as const) {
      test(`${type} draws a mark in its tone`, async () => {
        await shown(1, { type });
        const mark = one(".ow-toast__mark") as HTMLElement;
        const tone = {
          success: "--ow-good",
          error: "--ow-critical",
          warning: "--ow-warning",
          info: "--ow-accent",
          loading: "--ow-muted",
        }[type];
        expect(getComputedStyle(mark).color).toBe(resolve("color", `var(${tone})`));
        expect(mark.getAttribute("aria-hidden")).toBe("true");
        expect(mark.getBoundingClientRect().width).toBe(16);
        expect(cards()[0]?.getAttribute("data-type")).toBe(type);
      });
    }

    test("an unknown type looks like the default", async () => {
      await shown(1, { type: "custom" });
      expect(one(".ow-toast__mark")).toBeNull();
      expect(cards()[0]?.getAttribute("data-type")).toBe("custom");
    });

    test("a loading mark spins, and stops under reduced motion", async () => {
      onTestFinished(() => commands.setReducedMotion("no-preference"));
      await shown(1, { type: "loading" });
      const spinner = document.querySelector(".ow-toast__mark > svg") as SVGElement;
      expect(getComputedStyle(spinner).animationName).toBe("ow-toast-spin");
      await commands.setReducedMotion("reduce");
      expect(getComputedStyle(spinner).animationName).toBe("none");
    });

    test("a promise toast changes its type as the promise settles", async () => {
      const manager = Toast.createToastManager();
      await render(<App manager={manager} />);
      let settleIt: (value: string) => void = () => {};
      manager.promise(new Promise<string>((done) => (settleIt = done)), {
        loading: "Saving",
        success: "Saved",
        error: "Failed",
      });
      await expect.poll(() => byText("Saving")?.dataset.type).toBe("loading");
      expect(one(".ow-toast__mark", byText("Saving"))).not.toBeNull();
      settleIt("ok");
      await expect.poll(() => byText("Saved")?.dataset.type).toBe("success");
    });
  });

  describe("the stack", () => {
    test("the newest is in front, each older one peeks 8px higher and its content is hidden", async () => {
      await shown(3);
      const [front, middle, back] = cards() as [HTMLElement, HTMLElement, HTMLElement];
      expect(front.textContent).toContain("Toast 3");
      expect(front.style.getPropertyValue("--toast-index")).toBe("0");
      expect(back.style.getPropertyValue("--toast-index")).toBe("2");
      const top = (card: HTMLElement) => card.getBoundingClientRect().top;
      expect(top(front) - top(middle)).toBeCloseTo(8, 0);
      expect(top(middle) - top(back)).toBeCloseTo(8, 0);
      // A closed stack is as tall as its front card, and the cards behind are a little narrower.
      expect(middle.getBoundingClientRect().width).toBeLessThan(
        front.getBoundingClientRect().width,
      );
      const zs = cards().map((card) => Number(getComputedStyle(card).zIndex));
      expect(zs).toEqual([...zs].sort((a, b) => b - a));
      expect(getComputedStyle(one(".ow-toast__content", front) as Element).opacity).toBe("1");
      expect(getComputedStyle(one(".ow-toast__content", middle) as Element).opacity).toBe("0");
      expect(one(".ow-toast__content", middle)?.hasAttribute("data-behind")).toBe(true);
    });

    test("opens into a list on hover, with 8px between the cards, and closes on leaving", async () => {
      await shown(3);
      await userEvent.hover(cards()[0] as HTMLElement);
      await expect
        .poll(() => cards().every((card) => card.hasAttribute("data-expanded")))
        .toBe(true);
      finish();
      const rects = cards().map((card) => card.getBoundingClientRect());
      expect(rects[0]?.top).toBeGreaterThan((rects[1] as DOMRect).bottom);
      expect((rects[0] as DOMRect).top - (rects[1] as DOMRect).bottom).toBeCloseTo(8, 0);
      expect((rects[1] as DOMRect).top - (rects[2] as DOMRect).bottom).toBeCloseTo(8, 0);
      expect(rects[1]?.width).toBe(rects[0]?.width);
      for (const content of document.querySelectorAll(".ow-toast__content")) {
        expect(getComputedStyle(content).opacity).toBe("1");
      }
      await userEvent.unhover(cards()[0] as HTMLElement);
      await expect
        .poll(() => cards().some((card) => card.hasAttribute("data-expanded")))
        .toBe(false);
    });

    test("opens into a list on keyboard focus, through F6", async () => {
      await shown(2);
      await userEvent.keyboard("{F6}");
      await expect
        .poll(() => cards().every((card) => card.hasAttribute("data-expanded")))
        .toBe(true);
    });

    test("the limit hides what it exceeds, without a hit area", async () => {
      await shown(3, {}, 2);
      await expect
        .poll(() => cards().filter((card) => card.hasAttribute("data-limited")).length)
        .toBe(1);
      const limited = cards().find((card) => card.hasAttribute("data-limited")) as HTMLElement;
      finish();
      expect(getComputedStyle(limited).opacity).toBe("0");
      expect(getComputedStyle(limited).pointerEvents).toBe("none");
    });

    test("a taller card behind is clipped to the front card's height while closed", async () => {
      const manager = Toast.createToastManager();
      await render(<App manager={manager} />);
      manager.add({ title: "Tall", description: "A longer line. ".repeat(12), timeout: 0 });
      manager.add({ title: "Short", timeout: 0 });
      await expect.poll(() => cards().length).toBe(2);
      await arrived();
      const [front, back] = cards() as [HTMLElement, HTMLElement];
      expect(back.getBoundingClientRect().height / 0.95).toBeCloseTo(
        front.getBoundingClientRect().height,
        0,
      );
      expect(getComputedStyle(one(".ow-toast__content", back) as Element).overflow).toBe("hidden");
    });
  });

  describe("timers", () => {
    test("a toast leaves by itself after its timeout, and stays at 0", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      onTestFinished(() => {
        vi.useRealTimers();
      });
      const manager = Toast.createToastManager();
      await render(<App manager={manager} />);
      manager.add({ title: "Brief", timeout: 3000 });
      manager.add({ title: "Kept", timeout: 0 });
      // vi.waitFor would move the fake clock itself, so flush with a zero step.
      await vi.advanceTimersByTimeAsync(0);
      expect(cards().length).toBe(2);
      await vi.advanceTimersByTimeAsync(2900);
      expect(byText("Brief")?.hasAttribute("data-ending-style")).toBe(false);
      await vi.advanceTimersByTimeAsync(200);
      expect(byText("Brief")?.hasAttribute("data-ending-style")).toBe(true);
      expect(byText("Kept")?.hasAttribute("data-ending-style")).toBe(false);
    });
  });

  describe("swipe", () => {
    function pointer(target: Element, type: string, x: number, y: number, move = [0, 0]) {
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          pointerId: 5,
          pointerType: "mouse",
          isPrimary: true,
          button: 0,
          buttons: type === "pointerup" ? 0 : 1,
          clientX: x,
          clientY: y,
          movementX: move[0] ?? 0,
          movementY: move[1] ?? 0,
        }),
      );
    }

    /** Presses on the card's title and drags by `steps`, one at a time. */
    function drag(card: HTMLElement, steps: [number, number][]) {
      vi.spyOn(Element.prototype, "setPointerCapture").mockImplementation(() => {});
      onTestFinished(() => {
        vi.restoreAllMocks();
      });
      const target = one(".ow-toast__title", card) as HTMLElement;
      const box = target.getBoundingClientRect();
      let x = box.left + 4;
      let y = box.top + 4;
      pointer(target, "pointerdown", x, y);
      for (const [dx, dy] of steps) {
        x += dx;
        y += dy;
        pointer(target, "pointermove", x, y, [dx, dy]);
      }
      return { release: () => pointer(target, "pointerup", x, y) };
    }

    test("follows the finger: movement variables, and no easing while it does", async () => {
      await shown(1);
      const card = cards()[0] as HTMLElement;
      const home = card.getBoundingClientRect();
      const gesture = drag(card, [
        [0, 1],
        [0, 5],
        [0, 5],
        [0, 10],
      ]);
      await expect.poll(() => card.hasAttribute("data-swiping")).toBe(true);
      await expect.poll(() => card.style.getPropertyValue("--toast-swipe-movement-y")).toBe("20px");
      // Base UI sets the transform and no transition itself while the finger is down.
      expect(getComputedStyle(card).transitionProperty).toBe("none");
      expect(card.getBoundingClientRect().top - home.top).toBeCloseTo(20, 0);
      gesture.release();
    });

    test("a short swipe goes back", async () => {
      await shown(1);
      const card = cards()[0] as HTMLElement;
      const gesture = drag(card, [
        [0, 1],
        [0, 10],
        [0, 10],
      ]);
      gesture.release();
      await expect.poll(() => card.hasAttribute("data-swiping")).toBe(false);
      expect(card.hasAttribute("data-ending-style")).toBe(false);
      expect(card.isConnected).toBe(true);
    });

    for (const [name, steps, direction] of [
      [
        "down",
        [
          [0, 1],
          [0, 30],
          [0, 30],
        ],
        "down",
      ],
      [
        "toward the end",
        [
          [1, 0],
          [30, 0],
          [30, 0],
        ],
        "right",
      ],
    ] as const) {
      test(`a swipe ${name} dismisses it, and it leaves ${direction}`, async () => {
        await shown(1);
        const card = cards()[0] as HTMLElement;
        drag(
          card,
          steps.map(([x, y]) => [x, y] as [number, number]),
        ).release();
        await expect.poll(() => card.getAttribute("data-swipe-direction")).toBe(direction);
        await expect.poll(() => card.hasAttribute("data-ending-style")).toBe(true);
        // It transitions on past where the finger left it (60px), a card's width and a gutter
        // further, and fades.
        const leaving = () => {
          const move = card
            .getAnimations()
            .find((a) => a instanceof CSSTransition && a.transitionProperty === "transform");
          const end = (move?.effect as KeyframeEffect | undefined)?.getKeyframes().at(-1);
          return String(end?.transform).match(/calc\(100% \+ (\d+)px\)/)?.[1];
        };
        await expect.poll(leaving).toBe("76");
        expect(
          card
            .getAnimations()
            .some((a) => a instanceof CSSTransition && a.transitionProperty === "opacity"),
        ).toBe(true);
      });
    }

    test("a swipe toward the start does not dismiss it (left, in left-to-right)", async () => {
      await shown(1);
      const card = cards()[0] as HTMLElement;
      drag(card, [
        [-1, 0],
        [-30, 0],
        [-30, 0],
      ]).release();
      await expect.poll(() => card.hasAttribute("data-swiping")).toBe(false);
      expect(card.hasAttribute("data-ending-style")).toBe(false);
    });

    test("in RTL the end is the left: swiping left dismisses it", async () => {
      const manager = Toast.createToastManager();
      await render(
        <DirectionProvider direction="rtl">
          <App manager={manager} />
        </DirectionProvider>,
      );
      manager.add({ title: "Hallo", timeout: 0 });
      await expect.poll(() => cards().length).toBe(1);
      await arrived();
      const card = cards()[0] as HTMLElement;
      drag(card, [
        [-1, 0],
        [-30, 0],
        [-30, 0],
      ]).release();
      await expect.poll(() => card.getAttribute("data-swipe-direction")).toBe("left");
    });

    test("pressing a button does not start a swipe", async () => {
      await shown(1);
      const card = cards()[0] as HTMLElement;
      const close = one(".ow-toast__close", card) as HTMLElement;
      pointer(close, "pointerdown", 5, 5);
      expect(card.hasAttribute("data-swiping")).toBe(false);
    });
  });

  describe("composing", () => {
    test("a Root without children draws its own body; Viewport children replace the list", async () => {
      const manager = Toast.createToastManager();
      function List() {
        const { toasts } = Toast.useToastManager();
        return toasts.map((toast) => <Toast.Root key={toast.id} toast={toast} />);
      }
      await render(
        <Toast.Provider toastManager={manager}>
          <Toast.Portal>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
          </Toast.Portal>
        </Toast.Provider>,
      );
      manager.add({ title: "Mine", description: "Drawn by Root", type: "info", timeout: 0 });
      await expect.poll(() => cards().length).toBe(1);
      const card = cards()[0] as HTMLElement;
      expect(one(".ow-toast__mark", card)).not.toBeNull();
      expect(one(".ow-toast__description", card)?.textContent).toBe("Drawn by Root");
      expect(one(".ow-toast__close", card)).not.toBeNull();
    });

    test("explicit children replace the body, with the parts in any order", async () => {
      const manager = Toast.createToastManager();
      await render(
        <Toast.Provider toastManager={manager}>
          <Toast.Portal>
            <Toast.Viewport>
              <Toast.Root toast={{ id: "x", title: "Only a title" }}>
                <Toast.Content>
                  <Toast.Title />
                </Toast.Content>
              </Toast.Root>
            </Toast.Viewport>
          </Toast.Portal>
        </Toast.Provider>,
      );
      await expect.poll(() => cards().length).toBe(1);
      expect(one(".ow-toast__close")).toBeNull();
      expect(one(".ow-toast__mark")).toBeNull();
      expect(cards()[0]?.textContent).toBe("Only a title");
    });

    test("Mark draws for the type of the toast it is in, and nowhere else", async () => {
      const manager = Toast.createToastManager();
      await render(
        <>
          <Toast.Mark data-testid="alone" />
          <Toast.Provider toastManager={manager}>
            <Toast.Portal>
              <Toast.Viewport>
                <Toast.Root toast={{ id: "x", title: "Done", type: "success" }}>
                  <Toast.Content>
                    <Toast.Title />
                    <Toast.Mark className="mine" />
                  </Toast.Content>
                </Toast.Root>
              </Toast.Viewport>
            </Toast.Portal>
          </Toast.Provider>
        </>,
      );
      await expect.poll(() => cards().length).toBe(1);
      expect(document.querySelector('[data-testid="alone"]')).toBeNull();
      expect(one(".ow-toast__mark.mine")).not.toBeNull();
    });

    test("an anchored toast sits 10px from its anchor, with an arrow, as a popup", async () => {
      const manager = Toast.createToastManager();
      await render(
        <>
          <button type="button" data-testid="anchor" style={{ margin: 200 }}>
            Copy
          </button>
          <Toast.Provider toastManager={manager}>
            <Toast.Portal>
              <Toast.Viewport />
            </Toast.Portal>
          </Toast.Provider>
        </>,
      );
      const anchor = document.querySelector('[data-testid="anchor"]') as HTMLElement;
      manager.add({
        title: "Copied",
        timeout: 0,
        positionerProps: { anchor, side: "top" },
      });
      await expect.poll(() => cards().length).toBe(1);
      await arrived();
      const card = cards()[0] as HTMLElement;
      expect(card.hasAttribute("data-anchored")).toBe(true);
      expect(one(".ow-toast__arrow", card)).not.toBeNull();
      const positioner = card.closest(".ow-toast__positioner") as HTMLElement;
      expect(positioner.getAttribute("data-side")).toBe("top");
      // It is not in the stack: placed by the positioner, with no stack transform.
      expect(getComputedStyle(card).position).toBe("static");
      expect(getComputedStyle(card).transform).toBe("none");
      // Placed once Base UI has measured it; it rounds the position to whole pixels.
      const gap = () => anchor.getBoundingClientRect().top - card.getBoundingClientRect().bottom;
      await expect.poll(() => Math.abs(gap() - 10) <= 0.5).toBe(true);
      // The viewport that holds it takes no room.
      expect(getComputedStyle(region() as HTMLElement).position).toBe("static");
    });
  });

  describe("look", () => {
    test("a raised card with the popup shadow, light and dark", async () => {
      onTestFinished(() => {
        delete root.dataset.theme;
      });
      await shown(1, { description: "Body" });
      const card = cards()[0] as HTMLElement;
      for (const theme of ["light", "dark"]) {
        root.dataset.theme = theme;
        const style = getComputedStyle(card);
        expect(style.backgroundColor).toBe(resolve("color", "var(--ow-raised-bg)"));
        expect(style.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
        expect(style.color).toBe(resolve("color", "var(--ow-fg)"));
        expect(getComputedStyle(one(".ow-toast__title", card) as Element).color).toBe(
          resolve("color", "var(--ow-fg)"),
        );
        expect(getComputedStyle(one(".ow-toast__description", card) as Element).color).toBe(
          resolve("color", "var(--ow-muted)"),
        );
      }
    });

    test("the radius is the theme's", async () => {
      await shown(1);
      const radius = getComputedStyle(root).getPropertyValue("--ow-radius").trim();
      expect(getComputedStyle(cards()[0] as HTMLElement).borderTopLeftRadius).toBe(radius);
    });

    test("more contrast adds a 1px --ow-edge ring", async () => {
      onTestFinished(() => commands.setContrast("no-preference"));
      await shown(1);
      const card = cards()[0] as HTMLElement;
      const shadow = getComputedStyle(card).boxShadow;
      await commands.setContrast("more");
      const ring = resolve("box-shadow", "0 0 0 1px var(--ow-edge)");
      expect(getComputedStyle(card).boxShadow).toBe(`${shadow}, ${ring}`);
    });

    test("keeps its edge in forced colors, and the mark in a system color", async () => {
      onTestFinished(() => commands.setForcedColors("none"));
      await shown(1, { type: "success" });
      await commands.setForcedColors("active");
      const style = getComputedStyle(cards()[0] as HTMLElement);
      expect(style.outlineStyle).toBe("solid");
      expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(getComputedStyle(one(".ow-toast__mark") as Element).color).toBe(
        resolve("color", "CanvasText"),
      );
    });

    test("sits at the bottom end: bottom right", async () => {
      await shown(1);
      const box = (cards()[0] as HTMLElement).getBoundingClientRect();
      expect(Math.round(window.innerWidth - box.right)).toBe(16);
      expect(Math.round(window.innerHeight - box.bottom)).toBe(16);
    });

    test("in RTL the bottom end is the left", async () => {
      const manager = Toast.createToastManager();
      await render(
        <DirectionProvider direction="rtl">
          <App manager={manager} />
        </DirectionProvider>,
      );
      manager.add({ title: "Hallo", timeout: 0 });
      await expect.poll(() => cards().length).toBe(1);
      await arrived();
      expect(region()?.getAttribute("dir")).toBe("rtl");
      const rtl = (cards()[0] as HTMLElement).getBoundingClientRect();
      expect(Math.round(rtl.left)).toBe(16);
    });

    test("a class of yours sets the width, and a token set on the card changes its surface", async () => {
      const sheet = document.createElement("style");
      sheet.textContent =
        ".mine { inline-size: 30rem; max-inline-size: none; --_bg: rgb(1, 2, 3); }";
      document.head.append(sheet);
      onTestFinished(() => sheet.remove());
      await shown(1);
      region()?.classList.add("mine");
      (cards()[0] as HTMLElement).classList.add("mine");
      expect(getComputedStyle(region() as HTMLElement).width).toBe("480px");
      expect(getComputedStyle(cards()[0] as HTMLElement).backgroundColor).toBe("rgb(1, 2, 3)");
    });

    test("under reduced motion it fades in place, with no slide", async () => {
      onTestFinished(() => commands.setReducedMotion("no-preference"));
      await commands.setReducedMotion("reduce");
      const manager = Toast.createToastManager();
      await render(<App manager={manager} />);
      manager.add({ title: "Hello", timeout: 0 });
      await expect.poll(() => cards().length).toBe(1);
      const card = cards()[0] as HTMLElement;
      const style = getComputedStyle(card);
      expect(style.transitionProperty).toBe("opacity");
      card.setAttribute("data-starting-style", "");
      expect(style.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
      card.removeAttribute("data-starting-style");
    });
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <Toast.Provider>
        <Toast.Portal>
          <Toast.Viewport />
        </Toast.Portal>
        <Toast.Viewport>
          <Toast.Root toast={{ id: "a", title: "Saved", type: "success" }} />
        </Toast.Viewport>
      </Toast.Provider>,
    );
    expect(html).toContain("ow-toast__viewport");
    expect(html).toContain("ow-toast__mark");
    expect(html).toContain("ow-toast__close");
    expect(errors).not.toHaveBeenCalled();
  });

  /** No violations; axe cannot see a Button's face, so only a Button's text may be unknown. */
  async function checked() {
    const { violations, contrastUnknown } = await axeReport(document.body);
    expect(violations).toEqual([]);
    for (const target of contrastUnknown) {
      expect(document.querySelector(target)?.closest(".ow-button")).not.toBeNull();
    }
  }

  test("has no axe violations in light and dark, with toasts shown", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const manager = Toast.createToastManager();
    await render(
      <main>
        <h1>Page</h1>
        <App manager={manager} />
      </main>,
    );
    manager.add({
      title: "Saved",
      description: "All changes are in.",
      type: "success",
      timeout: 0,
    });
    manager.add({ title: "Failed", type: "error", timeout: 0, actionProps: { children: "Retry" } });
    manager.add({ title: "Heads up", description: "Low disk space.", type: "warning", timeout: 0 });
    await expect.poll(() => cards().length).toBe(3);
    await arrived();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await checked();
    }
    // Opened, the cards behind show too.
    await userEvent.keyboard("{F6}");
    await expect.poll(() => cards().every((card) => card.hasAttribute("data-expanded"))).toBe(true);
    finish();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await checked();
    }
  });

  test("runs no rAF and no animations when idle, with toasts shown", async () => {
    await shown(3, { description: "Body", type: "success" });
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("runs no rAF and no animations when idle, with no toast", async () => {
    const manager = Toast.createToastManager();
    await render(<App manager={manager} />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("passes className, style, render, and ref through its parts", async () => {
    const refs = {
      viewport: createRef<HTMLDivElement>(),
      root: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      mark: createRef<HTMLSpanElement>(),
      title: createRef<HTMLHeadingElement>(),
      description: createRef<HTMLParagraphElement>(),
      action: createRef<HTMLButtonElement>(),
      close: createRef<HTMLButtonElement>(),
    };
    const manager = Toast.createToastManager();
    await render(
      <Toast.Provider toastManager={manager}>
        <Toast.Portal>
          <Toast.Viewport ref={refs.viewport} className="mine" style={{ outlineColor: "red" }}>
            <Toast.Root
              ref={refs.root}
              className="mine"
              toast={{
                id: "a",
                title: "T",
                description: "D",
                type: "info",
                actionProps: { children: "Go" },
              }}
            >
              <Toast.Content ref={refs.content} className="mine">
                <Toast.Mark ref={refs.mark} className="mine" />
                <Toast.Title ref={refs.title} className="mine" />
                <Toast.Description ref={refs.description} className="mine" />
                <Toast.Action ref={refs.action} className="mine" render={<a href="/go" />} />
                <Toast.Close ref={refs.close} className="mine" />
              </Toast.Content>
            </Toast.Root>
          </Toast.Viewport>
        </Toast.Portal>
      </Toast.Provider>,
    );
    await expect.poll(() => cards().length).toBe(1);
    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current, name).toBeInstanceOf(HTMLElement);
      expect(ref.current?.classList.contains("mine"), name).toBe(true);
    }
    expect(refs.viewport.current?.style.outlineColor).toBe("red");
    expect(refs.action.current?.tagName).toBe("A");
    expect(refs.viewport.current?.classList.contains("ow-toast__viewport")).toBe(true);
  });
});

test("every part has its data-slot", async () => {
  const manager = Toast.createToastManager();
  await render(
    <>
      <button type="button" data-testid="anchor">
        Copy
      </button>
      <Toast.Provider toastManager={manager}>
        <Toast.Portal>
          <Toast.Viewport />
        </Toast.Portal>
      </Toast.Provider>
    </>,
  );
  manager.add({
    title: "T",
    description: "D",
    type: "success",
    timeout: 0,
    actionProps: { children: "A" },
    positionerProps: { anchor: document.querySelector('[data-testid="anchor"]') as HTMLElement },
  });
  await expect.poll(() => cards().length).toBe(1);
  const slots = [...document.querySelectorAll('[data-slot^="toast"]')].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "toast-viewport",
    "toast-positioner",
    "toast",
    "toast-arrow",
    "toast-content",
    "toast-mark",
    "toast-text",
    "toast-title",
    "toast-description",
    "toast-action",
    "toast-close",
  ]);
});
