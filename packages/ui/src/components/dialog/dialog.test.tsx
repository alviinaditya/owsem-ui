import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Button } from "../button";
import { Dialog } from "./index";

const root = document.documentElement;

/** The shortest dialog: a trigger, a title, a line, a field, and a Close button. */
function Share({ open, popupStyle }: { open?: boolean; popupStyle?: CSSProperties }) {
  return (
    <Dialog.Root {...(open === undefined ? {} : { defaultOpen: open })}>
      <Dialog.Trigger>Share</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup style={popupStyle}>
          <Dialog.Title>Share the draft</Dialog.Title>
          <Dialog.Description>Anyone with the link can read it.</Dialog.Description>
          <input aria-label="Link" defaultValue="owsem.dev/d/42" />
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A dialog with another nested in it; `open` opens both. */
function Nested({ open }: { open?: boolean }) {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Popup data-testid="parent">
          <Dialog.Title>Share the draft</Dialog.Title>
          <Dialog.Root {...(open ? { defaultOpen: true } : {})}>
            <Dialog.Trigger data-testid="remove">Remove the link</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-testid="nested">
                <Dialog.Title>Remove the link?</Dialog.Title>
                <Dialog.Close>Keep it</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const popup = () => document.querySelector<HTMLElement>(".ow-dialog__popup");
const trigger = () => document.querySelector<HTMLElement>("button") as HTMLElement;
const byId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const gone = () => expect.poll(popup, { timeout: 1000 }).toBeNull();
/** The scrims a person can see. */
const scrims = () =>
  [...document.querySelectorAll<HTMLElement>(".ow-dialog__backdrop")].filter(
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

/** Resolves a value (e.g. `var(--ow-panel)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

describe("Dialog", () => {
  test("is Base UI's dialog: named, it takes focus and gives it back", async () => {
    await render(<Share />);
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    const dialog = popup() as HTMLElement;
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe(
      document.querySelector(".ow-dialog__title")?.id,
    );
    expect(dialog.getAttribute("aria-describedby")).toBe(
      document.querySelector(".ow-dialog__description")?.id,
    );
    expect(document.querySelector(".ow-dialog__title")?.tagName).toBe("H2");
    await expect.poll(() => dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(trigger());
    // A press on the scrim shuts it too, and so does Close.
    await userEvent.click(trigger());
    await expect.poll(() => scrims().length).toBe(1);
    await userEvent.click(scrims()[0] as HTMLElement, { position: { x: 5, y: 5 } });
    await gone();
    await userEvent.click(trigger());
    await userEvent.click(document.querySelector(".ow-dialog__popup button") as HTMLElement);
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
    // On the element that scrolls the page, which is the html or the body.
    const locked = () =>
      [root, document.body].some((el) => getComputedStyle(el).overflowY === "hidden");
    expect(locked()).toBe(true);
    await userEvent.keyboard("{Escape}");
    await gone();
    await expect.poll(locked).toBe(false);
  });

  test("opens from a trigger placed elsewhere, or from code, through a handle", async () => {
    const handle = Dialog.createHandle();
    await render(
      <>
        <Dialog.Trigger handle={handle} id="far">
          Far
        </Dialog.Trigger>
        <Dialog.Root handle={handle}>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title>Details</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </>,
    );
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    handle.close();
    await gone();
    handle.open("far");
    await expect.poll(popup).not.toBeNull();
  });

  test("controlled and uncontrolled both work (FR-4)", async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title>Details</Dialog.Title>
              <Dialog.Close>Done</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }
    await render(<Controlled />);
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    await userEvent.click(document.querySelector(".ow-dialog__popup button") as HTMLElement);
    await gone();
  });

  test("Trigger and Close wear your button, through render", async () => {
    await render(
      <Dialog.Root>
        <Dialog.Trigger render={<Button variant="outline" />}>Share</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title>Share the draft</Dialog.Title>
            <Dialog.Close render={<Button />}>Done</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    const share = trigger();
    expect(share.classList.contains("ow-button")).toBe(true);
    expect(share.getAttribute("aria-haspopup")).toBe("dialog");
    expect(share.getAttribute("data-variant")).toBe("outline");
    await userEvent.click(share);
    await expect.poll(popup).not.toBeNull();
    expect(share.getAttribute("aria-expanded")).toBe("true");
    const done = document.querySelector(".ow-dialog__popup button") as HTMLElement;
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
        <Dialog.Root defaultOpen>
          <Dialog.Portal backdrop={false}>
            <Dialog.Popup>
              <Dialog.Title>Details</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      expect(document.querySelector(".ow-dialog__backdrop")).toBeNull();
    });

    test("an explicit Backdrop replaces it, also when wrapped, and a press on it shuts", async () => {
      const Wrapped = () => <Dialog.Backdrop className="mine" />;
      await render(
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Wrapped />
            <Dialog.Popup>
              <Dialog.Title>Details</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      await expect.poll(() => scrims().length).toBe(1);
      const mine = scrims()[0] as HTMLElement;
      expect(mine.classList.contains("mine")).toBe(true);
      await userEvent.click(mine, { position: { x: 5, y: 5 } });
      await gone();
    });

    test("fades, without moving, while the popup also grows", async () => {
      const runs: string[] = [];
      const onRun = (event: TransitionEvent) => {
        if ((event.target as HTMLElement).classList.contains("ow-dialog__backdrop")) {
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
      if (!target.classList.contains("ow-dialog__popup")) return;
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
        <Dialog.Popup>
          <Dialog.Title>Terms</Dialog.Title>
          <div style={{ blockSize: 2000 }} />
          <Dialog.Close>Accept</Dialog.Close>
        </Dialog.Popup>
      );
      return (
        <Dialog.Root>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            {viewport ? <Dialog.Viewport>{panel}</Dialog.Viewport> : panel}
          </Dialog.Portal>
        </Dialog.Root>
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
    expect(document.querySelector(".ow-dialog__viewport")?.scrollTop).toBe(0);
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("short, it gives focus to the first control, and yours overrides it", async () => {
    const first = createRef<HTMLButtonElement>();
    function Short({ second }: { second?: boolean }) {
      return (
        <Dialog.Root>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup {...(second ? { initialFocus: first } : {})}>
              <Dialog.Title>Details</Dialog.Title>
              <Dialog.Close>Cancel</Dialog.Close>
              <Dialog.Close ref={first}>Save</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }
    const { rerender } = await render(<Short />);
    await userEvent.click(trigger());
    await expect.poll(() => document.activeElement?.textContent).toBe("Cancel");
    await userEvent.keyboard("{Escape}");
    await gone();
    await rerender(<Short second />);
    await userEvent.click(trigger());
    await expect.poll(() => document.activeElement?.textContent).toBe("Save");
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("with nothing to tab to, it takes focus itself and shows the ring (FR-13)", async () => {
    await render(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title>Saved</Dialog.Title>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => document.activeElement).toBe(popup());
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
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
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title>Parent</Dialog.Title>
              <Dialog.Root defaultOpen>
                <Dialog.Portal backdrop={false}>
                  <Dialog.Popup data-testid="nested">
                    <Dialog.Title>Nested</Dialog.Title>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      await expect.poll(() => byId("nested")).not.toBeNull();
      expect(scrims().length).toBe(1);
    });

    test("under reduced motion the parent stays where it is (FR-20)", async () => {
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
    const handle = Dialog.createHandle();
    await render(
      <Dialog.Root handle={handle}>
        <Dialog.Portal keepMounted>
          <Dialog.Viewport>
            <Dialog.Popup>
              <Dialog.Title>Details</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    const display = (selector: string) =>
      getComputedStyle(document.querySelector(selector) as Element).display;
    for (const part of ["viewport", "popup", "backdrop"]) {
      expect(display(`.ow-dialog__${part}`)).toBe("none");
    }
    handle.open(null);
    await expect.poll(() => display(".ow-dialog__popup")).toBe("block");
    expect(display(".ow-dialog__viewport")).toBe("grid");
    expect(display(".ow-dialog__backdrop")).toBe("block");
  });

  test("Portal renders into `container`", async () => {
    function Contained() {
      const [box, setBox] = useState<HTMLElement | null>(null);
      return (
        <div ref={setBox} data-testid="box">
          <Dialog.Root defaultOpen>
            <Dialog.Portal container={box}>
              <Dialog.Popup>
                <Dialog.Title>Details</Dialog.Title>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      );
    }
    await render(<Contained />);
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.closest('[data-testid="box"]')).not.toBeNull();
    expect(document.querySelector(".ow-dialog__backdrop")?.closest('[data-testid="box"]')).not.toBe(
      null,
    );
  });

  test("passes className, style, render, and ref through its parts (FR-2, FR-5)", async () => {
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
      <Dialog.Root defaultOpen>
        <Dialog.Trigger ref={refs.trigger} className="r">
          Open
        </Dialog.Trigger>
        <Dialog.Portal ref={refs.portal} className="o">
          <Dialog.Backdrop ref={refs.backdrop} className="b" style={{ zIndex: 2 }} />
          <Dialog.Viewport ref={refs.viewport} className="v">
            <Dialog.Popup ref={refs.popup} className={() => "u"} render={<section />}>
              <Dialog.Title ref={refs.title} className="t" render={<h3>Title</h3>} />
              <Dialog.Description ref={refs.description} className="d">
                Text
              </Dialog.Description>
              <Dialog.Close ref={refs.close} className="c">
                Done
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.trigger.current?.className).toContain("r");
    expect(refs.portal.current?.className).toBe("o");
    expect(refs.backdrop.current?.className).toBe("ow-dialog__backdrop b");
    expect(refs.backdrop.current?.style.zIndex).toBe("2");
    expect(refs.viewport.current?.className).toBe("ow-dialog__viewport v");
    expect(refs.popup.current?.className).toBe("ow-dialog__popup u");
    expect(refs.popup.current?.tagName).toBe("SECTION");
    expect(refs.title.current?.className).toBe("ow-dialog__title t");
    expect(refs.title.current?.tagName).toBe("H3");
    expect(refs.description.current?.className).toBe("ow-dialog__description d");
    expect(refs.close.current?.className).toContain("c");
  });

  test("sits on the panel material over the scrim, light and dark", async () => {
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
      expect(style.backgroundColor).toBe(resolve("color", "var(--ow-panel)"));
      expect(style.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
      expect(style.color).toBe(resolve("color", "var(--ow-fg)"));
      expect(
        getComputedStyle(document.querySelector(".ow-dialog__description") as Element).color,
      ).toBe(resolve("color", "var(--ow-muted)"));
      expect(getComputedStyle(scrim).backgroundColor).toBe(resolve("color", "var(--ow-backdrop)"));
    }
  });

  describe("customizing", () => {
    test("a theme token set on the popup changes it alone (TK-9)", async () => {
      const tokens = {
        "--ow-panel": "rgb(1, 2, 3)",
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
      expect(Number.parseFloat(style.borderRadius)).toBeCloseTo(17, 1);
      expect(
        getComputedStyle(document.querySelector(".ow-dialog__description") as Element).color,
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
        "--ow-panel": "rgb(1, 2, 3)",
        "--ow-backdrop": "rgb(10, 11, 12)",
      } as CSSProperties;
      await render(
        <Dialog.Root defaultOpen>
          <Dialog.Portal style={tokens}>
            <Dialog.Popup>
              <Dialog.Title>Details</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      expect(getComputedStyle(popup() as HTMLElement).backgroundColor).toBe("rgb(1, 2, 3)");
      expect(getComputedStyle(scrims()[0] as HTMLElement).backgroundColor).toBe("rgb(10, 11, 12)");
    });

    test("data-theme on the Portal themes the scrim and the popup (FR-16)", async () => {
      onTestFinished(() => {
        delete root.dataset.theme;
      });
      root.dataset.theme = "light";
      await render(
        <Dialog.Root defaultOpen>
          <Dialog.Portal data-theme="dark">
            <Dialog.Popup>
              <Dialog.Title>Details</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      const portal = popup()?.parentElement as HTMLElement;
      expect(portal.dataset.theme).toBe("dark");
      const dark = resolve("color", "var(--ow-panel)", portal);
      expect(dark).not.toBe(resolve("color", "var(--ow-panel)"));
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
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Backdrop className="mine-scrim" />
            <Dialog.Popup className="mine">
              <Dialog.Title className="mine-title">Details</Dialog.Title>
              <Dialog.Description className="mine-text">Text</Dialog.Description>
              <button type="button">Done</button>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      await expect.poll(popup).not.toBeNull();
      const style = getComputedStyle(popup() as HTMLElement);
      expect(style.inlineSize).toBe("200px");
      expect(style.padding).toBe("5px");
      expect(style.borderRadius).toBe("1px");
      expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
      expect(getComputedStyle(scrims()[0] as HTMLElement).backgroundColor).toBe("rgb(4, 5, 6)");
      const title = getComputedStyle(document.querySelector(".ow-dialog__title") as Element);
      expect(title.fontSize).toBe("30px");
      expect(title.marginBlockEnd).toBe("2px");
      const text = getComputedStyle(document.querySelector(".ow-dialog__description") as Element);
      expect(text.color).toBe("rgb(7, 8, 9)");
      expect(text.marginBlockEnd).toBe("3px");
    });
  });

  test("keeps its edge in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Share open />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("follows the text direction, also in the portal (FR-16)", async () => {
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

  test("ships no text of its own (FR-17)", async () => {
    await render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup />
        </Dialog.Portal>
      </Dialog.Root>,
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
        <Dialog.Root defaultOpen>
          <Dialog.Trigger>Share</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title>Share the draft</Dialog.Title>
              <Dialog.Description>Anyone with the link can read it.</Dialog.Description>
              <Dialog.Close>Done</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
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
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title>Terms</Dialog.Title>
              <div style={{ blockSize: 2000 }} />
              <Dialog.Close render={<Button />}>Accept</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
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
});
