// Generated from components/kbd by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of kbd-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// A keycap: a tint of the text color, sized from the text around it. Half the control radius.
const root = [
  // Box.
  "box-border inline-flex flex-none items-center justify-center gap-[0.25em] min-w-[1.75em]",
  "px-[0.4em] py-[0.125em] rounded-[calc(var(--ow-radius)_/_2)] bg-[color-mix(in_oklab,var(--ow-fg)_8%,transparent)]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type. Muted leans toward the text color: it must read on the key over any popup.
  "font-[family-name:inherit] text-[0.75em] leading-[1.25] whitespace-nowrap",
  "text-[color-mix(in_oklab,var(--ow-muted)_70%,var(--ow-fg))]",
];

/** The classes of the parts. */
export const kbdSlots: Record<"root", string> = { root: root.join(" ") };
