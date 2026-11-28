// Generated from components/menubar by scripts/build-tailwind.ts; do not edit.
"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import { createContext, type ReactElement, useContext } from "react";
import { cn } from "../lib/cn";
import { GlideHighlight, useGlide } from "../lib/glide/use-glide";
import { useMergedRefs } from "../lib/merge-refs";
import { MenubarMenuContext } from "../menu/menu";
import {
  type MenubarSize,
  type MenubarVariantProps,
  menubarTriggerVariants,
  menubarVariants,
} from "./menubar-variants";

const TRIGGER = '[data-slot="menubar-trigger"]';

// The bar's size, for triggers that do not set their own.
const SizeContext = createContext<MenubarSize>("md");

export interface MenubarRootProps
  extends Omit<BaseMenubar.Props, "className">,
    MenubarVariantProps {
  className?: string | undefined;
}

/**
 * The bar. Put Menu parts inside it, one Menu.Root per menu, each with a Menubar.Trigger: arrow
 * keys and hover move between the menus (Base UI). Its menus are not modal of their own; `modal`
 * is the bar's, as Base UI's.
 */
export function MenubarRoot({
  size = "md",
  className,
  children,
  ref,
  ...props
}: MenubarRootProps): ReactElement {
  // Glide lights the trigger under the pointer, except the open one, which stays tinted.
  const glide = useGlide<HTMLDivElement>({
    items: TRIGGER,
    skip: "[data-popup-open]",
    axis: props.orientation === "vertical" ? "y" : "x",
  });
  const merged = useMergedRefs(glide.ref, ref);
  return (
    <SizeContext.Provider value={size}>
      <MenubarMenuContext.Provider value={size}>
        <BaseMenubar
          data-slot="menubar"
          {...props}
          ref={merged}
          className={cn(menubarVariants({ size }), className)}
          data-size={size}
        >
          <GlideHighlight glide={glide} />
          {children}
        </BaseMenubar>
      </MenubarMenuContext.Provider>
    </SizeContext.Provider>
  );
}

export interface MenubarTriggerProps extends Omit<BaseMenu.Trigger.Props, "className"> {
  className?: string | undefined;
  /** Button's sizes. @default the bar's size */
  size?: MenubarSize | undefined;
  /** The size of an outer part that renders this one. */
  "data-size"?: MenubarSize | undefined;
}

/** A menu's name in the bar: a ghost button, tinted while its menu is open. */
export function MenubarTrigger({
  "data-size": outerSize,
  size,
  className,
  ...props
}: MenubarTriggerProps): ReactElement {
  const barSize = useContext(SizeContext);
  const resolved = size ?? outerSize ?? barSize;
  return (
    <BaseMenu.Trigger
      data-slot="menubar-trigger"
      {...props}
      className={cn(menubarTriggerVariants({ size: resolved }), className)}
      data-size={resolved}
    />
  );
}
