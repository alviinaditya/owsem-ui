// No "use client" here: the namespace object must be readable from Server Components (FR-5).

export type {
  PopoverArrowProps,
  PopoverBackdropProps,
  PopoverCloseProps,
  PopoverDescriptionProps,
  PopoverPopupProps,
  PopoverPortalProps,
  PopoverPositionerProps,
  PopoverRootProps,
  PopoverTitleProps,
  PopoverTriggerProps,
} from "./popover";
export {
  createPopoverHandle as createHandle,
  PopoverArrow as Arrow,
  PopoverBackdrop as Backdrop,
  PopoverClose as Close,
  PopoverDescription as Description,
  PopoverPopup as Popup,
  PopoverPortal as Portal,
  PopoverPositioner as Positioner,
  PopoverRoot as Root,
  PopoverTitle as Title,
  PopoverTrigger as Trigger,
  PopoverViewport as Viewport,
} from "./popover";
