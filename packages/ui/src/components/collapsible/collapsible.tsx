"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import { cn } from "../../core/cn";
import {
  type CollapsibleSize,
  type CollapsibleVariantProps,
  collapsibleContentVariants,
  collapsibleSlots,
  collapsibleTriggerVariants,
} from "./collapsible-variants";
import "./collapsible.css";

// The Root's size reaches its Trigger and Panel.
const SizeContext = createContext<CollapsibleSize>("md");

export interface CollapsibleRootProps
  extends Omit<BaseCollapsible.Root.Props, "className">,
    CollapsibleVariantProps {
  className?: string | undefined;
}

/** The group of a trigger and its panel. `size` applies to both. It has no look of its own. */
export function CollapsibleRoot({
  size = "md",
  className,
  ...props
}: CollapsibleRootProps): ReactElement {
  return (
    <SizeContext.Provider value={size}>
      <BaseCollapsible.Root
        data-slot="collapsible"
        {...props}
        className={className}
        data-size={size}
      />
    </SizeContext.Provider>
  );
}

/** A chevron of two strokes that turn about their own centers: down, flat, then up. */
function Chevron(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path className={collapsibleSlots.stroke} data-side="start" d="m6 9 6 6" />
      <path className={collapsibleSlots.stroke} data-side="end" d="m12 15 6-6" />
    </svg>
  );
}

export interface CollapsibleTriggerProps
  extends Omit<BaseCollapsible.Trigger.Props, "className">,
    CollapsibleVariantProps {
  className?: string | undefined;
  /** Replaces the chevron; `null` leaves it out. It sits at the end of the trigger. */
  icon?: ReactNode;
}

/** A quiet button: its label at the start and a chevron at the end that turns when open. */
export function CollapsibleTrigger({
  size: ownSize,
  icon,
  className,
  children,
  ...props
}: CollapsibleTriggerProps): ReactElement {
  const inherited = useContext(SizeContext);
  const size = ownSize ?? inherited;
  return (
    <BaseCollapsible.Trigger
      data-slot="collapsible-trigger"
      {...props}
      className={cn(collapsibleTriggerVariants({ size }), className)}
      data-size={size}
    >
      {children}
      {icon === null ? null : (
        <span data-slot="collapsible-icon" className={collapsibleSlots.icon}>
          {icon ?? <Chevron />}
        </span>
      )}
    </BaseCollapsible.Trigger>
  );
}

export interface CollapsiblePanelProps extends Omit<BaseCollapsible.Panel.Props, "className"> {
  className?: string | undefined;
}

/**
 * The content, whose height opens and closes. Its children sit in an inner element that has the
 * padding, so the animated box has none.
 */
export function CollapsiblePanel({
  className,
  children,
  ...props
}: CollapsiblePanelProps): ReactElement {
  const size = useContext(SizeContext);
  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-panel"
      {...props}
      className={cn(collapsibleSlots.panel, className)}
    >
      <div data-slot="collapsible-content" className={collapsibleContentVariants({ size })}>
        {children}
      </div>
    </BaseCollapsible.Panel>
  );
}

export declare namespace CollapsibleRoot {
  type Props = CollapsibleRootProps;
  type State = BaseCollapsible.Root.State;
  type ChangeEventReason = BaseCollapsible.Root.ChangeEventReason;
  type ChangeEventDetails = BaseCollapsible.Root.ChangeEventDetails;
}

export declare namespace CollapsibleTrigger {
  type Props = CollapsibleTriggerProps;
  type State = BaseCollapsible.Trigger.State;
}

export declare namespace CollapsiblePanel {
  type Props = CollapsiblePanelProps;
  type State = BaseCollapsible.Panel.State;
}
