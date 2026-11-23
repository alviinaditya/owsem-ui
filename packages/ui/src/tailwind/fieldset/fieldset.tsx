// Generated from components/fieldset by scripts/build-tailwind.ts; do not edit.
"use client";

import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import type { ReactElement } from "react";
import { cn } from "../lib/cn";
import { fieldsetSlots } from "./fieldset-variants";

export interface FieldsetRootProps extends Omit<BaseFieldset.Root.Props, "className"> {
  className?: string | undefined;
}

/** A group of fields with even gaps. `disabled` reaches every control inside. */
export function FieldsetRoot({ className, ...props }: FieldsetRootProps): ReactElement {
  return (
    <BaseFieldset.Root
      data-slot="fieldset"
      {...props}
      className={cn(fieldsetSlots.root, className)}
    />
  );
}

export interface FieldsetLegendProps extends Omit<BaseFieldset.Legend.Props, "className"> {
  className?: string | undefined;
}

/** Names the group, over a hairline. */
export function FieldsetLegend({ className, ...props }: FieldsetLegendProps): ReactElement {
  return (
    <BaseFieldset.Legend
      data-slot="fieldset-legend"
      {...props}
      className={cn(fieldsetSlots.legend, className)}
    />
  );
}
