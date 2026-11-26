// No "use client": an Alert Dialog's classes can be used from Server Components.

/** The classes of the parts. */
export const alertDialogSlots = {
  backdrop: "ow-alert-dialog__backdrop",
  viewport: "ow-alert-dialog__viewport",
  popup: "ow-alert-dialog__popup",
  title: "ow-alert-dialog__title",
  description: "ow-alert-dialog__description",
} as const;
