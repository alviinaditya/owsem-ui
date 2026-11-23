// The Tailwind CSS v4 twin of icon-morph-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// The new icon grows in as the old one shrinks, blurs, and fades out, both in one grid cell.
const root = [
  // The tokens it reads. An icon shrinks and blurs while hidden; not at all with the motion scale at 0.
  "[--_motion:var(--ow-motion-scale)] [--_duration:var(--ow-spring-settle-duration)]",
  "[--_spring:var(--ow-spring-settle)] [--_scale:calc(1_-_0.5_*_var(--_motion))]",
  "[--_blur:calc(3px_*_var(--_motion))]",
  // Box.
  "inline-grid",
  // In an icon slot (Button, Toggle, Toolbar), it and its icons fill the slot, as one icon would.
  // On its own, each icon keeps its size, centered on the larger one.
  "[:is([data-slot=toggle-icon],[data-slot=toolbar-icon])>&]:size-full",
  "[[data-slot=button-icon]>*>&]:size-full",
  "[:is([data-slot=toggle-icon],[data-slot=toolbar-icon])>&>*>:where(svg,img)]:block",
  "[:is([data-slot=toggle-icon],[data-slot=toolbar-icon])>&>*>:where(svg,img)]:size-full",
  "[[data-slot=button-icon]>*>&>*>:where(svg,img)]:block",
  "[[data-slot=button-icon]>*>&>*>:where(svg,img)]:size-full",
];

const item = [
  // Box. Both icons share one cell, so nothing around them moves.
  "grid [grid-area:1/1] place-items-center",
  // Its own layer, so it lands without a pixel jump.
  "will-change-[scale]",
  // On the settle spring, so a change mid-swap turns around where it is.
  "transition-[opacity,scale,filter] duration-(--_duration) ease-(--_spring)",
  // Hidden while one enters or leaves.
  "data-starting-style:opacity-0 data-starting-style:scale-(--_scale) data-starting-style:blur-(--_blur)",
  "data-ending-style:opacity-0 data-ending-style:scale-(--_scale) data-ending-style:blur-(--_blur)",
  "data-ending-style:pointer-events-none",
  // A short crossfade, without movement or blur.
  "motion-reduce:transition-[opacity] motion-reduce:duration-150 motion-reduce:ease-(--ow-ease-out)",
  "motion-reduce:data-starting-style:scale-none motion-reduce:data-starting-style:blur-none",
  "motion-reduce:data-ending-style:scale-none motion-reduce:data-ending-style:blur-none",
];

/** The classes of the parts. */
export const iconMorphSlots: Record<"root" | "item", string> = {
  root: root.join(" "),
  item: item.join(" "),
};
