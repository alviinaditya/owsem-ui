// The Tailwind CSS v4 twin of field-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// Only type and even gaps: the control is Input, and a message's color says what it is.
const root = ["flex flex-col gap-[0.5em] min-w-0 text-[0.875rem] leading-[1.25]"];

const label = [
  "text-(color:--ow-fg) font-medium",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
];

// An error next to it takes its place, so nothing below moves; :where keeps it at one class.
const description = [
  "m-0 text-(color:--ow-muted) text-[0.93em] leading-[1.4]",
  "[:where(:has(>[data-slot=field-error]))>&]:hidden",
];

// Base UI lists several messages.
const error = [
  "text-(color:--ow-critical) text-[0.93em] leading-[1.4]",
  "[&>:where(ul)]:m-0 [&>:where(ul)]:ps-[1.25em]",
];

const item = ["flex items-center gap-[0.5em]"];

/** The classes of the parts. */
export const fieldSlots: Record<"root" | "label" | "description" | "error" | "item", string> = {
  root: root.join(" "),
  label: label.join(" "),
  description: description.join(" "),
  error: error.join(" "),
  item: item.join(" "),
};
