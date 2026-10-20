"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { type ForwardRefExoticComponent, forwardRef, type RefAttributes } from "react";
import { withClassName } from "../../core/class-name";
import "./popover.css";

const cls = {
  positioner: "ow-popover-positioner",
  popup: "ow-popover-popup",
  arrow: "ow-popover-arrow",
  title: "ow-popover-title",
  description: "ow-popover-description",
} as const;

// Parts without a look of their own come straight from Base UI.

export type PopoverRootProps<Payload = unknown> = BasePopover.Root.Props<Payload>;
export type PopoverTriggerProps<Payload = unknown> = BasePopover.Trigger.Props<Payload>;
export type PopoverPortalProps = BasePopover.Portal.Props;
export type PopoverBackdropProps = BasePopover.Backdrop.Props;
export type PopoverCloseProps = BasePopover.Close.Props;

export const PopoverRoot: typeof BasePopover.Root = BasePopover.Root;
/** The button that opens the popover; pass your button to `render`. */
export const PopoverTrigger: typeof BasePopover.Trigger = BasePopover.Trigger;
export const PopoverPortal: typeof BasePopover.Portal = BasePopover.Portal;
export const PopoverBackdrop: typeof BasePopover.Backdrop = BasePopover.Backdrop;
/** A button that shuts the popover; pass your button to `render`. */
export const PopoverClose: typeof BasePopover.Close = BasePopover.Close;
export const PopoverViewport: typeof BasePopover.Viewport = BasePopover.Viewport;
/** Links a Root to triggers placed elsewhere (detached triggers), and opens it from code. */
export const createPopoverHandle: typeof BasePopover.createHandle = BasePopover.createHandle;

export type PopoverPositionerProps = Omit<BasePopover.Positioner.Props, "ref">;

/**
 * Places the popover 10px from its trigger, room for the arrow, and keeps the arrow off the
 * rounded corners. It takes the text direction from DirectionProvider, since the portal leaves
 * the subtree that sets `dir` (FR-16).
 */
export const PopoverPositioner: ForwardRefExoticComponent<
  PopoverPositionerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, PopoverPositionerProps>(function PopoverPositioner(
  { className, sideOffset = 10, arrowPadding = 12, ...props },
  ref,
) {
  const direction = useDirection();
  return (
    <BasePopover.Positioner
      ref={ref}
      className={withClassName(cls.positioner, className)}
      sideOffset={sideOffset}
      arrowPadding={arrowPadding}
      dir={direction}
      {...props}
    />
  );
});

export type PopoverPopupProps = Omit<BasePopover.Popup.Props, "ref">;

/** The panel: the panel material with the popup shadow. */
export const PopoverPopup: ForwardRefExoticComponent<
  PopoverPopupProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, PopoverPopupProps>(function PopoverPopup(
  { className, ...props },
  ref,
) {
  return <BasePopover.Popup ref={ref} className={withClassName(cls.popup, className)} {...props} />;
});

export type PopoverArrowProps = Omit<BasePopover.Arrow.Props, "ref">;

/** An optional arrow toward the trigger, with the panel's edge; Base UI keeps it on the trigger. */
export const PopoverArrow: ForwardRefExoticComponent<
  PopoverArrowProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, PopoverArrowProps>(function PopoverArrow(
  { className, ...props },
  ref,
) {
  return <BasePopover.Arrow ref={ref} className={withClassName(cls.arrow, className)} {...props} />;
});

export type PopoverTitleProps = Omit<BasePopover.Title.Props, "ref">;

/** The popover's heading; it names the dialog for assistive technology. */
export const PopoverTitle: ForwardRefExoticComponent<
  PopoverTitleProps & RefAttributes<HTMLHeadingElement>
> = forwardRef<HTMLHeadingElement, PopoverTitleProps>(function PopoverTitle(
  { className, ...props },
  ref,
) {
  return <BasePopover.Title ref={ref} className={withClassName(cls.title, className)} {...props} />;
});

export type PopoverDescriptionProps = Omit<BasePopover.Description.Props, "ref">;

/** A muted line under the title; it describes the dialog for assistive technology. */
export const PopoverDescription: ForwardRefExoticComponent<
  PopoverDescriptionProps & RefAttributes<HTMLParagraphElement>
> = forwardRef<HTMLParagraphElement, PopoverDescriptionProps>(function PopoverDescription(
  { className, ...props },
  ref,
) {
  return (
    <BasePopover.Description
      ref={ref}
      className={withClassName(cls.description, className)}
      {...props}
    />
  );
});
