// No "use client" here: the namespace object must be readable from Server Components.

export type {
  TooltipArrowProps,
  TooltipPopupProps,
  TooltipPortalProps,
  TooltipPositionerProps,
  TooltipProviderProps,
  TooltipRootProps,
  TooltipTriggerProps,
} from "./tooltip";
export {
  createTooltipHandle as createHandle,
  TooltipArrow as Arrow,
  TooltipPopup as Popup,
  TooltipPortal as Portal,
  TooltipPositioner as Positioner,
  TooltipProvider as Provider,
  TooltipRoot as Root,
  TooltipTrigger as Trigger,
  TooltipViewport as Viewport,
} from "./tooltip";
