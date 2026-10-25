import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Menu, type MenuSize } from "./index";

const root = document.documentElement;

const Glyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

/** An Edit menu: actions with shortcuts, a disabled one, a checkbox, a radio group, a submenu. */
function Edit({
  open,
  size,
  onCut,
  popupStyle,
}: {
  open?: boolean;
  size?: MenuSize;
  onCut?: () => void;
  popupStyle?: CSSProperties;
}) {
  return (
    <Menu.Root {...(open === undefined ? {} : { defaultOpen: open })}>
      <Menu.Trigger style={{ margin: 40 }}>Edit</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup size={size} style={popupStyle}>
            <Menu.Item onClick={onCut}>
              <Glyph />
              Cut
              <kbd>⌘X</kbd>
            </Menu.Item>
            <Menu.Item>
              <Glyph />
              Copy
              <kbd>⌘C</kbd>
            </Menu.Item>
            <Menu.Item disabled>
              <Glyph />
              Paste
            </Menu.Item>
            <Menu.Separator />
            <Menu.CheckboxItem defaultChecked>
              <Menu.CheckboxItemIndicator />
              Word wrap
            </Menu.CheckboxItem>
            <Menu.Group>
              <Menu.GroupLabel>Theme</Menu.GroupLabel>
              <Menu.RadioGroup defaultValue="light">
                <Menu.RadioItem value="light">
                  <Menu.RadioItemIndicator />
                  Light
                </Menu.RadioItem>
                <Menu.RadioItem value="dark">
                  <Menu.RadioItemIndicator />
                  Dark
                </Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Group>
            <Menu.Separator />
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger>
                <Glyph />
                Share
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup size={size}>
                    <Menu.Item>Email</Menu.Item>
                    <Menu.Item>Copy link</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const popups = () => [...document.querySelectorAll<HTMLElement>(".ow-menu__popup")];
const popup = () => popups()[0] ?? null;
const item = (name: string) => {
  const el = [...document.querySelectorAll<HTMLElement>(".ow-menu__item")].find(
    (candidate) => candidate.textContent?.replace(/⌘./, "").trim() === name,
  );
  if (!el) throw new Error(`no item ${name}`);
  return el;
};
const trigger = () => document.querySelector<HTMLElement>("button") as HTMLElement;
const lit = () => document.querySelector("[data-glide-active]")?.textContent?.replace(/⌘./, "");

/** Resolves a value (e.g. `var(--ow-panel)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

const gone = () => expect.poll(() => popups().length, { timeout: 1000 }).toBe(0);

describe("Menu", () => {
  test("is Base UI's menu: it opens, moves, picks, and shuts with the keyboard", async () => {
    let cuts = 0;
    await render(<Edit onCut={() => cuts++} />);
    expect(trigger().getAttribute("aria-haspopup")).toBe("menu");
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.getAttribute("role")).toBe("menu");
    expect(item("Cut").getAttribute("role")).toBe("menuitem");
    expect(item("Word wrap").getAttribute("role")).toBe("menuitemcheckbox");
    expect(item("Light").getAttribute("role")).toBe("menuitemradio");
    expect(document.querySelector(".ow-menu__separator")?.getAttribute("role")).toBe("separator");
    // The group is named by its label.
    const group = item("Light").closest('[role="group"]:has(.ow-menu__group-label)');
    expect(group?.getAttribute("aria-labelledby")).toBe(
      document.querySelector(".ow-menu__group-label")?.id,
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(item("Cut"));
    await userEvent.keyboard("{Enter}");
    expect(cuts).toBe(1);
    await gone();
    expect(document.activeElement).toBe(trigger());
  });

  test("the keyboard reaches every item, the submenu, and back", async () => {
    await render(<Edit />);
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => document.activeElement).toBe(item("Cut"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(item("Share"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(item("Cut"));
    await userEvent.keyboard("w");
    expect(document.activeElement).toBe(item("Word wrap"));
    await userEvent.keyboard("{End}{ArrowRight}");
    await expect.poll(() => document.activeElement).toBe(item("Email"));
    // The submenu lights Email; the parent keeps Share lit.
    const allLit = () =>
      [...document.querySelectorAll("[data-glide-active]")].map((el) => el.textContent);
    await expect.poll(allLit).toEqual(["Share", "Email"]);
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(() => document.activeElement).toBe(item("Share"));
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(trigger());
  });

  test("Glide lights the item under the pointer, and the one the keyboard reaches", async () => {
    await render(<Edit open />);
    await expect.poll(popup).not.toBeNull();
    await userEvent.hover(item("Copy"));
    await expect.poll(lit).toBe("Copy");
    const highlight = popup()?.querySelector<HTMLElement>(".ow-glide");
    expect(highlight?.hasAttribute("data-visible")).toBe(true);
    // The keyboard reaches disabled items too (Base UI), so they can be found.
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(lit).toBe("Paste");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(lit).toBe("Word wrap");
    expect(document.activeElement).toBe(item("Word wrap"));
    // The highlight takes the item's own corners and box.
    await settle();
    const box = item("Word wrap").getBoundingClientRect();
    const glow = highlight?.getBoundingClientRect();
    expect(glow?.top).toBeCloseTo(box.top, 0);
    expect(glow?.height).toBeCloseTo(box.height, 0);
    expect(
      getComputedStyle(highlight as HTMLElement)
        .getPropertyValue("--_radius")
        .trim(),
    ).toBe("8px");
  });

  test("checkbox and radio items show their state, keeping their room while off", async () => {
    await render(<Edit open />);
    await expect.poll(popup).not.toBeNull();
    const wrap = item("Word wrap");
    const check = wrap.querySelector<HTMLElement>(".ow-menu__indicator");
    expect(wrap.getAttribute("aria-checked")).toBe("true");
    expect(getComputedStyle(check as HTMLElement).visibility).toBe("visible");
    await userEvent.click(wrap);
    expect(wrap.getAttribute("aria-checked")).toBe("false");
    // Base UI keeps the menu open for checkbox items; the check stays in the layout, hidden.
    expect(check?.isConnected).toBe(true);
    expect(getComputedStyle(check as HTMLElement).visibility).toBe("hidden");
    const dark = item("Dark");
    await userEvent.click(dark);
    expect(dark.getAttribute("aria-checked")).toBe("true");
    expect(item("Light").getAttribute("aria-checked")).toBe("false");
    // Labels line up whether an item is on or off.
    const label = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return [...range.getClientRects()].at(-1)?.left ?? 0;
    };
    expect(label(item("Light"))).toBeCloseTo(label(dark), 0);
  });

  test("a submenu opens beside its item, which stays lit while the pointer is in it", async () => {
    await render(<Edit open />);
    await expect.poll(popup).not.toBeNull();
    const share = item("Share");
    expect(share.querySelector(".ow-menu__chevron svg")).not.toBeNull();
    await userEvent.hover(share);
    await expect.poll(() => popups().length).toBe(2);
    const sub = popups()[1] as HTMLElement;
    await settle();
    // First items in line, 2px past the parent's edge.
    expect(
      sub.getBoundingClientRect().left - (popup() as HTMLElement).getBoundingClientRect().right,
    ).toBeCloseTo(2, 0);
    const first = sub.querySelector(".ow-menu__item") as HTMLElement;
    expect(first.getBoundingClientRect().top).toBeCloseTo(share.getBoundingClientRect().top, 0);
    await userEvent.hover(first);
    expect(share.hasAttribute("data-popup-open")).toBe(true);
    expect(getComputedStyle(share).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    // Focus in the submenu leaves the parent's highlight home, so the parent does not scroll.
    await expect.poll(() => document.activeElement).toBe(first);
    await settle();
    const parent = popup() as HTMLElement;
    expect([parent.scrollWidth, parent.scrollHeight]).toEqual([
      parent.clientWidth,
      parent.clientHeight,
    ]);
  });

  test("a shortcut sits at the item's end, muted; the label leads with its icon", async () => {
    await render(<Edit open />);
    await expect.poll(popup).not.toBeNull();
    const cut = item("Cut");
    const kbd = cut.querySelector("kbd") as HTMLElement;
    const style = getComputedStyle(cut);
    const px = Number.parseFloat(style.paddingInlineEnd);
    expect(cut.getBoundingClientRect().right - kbd.getBoundingClientRect().right).toBeCloseTo(
      px,
      0,
    );
    expect(getComputedStyle(kbd).color).toBe(resolve("color", "var(--ow-muted)"));
    expect(getComputedStyle(kbd).borderTopWidth).toBe("0px");
  });

  test("grows from its trigger: 0.96 and transparent to full, 180 ms ease-out", async () => {
    const runs: { property: string; frames: Keyframe[] }[] = [];
    const onRun = (event: TransitionEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("ow-menu__popup")) return;
      const transition = target
        .getAnimations()
        .find((a) => (a as CSSTransition).transitionProperty === event.propertyName);
      const effect = transition?.effect as KeyframeEffect | undefined;
      runs.push({ property: event.propertyName, frames: effect?.getKeyframes() ?? [] });
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Edit />);
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
    // Leaving is quicker.
    runs.length = 0;
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await expect.poll(() => runs.length).toBe(2);
    await gone();
  });

  test("opened from the keyboard, it appears at once (data-instant)", async () => {
    await render(<Edit />);
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.dataset.instant).toBe("click");
    expect(getComputedStyle(popup() as HTMLElement).transitionProperty).toBe("none");
    await expect.poll(lit).toBe("Cut");
  });

  test("under reduced motion it fades without growing (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const frames: Keyframe[][] = [];
    const onRun = (event: TransitionEvent) => {
      if (event.propertyName !== "opacity") return;
      const target = event.target as HTMLElement;
      const effect = target.getAnimations()[0]?.effect as KeyframeEffect | undefined;
      frames.push(effect?.getKeyframes() ?? []);
    };
    let transforms = 0;
    const onTransform = (event: TransitionEvent) => {
      if (event.propertyName === "transform") transforms++;
    };
    document.addEventListener("transitionrun", onRun);
    document.addEventListener("transitionrun", onTransform);
    onTestFinished(() => {
      document.removeEventListener("transitionrun", onRun);
      document.removeEventListener("transitionrun", onTransform);
    });
    await render(<Edit />);
    await userEvent.click(trigger());
    await expect.poll(() => frames.length).toBe(1);
    await settle();
    expect(transforms).toBe(0);
  });

  test("passes className, style, render, and ref through its parts (FR-2, FR-5)", async () => {
    const refs = {
      positioner: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
      link: createRef<HTMLAnchorElement>(),
      label: createRef<HTMLDivElement>(),
      separator: createRef<HTMLDivElement>(),
      indicator: createRef<HTMLSpanElement>(),
    };
    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner ref={refs.positioner} className="p">
            <Menu.Popup ref={refs.popup} className={() => "u"} style={{ zIndex: 3 }}>
              <Menu.Item ref={refs.item} className="i" render={<section />}>
                One
              </Menu.Item>
              <Menu.LinkItem ref={refs.link} href="#two" className="l">
                Two
              </Menu.LinkItem>
              <Menu.Group>
                <Menu.GroupLabel ref={refs.label} className="g">
                  Group
                </Menu.GroupLabel>
                <Menu.CheckboxItem>
                  <Menu.CheckboxItemIndicator ref={refs.indicator} className="c">
                    ✓
                  </Menu.CheckboxItemIndicator>
                  Three
                </Menu.CheckboxItem>
              </Menu.Group>
              <Menu.Separator ref={refs.separator} className="s" />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.positioner.current?.className).toBe("ow-menu__positioner p");
    expect(refs.popup.current?.className).toBe("ow-menu__popup u");
    expect(refs.popup.current?.style.zIndex).toBe("3");
    expect(refs.popup.current?.dataset.size).toBe("md");
    expect(refs.item.current?.className).toBe("ow-menu__item i");
    expect(refs.item.current?.tagName).toBe("SECTION");
    expect(refs.link.current?.className).toBe("ow-menu__item l");
    expect(refs.link.current?.tagName).toBe("A");
    expect(refs.label.current?.className).toBe("ow-menu__group-label g");
    expect(refs.indicator.current?.className).toBe("ow-menu__indicator c");
    // Children replace the default check; unchecked, it still keeps its room.
    expect(refs.indicator.current?.textContent).toBe("✓");
    expect(refs.separator.current?.className).toBe("ow-menu__separator s");
  });

  test("sits on the panel material with the popup shadow, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(<Edit open />);
    await expect.poll(popup).not.toBeNull();
    const surface = popup() as HTMLElement;
    const groove = document.querySelector(".ow-menu__separator") as HTMLElement;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(surface);
      expect(style.backgroundColor).toBe(resolve("color", "var(--ow-panel)"));
      expect(style.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
      expect(getComputedStyle(item("Cut")).color).toBe(resolve("color", "var(--ow-fg)"));
      expect(getComputedStyle(groove).borderTopColor).toBe(resolve("color", "var(--ow-line-dark)"));
      expect(getComputedStyle(groove).borderBottomColor).toBe(
        resolve("color", "var(--ow-line-light)"),
      );
    }
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const tokens = {
      "--ow-panel": "rgb(1, 2, 3)",
      "--ow-popup-shadow": "none",
      "--ow-fg": "rgb(4, 5, 6)",
      "--ow-muted": "rgb(7, 8, 9)",
      "--ow-line-dark": "rgb(255, 0, 0)",
      "--ow-hover": "rgb(0, 128, 0)",
    } as CSSProperties;
    await render(<Edit open popupStyle={tokens} />);
    await expect.poll(popup).not.toBeNull();
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style.boxShadow).toBe("none");
    expect(getComputedStyle(item("Cut")).color).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(item("Cut").querySelector("kbd") as HTMLElement).color).toBe(
      "rgb(7, 8, 9)",
    );
    expect(
      getComputedStyle(document.querySelector(".ow-menu__separator") as HTMLElement).borderTopColor,
    ).toBe("rgb(255, 0, 0)");
    // Glide's highlight is the hover tint.
    await userEvent.hover(item("Copy"));
    await expect.poll(lit).toBe("Copy");
    const highlight = popup()?.querySelector(".ow-glide") as HTMLElement;
    expect(getComputedStyle(highlight).backgroundColor).toBe("rgb(0, 128, 0)");
  });

  test("keeps its edge, grooves, checks, and focus in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Edit />);
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    const groove = getComputedStyle(document.querySelector(".ow-menu__separator") as HTMLElement);
    expect(groove.borderTopWidth).toBe("1px");
    const check = item("Word wrap").querySelector("svg") as SVGElement;
    expect(getComputedStyle(check).stroke).not.toBe("none");
    const ring = getComputedStyle(item("Cut"));
    expect(ring.outlineStyle).toBe("solid");
    expect(ring.outlineWidth).toBe("2px");
  });

  test("follows the text direction: submenus open to the left, chevrons turn (FR-16)", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Edit open />
        </div>
      </DirectionProvider>,
    );
    await expect.poll(popup).not.toBeNull();
    const positioner = document.querySelector(".ow-menu__positioner") as HTMLElement;
    expect(positioner.getAttribute("dir")).toBe("rtl");
    const share = item("Share");
    const chevron = share.querySelector(".ow-menu__chevron") as HTMLElement;
    expect(getComputedStyle(chevron).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    // The chevron is at the start of the line's end: the left.
    expect(chevron.getBoundingClientRect().left).toBeLessThan(
      share.getBoundingClientRect().left + share.getBoundingClientRect().width / 2,
    );
    await userEvent.hover(share);
    await expect.poll(() => popups().length).toBe(2);
    await settle();
    expect((popups()[1] as HTMLElement).getBoundingClientRect().right).toBeLessThanOrEqual(
      (popup() as HTMLElement).getBoundingClientRect().left,
    );
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <Edit open />
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
    await render(<Edit open />);
    await expect.poll(popup).not.toBeNull();
    await userEvent.hover(item("Copy"));
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
