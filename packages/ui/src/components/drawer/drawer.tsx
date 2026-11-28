"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { createContext, type ReactElement, useContext, useState } from "react";
import { cn } from "../../core/cn";
import { useMergedRefs } from "../../core/merge-refs";
import { Placed, Placement, Unplaced } from "../../core/placed";
import { useOpenState, useScrollLock } from "../../core/scroll-lock";
import { drawerSlots } from "./drawer-variants";
import "./drawer.css";

// Parts without a look of their own come straight from Base UI.

export type DrawerRootProps<Payload = unknown> = BaseDrawer.Root.Props<Payload>;
export type DrawerTriggerProps<Payload = unknown> = BaseDrawer.Trigger.Props<Payload>;
export type DrawerCloseProps = BaseDrawer.Close.Props;
export type DrawerProviderProps = BaseDrawer.Provider.Props;
export type DrawerVirtualKeyboardProviderProps = BaseDrawer.VirtualKeyboardProvider.Props;

/** Whether the open drawer holds the page's scroll (modal, in the sense of Base UI's `true`). */
const LockContext = createContext(false);

/** Whether the part is inside a Viewport, which Base UI needs around the Popup to swipe. */
const ViewportContext = createContext(false);

/**
 * Base UI's Root. The sheet sits at the edge it is swiped away to: `swipeDirection` `down` (the
 * default) is a bottom sheet, `up` a top one, `left` and `right` sit at that edge. A modal drawer
 * (the default) works as Base UI's: focus is trapped and the page behind is inert. The page's
 * scroll is also held by OwsemUI's lock (core/scroll-lock), which puts back the `overflow` Base
 * UI sets on the page, so its text is not drawn again while the drawer is open. Opened by touch,
 * Base UI's own lock stands.
 */
export function DrawerRoot<Payload = unknown>(props: DrawerRootProps<Payload>): ReactElement {
  const { open, onOpenChange } = useOpenState(props);
  return (
    <LockContext.Provider value={open && (props.modal ?? true) === true}>
      <BaseDrawer.Root {...props} onOpenChange={onOpenChange} />
    </LockContext.Provider>
  );
}
/** Shares the open state of every drawer inside it with `Indent`. */
export const DrawerProvider: typeof BaseDrawer.Provider = BaseDrawer.Provider;
/** The button that opens the drawer; pass your button to `render`. */
export const DrawerTrigger: typeof BaseDrawer.Trigger = BaseDrawer.Trigger;
/** A button that shuts the drawer; pass your button to `render`. */
export const DrawerClose: typeof BaseDrawer.Close = BaseDrawer.Close;
/** Keeps a drawer with a form above the software keyboard. */
export const DrawerVirtualKeyboardProvider: typeof BaseDrawer.VirtualKeyboardProvider =
  BaseDrawer.VirtualKeyboardProvider;
/** Links a Root to triggers placed elsewhere (detached triggers), and opens it from code. */
export const createDrawerHandle: typeof BaseDrawer.createHandle = BaseDrawer.createHandle;

export interface DrawerBackdropProps extends Omit<BaseDrawer.Backdrop.Props, "className"> {
  className?: string | undefined;
}

/**
 * The scrim. Portal draws one, so write this only to change it. It fades out as the sheet is
 * swiped away. Unlike Base UI's, it also renders in a nested drawer, where it dims the parent;
 * `forceRender={false}` turns that off.
 */
export function DrawerBackdrop({
  className,
  forceRender = true,
  ...props
}: DrawerBackdropProps): ReactElement {
  return (
    <BaseDrawer.Backdrop
      data-slot="drawer-backdrop"
      {...props}
      className={cn(drawerSlots.backdrop, className)}
      forceRender={forceRender}
    />
  );
}

export interface DrawerPortalProps extends Omit<BaseDrawer.Portal.Props, "className"> {
  className?: string | undefined;
  /**
   * Whether to draw the scrim, unless a `Drawer.Backdrop` among the children replaces it. Default
   * `true`; set it to `false` for a drawer that leaves the page undimmed.
   */
  backdrop?: boolean | undefined;
}

/** Moves the drawer to the end of the body, or into `container`, and draws the scrim behind it. */
export function DrawerPortal({
  backdrop = true,
  children,
  ...props
}: DrawerPortalProps): ReactElement {
  return (
    <BaseDrawer.Portal data-slot="drawer-portal" {...props}>
      {backdrop ? <DrawerBackdrop /> : null}
      {/* A drawer nested in this one is not in a viewport yet. */}
      <ViewportContext.Provider value={false}>
        <Placed>{children}</Placed>
      </ViewportContext.Provider>
    </BaseDrawer.Portal>
  );
}

export interface DrawerViewportProps extends Omit<BaseDrawer.Viewport.Props, "className"> {
  className?: string | undefined;
}

/**
 * The layer that takes the swipe. Base UI needs it around the Popup, so the Popup draws one when
 * it is not inside one; write it only to change it.
 */
export function DrawerViewport({ className, ...props }: DrawerViewportProps): ReactElement {
  return (
    <ViewportContext.Provider value>
      <BaseDrawer.Viewport
        data-slot="drawer-viewport"
        {...props}
        className={cn(drawerSlots.viewport, className)}
      />
    </ViewportContext.Provider>
  );
}

export interface DrawerPopupProps extends Omit<BaseDrawer.Popup.Props, "className"> {
  className?: string | undefined;
}

/**
 * The sheet: the panel material with the popup shadow, at the edge the swipe direction names,
 * with the radius on the corners that face the page. It follows the finger while swiped. Without a
 * Portal around it, it draws one, with the scrim. It takes the text direction from
 * DirectionProvider, since the portal leaves the subtree that sets `dir`.
 */
export function DrawerPopup({
  className,
  children,
  ref,
  ...props
}: DrawerPopupProps): ReactElement {
  const direction = useDirection();
  const [self, setSelf] = useState<HTMLDivElement | null>(null);
  useScrollLock(self, useContext(LockContext));
  const merged = useMergedRefs(setSelf, ref);
  const inViewport = useContext(ViewportContext);
  const popup = (
    <BaseDrawer.Popup
      data-slot="drawer-popup"
      dir={direction}
      {...props}
      ref={merged}
      className={cn(drawerSlots.popup, className)}
    >
      <Unplaced>{children}</Unplaced>
    </BaseDrawer.Popup>
  );
  return (
    <Placement portal={DrawerPortal}>
      {inViewport ? popup : <DrawerViewport>{popup}</DrawerViewport>}
    </Placement>
  );
}

export interface DrawerContentProps extends Omit<BaseDrawer.Content.Props, "className"> {
  className?: string | undefined;
}

/**
 * Optional: the part of the sheet that scrolls, and that a mouse drag selects text in instead of
 * swiping. A touch swipe on it scrolls first and swipes the sheet only from its top.
 */
export function DrawerContent({ className, ...props }: DrawerContentProps): ReactElement {
  return (
    <BaseDrawer.Content
      data-slot="drawer-content"
      {...props}
      className={cn(drawerSlots.content, className)}
    />
  );
}

export interface DrawerTitleProps extends Omit<BaseDrawer.Title.Props, "className"> {
  className?: string | undefined;
}

/** The drawer's heading; it names the drawer for assistive technology. */
export function DrawerTitle({ className, ...props }: DrawerTitleProps): ReactElement {
  return (
    <BaseDrawer.Title
      data-slot="drawer-title"
      {...props}
      className={cn(drawerSlots.title, className)}
    />
  );
}

export interface DrawerDescriptionProps extends Omit<BaseDrawer.Description.Props, "className"> {
  className?: string | undefined;
}

/** A muted line under the title; it describes the drawer for assistive technology. */
export function DrawerDescription({ className, ...props }: DrawerDescriptionProps): ReactElement {
  return (
    <BaseDrawer.Description
      data-slot="drawer-description"
      {...props}
      className={cn(drawerSlots.description, className)}
    />
  );
}

export interface DrawerSwipeAreaProps extends Omit<BaseDrawer.SwipeArea.Props, "className"> {
  className?: string | undefined;
}

/**
 * An invisible strip at the edge the drawer comes from: a swipe from it opens the drawer. Place
 * it once, inside the Root, next to the Trigger.
 */
export function DrawerSwipeArea({ className, ...props }: DrawerSwipeAreaProps): ReactElement {
  return (
    <BaseDrawer.SwipeArea
      data-slot="drawer-swipe-area"
      {...props}
      className={cn(drawerSlots.swipeArea, className)}
    />
  );
}

export interface DrawerIndentProps extends Omit<BaseDrawer.Indent.Props, "className"> {
  className?: string | undefined;
}

/**
 * Wraps the page, inside a Provider: while any drawer in it is open the page recedes a little,
 * with `data-active`.
 */
export function DrawerIndent({ className, ...props }: DrawerIndentProps): ReactElement {
  return (
    <BaseDrawer.Indent
      data-slot="drawer-indent"
      {...props}
      className={cn(drawerSlots.indent, className)}
    />
  );
}

export interface DrawerIndentBackgroundProps
  extends Omit<BaseDrawer.IndentBackground.Props, "className"> {
  className?: string | undefined;
}

/** Placed before the Indent: the layer that shows around the receded page. */
export function DrawerIndentBackground({
  className,
  ...props
}: DrawerIndentBackgroundProps): ReactElement {
  return (
    <BaseDrawer.IndentBackground
      data-slot="drawer-indent-background"
      {...props}
      className={cn(drawerSlots.indentBackground, className)}
    />
  );
}
