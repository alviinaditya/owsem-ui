// Generated from components/popover by scripts/build-tailwind.ts; do not edit.
"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { createContext, type ReactElement, useContext, useState } from "react";
import { cn } from "../lib/cn";
import { useMergedRefs } from "../lib/merge-refs";
import { Placed, Placement, Unplaced } from "../lib/placed";
import { useRestingAnchor } from "../lib/resting-anchor";
import { useOpenState, useScrollLock } from "../lib/scroll-lock";
import { popoverSlots } from "./popover-variants";

// Parts without a look of their own come straight from Base UI.

export type PopoverRootProps<Payload = unknown> = BasePopover.Root.Props<Payload>;
export type PopoverTriggerProps<Payload = unknown> = BasePopover.Trigger.Props<Payload>;
export type PopoverPortalProps = BasePopover.Portal.Props;
export type PopoverBackdropProps = BasePopover.Backdrop.Props;
export type PopoverCloseProps = BasePopover.Close.Props;

/** Whether the open popover holds the page's scroll. */
const LockContext = createContext(false);

/**
 * Base UI's Root. Not modal by default. With `modal` (`true`, as Base UI locks the page's scroll
 * for that value only), the page's scroll is held by OwsemUI's lock (core/scroll-lock), which
 * puts back the `overflow` Base UI sets on the page, so its text is not drawn again while the
 * popover is open. Opened by hover or by touch, Base UI's own rules stand.
 */
export function PopoverRoot<Payload = unknown>(props: PopoverRootProps<Payload>): ReactElement {
  const [hover, setHover] = useState(false);
  const { open, onOpenChange } = useOpenState(props);
  return (
    <LockContext.Provider value={open && !hover && props.modal === true}>
      <BasePopover.Root
        {...props}
        onOpenChange={(next, details) => {
          setHover(details.reason === "trigger-hover");
          onOpenChange(next, details);
        }}
      />
    </LockContext.Provider>
  );
}
/** The button that opens the popover; pass your button to `render`. */
export const PopoverTrigger: typeof BasePopover.Trigger = BasePopover.Trigger;
export const PopoverPortal: typeof BasePopover.Portal = BasePopover.Portal;
export const PopoverBackdrop: typeof BasePopover.Backdrop = BasePopover.Backdrop;
/** A button that shuts the popover; pass your button to `render`. */
export const PopoverClose: typeof BasePopover.Close = BasePopover.Close;
export const PopoverViewport: typeof BasePopover.Viewport = BasePopover.Viewport;
/** Links a Root to triggers placed elsewhere (detached triggers), and opens it from code. */
export const createPopoverHandle: typeof BasePopover.createHandle = BasePopover.createHandle;

export interface PopoverPositionerProps extends Omit<BasePopover.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Places the popover 10px from its trigger, room for the arrow, and keeps the arrow off the
 * rounded corners. It takes the text direction from DirectionProvider, since the portal leaves
 * the subtree that sets `dir`, and anchors to the trigger's resting box, not its pressed one.
 */
export function PopoverPositioner({
  className,
  sideOffset = 10,
  arrowPadding = 12,
  ref,
  ...props
}: PopoverPositionerProps): ReactElement {
  const direction = useDirection();
  const resting = useRestingAnchor(ref);
  return (
    <Placed>
      <BasePopover.Positioner
        data-slot="popover-positioner"
        dir={direction}
        anchor={resting.anchor}
        {...props}
        ref={resting.ref}
        className={cn(popoverSlots.positioner, className)}
        sideOffset={sideOffset}
        arrowPadding={arrowPadding}
      />
    </Placed>
  );
}

export interface PopoverPopupProps extends Omit<BasePopover.Popup.Props, "className"> {
  className?: string | undefined;
}

/**
 * The panel: the panel material with the popup shadow. Without a Positioner around it, it draws a
 * Portal and a Positioner.
 */
export function PopoverPopup({
  className,
  children,
  ref,
  ...props
}: PopoverPopupProps): ReactElement {
  const [self, setSelf] = useState<HTMLDivElement | null>(null);
  useScrollLock(self, useContext(LockContext));
  const merged = useMergedRefs(setSelf, ref);
  return (
    <Placement portal={PopoverPortal} positioner={PopoverPositioner}>
      <BasePopover.Popup
        data-slot="popover-popup"
        {...props}
        ref={merged}
        className={cn(popoverSlots.popup, className)}
      >
        <Unplaced>{children}</Unplaced>
      </BasePopover.Popup>
    </Placement>
  );
}

export interface PopoverArrowProps extends Omit<BasePopover.Arrow.Props, "className"> {
  className?: string | undefined;
}

/** An optional arrow toward the trigger, with the panel's edge; Base UI keeps it on the trigger. */
export function PopoverArrow({ className, ...props }: PopoverArrowProps): ReactElement {
  return (
    <BasePopover.Arrow
      data-slot="popover-arrow"
      {...props}
      className={cn(popoverSlots.arrow, className)}
    />
  );
}

export interface PopoverTitleProps extends Omit<BasePopover.Title.Props, "className"> {
  className?: string | undefined;
}

/** The popover's heading; it names the dialog for assistive technology. */
export function PopoverTitle({ className, ...props }: PopoverTitleProps): ReactElement {
  return (
    <BasePopover.Title
      data-slot="popover-title"
      {...props}
      className={cn(popoverSlots.title, className)}
    />
  );
}

export interface PopoverDescriptionProps extends Omit<BasePopover.Description.Props, "className"> {
  className?: string | undefined;
}

/** A muted line under the title; it describes the dialog for assistive technology. */
export function PopoverDescription({ className, ...props }: PopoverDescriptionProps): ReactElement {
  return (
    <BasePopover.Description
      data-slot="popover-description"
      {...props}
      className={cn(popoverSlots.description, className)}
    />
  );
}
