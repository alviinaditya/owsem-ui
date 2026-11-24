// Generated from components/toggle by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of toggle-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

export type ToggleSize = "sm" | "md" | "lg";

export type ToggleVariant = "soft" | "solid";

export interface ToggleVariantProps {
  /** Button's sizes: 32, 40, or 48 px tall. @default "md" */
  size?: ToggleSize | undefined;
  /** While on: a tint of the accent, or the primary Button's fill. @default "soft" */
  variant?: ToggleVariant | undefined;
}

// A ghost button that stays up while on. The size adds its own, and a user's className is merged
// last (in Toggle), so it wins over any of them.
const root = [
  // Box. The padding comes from one number, --py, as in Button; the size sets it.
  "m-0 box-border inline-flex items-center justify-center gap-[0.5em]",
  "border-0 rounded-(--ow-radius) bg-transparent py-(--_py) px-(--px)",
  "[--_py:max(var(--py),calc((24px_-_1lh)_/_2))] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)] [--_icon-margin:calc((1cap_-_var(--icon))_/_2)]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "font-[family-name:inherit] font-medium text-(color:--ow-muted) no-underline whitespace-nowrap",
  // Touch, and its own layer so it lands without a pixel jump.
  "cursor-pointer touch-manipulation will-change-transform",
  // A press lets go on the settle spring; held, it is in within 90 ms.
  "transition-[transform] duration-(--ow-spring-settle-duration) ease-(--ow-spring-settle)",
  "active:not-data-disabled:transform-[scale(0.97)] active:not-data-disabled:duration-90",
  "active:not-data-disabled:ease-(--ow-ease-out)",
  // Icon only: a square as tall as a labelled toggle.
  "data-icon-only:p-[calc(var(--_py)_+_(1lh_-_var(--icon))_/_2)] data-icon-only:[--_icon-margin:0]",
  // The accent text leans toward the text color, to read on its own tint in both themes.
  "[--_on-fg:color-mix(in_oklab,var(--ow-accent)_70%,var(--ow-fg))]",
  // Off, hovered: flat and tinted.
  "hover:not-data-pressed:not-data-disabled:not-active:bg-(--ow-hover)",
  "hover:not-data-pressed:not-data-disabled:not-active:text-(color:--ow-fg)",
  // Held down while off: the deepest tint. The variant says what held down is while on.
  "active:not-data-pressed:not-data-disabled:bg-[color-mix(in_oklab,var(--ow-accent)_22%,transparent)]",
  "active:not-data-pressed:not-data-disabled:text-(color:--_on-fg)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
  // No movement; the material still changes.
  "motion-reduce:active:not-data-disabled:transform-none",
  // The tint is gone, so on is the system's highlight; a disabled one stays gray.
  "forced-colors:data-pressed:bg-[Highlight] forced-colors:data-pressed:not-data-disabled:text-[HighlightText]",
  "forced-colors:data-pressed:bg-none forced-colors:data-pressed:shadow-none",
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100",
];

const sizeStyles = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

// Soft: a tint of the accent with accent text leaning toward the text color; no edge. On, hovered:
// the tint steps up a little. Held down: the deepest tint.
const soft = [
  "data-pressed:bg-[color-mix(in_oklab,var(--ow-accent)_14%,transparent)]",
  "data-pressed:text-(color:--_on-fg)",
  "hover:data-pressed:not-data-disabled:not-active:bg-[color-mix(in_oklab,var(--ow-accent)_18%,transparent)]",
  "active:data-pressed:not-data-disabled:bg-[color-mix(in_oklab,var(--ow-accent)_22%,transparent)]",
  "active:data-pressed:not-data-disabled:text-(color:--_on-fg)",
];

// Solid: the primary Button's fill, text, and edge while on. Hovered, the hover tint lies over the
// fill; held down, the fill takes 10% black. A toolbar's hover rule has two pseudo-classes: these
// have more, so a Toggle keeps its colors there.
const solid = [
  "data-pressed:bg-(--ow-accent) data-pressed:text-(color:--ow-on-accent)",
  "data-pressed:shadow-(shadow:--ow-primary-shadow)",
  "hover:data-pressed:not-data-disabled:not-active:bg-(--ow-accent)",
  "hover:data-pressed:not-data-disabled:not-active:bg-[linear-gradient(var(--ow-hover)_0_0)]",
  "hover:data-pressed:not-data-disabled:not-active:text-(color:--ow-on-accent)",
  // literal: black darkens any fill
  "active:data-pressed:not-data-disabled:bg-[color-mix(in_oklab,var(--ow-accent),black_10%)]",
  "active:data-pressed:not-data-disabled:text-(color:--ow-on-accent)",
  // Forced colors: on, also hovered and held, is the system's highlight.
  "forced-colors:hover:data-pressed:not-data-disabled:not-active:bg-[Highlight]",
  "forced-colors:hover:data-pressed:not-data-disabled:not-active:bg-none",
  "forced-colors:hover:data-pressed:not-data-disabled:not-active:text-[HighlightText]",
  "forced-colors:active:data-pressed:not-data-disabled:bg-[Highlight]",
  "forced-colors:active:data-pressed:not-data-disabled:text-[HighlightText]",
];

const variants = cva(root, {
  variants: { size: sizeStyles, variant: { soft, solid } },
  defaultVariants: { size: "md", variant: "soft" },
});

/** The root's classes. */
export function toggleVariants({ size, variant }: ToggleVariantProps = {}): string {
  return cn(variants({ size, variant }));
}

// Icons sit as far from the edge as from the top and bottom.
const icon = [
  "inline-flex flex-none size-(--icon)",
  "data-[side=start]:ms-(--_icon-margin) data-[side=end]:me-(--_icon-margin)",
  "[&>:where(svg,img)]:block [&>:where(svg,img)]:size-full",
];

/** The classes of the inner parts. */
export const toggleSlots: Record<"icon", string> = { icon: icon.join(" ") };
