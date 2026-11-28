// The Tailwind CSS v4 twin of drawer-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// The scrim. An explicit Drawer.Backdrop replaces the one Portal draws. It fades out as the sheet
// is swiped away, and the finger sets it, without easing.
const backdrop = [
  "[--_bg:var(--ow-backdrop)] fixed inset-0 bg-(color:--_bg)",
  "opacity-[calc(1_-_var(--drawer-swipe-progress,0))]",
  "transition-opacity duration-400 ease-(--ow-ease-drawer)",
  "has-[+[data-slot=drawer-backdrop]]:hidden",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
  // Leaving is quicker than arriving, and quicker still after a fast swipe.
  "data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)_*_300ms)]",
  "data-swiping:duration-0",
];

// The layer that takes the swipe; the sheet is placed against it. Base UI hides it with the
// attribute while keepMounted keeps it.
const viewport = [
  "fixed inset-0 overflow-hidden overscroll-contain",
  "[&[hidden]]:hidden",
  // While a swipe runs, the whole screen shows the grip.
  "has-[[data-slot=drawer-popup][data-swiping]]:cursor-grabbing",
];

// The sheet's fill runs on past the edge it is attached to, as copies of the box shifted that way
// (a shadow is not clipped by the popup's own scrolling), so no gap shows when it is dragged off
// the edge. Underscores are spaces in a class.
const bleed = (axis: "x" | "y", sign: 1 | -1) =>
  Array.from({ length: 8 }, (_, i) => {
    const step = `${sign * 56 * (i + 1)}px`;
    return axis === "y" ? `0_${step}_0_0_var(--_bg)` : `${step}_0_0_0_var(--_bg)`;
  }).join(",");

// The sheet at the edge the swipe direction names, with the radius on the corners facing the page.
// It follows the finger through Base UI's swipe variables, then settles or leaves on the Core
// drawer curve.
const popup = [
  // The theme tokens it reads, and the page left showing past the sheet.
  "[--_bg:var(--ow-raised-bg)] [--_shadow:var(--ow-popup-shadow)] [--_fg:var(--ow-fg)]",
  "[--_muted:var(--ow-muted)] [--_r:var(--ow-radius)] [--_p:calc(16em_/_14)] [--_gap:3rem]",
  // Where it rests (the finger and the snap point move it) and where it comes from.
  "[--_rest:translate(var(--drawer-swipe-movement-x,0px),calc(var(--drawer-snap-point-offset,0px)_+_var(--drawer-swipe-movement-y,0px)))]",
  "[--_out:translateY(calc(100%_+_32px))]",
  // How far a drawer nested in it steps it back, in the direction of its own edge.
  "[--_step:translateY(calc(var(--nested-drawers)_*_-28px))]",
  // Box.
  "fixed flex flex-col box-border p-(--_p) bg-(color:--_bg) [box-shadow:var(--_bleed),var(--_shadow)]",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg) text-[0.875rem] leading-[1.5]",
  // Scrolls on its own, with a thin, quiet scrollbar.
  "overflow-y-auto overscroll-contain [scrollbar-width:thin]",
  "[scrollbar-color:color-mix(in_oklab,var(--_fg)_30%,transparent)_transparent]",
  // Base UI hides it with the attribute while keepMounted keeps it.
  "[&[hidden]]:hidden",
  // Bottom: swiped down to leave. Full width up to 32rem, centered.
  "data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:inset-x-0",
  "data-[swipe-direction=down]:mx-auto data-[swipe-direction=down]:w-full",
  "data-[swipe-direction=down]:max-w-[32rem] data-[swipe-direction=down]:max-h-[calc(100%_-_var(--_gap))]",
  "data-[swipe-direction=down]:pt-[calc(var(--_p)_+_12px)]",
  "data-[swipe-direction=down]:pb-[calc(var(--_p)_+_env(safe-area-inset-bottom))]",
  "data-[swipe-direction=down]:[border-radius:var(--_r)_var(--_r)_0_0]",
  "data-[swipe-direction=down]:origin-[50%_100%]",
  `data-[swipe-direction=down]:[--_bleed:${bleed("y", 1)}]`,
  // Top: swiped up to leave.
  "data-[swipe-direction=up]:[--_out:translateY(calc(-100%_-_32px))]",
  "data-[swipe-direction=up]:[--_step:translateY(calc(var(--nested-drawers)_*_28px))]",
  "data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:inset-x-0",
  "data-[swipe-direction=up]:mx-auto data-[swipe-direction=up]:w-full",
  "data-[swipe-direction=up]:max-w-[32rem] data-[swipe-direction=up]:max-h-[calc(100%_-_var(--_gap))]",
  "data-[swipe-direction=up]:pt-[calc(var(--_p)_+_env(safe-area-inset-top))]",
  "data-[swipe-direction=up]:pb-[calc(var(--_p)_+_12px)]",
  "data-[swipe-direction=up]:[border-radius:0_0_var(--_r)_var(--_r)]",
  "data-[swipe-direction=up]:origin-[50%_0]",
  `data-[swipe-direction=up]:[--_bleed:${bleed("y", -1)}]`,
  // Left and right are the screen's edges, in either text direction, as the swipe is.
  "data-[swipe-direction=left]:[--_out:translateX(calc(-100%_-_32px))]",
  "data-[swipe-direction=left]:[--_step:translateX(calc(var(--nested-drawers)_*_28px))]",
  "data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:left-0",
  "data-[swipe-direction=left]:w-[24rem] data-[swipe-direction=left]:max-w-[calc(100%_-_var(--_gap))]",
  "data-[swipe-direction=left]:[border-radius:0_var(--_r)_var(--_r)_0]",
  "data-[swipe-direction=left]:origin-[0_50%]",
  `data-[swipe-direction=left]:[--_bleed:${bleed("x", -1)}]`,
  "data-[swipe-direction=right]:[--_out:translateX(calc(100%_+_32px))]",
  "data-[swipe-direction=right]:[--_step:translateX(calc(var(--nested-drawers)_*_-28px))]",
  "data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0",
  "data-[swipe-direction=right]:w-[24rem] data-[swipe-direction=right]:max-w-[calc(100%_-_var(--_gap))]",
  "data-[swipe-direction=right]:[border-radius:var(--_r)_0_0_var(--_r)]",
  "data-[swipe-direction=right]:origin-[100%_50%]",
  `data-[swipe-direction=right]:[--_bleed:${bleed("x", 1)}]`,
  // The grabber: a short bar at the edge facing the page. Decoration, never read out.
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:before:content-['']",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:before:absolute",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:before:inset-x-0",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:before:mx-auto",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:before:w-[36px]",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:before:h-[4px]",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:before:rounded-[calc(var(--ow-radius)_/_8)]",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:before:bg-[color-mix(in_oklab,var(--_fg)_25%,transparent)]",
  "data-[swipe-direction=down]:before:top-[8px] data-[swipe-direction=up]:before:bottom-[8px]",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:forced-colors:before:bg-[CanvasText]",
  // A comfortable target around the grabber, 72 × 24px with the bar in its upper part, and the only
  // place that shows a grab cursor: the rest of the sheet holds text and controls.
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:after:content-['']",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:after:absolute",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:after:inset-x-0",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:after:mx-auto",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:after:w-[72px]",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:after:h-[24px]",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:after:cursor-grab",
  "data-[swipe-direction=down]:after:top-0 data-[swipe-direction=up]:after:bottom-0",
  // Focused itself, as Base UI does on opening, or when `initialFocus` says so.
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  // Its own layer, so it lands without a pixel jump.
  "[transform:var(--_rest)] will-change-transform transition-[transform] duration-400 ease-(--ow-ease-drawer)",
  // Steps back while a drawer nested in it is open, further for each one.
  "data-nested-drawer-open:[transform:var(--_rest)_var(--_step)_scale(calc(1_-_var(--nested-drawers)_*_0.05))]",
  "data-starting-style:[transform:var(--_out)] data-ending-style:[transform:var(--_out)]",
  // Leaving is quicker than arriving, and quicker still after a fast swipe.
  "data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)_*_300ms)]",
  "data-swiping:select-none",
  // While a swipe runs, the whole screen shows the grip, wherever the pointer has got to.
  "data-swiping:cursor-grabbing data-swiping:*:cursor-grabbing",
  "[&:is([data-swipe-direction=down],[data-swipe-direction=up])]:data-swiping:after:cursor-grabbing",
  // More contrast asked for: a ring around the sheet.
  "contrast-more:[--_shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
  // No slide, no step back: it fades, wherever the finger left it.
  "motion-reduce:transition-[opacity] motion-reduce:duration-250 motion-reduce:ease-(--ow-ease-out)",
  "motion-reduce:data-ending-style:duration-250",
  "motion-reduce:data-starting-style:[transform:var(--_rest)]",
  "motion-reduce:data-ending-style:[transform:var(--_rest)]",
  "motion-reduce:data-nested-drawer-open:[transform:var(--_rest)]",
  "motion-reduce:data-starting-style:opacity-0 motion-reduce:data-ending-style:opacity-0",
];

// It scrolls on its own; the popup then stays put and the title and buttons stay in view.
const content = [
  "flex-auto min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin]",
  "[scrollbar-color:color-mix(in_oklab,var(--ow-fg)_30%,transparent)_transparent]",
];

// The heading keeps its distance from what follows; a description stays close to its title.
const title = [
  "m-0 text-[calc(16em_/_14)] font-semibold leading-[1.4]",
  "not-last:mb-[1em] has-[+[data-slot=drawer-description]]:mb-[0.25em]",
];

const description = ["m-0 text-(color:--_muted) not-last:mb-(--_p)"];

// A strip along the edge the drawer comes from, where a swipe opens it.
const swipeArea = [
  "fixed",
  "data-[swipe-direction=up]:inset-[auto_0_0] data-[swipe-direction=up]:h-[24px]",
  "data-[swipe-direction=down]:inset-[0_0_auto] data-[swipe-direction=down]:h-[24px]",
  "data-[swipe-direction=right]:inset-[0_auto_0_0] data-[swipe-direction=right]:w-[24px]",
  "data-[swipe-direction=left]:inset-[0_0_0_auto] data-[swipe-direction=left]:w-[24px]",
];

// The page recedes a little while a drawer is open: opt in by wrapping it. It stays unmoved and
// unclipped at rest.
const indent = [
  "[--_bg:var(--ow-bg)] bg-(color:--_bg) origin-[50%_0]",
  "transition-[transform,border-radius] duration-400 ease-(--ow-ease-drawer)",
  "data-active:rounded-(--ow-radius) data-active:overflow-clip data-active:[transform:scale(0.96)]",
  // Only while receded: a layer at rest would hold the page's fixed children.
  "data-active:will-change-transform",
  // No recede.
  "motion-reduce:transition-none motion-reduce:data-active:transform-none",
  "motion-reduce:data-active:rounded-none motion-reduce:data-active:overflow-visible",
  "motion-reduce:data-active:will-change-auto",
];

// What shows around the receded page.
const indentBackground = ["[--_bg:var(--ow-well-bg)] fixed inset-0 -z-1 bg-(color:--_bg)"];

/** The classes of the parts. */
export const drawerSlots: Record<
  | "backdrop"
  | "viewport"
  | "popup"
  | "content"
  | "title"
  | "description"
  | "swipeArea"
  | "indent"
  | "indentBackground",
  string
> = {
  backdrop: backdrop.join(" "),
  viewport: viewport.join(" "),
  popup: popup.join(" "),
  content: content.join(" "),
  title: title.join(" "),
  description: description.join(" "),
  swipeArea: swipeArea.join(" "),
  indent: indent.join(" "),
  indentBackground: indentBackground.join(" "),
};
