// No "use client" here: the namespace object must be readable from Server Components (FR-5).

export type {
  DialogBackdropProps,
  DialogCloseProps,
  DialogDescriptionProps,
  DialogPopupProps,
  DialogPortalProps,
  DialogRootProps,
  DialogTitleProps,
  DialogTriggerProps,
  DialogViewportProps,
} from "./dialog";
export {
  createDialogHandle as createHandle,
  DialogBackdrop as Backdrop,
  DialogClose as Close,
  DialogDescription as Description,
  DialogPopup as Popup,
  DialogPortal as Portal,
  DialogRoot as Root,
  DialogTitle as Title,
  DialogTrigger as Trigger,
  DialogViewport as Viewport,
} from "./dialog";
