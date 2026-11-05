"use client";

import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { type ForwardRefExoticComponent, forwardRef, type RefAttributes } from "react";
import { withClassName } from "../../core/class-name";
import "./fieldset.css";

const cls = { root: "ow-fieldset", legend: "ow-fieldset__legend" } as const;

export type FieldsetRootProps = Omit<BaseFieldset.Root.Props, "ref">;

/** A group of fields with even gaps. `disabled` reaches every control inside. */
export const FieldsetRoot: ForwardRefExoticComponent<
  FieldsetRootProps & RefAttributes<HTMLFieldSetElement>
> = forwardRef<HTMLFieldSetElement, FieldsetRootProps>(function FieldsetRoot(
  { className, ...props },
  ref,
) {
  return <BaseFieldset.Root ref={ref} className={withClassName(cls.root, className)} {...props} />;
});

export type FieldsetLegendProps = Omit<BaseFieldset.Legend.Props, "ref">;

/** Names the group, over an etched line. */
export const FieldsetLegend: ForwardRefExoticComponent<
  FieldsetLegendProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, FieldsetLegendProps>(function FieldsetLegend(
  { className, ...props },
  ref,
) {
  return (
    <BaseFieldset.Legend ref={ref} className={withClassName(cls.legend, className)} {...props} />
  );
});
