// Generated from components/toast by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of toast-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-spin keyframes.

// The region is as tall as the front card, which Base UI measures for it, so the focus ring F6
// draws hugs that card. The cards sit against its bottom edge; the others peek or open above. A
// viewport that only holds anchored toasts takes no room: each one places itself.
const viewport = [
  "[--_edge:16px]",
  "fixed bottom-[max(var(--_edge),env(safe-area-inset-bottom))] end-(--_edge) z-100 box-border",
  "w-[22rem] max-w-[calc(100%_-_2_*_var(--_edge))] h-[var(--toast-frontmost-height,0px)]",
  "has-[>[data-slot=toast-positioner]]:static has-[>[data-slot=toast-positioner]]:w-0",
  "has-[>[data-slot=toast-positioner]]:h-0",
  "focus-visible:outline-2 focus-visible:outline-(--ow-focus) focus-visible:outline-offset-2",
  "focus-visible:rounded-(--ow-radius)",
];

// A raised card on the popup material. Newest in front, older ones peek behind it a little
// smaller; hover or focus opens the stack into a list. Everything moves from Base UI's variables:
// the index and offset place a card, the swipe movement follows the finger, and the stack settles
// on the Core drawer curve. A popup of its own when anchored.
const root = [
  "group/ow-toast",
  // The theme tokens it reads.
  "[--_bg:var(--ow-raised-bg)] [--_shadow:var(--ow-popup-shadow)] [--_fg:var(--ow-fg)]",
  "[--_muted:var(--ow-muted)] [--_r:var(--ow-radius)]",
  // The gap in an opened list, how much of each card behind shows, and how much it shrinks.
  "[--_gap:8px] [--_peek:8px] [--_step:0.05]",
  "[--_scale:max(0,calc(1_-_var(--toast-index)_*_var(--_step)))]",
  // Behind the front card, a closed stack is as tall as the front card.
  "[--_height:var(--toast-frontmost-height,var(--toast-height))]",
  // Where it rests, closed: up by its peek, and up again for the height its scale gives away.
  // Leaving, Base UI drops the heights; it then keeps the place it had.
  "[--_y:calc(var(--toast-swipe-movement-y,0px)_-_var(--toast-index)_*_var(--_peek)_-_(1_-_var(--_scale))_*_var(--_height,0px))]",
  "[--_x:var(--toast-swipe-movement-x,0px)] [--_away:calc(100%_+_16px)]",
  // Box.
  "absolute bottom-0 inset-x-0 z-[calc(100_-_var(--toast-index))] box-border w-full h-(--_height)",
  "py-[12px] px-[14px] rounded-(--_r) bg-(color:--_bg) shadow-(shadow:--_shadow)",
  // Invisible until forced colors draw it as the edge.
  "outline-1 -outline-offset-1 outline-transparent",
  // Type.
  "text-(color:--_fg) text-[0.875rem] leading-[1.5]",
  // Motion: its own layer, so it lands without a pixel jump.
  "origin-[50%_100%] transform-[translate(var(--_x),var(--_y))_scale(var(--_scale))] will-change-transform",
  "transition-[transform,opacity,block-size] duration-[400ms,250ms,150ms]",
  "ease-[var(--ow-ease-drawer),var(--ow-ease-out),var(--ow-ease-out)]",
  // The gap between two cards belongs to them, so the pointer crossing it does not close the list.
  "after:content-[''] after:absolute after:inset-x-0 after:top-full after:h-[calc(var(--_gap)+1px)]",
  // Opened: a list, each card at its own height, with the gap between.
  "data-expanded:[--_y:calc(var(--toast-swipe-movement-y,0px)_-_var(--toast-offset-y)_-_var(--toast-index)_*_var(--_gap))]",
  "data-expanded:[--_scale:1] data-expanded:h-(--toast-height)",
  // Past the limit: kept for its animation, never seen or reached.
  "data-limited:opacity-0 data-limited:pointer-events-none",
  // Arrives from the edge it sits at, and leaves where the finger sent it, or downward.
  "data-starting-style:opacity-0",
  "data-starting-style:transform-[translate(var(--_x),calc(var(--_y)_+_var(--_away)))_scale(var(--_scale))]",
  "data-ending-style:opacity-0",
  "data-ending-style:transform-[translate(var(--_x),calc(var(--_y)_+_var(--_away)))_scale(var(--_scale))]",
  "data-ending-style:data-[swipe-direction=up]:transform-[translate(var(--_x),calc(var(--_y)_-_var(--_away)))_scale(var(--_scale))]",
  "data-ending-style:data-[swipe-direction=left]:transform-[translate(calc(var(--_x)_-_var(--_away)),var(--_y))_scale(var(--_scale))]",
  "data-ending-style:data-[swipe-direction=right]:transform-[translate(calc(var(--_x)_+_var(--_away)),var(--_y))_scale(var(--_scale))]",
  // Base UI follows the finger with the card's inline transform, without easing.
  "data-swiping:select-none",
  // Anchored: a popup at its anchor, not a card in the stack.
  "data-anchored:static data-anchored:w-max data-anchored:max-w-[min(22rem,var(--available-width,22rem))]",
  "data-anchored:h-auto data-anchored:transform-none data-anchored:origin-(--transform-origin)",
  "data-anchored:transition-[opacity,transform] data-anchored:duration-180",
  "data-anchored:ease-(--ow-ease-out) data-anchored:after:content-none",
  "data-anchored:data-starting-style:opacity-0 data-anchored:data-starting-style:transform-[scale(0.96)]",
  "data-anchored:data-ending-style:opacity-0 data-anchored:data-ending-style:transform-[scale(0.96)]",
  // Leaving is quicker than arriving.
  "data-anchored:data-ending-style:duration-120",
  // More contrast asked for: a ring around the card and its arrow.
  "contrast-more:[--_shadow:var(--ow-popup-shadow),0_0_0_1px_var(--ow-edge)]",
  // No slide, no peek motion: cards fade, wherever the finger left them.
  "motion-reduce:transition-[opacity] motion-reduce:duration-250 motion-reduce:ease-(--ow-ease-out)",
  "motion-reduce:data-starting-style:transform-[translate(var(--_x),var(--_y))_scale(var(--_scale))]",
  "motion-reduce:data-ending-style:transform-[translate(var(--_x),var(--_y))_scale(var(--_scale))]",
  "motion-reduce:data-ending-style:data-[swipe-direction=up]:transform-[translate(var(--_x),var(--_y))_scale(var(--_scale))]",
  "motion-reduce:data-ending-style:data-[swipe-direction=left]:transform-[translate(var(--_x),var(--_y))_scale(var(--_scale))]",
  "motion-reduce:data-ending-style:data-[swipe-direction=right]:transform-[translate(var(--_x),var(--_y))_scale(var(--_scale))]",
  "motion-reduce:data-anchored:transition-[opacity] motion-reduce:data-anchored:duration-250",
  "motion-reduce:data-anchored:data-ending-style:duration-250",
  "motion-reduce:data-anchored:data-starting-style:transform-none",
  "motion-reduce:data-anchored:data-ending-style:transform-none",
];

// A popup at its anchor; it only names the group the arrow reads its text direction from, and
// stands above the page.
const positioner = ["group/ow-toast-positioner z-100"];

// The toast's inside. A card behind the front one, in a closed stack, shows only its edge.
const content = [
  "flex items-start gap-[10px]",
  // Room for the close button in the corner.
  "pe-[20px]",
  "transition-opacity duration-250 ease-(--ow-ease-out)",
  "data-behind:not-data-expanded:opacity-0 data-behind:not-data-expanded:overflow-hidden",
  "data-behind:not-data-expanded:pointer-events-none",
];

// A small icon in the tone of the type, level with the first line of text.
const mark = [
  "[--_tone:var(--_muted)] flex-none grid place-items-center size-[16px]",
  "mt-[calc((1lh_-_16px)_/_2)] text-(color:--_tone)",
  "[&>svg]:block [&>svg]:size-full",
  "group-data-[type=success]/ow-toast:[--_tone:var(--ow-good)]",
  "group-data-[type=error]/ow-toast:[--_tone:var(--ow-critical)]",
  "group-data-[type=warning]/ow-toast:[--_tone:var(--ow-warning)]",
  "group-data-[type=info]/ow-toast:[--_tone:var(--ow-accent)]",
  // The spinner turns only while the toast is loading.
  "group-data-[type=loading]/ow-toast:[&>svg]:animate-[ow-spin_0.8s_linear_infinite]",
  "group-data-[type=loading]/ow-toast:motion-reduce:[&>svg]:animate-none",
  // Forced colors: a system color, over the tone.
  "forced-colors:text-[CanvasText]",
];

const text = ["flex-[1_1_auto] min-w-0"];

const title = ["m-0 text-[1em] font-semibold leading-[1.5] wrap-anywhere"];

const description = ["m-0 text-(color:--_muted) wrap-anywhere"];

const action = ["mt-[8px]"];

// The corner button: quiet until pointed at, a 24px target with a 14px cross.
const close = [
  "absolute top-[8px] end-[8px] grid place-items-center box-border size-[24px] m-0 p-0 border-0",
  "rounded-[calc(var(--_r)_/_2)] bg-transparent text-(color:--_muted) cursor-pointer",
  "touch-manipulation [-webkit-tap-highlight-color:transparent]",
  "transition-[background-color,color] duration-150 ease-(--ow-ease-out)",
  "[&>svg]:block [&>svg]:size-[14px]",
  "[@media(hover:hover)]:hover:bg-(--ow-hover) [@media(hover:hover)]:hover:text-(color:--_fg)",
  "focus-visible:outline-2 focus-visible:outline-(--ow-focus) focus-visible:outline-offset-1",
];

// A 14px box centered on the card's edge; its outer half shows a square turned 45 degrees with
// the card's surface and shadow, as the Popover's arrow does. Base UI places it on the anchor with
// physical sides.
const arrow = [
  // The half that shows when the arrow points right or left.
  "[--_right-half:polygon(50%_0,100%_0,100%_100%,50%_100%,50%_11px,calc(50%_-_1px)_11px,calc(50%_-_1px)_3px,50%_3px)]",
  "[--_left-half:polygon(0_0,50%_0,50%_3px,calc(50%_+_1px)_3px,calc(50%_+_1px)_11px,50%_11px,50%_100%,0_100%)]",
  "size-[14px]",
  // With the 1px ring outside it, the square's diagonal is the box: (7.9 + 2) × √2 = 14.
  "before:absolute before:inset-0 before:m-auto before:size-[7.9px] before:content-['']",
  // Invisible until forced colors draw it as the edge.
  "before:outline-1 before:outline-transparent",
  "before:bg-(color:--_bg) before:shadow-(shadow:--_shadow) before:transform-[rotate(45deg)]",
  "data-[side=top]:top-[calc(100%_-_7px)]",
  "data-[side=top]:[clip-path:polygon(0_50%,3px_50%,3px_calc(50%_-_1px),11px_calc(50%_-_1px),11px_50%,100%_50%,100%_100%,0_100%)]",
  "data-[side=bottom]:bottom-[calc(100%_-_7px)]",
  "data-[side=bottom]:[clip-path:polygon(0_0,100%_0,100%_50%,11px_50%,11px_calc(50%_+_1px),3px_calc(50%_+_1px),3px_50%,0_50%)]",
  "data-[side=left]:left-[calc(100%_-_7px)] data-[side=left]:[clip-path:var(--_right-half)]",
  "data-[side=right]:right-[calc(100%_-_7px)] data-[side=right]:[clip-path:var(--_left-half)]",
  // Logical sides: mirrored right to left.
  "data-[side=inline-start]:start-[calc(100%_-_7px)]",
  "data-[side=inline-start]:[clip-path:var(--_right-half)]",
  "data-[side=inline-end]:end-[calc(100%_-_7px)]",
  "data-[side=inline-end]:[clip-path:var(--_left-half)]",
  "group-[[dir=rtl]]/ow-toast-positioner:data-[side=inline-start]:transform-[scaleX(-1)]",
  "group-[[dir=rtl]]/ow-toast-positioner:data-[side=inline-end]:transform-[scaleX(-1)]",
];

/** The classes of the parts. */
export const toastSlots: Record<
  | "viewport"
  | "root"
  | "content"
  | "mark"
  | "text"
  | "title"
  | "description"
  | "action"
  | "close"
  | "positioner"
  | "arrow",
  string
> = {
  viewport: viewport.join(" "),
  root: root.join(" "),
  content: content.join(" "),
  mark: mark.join(" "),
  text: text.join(" "),
  title: title.join(" "),
  description: description.join(" "),
  action: action.join(" "),
  close: close.join(" "),
  positioner: positioner.join(" "),
  arrow: arrow.join(" "),
};
