// No "use client": a Dialog's classes can be used from Server Components.

/** The classes of the parts. */
export const dialogSlots = {
  backdrop: "ow-dialog__backdrop",
  viewport: "ow-dialog__viewport",
  popup: "ow-dialog__popup",
  title: "ow-dialog__title",
  description: "ow-dialog__description",
} as const;
