import type { ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { TreeRailNav } from "./index";

function Nav({ current = "dark", open = true }: { current?: string; open?: boolean }) {
  const link = (id: string, label: string, extra: { disabled?: boolean } = {}) => (
    <TreeRailNav.Node>
      <TreeRailNav.Link href={`#${id}`} current={current === id} {...extra}>
        {label}
      </TreeRailNav.Link>
    </TreeRailNav.Node>
  );
  return (
    <TreeRailNav.Root aria-label="Docs" style={{ inlineSize: 280 }}>
      <TreeRailNav.List>
        {link("home", "Home")}
        <TreeRailNav.Node defaultOpen={open}>
          <TreeRailNav.Toggle>Settings</TreeRailNav.Toggle>
          <TreeRailNav.Panel>
            <TreeRailNav.List>
              {link("profile", "Profile")}
              <TreeRailNav.Node defaultOpen>
                <TreeRailNav.Toggle>Appearance</TreeRailNav.Toggle>
                <TreeRailNav.Panel>
                  <TreeRailNav.List>
                    {link("dark", "Dark mode")}
                    {link("density", "Density", { disabled: true })}
                  </TreeRailNav.List>
                </TreeRailNav.Panel>
              </TreeRailNav.Node>
            </TreeRailNav.List>
          </TreeRailNav.Panel>
        </TreeRailNav.Node>
        {link("about", "About")}
      </TreeRailNav.List>
    </TreeRailNav.Root>
  );
}

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const nav = screen.container.querySelector<HTMLElement>("nav");
  const tree = screen.container.querySelector<HTMLElement>(".ow-tree-rail-nav__tree");
  if (!nav || !tree) throw new Error("not mounted");
  const row = (name: string) => {
    const el = [...tree.querySelectorAll<HTMLElement>(".ow-tree-rail-nav__item")].find(
      (r) => r.textContent === name,
    );
    if (!el) throw new Error(`no row ${name}`);
    return el;
  };
  return { screen, nav, tree, row };
}

/** Paints `colors` in order on one pixel: the composite of a translucent tint over a page. */
function composite(...colors: string[]): number[] {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("no canvas");
  for (const color of colors) {
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
  }
  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}

function contrast(a: number[], b: number[]): number {
  const lum = (rgb: number[]) => {
    const [r = 0, g = 0, b = 0] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** The marker's y in the tree, and a row's middle, to compare where the trail ends. */
const markerY = (tree: HTMLElement) => {
  const t = tree.querySelector(".ow-tree-rail-nav__rail-marker")?.getAttribute("transform") ?? "";
  return Number(/translate\([\d.-]+ ([\d.-]+)\)/.exec(t)?.[1] ?? Number.NaN);
};
const middle = (tree: HTMLElement, row: HTMLElement) => {
  const r = row.getBoundingClientRect();
  return r.top + r.height / 2 - tree.getBoundingClientRect().top;
};

describe("Tree Rail Nav", () => {
  test("renders a labelled nav of nested lists, with groups as disclosure buttons", async () => {
    const { screen, nav, row } = await mount(<Nav />);
    expect(nav.getAttribute("aria-label")).toBe("Docs");
    const settings = row("Settings");
    expect(settings.tagName).toBe("BUTTON");
    expect(settings.getAttribute("aria-expanded")).toBe("true");
    const panel = document.getElementById(settings.getAttribute("aria-controls") ?? "");
    expect(panel?.querySelector("ul")?.getAttribute("aria-labelledby")).toBe(settings.id);
    expect(row("Dark mode").getAttribute("aria-current")).toBe("page");
    expect(row("Density").getAttribute("aria-disabled")).toBe("true");
    expect(screen.container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("draws the trail from the top to the current row, lighting each level's dot", async () => {
    const { tree, row } = await mount(<Nav />);
    await expect.poll(() => markerY(tree)).toBeCloseTo(middle(tree, row("Dark mode")), 0);
    expect(row("Settings").hasAttribute("data-trail")).toBe(true);
    expect(row("Appearance").hasAttribute("data-trail")).toBe(true);
    expect(row("Home").hasAttribute("data-trail")).toBe(false);
    // Lit: Home and Settings on the root rail, Profile and Appearance on the next, and Dark mode.
    // About is below the branch, and Density is past the end.
    expect(tree.querySelectorAll(".ow-tree-rail-nav__rail-node[data-lit]").length).toBe(5);
    // The first draw is simply there, as after a client-side route change: the trail, its dots,
    // the rows on it, and the tint. Nothing fades or sweeps in.
    const current = row("Dark mode");
    expect(current.hasAttribute("data-arrived")).toBe(true);
    const fading = tree
      .getAnimations({ subtree: true })
      .filter((a): a is CSSTransition => a instanceof CSSTransition)
      .map((a) => a.transitionProperty);
    expect(fading).toEqual([]);
    expect(getComputedStyle(current, "::before").opacity).toBe("1");
  });

  test("draws the trail to the current row inside a scaled ancestor", async () => {
    const scaled = (current = "dark") => (
      <div style={{ transform: "scale(0.5)", transformOrigin: "0 0" }}>
        <Nav current={current} />
      </div>
    );
    const { screen, tree, row } = await mount(scaled());
    // The SVG draws in the tree's own px: twice what the screen shows at half scale.
    const local = (name: string) => middle(tree, row(name)) / 0.5;
    await expect.poll(() => markerY(tree)).toBeCloseTo(local("Dark mode"), 0);
    screen.rerender(scaled("about"));
    await expect.poll(() => markerY(tree)).toBeCloseTo(local("About"), 0);
  });

  test("travels to a new current row and marks it on arrival", async () => {
    const { screen, tree, row } = await mount(<Nav />);
    await expect.poll(() => markerY(tree)).toBeCloseTo(middle(tree, row("Dark mode")), 0);
    // The tint has swept in.
    await expect.poll(() => getComputedStyle(row("Dark mode"), "::before").transform).toBe("none");
    screen.rerender(<Nav current="about" />);
    const to = middle(tree, row("About"));
    // The old row's tint folds back toward the rail as the trail leaves, then goes.
    const old = row("Dark mode");
    await expect.poll(() => old.hasAttribute("data-leaving")).toBe(true);
    expect(getComputedStyle(old, "::before").content).not.toBe("none");
    const folding = old
      .getAnimations({ subtree: true })
      .filter((a): a is CSSTransition => a instanceof CSSTransition)
      .map((a) => a.transitionProperty);
    expect(folding).toContain("transform");
    // Mid-way, the marker is still between the rows; then it lands and the row is marked.
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(markerY(tree)).not.toBeCloseTo(to, 0);
    await expect.poll(() => markerY(tree), { timeout: 2000 }).toBeCloseTo(to, 0);
    await expect.poll(() => row("About").hasAttribute("data-arrived")).toBe(true);
    expect(old.hasAttribute("data-leaving")).toBe(false);
    expect(getComputedStyle(old, "::before").content).toBe("none");
  });

  test("travels from the top to a current row that arrives after mount", async () => {
    // As when a page outside the nav (the home page) links to one in it.
    const { screen, tree, row } = await mount(<Nav current="none" />);
    screen.rerender(<Nav />);
    const to = middle(tree, row("Dark mode"));
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(markerY(tree)).not.toBeCloseTo(to, 0);
    await expect.poll(() => markerY(tree), { timeout: 2000 }).toBeCloseTo(to, 0);
    await expect.poll(() => row("Dark mode").hasAttribute("data-arrived")).toBe(true);
  });

  test("ends at the group's row while the current row is closed inside it", async () => {
    const { tree, row } = await mount(<Nav />);
    const settings = row("Settings");
    // The first draw puts the trail on the current row; closing its group starts from there.
    await expect.poll(() => markerY(tree)).toBeCloseTo(middle(tree, row("Dark mode")), 0);
    settings.click();
    await expect
      .poll(() => markerY(tree), { timeout: 2000 })
      .toBeCloseTo(middle(tree, settings), 0);
    expect(tree.querySelector(".ow-tree-rail-nav__rail-marker")?.hasAttribute("data-hollow")).toBe(
      true,
    );
    expect(row("Dark mode").hasAttribute("data-arrived")).toBe(false);
    settings.click();
    await expect
      .poll(() => row("Dark mode").hasAttribute("data-arrived"), { timeout: 2000 })
      .toBe(true);
  });

  test("a panel clips only while it opens or closes, so no focus ring is cut (FR-13)", async () => {
    const { row } = await mount(<Nav />);
    const settings = row("Settings");
    const panel = document.getElementById(settings.getAttribute("aria-controls") ?? "");
    if (!panel) throw new Error("no panel");
    const overflow = () => getComputedStyle(panel).overflow;
    await expect.poll(overflow).toBe("visible");
    settings.click();
    await expect.poll(() => panel.hidden).toBe(true);
    settings.click();
    await expect.poll(overflow).toBe("hidden");
    await expect.poll(overflow, { timeout: 2000 }).toBe("visible");
  });

  test("arrow keys walk the visible rows and open, close, and climb groups", async () => {
    const { row } = await mount(<Nav />);
    const press = (key: string) =>
      document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    row("Home").focus();
    press("ArrowDown");
    expect(document.activeElement).toBe(row("Settings"));
    press("End");
    expect(document.activeElement).toBe(row("About"));
    press("Home");
    expect(document.activeElement).toBe(row("Home"));

    // Density is disabled: Down from Dark mode skips it.
    row("Dark mode").focus();
    press("ArrowDown");
    expect(document.activeElement).toBe(row("About"));

    row("Dark mode").focus();
    press("ArrowLeft");
    expect(document.activeElement).toBe(row("Appearance"));
    press("ArrowLeft");
    await expect.poll(() => row("Appearance").getAttribute("aria-expanded")).toBe("false");
    press("ArrowRight");
    await expect.poll(() => row("Appearance").getAttribute("aria-expanded")).toBe("true");
    press("ArrowRight");
    expect(document.activeElement).toBe(row("Dark mode"));
  });

  test("a disabled link neither navigates nor runs its click handler", async () => {
    let clicks = 0;
    const screen = await render(
      <TreeRailNav.Root aria-label="Docs">
        <TreeRailNav.List>
          <TreeRailNav.Node>
            <TreeRailNav.Link href="#x" disabled onClick={() => clicks++}>
              Density
            </TreeRailNav.Link>
          </TreeRailNav.Node>
        </TreeRailNav.List>
      </TreeRailNav.Root>,
    );
    const link = screen.container.querySelector("a");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link?.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(clicks).toBe(0);
  });

  test("an Origin label sets where the trail starts", async () => {
    const screen = await render(
      <TreeRailNav.Root aria-label="Docs" style={{ inlineSize: 280 }}>
        <TreeRailNav.Origin>OwsemUI</TreeRailNav.Origin>
        <TreeRailNav.List>
          <TreeRailNav.Node>
            <TreeRailNav.Link href="#a" current>
              Alpha
            </TreeRailNav.Link>
          </TreeRailNav.Node>
        </TreeRailNav.List>
      </TreeRailNav.Root>,
    );
    const tree = screen.container.querySelector<HTMLElement>(".ow-tree-rail-nav__tree");
    const label = screen.container.querySelector<HTMLElement>(".ow-tree-rail-nav__origin");
    if (!tree || !label) throw new Error("not mounted");
    const originY = () => {
      const t =
        tree.querySelector(".ow-tree-rail-nav__rail-origin")?.getAttribute("transform") ?? "";
      return Number(/translate\([\d.-]+ ([\d.-]+)\)/.exec(t)?.[1] ?? Number.NaN);
    };
    await expect.poll(originY).toBeCloseTo(label.offsetTop + label.offsetHeight / 2, 0);
  });

  test("a Label too long for its row fades, and runs only while the row is hovered", async () => {
    const screen = await render(
      <TreeRailNav.Root aria-label="Docs" style={{ inlineSize: 180 }}>
        <TreeRailNav.List>
          <TreeRailNav.Node>
            <TreeRailNav.Link href="#short">
              <TreeRailNav.Label>Menu</TreeRailNav.Label>
            </TreeRailNav.Link>
          </TreeRailNav.Node>
          <TreeRailNav.Node>
            <TreeRailNav.Link href="#long">
              <TreeRailNav.Label>Keyboard and accessibility</TreeRailNav.Label>
            </TreeRailNav.Link>
          </TreeRailNav.Node>
        </TreeRailNav.List>
      </TreeRailNav.Root>,
    );
    const [short, long] = [
      ...screen.container.querySelectorAll<HTMLElement>(".ow-tree-rail-nav__label"),
    ];
    if (!short || !long) throw new Error("no labels");
    await expect.poll(() => long.hasAttribute("data-overflow")).toBe(true);
    expect(short.hasAttribute("data-overflow")).toBe(false);
    expect(short.children.length).toBe(1);
    // The loop's second copy is hidden from assistive technology.
    expect(long.children.length).toBe(2);
    expect(long.children[1]?.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(long).whiteSpace).toBe("nowrap");

    const marquee = () =>
      long.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation).length;
    expect(marquee()).toBe(0);
    // The start fade waits outside the label: it slides in with the text, and snaps back with it.
    const fade = () => getComputedStyle(long).maskPosition;
    expect(fade()).toBe("-16px 0px, 0px 0px");
    expect(getComputedStyle(long).transitionDuration).toBe("0s");
    const row = long.closest<HTMLElement>(".ow-tree-rail-nav__item");
    const tree = screen.container.querySelector<HTMLElement>(".ow-tree-rail-nav__tree");
    const r = row?.getBoundingClientRect();
    if (!row || !tree || !r) throw new Error("no row");
    tree.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerType: "mouse",
        clientX: r.left + 10,
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(marquee).toBe(2);
    expect(getComputedStyle(long).transitionProperty).toBe("mask-position");
    await expect.poll(fade).toBe("0px 0px, 0px 0px");
    tree.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    await expect.poll(marquee).toBe(0);
    expect(fade()).toBe("-16px 0px, 0px 0px");
  });

  test("a long Label keeps still under reduced motion and shows a tooltip (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const screen = await render(
      <TreeRailNav.Root aria-label="Docs" style={{ inlineSize: 180 }}>
        <TreeRailNav.List>
          <TreeRailNav.Node>
            <TreeRailNav.Link href="#long">
              <TreeRailNav.Label>Keyboard and accessibility</TreeRailNav.Label>
            </TreeRailNav.Link>
          </TreeRailNav.Node>
        </TreeRailNav.List>
      </TreeRailNav.Root>,
    );
    const label = screen.container.querySelector<HTMLElement>(".ow-tree-rail-nav__label");
    const row = label?.closest<HTMLElement>(".ow-tree-rail-nav__item");
    if (!label || !row) throw new Error("no label");
    await expect.poll(() => label.title).toBe("Keyboard and accessibility");
    row.setAttribute("data-glide-active", "");
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(label.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation)).toEqual(
      [],
    );
  });

  test("hover lights the nearest row with Glide", async () => {
    const { tree, row } = await mount(<Nav />);
    const profile = row("Profile").getBoundingClientRect();
    tree.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerType: "mouse",
        clientX: profile.left + 20,
        clientY: profile.top + 10,
      }),
    );
    expect(row("Profile").hasAttribute("data-glide-active")).toBe(true);
  });

  test("swaps the link element with render", async () => {
    const screen = await render(
      <TreeRailNav.Root aria-label="Docs">
        <TreeRailNav.List>
          <TreeRailNav.Node>
            <TreeRailNav.Link render={<a data-router="" href="#x" />} current>
              Routed
            </TreeRailNav.Link>
          </TreeRailNav.Node>
        </TreeRailNav.List>
      </TreeRailNav.Root>,
    );
    const link = screen.container.querySelector("[data-router]");
    expect(link?.getAttribute("aria-current")).toBe("page");
    expect(link?.classList.contains("ow-tree-rail-nav__item")).toBe(true);
  });

  test("does not travel under reduced motion (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { screen, tree, row } = await mount(<Nav />);
    await expect.poll(() => markerY(tree)).toBeCloseTo(middle(tree, row("Dark mode")), 0);
    screen.rerender(<Nav current="home" />);
    await expect
      .poll(() => markerY(tree), { timeout: 200 })
      .toBeCloseTo(middle(tree, row("Home")), 0);
    const panel = tree.querySelector(".ow-tree-rail-nav__panel");
    expect(panel && getComputedStyle(panel).transitionDuration).toBe("0s");
  });

  test("draws the rail in system colors in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { tree } = await mount(<Nav />);
    await commands.setForcedColors("active");
    const trail = tree.querySelector(".ow-tree-rail-nav__rail-trail");
    const probe = document.createElement("span");
    probe.style.color = "Highlight";
    document.body.append(probe);
    onTestFinished(() => probe.remove());
    expect(trail && getComputedStyle(trail).stroke).toBe(getComputedStyle(probe).color);
  });

  test("mirrors the rail for right-to-left text (FR-16)", async () => {
    const screen = await render(
      <div dir="rtl">
        <Nav />
      </div>,
    );
    const svg = screen.container.querySelector(".ow-tree-rail-nav__rail");
    expect(svg && getComputedStyle(svg).scale).toBe("-1 1");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete document.documentElement.dataset.theme;
    });
    const { screen, tree, row } = await mount(<Nav />);
    // The rail draws only in the indent left of each row, never behind its text: every dot sits
    // left of its row. axe counts any SVG behind text as an image, so it measures without it.
    await expect.poll(() => tree.querySelectorAll(".ow-tree-rail-nav__rail-node").length).toBe(7);
    for (const name of ["Home", "Settings", "Profile", "Dark mode"]) {
      const r = row(name).getBoundingClientRect();
      const dots = [...tree.querySelectorAll(".ow-tree-rail-nav__rail-node")].map((d) =>
        d.getBoundingClientRect(),
      );
      const dot = dots.find((d) => Math.abs(d.top + d.height / 2 - (r.top + r.height / 2)) < 1);
      expect(dot?.right).toBeLessThan(r.left);
    }
    const svg = tree.querySelector<SVGElement>(".ow-tree-rail-nav__rail");
    if (svg) svg.style.display = "none";
    for (const theme of ["light", "dark"]) {
      document.documentElement.dataset.theme = theme;
      // Rows fade their color; wait for the final one.
      await settle();
      // axe cannot read the current row's tint (a translucent ::before), so check that one here.
      const current = row("Dark mode");
      const page = getComputedStyle(document.body).backgroundColor;
      const tint = getComputedStyle(current, "::before").backgroundColor;
      const text = composite(page, getComputedStyle(current).color);
      expect(contrast(text, composite(page, tint))).toBeGreaterThanOrEqual(4.5);
      expect(await axeReport(screen.container)).toEqual({
        violations: [],
        contrastUnknown: [`#${CSS.escape(current.id)}`],
      });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    const { screen } = await mount(<Nav />);
    screen.rerender(<Nav current="home" />);
    await settle({ maxMs: 3000 });
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
