// Generated from components/switch by scripts/build-tailwind.ts; do not edit.
"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ReactElement } from "react";
import { cn } from "../lib/cn";
import {
  type SwitchSize,
  type SwitchVariantProps,
  switchSlots,
  switchVariants,
} from "./switch-variants";

export interface SwitchThumbProps extends Omit<BaseSwitch.Thumb.Props, "className"> {
  className?: string | undefined;
}

/** The raised key that moves. It can hold an icon; the icon is decorative. */
export function SwitchThumb({ className, ...props }: SwitchThumbProps): ReactElement {
  return (
    <BaseSwitch.Thumb
      data-slot="switch-thumb"
      {...props}
      className={cn(switchSlots.thumb, className)}
    />
  );
}

export interface SwitchRootProps
  extends Omit<BaseSwitch.Root.Props, "className">,
    SwitchVariantProps {
  className?: string | undefined;
  /** The size of an outer part that renders this one, such as Toolbar.Button. */
  "data-size"?: SwitchSize | undefined;
}

/** The track. Without children it draws its own Thumb. It needs a name, from a label or aria-label. */
export function SwitchRoot({
  "data-size": outerSize,
  size = outerSize ?? "md",
  className,
  children,
  ...props
}: SwitchRootProps): ReactElement {
  return (
    <BaseSwitch.Root
      data-slot="switch"
      {...props}
      className={cn(switchVariants({ size }), className)}
      data-size={size}
    >
      {children ?? <SwitchThumb />}
    </BaseSwitch.Root>
  );
}

export declare namespace SwitchRoot {
  type Props = SwitchRootProps;
  type State = BaseSwitch.Root.State;
  type ChangeEventDetails = BaseSwitch.Root.ChangeEventDetails;
}

export declare namespace SwitchThumb {
  type Props = SwitchThumbProps;
  type State = BaseSwitch.Thumb.State;
}
