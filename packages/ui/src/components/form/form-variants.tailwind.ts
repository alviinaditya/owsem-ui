// The Tailwind CSS v4 twin of form-variants.ts: the same exports, with the styles as utility classes.

// Only the gap between the fields. A button stays as wide as its label, where a column would stretch it.
const root = ["flex flex-col gap-[1.25em] min-w-0 [&>:where(button)]:self-start"];

/** The classes of the parts. */
export const formSlots: Record<"root", string> = { root: root.join(" ") };
