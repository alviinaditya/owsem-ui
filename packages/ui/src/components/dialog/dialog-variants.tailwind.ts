// The Tailwind CSS v4 twin of dialog-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// The scrim. An explicit Dialog.Backdrop replaces the one Portal draws.
const backdrop = [
  "[--_bg:var(--ow-backdrop)] fixed inset-0 bg-(color:--_bg)",
  "transition-opacity duration-250 ease-(--ow-ease-out)",
  "has-[+[data-slot=dialog-backdrop]]:hidden",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
  // Leaving is quicker than arriving.
  "data-ending-style:duration-200",
];

// Whichever scrolls does so on its own, with a thin, quiet scrollbar over the rounded corners.
const scroller = [
  "overflow-y-auto overscroll-contain [scrollbar-width:thin]",
  "[scrollbar-color:color-mix(in_oklab,var(--ow-fg)_30%,transparent)_transparent]",
];

// Optional: the popup grows with its content, and this scrolls instead.
const viewport = [
  ...scroller,
  "fixed inset-0 grid py-[16px]",
  // Base UI hides it with the attribute while keepMounted keeps it.
  "[&[hidden]]:hidden",
];

// Auto margins center it, in either text direction, and leave the transform to the motion. It
// stays 16px inside the screen and scrolls inside itself. It fades in and grows from its own middle
// in 250 ms.
const popup = [
  ...scroller,
  // The theme tokens it reads.
  "[--_bg:var(--ow-raised-bg)] [--_shadow:var(--ow-popup-shadow)] [--_fg:var(--ow-fg)]",
  "[--_muted:var(--ow-muted)] [--_p:calc(16em_/_14)]",
  // Box.
  "fixed inset-0 box-border w-[32em] max-w-[calc(100%_-_32px)] h-fit max-h-[calc(100%_-_32px)]",
  "m-auto p-(--_p) rounded-(--ow-radius) bg-(color:--_bg) shadow-(shadow:--_shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg) text-[0.875rem] leading-[1.5]",
  // In a viewport it takes its place in the flow, and the viewport scrolls.
  "in-data-[slot=dialog-viewport]:relative in-data-[slot=dialog-viewport]:inset-auto",
  "in-data-[slot=dialog-viewport]:max-h-none in-data-[slot=dialog-viewport]:overflow-y-visible",
  // Its own layer, so it lands without a pixel jump.
  "will-change-transform transition-[opacity,transform] duration-250 ease-(--ow-ease-out)",
  // Steps back while a dialog nested in it is open, further for each one (not when motion is
  // reduced); opening and closing come first.
  "motion-safe:data-nested-dialog-open:not-data-starting-style:not-data-ending-style:transform-[translateY(calc(var(--nested-dialogs)_*_-16px))_scale(calc(1_-_var(--nested-dialogs)_*_0.05))]",
  "data-starting-style:opacity-0 data-starting-style:transform-[scale(0.96)]",
  "data-ending-style:opacity-0 data-ending-style:transform-[scale(0.96)]",
  // Leaving is quicker than arriving.
  "data-ending-style:duration-200",
  // Focused itself when it has nothing to tab to, or when `initialFocus` says so.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  // More contrast asked for: a ring around the popup.
  "contrast-more:[--_shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
  // It fades, without growing.
  "motion-reduce:data-starting-style:transform-none motion-reduce:data-ending-style:transform-none",
];

// The heading keeps its distance from what follows; a description stays close to its title.
const title = [
  "m-0 text-[calc(16em_/_14)] font-semibold leading-[1.4]",
  "not-last:mb-[1em] has-[+[data-slot=dialog-description]]:mb-[0.25em]",
];

const description = ["m-0 text-(color:--_muted) not-last:mb-(--_p)"];

/** The classes of the parts. */
export const dialogSlots: Record<
  "backdrop" | "viewport" | "popup" | "title" | "description",
  string
> = {
  backdrop: backdrop.join(" "),
  viewport: viewport.join(" "),
  popup: popup.join(" "),
  title: title.join(" "),
  description: description.join(" "),
};
