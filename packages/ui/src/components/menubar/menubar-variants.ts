// No "use client": a Menubar's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type MenubarSize = "sm" | "md" | "lg";

export interface MenubarVariantProps {
  /**
   * Button's sizes: the bar is 32, 40, or 48px tall; the triggers follow it unless they set their own.
   * @default "md"
   */
  size?: MenubarSize | undefined;
}

const rootSize: Record<MenubarSize, string> = {
  sm: "ow-menubar--sm",
  md: "ow-menubar--md",
  lg: "ow-menubar--lg",
};

const triggerSize: Record<MenubarSize, string> = {
  sm: "ow-menubar__trigger--sm",
  md: "ow-menubar__trigger--md",
  lg: "ow-menubar__trigger--lg",
};

/** The bar's classes. */
export function menubarVariants({ size = "md" }: MenubarVariantProps = {}): string {
  return cn("ow-menubar", rootSize[size]);
}

/** A trigger's classes. */
export function menubarTriggerVariants({ size = "md" }: MenubarVariantProps = {}): string {
  return cn("ow-menubar__trigger", triggerSize[size]);
}
