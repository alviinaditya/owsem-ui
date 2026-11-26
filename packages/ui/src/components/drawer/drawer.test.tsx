import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Button } from "../button";
import { Drawer } from "./index";

const root = document.documentElement;
type Direction = "up" | "down" | "left" | "right";

/** The shortest drawer: a trigger, a title, a line, a field, and a Close button. */
function Share({
  open,
  swipeDirection,
  popupStyle,
  snapPoints,
  defaultSnapPoint,
}: {
  open?: boolean;
  swipeDirection?: Direction;
  popupStyle?: CSSProperties;
  snapPoints?: string[];
  defaultSnapPoint?: string;
}) {
  return (
    <Drawer.Root
      {...(open === undefined ? {} : { defaultOpen: open })}
      {...(swipeDirection ? { swipeDirection } : {})}
      {...(snapPoints ? { snapPoints } : {})}
      {...(defaultSnapPoint ? { defaultSnapPoint } : {})}
    >
      <Drawer.Trigger>Share</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Popup style={popupStyle}>
          <Drawer.Title>Share the draft</Drawer.Title>
          <Drawer.Description>Anyone with the link can read it.</Drawer.Description>
          <input aria-label="Link" defaultValue="owsem.dev/d/42" />
          <Drawer.Close>Done</Drawer.Close>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** A drawer with another nested in it; `open` opens both. */
function Nested({ open }: { open?: boolean }) {
  return (
    <Drawer.Root defaultOpen>
      <Drawer.Portal>
        <Drawer.Popup data-testid="parent">
          <Drawer.Title>Share the draft</Drawer.Title>
          <Drawer.Root {...(open ? { defaultOpen: true } : {})}>
            <Drawer.Trigger data-testid="remove">Remove the link</Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Popup data-testid="nested">
                <Drawer.Title>Remove the link?</Drawer.Title>
                <Drawer.Close>Keep it</Drawer.Close>
              </Drawer.Popup>
            </Drawer.Portal>
          </Drawer.Root>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

const popup = () => document.querySelector<HTMLElement>(".ow-drawer__popup");
const trigger = () => document.querySelector<HTMLElement>("button") as HTMLElement;
const byId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const gone = () => expect.poll(popup, { timeout: 1000 }).toBeNull();
/** The scrims a person can see. */
const scrims = () =>
  [...document.querySelectorAll<HTMLElement>(".ow-drawer__backdrop")].filter(
    (el) => getComputedStyle(el).display !== "none",
  );

/** Ends the transitions now, instead of waiting for them. */
const finish = () => {
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
};

/** Waits until the popup has arrived: the opening style is gone and its transition has ended. */
async function arrived(el: () => HTMLElement | null = popup) {
  await expect.poll(() => el()?.hasAttribute("data-starting-style")).toBe(false);
  finish();
}

/** Adds an unlayered stylesheet, as an app's own CSS is, for the rest of the test. */
function appCss(css: string) {
  const sheet = document.createElement("style");
  sheet.textContent = css;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
}

/** Resolves a value (e.g. `var(--ow-raised-bg)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

/** Whether a wheel turned over `target` was held back. */
const held = (target: Element = document.body) =>
  !target.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }));
/** The page's own style attributes, which the lock leaves alone. */
const pageStyle = () => [root.style.cssText, document.body.style.cssText];

/** A pointer event at (x, y) of the page, as a mouse drag sends them. */
function pointer(target: Element, type: string, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 7,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: x,
      clientY: y,
    }),
  );
}

/** Presses on the popup's padding (not on a control) and drags it by `steps`, one at a time. */
function drag(sheet: HTMLElement, steps: [number, number][]) {
  const box = sheet.getBoundingClientRect();
  let x = box.left + box.width / 2;
  let y = box.top + 3;
  const target = document.elementFromPoint(x, y) ?? sheet;
  pointer(target, "pointerdown", x, y);
  const move = (dx: number, dy: number) => {
    x += dx;
    y += dy;
    pointer(target, "pointermove", x, y);
  };
  for (const [dx, dy] of steps) move(dx, dy);
  return { move, release: () => pointer(target, "pointerup", x, y) };
}

describe("Drawer", () => {
  test("is Base UI's drawer: named, it takes focus and gives it back", async () => {
    await render(<Share />);
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    const sheet = popup() as HTMLElement;
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(sheet.getAttribute("aria-labelledby")).toBe(
      document.querySelector(".ow-drawer__title")?.id,
    );
    expect(sheet.getAttribute("aria-describedby")).toBe(
      document.querySelector(".ow-drawer__description")?.id,
    );
    expect(document.querySelector(".ow-drawer__title")?.tagName).toBe("H2");
    await expect.poll(() => sheet.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(trigger());
  });

  test("is modal by default: focus stays inside, and the page cannot scroll", async () => {
    await render(
      <>
        <Share />
        <div style={{ blockSize: 3000 }} />
      </>,
    );
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    const sheet = popup() as HTMLElement;
    await expect.poll(() => sheet.contains(document.activeElement)).toBe(true);
    for (let i = 0; i < 4; i++) {
      await userEvent.keyboard("{Tab}");
      expect(sheet.contains(document.activeElement)).toBe(true);
    }
    // OwsemUI's lock holds the page; Base UI's `overflow` is put back before it is drawn.
    await expect.poll(() => held()).toBe(true);
    await expect.poll(() => getComputedStyle(root).overflowY).toBe("visible");
    await userEvent.keyboard("{Escape}");
    await gone();
    await expect.poll(() => held()).toBe(false);
  });

  test("a press on the scrim shuts it", async () => {
    await render(<Share open />);
    await expect.poll(() => scrims().length).toBe(1);
    await arrived();
    await userEvent.click(document.querySelector(".ow-drawer__viewport") as HTMLElement, {
      position: { x: 5, y: 5 },
    });
    await gone();
  });

  test("opens from a trigger placed elsewhere, or from code, through a handle", async () => {
    const handle = Drawer.createHandle();
    await render(
      <>
        <Drawer.Trigger handle={handle} id="far">
          Far
        </Drawer.Trigger>
        <Drawer.Root handle={handle}>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Details</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      </>,
    );
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    handle.close();
    await gone();
    handle.open("far");
    await expect.poll(popup).not.toBeNull();
  });

  test("controlled and uncontrolled both work", async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Trigger>Open</Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Details</Drawer.Title>
              <Drawer.Close>Done</Drawer.Close>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      );
    }
    await render(<Controlled />);
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    await userEvent.click(document.querySelector(".ow-drawer__popup button") as HTMLElement);
    await gone();
  });

  test("Trigger and Close wear your button, through render", async () => {
    await render(
      <Drawer.Root>
        <Drawer.Trigger render={<Button variant="outline" />}>Share</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title>Details</Drawer.Title>
            <Drawer.Close render={<Button />}>Done</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(trigger().classList.contains("ow-button")).toBe(true);
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    const close = document.querySelector(".ow-drawer__popup button") as HTMLElement;
    expect(close.classList.contains("ow-button")).toBe(true);
    await userEvent.click(close);
    await gone();
  });

  describe("the viewport", () => {
    test("the Popup draws the one Base UI needs around it", async () => {
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      expect(document.querySelectorAll(".ow-drawer__viewport").length).toBe(1);
      expect(popup()?.parentElement?.classList.contains("ow-drawer__viewport")).toBe(true);
    });

    test("an explicit Viewport is used, and not drawn twice", async () => {
      await render(
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Viewport className="mine">
              <Drawer.Popup>
                <Drawer.Title>Details</Drawer.Title>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      const viewports = document.querySelectorAll(".ow-drawer__viewport");
      expect(viewports.length).toBe(1);
      expect(viewports[0]?.classList.contains("mine")).toBe(true);
    });

    test("each nested drawer has its own", async () => {
      await render(<Nested open />);
      await expect.poll(() => byId("nested")).not.toBeNull();
      expect(document.querySelectorAll(".ow-drawer__viewport").length).toBe(2);
    });

    test("it covers the screen and clips nothing it holds, with no scroll of its own", async () => {
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      const style = getComputedStyle(document.querySelector(".ow-drawer__viewport") as Element);
      expect(style.position).toBe("fixed");
      expect(style.overflow).toBe("hidden");
      expect(style.overscrollBehaviorY).toBe("contain");
    });
  });

  describe("the scrim", () => {
    test("Portal draws it with no configuration", async () => {
      await render(<Share open />);
      await expect.poll(() => scrims().length).toBe(1);
      expect(scrims()[0]?.getAttribute("role")).toBe("presentation");
    });

    test("backdrop={false} draws none", async () => {
      await render(
        <Drawer.Root defaultOpen>
          <Drawer.Portal backdrop={false}>
            <Drawer.Popup>
              <Drawer.Title>Details</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      expect(document.querySelector(".ow-drawer__backdrop")).toBeNull();
    });

    test("an explicit Backdrop replaces it, also when wrapped", async () => {
      const Wrapped = () => <Drawer.Backdrop className="mine" />;
      await render(
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Wrapped />
            <Drawer.Popup>
              <Drawer.Title>Details</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      await expect.poll(() => scrims().length).toBe(1);
      expect(scrims()[0]?.classList.contains("mine")).toBe(true);
    });

    test("fades, without moving, on its own curve", async () => {
      const runs: string[] = [];
      const onRun = (event: TransitionEvent) => {
        if ((event.target as HTMLElement).classList.contains("ow-drawer__backdrop")) {
          runs.push(event.propertyName);
        }
      };
      document.addEventListener("transitionrun", onRun);
      onTestFinished(() => document.removeEventListener("transitionrun", onRun));
      await render(<Share />);
      await userEvent.click(trigger());
      await expect.poll(() => runs).toContain("opacity");
      await arrived();
      expect(runs).toEqual(["opacity"]);
      const style = getComputedStyle(scrims()[0] as HTMLElement);
      expect(style.transitionDuration).toBe("0.4s");
      expect(style.transitionTimingFunction).toBe(resolveEase());
    });

    test("follows the swipe: as transparent as the sheet is far gone, with no easing", async () => {
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      await arrived();
      const scrim = scrims()[0] as HTMLElement;
      scrim.setAttribute("data-swiping", "");
      expect(getComputedStyle(scrim).transitionDuration).toBe("0s");
      scrim.style.setProperty("--drawer-swipe-progress", "0.25");
      expect(getComputedStyle(scrim).opacity).toBe("0.75");
    });
  });

  /** The Core drawer curve, as the browser writes it. */
  function resolveEase() {
    const probe = document.createElement("span");
    probe.style.transitionTimingFunction = "var(--ow-ease-drawer)";
    document.body.append(probe);
    const value = getComputedStyle(probe).transitionTimingFunction;
    probe.remove();
    return value;
  }

  describe("motion", () => {
    test("slides in from its edge on the Core drawer curve, 400 ms, and out in 300 ms", async () => {
      const runs: { property: string; transform: unknown; duration: string }[] = [];
      const onRun = (event: TransitionEvent) => {
        const target = event.target as HTMLElement;
        if (!target.classList.contains("ow-drawer__popup")) return;
        const transition = target
          .getAnimations()
          .find((a) => (a as CSSTransition).transitionProperty === event.propertyName);
        const effect = transition?.effect as KeyframeEffect | undefined;
        runs.push({
          property: event.propertyName,
          transform: effect?.getKeyframes()[0]?.transform,
          duration: getComputedStyle(target).transitionDuration,
        });
      };
      document.addEventListener("transitionrun", onRun);
      onTestFinished(() => document.removeEventListener("transitionrun", onRun));
      await render(<Share />);
      await userEvent.click(trigger());
      await expect.poll(() => runs.length).toBe(1);
      expect(runs[0]?.property).toBe("transform");
      expect(String(runs[0]?.transform)).toMatch(/translateY\(.+\)|matrix/);
      const style = getComputedStyle(popup() as HTMLElement);
      expect(style.transitionProperty).toBe("transform");
      expect(style.transitionDuration).toBe("0.4s");
      expect(style.transitionTimingFunction).toBe(resolveEase());
      await arrived();
      await userEvent.keyboard("{Escape}");
      await expect.poll(() => runs.length).toBe(2);
      expect(runs[1]?.duration).toBe("0.3s");
      await gone();
    });

    test("a fast swipe leaves faster: the release strength scales the duration", async () => {
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      await arrived();
      const sheet = popup() as HTMLElement;
      sheet.setAttribute("data-ending-style", "");
      sheet.style.setProperty("--drawer-swipe-strength", "0.5");
      expect(getComputedStyle(sheet).transitionDuration).toBe("0.15s");
    });

    test("under reduced motion it fades without sliding", async () => {
      onTestFinished(() => commands.setReducedMotion("no-preference"));
      await commands.setReducedMotion("reduce");
      const runs: string[] = [];
      const onRun = (event: TransitionEvent) => {
        if ((event.target as HTMLElement).classList.contains("ow-drawer__popup")) {
          runs.push(event.propertyName);
        }
      };
      document.addEventListener("transitionrun", onRun);
      onTestFinished(() => document.removeEventListener("transitionrun", onRun));
      await render(<Share />);
      await userEvent.click(trigger());
      await expect.poll(() => runs).toContain("opacity");
      await arrived();
      expect(runs).not.toContain("transform");
      await userEvent.keyboard("{Escape}");
      await gone();
      expect(runs).not.toContain("transform");
    });
  });

  describe("swiping", () => {
    test("follows the finger: the swipe variables move it, and the scrim follows", async () => {
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      await arrived();
      const sheet = popup() as HTMLElement;
      const rest = sheet.getBoundingClientRect().top;
      const swipe = drag(sheet, [
        [0, 20],
        [0, 20],
        [0, 20],
      ]);
      await expect.poll(() => sheet.hasAttribute("data-swiping")).toBe(true);
      // Base UI waits for a few pixels before it takes the gesture for a swipe.
      const moved = Number.parseFloat(sheet.style.getPropertyValue("--drawer-swipe-movement-y"));
      expect(moved).toBeGreaterThan(20);
      expect(sheet.getBoundingClientRect().top).toBeCloseTo(rest + moved, 0);
      expect(getComputedStyle(sheet).userSelect).toBe("none");
      expect(sheet.style.transition).toBe("none");
      // Back to where it began, so the release is slow and short: it settles and stays open.
      swipe.move(0, -40);
      swipe.move(0, -20);
      swipe.release();
      await expect.poll(() => sheet.hasAttribute("data-swiping")).toBe(false);
      expect(popup()).not.toBeNull();
      await expect
        .poll(() => sheet.style.getPropertyValue("--drawer-swipe-movement-y"))
        .toBe("0px");
    });

    test("a swipe far enough shuts it, and the scrim goes with it", async () => {
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      await arrived();
      const sheet = popup() as HTMLElement;
      const swipe = drag(sheet, [
        [0, 80],
        [0, 80],
        [0, 80],
      ]);
      swipe.release();
      await gone();
      await expect.poll(() => scrims().length).toBe(0);
      expect(document.activeElement).toBe(trigger());
    });

    test("a mouse drag inside Content does not swipe, so text can be selected", async () => {
      await render(
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Terms</Drawer.Title>
              <Drawer.Content data-testid="content">
                <p>Long text.</p>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      await arrived();
      const text = byId("content")?.querySelector("p") as HTMLElement;
      const box = text.getBoundingClientRect();
      const x = box.left + 4;
      const y = box.top + 4;
      pointer(text, "pointerdown", x, y);
      pointer(text, "pointermove", x, y + 60);
      pointer(text, "pointermove", x, y + 120);
      expect(popup()?.hasAttribute("data-swiping")).toBe(false);
      pointer(text, "pointerup", x, y + 120);
    });

    test("a SwipeArea sits on the edge the drawer comes from", async () => {
      await render(
        <Drawer.Root>
          <Drawer.SwipeArea />
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Details</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      const area = document.querySelector<HTMLElement>(".ow-drawer__swipe-area") as HTMLElement;
      const box = area.getBoundingClientRect();
      expect(getComputedStyle(area).position).toBe("fixed");
      expect(area.getAttribute("data-swipe-direction")).toBe("up");
      expect(box.bottom).toBe(window.innerHeight);
      expect(box.height).toBe(24);
      expect(box.width).toBe(window.innerWidth);
    });
  });

  describe("snap points", () => {
    test("rests at the snap point: the sheet is as tall as its largest, moved down by the rest", async () => {
      await render(
        <Share
          open
          snapPoints={["200px", "600px"]}
          defaultSnapPoint="200px"
          popupStyle={{ blockSize: 600 }}
        />,
      );
      await expect.poll(popup).not.toBeNull();
      await arrived();
      const sheet = popup() as HTMLElement;
      await expect
        .poll(() => sheet.style.getPropertyValue("--drawer-snap-point-offset"))
        .toBe("400px");
      finish();
      expect(sheet.getBoundingClientRect().top).toBeCloseTo(window.innerHeight - 200, 0);
    });
  });

  test("a sheet with a Content scrolls there, and the popup does not", async () => {
    await render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title>Terms</Drawer.Title>
            <Drawer.Content data-testid="content">
              <div style={{ blockSize: 3000 }} />
            </Drawer.Content>
            <Drawer.Close>Accept</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    await arrived();
    const sheet = popup() as HTMLElement;
    const content = byId("content") as HTMLElement;
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(sheet.scrollHeight).toBeLessThanOrEqual(sheet.clientHeight);
    const box = sheet.getBoundingClientRect();
    // The sheet stops short of the top, so the page shows past it.
    expect(box.top).toBeGreaterThanOrEqual(47);
    // The button under the scrolling part stays in view.
    const close = document.querySelector(".ow-drawer__popup > button") as HTMLElement;
    expect(close.getBoundingClientRect().bottom).toBeLessThanOrEqual(box.bottom);
  });

  describe("nested", () => {
    test("the parent steps back, a second scrim dims it, and Escape shuts the top one", async () => {
      await render(<Nested />);
      await expect.poll(() => byId("parent")).not.toBeNull();
      await arrived(() => byId("parent"));
      const parent = byId("parent") as HTMLElement;
      expect(parent.hasAttribute("data-nested-drawer-open")).toBe(false);
      expect(getComputedStyle(parent).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
      await userEvent.click(byId("remove") as HTMLElement);
      await expect.poll(() => byId("nested")).not.toBeNull();
      await expect.poll(() => parent.hasAttribute("data-nested-drawer-open")).toBe(true);
      await arrived(() => byId("nested"));
      finish();
      expect(parent.style.getPropertyValue("--nested-drawers")).toBe("1");
      const matrix = new DOMMatrix(getComputedStyle(parent).transform);
      expect(matrix.a).toBeCloseTo(0.95, 3);
      expect(matrix.d).toBeCloseTo(0.95, 3);
      expect(matrix.f).toBeCloseTo(-28, 0);
      expect(scrims().length).toBe(2);
      await userEvent.keyboard("{Escape}");
      await expect.poll(() => byId("nested")).toBeNull();
      expect(byId("parent")).not.toBeNull();
      await expect.poll(() => document.activeElement).toBe(byId("remove"));
    });

    test("under reduced motion the parent stays where it is", async () => {
      onTestFinished(() => commands.setReducedMotion("no-preference"));
      await commands.setReducedMotion("reduce");
      await render(<Nested open />);
      await expect.poll(() => byId("nested")).not.toBeNull();
      await arrived(() => byId("nested"));
      await expect.poll(() => byId("parent")?.hasAttribute("data-nested-drawer-open")).toBe(true);
      expect(getComputedStyle(byId("parent") as HTMLElement).transform).toBe(
        "matrix(1, 0, 0, 1, 0, 0)",
      );
    });
  });

  describe("Indent", () => {
    function App() {
      return (
        <Drawer.Provider>
          <Drawer.IndentBackground data-testid="background" />
          <Drawer.Indent data-testid="indent">
            <Drawer.Root>
              <Drawer.Trigger>Open</Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Popup>
                  <Drawer.Title>Details</Drawer.Title>
                </Drawer.Popup>
              </Drawer.Portal>
            </Drawer.Root>
          </Drawer.Indent>
        </Drawer.Provider>
      );
    }

    test("the page recedes while a drawer is open, and is still at rest", async () => {
      await render(<App />);
      const indent = byId("indent") as HTMLElement;
      expect(indent.hasAttribute("data-active")).toBe(false);
      expect(getComputedStyle(indent).transform).toBe("none");
      expect(getComputedStyle(indent).overflow).toBe("visible");
      await userEvent.click(trigger());
      await expect.poll(() => indent.hasAttribute("data-active")).toBe(true);
      finish();
      const matrix = new DOMMatrix(getComputedStyle(indent).transform);
      expect(matrix.a).toBeCloseTo(0.96, 3);
      expect(getComputedStyle(indent).borderTopLeftRadius).toBe(resolveLength("var(--ow-radius)"));
      expect(getComputedStyle(indent).overflow).toBe("clip");
      await userEvent.keyboard("{Escape}");
      await gone();
      await expect.poll(() => indent.hasAttribute("data-active")).toBe(false);
      finish();
      expect(getComputedStyle(indent).transform).toBe("none");
    });

    test("the layer around it is behind the page, on theme tokens", async () => {
      await render(<App />);
      const style = getComputedStyle(byId("background") as HTMLElement);
      expect(style.position).toBe("fixed");
      expect(style.zIndex).toBe("-1");
      expect(style.backgroundColor).toBe(resolve("color", "var(--ow-well-bg)"));
      expect(getComputedStyle(byId("indent") as HTMLElement).backgroundColor).toBe(
        resolve("color", "var(--ow-bg)"),
      );
    });

    test("under reduced motion the page does not recede", async () => {
      onTestFinished(() => commands.setReducedMotion("no-preference"));
      await commands.setReducedMotion("reduce");
      await render(<App />);
      await userEvent.click(trigger());
      const indent = byId("indent") as HTMLElement;
      await expect.poll(() => indent.hasAttribute("data-active")).toBe(true);
      expect(getComputedStyle(indent).transform).toBe("none");
      expect(getComputedStyle(indent).overflow).toBe("visible");
    });
  });

  /** A length such as `var(--ow-radius)` as the browser computes it. */
  function resolveLength(value: string) {
    const probe = document.createElement("span");
    probe.style.borderTopLeftRadius = value;
    document.body.append(probe);
    const computed = getComputedStyle(probe).borderTopLeftRadius;
    probe.remove();
    return computed;
  }

  test("keepMounted: nothing shows while shut, and it opens again", async () => {
    const handle = Drawer.createHandle();
    await render(
      <Drawer.Root handle={handle}>
        <Drawer.Portal keepMounted>
          <Drawer.Popup>
            <Drawer.Title>Details</Drawer.Title>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    const display = (selector: string) =>
      getComputedStyle(document.querySelector(selector) as Element).display;
    for (const part of ["viewport", "popup", "backdrop"]) {
      expect(display(`.ow-drawer__${part}`)).toBe("none");
    }
    handle.open(null);
    await expect.poll(() => display(".ow-drawer__popup")).toBe("flex");
    expect(display(".ow-drawer__viewport")).toBe("block");
    expect(display(".ow-drawer__backdrop")).toBe("block");
  });

  test("Portal renders into `container`", async () => {
    function Contained() {
      const [box, setBox] = useState<HTMLElement | null>(null);
      return (
        <div ref={setBox} data-testid="box">
          <Drawer.Root defaultOpen>
            <Drawer.Portal container={box}>
              <Drawer.Popup>
                <Drawer.Title>Details</Drawer.Title>
              </Drawer.Popup>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      );
    }
    await render(<Contained />);
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.closest('[data-testid="box"]')).not.toBeNull();
    expect(document.querySelector(".ow-drawer__backdrop")?.closest('[data-testid="box"]')).not.toBe(
      null,
    );
  });

  test("passes className, style, render, and ref through its parts", async () => {
    const refs = {
      portal: createRef<HTMLDivElement>(),
      backdrop: createRef<HTMLDivElement>(),
      viewport: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      title: createRef<HTMLHeadingElement>(),
      description: createRef<HTMLParagraphElement>(),
      swipeArea: createRef<HTMLDivElement>(),
      indent: createRef<HTMLDivElement>(),
      indentBackground: createRef<HTMLDivElement>(),
      trigger: createRef<HTMLButtonElement>(),
      close: createRef<HTMLButtonElement>(),
    };
    await render(
      <Drawer.Provider>
        <Drawer.IndentBackground ref={refs.indentBackground} className="ib" />
        <Drawer.Indent ref={refs.indent} className="in">
          <Drawer.Root defaultOpen>
            <Drawer.Trigger ref={refs.trigger} className="r">
              Open
            </Drawer.Trigger>
            <Drawer.SwipeArea ref={refs.swipeArea} className="s" />
            <Drawer.Portal ref={refs.portal} className="o">
              <Drawer.Backdrop ref={refs.backdrop} className="b" style={{ zIndex: 2 }} />
              <Drawer.Viewport ref={refs.viewport} className="v">
                <Drawer.Popup ref={refs.popup} className="u" render={<section />}>
                  <Drawer.Title ref={refs.title} className="t" render={<h3>Title</h3>} />
                  <Drawer.Description ref={refs.description} className="d">
                    Text
                  </Drawer.Description>
                  <Drawer.Content ref={refs.content} className="n">
                    Body
                  </Drawer.Content>
                  <Drawer.Close ref={refs.close} className="c">
                    Done
                  </Drawer.Close>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.Root>
        </Drawer.Indent>
      </Drawer.Provider>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.trigger.current?.className).toContain("r");
    expect(refs.portal.current?.className).toBe("o");
    expect(refs.backdrop.current?.className).toBe("ow-drawer__backdrop b");
    expect(refs.backdrop.current?.style.zIndex).toBe("2");
    expect(refs.viewport.current?.className).toBe("ow-drawer__viewport v");
    expect(refs.popup.current?.className).toBe("ow-drawer__popup u");
    expect(refs.popup.current?.tagName).toBe("SECTION");
    expect(refs.content.current?.className).toBe("ow-drawer__content n");
    expect(refs.title.current?.className).toBe("ow-drawer__title t");
    expect(refs.title.current?.tagName).toBe("H3");
    expect(refs.description.current?.className).toBe("ow-drawer__description d");
    expect(refs.swipeArea.current?.className).toBe("ow-drawer__swipe-area s");
    expect(refs.indent.current?.className).toBe("ow-drawer__indent in");
    expect(refs.indentBackground.current?.className).toBe("ow-drawer__indent-background ib");
    expect(refs.close.current?.className).toContain("c");
  });

  test("sits on the raised fill over the scrim, light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    const scrim = scrims()[0] as HTMLElement;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(surface);
      expect(style.backgroundColor).toBe(resolve("color", "var(--ow-raised-bg)"));
      expect(style.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
      expect(style.color).toBe(resolve("color", "var(--ow-fg)"));
      expect(
        getComputedStyle(document.querySelector(".ow-drawer__description") as Element).color,
      ).toBe(resolve("color", "var(--ow-muted)"));
      expect(getComputedStyle(scrim).backgroundColor).toBe(resolve("color", "var(--ow-backdrop)"));
    }
  });

  describe("customizing", () => {
    test("a theme token set on the popup changes it alone", async () => {
      appCss(".custom { --_bg: rgb(1, 2, 3); --_gap: 5rem; }");
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      popup()?.classList.add("custom");
      const style = getComputedStyle(popup() as HTMLElement);
      expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
    });

    test("a class of yours sets the width, the height, and the padding", async () => {
      appCss(".mine { max-inline-size: none; block-size: 300px; padding: 3px; }");
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      popup()?.classList.add("mine");
      const style = getComputedStyle(popup() as HTMLElement);
      expect(style.maxWidth).toBe("none");
      expect(style.height).toBe("300px");
      expect(style.paddingLeft).toBe("3px");
    });

    test("the title and the description are spaced and styled as Dialog's", async () => {
      await render(<Share open />);
      await expect.poll(popup).not.toBeNull();
      const title = getComputedStyle(document.querySelector(".ow-drawer__title") as Element);
      const text = getComputedStyle(document.querySelector(".ow-drawer__description") as Element);
      expect(title.fontWeight).toBe("600");
      expect(title.fontSize).toBe("16px");
      expect(title.marginBottom).toBe("4px");
      expect(text.marginBottom).toBe(`${16}px`);
    });
  });

  test("more contrast adds a 1px --ow-edge ring to the sheet", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    const shadow = getComputedStyle(surface).boxShadow;
    await commands.setContrast("more");
    const ring = resolve("box-shadow", "0 0 0 1px var(--ow-edge)");
    expect(getComputedStyle(surface).boxShadow).toBe(`${shadow}, ${ring}`);
  });

  test("keeps its edge and the grabber in forced colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    const grabber = getComputedStyle(popup() as HTMLElement, "::before");
    expect(grabber.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("follows the text direction, also in the portal", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Share open />
        </div>
      </DirectionProvider>,
    );
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.getAttribute("dir")).toBe("rtl");
    expect(getComputedStyle(popup() as HTMLElement).direction).toBe("rtl");
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <Drawer.Provider>
        <Drawer.IndentBackground />
        <Drawer.Indent>
          <Drawer.Root defaultOpen>
            <Drawer.Trigger>Share</Drawer.Trigger>
            <Drawer.SwipeArea />
            <Drawer.Portal>
              <Drawer.Popup>
                <Drawer.Title>Share</Drawer.Title>
              </Drawer.Popup>
            </Drawer.Portal>
          </Drawer.Root>
        </Drawer.Indent>
      </Drawer.Provider>,
    );
    expect(html).toContain("ow-drawer__indent");
    expect(html).toContain("ow-drawer__swipe-area");
    expect(errors).not.toHaveBeenCalled();
  });

  test("ships no text of its own", async () => {
    await render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup />
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.textContent).toBe("");
    expect(popup()?.querySelector("button")).toBeNull();
    expect(popup()?.getAttribute("aria-label")).toBeNull();
    // The grabber is drawn by CSS: nothing in the tree for a screen reader.
    expect(getComputedStyle(popup() as HTMLElement, "::before").content).toBe('""');
    expect(popup()?.children.length).toBe(0);
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <Drawer.Root defaultOpen>
          <Drawer.Trigger>Share</Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Share the draft</Drawer.Title>
              <Drawer.Description>Anyone with the link can read it.</Drawer.Description>
              <Drawer.Close>Done</Drawer.Close>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await arrived();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(document.body)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("scrolling inside itself, it has no axe violations", async () => {
    await render(
      <main>
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Terms</Drawer.Title>
              <Drawer.Content>
                <div style={{ blockSize: 2000 }} />
              </Drawer.Content>
              <Drawer.Close render={<Button />}>Accept</Drawer.Close>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await arrived();
    await settle();
    const report = await axeReport(document.body);
    expect(report.violations).toEqual([]);
  });

  test("runs no rAF and no animations when idle, open", async () => {
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    await arrived();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("runs no rAF and no animations when idle, with the page indented", async () => {
    await render(
      <Drawer.Provider>
        <Drawer.Indent>
          <Drawer.Root defaultOpen>
            <Drawer.Portal>
              <Drawer.Popup>
                <Drawer.Title>Details</Drawer.Title>
              </Drawer.Popup>
            </Drawer.Portal>
          </Drawer.Root>
        </Drawer.Indent>
      </Drawer.Provider>,
    );
    await expect.poll(popup).not.toBeNull();
    await arrived();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("holds the page without styling it; a wheel inside a scrollable body still scrolls", async () => {
    const before = pageStyle();
    await render(
      <>
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Terms</Drawer.Title>
              <div data-testid="body" style={{ maxBlockSize: 80, overflowY: "auto" }}>
                <div style={{ blockSize: 800 }} />
              </div>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
        <div style={{ blockSize: 3000 }} />
      </>,
    );
    await expect.poll(popup).not.toBeNull();
    await expect.poll(() => held()).toBe(true);
    expect(pageStyle()).toEqual(before);
    expect(held(byId("body") as HTMLElement)).toBe(false);
    await userEvent.keyboard("{Escape}");
    await gone();
    await expect.poll(() => held()).toBe(false);
    expect(pageStyle()).toEqual(before);
  });

  test("a non-modal drawer leaves the page free", async () => {
    await render(
      <>
        <Drawer.Root defaultOpen modal={false}>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Details</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
        <div style={{ blockSize: 3000 }} />
      </>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(held()).toBe(false);
  });
});

test("every part has its data-slot", async () => {
  await render(
    <Drawer.Provider>
      <Drawer.IndentBackground />
      <Drawer.Indent>
        <Drawer.Root defaultOpen>
          <Drawer.SwipeArea />
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <Drawer.Title>T</Drawer.Title>
                <Drawer.Description>D</Drawer.Description>
                <Drawer.Content>C</Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </Drawer.Indent>
    </Drawer.Provider>,
  );
  await expect.poll(() => document.querySelector('[data-slot="drawer-popup"]')).not.toBeNull();
  const slots = [...document.querySelectorAll('[data-slot^="drawer"]')].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "drawer-indent-background",
    "drawer-indent",
    "drawer-swipe-area",
    "drawer-portal",
    "drawer-backdrop",
    "drawer-viewport",
    "drawer-popup",
    "drawer-title",
    "drawer-description",
    "drawer-content",
  ]);
});
