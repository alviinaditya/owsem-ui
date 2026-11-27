import { DirectionProvider } from "@base-ui/react/direction-provider";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { ContextMenu } from "./index";

const root = document.documentElement;

/** An area with a menu: actions, a checkbox, a radio group, a submenu. */
function Area({ onCut, open }: { onCut?: () => void; open?: boolean }) {
  return (
    <ContextMenu.Root {...(open ? { defaultOpen: true } : {})}>
      <ContextMenu.Trigger style={{ inlineSize: 240, blockSize: 120, margin: 40 }}>
        Right click here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Item onClick={onCut}>
              Cut
              <kbd>⌘X</kbd>
            </ContextMenu.Item>
            <ContextMenu.Item>Copy</ContextMenu.Item>
            <ContextMenu.Item disabled>Paste</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.CheckboxItem defaultChecked>
              <ContextMenu.CheckboxItemIndicator />
              Word wrap
            </ContextMenu.CheckboxItem>
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>Theme</ContextMenu.GroupLabel>
              <ContextMenu.RadioGroup defaultValue="light">
                <ContextMenu.RadioItem value="light">
                  <ContextMenu.RadioItemIndicator />
                  Light
                </ContextMenu.RadioItem>
                <ContextMenu.RadioItem value="dark">
                  <ContextMenu.RadioItemIndicator />
                  Dark
                </ContextMenu.RadioItem>
              </ContextMenu.RadioGroup>
            </ContextMenu.Group>
            <ContextMenu.SubmenuRoot>
              <ContextMenu.SubmenuTrigger>Share</ContextMenu.SubmenuTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner>
                  <ContextMenu.Popup>
                    <ContextMenu.Item>Email</ContextMenu.Item>
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.SubmenuRoot>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

const area = () => document.querySelector<HTMLElement>('[data-slot="context-menu-trigger"]');
const popups = () => [...document.querySelectorAll<HTMLElement>(".ow-menu__popup")];
const popup = () => popups()[0] ?? null;
const item = (name: string) => {
  const el = [...document.querySelectorAll<HTMLElement>(".ow-menu__item")].find(
    (candidate) => candidate.textContent?.replace(/⌘./, "").trim() === name,
  );
  if (!el) throw new Error(`no item ${name}`);
  return el;
};
const focused = () => expect.poll(() => popup()?.contains(document.activeElement)).toBe(true);
const gone = () => expect.poll(() => popups().length, { timeout: 1000 }).toBe(0);

/** A right click at a point of the page. */
function rightClick(el: Element, x: number, y: number) {
  el.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: x,
      clientY: y,
    }),
  );
}

describe("ContextMenu", () => {
  test("a right click opens Base UI's menu at the pointer, and the keyboard moves through it", async () => {
    let cuts = 0;
    await render(<Area onCut={() => cuts++} />);
    const box = (area() as HTMLElement).getBoundingClientRect();
    expect(popup()).toBeNull();
    rightClick(area() as HTMLElement, box.left + 100, box.top + 60);
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.getAttribute("role")).toBe("menu");
    expect(item("Cut").getAttribute("role")).toBe("menuitem");
    expect(item("Word wrap").getAttribute("role")).toBe("menuitemcheckbox");
    expect(item("Light").getAttribute("role")).toBe("menuitemradio");
    await settle();
    const popupBox = (popup() as HTMLElement).getBoundingClientRect();
    expect(Math.abs(popupBox.left - (box.left + 100))).toBeLessThan(12);
    expect(Math.abs(popupBox.top - (box.top + 60))).toBeLessThan(12);
    await focused();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => document.activeElement).toBe(item("Cut"));
    await userEvent.keyboard("{Enter}");
    expect(cuts).toBe(1);
    await gone();
  });

  test("Escape shuts it, and the area has no look of the library's", async () => {
    await render(<Area />);
    const box = (area() as HTMLElement).getBoundingClientRect();
    rightClick(area() as HTMLElement, box.left + 20, box.top + 20);
    await expect.poll(popup).not.toBeNull();
    await focused();
    await userEvent.keyboard("{Escape}");
    await gone();
    const style = getComputedStyle(area() as HTMLElement);
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style.boxShadow).toBe("none");
    expect(style.borderTopWidth).toBe("0px");
  });

  test("uses Menu's popup, items, and Glide: one highlight, the item under the pointer", async () => {
    await render(<Area open />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(popup()?.getAttribute("data-slot")).toBe("context-menu-popup");
    expect(popup()?.className).toBe("ow-menu__popup ow-menu__popup--md");
    await userEvent.hover(item("Copy"));
    await expect
      .poll(() => document.querySelector("[data-glide-active]")?.textContent)
      .toBe("Copy");
    // A shortcut sits at the item's end, as in Menu.
    const kbd = item("Cut").querySelector("kbd") as HTMLElement;
    expect(getComputedStyle(kbd).marginInlineStart).not.toBe("0px");
  });

  test("checks and choices keep the menu open and show their state", async () => {
    await render(<Area open />);
    await expect.poll(popup).not.toBeNull();
    const wrap = item("Word wrap");
    expect(wrap.getAttribute("aria-checked")).toBe("true");
    await userEvent.click(wrap);
    expect(wrap.getAttribute("aria-checked")).toBe("false");
    await userEvent.click(item("Dark"));
    expect(item("Dark").getAttribute("aria-checked")).toBe("true");
    expect(item("Light").getAttribute("aria-checked")).toBe("false");
    expect(popup()).not.toBeNull();
  });

  test("a submenu opens beside its item, placed as Menu's", async () => {
    await render(<Area open />);
    await expect.poll(popup).not.toBeNull();
    await userEvent.hover(item("Share"));
    await expect.poll(() => popups().length).toBe(2);
    await settle();
    const sub = popups()[1] as HTMLElement;
    const parent = (popup() as HTMLElement).getBoundingClientRect();
    expect(sub.getBoundingClientRect().left - parent.right).toBeCloseTo(2, 0);
    const first = sub.querySelector(".ow-menu__item") as HTMLElement;
    const share = item("Share").getBoundingClientRect();
    expect(first.getBoundingClientRect().top).toBeCloseTo(share.top, 0);
    expect(sub.closest("[data-slot=context-menu-positioner]")).not.toBeNull();
  });

  test("it is modal, as Base UI's: a press outside only shuts it", async () => {
    let behind = 0;
    await render(
      <>
        <Area />
        <button
          type="button"
          onClick={() => behind++}
          style={{ position: "fixed", right: 20, bottom: 20 }}
        >
          Behind
        </button>
      </>,
    );
    const box = (area() as HTMLElement).getBoundingClientRect();
    rightClick(area() as HTMLElement, box.left + 20, box.top + 20);
    await expect.poll(popup).not.toBeNull();
    // Base UI draws the layer that takes the press; the library adds no clear one of its own.
    expect(document.querySelectorAll(".ow-menu__backdrop")).toHaveLength(0);
    const button = document.querySelector("button") as HTMLElement;
    const rect = button.getBoundingClientRect();
    await userEvent.click(document.body, {
      position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    });
    await gone();
    expect(behind).toBe(0);
  });

  test("grows from the pointer: 0.96 and transparent to full in 180 ms, as Menu's", async () => {
    await render(<Area />);
    const box = (area() as HTMLElement).getBoundingClientRect();
    rightClick(area() as HTMLElement, box.left + 20, box.top + 20);
    await expect.poll(popup).not.toBeNull();
    await settle();
    const style = getComputedStyle(popup() as HTMLElement);
    // Base UI opens a menu from a right click at once when it says so (data-instant).
    if (popup()?.hasAttribute("data-instant")) {
      expect(style.transitionDuration).toBe("0s");
    } else {
      expect(style.transitionProperty).toBe("opacity, transform");
      expect(style.transitionDuration).toBe("0.18s, 0.18s");
    }
    expect(style.transformOrigin).not.toBe("");
  });

  test("under reduced motion it fades without growing", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    let transforms = 0;
    const onRun = (event: TransitionEvent) => {
      if (event.propertyName === "transform") transforms++;
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Area />);
    const box = (area() as HTMLElement).getBoundingClientRect();
    rightClick(area() as HTMLElement, box.left + 20, box.top + 20);
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(transforms).toBe(0);
  });

  test("passes className, style, render, and ref through its parts", async () => {
    const refs = {
      trigger: createRef<HTMLDivElement>(),
      positioner: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
      link: createRef<HTMLAnchorElement>(),
      label: createRef<HTMLDivElement>(),
      separator: createRef<HTMLDivElement>(),
      indicator: createRef<HTMLSpanElement>(),
    };
    await render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger ref={refs.trigger} className="t">
          Area
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner ref={refs.positioner} className="p">
            <ContextMenu.Popup ref={refs.popup} className="u" style={{ zIndex: 3 }}>
              <ContextMenu.Item ref={refs.item} className="i" render={<section />}>
                One
              </ContextMenu.Item>
              <ContextMenu.LinkItem ref={refs.link} href="#two" className="l">
                Two
              </ContextMenu.LinkItem>
              <ContextMenu.Group>
                <ContextMenu.GroupLabel ref={refs.label} className="g">
                  Group
                </ContextMenu.GroupLabel>
                <ContextMenu.CheckboxItem>
                  <ContextMenu.CheckboxItemIndicator ref={refs.indicator} className="c">
                    ✓
                  </ContextMenu.CheckboxItemIndicator>
                  Three
                </ContextMenu.CheckboxItem>
              </ContextMenu.Group>
              <ContextMenu.Separator ref={refs.separator} className="s" />
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.trigger.current?.className).toBe("ow-context-menu__trigger t");
    expect(refs.positioner.current?.className).toBe("ow-menu__positioner p");
    expect(refs.popup.current?.className).toBe("ow-menu__popup ow-menu__popup--md u");
    expect(refs.popup.current?.style.zIndex).toBe("3");
    expect(refs.item.current?.className).toBe("ow-menu__item i");
    expect(refs.item.current?.tagName).toBe("SECTION");
    expect(refs.link.current?.className).toBe("ow-menu__item l");
    expect(refs.label.current?.className).toBe("ow-menu__group-label g");
    expect(refs.indicator.current?.className).toBe("ow-menu__indicator c");
    expect(refs.separator.current?.className).toBe("ow-menu__separator s");
  });

  test("the popup's size reaches the items' type", async () => {
    await render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup size="lg">
              <ContextMenu.Item>One</ContextMenu.Item>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.dataset.size).toBe("lg");
    expect(getComputedStyle(popup() as HTMLElement).fontSize).toBe("16px");
  });

  test("follows the text direction: the positioner carries it, submenus open to the left", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Area />
        </div>
      </DirectionProvider>,
    );
    // Far enough from the left edge for a submenu to open there.
    rightClick(area() as HTMLElement, 600, 100);
    await expect.poll(popup).not.toBeNull();
    expect(document.querySelector(".ow-menu__positioner")?.getAttribute("dir")).toBe("rtl");
    const chevron = item("Share").querySelector(".ow-menu__chevron") as HTMLElement;
    expect(getComputedStyle(chevron).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    await userEvent.hover(item("Share"));
    await expect.poll(() => popups().length).toBe(2);
    await settle();
    expect((popups()[1] as HTMLElement).getBoundingClientRect().right).toBeLessThanOrEqual(
      (popup() as HTMLElement).getBoundingClientRect().left,
    );
  });

  test("keeps its edge, separators, and focus ring in forced colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Area open />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(
      getComputedStyle(document.querySelector(".ow-menu__separator") as HTMLElement).borderTopWidth,
    ).toBe("1px");
  });

  test("more contrast adds a 1px --ow-edge ring to the popup", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    await commands.setContrast("more");
    await render(<Area open />);
    await expect.poll(popup).not.toBeNull();
    expect(getComputedStyle(popup() as HTMLElement).boxShadow).toContain("0px 0px 0px 1px");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <Area open />
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
    await render(<Area open />);
    await expect.poll(popup).not.toBeNull();
    await userEvent.hover(item("Copy"));
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("closed, it runs no rAF and no animations either", async () => {
    await render(<Area />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("renders on the server without warnings", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => error.mockRestore());
    const html = renderToString(<Area />);
    expect(html).toContain('data-slot="context-menu-trigger"');
    expect(error).not.toHaveBeenCalled();
  });
});

test("every part has its data-slot", async () => {
  await render(
    <ContextMenu.Root defaultOpen>
      <ContextMenu.Trigger>Area</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Item>One</ContextMenu.Item>
            <ContextMenu.LinkItem href="#two">Two</ContextMenu.LinkItem>
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>Group</ContextMenu.GroupLabel>
              <ContextMenu.CheckboxItem checked>
                <ContextMenu.CheckboxItemIndicator />
                Three
              </ContextMenu.CheckboxItem>
            </ContextMenu.Group>
            <ContextMenu.RadioGroup value="a">
              <ContextMenu.RadioItem value="a">
                <ContextMenu.RadioItemIndicator />A
              </ContextMenu.RadioItem>
            </ContextMenu.RadioGroup>
            <ContextMenu.Separator />
            <ContextMenu.SubmenuRoot>
              <ContextMenu.SubmenuTrigger>More</ContextMenu.SubmenuTrigger>
            </ContextMenu.SubmenuRoot>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="context-menu-popup"]'))
    .not.toBeNull();
  const slots = [...document.querySelectorAll('[data-slot*="menu"]')].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "context-menu-trigger",
    "context-menu-portal",
    "context-menu-positioner",
    "context-menu-popup",
    "menu-viewport",
    "context-menu-item",
    "context-menu-link-item",
    "context-menu-group-label",
    "context-menu-checkbox-item",
    "context-menu-checkbox-item-indicator",
    "context-menu-radio-item",
    "context-menu-radio-item-indicator",
    "context-menu-separator",
    "context-menu-submenu-trigger",
    "menu-chevron",
  ]);
});
