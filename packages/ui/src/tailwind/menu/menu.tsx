// Generated from components/menu by scripts/build-tailwind.ts; do not edit.
"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import {
  type Context,
  createContext,
  type ReactElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "../lib/cn";
import { GlideHighlight, useGlide } from "../lib/glide/use-glide";
import { useMergedRefs } from "../lib/merge-refs";
import { useRestingAnchor } from "../lib/resting-anchor";
import { trackPointerType, useScrollLock } from "../lib/scroll-lock";
import { type MenuVariantProps, menuPopupVariants, menuSlots } from "./menu-variants";

/** Every kind of item Glide lights: plain, link, checkbox, radio, and submenu triggers. */
const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

// Parts without a look of their own come straight from Base UI.

export type MenuRootProps<Payload = unknown> = BaseMenu.Root.Props<Payload>;
export type MenuTriggerProps<Payload = unknown> = BaseMenu.Trigger.Props<Payload>;
export type MenuGroupProps = BaseMenu.Group.Props;
export type MenuRadioGroupProps = BaseMenu.RadioGroup.Props;
export type MenuSubmenuRootProps = BaseMenu.SubmenuRoot.Props;

/** Whether the open menu is modal: a backdrop takes outside presses, and the page's scroll is locked. */
export interface MenuModal {
  modal: boolean;
  hover: boolean;
  open: boolean;
}
export const NOT_MODAL: MenuModal = { modal: false, hover: false, open: false };
export const MenuModalContext: Context<MenuModal> = createContext(NOT_MODAL);

/** Set by Menubar: its menus leave `modal` and the backdrop to Base UI, which cuts the bar out. */
export const MenubarMenuContext: Context<boolean> = createContext(false);

/**
 * Base UI's Root. `modal` (default true) works as Base UI's: a press outside only shuts the menu,
 * and the page does not scroll. The lock is OwsemUI's (core/scroll-lock), which leaves the page's
 * overflow alone, so its text is not drawn again while the menu is open. A menu opened by hover is
 * never modal.
 */
export function MenuRoot<Payload = unknown>({
  modal = true,
  onOpenChange,
  ...props
}: MenuRootProps<Payload>): ReactElement {
  const inBar = useContext(MenubarMenuContext);
  const [hover, setHover] = useState(false);
  // A kept-mounted popup outlives the menu's opening, so the lock follows `open`.
  const [opened, setOpened] = useState(props.defaultOpen ?? false);
  const open = props.open ?? opened;
  useEffect(trackPointerType, []);
  const value = useMemo(
    () => (inBar ? NOT_MODAL : { modal, hover, open }),
    [inBar, modal, hover, open],
  );
  return (
    <MenuModalContext.Provider value={value}>
      <BaseMenu.Root
        {...props}
        // Base UI ignores `modal` in a menubar and warns about it.
        {...(inBar ? {} : { modal: false })}
        onOpenChange={(next, details) => {
          setHover(details.reason === "trigger-hover");
          onOpenChange?.(next, details);
          if (!details.isCanceled) setOpened(next);
        }}
      />
    </MenuModalContext.Provider>
  );
}

/** A submenu: never modal of its own, as in Base UI; the menu it belongs to holds the page. */
export function MenuSubmenuRoot(props: MenuSubmenuRootProps): ReactElement {
  return (
    <MenuModalContext.Provider value={NOT_MODAL}>
      <BaseMenu.SubmenuRoot {...props} />
    </MenuModalContext.Provider>
  );
}

/** The button that opens the menu; pass your button to `render`. */
export const MenuTrigger: typeof BaseMenu.Trigger = BaseMenu.Trigger;

export interface MenuPortalProps extends Omit<BaseMenu.Portal.Props, "className"> {
  className?: string | undefined;
}

/** Base UI's Portal; for a modal menu it puts a clear backdrop under the popup for outside presses. */
export function MenuPortal({ children, ...props }: MenuPortalProps): ReactElement {
  const { modal } = useContext(MenuModalContext);
  return (
    <BaseMenu.Portal data-slot="menu-portal" {...props}>
      {modal ? (
        <BaseMenu.Backdrop data-slot="menu-backdrop" className={menuSlots.backdrop} />
      ) : null}
      {children}
    </BaseMenu.Portal>
  );
}
export const MenuGroup: typeof BaseMenu.Group = BaseMenu.Group;
export const MenuRadioGroup: typeof BaseMenu.RadioGroup = BaseMenu.RadioGroup;
export const MenuViewport: typeof BaseMenu.Viewport = BaseMenu.Viewport;
/** Links a Root to triggers placed elsewhere (detached triggers). */
export const createMenuHandle: typeof BaseMenu.createHandle = BaseMenu.createHandle;

type Offset = NonNullable<BaseMenu.Positioner.Props["alignOffset"]>;

// The popup's padding: beside its trigger, a menu (or submenu) lines its first item up with it.
const PAD = 4;
const lineUp: Offset = ({ side, align }) =>
  align === "start" && side !== "top" && side !== "bottom" ? -PAD : 0;

export interface MenuPositionerProps extends Omit<BaseMenu.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Places the menu 6px from its trigger; a submenu beside its item, first items in line. It takes
 * the text direction from DirectionProvider, since the portal leaves the subtree that sets `dir`.
 * It anchors to the trigger's resting box, not its pressed one; a context menu's Positioner must
 * not, since its anchor is the pointer.
 */
export function MenuPositioner({
  className,
  sideOffset = 6,
  alignOffset = lineUp,
  ref,
  ...props
}: MenuPositionerProps): ReactElement {
  const direction = useDirection();
  const resting = useRestingAnchor(ref);
  return (
    <BaseMenu.Positioner
      data-slot="menu-positioner"
      dir={direction}
      anchor={resting.anchor}
      {...props}
      ref={resting.ref}
      className={cn(menuSlots.positioner, className)}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
    />
  );
}

export interface MenuPopupProps extends Omit<BaseMenu.Popup.Props, "className">, MenuVariantProps {
  className?: string | undefined;
}

/**
 * The panel with the popup shadow. It clips; its items scroll in an inner viewport. Glide lights
 * the item nearest the pointer; the keyboard's highlight (focus) moves it too.
 */
export function MenuPopup({
  className,
  size = "md",
  onFocus,
  children,
  ref,
  ...props
}: MenuPopupProps): ReactElement {
  const glide = useGlide<HTMLDivElement>({ axis: "y", items: ITEMS });
  const { ref: viewportRef, setActive } = glide;
  const { modal, hover, open } = useContext(MenuModalContext);
  const [self, setSelf] = useState<HTMLDivElement | null>(null);
  useScrollLock(self, modal && !hover && open);
  const merged = useMergedRefs(setSelf, ref);
  const follow = (event: Parameters<NonNullable<MenuPopupProps["onFocus"]>>[0]) => {
    onFocus?.(event);
    const item = event.target as HTMLElement;
    // A submenu's focus bubbles here through React's tree; its items are not this popup's.
    if (item.matches(ITEMS) && event.currentTarget.contains(item)) setActive(item);
  };
  return (
    <BaseMenu.Popup
      data-slot="menu-popup"
      data-size={size}
      onFocus={follow}
      {...props}
      ref={merged}
      className={cn(menuPopupVariants({ size }), className)}
    >
      {/* The popup only clips, so its rounded corners cut the scrollbar; this scrolls. */}
      <div data-slot="menu-viewport" ref={viewportRef} className={menuSlots.viewport}>
        <GlideHighlight glide={glide} />
        {children}
      </div>
    </BaseMenu.Popup>
  );
}

export interface MenuItemProps extends Omit<BaseMenu.Item.Props, "className"> {
  className?: string | undefined;
}

/** An action. Put an icon (`svg`) first and a shortcut (`kbd`) last; both are sized for you. */
export function MenuItem({ className, ...props }: MenuItemProps): ReactElement {
  return (
    <BaseMenu.Item data-slot="menu-item" {...props} className={cn(menuSlots.item, className)} />
  );
}

export interface MenuLinkItemProps extends Omit<BaseMenu.LinkItem.Props, "className"> {
  className?: string | undefined;
}

/** A link that looks like an item; `render` swaps in a router link. */
export function MenuLinkItem({ className, ...props }: MenuLinkItemProps): ReactElement {
  return (
    <BaseMenu.LinkItem
      data-slot="menu-link-item"
      {...props}
      className={cn(menuSlots.item, className)}
    />
  );
}

export interface MenuCheckboxItemProps extends Omit<BaseMenu.CheckboxItem.Props, "className"> {
  className?: string | undefined;
}

/** An on/off item; put a CheckboxItemIndicator first. */
export function MenuCheckboxItem({ className, ...props }: MenuCheckboxItemProps): ReactElement {
  return (
    <BaseMenu.CheckboxItem
      data-slot="menu-checkbox-item"
      {...props}
      className={cn(menuSlots.item, className)}
    />
  );
}

export interface MenuRadioItemProps extends Omit<BaseMenu.RadioItem.Props, "className"> {
  className?: string | undefined;
}

/** One choice in a RadioGroup; put a RadioItemIndicator first. */
export function MenuRadioItem({ className, ...props }: MenuRadioItemProps): ReactElement {
  return (
    <BaseMenu.RadioItem
      data-slot="menu-radio-item"
      {...props}
      className={cn(menuSlots.item, className)}
    />
  );
}

// Drawn for OwsemUI; they follow the text color, forced colors included.
const glyph = (shape: "check" | "dot" | "chevron") => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {shape === "check" ? <path d="M20 6 9 17l-5-5" /> : null}
    {shape === "dot" ? <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" /> : null}
    {shape === "chevron" ? <path d="m9.5 6 6 6-6 6" /> : null}
  </svg>
);

export interface MenuCheckboxItemIndicatorProps
  extends Omit<BaseMenu.CheckboxItemIndicator.Props, "className"> {
  className?: string | undefined;
}

/** A check, icon-sized. It keeps its room while unchecked, so labels stay in line. */
export function MenuCheckboxItemIndicator({
  className,
  keepMounted = true,
  children = glyph("check"),
  ...props
}: MenuCheckboxItemIndicatorProps): ReactElement {
  return (
    <BaseMenu.CheckboxItemIndicator
      data-slot="menu-checkbox-item-indicator"
      {...props}
      className={cn(menuSlots.indicator, className)}
      keepMounted={keepMounted}
    >
      {children}
    </BaseMenu.CheckboxItemIndicator>
  );
}

export interface MenuRadioItemIndicatorProps
  extends Omit<BaseMenu.RadioItemIndicator.Props, "className"> {
  className?: string | undefined;
}

/** A dot, icon-sized. It keeps its room while unchecked, so labels stay in line. */
export function MenuRadioItemIndicator({
  className,
  keepMounted = true,
  children = glyph("dot"),
  ...props
}: MenuRadioItemIndicatorProps): ReactElement {
  return (
    <BaseMenu.RadioItemIndicator
      data-slot="menu-radio-item-indicator"
      {...props}
      className={cn(menuSlots.indicator, className)}
      keepMounted={keepMounted}
    >
      {children}
    </BaseMenu.RadioItemIndicator>
  );
}

export interface MenuSubmenuTriggerProps extends Omit<BaseMenu.SubmenuTrigger.Props, "className"> {
  className?: string | undefined;
}

/** An item that opens a submenu, with a chevron at its end. */
export function MenuSubmenuTrigger({
  className,
  children,
  ...props
}: MenuSubmenuTriggerProps): ReactElement {
  return (
    <BaseMenu.SubmenuTrigger
      data-slot="menu-submenu-trigger"
      {...props}
      className={cn(menuSlots.item, className)}
    >
      {children}
      <span data-slot="menu-chevron" className={menuSlots.chevron}>
        {glyph("chevron")}
      </span>
    </BaseMenu.SubmenuTrigger>
  );
}

export interface MenuGroupLabelProps extends Omit<BaseMenu.GroupLabel.Props, "className"> {
  className?: string | undefined;
}

/** A group's name, small and muted; it labels the group for assistive technology too. */
export function MenuGroupLabel({ className, ...props }: MenuGroupLabelProps): ReactElement {
  return (
    <BaseMenu.GroupLabel
      data-slot="menu-group-label"
      {...props}
      className={cn(menuSlots.groupLabel, className)}
    />
  );
}

export interface MenuSeparatorProps extends Omit<BaseMenu.Separator.Props, "className"> {
  className?: string | undefined;
}

/** A hairline between groups. */
export function MenuSeparator({ className, ...props }: MenuSeparatorProps): ReactElement {
  return (
    <BaseMenu.Separator
      data-slot="menu-separator"
      {...props}
      className={cn(menuSlots.separator, className)}
    />
  );
}
