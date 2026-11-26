import { type ComponentProps, type ReactNode, useState } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { Sidebar, useSidebar } from "./index";

const root = document.documentElement;

function Nav({ active = "/button" }: { active?: string }) {
  const item = (href: string, label: string, extra?: ReactNode) => (
    <Sidebar.Item href={href} active={href === active}>
      {label}
      {extra}
    </Sidebar.Item>
  );
  return (
    <Sidebar.Root aria-label="Docs">
      <Sidebar.Header>Logo</Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Indicator />
        <Sidebar.Group>
          <Sidebar.GroupLabel>Display</Sidebar.GroupLabel>
          <Sidebar.List>
            <li>{null}</li>
            {item("/button", "Button")}
            {item("/badge", "Badge", <Sidebar.ItemBadge>New</Sidebar.ItemBadge>)}
          </Sidebar.List>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Forms</Sidebar.GroupLabel>
          <Sidebar.List>
            {item("/input", "Input")}
            <Sidebar.Item disabled href="/soon">
              Soon
            </Sidebar.Item>
          </Sidebar.List>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>footer</Sidebar.Footer>
    </Sidebar.Root>
  );
}

function Shell({ children, ...props }: ComponentProps<typeof Sidebar.Provider>) {
  return (
    <Sidebar.Provider {...props}>
      <Sidebar.Trigger data-testid="inner-trigger" />
      {children ?? <Nav />}
    </Sidebar.Provider>
  );
}

const q = (selector: string) => document.querySelector<HTMLElement>(selector);
const link = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(".ow-sidebar__link")].find((a) =>
    a.textContent?.startsWith(name),
  ) as HTMLElement;

afterEach(async () => {
  await commands.setReducedMotion("no-preference");
  root.style.removeProperty("--ow-radius");
  root.style.removeProperty("--ow-fg");
  root.style.removeProperty("--ow-hover");
});

describe("Sidebar", () => {
  test("renders groups and items with BEM classes", async () => {
    await render(<Shell />);
    const nav = q(".ow-sidebar");
    expect(nav?.tagName).toBe("NAV");
    expect(nav?.getAttribute("aria-label")).toBe("Docs");
    expect(nav?.getAttribute("data-state")).toBe("open");
    expect(q(".ow-sidebar__provider")?.getAttribute("data-sidebar-state")).toBe("open");
    expect(document.querySelectorAll(".ow-sidebar__group")).toHaveLength(2);
    expect(document.querySelectorAll(".ow-sidebar__group-label")[1]?.textContent).toBe("Forms");
    const group = q(".ow-sidebar__group");
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-labelledby")).toBe(q(".ow-sidebar__group-label")?.id);
    expect(link("Badge").querySelector(".ow-sidebar__badge")?.textContent).toBe("New");
    expect(link("Button").querySelector(".ow-sidebar__label")?.textContent).toBe("Button");
    expect(q(".ow-sidebar__header")).not.toBeNull();
    expect(q(".ow-sidebar__footer")).not.toBeNull();
  });

  test("the active item has aria-current and data-active, also from aria-current alone", async () => {
    await render(
      <Sidebar.Provider>
        <Sidebar.Root>
          <Sidebar.Content>
            <Sidebar.List>
              <Sidebar.Item href="/a" active>
                A
              </Sidebar.Item>
              <Sidebar.Item href="/b" aria-current="page">
                B
              </Sidebar.Item>
              <Sidebar.Item href="/c">C</Sidebar.Item>
            </Sidebar.List>
          </Sidebar.Content>
        </Sidebar.Root>
      </Sidebar.Provider>,
    );
    for (const name of ["A", "B"]) {
      expect(link(name).getAttribute("aria-current")).toBe("page");
      expect(link(name).hasAttribute("data-active")).toBe(true);
    }
    expect(link("C").hasAttribute("aria-current")).toBe(false);
    expect(link("C").hasAttribute("data-active")).toBe(false);
  });

  test("a disabled item is aria-disabled, has no href, and is never lit", async () => {
    await render(<Shell />);
    const soon = link("Soon");
    expect(soon.getAttribute("aria-disabled")).toBe("true");
    expect(soon.hasAttribute("href")).toBe(false);
    expect(soon.hasAttribute("data-disabled")).toBe(true);
    await userEvent.hover(soon);
    await new Promise((r) => setTimeout(r, 50));
    expect(q(".ow-glide")?.hasAttribute("data-visible")).toBe(false);
  });

  test("Glide lights other items on hover and skips the active one", async () => {
    await render(<Shell />);
    const glide = q(".ow-glide") as HTMLElement;
    await userEvent.hover(link("Input"));
    await expect.poll(() => glide.hasAttribute("data-visible")).toBe(true);
    expect(link("Input").hasAttribute("data-glide-active")).toBe(true);
    await userEvent.hover(link("Button"));
    await expect.poll(() => glide.hasAttribute("data-visible")).toBe(false);
    // Marked as the nearest item, but shown no highlight.
    expect(glide.hasAttribute("data-visible")).toBe(false);
  });

  test("Trigger toggles uncontrolled state and reports aria-expanded and aria-controls", async () => {
    await render(<Shell />);
    const trigger = q('[data-testid="inner-trigger"]') as HTMLElement;
    expect(trigger.getAttribute("aria-label")).toBe("Toggle sidebar");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(q(".ow-sidebar")?.id);
    expect(trigger.querySelector("svg")).not.toBeNull();
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(q(".ow-sidebar")?.getAttribute("data-state")).toBe("closed");
    expect(q(".ow-sidebar__provider")?.getAttribute("data-sidebar-state")).toBe("closed");
    await userEvent.click(trigger);
    expect(q(".ow-sidebar")?.getAttribute("data-state")).toBe("open");
  });

  test("Trigger follows a controlled open and reports changes", async () => {
    const seen: boolean[] = [];
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Sidebar.Provider
          open={open}
          onOpenChange={(next) => {
            seen.push(next);
            // Refuse to open: the state stays controlled.
            if (!next) setOpen(next);
          }}
        >
          <Sidebar.Trigger aria-label="Menu" />
          <Nav />
        </Sidebar.Provider>
      );
    }
    await render(<Controlled />);
    const trigger = q('[aria-label="Menu"]') as HTMLElement;
    await userEvent.click(trigger);
    expect(seen).toEqual([true]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(q(".ow-sidebar")?.getAttribute("data-state")).toBe("closed");
  });

  test("defaultOpen={false} starts closed, and useSidebar exposes the state", async () => {
    let api: ReturnType<typeof useSidebar> | undefined;
    function Probe() {
      api = useSidebar();
      return null;
    }
    await render(
      <Sidebar.Provider defaultOpen={false}>
        <Probe />
        <Nav />
      </Sidebar.Provider>,
    );
    expect(api?.open).toBe(false);
    expect(api?.mobile).toBe(false);
    expect(q(".ow-sidebar")?.getAttribute("data-state")).toBe("closed");
  });

  test("Ctrl+B and Cmd+B toggle it, and shortcut={false} turns that off", async () => {
    await render(<Shell />);
    const state = () => q(".ow-sidebar")?.getAttribute("data-state");
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(state()).toBe("closed");
    await userEvent.keyboard("{Meta>}b{/Meta}");
    expect(state()).toBe("open");
    await userEvent.keyboard("b");
    expect(state()).toBe("open");
  });

  test("shortcut can be another key or false", async () => {
    const off = await render(<Shell shortcut={false} />);
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(q(".ow-sidebar")?.getAttribute("data-state")).toBe("open");
    await off.unmount();
    await render(<Shell shortcut="k" />);
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(q(".ow-sidebar")?.getAttribute("data-state")).toBe("closed");
  });

  test("closed on desktop it is inert, hidden, and translated out", async () => {
    await commands.setReducedMotion("no-preference");
    await render(<Shell defaultOpen={false} />);
    const nav = q(".ow-sidebar") as HTMLElement;
    expect(nav.hasAttribute("inert")).toBe(true);
    await expect.poll(() => getComputedStyle(nav).visibility).toBe("hidden");
    expect(getComputedStyle(nav).translate).not.toBe("none");
    expect(getComputedStyle(nav).translate).not.toBe("0px");
    expect(getComputedStyle(nav).opacity).toBe("0");
    expect(getComputedStyle(nav).willChange).toContain("translate");
  });

  test("--ow-motion-scale: 0 leaves it in place", async () => {
    root.style.setProperty("--ow-motion-scale", "0");
    try {
      await render(<Shell defaultOpen={false} />);
      expect(["none", "0px", "0%", "0px 0px", "0% 0%"]).toContain(
        getComputedStyle(q(".ow-sidebar") as Element).translate,
      );
    } finally {
      root.style.removeProperty("--ow-motion-scale");
    }
  });

  test("reduced motion: no translate, no translate transition", async () => {
    await commands.setReducedMotion("reduce");
    await render(<Shell defaultOpen={false} />);
    const nav = q(".ow-sidebar") as HTMLElement;
    const style = getComputedStyle(nav);
    expect(["none", "0px", "0%", "0px 0px", "0% 0%"]).toContain(style.translate);
    expect(style.transitionProperty).not.toContain("translate");
    expect(style.transitionProperty).toContain("opacity");
  });

  test("reduced motion: leaving waits for the fade, opening shows it at once", async () => {
    await commands.setReducedMotion("reduce");
    await render(<Shell defaultOpen={false} />);
    const nav = q(".ow-sidebar") as HTMLElement;
    expect(getComputedStyle(nav).transitionDelay).toBe("0s, 0.2s");
    (q(".ow-sidebar__trigger") as HTMLElement).click();
    await expect.poll(() => nav.dataset.state).toBe("open");
    expect(getComputedStyle(nav).transitionDelay).toBe("0s");
    expect(getComputedStyle(nav).visibility).toBe("visible");
  });

  test("tokens theme the parts (TK-9)", async () => {
    root.style.setProperty("--ow-fg", "rgb(10, 20, 30)");
    root.style.setProperty("--ow-radius", "40px");
    await render(<Shell />);
    const active = getComputedStyle(link("Button"));
    expect(active.color).toBe("rgb(10, 20, 30)");
    expect(active.fontWeight).toBe("500");
    expect(active.borderTopLeftRadius).toBe("34px");
    expect(active.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    const rest = getComputedStyle(link("Input"));
    expect(rest.color).not.toBe("rgb(10, 20, 30)");
    expect(rest.fontWeight).toBe("400");
    const glide = getComputedStyle(q(".ow-glide") as Element);
    expect(glide.borderTopLeftRadius).toBe("34px");
    const label = getComputedStyle(q(".ow-sidebar__group-label") as Element);
    expect(label.textTransform).toBe("uppercase");
    expect(label.fontSize).toBe("12px");
    expect(label.letterSpacing).toBe("0.72px");
  });

  test("className, style, render, and refs reach the parts", async () => {
    const refs: Record<string, HTMLElement | null> = {};
    const Link = (props: ComponentProps<"a">) => <a {...props} data-custom="yes" />;
    await render(
      <Sidebar.Provider className="mine-provider">
        <Sidebar.Root
          className="mine-root"
          style={{ inlineSize: 300 }}
          ref={(el) => {
            refs.root = el;
          }}
        >
          <Sidebar.Content className="mine-content" render={<section />}>
            <Sidebar.Group>
              {/* biome-ignore lint/a11y/useHeadingContent: the label fills it */}
              <Sidebar.GroupLabel render={<h2 />}>Group</Sidebar.GroupLabel>
              <Sidebar.List>
                <Sidebar.Item
                  href="/x"
                  className="mine-link"
                  render={<Link />}
                  ref={(el) => {
                    refs.link = el;
                  }}
                >
                  X
                </Sidebar.Item>
              </Sidebar.List>
            </Sidebar.Group>
          </Sidebar.Content>
        </Sidebar.Root>
      </Sidebar.Provider>,
    );
    expect(refs.root).toBe(q(".ow-sidebar"));
    expect(q(".ow-sidebar")?.className).toContain("mine-root");
    expect(q(".ow-sidebar__provider")?.className).toContain("mine-provider");
    expect(q(".ow-sidebar")?.getBoundingClientRect().width).toBe(300);
    expect(q(".ow-sidebar__content")?.tagName).toBe("SECTION");
    expect(q(".ow-sidebar__group-label")?.tagName).toBe("H2");
    const x = link("X");
    expect(refs.link).toBe(x);
    expect(x.getAttribute("data-custom")).toBe("yes");
    expect(x.className).toBe("ow-sidebar__link mine-link");
    expect(x.getAttribute("href")).toBe("/x");
  });

  test("the active item scrolls into view in Content, not the page", async () => {
    const many = Array.from({ length: 40 }, (_, i) => `/p${i}`);
    await render(
      <div style={{ blockSize: 2000 }}>
        <Sidebar.Provider>
          <Sidebar.Root style={{ blockSize: 300 }}>
            <Sidebar.Content>
              <Sidebar.List>
                {many.map((href) => (
                  <Sidebar.Item key={href} href={href} active={href === "/p30"}>
                    {href}
                  </Sidebar.Item>
                ))}
              </Sidebar.List>
            </Sidebar.Content>
          </Sidebar.Root>
        </Sidebar.Provider>
      </div>,
    );
    const content = q(".ow-sidebar__content") as HTMLElement;
    await expect.poll(() => content.scrollTop).toBeGreaterThan(500);
    const box = content.getBoundingClientRect();
    const rect = link("/p30").getBoundingClientRect();
    expect(rect.top).toBeGreaterThanOrEqual(box.top);
    expect(rect.bottom).toBeLessThanOrEqual(box.bottom);
    expect(window.scrollY).toBe(0);
  });

  test("has no axe violations", async () => {
    const screen = await render(<Shell />);
    expect((await axeReport(screen.container)).violations).toEqual([]);
  });
});

describe("Sidebar as a drawer (mobile)", () => {
  // `all` always matches, so the sidebar is a drawer without resizing the viewport.
  function Mobile({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <Sidebar.Provider mobileQuery="all">
        <Sidebar.Trigger data-testid="trigger" />
        <Sidebar.Root aria-label="Docs">
          <Sidebar.Content>
            <Sidebar.List>
              <Sidebar.Item
                href="#a"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate?.();
                }}
              >
                Alpha
              </Sidebar.Item>
              <Sidebar.Item href="#b">Beta</Sidebar.Item>
            </Sidebar.List>
          </Sidebar.Content>
        </Sidebar.Root>
      </Sidebar.Provider>
    );
  }

  test("is not rendered until opened, then is a modal dialog with a scrim", async () => {
    await render(<Mobile />);
    expect(q(".ow-sidebar")).toBeNull();
    expect(q(".ow-sidebar__provider")?.hasAttribute("data-sidebar-mobile")).toBe(true);
    const trigger = q('[data-testid="trigger"]') as HTMLElement;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(trigger);
    const drawer = q(".ow-sidebar") as HTMLElement;
    expect(drawer.getAttribute("role")).toBe("dialog");
    expect(drawer.getAttribute("aria-label")).toBe("Docs");
    expect(drawer.hasAttribute("data-mobile")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(drawer.id);
    expect(q(".ow-sidebar__backdrop")).not.toBeNull();
    expect(getComputedStyle(drawer).position).toBe("fixed");
    expect(q(".ow-glide")).not.toBeNull();
  });

  test("Esc closes it and focus returns to the Trigger", async () => {
    await render(<Mobile />);
    const trigger = q('[data-testid="trigger"]') as HTMLElement;
    await userEvent.click(trigger);
    expect(q(".ow-sidebar")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => q(".ow-sidebar")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await expect.poll(() => document.activeElement).toBe(trigger);
  });

  test("clicking an item closes it; the item's own handler still runs", async () => {
    let navigated = 0;
    await render(<Mobile onNavigate={() => navigated++} />);
    await userEvent.click(q('[data-testid="trigger"]') as HTMLElement);
    await userEvent.click(link("Beta"));
    await expect.poll(() => q(".ow-sidebar")).toBeNull();
    await userEvent.click(q('[data-testid="trigger"]') as HTMLElement);
    // Alpha prevents the default in its handler, so the drawer stays: the consumer decides.
    await userEvent.click(link("Alpha"));
    expect(navigated).toBe(1);
  });

  test("Ctrl+B toggles the drawer, and the desktop state is left alone", async () => {
    await render(<Mobile />);
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(q(".ow-sidebar")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => q(".ow-sidebar")).toBeNull();
  });

  test("container puts the drawer in an element of yours, not the body", async () => {
    function Framed() {
      const [frame, setFrame] = useState<HTMLElement | null>(null);
      return (
        <div ref={setFrame} data-testid="frame">
          <Sidebar.Provider mobileQuery="all" mobileOpen>
            <Sidebar.Root aria-label="Docs" container={frame}>
              <Sidebar.Content>Rows</Sidebar.Content>
            </Sidebar.Root>
          </Sidebar.Provider>
        </div>
      );
    }
    const screen = await render(<Framed />);
    await expect.poll(() => q('[data-testid="frame"] .ow-sidebar')).not.toBeNull();
    expect(q('[data-testid="frame"] .ow-sidebar__backdrop')).not.toBeNull();
    await screen.unmount();
  });

  test("a controlled mobileOpen drives the drawer", async () => {
    const screen = await render(<Shell mobileQuery="all" mobileOpen />);
    expect(q(".ow-sidebar")?.getAttribute("role")).toBe("dialog");
    await screen.unmount();
  });
});

test("every part has its data-slot", async () => {
  await render(
    <Sidebar.Provider>
      <Sidebar.Trigger />
      <Sidebar.Root aria-label="Docs">
        <Sidebar.Header>Logo</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Indicator />
          <Sidebar.Group>
            <Sidebar.GroupLabel>Display</Sidebar.GroupLabel>
            <Sidebar.List>
              <Sidebar.Item href="/button" active>
                <Sidebar.ItemIcon />
                Button
                <Sidebar.ItemBadge>New</Sidebar.ItemBadge>
              </Sidebar.Item>
            </Sidebar.List>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>footer</Sidebar.Footer>
      </Sidebar.Root>
    </Sidebar.Provider>,
  );
  const slots = (scope: ParentNode) => [
    ...new Set(
      [...scope.querySelectorAll("[data-slot]")].map((el) => (el as HTMLElement).dataset.slot),
    ),
  ];
  expect(slots(document.body)).toEqual([
    "sidebar-provider",
    "sidebar-trigger",
    "sidebar",
    "sidebar-header",
    "sidebar-content",
    "glide",
    "sidebar-indicator",
    "sidebar-liquid",
    "sidebar-pulse",
    "sidebar-group",
    "sidebar-group-label",
    "sidebar-list",
    "sidebar-item",
    "sidebar-link",
    "sidebar-item-icon",
    "sidebar-label",
    "sidebar-item-badge",
    "sidebar-footer",
  ]);
});

test("the drawer's root and backdrop have their data-slot", async () => {
  await render(
    <Sidebar.Provider mobileQuery="all" mobileOpen>
      <Sidebar.Root aria-label="Docs">x</Sidebar.Root>
    </Sidebar.Provider>,
  );
  expect(q('[data-slot="sidebar"][data-mobile]')).not.toBeNull();
  expect(q('[data-slot="sidebar-backdrop"]')).not.toBeNull();
});

test("the indicator and the highlight survive another data-slot on a link and a list", async () => {
  await render(
    <Sidebar.Provider>
      <Sidebar.Root aria-label="Docs">
        <Sidebar.Content>
          <Sidebar.Indicator />
          <Sidebar.List data-slot="mine">
            <Sidebar.Item data-slot="mine" href="/button" active>
              Button
            </Sidebar.Item>
            <Sidebar.Item data-slot="mine" href="/input">
              Input
            </Sidebar.Item>
          </Sidebar.List>
        </Sidebar.Content>
      </Sidebar.Root>
    </Sidebar.Provider>,
  );
  const button = link("Button");
  expect(button.dataset.slot).toBe("sidebar-link");
  expect(q("ul")?.dataset.slot).toBe("sidebar-list");
  await expect.poll(() => button.hasAttribute("data-landed")).toBe(true);
  expect(q(".ow-sidebar__indicator")?.hasAttribute("data-visible")).toBe(true);
});
