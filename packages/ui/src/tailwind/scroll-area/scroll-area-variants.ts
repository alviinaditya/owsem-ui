// Generated from components/scroll-area by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of scroll-area-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the ow-scroll-area-fade variant.

// No surface of its own: a scroller and a thin scrollbar over whatever it sits on, shown on hover,
// on keyboard focus, and while it scrolls. The height that makes it scroll comes from your CSS, a
// max-height too (the flex column passes it on).
const root = [
  "group/ow-scroll-area [--_radius:var(--ow-radius)] [--_focus:var(--ow-focus)]",
  "flex flex-col min-w-0 min-h-0 rounded-(--_radius)",
];

const viewport = [
  "peer/ow-scroll-viewport flex-auto rounded-[inherit]",
  // Native scrollbars are hidden here, so Base UI's <style> for it can be turned off.
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  // The ring is drawn on the Root, over the content: the fade's mask would cut one here.
  "focus-visible:outline-none",
  // An edge fades by as much as has scrolled past it, up to --fade-size.
  "ow-scroll-area-fade:[--_end:to_right] ow-scroll-area-fade:[&:dir(rtl)]:[--_end:to_left]",
  "ow-scroll-area-fade:[--_fade-y:linear-gradient(to_bottom,transparent,#000_min(var(--fade-size,2em),var(--scroll-area-overflow-y-start)),#000_calc(100%_-_min(var(--fade-size,2em),var(--scroll-area-overflow-y-end))),transparent)]",
  "ow-scroll-area-fade:[--_fade-x:linear-gradient(var(--_end),transparent,#000_min(var(--fade-size,2em),var(--scroll-area-overflow-x-start)),#000_calc(100%_-_min(var(--fade-size,2em),var(--scroll-area-overflow-x-end))),transparent)]",
  "ow-scroll-area-fade:[mask-image:var(--_fade-y),var(--_fade-x)]",
  "ow-scroll-area-fade:mask-intersect",
];

// Base UI places it over the content. Its size is the pill's: set w (h when horizontal) to change
// it. Its ends keep clear of the corners: with the pill's round end as far in as the corner's
// center, the gap around the corner stays --_gap. Hidden, it lets every pointer through, so a swipe
// at the edge still scrolls.
const scrollbar = [
  "[--_ease:var(--ow-ease-out)] [--_size:0.375em] [--_gap:0.25em]",
  "[--_clear:max(var(--_gap),var(--ow-radius)_-_var(--_size)_/_2)]",
  "opacity-0 pointer-events-none transition-opacity duration-150 ease-(--_ease)",
  "[&:where([data-hovering],[data-scrolling],:active)]:opacity-100",
  "[&:where([data-hovering],[data-scrolling],:active)]:pointer-events-auto",
  // A keyboard user who focuses the viewport sees where they are.
  "peer-focus-visible/ow-scroll-viewport:opacity-100",
  "peer-focus-visible/ow-scroll-viewport:pointer-events-auto",
  "data-[orientation=vertical]:w-(--_size) data-[orientation=vertical]:my-(--_clear)",
  "data-[orientation=vertical]:me-(--_gap)",
  "data-[orientation=horizontal]:h-(--_size) data-[orientation=horizontal]:mx-(--_clear)",
  "data-[orientation=horizontal]:mb-(--_gap)",
];

const thumb = [
  "[--_muted:var(--ow-muted)]",
  // 3:1 on the panel and the page, in both themes.
  "[--_thumb:color-mix(in_oklab,var(--_muted)_72%,transparent)]",
  // A pill, whatever the theme's radius.
  "relative rounded-[999px] bg-(color:--_thumb)",
  "data-[orientation=vertical]:w-full data-[orientation=horizontal]:h-full",
  // The press area, at least 24px each way, from the Root's edge inward.
  "before:absolute before:content-['']",
  "data-[orientation=vertical]:before:inset-y-[min(0px,(100%_-_24px)_/_2)]",
  "data-[orientation=vertical]:before:end-[calc(var(--_gap)_*_-1)]",
  "data-[orientation=vertical]:before:w-[24px]",
  "data-[orientation=horizontal]:before:inset-x-[min(0px,(100%_-_24px)_/_2)]",
  "data-[orientation=horizontal]:before:bottom-[calc(var(--_gap)_*_-1)]",
  "data-[orientation=horizontal]:before:h-[24px]",
  // Forced colors drop the fill, so the pill takes a system color.
  "forced-colors:bg-[CanvasText]",
];

// The Root's ring while the Viewport has keyboard focus: on the Root and over the content.
const ring = [
  "has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:absolute",
  "has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:inset-0",
  "has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:content-['']",
  "has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:rounded-[inherit]",
  "has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:pointer-events-none",
  "has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:outline-2",
  "has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:-outline-offset-2",
  "has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:outline-(color:--_focus)",
  "forced-colors:has-[>[data-slot=scroll-area-viewport]:focus-visible]:after:outline-[Highlight]",
];

/** The classes of the parts. Content and Corner have no look of their own. */
export const scrollAreaSlots: Record<
  "root" | "viewport" | "content" | "scrollbar" | "thumb" | "corner",
  string
> = {
  root: [...root, ...ring].join(" "),
  viewport: viewport.join(" "),
  content: "",
  scrollbar: scrollbar.join(" "),
  thumb: thumb.join(" "),
  corner: "",
};
