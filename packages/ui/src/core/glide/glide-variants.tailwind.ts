// The Tailwind CSS v4 twin of glide-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css.
//
// Each container carries `relative isolate` in its own classes, so the highlight's z-index: -1 stays
// inside it, and sets --_radius on the highlight to its items' corners with
// `[&>[data-slot=glide]]:[--_radius:…]`.

// The script writes the lit item's box as --_x, --_y (offset) and --_sx, --_sy (scale from the size
// it appeared at, --_w by --_h); everything that moves is a transform, so a glide costs no layout.
const root = [
  // The lit item takes the hover tint; a container sets --_radius to its items' corners.
  "[--_bg:var(--ow-hover)] [--_radius:var(--ow-radius)]",
  // Box: the script measures physical edges.
  "absolute -z-1 top-0 left-0 w-[var(--_w,0)] h-[var(--_h,0)]",
  // Scaled corners stay round: the radius is divided by the scale on each axis.
  "rounded-[calc(var(--_radius)_/_var(--_sx,1))_/_calc(var(--_radius)_/_var(--_sy,1))]",
  "bg-(color:--_bg) opacity-0 pointer-events-none",
  // Its own layer, so it lands without a pixel jump.
  "origin-top-left will-change-transform",
  "transform-[translate(var(--_x,0),var(--_y,0))_scale(var(--_sx,1),var(--_sy,1))]",
  "transition-[transform,opacity] duration-[var(--ow-spring-glide-duration),160ms]",
  "ease-[var(--ow-spring-glide),ease]",
  "data-visible:opacity-100",
  "data-held:[--_bg:color-mix(in_oklab,var(--ow-hover),var(--ow-fg)_5%)]",
  "data-instant:[transition:none]",
  // No sliding, the highlight only fades (a jump stays a jump).
  "motion-reduce:transition-[opacity] motion-reduce:duration-160 motion-reduce:ease-[ease]",
  "motion-reduce:data-instant:[transition:none]",
  // Backgrounds are dropped, so the lit item gets an outline in the system color.
  "forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]",
];

/** The classes of the parts. */
export const glideSlots: Record<"root", string> = { root: root.join(" ") };
