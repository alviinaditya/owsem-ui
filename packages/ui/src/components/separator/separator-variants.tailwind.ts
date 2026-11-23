// The Tailwind CSS v4 twin of separator-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// A border rather than a background, so the line stays visible in forced colors.
// Zero thickness; flex and grid stretch only the length.
const root = [
  "flex-none self-stretch border-0 border-solid border-(color:--ow-line)",
  "data-[orientation=horizontal]:block-0 data-[orientation=horizontal]:border-bs",
  "data-[orientation=vertical]:inline-0 data-[orientation=vertical]:border-s",
];

/** The classes of the parts. */
export const separatorSlots: Record<"root", string> = { root: root.join(" ") };
