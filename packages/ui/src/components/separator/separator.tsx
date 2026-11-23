import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { ReactElement } from "react";
import { cn } from "../../core/cn";
import { separatorSlots } from "./separator-variants";
import "./separator.css";

export interface SeparatorProps extends Omit<BaseSeparator.Props, "className"> {
  className?: string | undefined;
}

export function Separator({ className, ...props }: SeparatorProps): ReactElement {
  return (
    <BaseSeparator
      data-slot="separator"
      {...props}
      className={cn(separatorSlots.root, className)}
    />
  );
}

export declare namespace Separator {
  type Props = SeparatorProps;
  type State = BaseSeparator.State;
}
