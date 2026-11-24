// The Tailwind CSS v4 twin of tree-rail-nav-variants.ts: the same exports, with the styles as
// utility classes. Needs tokens.css, and from the bridge (tailwind.css) the marquee's keyframes and
// the ow-tree-rail-nav-* variants.

// An accent trail that travels along the rail and pulses on arrival. No glow. One rail per level,
// 25px apart (px, read by the script); rows indent just past their rail. 25px puts a first-level
// row's children in line with its text, after the icon. A row's middle is --_row-mid: rows are 32px.
const root = [
  "[--_fg:var(--ow-fg)] [--_muted:var(--ow-muted)] [--_rail:var(--ow-line)]",
  "[--_node:color-mix(in_oklab,var(--_fg)_24%,transparent)] [--_trail:var(--ow-accent)]",
  // Dots are cut out of the rail with the page color behind them.
  "[--_surface:var(--ow-bg)] [--_tint:color-mix(in_oklab,var(--_trail)_10%,transparent)]",
  "[--_focus:var(--ow-focus)] [--_radius:var(--ow-radius)] [--_ease:cubic-bezier(0.22,1,0.36,1)]",
  "[--_r0:9px] [--_r1:34px] [--_r2:59px] [--_row-mid:16px]",
  "text-[13.5px] leading-[1.4]",
];

// Glide's container (relative isolate). Until the script has drawn the rail (it marks the tree with
// data-rail), CSS draws its resting shape from the same variables, 1.25px wide. The first draw
// (the script sets data-instant) lets nothing transition in; the attribute is doubled to outrank
// every transition below.
const tree = [
  "relative isolate pt-[4px] pb-[10px] not-data-rail:[--_line:1.25px]",
  "[&[data-instant][data-instant]_*]:[transition:none]",
  "[&[data-instant][data-instant]_*::before]:[transition:none]",
];

// A label at the top, the trail's starting point, indented like a first-level row.
const origin = [
  "[--_x:calc(var(--_r0)_+_11px)]",
  "relative flex items-center gap-[8px] min-h-[24px] mb-[6px] ms-(--_x) px-[10px]",
  "text-(color:--_muted) text-[12.5px]",
  // The trail's starting point, at the label's middle: a 2.5px dot in a 5px ring at 35%. An image,
  // so it is round at any zoom. Without an Origin, the first row's dot.
  "ow-tree-rail-nav-top:before:content-[''] ow-tree-rail-nav-top:before:absolute",
  "ow-tree-rail-nav-top:before:z-1 ow-tree-rail-nav-top:before:size-[12px]",
  "ow-tree-rail-nav-top:before:bg-(color:--_trail)",
  "ow-tree-rail-nav-top:before:top-[calc(50%_-_6px)]",
  "ow-tree-rail-nav-top:before:start-[calc(var(--_r0)_-_var(--_x)_-_6px)]",
  "ow-tree-rail-nav-top:before:[mask:url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%22-6%20-6%2012%2012%22%3E%3Ccircle%20r=%225%22%20fill=%22none%22%20stroke=%22%23000%22%20stroke-opacity=%22.35%22%20stroke-width=%221.25%22/%3E%3Ccircle%20r=%222.5%22/%3E%3C/svg%3E')_0_0/100%_100%_no-repeat]",
  "forced-colors:ow-tree-rail-nav-top:before:forced-color-adjust-none",
  "forced-colors:ow-tree-rail-nav-top:before:bg-[Highlight]",
  // The resting rail from the label's middle down to the first row.
  "ow-tree-rail-nav-resting-top:after:content-[''] ow-tree-rail-nav-resting-top:after:absolute",
  "ow-tree-rail-nav-resting-top:after:start-[calc(var(--_r0)_-_var(--_x)_-_var(--_line)_/_2)]",
  "ow-tree-rail-nav-resting-top:after:w-(--_line) ow-tree-rail-nav-resting-top:after:top-1/2",
  "ow-tree-rail-nav-resting-top:after:-bottom-[6px]",
  "ow-tree-rail-nav-resting-top:after:bg-(color:--_rail)",
];

// The rail the script draws: the base, the trail along it, a dot per row, and the marker. The
// script measures x from the left, so right to left the whole rail is mirrored.
const rail = [
  "absolute inset-0 z-0 w-full h-full overflow-visible pointer-events-none",
  "[&:dir(rtl)]:[scale:-1_1]",
  "[&_path]:fill-none [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round]",
];

const railBase = [
  "[&_path]:stroke-(color:--_rail) [&_path]:[stroke-width:1.25]",
  "forced-colors:[&_path]:stroke-[GrayText]",
];

// The trail, and the marker's layer, appear with data-on.
const railActive = ["opacity-0 transition-[opacity] duration-250 ease-[ease] data-on:opacity-100"];

const railTrail = ["stroke-(color:--_trail) [stroke-width:1.75] forced-colors:stroke-[Highlight]"];

// The dot cut out of the rail with a surface-coloured stroke; hollow while it rests on a row that
// is hidden.
const railMarker = ["group/ow-tree-rail-nav-marker"];

const railHalo = ["fill-(--_trail) opacity-0"];

const railDot = [
  "fill-(--_trail) stroke-(color:--_surface) [stroke-width:2]",
  "group-data-hollow/ow-tree-rail-nav-marker:fill-(--_surface)",
  "group-data-hollow/ow-tree-rail-nav-marker:stroke-(color:--_trail)",
  "group-data-hollow/ow-tree-rail-nav-marker:[stroke-width:1.5]",
  "forced-colors:fill-[Highlight]",
];

// A dot per row. It warms when its row is hot (Glide's), takes the trail's color and grows when the
// trail arrives, and fades when its row is disabled or out of sight.
const railNode = [
  "[&_circle]:fill-(--_node) [&_circle]:stroke-(color:--_surface) [&_circle]:[stroke-width:1.5]",
  "[&_circle]:transition-[fill,opacity,transform] [&_circle]:duration-[220ms,200ms,340ms]",
  "[&_circle]:ease-[ease,ease,var(--_ease)]",
  "data-hot:[&_circle]:fill-(--_muted)",
  "data-lit:[&_circle]:fill-(--_trail) data-lit:[&_circle]:transform-[scale(1.2)]",
  "data-disabled:[&_circle]:opacity-45 data-hidden:[&_circle]:opacity-0",
  "motion-reduce:[&_circle]:transition-[fill,opacity] motion-reduce:[&_circle]:duration-200",
  "motion-reduce:[&_circle]:ease-[ease]",
];

// Each list's rail and the gap between its rows; the resting rail draws from both. Inside a panel
// the rail is the panel's, one level in, and the rows sit closer.
const list = [
  "[--_rail-x:var(--_r0)] [--_gap:6px] relative m-0 p-0 list-none",
  "[[data-slot=tree-rail-nav-panel]>&]:[--_rail-x:var(--_branch-x)]",
  "[[data-slot=tree-rail-nav-panel]>&]:[--_gap:2px]",
  "[[data-slot=tree-rail-nav-panel]>&]:pt-[2px] [[data-slot=tree-rail-nav-panel]>&]:pb-[6px]",
  // The resting rail from the Origin label to the first row.
  "ow-tree-rail-nav-resting-first:before:content-[''] ow-tree-rail-nav-resting-first:before:absolute",
  "ow-tree-rail-nav-resting-first:before:start-[calc(var(--_rail-x,var(--_r0))_-_var(--_line)_/_2)]",
  "ow-tree-rail-nav-resting-first:before:w-(--_line) ow-tree-rail-nav-resting-first:before:bg-(color:--_rail)",
  "ow-tree-rail-nav-resting-first:before:top-0 ow-tree-rail-nav-resting-first:before:h-(--_row-mid)",
];

// The resting rail of a row: from its middle to the next row's, and on into its own open group.
const node = [
  "relative [:where([data-slot=tree-rail-nav-node]+&)]:mt-(--_gap)",
  "ow-tree-rail-nav-resting-node:before:content-[''] ow-tree-rail-nav-resting-node:before:absolute",
  "ow-tree-rail-nav-resting-node:before:start-[calc(var(--_rail-x,var(--_r0))_-_var(--_line)_/_2)]",
  "ow-tree-rail-nav-resting-node:before:w-(--_line) ow-tree-rail-nav-resting-node:before:bg-(color:--_rail)",
  "ow-tree-rail-nav-resting:not-last:before:top-(--_row-mid)",
  "ow-tree-rail-nav-resting:not-last:before:bottom-[calc(-1_*_(var(--_gap)_+_var(--_row-mid)))]",
  // The last row has one only with an open group, so no content here.
  "ow-tree-rail-nav-resting:last:[&::before]:top-(--_row-mid)",
  "ow-tree-rail-nav-resting:last:[&::before]:h-(--_row-mid)",
];

// Closed it holds no height; it clips only while it animates (data-clip comes from the script while
// its rows do not fit). The rail its rows hang from is one level in, two for a group in a group.
// Resting, the branch into an open group is the script's S-curve from the parent's rail to the
// group's, down to its first row's middle (the list's 2px padding and half a row).
const panel = [
  "[--_branch-x:var(--_r1)] [[data-slot=tree-rail-nav-panel]_&]:[--_branch-x:var(--_r2)]",
  "relative h-(--collapsible-panel-height) transition-[block-size] duration-340 ease-(--_ease)",
  "data-starting-style:h-0 data-ending-style:h-0",
  "data-starting-style:overflow-hidden data-ending-style:overflow-hidden data-clip:overflow-hidden",
  "motion-reduce:[transition:none]",
  "ow-tree-rail-nav-resting-open:before:content-[''] ow-tree-rail-nav-resting-open:before:absolute",
  "ow-tree-rail-nav-resting-open:before:top-[calc(var(--_line)_/_-2)]",
  "ow-tree-rail-nav-resting-open:before:start-[calc(var(--_rail-x)_-_var(--_line)_/_2)]",
  "ow-tree-rail-nav-resting-open:before:w-[calc(var(--_branch-x)_-_var(--_rail-x)_+_var(--_line))]",
  "ow-tree-rail-nav-resting-open:before:h-[calc(2px_+_var(--_row-mid)_+_var(--_line))]",
  "ow-tree-rail-nav-resting-open:before:bg-(color:--_rail)",
  "ow-tree-rail-nav-resting-open:before:[mask:url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2026.25%2019.25%22%20preserveAspectRatio=%22none%22%3E%3Cpath%20d=%22M.625.625C.625%209.625%2025.625%209.625%2025.625%2018.625%22%20fill=%22none%22%20stroke=%22%23000%22%20stroke-width=%221.25%22%20stroke-linecap=%22round%22%20vector-effect=%22non-scaling-stroke%22/%3E%3C/svg%3E')_0_0/100%_100%_no-repeat]",
  "ow-tree-rail-nav-resting-open:[&:dir(rtl)]:before:[scale:-1_1]",
];

// A row, a link or a toggle. First-level rows stand out by color and icon; every level shares one
// size and weight. Lit by Glide, on the trail, or current: the text color, and a disabled row
// is dimmed after all that.
const item = [
  "group/ow-tree-rail-nav-item [--_x:calc(var(--_r0)_+_11px)]",
  "[--_dim:color-mix(in_oklab,var(--_muted)_60%,transparent)]",
  "data-[depth=2]:[--_x:calc(var(--_r1)_+_10px)] data-[depth=3]:[--_x:calc(var(--_r2)_+_10px)]",
  // Box.
  "relative z-1 flex items-center gap-[8px] box-border w-[calc(100%_-_var(--_x))] min-h-[32px]",
  "ms-(--_x) py-[6px] px-[10px] border-0 rounded-(--_radius) bg-transparent",
  // Type.
  "text-(color:--_muted) font-[family-name:inherit] font-[weight:inherit] text-start no-underline",
  "cursor-pointer transition-[color] duration-180 ease-[ease]",
  "ow-tree-rail-nav-bright:text-(color:--_fg)",
  // Inside, so a panel's overflow never cuts it.
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--_focus)",
  "disabled:text-(color:--_dim) disabled:cursor-not-allowed",
  "aria-disabled:text-(color:--_dim) aria-disabled:cursor-not-allowed",
  // The current row's tint sweeps in when the trail arrives and folds back toward the rail when the
  // trail leaves (data-leaving, set by the script while it closes). Only these rows have it, so
  // axe can read every other row's contrast directly.
  "ow-tree-rail-nav-tinted:before:content-[''] ow-tree-rail-nav-tinted:before:absolute",
  "ow-tree-rail-nav-tinted:before:inset-0 ow-tree-rail-nav-tinted:before:-z-1",
  "ow-tree-rail-nav-tinted:before:rounded-[inherit] ow-tree-rail-nav-tinted:before:bg-(color:--_tint)",
  "ow-tree-rail-nav-tinted:before:opacity-0 ow-tree-rail-nav-tinted:before:transform-[scaleX(0.04)]",
  "ow-tree-rail-nav-tinted:before:origin-[left_center]",
  "ow-tree-rail-nav-tinted:[&:dir(rtl)]:before:origin-[right_center]",
  // Its own layer, so it lands without a pixel jump.
  "ow-tree-rail-nav-tinted:before:will-change-transform",
  "ow-tree-rail-nav-tinted:before:transition-[transform,opacity]",
  "ow-tree-rail-nav-tinted:before:duration-[500ms,220ms] ow-tree-rail-nav-tinted:before:ease-[var(--_ease),ease]",
  "ow-tree-rail-nav-tinted:data-arrived:before:opacity-100",
  "ow-tree-rail-nav-tinted:data-arrived:before:transform-none",
  // Closing is quicker than the sweep, and fades once it has mostly folded.
  "ow-tree-rail-nav-tinted:data-leaving:before:duration-[300ms,160ms]",
  "ow-tree-rail-nav-tinted:data-leaving:before:ease-[cubic-bezier(0.4,0,0.2,1),ease]",
  "ow-tree-rail-nav-tinted:data-leaving:before:delay-[0s,140ms]",
  // The deepest current row's tint, at rest.
  "ow-tree-rail-nav-resting-current:before:opacity-100",
  "ow-tree-rail-nav-resting-current:before:transform-none",
  "ow-tree-rail-nav-resting-current:before:[transition:none]",
  // No sweeping; opacity only.
  "motion-reduce:ow-tree-rail-nav-tinted:before:transform-none",
  "motion-reduce:ow-tree-rail-nav-tinted:before:transition-[opacity]",
  "motion-reduce:ow-tree-rail-nav-tinted:before:duration-200",
  "motion-reduce:ow-tree-rail-nav-tinted:before:ease-[ease]",
  "motion-reduce:ow-tree-rail-nav-tinted:before:delay-0",
  "motion-reduce:ow-tree-rail-nav-tinted:data-leaving:before:duration-200",
  "motion-reduce:ow-tree-rail-nav-tinted:data-leaving:before:ease-[ease]",
  "motion-reduce:ow-tree-rail-nav-tinted:data-leaving:before:delay-0",
  // The resting dot on its rail, cut out of the rail with the page color, as the script draws it.
  "ow-tree-rail-nav-resting:after:content-[''] ow-tree-rail-nav-resting:after:absolute",
  "ow-tree-rail-nav-resting:after:top-[calc(50%_-_2.5px)]",
  "ow-tree-rail-nav-resting:after:start-[calc(var(--_rail-x)_-_var(--_x)_-_2.5px)]",
  "ow-tree-rail-nav-resting:after:size-[5px] ow-tree-rail-nav-resting:after:rounded-[50%]",
  "ow-tree-rail-nav-resting:after:bg-(color:--_node)",
  "ow-tree-rail-nav-resting:after:shadow-[0_0_0_1.5px_var(--_surface)]",
  "ow-tree-rail-nav-resting:disabled:after:opacity-45",
  "ow-tree-rail-nav-resting:aria-disabled:after:opacity-45",
  "ow-tree-rail-nav-resting:data-disabled:after:opacity-45",
  // The system colors; the current row is underlined.
  "forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-transparent",
  "forced-colors:data-current:underline",
  "forced-colors:focus-visible:outline-2 forced-colors:focus-visible:-outline-offset-2",
  "forced-colors:focus-visible:outline-[Highlight]",
];

// An icon is the row's font size plus 2px, whatever icon is given.
const icon = ["inline-grid flex-none place-items-center size-[calc(1em_+_2px)] [&>svg]:size-full"];

// A label on one line. When it overflows, its end fades; on hover or keyboard focus the text runs
// left in a seamless loop (two copies, --_loop apart), after a short pause. Two mask layers: the
// end fade stays put; the start fade waits just outside the label and slides in (mask-position
// transitions, mask images do not) as the text starts to run. Only the way in transitions: on leave
// the fade snaps back with the text.
const label = [
  "group/ow-tree-rail-nav-label flex flex-auto gap-[32px] min-w-0 overflow-hidden whitespace-nowrap",
  "data-overflow:[mask-image:linear-gradient(to_right,transparent,#000_16px),linear-gradient(to_left,transparent,#000_20px)]",
  "data-overflow:[mask-size:calc(100%_+_16px)_100%,100%_100%]",
  "data-overflow:[mask-position:-16px_0,0_0] data-overflow:[mask-repeat:no-repeat]",
  "data-overflow:[mask-composite:intersect]",
  "data-overflow:[&:dir(rtl)]:[mask-image:linear-gradient(to_left,transparent,#000_16px),linear-gradient(to_right,transparent,#000_20px)]",
  "data-overflow:[&:dir(rtl)]:[mask-position:0_0,0_0]",
  "ow-tree-rail-nav-running:data-overflow:[mask-position:0_0,0_0]",
  "ow-tree-rail-nav-running:data-overflow:transition-[mask-position]",
  "ow-tree-rail-nav-running:data-overflow:duration-250 ow-tree-rail-nav-running:data-overflow:ease-[ease]",
  "ow-tree-rail-nav-running:data-overflow:delay-400",
  "ow-tree-rail-nav-running:data-overflow:[&:dir(rtl)]:[mask-position:-16px_0,0_0]",
  // The label keeps still, start fade included; its full text is in a tooltip instead.
  "motion-reduce:ow-tree-rail-nav-running:data-overflow:[mask-position:-16px_0,0_0]",
  "motion-reduce:ow-tree-rail-nav-running:data-overflow:[&:dir(rtl)]:[mask-position:0_0,0_0]",
];

const labelText = [
  "flex-none",
  "ow-tree-rail-nav-running:group-data-overflow/ow-tree-rail-nav-label:animate-[ow-tree-rail-nav-marquee_var(--_marquee-duration)_linear_0.4s_infinite]",
  "ow-tree-rail-nav-running:group-data-overflow/ow-tree-rail-nav-label:[&:dir(rtl)]:animate-[ow-tree-rail-nav-marquee-rtl_var(--_marquee-duration)_linear_0.4s_infinite]",
  "motion-reduce:ow-tree-rail-nav-running:group-data-overflow/ow-tree-rail-nav-label:animate-none",
];

const chevron = [
  "flex-none size-[14px] ms-auto fill-none stroke-current stroke-2",
  "[stroke-linecap:round] [stroke-linejoin:round]",
  // Its own layer, so it lands without a pixel jump.
  "will-change-[rotate] transition-[rotate] duration-340 ease-(--_ease)",
  "group-aria-[expanded=false]/ow-tree-rail-nav-item:-rotate-90",
  "group-aria-[expanded=false]/ow-tree-rail-nav-item:[&:dir(rtl)]:rotate-90",
  "motion-reduce:[transition:none]",
];

/** The classes of every part, the React parts' and the rail's own drawing. */
export const treeRailNavSlots: Record<
  | "root"
  | "tree"
  | "list"
  | "node"
  | "item"
  | "chevron"
  | "panel"
  | "icon"
  | "origin"
  | "label"
  | "labelText"
  | "rail"
  | "railBase"
  | "railActive"
  | "railTrail"
  | "railNodes"
  | "railNode"
  | "railMarker"
  | "railHalo"
  | "railDot",
  string
> = {
  root: root.join(" "),
  tree: tree.join(" "),
  list: list.join(" "),
  node: node.join(" "),
  item: item.join(" "),
  chevron: chevron.join(" "),
  panel: panel.join(" "),
  icon: icon.join(" "),
  origin: origin.join(" "),
  label: label.join(" "),
  labelText: labelText.join(" "),
  rail: rail.join(" "),
  railBase: railBase.join(" "),
  railActive: railActive.join(" "),
  railTrail: railTrail.join(" "),
  railNodes: "",
  railNode: railNode.join(" "),
  railMarker: railMarker.join(" "),
  railHalo: railHalo.join(" "),
  railDot: railDot.join(" "),
};
