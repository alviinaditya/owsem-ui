// No "use client": a Context Menu's classes can be used from Server Components.

/**
 * The area's class. The popup and its items are Menu's, so their classes come from menuSlots and
 * menuPopupVariants.
 */
export const contextMenuSlots = { trigger: "ow-context-menu__trigger" } as const;
