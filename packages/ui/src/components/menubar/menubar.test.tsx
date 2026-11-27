import { DirectionProvider } from "@base-ui/react/direction-provider";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Menu } from "../menu";
import { Menubar, type MenubarSize } from "./index";

const root = document.documentElement;

/** File, Edit, and View: the second has a submenu, the third a checkbox. */
function Bar({
  size,
  modal,
  open,
  disabled,
  triggerSize,
}: {
  size?: MenubarSize;
  modal?: boolean;
  open?: "file" | "edit";
  disabled?: boolean;
  triggerSize?: MenubarSize;
}) {
  return (
    <Menubar.Root
      aria-label="Application"
      {...(size ? { size } : {})}
      {...(modal === undefined ? {} : { modal })}
    >
      <Menu.Root {...(open === "file" ? { defaultOpen: true } : {})}>
        <Menubar.Trigger {...(triggerSize ? { size: triggerSize } : {})}>File</Menubar.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="start">
            <Menu.Popup>
              <Menu.Item>New</Menu.Item>
              <Menu.Item>Open</Menu.Item>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger>Export</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.Item>PDF</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Menu.Root {...(open === "edit" ? { defaultOpen: true } : {})}>
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="start">
            <Menu.Popup>
              <Menu.Item>Cut</Menu.Item>
              <Menu.Item>Copy</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Menu.Root>
        <Menubar.Trigger {...(disabled ? { disabled: true } : {})}>View</Menubar.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="start">
            <Menu.Popup>
              <Menu.CheckboxItem defaultChecked>
                <Menu.CheckboxItemIndicator />
                Word wrap
              </Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menubar.Root>
  );
}

const bar = () => document.querySelector<HTMLElement>('[data-slot="menubar"]') as HTMLElement;
const trigger = (name: string) => {
  const el = [...document.querySelectorAll<HTMLElement>('[data-slot="menubar-trigger"]')].find(
    (candidate) => candidate.textContent === name,
  );
  if (!el) throw new Error(`no trigger ${name}`);
  return el;
};
const popups = () => [...document.querySelectorAll<HTMLElement>(".ow-menu__popup")];
const popup = () => popups()[0] ?? null;
const item = (name: string) => {
  const el = [...document.querySelectorAll<HTMLElement>(".ow-menu__item")].find(
    (candidate) => candidate.textContent === name,
  );
  if (!el) throw new Error(`no item ${name}`);
  return el;
};
const gone = () => expect.poll(() => popups().length, { timeout: 1000 }).toBe(0);
const box = (el: Element) => el.getBoundingClientRect();

describe("Menubar", () => {
  test("is Base UI's menubar: one Tab stop, and the arrows move between the triggers", async () => {
    await render(<Bar />);
    expect(bar().getAttribute("role")).toBe("menubar");
    expect(bar().getAttribute("aria-label")).toBe("Application");
    expect(trigger("File").getAttribute("aria-haspopup")).toBe("menu");
    trigger("File").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(trigger("Edit"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(trigger("View"));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(trigger("File"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(trigger("File"));
  });

  test("a trigger opens its menu and stays tinted while it is open; Escape returns focus", async () => {
    await render(<Bar />);
    const before = getComputedStyle(trigger("Edit")).backgroundColor;
    await userEvent.click(trigger("Edit"));
    await expect.poll(popup).not.toBeNull();
    expect(trigger("Edit").getAttribute("aria-expanded")).toBe("true");
    expect(trigger("Edit").hasAttribute("data-popup-open")).toBe(true);
    // Away from the trigger, so only the open state tints it.
    await userEvent.hover(document.body);
    expect(getComputedStyle(trigger("Edit")).backgroundColor).not.toBe(before);
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(trigger("Edit"));
    expect(getComputedStyle(trigger("Edit")).backgroundColor).toBe(before);
  });

  test("with a menu open, the arrows and hover move to the next menu", async () => {
    await render(<Bar />);
    await userEvent.click(trigger("File"));
    await expect.poll(popup).not.toBeNull();
    await userEvent.hover(trigger("Edit"));
    await expect.poll(() => item("Cut").isConnected).toBe(true);
    await expect.poll(() => popups().length).toBe(1);
    expect(trigger("File").hasAttribute("data-popup-open")).toBe(false);
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => item("Word wrap").isConnected).toBe(true);
    await expect.poll(() => popups().length).toBe(1);
  });

  test("the keyboard opens a menu at its first item, and a submenu opens beside its item", async () => {
    await render(<Bar />);
    trigger("File").focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => document.activeElement).toBe(item("New"));
    await userEvent.keyboard("{End}{ArrowRight}");
    await expect.poll(() => document.activeElement).toBe(item("PDF"));
    await settle();
    expect(box(popups()[1] as HTMLElement).left).toBeGreaterThanOrEqual(
      box(popup() as HTMLElement).right - 1,
    );
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(() => document.activeElement).toBe(item("Export"));
  });

  test("its menus are Menu's: the popup, Glide, and the classes", async () => {
    await render(<Bar open="edit" />);
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.className).toBe("ow-menu__popup ow-menu__popup--md");
    await userEvent.hover(item("Copy"));
    await expect
      .poll(() => document.querySelector("[data-glide-active]")?.textContent)
      .toBe("Copy");
  });

  test("a menu in the bar leaves the backdrop and the lock to Base UI, with no warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    onTestFinished(() => warn.mockRestore());
    await render(<Bar open="edit" />);
    await expect.poll(popup).not.toBeNull();
    // Base UI's own backdrop has a cutout over the bar; Menu's clear one is not drawn.
    expect(document.querySelectorAll(".ow-menu__backdrop")).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
    expect(getComputedStyle(root).overflow).not.toBe("hidden");
  });

  test("the bar is a quiet panel; the triggers are ghost buttons, tinted under the pointer", async () => {
    await render(<Bar />);
    const style = getComputedStyle(bar());
    expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.boxShadow).not.toBe("none");
    const edit = trigger("Edit");
    expect(getComputedStyle(edit).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(edit).borderTopWidth).toBe("0px");
    await userEvent.hover(edit);
    await expect.poll(() => getComputedStyle(edit).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("the bar is 32, 40, or 48px tall, and the triggers 24, 32, or 40", async () => {
    for (const [size, barHeight, triggerHeight] of [
      ["sm", 32, 24],
      ["md", 40, 32],
      ["lg", 48, 40],
    ] as const) {
      const screen = await render(<Bar size={size} />);
      expect(box(bar()).height).toBeCloseTo(barHeight, 0);
      expect(box(trigger("Edit")).height).toBeCloseTo(triggerHeight, 0);
      expect(bar().className).toBe(`ow-menubar ow-menubar--${size}`);
      expect(bar().dataset.size).toBe(size);
      await screen.unmount();
    }
  });

  test("a trigger's own size beats the bar's", async () => {
    await render(<Bar size="sm" triggerSize="lg" />);
    expect(trigger("File").dataset.size).toBe("lg");
    expect(box(trigger("File")).height).toBeGreaterThan(box(trigger("Edit")).height);
  });

  test("a trigger's corners are concentric with the bar's, less the 4px padding", async () => {
    await render(<Bar />);
    const radius = Number.parseFloat(getComputedStyle(root).getPropertyValue("--ow-radius").trim());
    expect(getComputedStyle(bar()).borderTopLeftRadius).toBe(`${radius}px`);
    expect(getComputedStyle(trigger("Edit")).borderTopLeftRadius).toBe(
      `${Math.max(0, radius - 4)}px`,
    );
  });

  test("a disabled trigger is dimmed and skipped by the arrows", async () => {
    await render(<Bar disabled />);
    expect(trigger("View").hasAttribute("data-disabled")).toBe(true);
    expect(getComputedStyle(trigger("View")).opacity).toBe("0.45");
    trigger("Edit").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).not.toBe(trigger("View"));
  });

  test("passes className, style, render, and ref through its parts", async () => {
    const barRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    await render(
      <Menubar.Root ref={barRef} className="b" style={{ zIndex: 2 }} aria-label="x">
        <Menu.Root>
          <Menubar.Trigger ref={triggerRef} className="t">
            One
          </Menubar.Trigger>
        </Menu.Root>
        <Menu.Root>
          <Menubar.Trigger render={<a href="#two" />}>Two</Menubar.Trigger>
        </Menu.Root>
      </Menubar.Root>,
    );
    expect(barRef.current?.className).toBe("ow-menubar ow-menubar--md b");
    expect(barRef.current?.style.zIndex).toBe("2");
    expect(triggerRef.current?.className).toBe("ow-menubar__trigger ow-menubar__trigger--md t");
    expect(document.querySelector("a[data-slot=menubar-trigger]")).not.toBeNull();
  });

  test("keeps the ring, the open trigger, and a disabled one in forced colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Bar open="edit" disabled />);
    await expect.poll(popup).not.toBeNull();
    await commands.setForcedColors("active");
    expect(getComputedStyle(bar()).outlineStyle).toBe("solid");
    expect(getComputedStyle(trigger("Edit")).outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(trigger("View")).opacity).toBe("1");
  });

  test("shows the focus ring from the keyboard", async () => {
    await render(<Bar />);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(trigger("File"));
    const style = getComputedStyle(trigger("File"));
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
  });

  test("follows the text direction: the arrows are mirrored", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Bar />
        </div>
      </DirectionProvider>,
    );
    expect(box(trigger("File")).left).toBeGreaterThan(box(trigger("Edit")).left);
    trigger("File").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(trigger("Edit"));
  });

  test("has no axe violations in light and dark, closed and open", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <Bar open="edit" />
      </main>,
    );
    await expect.poll(popup).not.toBeNull();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(document.body)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, closed and open", async () => {
    const screen = await render(<Bar />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await screen.unmount();
    await render(<Bar open="edit" />);
    await expect.poll(popup).not.toBeNull();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("renders on the server without warnings", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => error.mockRestore());
    const html = renderToString(<Bar />);
    expect(html).toContain('role="menubar"');
    expect(html).toContain("ow-menubar__trigger");
    expect(error).not.toHaveBeenCalled();
  });
});

test("every part has its data-slot", async () => {
  await render(<Bar open="edit" />);
  await expect.poll(popup).not.toBeNull();
  expect(bar().dataset.slot).toBe("menubar");
  expect(
    [...document.querySelectorAll('[data-slot="menubar-trigger"]')].map((el) => el.textContent),
  ).toEqual(["File", "Edit", "View"]);
});
