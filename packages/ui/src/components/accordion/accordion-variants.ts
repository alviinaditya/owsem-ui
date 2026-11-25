// No "use client": an Accordion's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type AccordionSize = "sm" | "md" | "lg";

export interface AccordionVariantProps {
  /** A 32, 40, or 48 px trigger, with Button's font sizes; the panel's text follows. @default "md" */
  size?: AccordionSize | undefined;
}

const sizeClass: Record<AccordionSize, string> = {
  sm: "ow-accordion__trigger--sm",
  md: "ow-accordion__trigger--md",
  lg: "ow-accordion__trigger--lg",
};

/** The trigger's classes. */
export function accordionTriggerVariants({ size = "md" }: AccordionVariantProps = {}): string {
  return cn("ow-accordion__trigger", sizeClass[size]);
}

const contentSize: Record<AccordionSize, string> = {
  sm: "ow-accordion__content--sm",
  md: "ow-accordion__content--md",
  lg: "ow-accordion__content--lg",
};

/** The content's classes: the size's text. */
export function accordionContentVariants({ size = "md" }: AccordionVariantProps = {}): string {
  return cn("ow-accordion__content", contentSize[size]);
}

/** The classes of the other parts. */
export const accordionSlots = {
  root: "ow-accordion",
  item: "ow-accordion__item",
  header: "ow-accordion__header",
  panel: "ow-accordion__panel",
  icon: "ow-accordion__icon",
  stroke: "ow-accordion__stroke",
} as const;
