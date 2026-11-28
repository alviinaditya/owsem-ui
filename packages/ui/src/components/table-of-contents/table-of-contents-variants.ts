// No "use client": the classes of Table of Contents can be used from Server Components.

/** The classes of the parts. */
export const tableOfContentsSlots = {
  root: "ow-table-of-contents",
  list: "ow-table-of-contents__list",
  item: "ow-table-of-contents__item",
  link: "ow-table-of-contents__link",
  rail: "ow-table-of-contents__rail",
  line: "ow-table-of-contents__line",
  marker: "ow-table-of-contents__marker",
} as const;
