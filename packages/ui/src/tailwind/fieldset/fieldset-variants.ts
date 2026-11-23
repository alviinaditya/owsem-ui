// Generated from components/fieldset by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of fieldset-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// No frame, no line, and no outer margins. A fieldset's own minimum would stop it shrinking with its parent.
const root = ["flex flex-col gap-[1.25em] min-w-0 m-0 p-0 border-0 text-[0.875rem] leading-[1.25]"];

// A heading passed to `render` keeps the legend's look. The legend stands a little apart from the
// fields, on top of their gap.
const legend = [
  "m-0 text-(color:--ow-fg) text-[length:inherit] font-semibold",
  "after:block after:h-[0.75em] after:content-['']",
  "data-disabled:cursor-not-allowed data-disabled:opacity-45",
];

/** The classes of the parts. */
export const fieldsetSlots: Record<"root" | "legend", string> = {
  root: root.join(" "),
  legend: legend.join(" "),
};
