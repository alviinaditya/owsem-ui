// Generated from components/sidebar by scripts/build-tailwind.ts; do not edit.
// The Tailwind CSS v4 twin of sidebar-variants.ts: the same exports, with the styles as utility
// classes. Needs tokens.css, and from the bridge (tailwind.css) the keyframes of the pulse.

const provider = ["flex min-w-0"];

// Desktop: closed, it slides out and fades (translate and opacity only) and, once it has gone, leaves
// the tab order. Mobile: a drawer from the inline start, which is Base UI's popup. Its width is its
// own, 248px, and a class of yours sets another.
const root = [
  "[--_fg:var(--ow-fg)] [--_muted:var(--ow-muted)] [--_focus:var(--ow-focus)]",
  // The rows sit 6px inside the surface, so their corners are nested.
  "[--_radius:max(0px,calc(var(--ow-radius)_-_6px))]",
  // The indent of the items: the pill lives in it.
  "[--_gutter:12px]",
  // The tint of the active background: the accent over the surface the sidebar sits on.
  "[--_surface:var(--ow-bg)] [--_tint:color-mix(in_oklab,var(--ow-accent)_12%,var(--_surface))]",
  "[--_dir:-1] [&:dir(rtl)]:[--_dir:1]",
  // Box.
  "flex flex-none flex-col box-border w-[248px] min-h-0",
  // Type.
  "text-(color:--_fg) text-[0.875rem] leading-[1.25rem]",
  // Motion. Its own layer, so it lands without a pixel jump.
  "[translate:0] will-change-[translate,opacity]",
  "transition-[translate,opacity,visibility] duration-[300ms,200ms,0s]",
  "ease-[var(--ow-ease-drawer),var(--ow-ease-out),linear] delay-[0s,0s,300ms]",
  // Closed: out of sight and out of the tab order once it has slid away.
  "data-[state=closed]:[translate:calc(var(--_dir)_*_100%_*_var(--ow-motion-scale))_0]",
  "data-[state=closed]:opacity-0 data-[state=closed]:invisible",
  "data-[state=open]:delay-0",
  // The drawer: over the page, from the inline start.
  "data-mobile:fixed data-mobile:inset-y-0 data-mobile:start-0",
  "data-mobile:max-w-[calc(100%_-_48px)] data-mobile:rounded-se-(--ow-radius)",
  "data-mobile:rounded-ee-(--ow-radius) data-mobile:outline-none",
  "data-mobile:[--_surface:var(--ow-raised-bg)] data-mobile:bg-(color:--ow-raised-bg)",
  "data-mobile:shadow-(shadow:--ow-popup-shadow)",
  "data-mobile:transition-[translate] data-mobile:duration-300 data-mobile:ease-(--ow-ease-drawer)",
  "data-mobile:delay-0",
  "data-mobile:data-starting-style:[translate:calc(var(--_dir)_*_100%_*_var(--ow-motion-scale))_0]",
  "data-mobile:data-ending-style:[translate:calc(var(--_dir)_*_100%_*_var(--ow-motion-scale))_0]",
  "data-mobile:data-ending-style:duration-220",
  // No movement; it only fades.
  "motion-reduce:[translate:0] motion-reduce:data-[state=closed]:[translate:0]",
  "motion-reduce:data-mobile:data-starting-style:[translate:0]",
  "motion-reduce:data-mobile:data-ending-style:[translate:0]",
  "motion-reduce:transition-[opacity,visibility] motion-reduce:duration-[200ms,0s]",
  "motion-reduce:ease-[var(--ow-ease-out),linear] motion-reduce:delay-[0s,200ms]",
  "motion-reduce:data-[state=open]:delay-0",
  "motion-reduce:data-mobile:transition-[opacity] motion-reduce:data-mobile:duration-200",
  "motion-reduce:data-mobile:ease-(--ow-ease-out) motion-reduce:data-mobile:delay-0",
  "motion-reduce:data-mobile:data-ending-style:duration-200",
  "motion-reduce:data-mobile:data-starting-style:opacity-0",
  "motion-reduce:data-mobile:data-ending-style:opacity-0",
];

// The scrim of the drawer.
const backdrop = [
  "fixed inset-0 bg-(color:--ow-backdrop)",
  "transition-opacity duration-250 ease-(--ow-ease-out)",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
];

const bar = ["flex-none p-[12px]"];

// The scrolling middle, and Glide's container (relative isolate). Its scrollbar is hidden; the edges fade where there is more to scroll.
// Glide's highlight is a faint tint with the rows' corners, inset 1px above and below like the
// active background; in forced colors its outline sits further in.
const content = [
  "relative isolate flex-auto min-h-0 px-[12px] pt-[12px] pb-[32px]",
  "overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  "data-overflow-start:[mask-image:linear-gradient(to_bottom,transparent,#000_28px)]",
  "data-overflow-end:[mask-image:linear-gradient(to_top,transparent,#000_28px)]",
  "data-overflow-start:data-overflow-end:[mask-image:linear-gradient(to_bottom,transparent,#000_28px,#000_calc(100%_-_28px),transparent)]",
  "[&_[data-slot=glide]]:[--_bg:color-mix(in_oklab,var(--_fg)_4%,transparent)]",
  "[&_[data-slot=glide]]:[--_radius:max(0px,calc(var(--ow-radius)_-_6px))]",
  "[&_[data-slot=glide]]:[clip-path:inset(1px_0_round_var(--_radius))]",
  "forced-colors:[&_[data-slot=glide]]:-outline-offset-3",
];

const group = [
  // The next group keeps its distance.
  "[:where([data-slot=sidebar-group]~&)]:mt-[20px]",
];

// Not raised above the pill: a label in its own layer drew a seam at fractional zoom.
const groupLabel = [
  "pb-[6px] text-(color:--_muted) text-[0.75rem] font-medium tracking-[0.06em] leading-[1rem]",
  "uppercase",
];

const list = ["flex flex-col gap-[2px] m-0 p-0 ps-(--_gutter) list-none"];

// The row spans the gutter too, so the active background and the hover highlight share one box.
// The active look arrives with the liquid (data-landed); an active item it left is data-away.
const link = [
  // Box.
  "flex items-center gap-[8px] box-border h-[calc(32em_/_14)] ms-[calc(var(--_gutter)_*_-1)]",
  "ps-[calc(var(--_gutter)_+_10em_/_14)] pe-[calc(10em_/_14)] rounded-(--_radius)",
  // Type.
  "text-[color:color-mix(in_oklab,var(--_fg)_80%,transparent)] font-normal no-underline",
  "cursor-pointer [-webkit-tap-highlight-color:transparent]",
  "hover:text-(color:--_fg)",
  "ow-sidebar-lit:text-(color:--_fg) ow-sidebar-lit:font-medium",
  "data-disabled:text-(color:--_muted) data-disabled:cursor-default",
  // Inside, so the scrolling content never cuts it.
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--_focus)",
];

const label = ["min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"];

const icon = ["inline-flex flex-none size-[1rem] [&>svg]:size-full"];

const badge = [
  "[--_badge:color-mix(in_oklab,var(--_fg)_8%,transparent)]",
  "flex-none ms-auto px-[6px] py-[1px] rounded-(--ow-radius) bg-(color:--_badge)",
  "text-(color:--_fg) text-[0.6875rem] font-medium leading-[1rem]",
];

const trigger = [
  // Box.
  "inline-flex flex-none items-center justify-center box-border size-[calc(32em_/_14)] m-0 p-0",
  "border-0 rounded-[max(0px,calc(var(--ow-radius)_-_6px))] bg-transparent",
  // Type.
  "text-[color:color-mix(in_oklab,var(--ow-fg)_80%,transparent)] text-[0.875rem]",
  "font-[family-name:inherit] font-[weight:inherit]",
  "cursor-pointer [-webkit-tap-highlight-color:transparent] [&>svg]:size-[1.125rem]",
  "hover:bg-(color:--ow-hover) hover:text-(color:--ow-fg)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
];

// The current-page liquid. sidebar.indicator.ts draws an SVG in it (a background, a dot and the drop
// between items) and sets data-visible and data-moving. Behind the rows, in the content's stacking
// context; it takes no space.
const indicator = [
  "group/ow-sidebar-indicator absolute top-0 start-0 w-0 h-0 -z-1 opacity-0 pointer-events-none",
  // Its own layer, so it lands without a pixel jump.
  "will-change-[opacity] transition-[opacity] duration-150 ease-(--ow-ease-out)",
  "data-visible:opacity-100",
];

// The tint of the background; --_mix deepens it toward the accent while it moves. In forced colors
// the liquid is Highlight-tinted and the dot is Highlight.
const liquid = [
  "block overflow-visible will-change-transform",
  "[fill:color-mix(in_oklab,var(--ow-accent)_var(--_mix,0%),var(--_tint))]",
  "forced-colors:forced-color-adjust-none",
  "forced-colors:[fill:color-mix(in_srgb,Highlight_30%,Canvas)]",
];

const liquidDot = ["fill-(--ow-accent) forced-colors:fill-[Highlight]"];

// The loading pulse on the dot (data-waiting): transform and opacity only.
const pulse = [
  // Box.
  "hidden group-data-waiting/ow-sidebar-indicator:block absolute top-0 start-0 size-[7px]",
  "rounded-[50%] bg-(color:--ow-accent) [translate:var(--_x,0)_var(--_y,0)]",
  // Motion.
  "will-change-[transform,opacity]",
  "animate-[ow-sidebar-swell_calc(0.9s_*_var(--ow-motion-scale))_ease-in-out_infinite]",
  // The ring that spreads from it.
  "after:absolute after:inset-0 after:content-[''] after:rounded-[inherit] after:border",
  "after:border-(color:--ow-accent) after:opacity-0 after:will-change-[transform,opacity]",
  "after:animate-[ow-sidebar-ping_calc(0.9s_*_var(--ow-motion-scale))_ease-out_infinite]",
  "motion-reduce:animate-none motion-reduce:after:animate-none",
  "forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]",
  "forced-colors:after:border-[Highlight]",
];

/** The classes of every part, and of the elements the indicator draws itself. */
export const sidebarSlots: Record<
  | "provider"
  | "root"
  | "backdrop"
  | "header"
  | "content"
  | "footer"
  | "group"
  | "groupLabel"
  | "list"
  | "item"
  | "link"
  | "label"
  | "icon"
  | "badge"
  | "indicator"
  | "trigger"
  | "liquid"
  | "liquidPart"
  | "liquidDot"
  | "pulse",
  string
> = {
  provider: provider.join(" "),
  root: root.join(" "),
  backdrop: backdrop.join(" "),
  header: bar.join(" "),
  content: content.join(" "),
  footer: bar.join(" "),
  group: group.join(" "),
  groupLabel: groupLabel.join(" "),
  list: list.join(" "),
  item: "",
  link: link.join(" "),
  label: label.join(" "),
  icon: icon.join(" "),
  badge: badge.join(" "),
  indicator: indicator.join(" "),
  trigger: trigger.join(" "),
  liquid: liquid.join(" "),
  liquidPart: "",
  liquidDot: liquidDot.join(" "),
  pulse: pulse.join(" "),
};
