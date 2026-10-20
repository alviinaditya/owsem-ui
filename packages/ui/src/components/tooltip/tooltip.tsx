"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { type ForwardRefExoticComponent, forwardRef, type RefAttributes } from "react";
import { withClassName } from "../../core/class-name";
import "./tooltip.css";

const cls = {
  positioner: "ow-tooltip-positioner",
  popup: "ow-tooltip-popup",
  arrow: "ow-tooltip-arrow",
} as const;

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

export type TooltipPositionerProps = Omit<BaseTooltip.Positioner.Props, "ref">;

/**
 * Places the tooltip 8px from its trigger, room for the arrow. It takes the text direction from
 * DirectionProvider, since the portal leaves the subtree that sets `dir` (FR-16).
 */
export const TooltipPositioner: ForwardRefExoticComponent<
  TooltipPositionerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, TooltipPositionerProps>(function TooltipPositioner(
  { className, sideOffset = 8, ...props },
  ref,
) {
  const direction = useDirection();
  return (
    <BaseTooltip.Positioner
      ref={ref}
      className={withClassName(cls.positioner, className)}
      sideOffset={sideOffset}
      dir={direction}
      {...props}
    />
  );
});

export type TooltipPopupProps = Omit<BaseTooltip.Popup.Props, "ref">;

/** The label: a solid dark surface, with no material. A `kbd` inside reads as its shortcut. */
export const TooltipPopup: ForwardRefExoticComponent<
  TooltipPopupProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, TooltipPopupProps>(function TooltipPopup(
  { className, ...props },
  ref,
) {
  return <BaseTooltip.Popup ref={ref} className={withClassName(cls.popup, className)} {...props} />;
});

export type TooltipArrowProps = Omit<BaseTooltip.Arrow.Props, "ref">;

/** A small triangle toward the trigger; Base UI keeps it centered on the trigger. */
export const TooltipArrow: ForwardRefExoticComponent<
  TooltipArrowProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, TooltipArrowProps>(function TooltipArrow(
  { className, ...props },
  ref,
) {
  return <BaseTooltip.Arrow ref={ref} className={withClassName(cls.arrow, className)} {...props} />;
});
