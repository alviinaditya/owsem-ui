"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { type ForwardRefExoticComponent, forwardRef, type RefAttributes } from "react";
import { withClassName } from "../../core/class-name";
import "./switch.css";

const cls = { root: "ow-switch", thumb: "ow-switch__thumb" } as const;

export type SwitchSize = "sm" | "md" | "lg";

export type SwitchThumbProps = Omit<BaseSwitch.Thumb.Props, "ref">;

/** The raised key that moves. It can hold an icon; the icon is decorative. */
export const SwitchThumb: ForwardRefExoticComponent<
  SwitchThumbProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, SwitchThumbProps>(function SwitchThumb(
  { className, ...props },
  ref,
) {
  return <BaseSwitch.Thumb ref={ref} className={withClassName(cls.thumb, className)} {...props} />;
});

export interface SwitchRootProps extends Omit<BaseSwitch.Root.Props, "ref"> {
  /** Follows Button's font sizes: 13, 14, or 16 px. @default "md" */
  size?: SwitchSize | undefined;
}

/** The track. Without children it draws its own Thumb. It needs a name, from a label or aria-label. */
export const SwitchRoot: ForwardRefExoticComponent<SwitchRootProps & RefAttributes<HTMLElement>> =
  forwardRef<HTMLElement, SwitchRootProps>(function SwitchRoot(
    { className, size = "md", children, ...props },
    ref,
  ) {
    return (
      <BaseSwitch.Root
        ref={ref}
        className={withClassName(cls.root, className)}
        data-size={size}
        {...props}
      >
        {children ?? <SwitchThumb />}
      </BaseSwitch.Root>
    );
  });

export declare namespace SwitchRoot {
  type Props = SwitchRootProps;
  type State = BaseSwitch.Root.State;
  type ChangeEventDetails = BaseSwitch.Root.ChangeEventDetails;
}

export declare namespace SwitchThumb {
  type Props = SwitchThumbProps;
  type State = BaseSwitch.Thumb.State;
}
