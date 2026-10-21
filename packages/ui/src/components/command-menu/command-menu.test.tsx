import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { CommandMenu, type CommandMenuRootProps } from "./index";

interface Command {
  value: string;
  label: string;
  description?: string;
  shortcut?: string;
  disabled?: boolean;
}

const GROUPS = [
  {
    value: "Pages",
    items: [
      { value: "home", label: "Home", description: "Start here" },
      { value: "settings", label: "Settings", description: "Profile and billing" },
    ],
  },
  {
    value: "Actions",
    items: [
      { value: "new", label: "New file", shortcut: "⌘N" },
      { value: "theme", label: "Toggle dark mode" },
      { value: "archive", label: "Archive", disabled: true },
    ],
  },
] satisfies { value: string; items: Command[] }[];

const root = document.documentElement;

function Menu({
  ran = [],
  children,
  popupStyle,
  ...props
}: Partial<CommandMenuRootProps<Command>> & {
  ran?: string[];
  children?: ReactNode;
  popupStyle?: CSSProperties;
}) {
  return (
    <CommandMenu.Root items={GROUPS} {...props}>
      <CommandMenu.Trigger>
        Search…<CommandMenu.Shortcut aria-hidden="true">⌘K</CommandMenu.Shortcut>
      </CommandMenu.Trigger>
      {children}
      <CommandMenu.Popup aria-label="Commands" style={popupStyle}>
        <CommandMenu.Input aria-label="Search commands" placeholder="Search…" />
        <CommandMenu.Empty>No results</CommandMenu.Empty>
        <CommandMenu.List>
          {(group: (typeof GROUPS)[number]) => (
            <CommandMenu.Group key={group.value} items={group.items}>
              <CommandMenu.GroupLabel>{group.value}</CommandMenu.GroupLabel>
              <CommandMenu.Collection>
                {(item: Command) => (
                  <CommandMenu.Item
                    key={item.value}
                    value={item}
                    disabled={item.disabled}
                    onClick={() => ran.push(item.value)}
                  >
                    <CommandMenu.ItemIcon>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                    </CommandMenu.ItemIcon>
                    <CommandMenu.ItemLabel>{item.label}</CommandMenu.ItemLabel>
                    {item.description ? (
                      <CommandMenu.ItemDescription>{item.description}</CommandMenu.ItemDescription>
                    ) : null}
                    {item.shortcut ? (
                      <CommandMenu.Shortcut>{item.shortcut}</CommandMenu.Shortcut>
                    ) : null}
                  </CommandMenu.Item>
                )}
              </CommandMenu.Collection>
            </CommandMenu.Group>
          )}
        </CommandMenu.List>
        <CommandMenu.Footer>
          <span>
            <CommandMenu.Shortcut>↵</CommandMenu.Shortcut> Run
          </span>
        </CommandMenu.Footer>
      </CommandMenu.Popup>
    </CommandMenu.Root>
  );
}

const popup = () => document.querySelector<HTMLElement>(".ow-command-menu-popup");
const input = () => document.querySelector<HTMLInputElement>(".ow-command-menu-input");
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const option = (name: string) => {
  const el = options().find((o) => o.textContent?.includes(name));
  if (!el) throw new Error(`no option ${name}`);
  return el;
};
const highlighted = () => document.querySelector<HTMLElement>("[data-highlighted]");
const glide = () => document.querySelector<HTMLElement>(".ow-command-menu-list > .ow-glide");

async function open() {
  const trigger = document.querySelector<HTMLElement>(".ow-command-menu-trigger");
  trigger?.click();
  await expect.poll(() => input() !== null && document.activeElement === input()).toBe(true);
}

/** Resolves a color to its computed rgb() inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Resolves a box-shadow to its computed value inside `scope`. */
function resolveShadow(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.boxShadow = value;
  scope.append(probe);
  const shadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  return shadow;
}

/** Paints `colors` in order on one pixel: a translucent layer over what is under it. */
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

const listGroups = () => [...document.querySelectorAll('[role="listbox"] [role="group"]')];
const type = async (text: string) => {
  await userEvent.keyboard(text);
};

describe("Command Menu", () => {
  test("opens from its trigger as a dialog with a combobox and a grouped listbox", async () => {
    await render(<Menu />);
    expect(popup()).toBeNull();
    await open();
    const dialog = popup();
    expect(dialog?.getAttribute("role")).toBe("dialog");
    expect(dialog?.getAttribute("aria-label")).toBe("Commands");
    expect(input()?.getAttribute("role")).toBe("combobox");
    const listbox = document.querySelector('[role="listbox"]');
    expect(listbox?.classList.contains("ow-command-menu-list")).toBe(true);
    expect(input()?.getAttribute("aria-controls")).toBe(listbox?.id);
    const groups = listGroups();
    expect(groups.length).toBe(2);
    const label = document.getElementById(groups[0]?.getAttribute("aria-labelledby") ?? "");
    expect(label?.textContent).toBe("Pages");
    expect(
      options().map((o) => o.querySelector(".ow-command-menu-item-label")?.textContent),
    ).toEqual(["Home", "Settings", "New file", "Toggle dark mode", "Archive"]);
    expect(option("Archive").getAttribute("aria-disabled")).toBe("true");
    // Decorative parts stay out of the accessibility tree.
    expect(glide()?.getAttribute("aria-hidden")).toBe("true");
    expect(document.querySelector(".ow-command-menu-item-icon")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  test("⌘K and Ctrl K open and close it; a key handled elsewhere does not", async () => {
    await render(<Menu />);
    const trigger = document.querySelector(".ow-command-menu-trigger");
    expect(trigger?.getAttribute("aria-keyshortcuts")).toBe("Meta+K Control+K");
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await expect.poll(popup).not.toBeNull();
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await expect.poll(popup).toBeNull();
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect.poll(popup).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await expect.poll(popup).toBeNull();

    const stop = (event: KeyboardEvent) => event.preventDefault();
    document.body.addEventListener("keydown", stop);
    onTestFinished(() => document.body.removeEventListener("keydown", stop));
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(popup()).toBeNull();
  });

  test("shortcut picks another key, or none", async () => {
    const screen = await render(<Menu shortcut="j" />);
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(popup()).toBeNull();
    await userEvent.keyboard("{Control>}j{/Control}");
    await expect.poll(popup).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await expect.poll(popup).toBeNull();

    screen.rerender(<Menu shortcut={false} />);
    const trigger = document.querySelector(".ow-command-menu-trigger");
    await expect.poll(() => trigger?.hasAttribute("aria-keyshortcuts")).toBe(false);
    await userEvent.keyboard("{Control>}j{/Control}");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(popup()).toBeNull();
  });

  test("the shortcut asks a controlled Root to open (FR-4)", async () => {
    const changes: boolean[] = [];
    const screen = await render(<Menu open={false} onOpenChange={(open) => changes.push(open)} />);
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await expect.poll(() => changes).toEqual([true]);
    expect(popup()).toBeNull();
    screen.rerender(<Menu open onOpenChange={(open) => changes.push(open)} />);
    await expect.poll(popup).not.toBeNull();
  });

  test("a handle opens it from a trigger outside Root, or from anywhere", async () => {
    const handle = CommandMenu.createHandle();
    await render(
      <>
        <CommandMenu.Trigger handle={handle} id="outside">
          Search
        </CommandMenu.Trigger>
        <Menu handle={handle} shortcut={false} />
      </>,
    );
    const outside = document.getElementById("outside") as HTMLElement;
    expect(outside.hasAttribute("aria-keyshortcuts")).toBe(false);
    await userEvent.click(outside);
    await expect.poll(() => input() !== null && document.activeElement === input()).toBe(true);
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => document.activeElement).toBe(outside);
    handle.open(null);
    await expect.poll(popup).not.toBeNull();
    handle.close();
    await expect.poll(popup).toBeNull();
  });

  test("the first item is lit; arrows move the highlight and Glide follows; Enter runs it", async () => {
    const ran: string[] = [];
    await render(<Menu ran={ran} />);
    await open();
    await expect.poll(highlighted).toBe(option("Home"));
    const highlight = glide();
    await expect.poll(() => highlight?.hasAttribute("data-visible")).toBe(true);
    expect(option("Home").hasAttribute("data-glide-active")).toBe(true);

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect.poll(highlighted).toBe(option("New file"));
    await expect.poll(() => option("New file").hasAttribute("data-glide-active")).toBe(true);
    // The highlight travels by transform, inside the list, to the item's offset in it.
    const list = document.querySelector<HTMLElement>(".ow-command-menu-list");
    expect(list?.contains(highlight ?? null)).toBe(true);
    const y = Number.parseFloat(highlight?.style.getPropertyValue("--_y") ?? "");
    expect(y).toBeCloseTo(option("New file").offsetTop, 0);
    expect(getComputedStyle(highlight as Element).transitionProperty).toContain("transform");

    // Base UI lets the keyboard reach a disabled item, so it can be read; Enter does nothing there.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect.poll(highlighted).toBe(option("Archive"));
    await userEvent.keyboard("{Enter}");
    expect(ran).toEqual([]);
    expect(popup()).not.toBeNull();

    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(ran).toEqual(["theme"]);
    await expect.poll(popup).toBeNull();
  });

  test("the pointer lights the item under it, and the light stays when the pointer leaves", async () => {
    await render(<Menu />);
    await open();
    const settings = option("Settings");
    await userEvent.hover(settings);
    await expect.poll(highlighted).toBe(settings);
    await expect.poll(() => settings.hasAttribute("data-glide-active")).toBe(true);
    await userEvent.hover(document.querySelector(".ow-command-menu-field") as Element);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(highlighted()).toBe(settings);
    expect(glide()?.hasAttribute("data-visible")).toBe(true);
  });

  test("a click runs an item and closes the menu, unless closeOnClick is false", async () => {
    const ran: string[] = [];
    const screen = await render(<Menu ran={ran} />);
    await open();
    await userEvent.click(option("Settings"));
    expect(ran).toEqual(["settings"]);
    await expect.poll(popup).toBeNull();

    screen.rerender(
      <CommandMenu.Root items={GROUPS} defaultOpen>
        <CommandMenu.Popup aria-label="Commands">
          <CommandMenu.Input aria-label="Search commands" />
          <CommandMenu.List>
            {(group: (typeof GROUPS)[number]) => (
              <CommandMenu.Group key={group.value} items={group.items}>
                <CommandMenu.Collection>
                  {(item: Command) => (
                    <CommandMenu.Item
                      key={item.value}
                      value={item}
                      closeOnClick={false}
                      onClick={() => ran.push(item.value)}
                    >
                      {item.label}
                    </CommandMenu.Item>
                  )}
                </CommandMenu.Collection>
              </CommandMenu.Group>
            )}
          </CommandMenu.List>
        </CommandMenu.Popup>
      </CommandMenu.Root>,
    );
    await expect.poll(popup).not.toBeNull();
    await userEvent.click(option("Home"));
    expect(ran).toEqual(["settings", "home"]);
    expect(popup()).not.toBeNull();
  });

  test("typing filters the items and their groups; nothing found shows Empty", async () => {
    await render(<Menu />);
    await open();
    await type("dark");
    await expect
      .poll(() => options().map((o) => o.querySelector(".ow-command-menu-item-label")?.textContent))
      .toEqual(["Toggle dark mode"]);
    expect(listGroups().length).toBe(1);
    await expect.poll(highlighted).toBe(option("Toggle dark mode"));
    await expect
      .poll(() => option("Toggle dark mode").hasAttribute("data-glide-active"))
      .toBe(true);
    const empty = document.querySelector(".ow-command-menu-empty");
    expect(empty?.textContent).toBe("");

    await type("zzz");
    await expect.poll(() => empty?.textContent).toBe("No results");
    expect(options()).toEqual([]);
    const list = document.querySelector<HTMLElement>(".ow-command-menu-list");
    expect(list?.hasAttribute("data-empty")).toBe(true);
    expect(getComputedStyle(list as Element).display).toBe("none");
    await expect.poll(() => glide()?.hasAttribute("data-visible")).toBe(false);

    await userEvent.clear(input() as HTMLInputElement);
    await expect.poll(() => options().length).toBe(5);
    await expect.poll(highlighted).toBe(option("Home"));
  });

  test("filteredItems takes the order and the matches from the app", async () => {
    const actions = GROUPS[1];
    if (!actions) throw new Error("no group");
    await render(
      <Menu defaultOpen filteredItems={[{ ...actions, items: actions.items.slice(1, 2) }]} />,
    );
    await expect.poll(() => options().map((o) => o.textContent)).toEqual(["Toggle dark mode"]);
  });

  test("focus returns to the trigger, or to where it was before the shortcut", async () => {
    await render(
      <Menu>
        <button type="button" id="elsewhere">
          Elsewhere
        </button>
      </Menu>,
    );
    const trigger = document.querySelector<HTMLElement>(".ow-command-menu-trigger");
    await userEvent.click(trigger as HTMLElement);
    await expect.poll(() => document.activeElement === input()).toBe(true);
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => document.activeElement).toBe(trigger);

    const elsewhere = document.getElementById("elsewhere");
    elsewhere?.focus();
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await expect.poll(() => input() !== null && document.activeElement === input()).toBe(true);
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => document.activeElement).toBe(elsewhere);
  });

  test("opens and closes at once, with no transition (keyboard-first)", async () => {
    await render(<Menu />);
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await expect.poll(popup).not.toBeNull();
    const backdrop = document.querySelector(".ow-command-menu-backdrop");
    for (const el of [popup(), backdrop]) {
      expect(el && getComputedStyle(el).transitionDuration).toBe("0s");
      expect(el?.getAnimations()).toEqual([]);
    }
    expect(popup()?.hasAttribute("data-starting-style")).toBe(false);
    expect(getComputedStyle(popup() as Element).opacity).toBe("1");
    await userEvent.keyboard("{Escape}");
    // Base UI waits only for running animations; there are none.
    await expect.poll(popup, { timeout: 100 }).toBeNull();
  });

  test("a hidden close button shows when focused, with a label to translate (FR-17)", async () => {
    const screen = await render(<Menu defaultOpen />);
    await expect.poll(popup).not.toBeNull();
    const close = () => document.querySelector<HTMLElement>(".ow-command-menu-close");
    expect(close()?.getAttribute("aria-label")).toBe("Close");
    expect(close()?.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => document.activeElement).toBe(close());
    expect(close()?.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    await userEvent.keyboard("{Enter}");
    await expect.poll(popup).toBeNull();
    // Base UI's own hidden dismiss button (English only) is not rendered inline.
    expect(document.querySelector('[aria-label="Dismiss"]')).toBeNull();

    screen.rerender(
      <CommandMenu.Root defaultOpen>
        <CommandMenu.Popup aria-label="Perintah" closeLabel="Tutup" />
      </CommandMenu.Root>,
    );
    await expect.poll(() => close()?.getAttribute("aria-label")).toBe("Tutup");
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const refs = {
      trigger: createRef<HTMLButtonElement>(),
      popup: createRef<HTMLDivElement>(),
      input: createRef<HTMLInputElement>(),
      list: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
      shortcut: createRef<HTMLElement>(),
    };
    await render(
      <CommandMenu.Root items={["One", "Two"]} defaultOpen>
        <CommandMenu.Trigger ref={refs.trigger} className="mine" style={{ marginBlock: "3px" }}>
          Search
        </CommandMenu.Trigger>
        <CommandMenu.Popup
          ref={refs.popup}
          aria-label="Commands"
          className={(state) => (state.open ? "is-open" : "")}
        >
          <CommandMenu.Input ref={refs.input} aria-label="Search" className="field-mine" />
          <CommandMenu.List ref={refs.list} className="list-mine">
            {(item: string) => (
              <CommandMenu.Item
                key={item}
                value={item}
                ref={item === "One" ? refs.item : undefined}
                render={<a href={`#${item}`} />}
                className={(state) => (state.highlighted ? "lit" : "dim")}
              >
                {item}
                <CommandMenu.Shortcut ref={item === "One" ? refs.shortcut : undefined}>
                  1
                </CommandMenu.Shortcut>
              </CommandMenu.Item>
            )}
          </CommandMenu.List>
        </CommandMenu.Popup>
      </CommandMenu.Root>,
    );
    await expect.poll(() => refs.item.current).not.toBeNull();
    expect(refs.trigger.current?.className).toBe("ow-command-menu-trigger mine");
    expect(refs.trigger.current?.style.marginBlock).toBe("3px");
    expect(refs.popup.current?.className).toBe("ow-command-menu-popup is-open");
    expect(refs.input.current?.className).toBe("ow-command-menu-input field-mine");
    expect(refs.list.current?.className).toBe("ow-command-menu-list list-mine");
    expect(refs.item.current?.tagName).toBe("A");
    await expect.poll(() => refs.item.current?.className).toBe("ow-command-menu-item lit");
    expect(refs.shortcut.current?.tagName).toBe("KBD");
  });

  test("crisp-edged glass, a flat well trigger, and crisp keys, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(<Menu defaultOpen />);
    await expect.poll(popup).not.toBeNull();
    const panel = popup() as HTMLElement;
    const trigger = document.querySelector(".ow-command-menu-trigger") as HTMLElement;
    const key = panel.querySelector(".ow-command-menu-shortcut") as HTMLElement;
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(panel);
      expect(style.backgroundColor).toBe(
        resolveColor("color-mix(in oklab, var(--ow-panel) 80%, transparent)"),
      );
      expect(style.backdropFilter).toBe("blur(24px) saturate(1.6)");
      // The popup material's crisp edge and drop shadow, nothing softer on top.
      expect(style.boxShadow).toBe(resolveShadow("var(--ow-popup-shadow)"));
      expect(getComputedStyle(panel, "::before").content).toBe("none");
      expect(getComputedStyle(panel, "::after").content).toBe("none");
      expect(style.color).toBe(resolveColor("var(--ow-fg)"));
      expect(getComputedStyle(trigger).backgroundColor).toBe(resolveColor("var(--ow-well-bg)"));
      expect(getComputedStyle(trigger).boxShadow).toBe(
        resolveShadow("inset 0 0 0 1px var(--ow-edge), var(--ow-well-shadow)"),
      );
      expect(getComputedStyle(key).backgroundColor).toBe(resolveColor("var(--ow-raised-bg)"));
      expect(getComputedStyle(key).boxShadow).toBe(resolveShadow("var(--ow-raised-shadow)"));
    }
  });

  test("the glass turns opaque under prefers-reduced-transparency", async () => {
    onTestFinished(() => commands.setReducedTransparency("no-preference"));
    await commands.setReducedTransparency("reduce");
    expect(matchMedia("(prefers-reduced-transparency: reduce)").matches).toBe(true);
    await render(<Menu defaultOpen />);
    await expect.poll(popup).not.toBeNull();
    const style = getComputedStyle(popup() as Element);
    expect(style.backgroundColor).toBe(resolveColor("var(--ow-panel)"));
    expect(style.backdropFilter).toBe("none");
    expect(style.boxShadow).toBe(resolveShadow("var(--ow-popup-shadow)"));
  });

  test("component tokens override the theme tokens", async () => {
    await render(
      <Menu
        defaultOpen
        popupStyle={
          {
            "--ow-command-menu-bg": "rgb(255, 0, 0)",
            "--ow-command-menu-width": "400px",
            "--ow-command-menu-blur": "8px",
            "--ow-command-menu-shadow": "none",
          } as CSSProperties
        }
      />,
    );
    await expect.poll(popup).not.toBeNull();
    const style = getComputedStyle(popup() as Element);
    expect(style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(style.backdropFilter).toBe("blur(8px) saturate(1.6)");
    expect(style.boxShadow).toBe("none");
    expect((popup() as HTMLElement).getBoundingClientRect().width).toBe(400);
  });

  test("keeps its shapes in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Menu defaultOpen />);
    await expect.poll(() => glide()?.hasAttribute("data-visible")).toBe(true);
    await commands.setForcedColors("active");
    const canvasText = resolveColor("CanvasText");
    for (const selector of [
      ".ow-command-menu-popup",
      ".ow-command-menu-trigger",
      ".ow-command-menu-shortcut",
    ]) {
      const style = getComputedStyle(document.querySelector(selector) as Element);
      expect(style.outlineStyle, selector).toBe("solid");
      expect(style.outlineWidth, selector).toBe("1px");
      expect(style.outlineColor, selector).toBe(canvasText);
    }
    const highlight = getComputedStyle(glide() as Element);
    expect(highlight.outlineColor).toBe(resolveColor("Highlight"));
    expect(getComputedStyle(option("Archive")).color).toBe(resolveColor("GrayText"));
  });

  test("lays out right to left with DirectionProvider (FR-16)", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Menu defaultOpen />
        </div>
      </DirectionProvider>,
    );
    await expect.poll(popup).not.toBeNull();
    expect(document.querySelector(".ow-command-menu-viewport")?.getAttribute("dir")).toBe("rtl");
    const item = option("New file");
    const label = item.querySelector(".ow-command-menu-item-label")?.getBoundingClientRect();
    const icon = item.querySelector(".ow-command-menu-item-icon")?.getBoundingClientRect();
    const keys = item.querySelector(".ow-command-menu-shortcut")?.getBoundingClientRect();
    if (!label || !icon || !keys) throw new Error("no parts");
    expect(icon.left).toBeGreaterThan(label.right);
    expect(keys.right).toBeLessThan(label.left);
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <h1>App</h1>
        <Menu defaultOpen />
      </main>,
    );
    await expect.poll(() => glide()?.hasAttribute("data-visible")).toBe(true);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await settle();
      // axe cannot see through the glass, so check its text here, over the page and the scrim.
      const page = getComputedStyle(document.body).backgroundColor;
      const scrim = getComputedStyle(
        document.querySelector(".ow-command-menu-backdrop") as Element,
      ).backgroundColor;
      const glass = getComputedStyle(popup() as Element).backgroundColor;
      const surface = composite(page, scrim, glass);
      const lit = composite(
        page,
        scrim,
        glass,
        getComputedStyle(glide() as Element).backgroundColor,
      );
      const fg = composite(page, scrim, glass, getComputedStyle(popup() as Element).color);
      const muted = composite(
        page,
        scrim,
        glass,
        getComputedStyle(document.querySelector(".ow-command-menu-group-label") as Element).color,
      );
      expect(contrast(fg, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(fg, lit)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(muted, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(muted, lit)).toBeGreaterThanOrEqual(4.5);
      const report = await axeReport(document.body);
      expect(report.violations).toEqual([]);
      // Whatever axe could not measure sits on the glass, checked above.
      for (const target of report.contrastUnknown) {
        expect(
          popup()?.querySelector(target) ??
            document.querySelector(target)?.closest(".ow-command-menu-popup"),
        ).toBeTruthy();
      }
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await render(<Menu />);
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await expect.poll(popup).not.toBeNull();
    await userEvent.keyboard("{ArrowDown}");
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("under reduced motion the highlight fades but does not travel (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    await render(<Menu defaultOpen />);
    await expect.poll(() => glide()?.hasAttribute("data-visible")).toBe(true);
    expect(getComputedStyle(glide() as Element).transitionProperty).toBe("opacity");
  });
});
