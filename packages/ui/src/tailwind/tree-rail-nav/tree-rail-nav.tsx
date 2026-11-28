// Generated from components/tree-rail-nav by scripts/build-tailwind.ts; do not edit.
"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type ReactElement,
  type Ref,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";
import { GlideHighlight, useGlide } from "../lib/glide/use-glide";
import { useMergedRefs } from "../lib/merge-refs";
import { reducedMotionQuery } from "../lib/reduced-motion";
import { useBeforePaint } from "../lib/use-before-paint";
import { createTreeRail, PANEL, ROW } from "./tree-rail";
import { treeRailNavSlots } from "./tree-rail-nav-variants";

// Marquee: px between the two copies of a label, and how fast they travel (px per second).
const MARQUEE_GAP = 32;
const MARQUEE_SPEED = 40;

// The level of the list a row is in: 1 for the top list. Panels pass their row's level on.
const DepthContext = createContext(0);
// The id of the node's row, which labels the node's nested list.
const RowIdContext = createContext<string | undefined>(undefined);

const visible = (row: HTMLElement) =>
  row.getClientRects().length > 0 && !row.matches(':disabled, [aria-disabled="true"]');

/** Arrow keys move along the visible rows; Right and Left open, close, and climb levels. */
function onArrowKey(tree: HTMLElement, event: KeyboardEvent<HTMLElement>): void {
  const row = (event.target as Element).closest<HTMLElement>(ROW);
  if (!row || !tree.contains(row)) return;
  const rows = [...tree.querySelectorAll<HTMLElement>(ROW)].filter(visible);
  const i = rows.indexOf(row);
  const panel = row.parentElement?.querySelector<HTMLElement>(`:scope > ${PANEL}`);
  const expanded = row.getAttribute("aria-expanded");
  let next: HTMLElement | null | undefined = null;
  switch (event.key) {
    case "ArrowDown":
      next = rows[i + 1];
      break;
    case "ArrowUp":
      next = rows[i - 1];
      break;
    case "Home":
      next = rows[0];
      break;
    case "End":
      next = rows.at(-1);
      break;
    case "ArrowRight":
      if (!panel) return;
      if (expanded === "false") row.click();
      else next = rows[i + 1];
      break;
    case "ArrowLeft":
      if (expanded === "true") row.click();
      else {
        const parent = row.parentElement?.closest(PANEL);
        next = parent?.parentElement?.querySelector<HTMLElement>(`:scope > ${ROW}`);
      }
      break;
    default:
      return;
  }
  event.preventDefault();
  next?.focus();
}

export interface TreeRailNavRootProps extends Omit<ComponentProps<"nav">, "className"> {
  className?: string | undefined;
}

/**
 * The navigation: a `<nav>` that holds the rail, the hover highlight (Glide), and one `List`. The
 * trail travels along the rail to a new current row and pulses on arrival.
 */
export function TreeRailNavRoot({
  className,
  children,
  onKeyDown,
  ...props
}: TreeRailNavRootProps): ReactElement {
  const glide = useGlide<HTMLDivElement>({ items: ROW, maxDistance: 40 });
  const tree = useRef<HTMLDivElement | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const merged = useMergedRefs(tree, glide.ref);

  useBeforePaint(() => {
    if (!tree.current || !svg.current) return;
    const rail = createTreeRail(tree.current, svg.current);
    return () => rail.destroy();
  }, []);

  return (
    <nav
      data-slot="tree-rail-nav"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && tree.current) onArrowKey(tree.current, event);
      }}
      {...props}
      className={cn(treeRailNavSlots.root, className)}
    >
      <div data-slot="tree-rail-nav-tree" ref={merged} className={treeRailNavSlots.tree}>
        <GlideHighlight glide={glide} />
        <svg
          ref={svg}
          data-slot="tree-rail-nav-rail"
          className={treeRailNavSlots.rail}
          aria-hidden="true"
          focusable="false"
        />
        {children}
      </div>
    </nav>
  );
}

export interface TreeRailNavListProps extends Omit<ComponentProps<"ul">, "className"> {
  className?: string | undefined;
}

/** A level of rows. Nested in a `Panel`, it is labelled by the row it hangs from. */
export function TreeRailNavList({
  className,
  children,
  ...props
}: TreeRailNavListProps): ReactElement {
  const depth = useContext(DepthContext) + 1;
  const labelledBy = useContext(RowIdContext);
  return (
    <ul
      data-depth={depth}
      aria-labelledby={depth > 1 ? labelledBy : undefined}
      {...props}
      // Found by this, so it stays.
      data-slot="tree-rail-nav-list"
      className={cn(treeRailNavSlots.list, className)}
    >
      <DepthContext.Provider value={depth}>{children}</DepthContext.Provider>
    </ul>
  );
}

export interface TreeRailNavNodeProps extends Omit<Collapsible.Root.Props, "className" | "ref"> {
  className?: string | undefined;
  /** Base UI types the ref for its default `<div>`; it lands on the rendered `<li>`. */
  ref?: Ref<HTMLLIElement> | undefined;
}

/** A list item: one row (`Link` or `Toggle`) and, for a group, a `Panel` with the next level. */
export function TreeRailNavNode({ className, ref, ...props }: TreeRailNavNodeProps): ReactElement {
  const rowId = useId();
  return (
    <RowIdContext.Provider value={rowId}>
      <Collapsible.Root
        data-slot="tree-rail-nav-node"
        render={<li />}
        {...props}
        ref={ref as Ref<HTMLDivElement> | undefined}
        className={cn(treeRailNavSlots.node, className)}
      />
    </RowIdContext.Provider>
  );
}

export interface TreeRailNavToggleProps extends Omit<Collapsible.Trigger.Props, "className"> {
  className?: string | undefined;
}

/** A group's row: a button that opens and closes the node's `Panel`. */
export function TreeRailNavToggle({
  className,
  children,
  ...props
}: TreeRailNavToggleProps): ReactElement {
  const depth = useContext(DepthContext);
  const rowId = useContext(RowIdContext);
  return (
    <Collapsible.Trigger
      id={rowId}
      data-depth={depth}
      {...props}
      // Found by this, so it stays.
      data-slot="tree-rail-nav-toggle"
      className={cn(treeRailNavSlots.item, className)}
    >
      {children}
      <svg
        data-slot="tree-rail-nav-chevron"
        className={treeRailNavSlots.chevron}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </Collapsible.Trigger>
  );
}

export interface TreeRailNavLinkProps extends Omit<useRender.ComponentProps<"a">, "className"> {
  className?: string | undefined;
  /** The page shown (`true` or `"page"`) or the step being read (`"step"`): the trail ends here. */
  current?: boolean | "page" | "step" | undefined;
  disabled?: boolean | undefined;
}

/** A row that navigates. `render` swaps the `<a>` for a router's link. */
export function TreeRailNavLink({
  current,
  disabled,
  className,
  render,
  onClick,
  ref,
  ...props
}: TreeRailNavLinkProps): ReactElement {
  const depth = useContext(DepthContext);
  const rowId = useContext(RowIdContext);
  // A disabled row neither navigates nor runs the app's own click handler.
  const click: typeof onClick = disabled ? (event) => event.preventDefault() : onClick;
  const defaults = {
    id: rowId,
    "data-depth": depth,
    "data-current": current ? "" : undefined,
    "aria-current": current === true ? "page" : current || undefined,
    "aria-disabled": disabled || undefined,
    onClick: click,
  } as const;
  const forced = {
    // Found by this, so it stays.
    "data-slot": "tree-rail-nav-link",
    className: cn(treeRailNavSlots.item, className),
  };
  return useRender({
    defaultTagName: "a",
    render,
    ref,
    props: mergeProps<"a">(defaults, props, forced),
  });
}

export interface TreeRailNavPanelProps extends Omit<Collapsible.Panel.Props, "className"> {
  className?: string | undefined;
}

/** The next level of a node. It stays mounted while closed, so the rail can end at its row. */
export function TreeRailNavPanel({ className, ...props }: TreeRailNavPanelProps): ReactElement {
  const depth = useContext(DepthContext);
  return (
    <Collapsible.Panel
      keepMounted
      data-depth={depth}
      {...props}
      // Found by this, so it stays.
      data-slot="tree-rail-nav-panel"
      className={cn(treeRailNavSlots.panel, className)}
    />
  );
}

export interface TreeRailNavLabelProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

/**
 * A row's text on one line. Text that does not fit fades out at the end, and runs left in a loop
 * while the row is hovered or focused; with reduced motion it stays put and shows a tooltip.
 */
export function TreeRailNavLabel({
  className,
  children,
  style,
  ref,
  ...props
}: TreeRailNavLabelProps): ReactElement {
  const outer = useRef<HTMLSpanElement | null>(null);
  const merged = useMergedRefs(outer, ref);
  // The width of one copy of the text, while it overflows; 0 while it fits.
  const [overflow, setOverflow] = useState(0);

  useBeforePaint(() => {
    const el = outer.current;
    const text = el?.firstElementChild as HTMLElement | null;
    if (!el || !text) return;
    const check = () => {
      const width = text.offsetWidth;
      setOverflow(width - el.clientWidth > 1 ? width : 0);
    };
    const sizes = new ResizeObserver(check);
    sizes.observe(el);
    sizes.observe(text);
    check();
    return () => sizes.disconnect();
  }, []);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const reduce = reducedMotionQuery();
    const tooltip = () => {
      const text = (el.firstElementChild as HTMLElement | null)?.textContent ?? "";
      if (overflow && reduce.matches) el.title = text;
      else el.removeAttribute("title");
    };
    tooltip();
    reduce.addEventListener("change", tooltip);
    return () => reduce.removeEventListener("change", tooltip);
  }, [overflow]);

  const loop = overflow + MARQUEE_GAP;
  return (
    <span
      data-slot="tree-rail-nav-label"
      data-overflow={overflow ? "" : undefined}
      style={
        overflow
          ? ({
              "--_loop": `${loop}px`,
              "--_marquee-duration": `${(loop / MARQUEE_SPEED).toFixed(2)}s`,
              ...style,
            } as CSSProperties)
          : style
      }
      {...props}
      ref={merged}
      className={cn(treeRailNavSlots.label, className)}
    >
      <span data-slot="tree-rail-nav-label-text" className={treeRailNavSlots.labelText}>
        {children}
      </span>
      {/* The loop's second copy, for the eye only. */}
      {overflow ? (
        <span
          data-slot="tree-rail-nav-label-text"
          className={treeRailNavSlots.labelText}
          aria-hidden="true"
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}

export interface TreeRailNavOriginProps extends Omit<ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/**
 * A label beside the rail's origin, before the first `List`: the trail starts from it. Without one,
 * the rail and the trail start at the first row.
 */
export function TreeRailNavOrigin({ className, ...props }: TreeRailNavOriginProps): ReactElement {
  return (
    <div
      {...props}
      // Found by this, so it stays.
      data-slot="tree-rail-nav-origin"
      className={cn(treeRailNavSlots.origin, className)}
    />
  );
}

export interface TreeRailNavIconProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

/** A row's icon (decorative); top-level rails line up with it. */
export function TreeRailNavIcon({ className, ...props }: TreeRailNavIconProps): ReactElement {
  return (
    <span
      data-slot="tree-rail-nav-icon"
      aria-hidden="true"
      {...props}
      className={cn(treeRailNavSlots.icon, className)}
    />
  );
}
