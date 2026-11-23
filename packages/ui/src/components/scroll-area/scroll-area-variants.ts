// No "use client": a Scroll Area's classes can be used from Server Components.

/** The classes of the parts. */
export const scrollAreaSlots = {
  root: "ow-scroll-area",
  viewport: "ow-scroll-area__viewport",
  content: "ow-scroll-area__content",
  scrollbar: "ow-scroll-area__scrollbar",
  thumb: "ow-scroll-area__thumb",
  corner: "ow-scroll-area__corner",
} as const;
