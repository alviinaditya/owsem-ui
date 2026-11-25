// No "use client": a Collapsible's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type CollapsibleSize = "sm" | "md" | "lg";

export interface CollapsibleVariantProps {
  /** A 32, 40, or 48 px trigger, with Button's font sizes; the panel's text follows. @default "md" */
  size?: CollapsibleSize | undefined;
}

const triggerSize: Record<CollapsibleSize, string> = {
  sm: "ow-collapsible__trigger--sm",
  md: "ow-collapsible__trigger--md",
  lg: "ow-collapsible__trigger--lg",
};

const contentSize: Record<CollapsibleSize, string> = {
  sm: "ow-collapsible__content--sm",
  md: "ow-collapsible__content--md",
  lg: "ow-collapsible__content--lg",
};

/** The trigger's classes. */
export function collapsibleTriggerVariants({ size = "md" }: CollapsibleVariantProps = {}): string {
  return cn("ow-collapsible__trigger", triggerSize[size]);
}

/** The content's classes: the size's text, and side padding that lines up with the trigger's label. */
export function collapsibleContentVariants({ size = "md" }: CollapsibleVariantProps = {}): string {
  return cn("ow-collapsible__content", contentSize[size]);
}

/** The classes of the other parts. */
export const collapsibleSlots = {
  panel: "ow-collapsible__panel",
  icon: "ow-collapsible__icon",
  stroke: "ow-collapsible__stroke",
} as const;
