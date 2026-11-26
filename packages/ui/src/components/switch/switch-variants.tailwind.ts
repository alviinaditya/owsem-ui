// The Tailwind CSS v4 twin of switch-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-label-hover and ow-switch-held
// variants and the @property rules of --_switch-travel and --_switch-held.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchVariantProps {
  /** Follows Button's font sizes: 13, 14, or 16 px. @default "md" */
  size?: SwitchSize | undefined;
}

// The track is a tint of the text color with no edge while off and the accent while on; the fill
// changes at once. The thumb rests where layout puts it, so this only sizes, colors, and names the
// group the thumb reads a held press from.
const root = [
  // Box. Two keys wide and one tall, inside the inset: 45 × 26, 46 × 27, or 52 × 30 at the key's end.
  "group/ow-switch relative box-border inline-flex flex-none m-0 p-0 border-0",
  "w-[calc(2em_+_20px)] h-[calc(1em_+_14px)]",
  // The track's radius is the key's plus the inset. 100cqi, the track's width, is what the thumb's
  // travel comes from.
  "[--_inset:3px] [--_radius:max(0px,var(--ow-radius)_-_var(--_inset))] @container",
  "rounded-[calc(var(--_radius)_+_var(--_inset))]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "[--_track:color-mix(in_oklab,var(--ow-fg)_10%,transparent)] bg-(color:--_track)",
  "data-checked:bg-(color:--ow-accent) data-checked:shadow-(shadow:--ow-primary-shadow)",
  // Type.
  "align-middle",
  // Touch.
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent]",
  // A 24px target around a smaller track, adding no layout.
  "before:absolute before:inset-[min(0px,(100%_-_24px)_/_2)] before:content-['']",
  // Off, the track steps up on hover; the label counts too.
  "ow-label-hover:not-data-disabled:not-disabled:not-data-checked:[--_track:color-mix(in_oklab,var(--ow-fg)_13%,transparent)]",
  // 2px outside the track.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-readonly:not-data-disabled:cursor-default",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  // More contrast asked for: the track's edge comes back at 3:1.
  "contrast-more:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  "contrast-more:data-checked:shadow-[inset_0_0_0_1px_var(--ow-edge)]",
  // The track keeps its outline, and on is the system's highlight.
  "forced-colors:data-checked:bg-[Highlight] forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:outline-[GrayText] forced-colors:data-disabled:opacity-100",
  "forced-colors:data-disabled:data-checked:bg-[GrayText]",
];

const sizeStyles = {
  sm: "text-[0.8125rem]",
  md: "text-[0.875rem]",
  lg: "text-[1rem]",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The root's classes. */
export function switchVariants({ size }: SwitchVariantProps = {}): string {
  return cn(variants({ size }));
}

// The key: as tall as the track, keeping the inset as a clear border, so its edges round to the
// same pixels as the track's. It is gooey: as it travels it stretches along its path, leading edge
// first, and while held it widens toward the middle of the track and squashes a little in height.
// --_end is where layout puts it (0 or 1); translate covers the rest of the way while
// --_switch-travel catches up, so the motion can be interrupted and comes from the track's size.
// It scales about its centre and a translate keeps the anchored edge in place (--_lean), so no
// state change moves an origin. The stretch is small and has no slope at either end of the travel,
// so the tail never moves back.
const thumb = [
  // Box.
  "relative isolate grid flex-none place-items-center box-border h-full aspect-square",
  "border-(length:--_inset) border-solid border-transparent rounded-[inherit] bg-clip-padding",
  "bg-(color:--ow-on-accent) text-(color:--ow-fg)",
  // How far it stretches at most, and how far a hold widens and squashes it.
  "[--_stretch:calc(0.15_*_var(--ow-motion-scale))] [--_widen:calc(0.18_*_var(--ow-motion-scale))]",
  "[--_squash:calc(0.06_*_var(--ow-motion-scale))]",
  "[--_side:1] [--_end:0] [--_switch-travel:0] [--_switch-held:0]",
  "[&:dir(rtl)]:[--_side:-1]",
  "data-checked:[--_end:1] data-checked:[--_switch-travel:1] data-checked:ms-auto",
  // The widening of a hold, and the stretch of the travel: 16t²(1-t)² is 0 with no slope at both
  // ends and 1 midway; a spring overshoot never shrinks it.
  "[--_wide:calc(var(--_widen)_*_var(--_switch-held))]",
  "[--_long:calc(var(--_stretch)_*_max(0,_16_*_var(--_switch-travel)_*_var(--_switch-travel)_*_(1_-_var(--_switch-travel))_*_(1_-_var(--_switch-travel))))]",
  // How far the centre moves, as a share of the key's width, to keep an edge fixed: a hold grows
  // from the edge on its own end and, past the middle of the travel, from the other one; the
  // stretch keeps the leading edge.
  "[--_lean:calc(var(--_side)_*_((1_-_2_*_var(--_switch-travel))_*_var(--_wide)_-_(2_*_var(--_end)_-_1)_*_var(--_long))_/_2)]",
  // The thumb rests at either end of the track, never on a translate: a resting translate lands
  // between device pixels at a fractional zoom and blurs the key's edges.
  "[translate:calc(var(--_side)_*_(var(--_switch-travel)_-_var(--_end))_*_(100cqi_-_100%)_+_var(--_lean)_*_100%)_0]",
  "[--_sx:calc((1_+_var(--_wide))_*_(1_+_var(--_long)))]",
  "[--_sy:calc(1_-_var(--_squash)_*_var(--_switch-held))] [scale:var(--_sx)_var(--_sy)]",
  // Nothing transitions a transform directly, so nothing needs a layer: the thumb's edges snap with
  // the track's. Held: in within 90 ms, and let go on the settle spring.
  // An underscore is a space in a class, so the names of the two registered properties escape it.
  String.raw`transition-[--\_switch-travel,--\_switch-held]`,
  "duration-[var(--ow-spring-travel-duration),var(--ow-spring-settle-duration)]",
  "ease-[var(--ow-spring-travel),var(--ow-spring-settle)]",
  "ow-switch-held:[--_switch-held:1]",
  "ow-switch-held:duration-[var(--ow-spring-travel-duration),90ms]",
  "ow-switch-held:ease-[var(--ow-spring-travel),var(--ow-ease-out)]",
  // The key's shadow, on the key inside the clear border and not on the border.
  "before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit]",
  "before:shadow-(shadow:--ow-surface-shadow) before:content-['']",
  // An icon in the thumb keeps 2px of the key around it.
  "[&>:where(svg,img)]:block [&>:where(svg,img)]:size-[calc(100%_-_4px)]",
  // The thumb goes to its place with no travel, stretch, or squash.
  "motion-reduce:[--_lean:0] motion-reduce:scale-none motion-reduce:[transition:none]",
  // The key is drawn solid.
  "forced-colors:forced-color-adjust-none forced-colors:bg-[CanvasText] forced-colors:text-[Canvas]",
  "forced-colors:before:shadow-none",
  "forced-colors:data-checked:bg-[HighlightText] forced-colors:data-checked:text-[Highlight]",
  "forced-colors:data-disabled:bg-[GrayText]",
  "forced-colors:data-disabled:data-checked:bg-[Canvas] forced-colors:data-disabled:data-checked:text-[GrayText]",
];

/** The classes of the inner parts. */
export const switchSlots: Record<"thumb", string> = { thumb: thumb.join(" ") };
