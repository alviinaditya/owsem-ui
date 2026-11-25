// The Tailwind CSS v4 twin of avatar-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarVariantProps {
  /** 32, 40, or 48 px, the heights of Button. Inside an Avatar.Group, the group's. @default "md" */
  size?: AvatarSize | undefined;
}

// A circle: a flat tint of the text color with no edge, holding a picture, initials, or an icon.
const root = [
  // Box.
  "inline-flex flex-none items-center justify-center size-(--_size) overflow-hidden",
  "rounded-[50%]",
  // Looks the same rendered as a button or a link.
  "m-0 p-0 border-0 font-[family-name:inherit]",
  // 1 toward the end of a line of text, -1 where the page runs right to left.
  "[--_dir:1] [&:dir(rtl)]:[--_dir:-1]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  "bg-[color-mix(in_oklab,var(--ow-fg)_10%,transparent)] text-(color:--ow-fg)",
  // Type. One width for every digit, so "+3" and "+8" fit the same.
  "font-medium tabular-nums no-underline whitespace-nowrap align-middle select-none",
  // 2px outside the circle.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "[&:where(button,a)]:cursor-pointer",
  // More contrast asked for: the edge comes back at 3:1.
  "contrast-more:not-focus-visible:outline-(color:--ow-edge)",
  // The circle keeps its outline as the edge.
  "forced-colors:focus-visible:outline-[Highlight]",
];

const sizeStyles = {
  sm: "[--_size:32px] text-[0.8125rem] leading-none",
  md: "[--_size:40px] text-[0.875rem] leading-none",
  lg: "[--_size:48px] text-[1rem] leading-none",
};

const variants = cva(root, {
  variants: { size: sizeStyles },
  defaultVariants: { size: "md" },
});

/** The root's classes. */
export function avatarVariants({ size }: AvatarVariantProps = {}): string {
  return cn(variants({ size }));
}

// Covers the circle, and fades in from the tint when it has loaded, and out when it goes. Base UI
// renders the fallback only while the picture has not loaded, so the tint is all that is under it.
const image = [
  "flex-none size-full object-cover opacity-100 transition-[opacity] duration-150 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
  // No fade: the picture is there when it is there.
  "motion-reduce:transition-none",
];

// Initials or an icon, centered. An icon is the font's size plus 2px.
const fallback = [
  "inline-flex items-center justify-center size-full",
  "[&>svg]:flex-none [&>svg]:size-[calc(1em_+_2px)]",
];

// Each avatar overlaps the one before by an eighth of its own size. An avatar with another after it
// is cut where that one sits: its center is seven eighths of a size along, and the cut is 2px wider
// than the circle. The anti-aliased edge is half a pixel. The rules go from least to most specific:
// the cut after, the cut before an avatar in front, both, then the one in front (whole, above its
// neighbors). Each state is written out for focus and for hover, and a plain avatar does not react.
const group = [
  "inline-flex flex-none items-center isolate",
  "[&>[data-slot=avatar]~[data-slot=avatar]]:ms-[calc(var(--_size)_*_-0.125)]",
  "[&>:where([data-slot=avatar])]:[--_cut:calc(var(--_size)_/_2_+_2px)]",
  "[&>:where([data-slot=avatar])]:[--_next:radial-gradient(circle_var(--_cut)_at_calc(50%_+_var(--_dir)_*_var(--_size)_*_0.875)_50%,transparent_calc(var(--_cut)_-_0.5px),Canvas_var(--_cut))]",
  "[&>:where([data-slot=avatar])]:[--_before:radial-gradient(circle_var(--_cut)_at_calc(50%_-_var(--_dir)_*_var(--_size)_*_0.875)_50%,transparent_calc(var(--_cut)_-_0.5px),Canvas_var(--_cut))]",
  "[&>:where([data-slot=avatar]:has(~[data-slot=avatar]))]:[mask-image:var(--_next)]",
  // In front, whole, with its whole ring: when focused, and a button or a link when hovered. The one
  // after it is then cut where it sits, so the gap stays.
  "[&>:where([data-slot=avatar]:focus-visible)+[data-slot=avatar]]:[mask-image:var(--_before)]",
  "[&>:where([data-slot=avatar]:focus-visible)+[data-slot=avatar]:has(~[data-slot=avatar])]:[mask-image:var(--_before),var(--_next)]",
  "[&>:where([data-slot=avatar]:focus-visible)+[data-slot=avatar]:has(~[data-slot=avatar])]:[mask-composite:intersect]",
  "[&>[data-slot=avatar]:focus-visible:focus-visible]:relative [&>[data-slot=avatar]:focus-visible:focus-visible]:z-1 [&>[data-slot=avatar]:focus-visible:focus-visible]:[mask-image:none]",
  "[@media(hover:hover)]:[&>:where(:is(button,a)[data-slot=avatar]:hover)+[data-slot=avatar]]:[mask-image:var(--_before)]",
  "[@media(hover:hover)]:[&>:where(:is(button,a)[data-slot=avatar]:hover)+[data-slot=avatar]:has(~[data-slot=avatar])]:[mask-image:var(--_before),var(--_next)]",
  "[@media(hover:hover)]:[&>:where(:is(button,a)[data-slot=avatar]:hover)+[data-slot=avatar]:has(~[data-slot=avatar])]:[mask-composite:intersect]",
  "[@media(hover:hover)]:[&>:is(button,a)[data-slot=avatar]:hover:hover]:relative [@media(hover:hover)]:[&>:is(button,a)[data-slot=avatar]:hover:hover]:z-1 [@media(hover:hover)]:[&>:is(button,a)[data-slot=avatar]:hover:hover]:[mask-image:none]",
];

/** The classes of the inner parts. */
export const avatarSlots: Record<"image" | "fallback" | "group", string> = {
  image: image.join(" "),
  fallback: fallback.join(" "),
  group: group.join(" "),
};
