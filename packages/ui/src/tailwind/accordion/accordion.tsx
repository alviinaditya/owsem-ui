// Generated from components/accordion by scripts/build-tailwind.ts; do not edit.
"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import { cn } from "../lib/cn";
import {
  type AccordionSize,
  type AccordionVariantProps,
  accordionContentVariants,
  accordionSlots,
  accordionTriggerVariants,
} from "./accordion-variants";

// The Root's size reaches every Trigger, and a Header says a Trigger need not draw its own.
const SizeContext = createContext<AccordionSize>("md");
const HeaderContext = createContext(false);

// biome-ignore lint/suspicious/noExplicitAny: Base UI's default, so a bare `value={[]}` types.
type AnyValue = any;

export interface AccordionRootProps<Value = AnyValue>
  extends Omit<BaseAccordion.Root.Props<Value>, "className">,
    AccordionVariantProps {
  className?: string | undefined;
}

/** The items, separated by hairlines. `size` applies to every trigger. */
export function AccordionRoot<Value = AnyValue>({
  size = "md",
  className,
  ...props
}: AccordionRootProps<Value>): ReactElement {
  return (
    <SizeContext.Provider value={size}>
      <BaseAccordion.Root
        data-slot="accordion"
        {...props}
        className={cn(accordionSlots.root, className)}
        data-size={size}
      />
    </SizeContext.Provider>
  );
}

export interface AccordionItemProps extends Omit<BaseAccordion.Item.Props, "className"> {
  className?: string | undefined;
}

/** A header and its panel. */
export function AccordionItem({ className, ...props }: AccordionItemProps): ReactElement {
  return (
    <BaseAccordion.Item
      data-slot="accordion-item"
      {...props}
      className={cn(accordionSlots.item, className)}
    />
  );
}

export interface AccordionHeaderProps extends Omit<BaseAccordion.Header.Props, "className"> {
  className?: string | undefined;
}

/** The heading around a trigger (an h3; `render={<h2 />}` changes the level). */
export function AccordionHeader({
  className,
  children,
  ...props
}: AccordionHeaderProps): ReactElement {
  return (
    <BaseAccordion.Header
      data-slot="accordion-header"
      {...props}
      className={cn(accordionSlots.header, className)}
    >
      <HeaderContext.Provider value>{children}</HeaderContext.Provider>
    </BaseAccordion.Header>
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
      <path className={accordionSlots.stroke} data-side="start" d="m6 9 6 6" />
      <path className={accordionSlots.stroke} data-side="end" d="m12 15 6-6" />
    </svg>
  );
}

export interface AccordionTriggerProps extends Omit<BaseAccordion.Trigger.Props, "className"> {
  className?: string | undefined;
  /** Replaces the chevron; `null` leaves it out. It sits at the end of the trigger. */
  icon?: ReactNode;
}

/**
 * The full-width row that opens its item, with its label at the start and a chevron at the end.
 * Outside a Header it draws its own, so the shortest use is a heading with a button in it.
 */
export function AccordionTrigger({
  icon,
  className,
  children,
  ...props
}: AccordionTriggerProps): ReactElement {
  const size = useContext(SizeContext);
  const inHeader = useContext(HeaderContext);
  const trigger = (
    <BaseAccordion.Trigger
      data-slot="accordion-trigger"
      {...props}
      className={cn(accordionTriggerVariants({ size }), className)}
      data-size={size}
    >
      {children}
      {icon === null ? null : (
        <span data-slot="accordion-icon" className={accordionSlots.icon}>
          {icon ?? <Chevron />}
        </span>
      )}
    </BaseAccordion.Trigger>
  );
  return inHeader ? trigger : <AccordionHeader>{trigger}</AccordionHeader>;
}

export interface AccordionPanelProps extends Omit<BaseAccordion.Panel.Props, "className"> {
  className?: string | undefined;
}

/**
 * The content, whose height opens and closes (its width, when horizontal). Its children sit in an
 * inner element that has the padding, so the animated box has none.
 */
export function AccordionPanel({
  className,
  children,
  ...props
}: AccordionPanelProps): ReactElement {
  const size = useContext(SizeContext);
  return (
    <BaseAccordion.Panel
      data-slot="accordion-panel"
      {...props}
      className={cn(accordionSlots.panel, className)}
    >
      <div data-slot="accordion-content" className={accordionContentVariants({ size })}>
        {children}
      </div>
    </BaseAccordion.Panel>
  );
}

export declare namespace AccordionRoot {
  type Props<Value = AnyValue> = AccordionRootProps<Value>;
  type State<Value = AnyValue> = BaseAccordion.Root.State<Value>;
  type Value<TValue = AnyValue> = BaseAccordion.Root.Value<TValue>;
  type ChangeEventReason = BaseAccordion.Root.ChangeEventReason;
  type ChangeEventDetails = BaseAccordion.Root.ChangeEventDetails;
}

export declare namespace AccordionItem {
  type Props = AccordionItemProps;
  type State = BaseAccordion.Item.State;
  type ChangeEventReason = BaseAccordion.Item.ChangeEventReason;
  type ChangeEventDetails = BaseAccordion.Item.ChangeEventDetails;
}

export declare namespace AccordionHeader {
  type Props = AccordionHeaderProps;
  type State = BaseAccordion.Header.State;
}

export declare namespace AccordionTrigger {
  type Props = AccordionTriggerProps;
  type State = BaseAccordion.Trigger.State;
}

export declare namespace AccordionPanel {
  type Props = AccordionPanelProps;
  type State = BaseAccordion.Panel.State;
}
