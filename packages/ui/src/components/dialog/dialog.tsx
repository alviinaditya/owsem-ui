"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import { createContext, type ReactElement, useCallback, useContext, useRef, useState } from "react";
import { cn } from "../../core/cn";
import { useMergedRefs } from "../../core/merge-refs";
import { useOpenState, useScrollLock } from "../../core/scroll-lock";
import { dialogSlots } from "./dialog-variants";
import "./dialog.css";

// Parts without a look of their own come straight from Base UI.

export type DialogRootProps<Payload = unknown> = BaseDialog.Root.Props<Payload>;
export type DialogTriggerProps<Payload = unknown> = BaseDialog.Trigger.Props<Payload>;
export type DialogCloseProps = BaseDialog.Close.Props;

/** Whether the open dialog holds the page's scroll (modal, in the sense of Base UI's `true`). */
const LockContext = createContext(false);

/**
 * Base UI's Root. A modal dialog (the default) works as Base UI's: focus is trapped and the page
 * behind is inert. The page's scroll is also held by OwsemUI's lock (core/scroll-lock), which
 * puts back the `overflow` Base UI sets on the page, so its text is not drawn again while the
 * dialog is open. Opened by touch, Base UI's own lock stands.
 */
export function DialogRoot<Payload = unknown>(props: DialogRootProps<Payload>): ReactElement {
  const { open, onOpenChange } = useOpenState(props);
  return (
    <LockContext.Provider value={open && (props.modal ?? true) === true}>
      <BaseDialog.Root {...props} onOpenChange={onOpenChange} />
    </LockContext.Provider>
  );
}
/** The button that opens the dialog; pass your button to `render`. */
export const DialogTrigger: typeof BaseDialog.Trigger = BaseDialog.Trigger;
/** A button that shuts the dialog; pass your button to `render`. */
export const DialogClose: typeof BaseDialog.Close = BaseDialog.Close;
/** Links a Root to triggers placed elsewhere (detached triggers), and opens it from code. */
export const createDialogHandle: typeof BaseDialog.createHandle = BaseDialog.createHandle;

export interface DialogBackdropProps extends Omit<BaseDialog.Backdrop.Props, "className"> {
  className?: string | undefined;
}

/**
 * The scrim. Portal draws one, so write this only to change it. Unlike Base UI's, it also renders
 * in a nested dialog, where it dims the parent; `forceRender={false}` turns that off.
 */
export function DialogBackdrop({
  className,
  forceRender = true,
  ...props
}: DialogBackdropProps): ReactElement {
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-backdrop"
      {...props}
      className={cn(dialogSlots.backdrop, className)}
      forceRender={forceRender}
    />
  );
}

export interface DialogPortalProps extends Omit<BaseDialog.Portal.Props, "className"> {
  className?: string | undefined;
  /**
   * Whether to draw the scrim, unless a `Dialog.Backdrop` among the children replaces it. Default
   * `true`; set it to `false` for a dialog that leaves the page undimmed.
   */
  backdrop?: boolean | undefined;
}

/** Moves the dialog to the end of the body, or into `container`, and draws the scrim behind it. */
export function DialogPortal({
  backdrop = true,
  children,
  ...props
}: DialogPortalProps): ReactElement {
  return (
    <BaseDialog.Portal data-slot="dialog-portal" {...props}>
      {backdrop ? <DialogBackdrop /> : null}
      {children}
    </BaseDialog.Portal>
  );
}

export interface DialogViewportProps extends Omit<BaseDialog.Viewport.Props, "className"> {
  className?: string | undefined;
}

/** Optional, around the Popup: long content then scrolls here, with the popup at its full height. */
export function DialogViewport({ className, ...props }: DialogViewportProps): ReactElement {
  return (
    <BaseDialog.Viewport
      data-slot="dialog-viewport"
      {...props}
      className={cn(dialogSlots.viewport, className)}
    />
  );
}

export interface DialogPopupProps extends Omit<BaseDialog.Popup.Props, "className"> {
  className?: string | undefined;
}

/**
 * The panel: the panel material with the popup shadow. It takes the text direction from
 * DirectionProvider, since the portal leaves the subtree that sets `dir`. A dialog too long to
 * show whole takes focus itself, so it opens at its start, not scrolled to a button at its end.
 */
export function DialogPopup({
  className,
  initialFocus,
  ref,
  ...props
}: DialogPopupProps): ReactElement {
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
    <BaseDialog.Popup
      data-slot="dialog-popup"
      dir={direction}
      {...props}
      ref={merged}
      className={cn(dialogSlots.popup, className)}
      initialFocus={
        initialFocus ??
        (() => {
          const el = popup.current;
          const scroller = el?.closest('[data-slot="dialog-viewport"]') ?? el;
          return scroller && scroller.scrollHeight > scroller.clientHeight ? el : true;
        })
      }
    />
  );
}

export interface DialogTitleProps extends Omit<BaseDialog.Title.Props, "className"> {
  className?: string | undefined;
}

/** The dialog's heading; it names the dialog for assistive technology. */
export function DialogTitle({ className, ...props }: DialogTitleProps): ReactElement {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      {...props}
      className={cn(dialogSlots.title, className)}
    />
  );
}

export interface DialogDescriptionProps extends Omit<BaseDialog.Description.Props, "className"> {
  className?: string | undefined;
}

/** A muted line under the title; it describes the dialog for assistive technology. */
export function DialogDescription({ className, ...props }: DialogDescriptionProps): ReactElement {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      {...props}
      className={cn(dialogSlots.description, className)}
    />
  );
}
