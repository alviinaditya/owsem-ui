"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { type ForwardRefExoticComponent, forwardRef, type RefAttributes, useCallback } from "react";
import { withClassName } from "../../core/class-name";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import "./menu.css";

const cls = {
  positioner: "ow-menu__positioner",
  popup: "ow-menu__popup",
  item: "ow-menu__item",
  indicator: "ow-menu__indicator",
  chevron: "ow-menu__chevron",
  groupLabel: "ow-menu__group-label",
  separator: "ow-menu__separator",
} as const;

/** Every kind of item Glide lights: plain, link, checkbox, radio, and submenu triggers. */
const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

export type MenuSize = "sm" | "md" | "lg";

// Parts without a look of their own come straight from Base UI.

export type MenuRootProps<Payload = unknown> = BaseMenu.Root.Props<Payload>;
export type MenuTriggerProps<Payload = unknown> = BaseMenu.Trigger.Props<Payload>;
export type MenuPortalProps = BaseMenu.Portal.Props;
export type MenuGroupProps = BaseMenu.Group.Props;
export type MenuRadioGroupProps = BaseMenu.RadioGroup.Props;
export type MenuSubmenuRootProps = BaseMenu.SubmenuRoot.Props;

export const MenuRoot: typeof BaseMenu.Root = BaseMenu.Root;
/** The button that opens the menu; pass your button to `render`. */
export const MenuTrigger: typeof BaseMenu.Trigger = BaseMenu.Trigger;
export const MenuPortal: typeof BaseMenu.Portal = BaseMenu.Portal;
export const MenuGroup: typeof BaseMenu.Group = BaseMenu.Group;
export const MenuRadioGroup: typeof BaseMenu.RadioGroup = BaseMenu.RadioGroup;
export const MenuSubmenuRoot: typeof BaseMenu.SubmenuRoot = BaseMenu.SubmenuRoot;
export const MenuViewport: typeof BaseMenu.Viewport = BaseMenu.Viewport;
/** Links a Root to triggers placed elsewhere (detached triggers). */
export const createMenuHandle: typeof BaseMenu.createHandle = BaseMenu.createHandle;

type Offset = NonNullable<BaseMenu.Positioner.Props["alignOffset"]>;

// The popup's padding: beside its trigger, a menu (or submenu) lines its first item up with it.
const PAD = 4;
const lineUp: Offset = ({ side, align }) =>
  align === "start" && side !== "top" && side !== "bottom" ? -PAD : 0;

export type MenuPositionerProps = Omit<BaseMenu.Positioner.Props, "ref">;

/**
 * Places the menu 6px from its trigger; a submenu beside its item, first items in line. It takes
 * the text direction from DirectionProvider, since the portal leaves the subtree that sets `dir`.
 */
export const MenuPositioner: ForwardRefExoticComponent<
  MenuPositionerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuPositionerProps>(function MenuPositioner(
  { className, sideOffset = 6, alignOffset = lineUp, ...props },
  ref,
) {
  const direction = useDirection();
  return (
    <BaseMenu.Positioner
      ref={ref}
      className={withClassName(cls.positioner, className)}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      dir={direction}
      {...props}
    />
  );
});

export interface MenuPopupProps extends Omit<BaseMenu.Popup.Props, "ref"> {
  /** The items' type scale: 13, 14, or 16px. @default "md" */
  size?: MenuSize | undefined;
}

/**
 * The panel with the popup shadow. Glide lights the item nearest the pointer; the keyboard's
 * highlight (focus) moves it too.
 */
export const MenuPopup: ForwardRefExoticComponent<MenuPopupProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, MenuPopupProps>(function MenuPopup(
    { className, size = "md", onFocus, children, ...props },
    ref,
  ) {
    const glide = useGlide<HTMLDivElement>({ axis: "y", items: ITEMS });
    const { ref: glideRef, setActive } = glide;
    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        glideRef(el);
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [glideRef, ref],
    );
    const follow = (event: Parameters<NonNullable<MenuPopupProps["onFocus"]>>[0]) => {
      onFocus?.(event);
      const item = event.target as HTMLElement;
      // A submenu's focus bubbles here through React's tree; its items are not this popup's.
      if (item.matches(ITEMS) && event.currentTarget.contains(item)) setActive(item);
    };
    return (
      <BaseMenu.Popup
        ref={setRef}
        className={withClassName(cls.popup, className)}
        data-size={size}
        onFocus={follow}
        {...props}
      >
        <GlideHighlight glide={glide} />
        {children}
      </BaseMenu.Popup>
    );
  });

export type MenuItemProps = Omit<BaseMenu.Item.Props, "ref">;

/** An action. Put an icon (`svg`) first and a shortcut (`kbd`) last; both are sized for you. */
export const MenuItem: ForwardRefExoticComponent<MenuItemProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem({ className, ...props }, ref) {
    return <BaseMenu.Item ref={ref} className={withClassName(cls.item, className)} {...props} />;
  });

export type MenuLinkItemProps = Omit<BaseMenu.LinkItem.Props, "ref">;

/** A link that looks like an item; `render` swaps in a router link. */
export const MenuLinkItem: ForwardRefExoticComponent<
  MenuLinkItemProps & RefAttributes<HTMLAnchorElement>
> = forwardRef<HTMLAnchorElement, MenuLinkItemProps>(function MenuLinkItem(
  { className, ...props },
  ref,
) {
  return <BaseMenu.LinkItem ref={ref} className={withClassName(cls.item, className)} {...props} />;
});

export type MenuCheckboxItemProps = Omit<BaseMenu.CheckboxItem.Props, "ref">;

/** An on/off item; put a CheckboxItemIndicator first. */
export const MenuCheckboxItem: ForwardRefExoticComponent<
  MenuCheckboxItemProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(function MenuCheckboxItem(
  { className, ...props },
  ref,
) {
  return (
    <BaseMenu.CheckboxItem ref={ref} className={withClassName(cls.item, className)} {...props} />
  );
});

export type MenuRadioItemProps = Omit<BaseMenu.RadioItem.Props, "ref">;

/** One choice in a RadioGroup; put a RadioItemIndicator first. */
export const MenuRadioItem: ForwardRefExoticComponent<
  MenuRadioItemProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuRadioItemProps>(function MenuRadioItem(
  { className, ...props },
  ref,
) {
  return <BaseMenu.RadioItem ref={ref} className={withClassName(cls.item, className)} {...props} />;
});

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
    {shape === "check" ? <path d="M5 12.5 9.5 17 19 7.5" /> : null}
    {shape === "dot" ? <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /> : null}
    {shape === "chevron" ? <path d="m9.5 6 6 6-6 6" /> : null}
  </svg>
);

export type MenuCheckboxItemIndicatorProps = Omit<BaseMenu.CheckboxItemIndicator.Props, "ref">;

/** A check, icon-sized. It keeps its room while unchecked, so labels stay in line. */
export const MenuCheckboxItemIndicator: ForwardRefExoticComponent<
  MenuCheckboxItemIndicatorProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, MenuCheckboxItemIndicatorProps>(function MenuCheckboxItemIndicator(
  { className, keepMounted = true, children = glyph("check"), ...props },
  ref,
) {
  return (
    <BaseMenu.CheckboxItemIndicator
      ref={ref}
      className={withClassName(cls.indicator, className)}
      keepMounted={keepMounted}
      {...props}
    >
      {children}
    </BaseMenu.CheckboxItemIndicator>
  );
});

export type MenuRadioItemIndicatorProps = Omit<BaseMenu.RadioItemIndicator.Props, "ref">;

/** A dot, icon-sized. It keeps its room while unchecked, so labels stay in line. */
export const MenuRadioItemIndicator: ForwardRefExoticComponent<
  MenuRadioItemIndicatorProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, MenuRadioItemIndicatorProps>(function MenuRadioItemIndicator(
  { className, keepMounted = true, children = glyph("dot"), ...props },
  ref,
) {
  return (
    <BaseMenu.RadioItemIndicator
      ref={ref}
      className={withClassName(cls.indicator, className)}
      keepMounted={keepMounted}
      {...props}
    >
      {children}
    </BaseMenu.RadioItemIndicator>
  );
});

export type MenuSubmenuTriggerProps = Omit<BaseMenu.SubmenuTrigger.Props, "ref">;

/** An item that opens a submenu, with a chevron at its end. */
export const MenuSubmenuTrigger: ForwardRefExoticComponent<
  MenuSubmenuTriggerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuSubmenuTriggerProps>(function MenuSubmenuTrigger(
  { className, children, ...props },
  ref,
) {
  return (
    <BaseMenu.SubmenuTrigger ref={ref} className={withClassName(cls.item, className)} {...props}>
      {children}
      <span className={cls.chevron}>{glyph("chevron")}</span>
    </BaseMenu.SubmenuTrigger>
  );
});

export type MenuGroupLabelProps = Omit<BaseMenu.GroupLabel.Props, "ref">;

/** A group's name, small and muted; it labels the group for assistive technology too. */
export const MenuGroupLabel: ForwardRefExoticComponent<
  MenuGroupLabelProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuGroupLabelProps>(function MenuGroupLabel(
  { className, ...props },
  ref,
) {
  return (
    <BaseMenu.GroupLabel
      ref={ref}
      className={withClassName(cls.groupLabel, className)}
      {...props}
    />
  );
});

export type MenuSeparatorProps = Omit<BaseMenu.Separator.Props, "ref">;

/** An etched groove between groups. */
export const MenuSeparator: ForwardRefExoticComponent<
  MenuSeparatorProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuSeparatorProps>(function MenuSeparator(
  { className, ...props },
  ref,
) {
  return (
    <BaseMenu.Separator ref={ref} className={withClassName(cls.separator, className)} {...props} />
  );
});
