"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { useDirection } from "@base-ui/react/direction-provider";
import { createContext, type ReactElement, useContext, useMemo } from "react";
import { cn } from "../../core/cn";
import { Placed, Placement } from "../../core/placed";
import {
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  type MenuCheckboxItemIndicatorProps,
  type MenuCheckboxItemProps,
  MenuGroupLabel,
  type MenuGroupLabelProps,
  MenuItem,
  type MenuItemProps,
  MenuLinkItem,
  type MenuLinkItemProps,
  MenuModalContext,
  MenuPopup,
  type MenuPopupProps,
  MenuPositioner,
  MenuRadioItem,
  MenuRadioItemIndicator,
  type MenuRadioItemIndicatorProps,
  type MenuRadioItemProps,
  MenuSeparator,
  type MenuSeparatorProps,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  type MenuSubmenuTriggerProps,
  NOT_MODAL,
} from "../menu/menu";
import { type MenuVariantProps, menuSlots } from "../menu/menu-variants";
import { contextMenuSlots } from "./context-menu-variants";
import "./context-menu.css";

// The popup, the items, and their look are Menu's; each part here only names itself.

export type ContextMenuGroupProps = BaseContextMenu.Group.Props;
export type ContextMenuRadioGroupProps = BaseContextMenu.RadioGroup.Props;
export type ContextMenuSubmenuRootProps = BaseContextMenu.SubmenuRoot.Props;
export type ContextMenuPopupProps = MenuPopupProps;
export type ContextMenuItemProps = MenuItemProps;
export type ContextMenuLinkItemProps = MenuLinkItemProps;
export type ContextMenuCheckboxItemProps = MenuCheckboxItemProps;
export type ContextMenuCheckboxItemIndicatorProps = MenuCheckboxItemIndicatorProps;
export type ContextMenuRadioItemProps = MenuRadioItemProps;
export type ContextMenuRadioItemIndicatorProps = MenuRadioItemIndicatorProps;
export type ContextMenuSubmenuTriggerProps = MenuSubmenuTriggerProps;
export type ContextMenuGroupLabelProps = MenuGroupLabelProps;
export type ContextMenuSeparatorProps = MenuSeparatorProps;

export type ContextMenuRootProps = BaseContextMenu.Root.Props & MenuVariantProps;

/**
 * Base UI's Root, with one `size` for the popup and its submenus'. A context menu is always modal,
 * as in Base UI: its own backdrop takes a press outside, so that press only shuts the menu, and
 * the page does not scroll.
 */
export function ContextMenuRoot({ size = "md", ...props }: ContextMenuRootProps): ReactElement {
  const value = useMemo(() => ({ ...NOT_MODAL, size }), [size]);
  return (
    <MenuModalContext.Provider value={value}>
      <BaseContextMenu.Root {...props} />
    </MenuModalContext.Provider>
  );
}

export interface ContextMenuTriggerProps extends Omit<BaseContextMenu.Trigger.Props, "className"> {
  className?: string | undefined;
}

/** The area that opens the menu on a right click or a long press. It draws nothing of its own. */
export function ContextMenuTrigger({ className, ...props }: ContextMenuTriggerProps): ReactElement {
  return (
    <BaseContextMenu.Trigger
      data-slot="context-menu-trigger"
      {...props}
      className={cn(contextMenuSlots.trigger, className)}
    />
  );
}

export interface ContextMenuPortalProps extends Omit<BaseContextMenu.Portal.Props, "className"> {
  className?: string | undefined;
}

/** Base UI's Portal. */
export function ContextMenuPortal(props: ContextMenuPortalProps): ReactElement {
  return <BaseContextMenu.Portal data-slot="context-menu-portal" {...props} />;
}

/** Whether the Positioner places a submenu, which sits beside its item and not at the pointer. */
const SubmenuContext = createContext(false);

export interface ContextMenuPositionerProps
  extends Omit<BaseContextMenu.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Places the menu at the pointer, as Base UI's. In a submenu it is Menu's Positioner: beside its
 * item, first items in line. It takes the text direction from DirectionProvider.
 */
export function ContextMenuPositioner({
  className,
  ...props
}: ContextMenuPositionerProps): ReactElement {
  const direction = useDirection();
  const submenu = useContext(SubmenuContext);
  if (submenu) {
    return <MenuPositioner data-slot="context-menu-positioner" {...props} className={className} />;
  }
  return (
    <Placed>
      <BaseContextMenu.Positioner
        data-slot="context-menu-positioner"
        dir={direction}
        {...props}
        className={cn(menuSlots.positioner, className)}
      />
    </Placed>
  );
}

/** A submenu: never modal of its own, and placed beside its item. */
export function ContextMenuSubmenuRoot(props: ContextMenuSubmenuRootProps): ReactElement {
  return (
    <SubmenuContext.Provider value>
      <MenuSubmenuRoot {...props} />
    </SubmenuContext.Provider>
  );
}

export const ContextMenuGroup: typeof BaseContextMenu.Group = BaseContextMenu.Group;
export const ContextMenuRadioGroup: typeof BaseContextMenu.RadioGroup = BaseContextMenu.RadioGroup;

/**
 * Menu's popup: the panel with the popup shadow, its items scrolling inside. Without a Positioner
 * around it, it draws a Portal and a Positioner.
 */
export function ContextMenuPopup(props: ContextMenuPopupProps): ReactElement {
  return (
    <Placement portal={ContextMenuPortal} positioner={ContextMenuPositioner}>
      <MenuPopup data-slot="context-menu-popup" {...props} />
    </Placement>
  );
}

/** An action; put an icon (`svg`) first and a shortcut (`kbd`) last. */
export function ContextMenuItem(props: ContextMenuItemProps): ReactElement {
  return <MenuItem data-slot="context-menu-item" {...props} />;
}

/** A link that looks like an item. */
export function ContextMenuLinkItem(props: ContextMenuLinkItemProps): ReactElement {
  return <MenuLinkItem data-slot="context-menu-link-item" {...props} />;
}

/** An on/off item; put a CheckboxItemIndicator first. */
export function ContextMenuCheckboxItem(props: ContextMenuCheckboxItemProps): ReactElement {
  return <MenuCheckboxItem data-slot="context-menu-checkbox-item" {...props} />;
}

/** A check, icon-sized. */
export function ContextMenuCheckboxItemIndicator(
  props: ContextMenuCheckboxItemIndicatorProps,
): ReactElement {
  return <MenuCheckboxItemIndicator data-slot="context-menu-checkbox-item-indicator" {...props} />;
}

/** One choice in a RadioGroup; put a RadioItemIndicator first. */
export function ContextMenuRadioItem(props: ContextMenuRadioItemProps): ReactElement {
  return <MenuRadioItem data-slot="context-menu-radio-item" {...props} />;
}

/** A dot, icon-sized. */
export function ContextMenuRadioItemIndicator(
  props: ContextMenuRadioItemIndicatorProps,
): ReactElement {
  return <MenuRadioItemIndicator data-slot="context-menu-radio-item-indicator" {...props} />;
}

/** An item that opens a submenu, with a chevron at its end. */
export function ContextMenuSubmenuTrigger(props: ContextMenuSubmenuTriggerProps): ReactElement {
  return <MenuSubmenuTrigger data-slot="context-menu-submenu-trigger" {...props} />;
}

/** A group's name, small and muted. */
export function ContextMenuGroupLabel(props: ContextMenuGroupLabelProps): ReactElement {
  return <MenuGroupLabel data-slot="context-menu-group-label" {...props} />;
}

/** A hairline between groups. */
export function ContextMenuSeparator(props: ContextMenuSeparatorProps): ReactElement {
  return <MenuSeparator data-slot="context-menu-separator" {...props} />;
}
