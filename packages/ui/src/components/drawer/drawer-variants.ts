// No "use client": a Drawer's classes can be used from Server Components.

/** The classes of the parts. */
export const drawerSlots = {
  backdrop: "ow-drawer__backdrop",
  viewport: "ow-drawer__viewport",
  popup: "ow-drawer__popup",
  content: "ow-drawer__content",
  title: "ow-drawer__title",
  description: "ow-drawer__description",
  swipeArea: "ow-drawer__swipe-area",
  indent: "ow-drawer__indent",
  indentBackground: "ow-drawer__indent-background",
} as const;
