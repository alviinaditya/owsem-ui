// No "use client": a Toast's classes can be used from Server Components.

/** The classes of the parts. */
export const toastSlots = {
  viewport: "ow-toast__viewport",
  root: "ow-toast",
  content: "ow-toast__content",
  mark: "ow-toast__mark",
  text: "ow-toast__text",
  title: "ow-toast__title",
  description: "ow-toast__description",
  action: "ow-toast__action",
  close: "ow-toast__close",
  positioner: "ow-toast__positioner",
  arrow: "ow-toast__arrow",
} as const;
