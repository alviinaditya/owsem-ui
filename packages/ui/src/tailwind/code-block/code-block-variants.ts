// Generated from components/code-block by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of code-block-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.

// One surface: the panel fill with the surface shadow and no edge.
const root = [
  // The theme tokens it reads.
  "[--_panel:var(--ow-panel)] [--_shadow:var(--ow-surface-shadow)] [--_fg:var(--ow-fg)]",
  "[--_muted:var(--ow-muted)] [--_focus:var(--ow-focus)]",
  // The accent over the panel, opaque; the active tab's text leans toward the text color.
  "[--_key:color-mix(in_oklab,var(--ow-accent)_14%,var(--ow-panel))]",
  "[--_on:color-mix(in_oklab,var(--ow-accent)_70%,var(--ow-fg))]",
  "[--_scrollbar:color-mix(in_oklab,var(--ow-muted)_40%,transparent)]",
  "[--_pad:4px] [--_corner:var(--ow-radius)]",
  // The keys' radius: the block's, less the header's padding. A control nested in the header takes
  // the same.
  "[--_radius:max(0px,var(--ow-radius)_-_var(--_pad))] [--_nested:max(0px,var(--ow-radius)_-_var(--_pad))]",
  // How far a held tab presses in, scaled by the motion intensity.
  "[--_press:calc(1_-_0.03_*_var(--ow-motion-scale))]",
  // Box.
  "flex flex-col min-w-0 rounded-(--_corner) bg-(color:--_panel) shadow-(shadow:--_shadow)",
  "text-(color:--_fg)",
  // The card's edge shows.
  "forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-transparent",
];

// A quiet row over the code.
const header = [
  "flex items-center gap-[2px] min-w-0 pt-(--_pad) px-(--_pad) text-(color:--_muted)",
  "text-[0.8125rem] leading-[1.25]",
];

// As tall as the keys (32px), so the icon is as far from the edge as from the top.
const icon = ["grid flex-none place-items-center size-[2.4615em] [&_svg]:size-[calc(1em_+_2px)]"];

const title = ["flex-1 min-w-0 overflow-hidden pe-[0.5em] text-ellipsis whitespace-nowrap"];

// The tabs scroll sideways inside the header when they do not fit; focus brings one in. It is also
// Glide's container, so it holds the highlight behind the tabs (relative isolate).
const list = [
  "group/ow-code-block-list",
  "relative isolate flex flex-1 gap-[2px] min-w-0 overflow-x-auto [scrollbar-width:none]",
  // Glide's highlight takes the tabs' corners.
  "[&>[data-slot=glide]]:[--_radius:max(0px,var(--ow-radius)_-_var(--_pad))]",
];

// The tinted key under the active tab: thumb.ts lays it out on that tab's box (--_x, --_y, --_w,
// --_h) and slides it there from the last by --_dx, --_dy, --_sx, --_sy, which end at none. Its key
// (the ::before) is stretched along the travel.
const thumb = [
  "absolute -z-1",
  // Physical edges: the script measures them.
  "top-[var(--_y,0px)] left-[var(--_x,0px)] w-[var(--_w,0px)] h-[var(--_h,0px)]",
  "opacity-0 pointer-events-none",
  "[translate:var(--_dx,0)_var(--_dy,0)] transform-[scale(var(--_sx,1),var(--_sy,1))]",
  // Its own layer, so it lands without a pixel jump. It travels on the travel spring and scales on
  // the settle spring.
  "will-change-[translate,transform,scale] transition-[translate,transform,scale,opacity]",
  "duration-[var(--ow-spring-travel-duration),var(--ow-spring-travel-duration),var(--ow-spring-settle-duration),150ms]",
  "ease-[var(--ow-spring-travel),var(--ow-spring-travel),var(--ow-spring-settle),ease]",
  // The key, inside the box.
  "before:absolute before:content-[''] before:inset-0 before:rounded-(--_radius)",
  "before:bg-(color:--_key) before:will-change-transform",
  "data-visible:opacity-100",
  // Pressed in quickly, released with the settle spring.
  "data-held:scale-(--_press)",
  "data-held:duration-[var(--ow-spring-travel-duration),var(--ow-spring-travel-duration),90ms,150ms]",
  "data-held:ease-[var(--ow-spring-travel),var(--ow-spring-travel),var(--ow-ease-out),ease]",
  // The thumb does not slide or press; it only fades. A held tab dims instead.
  "motion-reduce:scale-none motion-reduce:data-held:scale-none",
  "motion-reduce:transition-[opacity] motion-reduce:duration-150 motion-reduce:ease-[ease]",
  "motion-reduce:data-held:duration-150 motion-reduce:data-held:ease-[ease]",
  "motion-reduce:data-held:data-visible:opacity-80",
  // The label turns as the fill arrives, so the fill does not travel.
  "forced-colors:before:forced-color-adjust-none forced-colors:before:bg-[Highlight]",
  "forced-colors:not-data-held:transition-[opacity] forced-colors:not-data-held:duration-150",
  "forced-colors:not-data-held:ease-[ease]",
  // The first placement and every jump: nothing transitions.
  "data-instant:[transition:none] forced-colors:data-instant:[transition:none]",
];

const tab = [
  // Box.
  "relative flex-none m-0 py-[0.6058em] px-[0.875em] border-0 rounded-(--_radius)",
  // Invisible here, the tab's edge in forced colors.
  "outline-1 -outline-offset-1 outline-transparent bg-transparent",
  // Type.
  "text-inherit font-[family-name:inherit] font-[weight:inherit] whitespace-nowrap cursor-pointer",
  "touch-manipulation",
  "will-change-[scale] transition-[color,scale] duration-[150ms,var(--ow-spring-settle-duration)]",
  "ease-[ease,var(--ow-spring-settle)]",
  // Lit by Glide, or active: the text color; active, the accent leaning toward it.
  "data-glide-active:not-data-active:text-(color:--_fg) data-active:text-(color:--_on)",
  // The active tab as a key of its own before the script places the thumb (server HTML).
  "group-not-data-thumb/ow-code-block-list:data-active:bg-(color:--_key)",
  "data-held:scale-(--_press) data-held:duration-[150ms,90ms] data-held:ease-[ease,var(--ow-ease-out)]",
  // Inside, so the scrolling list never cuts it.
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--_focus)",
  "disabled:text-[color-mix(in_oklab,var(--_muted)_50%,transparent)] disabled:cursor-not-allowed",
  "disabled:data-glide-active:text-[color-mix(in_oklab,var(--_muted)_50%,transparent)]",
  "disabled:data-active:text-[color-mix(in_oklab,var(--_muted)_50%,transparent)]",
  // No pressing in; the material still changes.
  "motion-reduce:scale-none motion-reduce:data-held:scale-none",
  "motion-reduce:transition-[color] motion-reduce:duration-150 motion-reduce:ease-[ease]",
  "motion-reduce:data-held:duration-150 motion-reduce:data-held:ease-[ease]",
  // The active tab is filled with the system highlight.
  "forced-colors:data-active:forced-color-adjust-none forced-colors:data-active:text-[HighlightText]",
  "forced-colors:group-not-data-thumb/ow-code-block-list:data-active:forced-color-adjust-none",
  "forced-colors:group-not-data-thumb/ow-code-block-list:data-active:bg-[Highlight]",
  "forced-colors:focus-visible:outline-[Highlight]",
];

// Copy is a Button: its radius takes the nested one.
const copy = ["rounded-(--_nested) flex-none ms-auto"];

// The code, on the same surface: it scrolls sideways, and its padding stays at the end of a long
// line. Code reads left to right on any page, and scrolls from its start. Base UI keeps a panel a
// frame after its tab is left, for an exit animation; it has none, so it goes at once and two
// panels never stack.
const panel = [
  "relative [direction:ltr] overflow-x-auto rounded-b-(--_corner)",
  "font-[family-name:var(--ow-font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace)]",
  "text-[0.8125rem] leading-[1.6] data-ending-style:hidden",
  // A thin, quiet scrollbar without arrows: the standard properties here (Firefox)…
  "[scrollbar-width:thin] [scrollbar-color:var(--_scrollbar)_transparent]",
  // …and WebKit's pseudo-elements where the browser has them, which the standard ones would turn
  // off. The track keeps clear of the rounded corners.
  "supports-[selector(::-webkit-scrollbar)]:[scrollbar-width:auto]",
  "supports-[selector(::-webkit-scrollbar)]:[scrollbar-color:auto]",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar]:h-[10px]",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-track]:mx-(--_corner)",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-track]:bg-none",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:border-[3px]",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:border-solid",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:border-transparent",
  // A pill, whatever the theme's radius.
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:rounded-[999px]",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:bg-(--_scrollbar)",
  "supports-[selector(::-webkit-scrollbar)]:[&::-webkit-scrollbar-thumb]:bg-clip-padding",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--_focus)",
  "forced-colors:focus-visible:outline-[Highlight]",
  // The code itself.
  "[&>:where(pre)]:box-border [&>:where(pre)]:w-max [&>:where(pre)]:min-w-full [&>:where(pre)]:m-0",
  "[&>:where(pre)]:pt-[10px] [&>:where(pre)]:px-[16px] [&>:where(pre)]:pb-[14px]",
  "[&>:where(pre)]:bg-transparent [&>:where(pre)]:[font:inherit] [&>:where(pre)]:[tab-size:2]",
];

/** The classes of the parts. */
export const codeBlockSlots: Record<
  "root" | "header" | "icon" | "title" | "list" | "thumb" | "tab" | "copy" | "panel",
  string
> = {
  root: root.join(" "),
  header: header.join(" "),
  icon: icon.join(" "),
  title: title.join(" "),
  list: list.join(" "),
  thumb: thumb.join(" "),
  tab: tab.join(" "),
  copy: copy.join(" "),
  panel: panel.join(" "),
};
