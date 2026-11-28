import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AlertDialog } from "../src/components/alert-dialog";
import { ContextMenu } from "../src/components/context-menu";
import { Dialog } from "../src/components/dialog";
import { Drawer } from "../src/components/drawer";
import { Menu } from "../src/components/menu";
import { Menubar } from "../src/components/menubar";
import { NavigationMenu } from "../src/components/navigation-menu";
import { Popover } from "../src/components/popover";
import { PreviewCard } from "../src/components/preview-card";
import { Tooltip } from "../src/components/tooltip";

// A Popup with no Portal or Positioner around it draws its own, and lands where the written-out
// form does.

interface Layer {
  slot: string;
  /** Opened by the trigger (and closed by Escape, giving focus back), rather than by hover. */
  triggered: boolean;
  view: (bare: boolean, open: boolean) => ReactElement;
}

const MARGIN = { margin: 80 };

const layers: Record<string, Layer> = {
  Menu: {
    slot: "menu-popup",
    triggered: true,
    view: (bare, open) => (
      <Menu.Root defaultOpen={open}>
        <Menu.Trigger style={MARGIN}>Open</Menu.Trigger>
        {bare ? (
          <Menu.Popup>
            <Menu.Item>Cut</Menu.Item>
            <Menu.Item>Copy</Menu.Item>
          </Menu.Popup>
        ) : (
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Cut</Menu.Item>
                <Menu.Item>Copy</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
    ),
  },
  "Menu submenu": {
    slot: "menu-popup",
    triggered: false,
    view: (bare) => {
      const sub = (
        <Menu.Popup>
          <Menu.Item>Sub</Menu.Item>
        </Menu.Popup>
      );
      return (
        <Menu.Root defaultOpen>
          <Menu.Trigger style={MARGIN}>Open</Menu.Trigger>
          <Menu.Popup>
            <Menu.SubmenuRoot defaultOpen>
              <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
              {bare ? (
                sub
              ) : (
                <Menu.Portal>
                  <Menu.Positioner>{sub}</Menu.Positioner>
                </Menu.Portal>
              )}
            </Menu.SubmenuRoot>
          </Menu.Popup>
        </Menu.Root>
      );
    },
  },
  Menubar: {
    slot: "menu-popup",
    triggered: true,
    view: (bare, open) => (
      <Menubar.Root>
        <Menu.Root defaultOpen={open}>
          <Menubar.Trigger style={MARGIN}>File</Menubar.Trigger>
          {bare ? (
            <Menu.Popup>
              <Menu.Item>New</Menu.Item>
            </Menu.Popup>
          ) : (
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>New</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          )}
        </Menu.Root>
      </Menubar.Root>
    ),
  },
  "Context Menu": {
    slot: "context-menu-popup",
    triggered: false,
    view: (bare) => (
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger style={{ inlineSize: 240, blockSize: 120, margin: 40 }}>
          Area
        </ContextMenu.Trigger>
        {bare ? (
          <ContextMenu.Popup>
            <ContextMenu.Item>Cut</ContextMenu.Item>
          </ContextMenu.Popup>
        ) : (
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup>
                <ContextMenu.Item>Cut</ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        )}
      </ContextMenu.Root>
    ),
  },
  Popover: {
    slot: "popover-popup",
    triggered: true,
    view: (bare, open) => (
      <Popover.Root defaultOpen={open}>
        <Popover.Trigger style={MARGIN}>Open</Popover.Trigger>
        {bare ? (
          <Popover.Popup>
            <Popover.Title>Share</Popover.Title>
            <Popover.Close>Done</Popover.Close>
          </Popover.Popup>
        ) : (
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Title>Share</Popover.Title>
                <Popover.Close>Done</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    ),
  },
  Tooltip: {
    slot: "tooltip-popup",
    triggered: false,
    view: (bare) => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger style={MARGIN}>Save</Tooltip.Trigger>
        {bare ? (
          <Tooltip.Popup>Save the draft</Tooltip.Popup>
        ) : (
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Save the draft</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    ),
  },
  "Preview Card": {
    slot: "preview-card-popup",
    triggered: false,
    view: (bare) => (
      <PreviewCard.Root defaultOpen>
        <PreviewCard.Trigger href="#a" style={MARGIN}>
          Link
        </PreviewCard.Trigger>
        {bare ? (
          <PreviewCard.Popup>Preview</PreviewCard.Popup>
        ) : (
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Preview</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        )}
      </PreviewCard.Root>
    ),
  },
  "Navigation Menu": {
    slot: "navigation-menu-popup",
    triggered: false,
    view: (bare) => (
      <NavigationMenu.Root aria-label="Main" defaultValue="a">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#x">Components</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        {bare ? (
          <NavigationMenu.Popup />
        ) : (
          <NavigationMenu.Portal>
            <NavigationMenu.Positioner>
              <NavigationMenu.Popup />
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        )}
      </NavigationMenu.Root>
    ),
  },
  Dialog: {
    slot: "dialog-popup",
    triggered: true,
    view: (bare, open) => {
      const popup = (
        <Dialog.Popup>
          <Dialog.Title>Share</Dialog.Title>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Popup>
      );
      return (
        <Dialog.Root defaultOpen={open}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          {bare ? popup : <Dialog.Portal>{popup}</Dialog.Portal>}
        </Dialog.Root>
      );
    },
  },
  "Alert Dialog": {
    slot: "alert-dialog-popup",
    triggered: true,
    view: (bare, open) => {
      const popup = (
        <AlertDialog.Popup>
          <AlertDialog.Title>Delete?</AlertDialog.Title>
          <AlertDialog.Close>Cancel</AlertDialog.Close>
        </AlertDialog.Popup>
      );
      return (
        <AlertDialog.Root defaultOpen={open}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          {bare ? popup : <AlertDialog.Portal>{popup}</AlertDialog.Portal>}
        </AlertDialog.Root>
      );
    },
  },
  Drawer: {
    slot: "drawer-popup",
    triggered: true,
    view: (bare, open) => {
      const popup = (
        <Drawer.Popup>
          <Drawer.Title>Share</Drawer.Title>
          <Drawer.Close>Done</Drawer.Close>
        </Drawer.Popup>
      );
      return (
        <Drawer.Root defaultOpen={open}>
          <Drawer.Trigger>Open</Drawer.Trigger>
          {bare ? popup : <Drawer.Portal>{popup}</Drawer.Portal>}
        </Drawer.Root>
      );
    },
  },
};

const popupOf = (slot: string) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);

async function rectOf(view: ReactElement, slot: string) {
  const screen = await render(view);
  await expect.poll(() => popupOf(slot)).not.toBeNull();
  const popup = popupOf(slot) as HTMLElement;
  // Past the first frame, where the popup still sits at its starting style.
  await expect.poll(() => popup.getAnimations().length).toBe(0);
  const { x, y, width, height } = popup.getBoundingClientRect();
  await screen.unmount();
  return { x, y, width, height };
}

describe("a Popup with no Portal or Positioner around it", () => {
  test.each(Object.keys(layers))("%s: opens where the written-out form does", async (name) => {
    const { slot, view } = layers[name] as Layer;
    const written = await rectOf(view(false, true), slot);
    const bare = await rectOf(view(true, true), slot);
    expect(bare).toEqual(written);
  });

  test.each(Object.keys(layers).filter((name) => layers[name]?.triggered))(
    "%s: takes focus when opened and gives it back on Escape",
    async (name) => {
      const { slot, view } = layers[name] as Layer;
      await render(view(true, false));
      const trigger = document.querySelector("button") as HTMLElement;
      await userEvent.click(trigger);
      await expect.poll(() => popupOf(slot)).not.toBeNull();
      await expect.poll(() => popupOf(slot)?.contains(document.activeElement)).toBe(true);
      await userEvent.keyboard("{Escape}");
      await expect.poll(() => popupOf(slot)).toBeNull();
      await expect.poll(() => document.activeElement).toBe(trigger);
    },
  );

  test("a nested popup inside one draws its own frame", async () => {
    await render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Popup>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger>Inner</Tooltip.Trigger>
            <Tooltip.Popup>Tip</Tooltip.Popup>
          </Tooltip.Root>
        </Popover.Popup>
      </Popover.Root>,
    );
    await expect.poll(() => popupOf("tooltip-popup")).not.toBeNull();
    expect(popupOf("tooltip-popup")?.closest('[data-slot="tooltip-positioner"]')).not.toBeNull();
    expect(popupOf("tooltip-popup")?.closest('[data-slot="popover-popup"]')).toBeNull();
  });
});
