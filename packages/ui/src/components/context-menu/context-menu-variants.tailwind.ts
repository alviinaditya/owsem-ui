// The Tailwind CSS v4 twin of context-menu-variants.ts: the same exports, with the styles as utility classes.

// The area has no look of its own. A long press on iOS must not raise the system's callout over the menu.
const trigger = ["[-webkit-touch-callout:none]"];

/** The area's class. The popup and its items are Menu's. */
export const contextMenuSlots: Record<"trigger", string> = { trigger: trigger.join(" ") };
