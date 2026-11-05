"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
  useImperativeHandle,
  useRef,
} from "react";
import { withClassName } from "../../core/class-name";
import "./dialog.css";

const cls = {
  backdrop: "ow-dialog__backdrop",
  viewport: "ow-dialog__viewport",
  popup: "ow-dialog__popup",
  title: "ow-dialog__title",
  description: "ow-dialog__description",
} as const;

// Parts without a look of their own come straight from Base UI.

export type DialogRootProps<Payload = unknown> = BaseDialog.Root.Props<Payload>;
export type DialogTriggerProps<Payload = unknown> = BaseDialog.Trigger.Props<Payload>;
export type DialogCloseProps = BaseDialog.Close.Props;

export const DialogRoot: typeof BaseDialog.Root = BaseDialog.Root;
/** The button that opens the dialog; pass your button to `render`. */
export const DialogTrigger: typeof BaseDialog.Trigger = BaseDialog.Trigger;
/** A button that shuts the dialog; pass your button to `render`. */
export const DialogClose: typeof BaseDialog.Close = BaseDialog.Close;
/** Links a Root to triggers placed elsewhere (detached triggers), and opens it from code. */
export const createDialogHandle: typeof BaseDialog.createHandle = BaseDialog.createHandle;

export type DialogBackdropProps = Omit<BaseDialog.Backdrop.Props, "ref">;

/**
 * The scrim. Portal draws one, so write this only to change it. Unlike Base UI's, it also renders
 * in a nested dialog, where it dims the parent; `forceRender={false}` turns that off.
 */
export const DialogBackdrop: ForwardRefExoticComponent<
  DialogBackdropProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DialogBackdropProps>(function DialogBackdrop(
  { className, forceRender = true, ...props },
  ref,
) {
  return (
    <BaseDialog.Backdrop
      ref={ref}
      className={withClassName(cls.backdrop, className)}
      forceRender={forceRender}
      {...props}
    />
  );
});

export interface DialogPortalProps extends Omit<BaseDialog.Portal.Props, "ref"> {
  /**
   * Whether to draw the scrim, unless a `Dialog.Backdrop` among the children replaces it. Default
   * `true`; set it to `false` for a dialog that leaves the page undimmed.
   */
  backdrop?: boolean | undefined;
}

/** Moves the dialog to the end of the body, or into `container`, and draws the scrim behind it. */
export const DialogPortal: ForwardRefExoticComponent<
  DialogPortalProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DialogPortalProps>(function DialogPortal(
  { backdrop = true, children, ...props },
  ref,
) {
  return (
    <BaseDialog.Portal ref={ref} {...props}>
      {backdrop ? <DialogBackdrop /> : null}
      {children}
    </BaseDialog.Portal>
  );
});

export type DialogViewportProps = Omit<BaseDialog.Viewport.Props, "ref">;

/** Optional, around the Popup: long content then scrolls here, with the popup at its full height. */
export const DialogViewport: ForwardRefExoticComponent<
  DialogViewportProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DialogViewportProps>(function DialogViewport(
  { className, ...props },
  ref,
) {
  return (
    <BaseDialog.Viewport ref={ref} className={withClassName(cls.viewport, className)} {...props} />
  );
});

export type DialogPopupProps = Omit<BaseDialog.Popup.Props, "ref">;

/**
 * The panel: the panel material with the popup shadow. It takes the text direction from
 * DirectionProvider, since the portal leaves the subtree that sets `dir` (FR-16). A dialog too long
 * to show whole takes focus itself, so it opens at its start, not scrolled to a button at its end.
 */
export const DialogPopup: ForwardRefExoticComponent<
  DialogPopupProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DialogPopupProps>(function DialogPopup(
  { className, initialFocus, ...props },
  ref,
) {
  const direction = useDirection();
  const popup = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => popup.current as HTMLDivElement);
  return (
    <BaseDialog.Popup
      ref={popup}
      className={withClassName(cls.popup, className)}
      dir={direction}
      initialFocus={
        initialFocus ??
        (() => {
          const el = popup.current;
          const scroller = el?.closest(`.${cls.viewport}`) ?? el;
          return scroller && scroller.scrollHeight > scroller.clientHeight ? el : true;
        })
      }
      {...props}
    />
  );
});

export type DialogTitleProps = Omit<BaseDialog.Title.Props, "ref">;

/** The dialog's heading; it names the dialog for assistive technology. */
export const DialogTitle: ForwardRefExoticComponent<
  DialogTitleProps & RefAttributes<HTMLHeadingElement>
> = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle(
  { className, ...props },
  ref,
) {
  return <BaseDialog.Title ref={ref} className={withClassName(cls.title, className)} {...props} />;
});

export type DialogDescriptionProps = Omit<BaseDialog.Description.Props, "ref">;

/** A muted line under the title; it describes the dialog for assistive technology. */
export const DialogDescription: ForwardRefExoticComponent<
  DialogDescriptionProps & RefAttributes<HTMLParagraphElement>
> = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(function DialogDescription(
  { className, ...props },
  ref,
) {
  return (
    <BaseDialog.Description
      ref={ref}
      className={withClassName(cls.description, className)}
      {...props}
    />
  );
});
