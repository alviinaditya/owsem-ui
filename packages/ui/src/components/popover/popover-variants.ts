// No "use client": a Popover's classes can be used from Server Components.

/** The classes of the parts. */
export const popoverSlots = {
  positioner: "ow-popover__positioner",
  popup: "ow-popover__popup",
  arrow: "ow-popover__arrow",
  title: "ow-popover__title",
  description: "ow-popover__description",
} as const;
