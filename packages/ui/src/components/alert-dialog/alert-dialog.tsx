"use client";

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import { createContext, type ReactElement, useCallback, useContext, useRef, useState } from "react";
import { cn } from "../../core/cn";
import { useMergedRefs } from "../../core/merge-refs";
import { Placed, Placement, Unplaced } from "../../core/placed";
import { useOpenState, useScrollLock } from "../../core/scroll-lock";
import { alertDialogSlots } from "./alert-dialog-variants";
import "./alert-dialog.css";

// Parts without a look of their own come straight from Base UI.

export type AlertDialogRootProps<Payload = unknown> = BaseAlertDialog.Root.Props<Payload>;
export type AlertDialogTriggerProps<Payload = unknown> = BaseAlertDialog.Trigger.Props<Payload>;

/** Whether the open alert dialog holds the page's scroll. It is always modal. */
const LockContext = createContext(false);

/**
 * Base UI's Root: always modal, and a press outside does not shut it. Focus is trapped and the
 * page behind is inert. The page's scroll is also held by OwsemUI's lock (core/scroll-lock), which
 * puts back the `overflow` Base UI sets on the page, so its text is not drawn again while the
 * alert is open. Opened by touch, Base UI's own lock stands.
 */
export function AlertDialogRoot<Payload = unknown>(
  props: AlertDialogRootProps<Payload>,
): ReactElement {
  const { open, onOpenChange } = useOpenState(props);
  return (
    <LockContext.Provider value={open}>
      <BaseAlertDialog.Root {...props} onOpenChange={onOpenChange} />
    </LockContext.Provider>
  );
}
/** The button that opens the alert; pass your button to `render`. */
export const AlertDialogTrigger: typeof BaseAlertDialog.Trigger = BaseAlertDialog.Trigger;
/** Links a Root to triggers placed elsewhere (detached triggers), and opens it from code. */
export const createAlertDialogHandle: typeof BaseAlertDialog.createHandle =
  BaseAlertDialog.createHandle;

export interface AlertDialogCloseProps extends Omit<BaseAlertDialog.Close.Props, "className"> {
  className?: string | undefined;
}

/**
 * A button that shuts the alert; pass your button to `render`. The first one in the popup is the
 * safe answer: it takes the first focus, unless the popup's `initialFocus` says otherwise.
 */
export function AlertDialogClose(props: AlertDialogCloseProps): ReactElement {
  return (
    <BaseAlertDialog.Close
      {...props}
      // Found by this, so it stays.
      data-slot="alert-dialog-close"
    />
  );
}

export interface AlertDialogBackdropProps
  extends Omit<BaseAlertDialog.Backdrop.Props, "className"> {
  className?: string | undefined;
}

/**
 * The scrim. Portal draws one, so write this only to change it. Unlike Base UI's, it also renders
 * in a nested alert, where it dims the parent; `forceRender={false}` turns that off.
 */
export function AlertDialogBackdrop({
  className,
  forceRender = true,
  ...props
}: AlertDialogBackdropProps): ReactElement {
  return (
    <BaseAlertDialog.Backdrop
      data-slot="alert-dialog-backdrop"
      {...props}
      className={cn(alertDialogSlots.backdrop, className)}
      forceRender={forceRender}
    />
  );
}

export interface AlertDialogPortalProps extends Omit<BaseAlertDialog.Portal.Props, "className"> {
  className?: string | undefined;
  /**
   * Whether to draw the scrim, unless an `AlertDialog.Backdrop` among the children replaces it.
   * Default `true`; set it to `false` for an alert that leaves the page undimmed.
   */
  backdrop?: boolean | undefined;
}

/** Moves the alert to the end of the body, or into `container`, and draws the scrim behind it. */
export function AlertDialogPortal({
  backdrop = true,
  children,
  ...props
}: AlertDialogPortalProps): ReactElement {
  return (
    <BaseAlertDialog.Portal data-slot="alert-dialog-portal" {...props}>
      {backdrop ? <AlertDialogBackdrop /> : null}
      <Placed>{children}</Placed>
    </BaseAlertDialog.Portal>
  );
}

export interface AlertDialogViewportProps
  extends Omit<BaseAlertDialog.Viewport.Props, "className"> {
  className?: string | undefined;
}

/** Optional, around the Popup: long content then scrolls here, with the popup at its full height. */
export function AlertDialogViewport({
  className,
  ...props
}: AlertDialogViewportProps): ReactElement {
  return (
    <BaseAlertDialog.Viewport
      {...props}
      // Found by this, so it stays.
      data-slot="alert-dialog-viewport"
      className={cn(alertDialogSlots.viewport, className)}
    />
  );
}

export interface AlertDialogPopupProps extends Omit<BaseAlertDialog.Popup.Props, "className"> {
  className?: string | undefined;
}

/**
 * The panel: the panel material with the popup shadow. Without a Portal around it, it draws one,
 * with the scrim. It takes the text direction from
 * DirectionProvider, since the portal leaves the subtree that sets `dir`. The first focus goes to
 * the first `AlertDialog.Close` in it, the safe answer, wherever it sits in the markup; with none,
 * to the first control, as Base UI does. An alert too long to show whole takes focus itself, so it
 * opens at its start.
 */
export function AlertDialogPopup({
  className,
  initialFocus,
  children,
  ref,
  ...props
}: AlertDialogPopupProps): ReactElement {
  const direction = useDirection();
  const popup = useRef<HTMLDivElement | null>(null);
  const [self, setSelf] = useState<HTMLDivElement | null>(null);
  useScrollLock(self, useContext(LockContext));
  const track = useCallback((el: HTMLDivElement | null) => {
    popup.current = el;
    setSelf(el);
  }, []);
  const merged = useMergedRefs(track, ref);
  return (
    <Placement portal={AlertDialogPortal}>
      <BaseAlertDialog.Popup
        data-slot="alert-dialog-popup"
        dir={direction}
        {...props}
        ref={merged}
        className={cn(alertDialogSlots.popup, className)}
        initialFocus={
          initialFocus ??
          (() => {
            const el = popup.current;
            const scroller = el?.closest('[data-slot="alert-dialog-viewport"]') ?? el;
            if (scroller && scroller.scrollHeight > scroller.clientHeight) return el;
            return el?.querySelector<HTMLElement>('[data-slot="alert-dialog-close"]') ?? true;
          })
        }
      >
        <Unplaced>{children}</Unplaced>
      </BaseAlertDialog.Popup>
    </Placement>
  );
}

export interface AlertDialogTitleProps extends Omit<BaseAlertDialog.Title.Props, "className"> {
  className?: string | undefined;
}

/** The alert's heading; it names the alert for assistive technology. */
export function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps): ReactElement {
  return (
    <BaseAlertDialog.Title
      data-slot="alert-dialog-title"
      {...props}
      className={cn(alertDialogSlots.title, className)}
    />
  );
}

export interface AlertDialogDescriptionProps
  extends Omit<BaseAlertDialog.Description.Props, "className"> {
  className?: string | undefined;
}

/** A muted line under the title; it describes the alert for assistive technology. */
export function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps): ReactElement {
  return (
    <BaseAlertDialog.Description
      data-slot="alert-dialog-description"
      {...props}
      className={cn(alertDialogSlots.description, className)}
    />
  );
}
