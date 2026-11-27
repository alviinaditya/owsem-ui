// The Tailwind CSS v4 twin of menubar-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type MenubarSize = "sm" | "md" | "lg";

export interface MenubarVariantProps {
  /**
   * Button's sizes: the bar is 32, 40, or 48px tall; the triggers follow it unless they set their own.
   * @default "md"
   */
  size?: MenubarSize | undefined;
}

// A row of menus as in a desktop app, on the quiet panel of Toolbar. The bar is 32, 40, or 48px
// tall (sm, md, lg); its triggers are ghost buttons 24, 32, or 40px tall in the 4px padding.
const root = [
  "[--_bg:var(--ow-panel)] [--_shadow:var(--ow-surface-shadow)] [--_pad:4px]",
  // One radius outside; the triggers follow its curve, less the padding.
  "[--_inner:max(0px,var(--ow-radius)_-_var(--_pad))]",
  // Box.
  "flex items-center gap-[2px] box-border w-fit max-w-full p-(--_pad) rounded-(--ow-radius)",
  "bg-(color:--_bg) shadow-(shadow:--_shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "text-(color:--ow-fg)",
  "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
];

const rootSizes = {
  sm: "text-[0.8125rem] leading-[1.25]",
  md: "text-[0.875rem] leading-[1.25]",
  lg: "text-[1rem] leading-[1.25]",
};

const rootVariants = cva(root, {
  variants: { size: rootSizes },
  defaultVariants: { size: "md" },
});

/** The bar's classes. */
export function menubarVariants({ size }: MenubarVariantProps = {}): string {
  return cn(rootVariants({ size }));
}

// Triggers: Button's geometry, --py the only input; 8px shorter than the bar. The open menu's
// trigger stays tinted while the pointer is in the menu.
const trigger = [
  "[--_py:max(var(--py),(24px_-_1lh)_/_2)] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--_hover:var(--ow-hover)] [--_open:var(--ow-pressed-bg)]",
  // Box.
  "inline-flex flex-none items-center justify-center gap-[0.5em] box-border m-0 py-(--_py) px-(--px)",
  "border-0 rounded-(--_inner)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "bg-transparent text-(color:--ow-fg) font-[family-name:inherit] font-medium whitespace-nowrap",
  "cursor-default touch-manipulation",
  "hover:not-data-disabled:bg-(color:--_hover)",
  "data-popup-open:not-data-disabled:bg-(color:--_open) data-pressed:not-data-disabled:bg-(color:--_open)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:opacity-45",
  // Forced colors: the ring and a disabled trigger take system colors.
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-popup-open:outline-[Highlight] forced-colors:data-pressed:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

const triggerSizes = {
  sm: "[--py:0.3em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.5179em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.625em] text-[1rem] leading-[1.25]",
};

const triggerVariants = cva(trigger, {
  variants: { size: triggerSizes },
  defaultVariants: { size: "md" },
});

/** A trigger's classes. */
export function menubarTriggerVariants({ size }: MenubarVariantProps = {}): string {
  return cn(triggerVariants({ size }));
}
