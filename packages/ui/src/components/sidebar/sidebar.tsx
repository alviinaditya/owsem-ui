"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  type ComponentProps,
  createContext,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "../../core/cn";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { useMergedRefs } from "../../core/merge-refs";
import { prefersReducedMotion } from "../../core/reduced-motion";
import { trackPointerType, useScrollLock } from "../../core/scroll-lock";
import { useBeforePaint } from "../../core/use-before-paint";
import { createIndicator } from "./sidebar.indicator";
import { sidebarSlots } from "./sidebar-variants";
import "./sidebar.css";

// The link is found by its data-slot, never by class.
const LINK = '[data-slot="sidebar-link"]';

export interface SidebarContextValue {
  /** Whether the desktop sidebar is open. */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Flips the state of the current mode: `open` on desktop, `mobileOpen` on mobile. */
  toggle: () => void;
  /** Whether `mobileQuery` matches, so the sidebar is a drawer. */
  mobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface InternalContext extends SidebarContextValue {
  rootId: string;
}

const SidebarContext = createContext<InternalContext | null>(null);

/** The sidebar's state, from anywhere under a `Sidebar.Provider`. */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar needs a Sidebar.Provider above it.");
  return context;
}

/** An open state that follows `value` when given, and keeps its own otherwise. */
function useOpenFlag(
  value: boolean | undefined,
  initial: boolean,
  onChange: ((open: boolean) => void) | undefined,
): [boolean, (open: boolean) => void] {
  const [own, setOwn] = useState(initial);
  const current = value ?? own;
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const set = useCallback((next: boolean) => {
    if (latest.current.value === undefined) setOwn(next);
    latest.current.onChange?.(next);
  }, []);
  return [current, set];
}

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches,
    () => false,
  );
}

export interface SidebarProviderProps extends Omit<useRender.ComponentProps<"div">, "className"> {
  className?: string | undefined;
  /** Controlled desktop state. */
  open?: boolean | undefined;
  /** @default true */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Controlled drawer state (mobile). */
  mobileOpen?: boolean | undefined;
  /** @default false */
  defaultMobileOpen?: boolean | undefined;
  onMobileOpenChange?: ((open: boolean) => void) | undefined;
  /** The media query under which the sidebar is a drawer. @default "(max-width: 767px)" */
  mobileQuery?: string | undefined;
  /** The key that, with Ctrl or Cmd, toggles the sidebar; `false` turns it off. @default "b" */
  shortcut?: string | false | undefined;
}

/**
 * Holds the state of both modes, so a `Sidebar.Trigger` can sit anywhere under it. It renders a
 * `div` (a real box, `display: flex`) that carries `data-sidebar-state="open|closed"` for the
 * current mode and `data-sidebar-mobile` while the sidebar is a drawer, so the page around the
 * sidebar can be laid out from CSS.
 */
export function SidebarProvider({
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  mobileOpen: mobileOpenProp,
  defaultMobileOpen = false,
  onMobileOpenChange,
  mobileQuery = "(max-width: 767px)",
  shortcut = "b",
  className,
  render,
  ref,
  ...props
}: SidebarProviderProps): ReactElement {
  const rootId = useId();
  const [open, setOpen] = useOpenFlag(openProp, defaultOpen, onOpenChange);
  const [mobileOpen, setMobileOpen] = useOpenFlag(
    mobileOpenProp,
    defaultMobileOpen,
    onMobileOpenChange,
  );
  const mobile = useMediaQuery(mobileQuery);

  const toggle = useCallback(
    () => (mobile ? setMobileOpen(!mobileOpen) : setOpen(!open)),
    [mobile, mobileOpen, open, setMobileOpen, setOpen],
  );
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;

  useEffect(() => {
    if (shortcut === false) return;
    const key = shortcut.toLowerCase();
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !(event.metaKey || event.ctrlKey)) return;
      if (event.altKey || event.shiftKey || event.key.toLowerCase() !== key) return;
      if (event.target instanceof HTMLElement && event.target.isContentEditable) return;
      event.preventDefault();
      toggleRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const value = useMemo<InternalContext>(
    () => ({ rootId, open, setOpen, toggle, mobile, mobileOpen, setMobileOpen }),
    [rootId, open, setOpen, toggle, mobile, mobileOpen, setMobileOpen],
  );
  const shown = mobile ? mobileOpen : open;
  return (
    <SidebarContext.Provider value={value}>
      {useRender({
        defaultTagName: "div",
        render,
        ref,
        props: {
          "data-slot": "sidebar-provider",
          ...props,
          className: cn(sidebarSlots.provider, className),
          "data-sidebar-state": shown ? "open" : "closed",
          "data-sidebar-mobile": mobile ? "" : undefined,
        },
      })}
    </SidebarContext.Provider>
  );
}

export interface SidebarRootProps extends Omit<useRender.ComponentProps<"nav">, "className"> {
  className?: string | undefined;
  /** Where the drawer is rendered on mobile. Default: `document.body`. */
  container?: BaseDialog.Portal.Props["container"];
  /**
   * What a closed desktop sidebar does with its room. `"keep"`: its box stays and the page beside it
   * does not move. `"release"`: the page takes the inline size back while the sidebar slides out, and
   * gives it up again on open. The mobile drawer is not affected. @default "keep"
   */
  space?: "keep" | "release" | undefined;
}

/**
 * The sidebar. On desktop a `nav` labelled "Sidebar" (set `aria-label` to rename it): closed, it
 * slides out, fades, turns `inert`, and leaves its box for the page to reclaim (see the Provider's
 * data attributes). On mobile it is a modal drawer (Base UI Dialog) from the inline start, with
 * a focus trap, Esc, a scrim, and a quiet scroll lock. Its width is its CSS `inline-size`
 * (default 248px), set it with a class or `style`.
 */
export function SidebarRoot({
  className,
  container,
  space = "keep",
  render,
  children,
  "aria-label": label = "Sidebar",
  ref,
  ...props
}: SidebarRootProps): ReactElement {
  const sidebar = useSidebar() as InternalContext;
  if (sidebar.mobile) {
    return (
      <MobileDrawer
        open={sidebar.mobileOpen}
        onOpenChange={sidebar.setMobileOpen}
        id={sidebar.rootId}
        className={className}
        container={container}
        render={render}
        label={label}
        forwardedRef={ref}
        rest={props}
      >
        {children}
      </MobileDrawer>
    );
  }
  return (
    <DesktopRoot
      open={sidebar.open}
      release={space === "release"}
      id={sidebar.rootId}
      className={className}
      render={render}
      label={label}
      forwardedRef={ref}
      rest={props}
    >
      {children}
    </DesktopRoot>
  );
}

/**
 * Measures the box for `release`: a percentage margin would be of the parent, not of the sidebar,
 * and CSS cannot read its own width. The observer only fires when the width changes, never at rest.
 */
function useRoomVar(release: boolean): (node: HTMLElement | null) => void {
  const [node, setNode] = useState<HTMLElement | null>(null);
  useBeforePaint(() => {
    if (!node || !release) return;
    const measure = () => node.style.setProperty("--_w", `${node.offsetWidth}px`);
    // Measured before the first paint, and only then may the margin transition, so it never runs on load.
    measure();
    void node.offsetWidth;
    node.setAttribute("data-ready", "");
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      node.removeAttribute("data-ready");
      node.style.removeProperty("--_w");
    };
  }, [node, release]);
  return setNode;
}

function DesktopRoot({
  open,
  release,
  id,
  className,
  render,
  label,
  forwardedRef,
  rest,
  children,
}: {
  open: boolean;
  release: boolean;
  id: string;
  className: string | undefined;
  render: SidebarRootProps["render"];
  label: string;
  forwardedRef: Ref<HTMLElement> | undefined;
  rest: Record<string, unknown>;
  children: ReactNode;
}): ReactElement {
  const ref = useMergedRefs(useRoomVar(release), forwardedRef);
  return useRender({
    defaultTagName: "nav",
    render,
    ref,
    props: {
      "data-slot": "sidebar",
      id,
      "aria-label": label,
      ...rest,
      ...(open ? undefined : { inert: true }),
      className: cn(sidebarSlots.root, className),
      "data-state": open ? "open" : "closed",
      "data-space": release ? "release" : undefined,
      children,
    },
  });
}

function MobileDrawer({
  open,
  onOpenChange,
  id,
  className,
  container,
  render,
  label,
  forwardedRef,
  rest,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  className: string | undefined;
  container: SidebarRootProps["container"];
  render: SidebarRootProps["render"];
  label: string;
  forwardedRef: Ref<HTMLElement> | undefined;
  rest: Record<string, unknown>;
  children: ReactNode;
}): ReactElement {
  const direction = useDirection();
  const [self, setSelf] = useState<HTMLElement | null>(null);
  const popup = useRef<HTMLElement | null>(null);
  useEffect(trackPointerType, []);
  useScrollLock(self, open);
  const merged = useMergedRefs(popup, useMergedRefs(setSelf, forwardedRef));
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <BaseDialog.Portal container={container}>
        <BaseDialog.Backdrop
          data-slot="sidebar-backdrop"
          className={sidebarSlots.backdrop}
          forceRender
        />
        <BaseDialog.Popup
          data-slot="sidebar"
          {...(rest as object)}
          id={id}
          ref={merged as never}
          dir={direction}
          // The drawer itself, so no row shows a focus ring at once; Tab goes to the first.
          initialFocus={() => popup.current}
          aria-label={label}
          className={cn(sidebarSlots.root, className)}
          data-mobile=""
          render={render as never}
        >
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export interface SidebarHeaderProps extends Omit<useRender.ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/** Fixed above the scrolling `Content`: a logo, a search field, a trigger. */
export function SidebarHeader({
  className,
  render,
  ref,
  ...props
}: SidebarHeaderProps): ReactElement {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: {
      "data-slot": "sidebar-header",
      ...props,
      className: cn(sidebarSlots.header, className),
    },
  });
}

export interface SidebarFooterProps extends Omit<useRender.ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/** Fixed below the scrolling `Content`. */
export function SidebarFooter({
  className,
  render,
  ref,
  ...props
}: SidebarFooterProps): ReactElement {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: {
      "data-slot": "sidebar-footer",
      ...props,
      className: cn(sidebarSlots.footer, className),
    },
  });
}

const ScrollerContext = createContext<RefObject<HTMLElement | null> | null>(null);
const GroupContext = createContext<string | undefined>(undefined);

export interface SidebarContentProps extends Omit<useRender.ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/**
 * The scrolling middle, which also holds the hover highlight (Glide) that slides between items and
 * stays off the active one. The active item scrolls into view in it, and the page never scrolls.
 */
export function SidebarContent({
  className,
  render,
  children,
  ref,
  ...props
}: SidebarContentProps): ReactElement {
  const glide = useGlide<HTMLDivElement>({
    items: LINK,
    skip: "[data-active], [data-disabled]",
    // Disabled rows keep their box, so the highlight fades over them, not onto a neighbor.
    isDisabled: () => false,
  });
  const scroller = useRef<HTMLDivElement | null>(null);
  const merged = useMergedRefs(scroller, useMergedRefs(glide.ref, ref));
  // Edge fades: data-overflow-start/-end say which side has more to scroll. Passive, idle-free.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      el.toggleAttribute("data-overflow-start", el.scrollTop > 1);
      el.toggleAttribute("data-overflow-end", max - el.scrollTop > 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);
  return (
    <ScrollerContext.Provider value={scroller}>
      {useRender({
        defaultTagName: "div",
        render,
        ref: merged,
        props: {
          "data-slot": "sidebar-content",
          ...props,
          className: cn(sidebarSlots.content, className),
          children: (
            <>
              <GlideHighlight glide={glide} />
              {children}
            </>
          ),
        },
      })}
    </ScrollerContext.Provider>
  );
}

export interface SidebarIndicatorProps extends Omit<useRender.ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

/**
 * The marker of the current page: a tinted background behind the active `Item`, with a small dot
 * in the gutter at its start end. Render it once inside `Content`; it scrolls with the list. To a
 * new item the background shrinks into a drop, the drop drips there, lands with a small splat and
 * spreads out to fill the new background, in the same time near or far. A click on an item moves
 * it there at once, before the page catches up, and it returns if `active` does not change within
 * 3 seconds. Hidden while no item is active. It draws an SVG inside its `span`.
 */
export function SidebarIndicator({
  className,
  render,
  ref,
  ...props
}: SidebarIndicatorProps): ReactElement {
  const scroller = useContext(ScrollerContext);
  const own = useRef<HTMLElement | null>(null);
  const merged = useMergedRefs(own, ref);
  useEffect(() => {
    const root = scroller?.current;
    const pill = own.current;
    if (!root || !pill) return;
    return createIndicator(root, pill).destroy;
  }, [scroller]);
  return useRender({
    defaultTagName: "span",
    render,
    ref: merged,
    props: {
      "data-slot": "sidebar-indicator",
      "aria-hidden": true,
      ...props,
      className: cn(sidebarSlots.indicator, className),
    },
  });
}

export interface SidebarGroupProps extends Omit<useRender.ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/** A labelled set of items; its `GroupLabel` names it. */
export function SidebarGroup({
  className,
  render,
  ref,
  ...props
}: SidebarGroupProps): ReactElement {
  const labelId = useId();
  return (
    <GroupContext.Provider value={labelId}>
      {useRender({
        defaultTagName: "div",
        render,
        ref,
        props: {
          "data-slot": "sidebar-group",
          role: "group",
          "aria-labelledby": labelId,
          ...props,
          className: cn(sidebarSlots.group, className),
        },
      })}
    </GroupContext.Provider>
  );
}

export interface SidebarGroupLabelProps extends Omit<useRender.ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/** The small uppercase heading of a group; `render` can make it a real heading. */
export function SidebarGroupLabel({
  className,
  render,
  ref,
  ...props
}: SidebarGroupLabelProps): ReactElement {
  const id = useContext(GroupContext);
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: {
      "data-slot": "sidebar-group-label",
      id,
      ...props,
      className: cn(sidebarSlots.groupLabel, className),
    },
  });
}

export interface SidebarListProps extends Omit<useRender.ComponentProps<"ul">, "className"> {
  className?: string | undefined;
}

/** The items of a group (`ul`). */
export function SidebarList({ className, render, ref, ...props }: SidebarListProps): ReactElement {
  return useRender({
    defaultTagName: "ul",
    render,
    ref,
    props: {
      // Safari drops the list role from a list without bullets.
      role: "list",
      ...props,
      // Found by this, so it stays.
      "data-slot": "sidebar-list",
      className: cn(sidebarSlots.list, className),
    },
  });
}

/** Scrolls `el` into view inside `scroller` only, by the least distance. */
function reveal(scroller: HTMLElement, el: HTMLElement, smooth: boolean): void {
  const pad = 8;
  const box = scroller.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  let delta = 0;
  if (rect.top < box.top + pad) delta = rect.top - box.top - pad;
  else if (rect.bottom > box.bottom - pad) delta = rect.bottom - box.bottom + pad;
  if (!delta) return;
  const still = prefersReducedMotion();
  scroller.scrollTo({
    top: scroller.scrollTop + delta,
    behavior: smooth && !still ? "smooth" : "auto",
  });
}

const label = (children: ReactNode) =>
  Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span data-slot="sidebar-label" className={sidebarSlots.label}>
        {child}
      </span>
    ) : (
      child
    ),
  );

export interface SidebarItemProps extends Omit<useRender.ComponentProps<"a">, "className"> {
  className?: string | undefined;
  /** Marks the current page; the same as `aria-current="page"`. */
  active?: boolean | undefined;
  /** Not available yet: muted, no highlight, no navigation, out of the tab order. */
  disabled?: boolean | undefined;
}

/**
 * One entry: an `li` holding an `<a>` (`render` swaps it for a router's link; every other prop,
 * `className` and `ref` included, goes to that link). Text children are truncated with an
 * ellipsis. The current one has `aria-current="page"` and `data-active`.
 */
export function SidebarItem({
  className,
  render,
  active,
  disabled,
  children,
  onClick,
  href,
  ref,
  ...props
}: SidebarItemProps): ReactElement {
  const sidebar = useContext(SidebarContext);
  const scroller = useContext(ScrollerContext);
  const current = props["aria-current"];
  const isActive = active ?? (current !== undefined && current !== false && current !== "false");
  const link = useRef<HTMLAnchorElement | null>(null);
  const merged = useMergedRefs(link, ref);
  const first = useRef(true);

  useEffect(() => {
    const body = scroller?.current;
    if (isActive && body && link.current) reveal(body, link.current, !first.current);
    first.current = false;
  }, [isActive, scroller]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
    if (sidebar?.mobile && !event.defaultPrevented) sidebar.setMobileOpen(false);
  };
  const state = {
    "data-active": isActive ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
  };
  return (
    <li data-slot="sidebar-item" className={sidebarSlots.item} {...state}>
      {useRender({
        defaultTagName: "a",
        render,
        ref: merged,
        props: {
          ...props,
          href: disabled ? undefined : href,
          className: cn(sidebarSlots.link, className),
          "aria-current": isActive ? "page" : current,
          "aria-disabled": disabled ? true : undefined,
          tabIndex: disabled ? -1 : props.tabIndex,
          onClick: handleClick,
          ...state,
          // Found by this, so it stays.
          "data-slot": "sidebar-link",
          children: label(children),
        },
      })}
    </li>
  );
}

export interface SidebarItemIconProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

/** An optional leading icon, sized 1rem; decorative unless you set `aria-label`. */
export function SidebarItemIcon({ className, ...props }: SidebarItemIconProps): ReactElement {
  return (
    <span
      data-slot="sidebar-item-icon"
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
      className={cn(sidebarSlots.icon, className)}
    />
  );
}

export interface SidebarItemBadgeProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

/** A small tag at the end of an item, such as "New". */
export function SidebarItemBadge({ className, ...props }: SidebarItemBadgeProps): ReactElement {
  return (
    <span data-slot="sidebar-item-badge" {...props} className={cn(sidebarSlots.badge, className)} />
  );
}

export interface SidebarTriggerProps extends Omit<useRender.ComponentProps<"button">, "className"> {
  className?: string | undefined;
}

/**
 * A button that toggles the sidebar of the current mode (the drawer on mobile). It can sit
 * anywhere under the Provider. Named "Toggle sidebar" unless you pass `aria-label` or children.
 */
export function SidebarTrigger({
  className,
  render,
  children,
  onClick,
  ref,
  ...props
}: SidebarTriggerProps): ReactElement {
  const sidebar = useSidebar() as InternalContext;
  const shown = sidebar.mobile ? sidebar.mobileOpen : sidebar.open;
  return useRender({
    defaultTagName: "button",
    render,
    ref,
    props: {
      "data-slot": "sidebar-trigger",
      type: "button",
      "aria-label": children ? undefined : "Toggle sidebar",
      "aria-expanded": shown,
      "aria-controls": !sidebar.mobile || sidebar.mobileOpen ? sidebar.rootId : undefined,
      ...props,
      className: cn(sidebarSlots.trigger, className),
      "data-state": shown ? "open" : "closed",
      "data-mobile": sidebar.mobile ? "" : undefined,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) sidebar.toggle();
      },
      children: children ?? <PanelLeftIcon />,
    },
  });
}

function PanelLeftIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="3" width="12" height="10" rx="2.5" />
      <path d="M6.25 3v10" />
    </svg>
  );
}
