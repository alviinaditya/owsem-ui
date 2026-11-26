"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type { ReactElement } from "react";
import { cn } from "../../core/cn";
import { previewCardSlots } from "./preview-card-variants";
import "./preview-card.css";

// Parts without a look of their own come straight from Base UI.

export type PreviewCardRootProps<Payload = unknown> = BasePreviewCard.Root.Props<Payload>;
export type PreviewCardPortalProps = BasePreviewCard.Portal.Props;
export type PreviewCardBackdropProps = BasePreviewCard.Backdrop.Props;

export const PreviewCardRoot: typeof BasePreviewCard.Root = BasePreviewCard.Root;
export const PreviewCardPortal: typeof BasePreviewCard.Portal = BasePreviewCard.Portal;
export const PreviewCardBackdrop: typeof BasePreviewCard.Backdrop = BasePreviewCard.Backdrop;
export const PreviewCardViewport: typeof BasePreviewCard.Viewport = BasePreviewCard.Viewport;
/** Links a Root to triggers placed elsewhere (detached triggers), and opens it from code. */
export const createPreviewCardHandle: typeof BasePreviewCard.createHandle =
  BasePreviewCard.createHandle;

export interface PreviewCardTriggerProps<Payload = unknown>
  extends Omit<BasePreviewCard.Trigger.Props<Payload>, "className"> {
  className?: string | undefined;
}

/**
 * The link the card previews. It takes the color of the text around it and a quiet underline, and
 * opens the card by hover or focus after `delay` (600 ms); touch does not open it.
 */
export function PreviewCardTrigger<Payload = unknown>({
  className,
  ...props
}: PreviewCardTriggerProps<Payload>): ReactElement {
  return (
    <BasePreviewCard.Trigger
      data-slot="preview-card-trigger"
      {...props}
      className={cn(previewCardSlots.trigger, className)}
    />
  );
}

export interface PreviewCardPositionerProps
  extends Omit<BasePreviewCard.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Places the card 10px from its trigger, room for the arrow, and keeps the arrow off the rounded
 * corners. It takes the text direction from DirectionProvider, since the portal leaves the
 * subtree that sets `dir`.
 */
export function PreviewCardPositioner({
  className,
  sideOffset = 10,
  arrowPadding = 12,
  ...props
}: PreviewCardPositionerProps): ReactElement {
  const direction = useDirection();
  return (
    <BasePreviewCard.Positioner
      data-slot="preview-card-positioner"
      dir={direction}
      {...props}
      className={cn(previewCardSlots.positioner, className)}
      sideOffset={sideOffset}
      arrowPadding={arrowPadding}
    />
  );
}

export interface PreviewCardPopupProps extends Omit<BasePreviewCard.Popup.Props, "className"> {
  className?: string | undefined;
}

/** The card: the panel material with the popup shadow, for plain content such as an image and text. */
export function PreviewCardPopup({ className, ...props }: PreviewCardPopupProps): ReactElement {
  return (
    <BasePreviewCard.Popup
      data-slot="preview-card-popup"
      {...props}
      className={cn(previewCardSlots.popup, className)}
    />
  );
}

export interface PreviewCardArrowProps extends Omit<BasePreviewCard.Arrow.Props, "className"> {
  className?: string | undefined;
}

/** An optional arrow toward the trigger, with the card's edge; Base UI keeps it on the trigger. */
export function PreviewCardArrow({ className, ...props }: PreviewCardArrowProps): ReactElement {
  return (
    <BasePreviewCard.Arrow
      data-slot="preview-card-arrow"
      {...props}
      className={cn(previewCardSlots.arrow, className)}
    />
  );
}
