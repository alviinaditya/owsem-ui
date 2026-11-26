// No "use client" here: the namespace object must be readable from Server Components.

export type {
  AlertDialogBackdropProps,
  AlertDialogCloseProps,
  AlertDialogDescriptionProps,
  AlertDialogPopupProps,
  AlertDialogPortalProps,
  AlertDialogRootProps,
  AlertDialogTitleProps,
  AlertDialogTriggerProps,
  AlertDialogViewportProps,
} from "./alert-dialog";
export {
  AlertDialogBackdrop as Backdrop,
  AlertDialogClose as Close,
  AlertDialogDescription as Description,
  AlertDialogPopup as Popup,
  AlertDialogPortal as Portal,
  AlertDialogRoot as Root,
  AlertDialogTitle as Title,
  AlertDialogTrigger as Trigger,
  AlertDialogViewport as Viewport,
  createAlertDialogHandle as createHandle,
} from "./alert-dialog";
