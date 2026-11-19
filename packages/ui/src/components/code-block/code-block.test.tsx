import { type CSSProperties, createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { CodeBlock } from "./index";

const root = document.documentElement;

function Glyph({ name }: { name: string }) {
  return (
    <svg data-icon={name} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

// biome-ignore lint/suspicious/noTemplateCurlyInString: the code shown in the block
const GREET = "export function greet(name: string) {\n  return `Hello, ${name}!`;\n}";
const SNIPPETS = {
  pnpm: "pnpm add owsem-ui",
  npm: "npm install owsem-ui",
  yarn: "yarn add owsem-ui",
} as const;
type Pm = keyof typeof SNIPPETS;

function Single({ code = GREET, style }: { code?: string; style?: CSSProperties }) {
  return (
    <CodeBlock.Root style={{ inlineSize: 420, ...style }}>
      <CodeBlock.Header>
        <CodeBlock.Title icon={<Glyph key="ts" name="ts" />}>greet.ts</CodeBlock.Title>
        <CodeBlock.Copy />
      </CodeBlock.Header>
      <CodeBlock.Panel>
        <pre>
          <code>{code}</code>
        </pre>
      </CodeBlock.Panel>
    </CodeBlock.Root>
  );
}

function Tabbed(props: { value?: Pm; onValueChange?: (value: Pm) => void; copy?: string }) {
  return (
    <CodeBlock.Root
      style={{ inlineSize: 420 }}
      defaultValue={props.value === undefined ? "pnpm" : undefined}
      value={props.value}
      onValueChange={(value) => props.onValueChange?.(value as Pm)}
    >
      <CodeBlock.Header>
        <CodeBlock.List aria-label="Package manager">
          {(Object.keys(SNIPPETS) as Pm[]).map((pm) => (
            <CodeBlock.Tab key={pm} value={pm} icon={<Glyph name={pm} />}>
              {pm}
            </CodeBlock.Tab>
          ))}
        </CodeBlock.List>
        <CodeBlock.Copy value={props.copy} />
      </CodeBlock.Header>
      {(Object.keys(SNIPPETS) as Pm[]).map((pm) => (
        <CodeBlock.Panel key={pm} value={pm}>
          <pre>
            <code>{SNIPPETS[pm]}</code>
          </pre>
        </CodeBlock.Panel>
      ))}
    </CodeBlock.Root>
  );
}

/** Replaces the Clipboard API for one test. */
function clipboard() {
  const writeText = vi.fn((_text: string) => Promise.resolve());
  const own = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  onTestFinished(() => {
    if (own) Object.defineProperty(navigator, "clipboard", own);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  });
  return writeText;
}

// Two frames: a change after a paint, as a visitor's would be.
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const painted = async () => {
  await frame();
  await frame();
};

function parts(container: Element) {
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => {
    const el = container.querySelector<T>(selector);
    if (!el) throw new Error(`no ${selector}`);
    return el;
  };
  /** The leading icon on show, leaving ones left out. */
  const icon = () =>
    container
      .querySelector(".ow-code-block__icon .ow-icon-morph__item:not([data-ending-style]) svg")
      ?.getAttribute("data-icon");
  return { get, icon };
}

/** Whether the thumb covers the element exactly (within 0.5 px), as drawn now. */
function over(thumb: Element, el: Element): boolean {
  const a = thumb.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return [a.left - b.left, a.top - b.top, a.right - b.right, a.bottom - b.bottom].every(
    (d) => Math.abs(d) <= 0.5,
  );
}

const transitions = (el: Element) =>
  el
    .getAnimations()
    .filter((a): a is CSSTransition => a instanceof CSSTransition)
    .map((a) => a.transitionProperty)
    .sort();

/** Resolves a value of `property` (e.g. a token) to its computed form inside `scope`. */
function resolve(property: string, value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

describe("Code Block", () => {
  test("a single snippet: the icon, its title, Copy as an icon, and the code under them", async () => {
    const screen = await render(<Single />);
    const { get, icon } = parts(screen.container);
    const rootEl = get(".ow-code-block");
    expect(rootEl.tagName).toBe("DIV");
    expect(get(".ow-code-block__header").parentElement).toBe(rootEl);
    expect(get(".ow-code-block__icon").getAttribute("aria-hidden")).toBe("true");
    expect(icon()).toBe("ts");
    expect(get(".ow-code-block__title").textContent).toBe("greet.ts");
    const copy = get(".ow-code-block__copy");
    expect(copy.className).toBe("ow-button ow-copy-button ow-code-block__copy");
    expect([copy.dataset.variant, copy.dataset.size]).toEqual(["ghost", "sm"]);
    // Icon only, named by its label.
    expect(copy.hasAttribute("data-icon-only")).toBe(true);
    expect(copy.getAttribute("aria-label")).toBe("Copy");
    expect(copy.querySelector(".ow-copy-button__label")).toBeNull();
    expect(get(".ow-code-block__panel").parentElement).toBe(rootEl);
    expect(get(".ow-code-block__panel pre").textContent).toBe(GREET);
  });

  test("Copy copies the code on show", async () => {
    const writeText = clipboard();
    const screen = await render(<Single />);
    await userEvent.click(parts(screen.container).get(".ow-code-block__copy"));
    expect(writeText).toHaveBeenCalledWith(GREET);
  });

  test("tabs are Base UI Tabs: a tablist, and the arrow keys pick as they move", async () => {
    const changes: string[] = [];
    const screen = await render(<Tabbed onValueChange={(value) => changes.push(value)} />);
    const list = screen.getByRole("tablist", { name: "Package manager" });
    await expect.element(list).toBeInTheDocument();
    const tabs = screen.getByRole("tab");
    expect(tabs.elements().map((tab) => tab.getAttribute("aria-selected"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    const panel = screen.getByRole("tabpanel");
    await expect.element(panel).toHaveTextContent("pnpm add owsem-ui");
    expect(panel.element().className).toContain("ow-code-block__panel");

    await userEvent.click(tabs.nth(0));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs.nth(1).element());
    await expect.element(screen.getByRole("tabpanel")).toHaveTextContent("npm install owsem-ui");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect.element(screen.getByRole("tabpanel")).toHaveTextContent("pnpm add owsem-ui");
    expect(changes).toEqual(["npm", "yarn", "pnpm"]);
    // The panel left goes at once, though Base UI keeps it a frame: one panel shows. (React
    // renders the click in a microtask, and Base UI drops the old panel in a later frame.)
    (tabs.nth(2).element() as HTMLElement).click();
    await Promise.resolve();
    expect(screen.container.querySelectorAll(".ow-code-block__panel")).toHaveLength(2);
    const shown = [...screen.container.querySelectorAll(".ow-code-block__panel")].filter(
      (el) => getComputedStyle(el).display !== "none",
    );
    expect(shown.map((el) => el.textContent)).toEqual(["yarn add owsem-ui"]);
  });

  test("the leading icon is the active tab's, and morphs into the next one's", async () => {
    const screen = await render(<Tabbed />);
    const { icon } = parts(screen.container);
    expect(icon()).toBe("pnpm");
    await painted();
    await userEvent.click(screen.getByRole("tab", { name: "yarn" }));
    expect(icon()).toBe("yarn");
    const items = screen.container.querySelectorAll(".ow-code-block__icon .ow-icon-morph__item");
    expect(items.length).toBe(2);
    expect(items[0]?.hasAttribute("data-ending-style")).toBe(true);
    await settle();
    await expect
      .poll(() => screen.container.querySelectorAll(".ow-code-block__icon .ow-icon-morph__item"))
      .toHaveLength(1);
  });

  test("tabs whose icons share a key keep the one icon still", async () => {
    const screen = await render(
      <CodeBlock.Root defaultValue="pnpm">
        <CodeBlock.Header>
          <CodeBlock.List aria-label="Package manager">
            {(Object.keys(SNIPPETS) as Pm[]).map((pm) => (
              <CodeBlock.Tab key={pm} value={pm} icon={<Glyph key="terminal" name="terminal" />}>
                {pm}
              </CodeBlock.Tab>
            ))}
          </CodeBlock.List>
        </CodeBlock.Header>
      </CodeBlock.Root>,
    );
    await painted();
    const item = screen.container.querySelector(".ow-icon-morph__item");
    await userEvent.click(screen.getByRole("tab", { name: "npm" }));
    const items = screen.container.querySelectorAll(".ow-icon-morph__item");
    expect([...items]).toEqual([item]);
    expect(item?.getAnimations()).toEqual([]);
  });

  test("controlled, it follows its value", async () => {
    const screen = await render(<Tabbed value="npm" />);
    const { icon } = parts(screen.container);
    expect(icon()).toBe("npm");
    await expect.element(screen.getByRole("tabpanel")).toHaveTextContent("npm install owsem-ui");
    await screen.rerender(<Tabbed value="yarn" />);
    expect(icon()).toBe("yarn");
    await expect.element(screen.getByRole("tabpanel")).toHaveTextContent("yarn add owsem-ui");
  });

  test("Copy copies the active snippet, or its own value", async () => {
    const writeText = clipboard();
    const screen = await render(<Tabbed />);
    await userEvent.click(screen.getByRole("tab", { name: "npm" }));
    await userEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect(writeText).toHaveBeenLastCalledWith("npm install owsem-ui");
    await screen.rerender(<Tabbed copy="npx owsem add" />);
    await userEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect(writeText).toHaveBeenLastCalledWith("npx owsem add");
  });

  test("renders on the server with the default tab's icon and code", () => {
    const html = renderToString(<Tabbed />);
    expect(html).toContain('data-icon="pnpm"');
    expect(html).not.toContain('data-icon="npm"');
    expect(html).toContain("pnpm add owsem-ui");
    expect(html).not.toContain("data-copied");
  });

  test("passes className, style, other props, and refs through", async () => {
    const rootRef = createRef<HTMLDivElement>();
    const panelRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLSpanElement>();
    const screen = await render(
      <CodeBlock.Root ref={rootRef} className="mine" data-test="">
        <CodeBlock.Header className="head">
          <CodeBlock.Title ref={titleRef} id="file">
            a.css
          </CodeBlock.Title>
        </CodeBlock.Header>
        <CodeBlock.Panel ref={panelRef} className="code">
          <pre>a {"{}"}</pre>
        </CodeBlock.Panel>
      </CodeBlock.Root>,
    );
    const rootEl = screen.container.querySelector("[data-test]");
    expect(rootRef.current).toBe(rootEl);
    expect(rootEl?.className).toBe("ow-code-block mine");
    expect(rootEl?.querySelector(".ow-code-block__header")?.className).toBe(
      "ow-code-block__header head",
    );
    expect(titleRef.current?.id).toBe("file");
    expect(panelRef.current?.className).toBe("ow-code-block__panel code");
    // No icon: no slot for one.
    expect(rootEl?.querySelector(".ow-code-block__icon")).toBeNull();
  });

  test("a long line scrolls inside the panel, which the keyboard can then reach, named by the title", async () => {
    const screen = await render(<Single />);
    const { get } = parts(screen.container);
    const panel = get(".ow-code-block__panel");
    expect(panel.hasAttribute("tabindex")).toBe(false);
    await screen.rerender(<Single code={`const line = "${"x".repeat(200)}";`} />);
    await screen.rerender(<Single code={`const line = "${"x".repeat(200)}";`} style={{}} />);
    await expect.poll(() => panel.getAttribute("tabindex")).toBe("0");
    expect(panel.getAttribute("role")).toBe("region");
    expect(panel.getAttribute("aria-labelledby")).toBe(get(".ow-code-block__title").id);
    expect(panel.scrollWidth).toBeGreaterThan(panel.clientWidth);
    // The page does not widen: only the panel scrolls.
    expect(get(".ow-code-block").getBoundingClientRect().width).toBeCloseTo(420, 0);
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(panel);
  });

  test("tabs that do not fit scroll sideways in the header, and the focused one comes in", async () => {
    const screen = await render(
      <CodeBlock.Root defaultValue="a" style={{ inlineSize: 240 }}>
        <CodeBlock.Header>
          <CodeBlock.List aria-label="Files">
            {["a", "b", "c", "d", "e", "f"].map((name) => (
              <CodeBlock.Tab key={name} value={name}>
                {`component-${name}.tsx`}
              </CodeBlock.Tab>
            ))}
          </CodeBlock.List>
          <CodeBlock.Copy />
        </CodeBlock.Header>
        <CodeBlock.Panel value="a">
          <pre>a</pre>
        </CodeBlock.Panel>
      </CodeBlock.Root>,
    );
    const { get } = parts(screen.container);
    const list = get(".ow-code-block__list");
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    const header = get(".ow-code-block__header").getBoundingClientRect();
    const copy = get(".ow-code-block__copy").getBoundingClientRect();
    expect(copy.right).toBeLessThanOrEqual(header.right);
    await userEvent.click(screen.getByRole("tab", { name: "component-a.tsx" }));
    await userEvent.keyboard("{End}");
    await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
    // The thumb scrolls with the tabs, under the active one.
    const last = screen.getByRole("tab", { name: "component-f.tsx" }).element();
    await expect.poll(() => over(get(".ow-code-block__thumb"), last)).toBe(true);
  });

  test("a thumb rests under the active tab from the first paint, and slides to the next", async () => {
    const screen = await render(<Tabbed />);
    const thumb = parts(screen.container).get(".ow-code-block__thumb");
    const tab = (name: Pm) => screen.getByRole("tab", { name }).element();
    expect(thumb.getAttribute("aria-hidden")).toBe("true");
    expect(over(thumb, tab("pnpm"))).toBe(true);
    expect(getComputedStyle(thumb).opacity).toBe("1");
    expect(transitions(thumb)).toEqual([]);
    (tab("yarn") as HTMLElement).click();
    await expect.poll(() => transitions(thumb)).toEqual(["transform", "translate"]);
    expect(over(thumb, tab("yarn"))).toBe(false);
    await settle();
    expect(over(thumb, tab("yarn"))).toBe(true);
  });

  test("reads the theme tokens in light and dark: one panel surface with the surface shadow, and an accent-tint thumb", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(<Tabbed />);
    const { get } = parts(screen.container);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      // Tab text eases to its new color.
      await settle();
      const color = (el: Element) => getComputedStyle(el).backgroundColor;
      const shadow = (el: Element) => getComputedStyle(el).boxShadow;
      expect(color(get(".ow-code-block")), theme).toBe(
        resolve("background-color", "var(--ow-panel)"),
      );
      expect(shadow(get(".ow-code-block")), theme).toBe(
        resolve("box-shadow", "var(--ow-surface-shadow)"),
      );
      // The code sits on the same surface: no fill or edge of its own.
      expect(color(get(".ow-code-block__panel")), theme).toBe("rgba(0, 0, 0, 0)");
      expect(shadow(get(".ow-code-block__panel")), theme).toBe("none");
      expect(color(get(".ow-code-block__header")), theme).toBe("rgba(0, 0, 0, 0)");
      const thumb = get(".ow-code-block__thumb");
      // The key is the thumb's ::before: the accent over the panel.
      expect(getComputedStyle(thumb, "::before").backgroundColor, theme).toBe(
        resolve("background-color", "color-mix(in oklab, var(--ow-accent) 14%, var(--ow-panel))"),
      );
      expect(shadow(thumb), theme).toBe("none");
      const active = get('.ow-code-block__tab[aria-selected="true"]');
      expect(color(active), theme).toBe("rgba(0, 0, 0, 0)");
      expect(getComputedStyle(active).color, theme).toBe(
        resolve("color", "color-mix(in oklab, var(--ow-accent) 70%, var(--ow-fg))"),
      );
      const other = get('.ow-code-block__tab[aria-selected="false"]');
      expect(getComputedStyle(other).color, theme).toBe(resolve("color", "var(--ow-muted)"));
    }
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const screen = await render(
      <div>
        <Single style={{ "--ow-panel": "rgb(255, 0, 0)" } as CSSProperties} />
      </div>,
    );
    const block = parts(screen.container).get(".ow-code-block");
    expect(getComputedStyle(block).backgroundColor).toBe("rgb(255, 0, 0)");
    expect(resolve("background-color", "var(--ow-panel)", screen.container)).not.toBe(
      "rgb(255, 0, 0)",
    );
  });

  test("shows keyboard focus with a 2px ring inside a tab, from the focus token (FR-13)", async () => {
    const screen = await render(<Tabbed />);
    await userEvent.tab();
    const tab = document.activeElement as HTMLElement;
    expect(tab.getAttribute("role")).toBe("tab");
    const style = getComputedStyle(tab);
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual([
      "solid",
      "2px",
      "-2px",
    ]);
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
    expect(screen.container.contains(tab)).toBe(true);
  });

  test("hovering lights a tab with Glide", async () => {
    const screen = await render(<Tabbed />);
    await userEvent.hover(screen.getByRole("tab", { name: "yarn" }));
    await expect
      .poll(() =>
        screen.getByRole("tab", { name: "yarn" }).element().hasAttribute("data-glide-active"),
      )
      .toBe(true);
    expect(screen.container.querySelector(".ow-code-block__list > .ow-glide")).not.toBeNull();
  });

  test("Copy is an icon with a tooltip, on show whether or not the block is hovered", async () => {
    clipboard();
    const screen = await render(
      <>
        <Single />
        <p>Away</p>
      </>,
    );
    const copy = parts(screen.container).get(".ow-code-block__copy");
    const tip = () =>
      document.querySelector(".ow-tooltip__popup .ow-copy-button__tip-text[data-visible]")
        ?.textContent ?? null;
    // The pointer may still rest where an earlier test left it.
    await userEvent.hover(screen.getByText("Away"));
    await expect.poll(tip, { timeout: 1000 }).toBeNull();
    expect(getComputedStyle(copy).opacity).toBe("1");
    expect(getComputedStyle(copy).visibility).toBe("visible");
    await userEvent.hover(copy);
    await expect.poll(tip, { timeout: 2000 }).toBe("Copy");
    await userEvent.click(copy);
    await expect.poll(tip).toBe("Copied");
    // The word on show, when asked for.
    const labelled = await render(
      <CodeBlock.Root>
        <CodeBlock.Header>
          <CodeBlock.Copy showLabel value="x" />
        </CodeBlock.Header>
      </CodeBlock.Root>,
    );
    const word = parts(labelled.container).get(".ow-code-block__copy");
    expect(word.hasAttribute("data-icon-only")).toBe(false);
    expect(word.textContent).toContain("Copy");
  });

  test("right to left, Copy is at the start of the line, on the left", async () => {
    const screen = await render(
      <div dir="rtl">
        <Single />
      </div>,
    );
    const { get } = parts(screen.container);
    const header = get(".ow-code-block__header").getBoundingClientRect();
    const copy = get(".ow-code-block__copy").getBoundingClientRect();
    const icon = get(".ow-code-block__icon").getBoundingClientRect();
    expect(copy.left - header.left).toBeLessThan(10);
    expect(header.right - icon.right).toBeLessThan(10);
  });

  test("stays legible in forced colors: the active tab on a Highlight thumb (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const screen = await render(<Tabbed />);
    await commands.setForcedColors("active");
    await settle();
    const { get } = parts(screen.container);
    const active = get('.ow-code-block__tab[aria-selected="true"]');
    expect(getComputedStyle(get(".ow-code-block__thumb"), "::before").backgroundColor).toBe(
      resolve("color", "Highlight"),
    );
    expect(getComputedStyle(active).color).toBe(resolve("color", "HighlightText"));
  });

  test("has no axe violations in light and dark, a single snippet and tabs", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <div style={{ display: "grid", gap: 16 }}>
        <Single code={`const line = "${"x".repeat(200)}";`} />
        <Tabbed />
      </div>,
    );
    await expect
      .poll(() => screen.container.querySelector('.ow-code-block__panel[role="region"]'))
      .not.toBeNull();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await settle();
      const { violations, contrastUnknown } = await axeReport(screen.container);
      expect(violations, theme).toEqual([]);
      for (const target of contrastUnknown) {
        const el = screen.container.querySelector(target);
        // axe cannot see the Copy Button's face (a pseudo-element); Button's tests check it.
        if (el?.closest(".ow-button")) continue;
        // A long line runs past the block, which does not scroll itself (its panel does), so axe
        // gives up on the code; it reads on the block's fill.
        const block = el?.closest(".ow-code-block");
        expect(el?.closest(".ow-code-block__panel"), target).not.toBeNull();
        if (!el || !block) throw new Error(`no ${target}`);
        const page = getComputedStyle(document.body).backgroundColor;
        const fill = composite(page, getComputedStyle(block).backgroundColor);
        const text = composite(page, getComputedStyle(el).color);
        expect(contrast(text, fill), `${theme} ${target}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test("runs no rAF and no animations when idle, after a tab change too", async () => {
    const screen = await render(<Tabbed />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(screen.getByRole("tab", { name: "npm" }));
    await userEvent.unhover(screen.getByRole("tab", { name: "npm" }));
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  describe("height between snippets", () => {
    const LINES = {
      short: "one",
      tall: "one\ntwo\nthree\nfour\nfive\nsix",
      mid: "one\ntwo\nthree",
    };
    type Key = keyof typeof LINES;

    function Heights({ style }: { style?: CSSProperties }) {
      return (
        <CodeBlock.Root defaultValue="short" style={{ inlineSize: 420, ...style }}>
          <CodeBlock.Header>
            <CodeBlock.List aria-label="Size">
              {(Object.keys(LINES) as Key[]).map((key) => (
                <CodeBlock.Tab key={key} value={key}>
                  {key}
                </CodeBlock.Tab>
              ))}
            </CodeBlock.List>
          </CodeBlock.Header>
          {(Object.keys(LINES) as Key[]).map((key) => (
            <CodeBlock.Panel key={key} value={key}>
              <pre>
                <code>{LINES[key]}</code>
              </pre>
            </CodeBlock.Panel>
          ))}
        </CodeBlock.Root>
      );
    }

    const block = (screen: { container: HTMLElement }) => {
      const el = screen.container.querySelector<HTMLElement>(".ow-code-block");
      if (!el) throw new Error("not mounted");
      return el;
    };
    const keyframes = (animation: Animation | undefined) => {
      if (!(animation?.effect instanceof KeyframeEffect)) throw new Error("no animation");
      return animation.effect.getKeyframes();
    };
    const fadeOf = (el: HTMLElement) =>
      el
        .querySelector<HTMLElement>(".ow-code-block__panel:not([hidden])")
        ?.getAnimations()
        .find((a) => a.effect instanceof KeyframeEffect);
    /** The height animation on the block, if one runs. */
    const heightAnimation = (el: HTMLElement) =>
      el
        .getAnimations()
        .find(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.target === el &&
            animation.effect.getKeyframes().some((frame) => "height" in frame),
        );

    test("the first render does not animate", async () => {
      const screen = await render(<Heights />);
      await settle();
      const el = block(screen);
      expect(el.getAnimations({ subtree: true }).filter((a) => a.playState === "running")).toEqual(
        [],
      );
    });

    test("another snippet eases the height from the old to the new, clipped, and fades the code in", async () => {
      const screen = await render(<Heights />);
      await settle();
      const el = block(screen);
      const from = el.getBoundingClientRect().height;
      await userEvent.click(screen.getByRole("tab", { name: "tall" }));
      const animation = heightAnimation(el);
      expect(animation).toBeDefined();
      const frames = keyframes(animation);
      expect(Number.parseFloat(String(frames[0]?.height))).toBeCloseTo(from, 0);
      expect(Number.parseFloat(String(frames[1]?.height))).toBeGreaterThan(from + 20);
      expect(getComputedStyle(el).overflow).toBe("clip");
      const fade = fadeOf(el);
      expect(fade).toBeDefined();
      expect(keyframes(fade).map((f) => f.opacity)).toEqual(["0", "1"]);
      await animation?.finished;
      // At rest nothing is left over: the height is the layout's again.
      expect(el.getAnimations()).toEqual([]);
      expect(el.getBoundingClientRect().height).toBeGreaterThan(from + 20);
      expect(getComputedStyle(el).overflow).toBe("visible");
    });

    test("rapid switching ends at the height of the last snippet", async () => {
      const screen = await render(<Heights />);
      await settle();
      const el = block(screen);
      for (const name of ["tall", "mid", "short", "tall"]) {
        await userEvent.click(screen.getByRole("tab", { name }));
      }
      await expect.poll(() => el.getAnimations().length, { timeout: 2000 }).toBe(0);
      const header = el.querySelector<HTMLElement>(".ow-code-block__header");
      const panel = el.querySelector<HTMLElement>(".ow-code-block__panel:not([hidden])");
      if (!header || !panel) throw new Error("missing");
      expect(el.getBoundingClientRect().height).toBeCloseTo(
        header.getBoundingClientRect().height + panel.getBoundingClientRect().height,
        0,
      );
    });

    test("with reduced motion the height jumps and the code only fades", async () => {
      onTestFinished(() => commands.setReducedMotion("no-preference"));
      await commands.setReducedMotion("reduce");
      const screen = await render(<Heights />);
      await settle();
      const el = block(screen);
      await userEvent.click(screen.getByRole("tab", { name: "tall" }));
      expect(heightAnimation(el)).toBeUndefined();
      // No rise: the same place at both ends.
      expect(keyframes(fadeOf(el)).map((f) => f.transform)).toEqual([
        "translateY(0px)",
        "translateY(0px)",
      ]);
    });

    test("with the motion scale at 0 nothing animates", async () => {
      const screen = await render(<Heights style={{ "--ow-motion-scale": 0 } as CSSProperties} />);
      await settle();
      const el = block(screen);
      await userEvent.click(screen.getByRole("tab", { name: "tall" }));
      expect(heightAnimation(el)).toBeUndefined();
      expect(fadeOf(el)).toBeUndefined();
    });
  });
});
