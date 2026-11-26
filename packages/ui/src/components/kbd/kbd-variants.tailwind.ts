// The Tailwind CSS v4 twin of kbd-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// A keycap: a tint of the text color, sized from the text around it. Half the control radius.
const root = [
  // Box.
  "box-border inline-flex flex-none items-center justify-center gap-[0.25em] min-w-[1.75em]",
  "px-[0.4em] py-(--_kbd-py) [--_kbd-py:0.125em] rounded-[calc(var(--ow-radius)_/_2)] bg-[color-mix(in_oklab,var(--ow-fg)_8%,transparent)]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type. Muted leans toward the text color: it must read on the key over any popup.
  "font-[family-name:inherit] text-[0.75em] leading-[1.25] whitespace-nowrap",
  "text-[color-mix(in_oklab,var(--ow-muted)_70%,var(--ow-fg))]",
  // A line box is centered on its font's ascent and descent, which puts capitals above the middle
  // of the key. Trimmed to the capitals, the label is centered on them. A flex container has no
  // line to trim, so a key of text alone is a block here; the padding keeps its height at 1.5em.
  // A key with an icon stays flex. The padding goes through --_kbd-py (Tooltip sets --_py), so a
  // py-* of yours replaces it.
  "supports-[text-box:trim-both_cap_alphabetic]:not-has-[>*]:inline-block",
  "supports-[text-box:trim-both_cap_alphabetic]:not-has-[>*]:[--_kbd-py:calc((1.5em_-_1cap)_/_2)]",
  "supports-[text-box:trim-both_cap_alphabetic]:not-has-[>*]:text-center",
  "supports-[text-box:trim-both_cap_alphabetic]:not-has-[>*]:[text-box:trim-both_cap_alphabetic]",
];

/** The classes of the parts. */
export const kbdSlots: Record<"root", string> = { root: root.join(" ") };
