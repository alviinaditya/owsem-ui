// The Tailwind CSS v4 twin of copy-button-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-copy-button-draw keyframes.

// The root is a Button, so it also carries these, which Copy Button adds to Button's own.
const root = [
  // The theme tokens it reads, besides the Button's own.
  "[--_duration:var(--ow-spring-settle-duration)] [--_spring:var(--ow-spring-settle)]",
];

const icon = ["fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"];

// The path's length is 1: it draws in from its short stroke, as a hand writes a check.
const check = [
  "[&>path]:animate-[ow-copy-button-draw_var(--_duration)_var(--_spring)]",
  // The check is just there.
  "motion-reduce:[&>path]:animate-none",
];

const label = ["inline-grid"];

// Hidden, it still holds its width, and it is not read.
const labelText = ["[grid-area:1/1] not-data-visible:invisible"];

const tip = [
  // The Tooltip's words share one cell, centered. useTipWidth sets the cell's width to the one on
  // show, so the popup's width eases to it.
  "grid grid-cols-[minmax(0,1fr)] justify-items-center whitespace-nowrap",
  "transition-[inline-size] duration-180 ease-(--ow-ease-out)",
  // The popup's width snaps.
  "motion-reduce:[transition:none]",
];

// The other word leaves over the first, the old one up and the new one in from below.
const tipText = [
  "[--_slide:calc(4px_*_var(--ow-motion-scale))] [grid-area:1/1] will-change-[transform,opacity]",
  "transition-[opacity,transform] duration-180 ease-(--ow-ease-out)",
  "not-data-visible:opacity-0 not-data-visible:pointer-events-none",
  "not-data-visible:transform-[translateY(calc(-1_*_var(--_slide)))]",
  // The copied word comes in from below, and leaves downward when the icon is back.
  "not-data-visible:last:transform-[translateY(var(--_slide))]",
  // The words only cross-fade.
  "motion-reduce:transition-[opacity]",
  "motion-reduce:not-data-visible:transform-none motion-reduce:not-data-visible:last:transform-none",
];

// Visually hidden, read by screen readers.
const status = ["absolute size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]"];

/** The classes of the parts. */
export const copyButtonSlots: Record<
  "root" | "icon" | "check" | "label" | "labelText" | "tip" | "tipText" | "status",
  string
> = {
  root: root.join(" "),
  icon: icon.join(" "),
  check: check.join(" "),
  label: label.join(" "),
  labelText: labelText.join(" "),
  tip: tip.join(" "),
  tipText: tipText.join(" "),
  status: status.join(" "),
};
