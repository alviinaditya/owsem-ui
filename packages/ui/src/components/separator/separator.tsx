import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { type ForwardRefExoticComponent, forwardRef, type RefAttributes } from "react";
import { withClassName } from "../../core/class-name";
import "./separator.css";

const cls = { root: "ow-separator" } as const;

type Props = Omit<BaseSeparator.Props, "ref">;

// forwardRef keeps refs working on React 18, where `ref` is not a prop.
export const Separator: ForwardRefExoticComponent<Props & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, Props>(function Separator({ className, ...props }, ref) {
    return <BaseSeparator ref={ref} className={withClassName(cls.root, className)} {...props} />;
  });

export declare namespace Separator {
  type Props = BaseSeparator.Props;
  type State = BaseSeparator.State;
}
