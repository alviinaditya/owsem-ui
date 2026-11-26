import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Button } from "../button";
import { Select } from "../select";
import { AlertDialog } from "./index";

const root = document.documentElement;

/** The shortest alert: a trigger, a title, a line, a field, and a Close button. */
function Share({ open, popupStyle }: { open?: boolean; popupStyle?: CSSProperties }) {
  return (
    <AlertDialog.Root {...(open === undefined ? {} : { defaultOpen: open })}>
      <AlertDialog.Trigger>Share</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Popup style={popupStyle}>
          <AlertDialog.Title>Share the draft</AlertDialog.Title>
          <AlertDialog.Description>Anyone with the link can read it.</AlertDialog.Description>
          <input aria-label="Link" defaultValue="owsem.dev/d/42" />
          <AlertDialog.Close>Done</AlertDialog.Close>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/** A dialog with another nested in it; `open` opens both. */
function Nested({ open }: { open?: boolean }) {
  return (
    <AlertDialog.Root defaultOpen>
      <AlertDialog.Portal>
        <AlertDialog.Popup data-testid="parent">
          <AlertDialog.Title>Share the draft</AlertDialog.Title>
          <AlertDialog.Root {...(open ? { defaultOpen: true } : {})}>
            <AlertDialog.Trigger data-testid="remove">Remove the link</AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Popup data-testid="nested">
                <AlertDialog.Title>Remove the link?</AlertDialog.Title>
                <AlertDialog.Close>Keep it</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

const popup = () => document.querySelector<HTMLElement>(".ow-alert-dialog__popup");
const trigger = () => document.querySelector<HTMLElement>("button") as HTMLElement;
const byId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const gone = () => expect.poll(popup, { timeout: 1000 }).toBeNull();
/** The scrims a person can see. */
const scrims = () =>
  [...document.querySelectorAll<HTMLElement>(".ow-alert-dialog__backdrop")].filter(
    (el) => getComputedStyle(el).display !== "none",
  );

/** Ends the transitions now, instead of waiting for them. */
const finish = () => {
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
};

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
/** Frames to let Base UI write its page lock (it does in a timeout) before looking. */
const frames = async (n = 6) => {
  for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r));
};

describe("Alert Dialog", () => {
  test("is Base UI's alert dialog: named, it takes focus and gives it back", async () => {
    await render(<Share />);
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    const dialog = popup() as HTMLElement;
    expect(dialog.getAttribute("role")).toBe("alertdialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe(
      document.querySelector(".ow-alert-dialog__title")?.id,
    );
    expect(dialog.getAttribute("aria-describedby")).toBe(
      document.querySelector(".ow-alert-dialog__description")?.id,
    );
    expect(document.querySelector(".ow-alert-dialog__title")?.tagName).toBe("H2");
    await expect.poll(() => dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(trigger());
    // A press on the scrim does not shut it: an alert needs an answer. Close does.
    await userEvent.click(trigger());
    await expect.poll(() => scrims().length).toBe(1);
    await userEvent.click(scrims()[0] as HTMLElement, { position: { x: 5, y: 5 } });
    await settle();
    expect(popup()).not.toBeNull();
    await userEvent.click(document.querySelector(".ow-alert-dialog__popup button") as HTMLElement);
    await gone();
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
    const dialog = popup() as HTMLElement;
    await expect.poll(() => dialog.contains(document.activeElement)).toBe(true);
    for (let i = 0; i < 4; i++) {
      await userEvent.keyboard("{Tab}");
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    // OwsemUI's lock holds the page; Base UI's `overflow` is put back before it is drawn.
    await frames();
    expect(held()).toBe(true);
    expect(getComputedStyle(root).overflowY).toBe("visible");
    await userEvent.keyboard("{Escape}");
    await gone();
    await expect.poll(() => held()).toBe(false);
  });

  test("opens from a trigger placed elsewhere, or from code, through a handle", async () => {
    const handle = AlertDialog.createHandle();
    await render(
      <>
        <AlertDialog.Trigger handle={handle} id="far">
          Far
        </AlertDialog.Trigger>
        <AlertDialog.Root handle={handle}>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Title>Details</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
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
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Title>Details</AlertDialog.Title>
              <AlertDialog.Close>Done</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      );
    }
    await render(<Controlled />);
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    await userEvent.click(document.querySelector(".ow-alert-dialog__popup button") as HTMLElement);
    await gone();
  });

  test("Trigger and Close wear your button, through render", async () => {
    await render(
      <AlertDialog.Root>
        <AlertDialog.Trigger render={<Button variant="outline" />}>Share</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Title>Share the draft</AlertDialog.Title>
            <AlertDialog.Close render={<Button />}>Done</AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    const share = trigger();
    expect(share.classList.contains("ow-button")).toBe(true);
    expect(share.getAttribute("aria-haspopup")).toBe("dialog");
    expect(share.getAttribute("data-variant")).toBe("outline");
    await userEvent.click(share);
    await expect.poll(popup).not.toBeNull();
    expect(share.getAttribute("aria-expanded")).toBe("true");
    const done = document.querySelector(".ow-alert-dialog__popup button") as HTMLElement;
    expect(done.classList.contains("ow-button")).toBe(true);
    await userEvent.click(done);
    await gone();
    expect(document.activeElement).toBe(share);
  });

  describe("the scrim", () => {
    test("Portal draws it with no configuration", async () => {
      await render(<Share open />);
      await expect.poll(() => scrims().length).toBe(1);
      expect(scrims()[0]?.getAttribute("role")).toBe("presentation");
    });

    test("backdrop={false} draws none", async () => {
      await render(
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal backdrop={false}>
            <AlertDialog.Popup>
              <AlertDialog.Title>Details</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      expect(document.querySelector(".ow-alert-dialog__backdrop")).toBeNull();
    });

    test("an explicit Backdrop replaces it, also when wrapped; a press on it does not shut", async () => {
      const Wrapped = () => <AlertDialog.Backdrop className="mine" />;
      await render(
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal>
            <Wrapped />
            <AlertDialog.Popup>
              <AlertDialog.Title>Details</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
      await expect.poll(() => scrims().length).toBe(1);
      const mine = scrims()[0] as HTMLElement;
      expect(mine.classList.contains("mine")).toBe(true);
      await userEvent.click(mine, { position: { x: 5, y: 5 } });
      await settle();
      expect(popup()).not.toBeNull();
    });

    test("fades, without moving, while the popup also grows", async () => {
      const runs: string[] = [];
      const onRun = (event: TransitionEvent) => {
        if ((event.target as HTMLElement).classList.contains("ow-alert-dialog__backdrop")) {
          runs.push(event.propertyName);
        }
      };
      document.addEventListener("transitionrun", onRun);
      onTestFinished(() => document.removeEventListener("transitionrun", onRun));
      await render(<Share />);
      await userEvent.click(trigger());
      await expect.poll(() => runs).toContain("opacity");
      await settle();
      expect(runs).toEqual(["opacity"]);
    });
  });

  test("grows from its middle: 0.96 and transparent to full, 250 ms ease-out", async () => {
    const runs: { property: string; frames: Keyframe[]; duration: string }[] = [];
    const onRun = (event: TransitionEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("ow-alert-dialog__popup")) return;
      const transition = target
        .getAnimations()
        .find((a) => (a as CSSTransition).transitionProperty === event.propertyName);
      const effect = transition?.effect as KeyframeEffect | undefined;
      runs.push({
        property: event.propertyName,
        frames: effect?.getKeyframes() ?? [],
        duration: getComputedStyle(target).transitionDuration,
      });
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
    expect(style.transitionDuration).toBe("0.25s, 0.25s");
    expect(style.transitionTimingFunction).toBe(
      "cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.23, 1, 0.32, 1)",
    );
    // Leaving is quicker, and the panel is gone once it has faded.
    finish();
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(runs.at(-1)?.duration).toBe("0.2s");
  });

  test("too long to show whole, it opens at its start, with focus on the popup", async () => {
    function Long({ viewport }: { viewport?: boolean }) {
      const panel = (
        <AlertDialog.Popup>
          <AlertDialog.Title>Terms</AlertDialog.Title>
          <div style={{ blockSize: 2000 }} />
          <AlertDialog.Close>Accept</AlertDialog.Close>
        </AlertDialog.Popup>
      );
      return (
        <AlertDialog.Root>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            {viewport ? <AlertDialog.Viewport>{panel}</AlertDialog.Viewport> : panel}
          </AlertDialog.Portal>
        </AlertDialog.Root>
      );
    }
    const { rerender } = await render(<Long />);
    await userEvent.click(trigger());
    await expect.poll(() => document.activeElement).toBe(popup());
    expect(popup()?.scrollTop).toBe(0);
    await userEvent.keyboard("{Escape}");
    await gone();
    await rerender(<Long viewport />);
    await userEvent.click(trigger());
    await expect.poll(() => document.activeElement).toBe(popup());
    expect(document.querySelector(".ow-alert-dialog__viewport")?.scrollTop).toBe(0);
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("the first Close is the safe answer and takes the first focus, wherever it sits", async () => {
    const first = createRef<HTMLButtonElement>();
    function Delete({ second, safe = true }: { second?: boolean; safe?: boolean }) {
      return (
        <AlertDialog.Root>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup {...(second ? { initialFocus: first } : {})}>
              <AlertDialog.Title>Delete the draft?</AlertDialog.Title>
              <button type="button" ref={first}>
                Delete
              </button>
              {safe ? <AlertDialog.Close>Cancel</AlertDialog.Close> : null}
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      );
    }
    const { rerender } = await render(<Delete />);
    // The dangerous button comes first in the markup; the focus still goes to Cancel.
    await userEvent.click(trigger());
    await expect.poll(() => document.activeElement?.textContent).toBe("Cancel");
    await userEvent.keyboard("{Escape}");
    await gone();
    // Opened from the keyboard, the same.
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => document.activeElement?.textContent).toBe("Cancel");
    await userEvent.keyboard("{Escape}");
    await gone();
    // Your own initialFocus wins.
    await rerender(<Delete second />);
    await userEvent.click(trigger());
    await expect.poll(() => document.activeElement?.textContent).toBe("Delete");
    await userEvent.keyboard("{Escape}");
    await gone();
    // With no Close, Base UI's rule stands: the first control.
    await rerender(<Delete safe={false} />);
    await userEvent.click(trigger());
    await expect.poll(() => document.activeElement?.textContent).toBe("Delete");
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("the first of several Close buttons in the markup takes the focus", async () => {
    await render(
      <AlertDialog.Root>
        <AlertDialog.Trigger>Open</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Title>Leave?</AlertDialog.Title>
            <button type="button">Leave</button>
            <AlertDialog.Close>Stay</AlertDialog.Close>
            <AlertDialog.Close>Stay too</AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await userEvent.click(trigger());
    await expect.poll(() => document.activeElement?.textContent).toBe("Stay");
  });

  test("with nothing to tab to, it takes focus itself and shows the ring", async () => {
    await render(
      <AlertDialog.Root>
        <AlertDialog.Trigger>Open</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Title>Saved</AlertDialog.Title>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => document.activeElement).toBe(popup());
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
  });

  test("under reduced motion it fades without growing", async () => {
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

  describe("nested", () => {
    test("the parent steps back, a second scrim dims it, and Escape shuts the top one", async () => {
      await render(<Nested />);
      await expect.poll(() => byId("parent")).not.toBeNull();
      const parent = byId("parent") as HTMLElement;
      expect(parent.dataset.nestedDialogOpen).toBeUndefined();
      await userEvent.click(byId("remove") as HTMLElement);
      await expect.poll(() => byId("nested")).not.toBeNull();
      expect(parent.dataset.nestedDialogOpen).toBe("");
      expect(parent.style.getPropertyValue("--nested-dialogs")).toBe("1");
      expect(byId("nested")?.dataset.nested).toBe("");
      await expect.poll(() => scrims().length).toBe(2);
      finish();
      expect(getComputedStyle(parent).transform).toBe("matrix(0.95, 0, 0, 0.95, 0, -16)");
      // On top of the parent, and of the parent's scrim, in that order.
      const box = (byId("nested") as HTMLElement).getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + 1);
      expect(byId("nested")?.contains(top)).toBe(true);
      const position = (scrims()[1] as HTMLElement).compareDocumentPosition(parent);
      expect(position & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();

      await userEvent.keyboard("{Escape}");
      await expect.poll(() => byId("nested")).toBeNull();
      expect(byId("parent")).not.toBeNull();
      expect(parent.dataset.nestedDialogOpen).toBeUndefined();
      finish();
      expect(getComputedStyle(parent).transform).toBe("none");
    });

    test("backdrop={false} on the nested Portal leaves the parent undimmed", async () => {
      await render(
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Title>Parent</AlertDialog.Title>
              <AlertDialog.Root defaultOpen>
                <AlertDialog.Portal backdrop={false}>
                  <AlertDialog.Popup data-testid="nested">
                    <AlertDialog.Title>Nested</AlertDialog.Title>
                  </AlertDialog.Popup>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
      await expect.poll(() => byId("nested")).not.toBeNull();
      expect(scrims().length).toBe(1);
    });

    test("under reduced motion the parent stays where it is", async () => {
      onTestFinished(() => commands.setReducedMotion("no-preference"));
      await commands.setReducedMotion("reduce");
      await render(<Nested open />);
      await expect.poll(() => byId("nested")).not.toBeNull();
      await expect.poll(() => byId("parent")?.dataset.nestedDialogOpen).toBe("");
      finish();
      expect(getComputedStyle(byId("parent") as HTMLElement).transform).toBe("none");
    });
  });

  test("keepMounted: nothing shows while shut, and it opens again", async () => {
    const handle = AlertDialog.createHandle();
    await render(
      <AlertDialog.Root handle={handle}>
        <AlertDialog.Portal keepMounted>
          <AlertDialog.Viewport>
            <AlertDialog.Popup>
              <AlertDialog.Title>Details</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    const display = (selector: string) =>
      getComputedStyle(document.querySelector(selector) as Element).display;
    for (const part of ["viewport", "popup", "backdrop"]) {
      expect(display(`.ow-alert-dialog__${part}`)).toBe("none");
    }
    handle.open(null);
    await expect.poll(() => display(".ow-alert-dialog__popup")).toBe("block");
    expect(display(".ow-alert-dialog__viewport")).toBe("grid");
    expect(display(".ow-alert-dialog__backdrop")).toBe("block");
  });

  test("Portal renders into `container`", async () => {
    function Contained() {
      const [box, setBox] = useState<HTMLElement | null>(null);
      return (
        <div ref={setBox} data-testid="box">
          <AlertDialog.Root defaultOpen>
            <AlertDialog.Portal container={box}>
              <AlertDialog.Popup>
                <AlertDialog.Title>Details</AlertDialog.Title>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      );
    }
    await render(<Contained />);
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.closest('[data-testid="box"]')).not.toBeNull();
    expect(
      document.querySelector(".ow-alert-dialog__backdrop")?.closest('[data-testid="box"]'),
    ).not.toBe(null);
  });

  test("passes className, style, render, and ref through its parts", async () => {
    const refs = {
      portal: createRef<HTMLDivElement>(),
      backdrop: createRef<HTMLDivElement>(),
      viewport: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      title: createRef<HTMLHeadingElement>(),
      description: createRef<HTMLParagraphElement>(),
      trigger: createRef<HTMLButtonElement>(),
      close: createRef<HTMLButtonElement>(),
    };
    await render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Trigger ref={refs.trigger} className="r">
          Open
        </AlertDialog.Trigger>
        <AlertDialog.Portal ref={refs.portal} className="o">
          <AlertDialog.Backdrop ref={refs.backdrop} className="b" style={{ zIndex: 2 }} />
          <AlertDialog.Viewport ref={refs.viewport} className="v">
            <AlertDialog.Popup ref={refs.popup} className="u" render={<section />}>
              <AlertDialog.Title ref={refs.title} className="t" render={<h3>Title</h3>} />
              <AlertDialog.Description ref={refs.description} className="d">
                Text
              </AlertDialog.Description>
              <AlertDialog.Close ref={refs.close} className="c">
                Done
              </AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.trigger.current?.className).toContain("r");
    expect(refs.portal.current?.className).toBe("o");
    expect(refs.backdrop.current?.className).toBe("ow-alert-dialog__backdrop b");
    expect(refs.backdrop.current?.style.zIndex).toBe("2");
    expect(refs.viewport.current?.className).toBe("ow-alert-dialog__viewport v");
    expect(refs.popup.current?.className).toBe("ow-alert-dialog__popup u");
    expect(refs.popup.current?.tagName).toBe("SECTION");
    expect(refs.title.current?.className).toBe("ow-alert-dialog__title t");
    expect(refs.title.current?.tagName).toBe("H3");
    expect(refs.description.current?.className).toBe("ow-alert-dialog__description d");
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
        getComputedStyle(document.querySelector(".ow-alert-dialog__description") as Element).color,
      ).toBe(resolve("color", "var(--ow-muted)"));
      expect(getComputedStyle(scrim).backgroundColor).toBe(resolve("color", "var(--ow-backdrop)"));
    }
  });

  describe("customizing", () => {
    test("a theme token set on the popup changes it alone", async () => {
      const tokens = {
        "--ow-raised-bg": "rgb(1, 2, 3)",
        "--ow-popup-shadow": "none",
        "--ow-fg": "rgb(4, 5, 6)",
        "--ow-muted": "rgb(7, 8, 9)",
        "--ow-radius": "1px",
        "--ow-backdrop": "rgb(10, 11, 12)",
      } as CSSProperties;
      await render(
        <>
          <Share open popupStyle={tokens} />
          <span data-testid="page">Page</span>
        </>,
      );
      await expect.poll(popup).not.toBeNull();
      const style = getComputedStyle(popup() as HTMLElement);
      expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
      expect(style.boxShadow).toBe("none");
      expect(style.color).toBe("rgb(4, 5, 6)");
      // The one radius, as set.
      expect(Number.parseFloat(style.borderRadius)).toBeCloseTo(1, 1);
      expect(
        getComputedStyle(document.querySelector(".ow-alert-dialog__description") as Element).color,
      ).toBe("rgb(7, 8, 9)");
      // The scrim is a sibling: it keeps the theme's.
      expect(getComputedStyle(scrims()[0] as HTMLElement).backgroundColor).toBe(
        resolve("color", "var(--ow-backdrop)"),
      );
      expect(getComputedStyle(byId("page") as HTMLElement).color).toBe(
        resolve("color", "var(--ow-fg)"),
      );
    });

    test("tokens on the Portal reach the scrim and the popup", async () => {
      const tokens = {
        "--ow-raised-bg": "rgb(1, 2, 3)",
        "--ow-backdrop": "rgb(10, 11, 12)",
      } as CSSProperties;
      await render(
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal style={tokens}>
            <AlertDialog.Popup>
              <AlertDialog.Title>Details</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      expect(getComputedStyle(popup() as HTMLElement).backgroundColor).toBe("rgb(1, 2, 3)");
      expect(getComputedStyle(scrims()[0] as HTMLElement).backgroundColor).toBe("rgb(10, 11, 12)");
    });

    test("data-theme on the Portal themes the scrim and the popup", async () => {
      onTestFinished(() => {
        delete root.dataset.theme;
      });
      root.dataset.theme = "light";
      await render(
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal data-theme="dark">
            <AlertDialog.Popup>
              <AlertDialog.Title>Details</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      const portal = popup()?.parentElement as HTMLElement;
      expect(portal.dataset.theme).toBe("dark");
      const dark = resolve("color", "var(--ow-raised-bg)", portal);
      expect(dark).not.toBe(resolve("color", "var(--ow-raised-bg)"));
      expect(getComputedStyle(popup() as HTMLElement).backgroundColor).toBe(dark);
    });

    test("an unlayered rule on a className beats the component's own value", async () => {
      appCss(`
        .mine { inline-size: 200px; padding: 5px; border-radius: 1px; background-color: rgb(1, 2, 3); }
        .mine-scrim { background-color: rgb(4, 5, 6); }
        .mine-title { font-size: 30px; margin-block-end: 2px; }
        .mine-text { color: rgb(7, 8, 9); margin-block-end: 3px; }
      `);
      await render(
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className="mine-scrim" />
            <AlertDialog.Popup className="mine">
              <AlertDialog.Title className="mine-title">Details</AlertDialog.Title>
              <AlertDialog.Description className="mine-text">Text</AlertDialog.Description>
              <button type="button">Done</button>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      const style = getComputedStyle(popup() as HTMLElement);
      expect(style.inlineSize).toBe("200px");
      expect(style.padding).toBe("5px");
      expect(style.borderRadius).toBe("1px");
      expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
      expect(getComputedStyle(scrims()[0] as HTMLElement).backgroundColor).toBe("rgb(4, 5, 6)");
      const title = getComputedStyle(document.querySelector(".ow-alert-dialog__title") as Element);
      expect(title.fontSize).toBe("30px");
      expect(title.marginBlockEnd).toBe("2px");
      const text = getComputedStyle(
        document.querySelector(".ow-alert-dialog__description") as Element,
      );
      expect(text.color).toBe("rgb(7, 8, 9)");
      expect(text.marginBlockEnd).toBe("3px");
    });
  });

  test("more contrast adds a 1px --ow-edge ring to the alert popup", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    const shadow = getComputedStyle(surface).boxShadow;
    await commands.setContrast("more");
    const ring = resolve("box-shadow", "0 0 0 1px var(--ow-edge)");
    expect(getComputedStyle(surface).boxShadow).toBe(`${shadow}, ${ring}`);
  });

  test("keeps its edge in forced colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
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

  test("ships no text of its own", async () => {
    await render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Popup />
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.textContent).toBe("");
    expect(popup()?.querySelector("button")).toBeNull();
    expect(popup()?.getAttribute("aria-label")).toBeNull();
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Trigger>Share</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Title>Share the draft</AlertDialog.Title>
              <AlertDialog.Description>Anyone with the link can read it.</AlertDialog.Description>
              <AlertDialog.Close>Done</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(document.body)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("scrolling inside itself, it has no axe violations", async () => {
    await render(
      <main>
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Title>Terms</AlertDialog.Title>
              <div style={{ blockSize: 2000 }} />
              <AlertDialog.Close render={<Button />}>Accept</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    const report = await axeReport(document.body);
    expect(report.violations).toEqual([]);
  });

  test("runs no rAF and no animations when idle, open", async () => {
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("holds the page without styling it; a wheel inside a scrollable body still scrolls", async () => {
    const before = pageStyle();
    await render(
      <>
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Title>Terms</AlertDialog.Title>
              <div data-testid="body" style={{ maxBlockSize: 80, overflowY: "auto" }}>
                <div style={{ blockSize: 800 }} />
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
        <div style={{ blockSize: 3000 }} />
      </>,
    );
    await expect.poll(popup).not.toBeNull();
    await frames();
    expect(pageStyle()).toEqual(before);
    expect(held()).toBe(true);
    expect(held(byId("body") as HTMLElement)).toBe(false);
    await userEvent.keyboard("{Escape}");
    await gone();
    await frames();
    expect(held()).toBe(false);
    expect(pageStyle()).toEqual(before);
  });

  test("a kept-mounted alert holds the page only while open", async () => {
    const handle = AlertDialog.createHandle();
    await render(
      <AlertDialog.Root handle={handle}>
        <AlertDialog.Portal keepMounted>
          <AlertDialog.Popup>
            <AlertDialog.Title>Tip</AlertDialog.Title>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    await frames();
    expect(held()).toBe(false);
    handle.open(null);
    await expect.poll(() => held()).toBe(true);
    handle.close();
    await expect.poll(() => held()).toBe(false);
  });

  test("a Select inside it works, and the page stays held until both have shut", async () => {
    const before = pageStyle();
    await render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Title>Plan</AlertDialog.Title>
            <Select.Root defaultValue="a">
              <Select.Trigger aria-label="Plan">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="a">Alpha</Select.Item>
                    <Select.Item value="b">Beta</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    await userEvent.click(document.querySelector('[aria-label="Plan"]') as HTMLElement);
    // A shut select may keep its parts mounted, hidden.
    const beta = () =>
      [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
        (o) => o.textContent?.includes("Beta") && o.closest("[hidden]") === null,
      );
    await expect.poll(beta).toBeDefined();
    await frames();
    expect(held()).toBe(true);
    await userEvent.click(beta() as HTMLElement);
    await expect.poll(beta).toBeUndefined();
    expect(popup()).not.toBeNull();
    expect(held()).toBe(true);
    await userEvent.keyboard("{Escape}");
    await gone();
    await frames();
    expect(held()).toBe(false);
    expect(pageStyle()).toEqual(before);
  });
});

test("every part has its data-slot", async () => {
  await render(
    <AlertDialog.Root defaultOpen>
      <AlertDialog.Portal>
        <AlertDialog.Viewport>
          <AlertDialog.Popup>
            <AlertDialog.Title>T</AlertDialog.Title>
            <AlertDialog.Description>D</AlertDialog.Description>
            <AlertDialog.Close>C</AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="alert-dialog-popup"]'))
    .not.toBeNull();
  const slots = [...document.querySelectorAll('[data-slot^="alert-dialog"]')].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "alert-dialog-portal",
    "alert-dialog-backdrop",
    "alert-dialog-viewport",
    "alert-dialog-popup",
    "alert-dialog-title",
    "alert-dialog-description",
    "alert-dialog-close",
  ]);
});
