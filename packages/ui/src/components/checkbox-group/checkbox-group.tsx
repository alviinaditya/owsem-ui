"use client";

import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import type { ReactElement } from "react";
import { CheckboxGroupSizeProvider } from "../../core/checkbox-group-size";
import { cn } from "../../core/cn";
import type { GlideOptions } from "../../core/glide/glide";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { useMergedRefs } from "../../core/merge-refs";
import { type CheckboxGroupVariantProps, checkboxGroupVariants } from "./checkbox-group-variants";
import "./checkbox-group.css";

// Glide lights the row, a label holding a checkbox, as Radio Group does: a press on a row toggles
// it, and other content in the group, such as a caption, is left alone.
const GLIDE: GlideOptions = {
  items: 'label:has([role="checkbox"])',
  axis: "xy",
  maxDistance: 8,
  gapClick: false,
  isDisabled: (row) =>
    row.querySelector('[role="checkbox"]:is([data-disabled], [data-readonly])') !== null,
};

export interface CheckboxGroupProps
  extends Omit<BaseCheckboxGroup.Props, "className">,
    CheckboxGroupVariantProps {
  className?: string | undefined;
}

/**
 * The group: holds the options, usually `<label>` rows, and the hover highlight (Glide). `size`
 * reaches the Checkboxes in it; a Checkbox's own `size` wins.
 */
export function CheckboxGroup({
  size = "md",
  className,
  children,
  ref,
  ...props
}: CheckboxGroupProps): ReactElement {
  const glide = useGlide<HTMLDivElement>(GLIDE);
  const merged = useMergedRefs(glide.ref, ref);
  return (
    <CheckboxGroupSizeProvider value={size}>
      <BaseCheckboxGroup
        data-slot="checkbox-group"
        {...props}
        ref={merged}
        className={cn(checkboxGroupVariants({ size }), className)}
        data-size={size}
      >
        <GlideHighlight glide={glide} />
        {children}
      </BaseCheckboxGroup>
    </CheckboxGroupSizeProvider>
  );
}

export declare namespace CheckboxGroup {
  type Props = CheckboxGroupProps;
  type State = BaseCheckboxGroup.State;
  type ChangeEventDetails = BaseCheckboxGroup.ChangeEventDetails;
}
