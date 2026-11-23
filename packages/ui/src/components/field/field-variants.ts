// No "use client": a Field's classes can be used from Server Components.

/** The classes of the parts. */
export const fieldSlots = {
  root: "ow-field",
  label: "ow-field__label",
  description: "ow-field__description",
  error: "ow-field__error",
  item: "ow-field__item",
} as const;
