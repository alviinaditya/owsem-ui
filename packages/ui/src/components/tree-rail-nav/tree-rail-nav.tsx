"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  type KeyboardEvent,
  type Ref,
  type RefAttributes,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { withClassName } from "../../core/class-name";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { cls, createTreeRail } from "./tree-rail";
import "./tree-rail-nav.css";

// Marquee: px between the two copies of a label, and how fast they travel (px per second).
const MARQUEE_GAP = 32;
const MARQUEE_SPEED = 40;

const ROW = `.${cls.item}`;

// Drawing before the first paint keeps a nav mounted on the client (a route change) from showing
// a frame without its trail; the server has no layout, so it falls back without React 18's warning.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

// The level of the list a row is in: 1 for the top list. Panels pass their row's level on.
// (Context.Provider, not <Context>: React 18.2 is a supported peer.)
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
  const panel = row.parentElement?.querySelector<HTMLElement>(`:scope > .${cls.panel}`);
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
        const parent = row.parentElement?.closest(`.${cls.panel}`);
        next = parent?.parentElement?.querySelector<HTMLElement>(`:scope > ${ROW}`);
      }
      break;
    default:
      return;
  }
  event.preventDefault();
  next?.focus();
}

export type TreeRailNavRootProps = ComponentPropsWithoutRef<"nav">;

/**
 * The navigation: a `<nav>` that holds the rail, the hover highlight (Glide), and one `List`. The
 * trail travels along the rail to a new current row and pulses on arrival.
 */
export const TreeRailNavRoot: ForwardRefExoticComponent<
  TreeRailNavRootProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, TreeRailNavRootProps>(function TreeRailNavRoot(
  { className, children, onKeyDown, ...props },
  ref,
) {
  const glide = useGlide<HTMLDivElement>({ items: ROW, maxDistance: 40 });
  const tree = useRef<HTMLDivElement | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  useBeforePaint(() => {
    if (!tree.current || !svg.current) return;
    const rail = createTreeRail(tree.current, svg.current);
    return () => rail.destroy();
  }, []);

  const glideRef = glide.ref;
  const setTree = useCallback(
    (el: HTMLDivElement | null) => {
      tree.current = el;
      glideRef(el);
    },
    [glideRef],
  );

  return (
    <nav
      ref={ref}
      className={className ? `${cls.root} ${className}` : cls.root}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && tree.current) onArrowKey(tree.current, event);
      }}
      {...props}
    >
      <div ref={setTree} className={cls.tree}>
        <GlideHighlight glide={glide} />
        <svg ref={svg} className={cls.rail} aria-hidden="true" focusable="false" />
        {children}
      </div>
    </nav>
  );
});

export type TreeRailNavListProps = ComponentPropsWithoutRef<"ul">;

/** A level of rows. Nested in a `Panel`, it is labelled by the row it hangs from. */
export const TreeRailNavList: ForwardRefExoticComponent<
  TreeRailNavListProps & RefAttributes<HTMLUListElement>
> = forwardRef<HTMLUListElement, TreeRailNavListProps>(function TreeRailNavList(
  { className, children, ...props },
  ref,
) {
  const depth = useContext(DepthContext) + 1;
  const labelledBy = useContext(RowIdContext);
  return (
    <ul
      ref={ref}
      className={className ? `${cls.list} ${className}` : cls.list}
      data-depth={depth}
      aria-labelledby={depth > 1 ? labelledBy : undefined}
      {...props}
    >
      <DepthContext.Provider value={depth}>{children}</DepthContext.Provider>
    </ul>
  );
});

export type TreeRailNavNodeProps = Omit<Collapsible.Root.Props, "ref">;

/** A list item: one row (`Link` or `Toggle`) and, for a group, a `Panel` with the next level. */
export const TreeRailNavNode: ForwardRefExoticComponent<
  TreeRailNavNodeProps & RefAttributes<HTMLLIElement>
> = forwardRef<HTMLLIElement, TreeRailNavNodeProps>(function TreeRailNavNode(
  { className, ...props },
  ref,
) {
  const rowId = useId();
  return (
    <RowIdContext.Provider value={rowId}>
      <Collapsible.Root
        // Base UI types the ref for its default <div>; it lands on the rendered <li>.
        ref={ref as unknown as Ref<HTMLDivElement>}
        render={<li />}
        className={withClassName(cls.node, className)}
        {...props}
      />
    </RowIdContext.Provider>
  );
});

export type TreeRailNavToggleProps = Omit<Collapsible.Trigger.Props, "ref">;

/** A group's row: a button that opens and closes the node's `Panel`. */
export const TreeRailNavToggle: ForwardRefExoticComponent<
  TreeRailNavToggleProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, TreeRailNavToggleProps>(function TreeRailNavToggle(
  { className, children, ...props },
  ref,
) {
  const depth = useContext(DepthContext);
  const rowId = useContext(RowIdContext);
  return (
    <Collapsible.Trigger
      ref={ref}
      id={rowId}
      data-depth={depth}
      className={withClassName(cls.item, className)}
      {...props}
    >
      {children}
      <svg className={cls.chevron} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </Collapsible.Trigger>
  );
});

export interface TreeRailNavLinkProps extends useRender.ComponentProps<"a"> {
  /** The page shown (`true` or `"page"`) or the step being read (`"step"`): the trail ends here. */
  current?: boolean | "page" | "step" | undefined;
  disabled?: boolean | undefined;
}

/** A row that navigates. `render` swaps the `<a>` for a router's link. */
export const TreeRailNavLink: ForwardRefExoticComponent<
  Omit<TreeRailNavLinkProps, "ref"> & RefAttributes<HTMLAnchorElement>
> = forwardRef<HTMLAnchorElement, Omit<TreeRailNavLinkProps, "ref">>(function TreeRailNavLink(
  { current, disabled, className, render, onClick, ...props },
  ref,
) {
  const depth = useContext(DepthContext);
  const rowId = useContext(RowIdContext);
  // A disabled row neither navigates nor runs the app's own click handler.
  const click: typeof onClick = disabled ? (event) => event.preventDefault() : onClick;
  return useRender({
    defaultTagName: "a",
    render,
    ref,
    props: mergeProps<"a">(
      {
        id: rowId,
        className: className ? `${cls.item} ${className}` : cls.item,
        "data-depth": depth,
        "data-current": current ? "" : undefined,
        "aria-current": current === true ? "page" : current || undefined,
        "aria-disabled": disabled || undefined,
        onClick: click,
      } as ComponentPropsWithoutRef<"a">,
      props,
    ),
  });
});

export type TreeRailNavPanelProps = Omit<Collapsible.Panel.Props, "ref">;

/** The next level of a node. It stays mounted while closed, so the rail can end at its row. */
export const TreeRailNavPanel: ForwardRefExoticComponent<
  TreeRailNavPanelProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, TreeRailNavPanelProps>(function TreeRailNavPanel(
  { className, ...props },
  ref,
) {
  const depth = useContext(DepthContext);
  return (
    <Collapsible.Panel
      ref={ref}
      keepMounted
      data-depth={depth}
      className={withClassName(cls.panel, className)}
      {...props}
    />
  );
});

export type TreeRailNavLabelProps = ComponentPropsWithoutRef<"span">;

/**
 * A row's text on one line. Text that does not fit fades out at the end, and runs left in a loop
 * while the row is hovered or focused; with reduced motion it stays put and shows a tooltip.
 */
export const TreeRailNavLabel: ForwardRefExoticComponent<
  TreeRailNavLabelProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, TreeRailNavLabelProps>(function TreeRailNavLabel(
  { className, children, style, ...props },
  ref,
) {
  const outer = useRef<HTMLSpanElement | null>(null);
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
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const tooltip = () => {
      const text = (el.firstElementChild as HTMLElement | null)?.textContent ?? "";
      if (overflow && reduce.matches) el.title = text;
      else el.removeAttribute("title");
    };
    tooltip();
    reduce.addEventListener("change", tooltip);
    return () => reduce.removeEventListener("change", tooltip);
  }, [overflow]);

  const setRef = useCallback(
    (el: HTMLSpanElement | null) => {
      outer.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  const loop = overflow + MARQUEE_GAP;
  return (
    <span
      ref={setRef}
      className={className ? `${cls.label} ${className}` : cls.label}
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
    >
      <span className={cls.labelText}>{children}</span>
      {/* The loop's second copy, for the eye only. */}
      {overflow ? (
        <span className={cls.labelText} aria-hidden="true">
          {children}
        </span>
      ) : null}
    </span>
  );
});

export type TreeRailNavOriginProps = ComponentPropsWithoutRef<"div">;

/**
 * A label beside the rail's origin, before the first `List`: the trail starts from it. Without one,
 * the rail and the trail start at the first row.
 */
export const TreeRailNavOrigin: ForwardRefExoticComponent<
  TreeRailNavOriginProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, TreeRailNavOriginProps>(function TreeRailNavOrigin(
  { className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={className ? `${cls.origin} ${className}` : cls.origin} {...props} />
  );
});

export type TreeRailNavIconProps = ComponentPropsWithoutRef<"span">;

/** A row's icon (decorative); top-level rails line up with it. */
export const TreeRailNavIcon: ForwardRefExoticComponent<
  TreeRailNavIconProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, TreeRailNavIconProps>(function TreeRailNavIcon(
  { className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={className ? `${cls.icon} ${className}` : cls.icon}
      {...props}
    />
  );
});
