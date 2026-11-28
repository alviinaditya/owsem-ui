import { DirectionProvider } from "@base-ui/react/direction-provider";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { NavigationMenu, type NavigationMenuSize } from "./index";

const root = document.documentElement;

/** Two items with a panel and a link, as a site's header has. */
function Nav({
  size,
  open,
  arrow,
  noPortalChildren = true,
}: {
  size?: NavigationMenuSize;
  open?: "products" | "resources";
  arrow?: boolean;
  noPortalChildren?: boolean;
}) {
  return (
    <NavigationMenu.Root
      aria-label="Main"
      {...(size ? { size } : {})}
      {...(open ? { defaultValue: open } : {})}
    >
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 12rem)",
                margin: 0,
                padding: 0,
              }}
            >
              <li>
                <NavigationMenu.Link href="#components">
                  <strong>Components</strong>
                  <span>Parts</span>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link href="#tokens" active>
                  <strong>Tokens</strong>
                  <span>Theme</span>
                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="resources">
          <NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="#guides">
              <strong>Guides</strong>
              <span>Start</span>
            </NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#pricing">Pricing</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      {noPortalChildren && !arrow ? (
        <NavigationMenu.Portal />
      ) : (
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner>
            <NavigationMenu.Popup>
              {arrow ? <NavigationMenu.Arrow /> : null}
              <NavigationMenu.Viewport />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      )}
    </NavigationMenu.Root>
  );
}

const nav = () =>
  document.querySelector<HTMLElement>('[data-slot="navigation-menu"]') as HTMLElement;
const trigger = (name: string) => {
  const el = [
    ...document.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-trigger"]'),
  ].find((candidate) => candidate.textContent === name);
  if (!el) throw new Error(`no trigger ${name}`);
  return el;
};
const popup = () => document.querySelector<HTMLElement>('[data-slot="navigation-menu-popup"]');
const link = (name: string) => {
  const el = [...document.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-link"]')].find(
    (candidate) => candidate.textContent?.startsWith(name),
  );
  if (!el) throw new Error(`no link ${name}`);
  return el;
};
const box = (el: Element) => el.getBoundingClientRect();
const gone = () => expect.poll(popup, { timeout: 2000 }).toBeNull();

describe("NavigationMenu", () => {
  test("is Base UI's navigation menu: a click opens a panel, Escape shuts it and returns focus", async () => {
    await render(<Nav />);
    expect(nav().tagName).toBe("NAV");
    expect(nav().getAttribute("aria-label")).toBe("Main");
    expect(popup()).toBeNull();
    await userEvent.click(trigger("Products"));
    await expect.poll(popup).not.toBeNull();
    expect(trigger("Products").getAttribute("aria-expanded")).toBe("true");
    expect(trigger("Products").hasAttribute("data-popup-open")).toBe(true);
    expect(link("Components")).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(trigger("Products"));
  });

  test("an empty Portal draws the Positioner, the Popup, and the Viewport", async () => {
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.closest('[data-slot="navigation-menu-positioner"]')).not.toBeNull();
    const viewport = popup()?.querySelector('[data-slot="navigation-menu-viewport"]');
    expect(viewport).not.toBeNull();
    expect(viewport?.contains(link("Components"))).toBe(true);
    expect(popup()?.className).toBe("ow-navigation-menu__popup ow-navigation-menu__popup--md");
  });

  test("a trigger draws its chevron, which turns over while its panel is open", async () => {
    await render(<Nav />);
    const icon = trigger("Products").querySelector<HTMLElement>(
      '[data-slot="navigation-menu-icon"]',
    );
    expect(icon?.querySelector("svg")).not.toBeNull();
    // Base UI hides it from assistive technology: it is decoration.
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(icon as HTMLElement).transform).toBe("none");
    await userEvent.click(trigger("Products"));
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(getComputedStyle(icon as HTMLElement).transform).toBe("matrix(-1, 0, 0, -1, 0, 0)");
  });

  test("icon replaces the chevron, and icon={null} leaves it out", async () => {
    await render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger icon={<i data-mine />}>One</NavigationMenu.Trigger>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger icon={null}>Two</NavigationMenu.Trigger>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );
    expect(trigger("One").querySelector("[data-mine]")).not.toBeNull();
    expect(trigger("One").querySelector("svg")).toBeNull();
    expect(trigger("Two").querySelector('[data-slot="navigation-menu-icon"]')).toBeNull();
  });

  test("moving to another trigger swaps the content in the one panel", async () => {
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    await userEvent.click(trigger("Resources"));
    await expect
      .poll(() => document.querySelectorAll('[data-slot="navigation-menu-popup"]').length)
      .toBe(1);
    await expect.poll(() => popup()?.contains(link("Guides"))).toBe(true);
    // The old content leaves after its exit.
    await expect.poll(() => document.querySelector('[href="#components"]')).toBeNull();
  });

  test("the content knows the side it came from, and slides on transform and opacity", async () => {
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    const seen: string[] = [];
    const watch = new MutationObserver((records) => {
      for (const record of records) {
        const el = record.target as HTMLElement;
        if (el.dataset.slot === "navigation-menu-content" && el.dataset.activationDirection) {
          seen.push(el.dataset.activationDirection);
        }
      }
    });
    watch.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-activation-direction"],
      subtree: true,
    });
    onTestFinished(() => watch.disconnect());
    await userEvent.click(trigger("Resources"));
    await expect.poll(() => seen.length).toBeGreaterThan(0);
    expect(seen.every((side) => side === "right")).toBe(true);
    const content = document.querySelector<HTMLElement>('[data-slot="navigation-menu-content"]');
    const props = getComputedStyle(content as HTMLElement).transitionProperty.split(", ");
    expect(props).toEqual(["opacity", "translate"]);
    await settle();
  });

  test("the slide is read at the panel's pace: the whole 320 ms, 40% of the way, the leaving one fades first", async () => {
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    const content = document.querySelector<HTMLElement>(
      '[data-slot="navigation-menu-content"]',
    ) as HTMLElement;
    // The one arriving: it travels the panel's 320 ms and fades in a little later, after the old
    // content has gone; the one leaving fades on ease-in and quicker, still there as it moves.
    const arriving = getComputedStyle(content);
    expect(arriving.transitionDuration.split(", ")).toEqual(["0.2s", "0.32s"]);
    expect(arriving.transitionDelay.split(", ")).toEqual(["0.06s", "0s"]);
    content.setAttribute("data-ending-style", "");
    const leaving = getComputedStyle(content);
    expect(leaving.transitionDuration.split(", ")).toEqual(["0.14s", "0.32s"]);
    expect(leaving.transitionDelay.split(", ")).toEqual(["0s", "0s"]);
    expect(leaving.transitionTimingFunction.split(/, (?=ease|cubic)/)[0]).toBe("ease-in");
    // Both travel on a symmetric curve, steadier than the ease-out they had.
    const curve = "cubic-bezier(0.4, 0, 0.2, 1)";
    expect(arriving.transitionTimingFunction.endsWith(curve)).toBe(true);
    expect(leaving.transitionTimingFunction.endsWith(curve)).toBe(true);
    // Frozen, so what is read is the end of the transition, not a frame of it.
    content.style.transition = "none";
    // Toward the side the pointer came from and away from the other one, 40% of its own width.
    content.setAttribute("data-activation-direction", "right");
    expect(getComputedStyle(content).translate).toMatch(/^-40%( 0px)?$/);
    content.setAttribute("data-activation-direction", "left");
    expect(getComputedStyle(content).translate).toMatch(/^40%( 0px)?$/);
    content.removeAttribute("data-ending-style");
    content.setAttribute("data-starting-style", "");
    expect(getComputedStyle(content).translate).toMatch(/^-40%( 0px)?$/);
    content.removeAttribute("data-starting-style");
    content.removeAttribute("data-activation-direction");
  });

  test("links in a content are cards lit by Glide; the current page keeps a tint", async () => {
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(link("Components").className).toBe("ow-navigation-menu__link");
    await userEvent.hover(link("Components"));
    await expect
      .poll(() => document.querySelector("[data-glide-active]")?.textContent)
      .toContain("Components");
    const tokens = link("Tokens");
    expect(tokens.hasAttribute("data-active")).toBe(true);
    expect(tokens.getAttribute("aria-current")).toBe("page");
    expect(getComputedStyle(tokens).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    // The title leads, and the lines under it are muted.
    const [title, body] = [...link("Components").children] as HTMLElement[];
    expect(getComputedStyle(title as HTMLElement).fontWeight).toBe("500");
    expect(getComputedStyle(body as HTMLElement).color).not.toBe(
      getComputedStyle(title as HTMLElement).color,
    );
  });

  test("a link in the list is a ghost button like the triggers", async () => {
    await render(<Nav />);
    expect(link("Pricing").className).toBe(
      "ow-navigation-menu__trigger ow-navigation-menu__trigger--md",
    );
    expect(box(link("Pricing")).height).toBeCloseTo(box(trigger("Products")).height, 0);
    expect(getComputedStyle(link("Pricing")).textDecorationLine).toBe("none");
  });

  test("triggers are 32, 40, or 48px tall, and the panel's type follows the Root's size", async () => {
    for (const [size, height, font] of [
      ["sm", 32, "13px"],
      ["md", 40, "14px"],
      ["lg", 48, "16px"],
    ] as const) {
      const screen = await render(<Nav size={size} open="resources" />);
      expect(box(trigger("Products")).height).toBeCloseTo(height, 0);
      await expect.poll(popup).not.toBeNull();
      expect(popup()?.dataset.size).toBe(size);
      expect(getComputedStyle(popup() as HTMLElement).fontSize).toBe(font);
      await screen.unmount();
    }
  });

  test("the panel is the raised fill with the popup shadow, 8px under the list", async () => {
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.boxShadow).not.toBe("none");
    expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    const radius = getComputedStyle(root).getPropertyValue("--ow-radius").trim();
    expect(style.borderTopLeftRadius).toBe(radius);
    const list = box(document.querySelector('[data-slot="navigation-menu-list"]') as Element);
    expect(box(popup() as HTMLElement).top - list.bottom).toBeCloseTo(8, 0);
  });

  test("an arrow points at the open trigger", async () => {
    await render(<Nav open="products" arrow />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    const arrow = popup()?.querySelector<HTMLElement>('[data-slot="navigation-menu-arrow"]');
    expect(arrow?.className).toBe("ow-navigation-menu__arrow");
    expect(arrow?.dataset.side).toBe("bottom");
    expect(getComputedStyle(arrow as HTMLElement).clipPath).not.toBe("none");
  });

  test("the keyboard reaches the triggers and the links", async () => {
    await render(<Nav />);
    trigger("Products").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(trigger("Resources"));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(link("Pricing"));
    const ring = getComputedStyle(link("Pricing"));
    expect(ring.outlineStyle).toBe("solid");
    expect(ring.outlineWidth).toBe("2px");
  });

  test("a disabled trigger is dimmed", async () => {
    await render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger disabled>Off</NavigationMenu.Trigger>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );
    expect(getComputedStyle(trigger("Off")).opacity).toBe("0.45");
  });

  test("the list wraps on a narrow screen instead of scrolling", async () => {
    await render(
      <div style={{ inlineSize: 160 }}>
        <Nav />
      </div>,
    );
    const list = document.querySelector('[data-slot="navigation-menu-list"]') as HTMLElement;
    expect(getComputedStyle(list).flexWrap).toBe("wrap");
    expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    expect(box(link("Pricing")).top).toBeGreaterThan(box(trigger("Products")).top);
  });

  test("the panel stays inside the window, as wide as the window at most", async () => {
    await render(
      <div style={{ inlineSize: 260 }}>
        <Nav open="products" />
      </div>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    const rect = box(popup() as HTMLElement);
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(window.innerWidth + 0.5);
  });

  test("passes className, style, render, and ref through its parts", async () => {
    const refs = {
      root: createRef<HTMLElement>(),
      list: createRef<HTMLUListElement>(),
      trigger: createRef<HTMLButtonElement>(),
      content: createRef<HTMLDivElement>(),
      link: createRef<HTMLAnchorElement>(),
      positioner: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      viewport: createRef<HTMLDivElement>(),
    };
    await render(
      <NavigationMenu.Root ref={refs.root} className="r" defaultValue="a">
        <NavigationMenu.List ref={refs.list} className="l">
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger ref={refs.trigger} className="t">
              One
            </NavigationMenu.Trigger>
            <NavigationMenu.Content ref={refs.content} className="c" style={{ zIndex: 4 }}>
              <NavigationMenu.Link
                ref={refs.link}
                className="k"
                href="#k"
                render={<a href="#custom" data-custom />}
              >
                Link
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner ref={refs.positioner} className="p">
            <NavigationMenu.Popup ref={refs.popup} className="u">
              <NavigationMenu.Viewport ref={refs.viewport} className="v" />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.root.current?.className).toBe("ow-navigation-menu ow-navigation-menu--md r");
    expect(refs.list.current?.className).toBe("ow-navigation-menu__list l");
    expect(refs.trigger.current?.className).toBe(
      "ow-navigation-menu__trigger ow-navigation-menu__trigger--md t",
    );
    expect(refs.content.current?.className).toBe("ow-navigation-menu__content c");
    expect(refs.content.current?.style.zIndex).toBe("4");
    expect(refs.link.current?.className).toBe("ow-navigation-menu__link k");
    expect(refs.link.current?.hasAttribute("data-custom")).toBe(true);
    expect(refs.positioner.current?.className).toBe("ow-navigation-menu__positioner p");
    expect(refs.popup.current?.className).toBe(
      "ow-navigation-menu__popup ow-navigation-menu__popup--md u",
    );
    expect(refs.viewport.current?.className).toBe("ow-navigation-menu__viewport v");
  });

  test("grows in 180 ms and moves in 320 ms; the panel's size is the one thing animated that is not a transform", async () => {
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    const style = getComputedStyle(popup() as HTMLElement);
    expect(style.transitionProperty.split(", ")).toEqual([
      "opacity",
      "transform",
      "inline-size",
      "block-size",
    ]);
    expect(style.transitionDuration.split(", ")).toEqual(["0.18s", "0.18s", "0.32s", "0.32s"]);
    const positioner = getComputedStyle(popup()?.parentElement as HTMLElement);
    expect(positioner.transitionDuration).toBe("0.32s");
  });

  test("under reduced motion the panel fades without growing or moving, the content without sliding", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    const content = document.querySelector<HTMLElement>('[data-slot="navigation-menu-content"]');
    content?.setAttribute("data-starting-style", "");
    content?.setAttribute("data-activation-direction", "left");
    popup()?.setAttribute("data-starting-style", "");
    expect(getComputedStyle(content as HTMLElement).translate).toBe("none");
    expect(getComputedStyle(popup() as HTMLElement).transform).toBe("none");
    // Moving to another trigger, the panel takes its new place and size at once.
    expect(getComputedStyle(popup() as HTMLElement).transitionProperty).toBe("opacity");
    const positioner = getComputedStyle(popup()?.parentElement as HTMLElement);
    expect(positioner.transitionDuration).toBe("0s");
  });

  test("follows the text direction: the positioner carries it", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Nav open="products" />
        </div>
      </DirectionProvider>,
    );
    await expect.poll(popup).not.toBeNull();
    expect(document.querySelector(".ow-navigation-menu__positioner")?.getAttribute("dir")).toBe(
      "rtl",
    );
    expect(box(trigger("Products")).left).toBeGreaterThan(box(trigger("Resources")).left);
  });

  test("keeps its edge, the open trigger, and the focus ring in forced colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    expect(getComputedStyle(popup() as HTMLElement).outlineStyle).toBe("solid");
    expect(getComputedStyle(trigger("Products")).outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("more contrast adds a 1px --ow-edge ring to the panel", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    await commands.setContrast("more");
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    expect(getComputedStyle(popup() as HTMLElement).boxShadow).toContain("0px 0px 0px 1px");
  });

  test("has no axe violations in light and dark, closed and open", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <Nav open="products" />
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const report = await axeReport(document.body);
      // Base UI's focus guards are focusable and hidden by design: they hand focus on at the ends.
      const violations = report.violations.filter(
        (violation) =>
          !(
            violation.id === "aria-hidden-focus" &&
            violation.nodes.every((node) => node.includes("data-base-ui-focus-guard"))
          ),
      );
      expect({ ...report, violations }).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, closed and open", async () => {
    const screen = await render(<Nav />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await screen.unmount();
    await render(<Nav open="products" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("renders on the server without warnings", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => error.mockRestore());
    const html = renderToString(<Nav />);
    expect(html).toContain("<nav");
    expect(html).toContain("ow-navigation-menu__trigger");
    expect(error).not.toHaveBeenCalled();
  });
});

test("every part has its data-slot", async () => {
  await render(
    <NavigationMenu.Root defaultValue="a">
      <NavigationMenu.List>
        <NavigationMenu.Item value="a">
          <NavigationMenu.Trigger>One</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="#k">Link</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Backdrop />
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Arrow />
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>,
  );
  await expect.poll(popup).not.toBeNull();
  const slots = [...document.querySelectorAll('[data-slot^="navigation-menu"]')].map((el) =>
    el.getAttribute("data-slot"),
  );
  for (const expected of [
    "navigation-menu",
    "navigation-menu-list",
    "navigation-menu-trigger",
    "navigation-menu-icon",
    "navigation-menu-portal",
    "navigation-menu-backdrop",
    "navigation-menu-positioner",
    "navigation-menu-popup",
    "navigation-menu-arrow",
    "navigation-menu-viewport",
    "navigation-menu-content",
    "navigation-menu-link",
  ]) {
    expect(slots, expected).toContain(expected);
  }
});
