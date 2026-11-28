"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import { cn } from "../../core/cn";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { useMergedRefs } from "../../core/merge-refs";
import { Placed, Placement, Unplaced } from "../../core/placed";
import {
  type NavigationMenuSize,
  type NavigationMenuVariantProps,
  navigationMenuPopupVariants,
  navigationMenuSlots,
  navigationMenuTriggerVariants,
  navigationMenuVariants,
} from "./navigation-menu-variants";
import "./navigation-menu.css";

/** Glide lights the links of a content. */
const LINKS = '[data-slot="navigation-menu-link"]';

// The root's size, for the parts inside it and the panel in the portal.
const SizeContext = createContext<NavigationMenuSize>("md");
// Set by a content: its links are cards, where a link in the list is a ghost button.
const ContentContext = createContext(false);

// Parts without a look of their own come straight from Base UI.

export type NavigationMenuItemProps = BaseNavigationMenu.Item.Props;
export type NavigationMenuPortalProps = BaseNavigationMenu.Portal.Props;

export const NavigationMenuItem: typeof BaseNavigationMenu.Item = BaseNavigationMenu.Item;

export interface NavigationMenuRootProps<Value = unknown>
  extends Omit<BaseNavigationMenu.Root.Props<Value>, "className">,
    NavigationMenuVariantProps {
  className?: string | undefined;
}

/**
 * The navigation: a `nav` that holds the list and, in a portal, the shared panel. `size` is the
 * triggers' height and the panel's type. Hovering or clicking a trigger opens its content; moving
 * to another trigger slides the panel to it.
 */
export function NavigationMenuRoot<Value = unknown>({
  size = "md",
  className,
  ...props
}: NavigationMenuRootProps<Value>): ReactElement {
  return (
    <SizeContext.Provider value={size}>
      <BaseNavigationMenu.Root
        data-slot="navigation-menu"
        {...props}
        className={cn(navigationMenuVariants({ size }), className)}
        data-size={size}
      />
    </SizeContext.Provider>
  );
}

export interface NavigationMenuListProps extends Omit<BaseNavigationMenu.List.Props, "className"> {
  className?: string | undefined;
}

/** The row of items; it wraps on a narrow screen. */
export function NavigationMenuList({ className, ...props }: NavigationMenuListProps): ReactElement {
  return (
    <BaseNavigationMenu.List
      data-slot="navigation-menu-list"
      {...props}
      className={cn(navigationMenuSlots.list, className)}
    />
  );
}

// Drawn for OwsemUI, as Accordion's: two strokes that turn about their own centers. It follows the
// text color, forced colors included.
const chevron = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path className={navigationMenuSlots.stroke} data-side="start" d="m6 9 6 6" />
    <path className={navigationMenuSlots.stroke} data-side="end" d="m12 15 6-6" />
  </svg>
);

export interface NavigationMenuIconProps extends Omit<BaseNavigationMenu.Icon.Props, "className"> {
  className?: string | undefined;
}

/** A chevron whose strokes turn while the item's panel is open. Pass children to draw your own. */
export function NavigationMenuIcon({
  className,
  children = chevron,
  ...props
}: NavigationMenuIconProps): ReactElement {
  return (
    <BaseNavigationMenu.Icon
      data-slot="navigation-menu-icon"
      {...props}
      className={cn(navigationMenuSlots.icon, className)}
    >
      {children}
    </BaseNavigationMenu.Icon>
  );
}

export interface NavigationMenuTriggerProps
  extends Omit<BaseNavigationMenu.Trigger.Props, "className"> {
  className?: string | undefined;
  /** Replaces the chevron; `null` leaves it out, for a trigger that draws its own Icon. */
  icon?: ReactNode;
}

/** A ghost button that opens its item's content, with a chevron at the end. */
export function NavigationMenuTrigger({
  className,
  icon,
  children,
  ...props
}: NavigationMenuTriggerProps): ReactElement {
  const size = useContext(SizeContext);
  return (
    <BaseNavigationMenu.Trigger
      data-slot="navigation-menu-trigger"
      {...props}
      className={cn(navigationMenuTriggerVariants({ size }), className)}
    >
      {children}
      {icon === null ? null : <NavigationMenuIcon>{icon}</NavigationMenuIcon>}
    </BaseNavigationMenu.Trigger>
  );
}

export interface NavigationMenuContentProps
  extends Omit<BaseNavigationMenu.Content.Props, "className"> {
  className?: string | undefined;
}

/**
 * What an item shows in the panel. It is moved into the shared viewport while the item is open,
 * and slides in from the side of the trigger the pointer came from. Glide lights its links.
 */
export function NavigationMenuContent({
  className,
  children,
  ref,
  ...props
}: NavigationMenuContentProps): ReactElement {
  const glide = useGlide<HTMLDivElement>({ axis: "xy", items: LINKS });
  const merged = useMergedRefs(glide.ref, ref);
  return (
    <ContentContext.Provider value>
      <BaseNavigationMenu.Content
        data-slot="navigation-menu-content"
        {...props}
        ref={merged}
        className={cn(navigationMenuSlots.content, className)}
      >
        <GlideHighlight glide={glide} />
        {children}
      </BaseNavigationMenu.Content>
    </ContentContext.Provider>
  );
}

export interface NavigationMenuLinkProps extends Omit<BaseNavigationMenu.Link.Props, "className"> {
  className?: string | undefined;
}

/**
 * A link. In a content it is a card: a title, then lines of text. In the list it is a ghost
 * button like the triggers. `active` marks the current page; `render` swaps in a router link.
 */
export function NavigationMenuLink({ className, ...props }: NavigationMenuLinkProps): ReactElement {
  const size = useContext(SizeContext);
  const inContent = useContext(ContentContext);
  return (
    <BaseNavigationMenu.Link
      data-slot="navigation-menu-link"
      {...props}
      className={cn(
        inContent ? navigationMenuSlots.link : navigationMenuTriggerVariants({ size }),
        className,
      )}
    />
  );
}

export interface NavigationMenuBackdropProps
  extends Omit<BaseNavigationMenu.Backdrop.Props, "className"> {
  className?: string | undefined;
}

/** An optional clear layer under the panel; it takes presses and draws nothing. */
export function NavigationMenuBackdrop({
  className,
  ...props
}: NavigationMenuBackdropProps): ReactElement {
  return (
    <BaseNavigationMenu.Backdrop
      data-slot="navigation-menu-backdrop"
      {...props}
      className={cn(navigationMenuSlots.backdrop, className)}
    />
  );
}

/** Base UI's Portal. Without children it draws the Positioner, with the Popup and Viewport. */
export function NavigationMenuPortal({
  children,
  ...props
}: NavigationMenuPortalProps): ReactElement {
  return (
    <BaseNavigationMenu.Portal data-slot="navigation-menu-portal" {...props}>
      {children ?? <NavigationMenuPositioner />}
    </BaseNavigationMenu.Portal>
  );
}

/** The panel stays under the list: no flip to the top. */
const NO_FLIP = { side: "none" } as const;

export interface NavigationMenuPositionerProps
  extends Omit<BaseNavigationMenu.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Places the panel 8px under the list, and keeps it 16px inside the window. It never flips to the
 * top, so the panel stays where the eye looks for it. It takes the text direction from
 * DirectionProvider, since the portal leaves the subtree that sets `dir`. Without children it
 * draws the Popup.
 */
export function NavigationMenuPositioner({
  className,
  sideOffset = 8,
  collisionPadding = 16,
  collisionAvoidance = NO_FLIP,
  children,
  ...props
}: NavigationMenuPositionerProps): ReactElement {
  const direction = useDirection();
  return (
    <Placed>
      <BaseNavigationMenu.Positioner
        data-slot="navigation-menu-positioner"
        dir={direction}
        {...props}
        className={cn(navigationMenuSlots.positioner, className)}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        collisionAvoidance={collisionAvoidance}
      >
        {children ?? <NavigationMenuPopup />}
      </BaseNavigationMenu.Positioner>
    </Placed>
  );
}

export interface NavigationMenuPopupProps
  extends Omit<BaseNavigationMenu.Popup.Props, "className"> {
  className?: string | undefined;
}

/**
 * The panel with the popup shadow. It takes the Root's `size`. Without children it draws the
 * Viewport; without a Positioner around it, a Portal and a Positioner.
 */
export function NavigationMenuPopup({
  className,
  children,
  ...props
}: NavigationMenuPopupProps): ReactElement {
  const size = useContext(SizeContext);
  return (
    <Placement portal={NavigationMenuPortal} positioner={NavigationMenuPositioner}>
      <BaseNavigationMenu.Popup
        data-slot="navigation-menu-popup"
        data-size={size}
        {...props}
        className={cn(navigationMenuPopupVariants({ size }), className)}
      >
        <Unplaced>{children ?? <NavigationMenuViewport />}</Unplaced>
      </BaseNavigationMenu.Popup>
    </Placement>
  );
}

export interface NavigationMenuViewportProps
  extends Omit<BaseNavigationMenu.Viewport.Props, "className"> {
  className?: string | undefined;
}

/** The clipping window onto the open content; the panel resizes to what it holds. */
export function NavigationMenuViewport({
  className,
  ...props
}: NavigationMenuViewportProps): ReactElement {
  return (
    <BaseNavigationMenu.Viewport
      data-slot="navigation-menu-viewport"
      {...props}
      className={cn(navigationMenuSlots.viewport, className)}
    />
  );
}

export interface NavigationMenuArrowProps
  extends Omit<BaseNavigationMenu.Arrow.Props, "className"> {
  className?: string | undefined;
}

/** An optional arrow toward the open trigger; put it in the Popup before the Viewport. */
export function NavigationMenuArrow({
  className,
  ...props
}: NavigationMenuArrowProps): ReactElement {
  return (
    <BaseNavigationMenu.Arrow
      data-slot="navigation-menu-arrow"
      {...props}
      className={cn(navigationMenuSlots.arrow, className)}
    />
  );
}
