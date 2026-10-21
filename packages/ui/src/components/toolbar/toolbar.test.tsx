import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Toggle } from "../toggle";
import { Toolbar } from "./index";

const root = document.documentElement;

const Glyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

/** A formatting toolbar: two toggles, a groove, a button, a disabled button, a link, a field. */
function Editor(props: Partial<Toolbar.ToolbarRootProps>) {
  return (
    <Toolbar.Root aria-label="Formatting" {...props}>
      <Toolbar.Group aria-label="Text">
        <Toolbar.Button render={<Toggle />} aria-label="Bold" startIcon={<Glyph />} />
        <Toolbar.Button
          render={<Toggle defaultPressed />}
          aria-label="Italic"
          startIcon={<Glyph />}
        />
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Button startIcon={<Glyph />}>Share</Toolbar.Button>
      <Toolbar.Button disabled>Redo</Toolbar.Button>
      <Toolbar.Link href="#help">Help</Toolbar.Link>
      <Toolbar.Input aria-label="Search" placeholder="Search" />
    </Toolbar.Root>
  );
}

async function mount(ui: ReactNode = <Editor />) {
  const screen = await render(ui);
  const q = <T extends HTMLElement>(selector: string) => {
    const el = screen.container.querySelector<T>(selector);
    if (!el) throw new Error(`no ${selector}`);
    return el;
  };
  return { screen, q };
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

/** Parks the pointer in the bottom corner, off any item an earlier test left it over. */
async function pointerAway() {
  const spot = document.createElement("span");
  spot.style.cssText = "position:fixed;inset:auto 0 0 auto;inline-size:4px;block-size:4px";
  document.body.append(spot);
  await userEvent.hover(spot);
  spot.remove();
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const focused = () => document.activeElement?.textContent || document.activeElement?.ariaLabel;

describe("Toolbar", () => {
  test("is Base UI's toolbar, with its roles", async () => {
    const { screen, q } = await mount();
    const bar = q(".ow-toolbar");
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect(bar.getAttribute("aria-orientation")).toBe("horizontal");
    expect(bar.getAttribute("aria-label")).toBe("Formatting");
    expect(q(".ow-toolbar-group").getAttribute("role")).toBe("group");
    const groove = q(".ow-toolbar-separator");
    expect(groove.getAttribute("role")).toBe("separator");
    expect(groove.getAttribute("aria-orientation")).toBe("vertical");
    expect(q(".ow-toolbar-link").tagName).toBe("A");
    expect(q(".ow-toolbar-input").tagName).toBe("INPUT");
    expect(screen.container.querySelectorAll('[aria-pressed="true"]').length).toBe(1);
  });

  test("is one Tab stop; arrow keys move through the items and wrap around", async () => {
    await mount();
    await userEvent.tab();
    expect(focused()).toBe("Bold");
    const order = ["Italic", "Share", "Redo", "Help"];
    for (const name of order) {
      await userEvent.keyboard("{ArrowRight}");
      // A disabled button stays focusable by default, so it can be found.
      expect(focused()).toBe(name);
    }
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Search");
    // The empty field hands arrows on: past the end, focus wraps to the start.
    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe("Bold");
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Search");
    // Tab leaves the toolbar, and Tab back lands on the last item used.
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(document.body);
    await userEvent.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Search");
  });

  test("a vertical toolbar moves with Up and Down, its grooves across it", async () => {
    const { q } = await mount(<Editor orientation="vertical" />);
    expect(q(".ow-toolbar-separator").getAttribute("aria-orientation")).toBe("horizontal");
    expect(getComputedStyle(q(".ow-toolbar")).flexDirection).toBe("column");
    expect(getComputedStyle(q(".ow-toolbar-group")).flexDirection).toBe("column");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("Italic");
  });

  test("an item rendered as a Toggle is both: it toggles and keeps Toggle's look", async () => {
    const { q } = await mount();
    await pointerAway();
    const bold = q<HTMLButtonElement>('[aria-label="Bold"]');
    expect(bold.className).toBe("ow-toggle ow-toolbar-button");
    expect(bold.dataset.size).toBe("md");
    expect(bold.hasAttribute("data-icon-only")).toBe(true);
    await userEvent.click(bold);
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    // Clicked, it is still under the pointer: the raised key, tinted, never the item's hover tint.
    const style = getComputedStyle(bold);
    expect(style.backgroundColor).toBe(
      resolve("color", "color-mix(in oklab, var(--ow-raised-bg), var(--ow-fg) 4%)"),
    );
    expect(style.boxShadow).toBe(resolve("box-shadow", "var(--ow-raised-shadow)"));
    await pointerAway();
    expect(getComputedStyle(bold).backgroundColor).toBe(resolve("color", "var(--ow-raised-bg)"));
  });

  test("items take the toolbar's size unless they set their own (FR-3)", async () => {
    const { screen } = await mount(
      <Toolbar.Root aria-label="Small" size="sm">
        <Toolbar.Button>Inherit</Toolbar.Button>
        <Toolbar.Button size="lg">Own</Toolbar.Button>
        <Toolbar.Button render={<Toggle />}>Toggle</Toolbar.Button>
        <Toolbar.Button render={<Toggle size="lg" />}>Own toggle</Toolbar.Button>
        <Toolbar.Input aria-label="Field" />
      </Toolbar.Root>,
    );
    const sizes = [...screen.container.querySelectorAll<HTMLElement>("[data-size]")].map(
      (el) => el.dataset.size,
    );
    expect(sizes).toEqual(["sm", "sm", "lg", "sm", "lg", "sm"]);
  });

  test("passes className, style, render, and ref through every part (FR-2, FR-5)", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      group: createRef<HTMLDivElement>(),
      button: createRef<HTMLButtonElement>(),
      link: createRef<HTMLAnchorElement>(),
      input: createRef<HTMLInputElement>(),
      separator: createRef<HTMLDivElement>(),
    };
    const { q } = await mount(
      <Toolbar.Root ref={refs.root} className="r" style={{ marginBlock: "1px" }} aria-label="All">
        <Toolbar.Group ref={refs.group} className={() => "g"}>
          <Toolbar.Button ref={refs.button} className="b">
            B
          </Toolbar.Button>
        </Toolbar.Group>
        <Toolbar.Separator ref={refs.separator} className="s" />
        <Toolbar.Link ref={refs.link} className="l" render={<a href="#l" data-router="" />}>
          L
        </Toolbar.Link>
        <Toolbar.Input ref={refs.input} className="i" aria-label="I" />
      </Toolbar.Root>,
    );
    expect(refs.root.current).toBe(q(".ow-toolbar"));
    expect(refs.root.current?.className).toBe("ow-toolbar r");
    expect(refs.root.current?.style.marginBlock).toBe("1px");
    expect(refs.group.current?.className).toBe("ow-toolbar-group g");
    expect(refs.button.current?.className).toBe("ow-toolbar-button b");
    expect(refs.separator.current?.className).toBe("ow-toolbar-separator s");
    expect(refs.link.current?.className).toBe("ow-toolbar-link l");
    expect(refs.link.current?.hasAttribute("data-router")).toBe(true);
    expect(refs.input.current?.className).toBe("ow-toolbar-input i");
  });

  test("sits on the panel, its buttons quiet until hovered, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { q } = await mount();
    await pointerAway();
    const bar = q(".ow-toolbar");
    const share = q<HTMLButtonElement>(".ow-toolbar-button:not(.ow-toggle)");
    const field = q(".ow-toolbar-input");
    const groove = q(".ow-toolbar-separator");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(getComputedStyle(bar).backgroundColor).toBe(resolve("color", "var(--ow-panel)"));
      expect(getComputedStyle(bar).boxShadow).toBe(resolve("box-shadow", "var(--ow-panel-shadow)"));
      expect(getComputedStyle(share).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(getComputedStyle(share).color).toBe(resolve("color", "var(--ow-muted)"));
      expect(getComputedStyle(field).backgroundColor).toBe(resolve("color", "var(--ow-well-bg)"));
      // A flat well with a crisp 3:1 edge (DP-6).
      expect(getComputedStyle(field).boxShadow).toBe(
        resolve("box-shadow", "inset 0 0 0 1px var(--ow-edge), var(--ow-well-shadow)"),
      );
      expect(getComputedStyle(groove).borderInlineStartColor).toBe(
        resolve("color", "var(--ow-line-dark)"),
      );
      expect(getComputedStyle(groove).borderInlineEndColor).toBe(
        resolve("color", "var(--ow-line-light)"),
      );
    }
    await userEvent.hover(share);
    expect(getComputedStyle(share).backgroundColor).toBe(resolve("color", "var(--ow-hover)"));
    expect(getComputedStyle(share).color).toBe(resolve("color", "var(--ow-fg)"));
  });

  test("a press goes in to 0.97 in the pressed material, then lets go (DP-4)", async () => {
    const { q } = await mount();
    const share = q<HTMLButtonElement>(".ow-toolbar-button:not(.ow-toggle)");
    await userEvent.hover(share);
    await commands.mouse("down");
    await wait(150);
    expect(getComputedStyle(share).transform).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    expect(getComputedStyle(share).backgroundColor).toBe(resolve("color", "var(--ow-pressed-bg)"));
    expect(getComputedStyle(share).boxShadow).toBe(
      resolve("box-shadow", "var(--ow-pressed-shadow)"),
    );
    await commands.mouse("up");
    expect(getComputedStyle(share).transitionDuration).toBe("1.03s");
    await settle();
    expect(getComputedStyle(share).transform).toBe("none");
  });

  test("under reduced motion a press changes the material only (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { q } = await mount();
    const share = q<HTMLButtonElement>(".ow-toolbar-button:not(.ow-toggle)");
    await userEvent.hover(share);
    await commands.mouse("down");
    await wait(150);
    expect(getComputedStyle(share).transform).toBe("none");
    expect(getComputedStyle(share).backgroundColor).toBe(resolve("color", "var(--ow-pressed-bg)"));
    await commands.mouse("up");
  });

  test("shows a 2px focus ring 2px out on every item (FR-13)", async () => {
    await mount();
    await userEvent.tab();
    for (const key of ["", "{ArrowRight}{ArrowRight}", "{ArrowLeft}{ArrowLeft}{ArrowLeft}"]) {
      if (key) await userEvent.keyboard(key);
      const style = getComputedStyle(document.activeElement as Element);
      expect(style.outlineStyle).toBe("solid");
      expect(style.outlineWidth).toBe("2px");
      expect(style.outlineOffset).toBe("2px");
      expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
    }
  });

  test("a disabled item dims and ignores presses", async () => {
    let clicks = 0;
    const { q } = await mount(
      <Toolbar.Root aria-label="Disabled">
        <Toolbar.Button disabled onClick={() => clicks++}>
          Redo
        </Toolbar.Button>
      </Toolbar.Root>,
    );
    const redo = q<HTMLButtonElement>(".ow-toolbar-button");
    expect(redo.getAttribute("aria-disabled")).toBe("true");
    expect(getComputedStyle(redo).opacity).toBe("0.45");
    await userEvent.click(redo, { force: true });
    expect(clicks).toBe(0);
  });

  test("component tokens override the theme tokens", async () => {
    const tokens = {
      "--ow-toolbar-bg": "rgb(1, 2, 3)",
      "--ow-toolbar-shadow": "none",
      "--ow-toolbar-button-fg": "rgb(4, 5, 6)",
      "--ow-toolbar-input-bg": "rgb(7, 8, 9)",
      "--ow-toolbar-line-dark": "rgb(255, 0, 0)",
    } as CSSProperties;
    const { q } = await mount(
      <div style={tokens}>
        <Editor />
      </div>,
    );
    await pointerAway();
    expect(getComputedStyle(q(".ow-toolbar")).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(q(".ow-toolbar")).boxShadow).toBe("none");
    expect(getComputedStyle(q(".ow-toolbar-button:not(.ow-toggle)")).color).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(q(".ow-toolbar-input")).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(q(".ow-toolbar-separator")).borderInlineStartColor).toBe(
      "rgb(255, 0, 0)",
    );
  });

  test("keeps its edges, items, and grooves in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { q } = await mount();
    await commands.setForcedColors("active");
    for (const selector of [
      ".ow-toolbar",
      ".ow-toolbar-button:not(.ow-toggle)",
      ".ow-toolbar-input",
    ]) {
      const style = getComputedStyle(q(selector));
      expect(style.outlineStyle, selector).toBe("solid");
      expect(style.outlineWidth, selector).toBe("1px");
      expect(style.outlineColor, selector).not.toBe("rgba(0, 0, 0, 0)");
    }
    const groove = getComputedStyle(q(".ow-toolbar-separator"));
    expect(groove.borderInlineStartWidth).toBe("1px");
    expect(groove.borderInlineStartColor).not.toBe(getComputedStyle(document.body).backgroundColor);
  });

  test("follows the text direction (FR-16)", async () => {
    const { q } = await mount(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Editor />
        </div>
      </DirectionProvider>,
    );
    const share = q(".ow-toolbar-button:not(.ow-toggle)");
    const glyph = share.querySelector(".ow-toolbar-icon");
    if (!glyph) throw new Error("no icon");
    // The start icon sits on the right, and Left moves on toward the end.
    expect(share.getBoundingClientRect().right - glyph.getBoundingClientRect().right).toBeLessThan(
      glyph.getBoundingClientRect().left - share.getBoundingClientRect().left,
    );
    expect(q('[aria-label="Italic"]').getBoundingClientRect().right).toBeLessThan(
      q('[aria-label="Bold"]').getBoundingClientRect().left,
    );
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe("Italic");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { screen } = await mount(
      <main>
        <Editor />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await mount();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
