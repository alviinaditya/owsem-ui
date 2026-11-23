// The Tailwind CSS v4 twin of button-variants.ts: the same exports, with the styles as utility classes.
// Needs tokens.css, and from the bridge (tailwind.css) the `held:` variant and the ow-spin and ow-pulse keyframes.

import { cva } from "class-variance-authority";
import { cn } from "../../core/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonVariantProps {
  /** @default "primary" */
  variant?: ButtonVariant | undefined;
  /** @default "md" */
  size?: ButtonSize | undefined;
  /** A flat tint of the variant's tone, for primary, secondary, and destructive. */
  soft?: boolean | undefined;
}

// The classes every button has. The variant, the size, and soft add theirs, and a user's
// className is merged last (in Button), so it wins over any of them.
const root = [
  // Box. The padding comes from one number, --py; the size sets it.
  "group/ow-button relative isolate m-0 box-border inline-flex items-center justify-center gap-[0.5em]",
  "border-0 rounded-(--ow-radius) bg-transparent py-(--_py) px-(--px) align-middle whitespace-nowrap",
  "[--_py:max(var(--py),calc((24px_-_1lh)_/_2))] [--px:calc(var(--_py)_+_(1lh_-_1cap)_/_2)]",
  "[--icon:calc(1em_+_2px)] [--_icon-margin:calc((1cap_-_var(--icon))_/_2)]",
  "[--_press:calc(1_-_0.03_*_var(--ow-motion-scale))]",
  // Type.
  "font-[family-name:inherit] font-medium text-(color:--ow-fg) no-underline",
  // Touch, and its own layer so it lands without a pixel jump.
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] will-change-[scale]",
  // Releasing settles with the Core spring; the press is in within 90 ms.
  "transition-[scale] duration-(--ow-spring-settle-duration) ease-(--ow-spring-settle)",
  "held:scale-(--_press) held:duration-90 held:ease-(--ow-ease-out)",
  // The face, drawn by ::before under the content: a fill, the hover tint over it, an edge. Held,
  // it takes the pressed fill and drops the tint.
  "before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit] before:content-['']",
  "before:pointer-events-none before:bg-transparent before:bg-[linear-gradient(var(--_tint)_0_0)]",
  "before:shadow-none [--_tint:transparent] pointer-fine:hover:not-data-disabled:[--_tint:var(--ow-hover)]",
  "held:before:bg-(color:--ow-pressed-bg) held:before:bg-none held:before:shadow-none",
  // Icon only: square, the same height as the others.
  "data-icon-only:p-[calc(var(--_py)_+_(1lh_-_var(--icon))_/_2)] data-icon-only:[--_icon-margin:0]",
  // 2px outside the face.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ow-focus)",
  "data-disabled:not-data-loading:cursor-not-allowed data-disabled:not-data-loading:opacity-50",
  "data-loading:cursor-progress",
  // No movement; the press is the material alone.
  "motion-reduce:[--_press:1]",
  // Materials drop out, so an outline draws the edge in the system color.
  "forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2",
  "forced-colors:focus-visible:outline-[Highlight]",
  "forced-colors:data-disabled:not-data-loading:text-[GrayText]",
];

// Every variant but link draws its edge in forced colors.
const edge = [
  "forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-transparent",
];

const variantStyles = {
  // A solid fill with the thin light line; held, the fill darkens a little.
  primary: [
    "text-(color:--ow-on-accent) before:bg-(color:--ow-accent) before:shadow-(shadow:--ow-primary-shadow) held:before:shadow-(shadow:--ow-primary-shadow)",
    "held:before:bg-[color-mix(in_oklab,var(--ow-accent),black_10%)]",
    ...edge,
  ],
  destructive: [
    "text-(color:--ow-on-critical) before:bg-(color:--ow-critical-solid) before:shadow-(shadow:--ow-primary-shadow)",
    "held:before:shadow-(shadow:--ow-primary-shadow)",
    "held:before:bg-[color-mix(in_oklab,var(--ow-critical-solid),black_10%)]",
    ...edge,
  ],
  // A tint of the text color, a step deeper when held.
  secondary: [
    "before:bg-[color-mix(in_oklab,var(--ow-fg)_8%,transparent)]",
    "held:before:bg-[color-mix(in_oklab,var(--ow-fg)_16%,transparent)]",
    ...edge,
  ],
  // A quiet line, firmer on hover; held, the pressed fill keeps it.
  outline: [
    "[--_line:color-mix(in_oklab,var(--ow-fg)_16%,transparent)]",
    "pointer-fine:hover:not-data-disabled:[--_line:color-mix(in_oklab,var(--ow-fg)_28%,transparent)]",
    "before:shadow-[inset_0_0_0_1px_var(--_line)] held:before:shadow-[inset_0_0_0_1px_var(--_line)]",
    ...edge,
  ],
  ghost: edge,
  // Text only, underlined on hover; a press dims it instead of scaling it.
  link: [
    "text-[color-mix(in_oklab,var(--ow-accent)_70%,var(--ow-fg))] underline decoration-1",
    "decoration-transparent underline-offset-[0.25em] [--_press:1] before:content-none",
    "transition-[opacity] duration-150 ease-(--ow-ease-out)",
    "pointer-fine:hover:not-data-disabled:decoration-current held:opacity-70",
  ],
};

const sizeStyles = {
  sm: "[--py:0.6058em] text-[0.8125rem] leading-[1.25]",
  md: "[--py:0.8036em] text-[0.875rem] leading-[1.25]",
  lg: "[--py:0.875em] text-[1rem] leading-[1.25]",
};

// Soft: a flat tint of the variant's tone, text in that tone, and no edge. Only these three.
const softTone = {
  primary: [
    "text-[color-mix(in_oklab,var(--ow-accent)_75%,var(--ow-fg))] before:shadow-none held:before:shadow-none",
    "before:bg-[color-mix(in_oklab,var(--ow-accent)_12%,transparent)]",
    "held:before:bg-[color-mix(in_oklab,var(--ow-accent)_18%,transparent)]",
  ],
  secondary: [
    "text-[color-mix(in_oklab,var(--ow-fg)_75%,var(--ow-fg))] before:shadow-none held:before:shadow-none",
    "before:bg-[color-mix(in_oklab,var(--ow-fg)_12%,transparent)]",
    "held:before:bg-[color-mix(in_oklab,var(--ow-fg)_18%,transparent)]",
  ],
  destructive: [
    "text-[color-mix(in_oklab,var(--ow-critical)_75%,var(--ow-fg))] before:shadow-none held:before:shadow-none",
    "before:bg-[color-mix(in_oklab,var(--ow-critical)_12%,transparent)]",
    "held:before:bg-[color-mix(in_oklab,var(--ow-critical)_18%,transparent)]",
  ],
};

const variants = cva(root, {
  variants: {
    variant: variantStyles,
    size: sizeStyles,
    soft: { true: "", false: "" },
  },
  compoundVariants: [
    { variant: "primary", soft: true, class: softTone.primary },
    { variant: "secondary", soft: true, class: softTone.secondary },
    { variant: "destructive", soft: true, class: softTone.destructive },
  ],
  defaultVariants: { variant: "primary", size: "md", soft: false },
});

/** The root's classes. cn drops what a later class replaces, so the soft tone wins over the variant. */
export function buttonVariants({ variant, size, soft }: ButtonVariantProps = {}): string {
  return cn(variants({ variant, size, soft }));
}

// Ripple (Tactile): grows from the press point, fades on release, clipped to the face.
const layer = [
  "pointer-events-none absolute inset-0 z-[-1] overflow-hidden rounded-[inherit]",
  "forced-colors:hidden",
];

const ripple = [
  "absolute top-[var(--_y,50%)] left-[var(--_x,50%)] m-[calc(var(--_d,0px)_/_-2)] size-[var(--_d,0px)]",
  "scale-[0.2] rounded-[50%] bg-current opacity-0 will-change-[scale] motion-reduce:hidden",
  "data-state:scale-none data-state:transition-[opacity,scale] data-state:duration-[300ms,450ms]",
  "data-state:ease-(--ow-ease-out) data-[state=on]:opacity-[calc(0.1_*_var(--ow-motion-scale))]",
  "data-[state=on]:duration-[90ms,450ms]",
];

// Font size plus 2px, pulled toward the edge so it sits as far from it as from the top.
const icon = [
  "inline-grid size-(--icon) flex-none place-items-center transition-[opacity] duration-150 ease-(--ow-ease-out)",
  "data-[side=start]:ms-(--_icon-margin) data-[side=end]:me-(--_icon-margin)",
  // The glyph and the spinner share one cell, so swapping them moves nothing.
  "[&>*]:size-full [&>*]:[grid-area:1/1] [&_:where(svg,img)]:block [&_:where(svg,img)]:size-full",
  "group-data-loading/ow-button:peer-[*]/ow-spinner:opacity-0",
];

const glyph = [
  "grid place-items-center will-change-[scale]",
  "transition-[opacity,scale] duration-[150ms,200ms] ease-(--ow-ease-out)",
  "group-data-loading/ow-button:[[data-side=start]>&]:scale-50",
  "group-data-loading/ow-button:[[data-side=start]>&]:opacity-0",
  "motion-reduce:scale-none",
];

const label = [
  "transition-[opacity] duration-150 ease-(--ow-ease-out)",
  "group-data-loading/ow-button:peer-[*]/ow-spinner:opacity-0",
];

// Loading: the spinner takes the start icon's place, or the centre, and nothing resizes.
const spinner = [
  "peer/ow-spinner grid scale-50 opacity-0 will-change-[scale]",
  "transition-[opacity,scale] duration-[150ms,200ms] ease-(--ow-ease-out)",
  "[&>svg]:block [&>svg]:size-full",
  "[.group\\/ow-button>&]:absolute [.group\\/ow-button>&]:inset-0 [.group\\/ow-button>&]:m-auto",
  "[.group\\/ow-button>&]:size-(--icon)",
  "group-data-loading/ow-button:scale-none group-data-loading/ow-button:opacity-100",
  "group-data-loading/ow-button:[&>svg]:animate-[ow-spin_0.8s_linear_infinite]",
  "group-data-loading/ow-button:motion-reduce:[&>svg]:animate-[ow-pulse_0.8s_ease-in-out_infinite_alternate]",
  "motion-reduce:scale-none",
];

export const buttonSlots: Record<
  "layer" | "ripple" | "icon" | "glyph" | "label" | "spinner",
  string
> = {
  layer: layer.join(" "),
  ripple: ripple.join(" "),
  icon: icon.join(" "),
  glyph: glyph.join(" "),
  label: label.join(" "),
  spinner: spinner.join(" "),
};
