// The Tailwind CSS v4 twin of toolbar-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-toolbar-quiet variant.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type ToolbarSize = "sm" | "md" | "lg";

export interface ToolbarVariantProps {
  /**
   * Button's sizes: the bar is 32, 40, or 48px tall. Items that do not set their own follow it.
   * @default "md"
   */
  size?: ToolbarSize | undefined;
}

// A row of buttons, toggles, links, and a field on a panel, with hairlines between groups. The bar
// is 32, 40, or 48px tall (sm, md, lg); its items are quiet ghost buttons 24, 32, or 40px tall in
// the 4px padding, so their radius follows the bar's curve.
const root = [
  "[--_bg:var(--ow-panel)] [--_shadow:var(--ow-surface-shadow)] [--_pad:4px]",
  // One radius outside; the buttons follow its curve, less the padding.
  "[--_inner:max(0px,var(--ow-radius)_-_var(--_pad))]",
  // Box.
  "flex items-center gap-[4px] box-border w-fit max-w-full p-(--_pad) rounded-(--ow-radius)",
  "bg-(color:--_bg) shadow-(shadow:--_shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type. The separators' length follows the type scale.
  "text-(color:--ow-fg)",
  "data-[orientation=vertical]:flex-col",
];

const sizeStyles = {
  sm: "text-[0.8125rem] leading-[1.25]",
  md: "text-[0.875rem] leading-[1.25]",
  lg: "text-[1rem] leading-[1.25]",
};

const rootVariants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The root's classes. */
export function toolbarVariants({ size }: ToolbarVariantProps = {}): string {
  return cn(rootVariants({ size }));
}

// Items: Button's geometry, --py the only input. The bar is as tall as a Button of its size, so an
// item is 8px shorter: 24, 32, 40 for sm, md, lg (the inset is 4px on each side). Every rule of an
// item has no specificity (ow-toolbar-quiet), so a Toggle or another styled control passed to its
// `render` keeps its own look.
const box = [
  "ow-toolbar-quiet:[--_py:max(var(--py),(24px_-_1lh)_/_2)]",
  "ow-toolbar-quiet:[--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "ow-toolbar-quiet:[--icon:calc(1em_+_2px)]",
  "ow-toolbar-quiet:box-border ow-toolbar-quiet:m-0 ow-toolbar-quiet:py-(--_py)",
  "ow-toolbar-quiet:px-(--px) ow-toolbar-quiet:border-0 ow-toolbar-quiet:rounded-(--_inner)",
  // Invisible until forced colors draw it as the edge.
  "ow-toolbar-quiet:outline-1 ow-toolbar-quiet:-outline-offset-1 ow-toolbar-quiet:outline-transparent",
  "ow-toolbar-quiet:font-[family-name:inherit]",
  "focus-visible:ow-toolbar-quiet:outline-2 focus-visible:ow-toolbar-quiet:outline-offset-2",
  "focus-visible:ow-toolbar-quiet:outline-(color:--ow-focus)",
  "data-disabled:ow-toolbar-quiet:cursor-not-allowed data-disabled:ow-toolbar-quiet:opacity-45",
  "forced-colors:focus-visible:ow-toolbar-quiet:outline-[Highlight]",
  "forced-colors:data-disabled:ow-toolbar-quiet:text-[GrayText]",
  "forced-colors:data-disabled:ow-toolbar-quiet:opacity-100",
];

// Buttons and links: flat, tinted under the pointer, the pressed material while held.
const quiet = [
  "ow-toolbar-quiet:[--_muted:var(--ow-muted)] ow-toolbar-quiet:[--_fg:var(--ow-fg)]",
  "ow-toolbar-quiet:[--_hover:var(--ow-hover)] ow-toolbar-quiet:[--_pressed-bg:var(--ow-pressed-bg)]",
  "ow-toolbar-quiet:inline-flex ow-toolbar-quiet:flex-none ow-toolbar-quiet:items-center",
  "ow-toolbar-quiet:justify-center ow-toolbar-quiet:gap-[0.5em] ow-toolbar-quiet:bg-transparent",
  "ow-toolbar-quiet:text-(color:--_muted) ow-toolbar-quiet:font-medium ow-toolbar-quiet:no-underline",
  "ow-toolbar-quiet:whitespace-nowrap ow-toolbar-quiet:cursor-pointer",
  "ow-toolbar-quiet:touch-manipulation",
  // Its own layer, so it lands without a pixel jump. A press lets go on the settle spring. It scales
  // as Button does, so a Button rendered as an item is not scaled twice.
  "ow-toolbar-quiet:will-change-[scale] ow-toolbar-quiet:transition-[scale]",
  "ow-toolbar-quiet:duration-(--ow-spring-settle-duration) ow-toolbar-quiet:ease-(--ow-spring-settle)",
  "hover:not-data-disabled:ow-toolbar-quiet:bg-(color:--_hover)",
  "hover:not-data-disabled:ow-toolbar-quiet:text-(color:--_fg)",
  // Held down: in to 0.97 and the pressed material within 90 ms. No movement when motion is
  // reduced. A Toggle presses in by its own rule.
  "active:not-data-disabled:ow-toolbar-quiet:bg-(color:--_pressed-bg)",
  "active:not-data-disabled:ow-toolbar-quiet:text-(color:--_fg)",
  "active:not-data-disabled:not-[[aria-pressed]]:ow-toolbar-quiet:scale-[0.97]",
  "active:not-data-disabled:ow-toolbar-quiet:duration-90",
  "active:not-data-disabled:ow-toolbar-quiet:ease-(--ow-ease-out)",
  "motion-reduce:active:not-data-disabled:not-[[aria-pressed]]:ow-toolbar-quiet:scale-none",
  // Icon only: a square as tall as the other items.
  "data-icon-only:ow-toolbar-quiet:p-[calc(var(--_py)_+_(1lh_-_var(--icon))_/_2)]",
];

// A Toggle rendered as a toolbar button has its own radius and sizes (one class more); inside the
// toolbar it nests too, and they give way to the toolbar's.
const toggle = [
  "[&[aria-pressed]]:rounded-(--_inner) [&[aria-pressed]]:[--py:0.5179em]",
  "[&[aria-pressed][data-size=sm]]:[--py:0.3em] [&[aria-pressed][data-size=lg]]:[--py:0.625em]",
];

const buttonSizes = {
  sm: "ow-toolbar-quiet:[--py:0.3em] ow-toolbar-quiet:text-[0.8125rem] ow-toolbar-quiet:leading-[1.25]",
  md: "ow-toolbar-quiet:[--py:0.5179em] ow-toolbar-quiet:text-[0.875rem] ow-toolbar-quiet:leading-[1.25]",
  lg: "ow-toolbar-quiet:[--py:0.625em] ow-toolbar-quiet:text-[1rem] ow-toolbar-quiet:leading-[1.25]",
};

const buttonVariants = cva([...box, ...quiet, ...toggle], {
  variants: { size: buttonSizes },
  defaultVariants: { size: "md" },
});

/** A button's classes. */
export function toolbarButtonVariants({ size }: ToolbarVariantProps = {}): string {
  return cn(buttonVariants({ size }));
}

const linkVariants = cva([...box, ...quiet], {
  variants: { size: buttonSizes },
  defaultVariants: { size: "md" },
});

/** A link's classes. */
export function toolbarLinkVariants({ size }: ToolbarVariantProps = {}): string {
  return cn(linkVariants({ size }));
}

// The field: a tint of the text color, as Input's, with no shadow. The tint deepens on hover.
const input = [
  ...box,
  "ow-toolbar-quiet:[--_bg:color-mix(in_oklab,var(--ow-fg)_6%,transparent)]",
  "ow-toolbar-quiet:flex-initial ow-toolbar-quiet:w-[9em] ow-toolbar-quiet:min-w-0",
  // Inputs ignore a line-height under their font's own in some engines.
  "ow-toolbar-quiet:h-[calc(2_*_var(--_py)_+_1lh)]",
  "ow-toolbar-quiet:bg-(color:--_bg) ow-toolbar-quiet:text-(color:--ow-fg)",
  "pointer-fine:hover:not-data-disabled:ow-toolbar-quiet:[--_bg:color-mix(in_oklab,var(--ow-fg)_9%,transparent)]",
  "ow-toolbar-quiet:placeholder:text-(color:--ow-muted) ow-toolbar-quiet:placeholder:opacity-100",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:ow-toolbar-quiet:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
];

const inputVariants = cva(input, {
  variants: { size: buttonSizes },
  defaultVariants: { size: "md" },
});

/** An input's classes. */
export function toolbarInputVariants({ size }: ToolbarVariantProps = {}): string {
  return cn(inputVariants({ size }));
}

// Items that belong together, such as text formatting.
const group = ["flex items-center gap-[4px] data-[orientation=vertical]:flex-col"];

// Icons sit as far from the edge as from the top and bottom. An icon-only item has none.
const icon = [
  "ow-toolbar-quiet:inline-flex ow-toolbar-quiet:flex-none ow-toolbar-quiet:size-(--icon)",
  "ow-toolbar-quiet:[&>:where(svg,img)]:block ow-toolbar-quiet:[&>:where(svg,img)]:size-full",
  "data-[side=start]:not-in-data-icon-only:ow-toolbar-quiet:ms-[calc((1cap_-_var(--icon))_/_2)]",
  "data-[side=end]:not-in-data-icon-only:ow-toolbar-quiet:me-[calc((1cap_-_var(--icon))_/_2)]",
];

// A hairline, as a border for forced colors.
const separator = [
  "flex-none border-0 border-solid border-(color:--ow-line)",
  "data-[orientation=vertical]:w-0 data-[orientation=vertical]:h-[calc(1em_+_2px)]",
  "data-[orientation=vertical]:mx-[4px] data-[orientation=vertical]:border-s",
  "data-[orientation=horizontal]:w-[calc(1em_+_2px)] data-[orientation=horizontal]:h-0",
  "data-[orientation=horizontal]:my-[4px] data-[orientation=horizontal]:border-t",
];

/** The classes of the other parts. */
export const toolbarSlots: Record<"group" | "icon" | "separator", string> = {
  group: group.join(" "),
  icon: icon.join(" "),
  separator: separator.join(" "),
};
