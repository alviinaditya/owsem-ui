"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement } from "react";
import { cn } from "../../core/cn";
import { tooltipSlots } from "./tooltip-variants";
import "./tooltip.css";

// Parts without a look of their own come straight from Base UI.

export type TooltipProviderProps = BaseTooltip.Provider.Props;
export type TooltipRootProps<Payload = unknown> = BaseTooltip.Root.Props<Payload>;
export type TooltipTriggerProps<Payload = unknown> = BaseTooltip.Trigger.Props<Payload>;
export type TooltipPortalProps = BaseTooltip.Portal.Props;

/** Shares one delay between tooltips: once one is open, the next opens at once, unanimated. */
export const TooltipProvider: typeof BaseTooltip.Provider = BaseTooltip.Provider;
export const TooltipRoot: typeof BaseTooltip.Root = BaseTooltip.Root;
/** The element the tooltip labels; pass your button to `render`. */
export const TooltipTrigger: typeof BaseTooltip.Trigger = BaseTooltip.Trigger;
export const TooltipPortal: typeof BaseTooltip.Portal = BaseTooltip.Portal;
export const TooltipViewport: typeof BaseTooltip.Viewport = BaseTooltip.Viewport;
/** Links a Root to triggers placed elsewhere (detached triggers). */
export const createTooltipHandle: typeof BaseTooltip.createHandle = BaseTooltip.createHandle;

export interface TooltipPositionerProps extends Omit<BaseTooltip.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Places the tooltip 8px from its trigger, room for the arrow. It takes the text direction from
 * DirectionProvider, since the portal leaves the subtree that sets `dir`.
 */
export function TooltipPositioner({
  className,
  sideOffset = 8,
  ...props
}: TooltipPositionerProps): ReactElement {
  const direction = useDirection();
  return (
    <BaseTooltip.Positioner
      data-slot="tooltip-positioner"
      dir={direction}
      {...props}
      className={cn(tooltipSlots.positioner, className)}
      sideOffset={sideOffset}
    />
  );
}

export interface TooltipPopupProps extends Omit<BaseTooltip.Popup.Props, "className"> {
  className?: string | undefined;
}

/** The label: a solid dark surface, with no material. A `kbd` inside reads as its shortcut. */
export function TooltipPopup({ className, ...props }: TooltipPopupProps): ReactElement {
  return (
    <BaseTooltip.Popup
      data-slot="tooltip-popup"
      {...props}
      className={cn(tooltipSlots.popup, className)}
    />
  );
}

export interface TooltipArrowProps extends Omit<BaseTooltip.Arrow.Props, "className"> {
  className?: string | undefined;
}

/** A small triangle toward the trigger; Base UI keeps it centered on the trigger. */
export function TooltipArrow({ className, ...props }: TooltipArrowProps): ReactElement {
  return (
    <BaseTooltip.Arrow
      data-slot="tooltip-arrow"
      {...props}
      className={cn(tooltipSlots.arrow, className)}
    />
  );
}
