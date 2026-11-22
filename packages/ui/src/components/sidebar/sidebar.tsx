"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  type ComponentPropsWithoutRef,
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefAttributes,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  version,
} from "react";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { trackPointerType, useScrollLock } from "../../core/scroll-lock";
import { createIndicator } from "./sidebar.indicator";
import "./sidebar.css";

const cls = {
  provider: "ow-sidebar__provider",
  root: "ow-sidebar",
  backdrop: "ow-sidebar__backdrop",
  header: "ow-sidebar__header",
  content: "ow-sidebar__content",
  footer: "ow-sidebar__footer",
  group: "ow-sidebar__group",
  groupLabel: "ow-sidebar__group-label",
  list: "ow-sidebar__list",
  item: "ow-sidebar__item",
  link: "ow-sidebar__link",
  label: "ow-sidebar__label",
  icon: "ow-sidebar__icon",
  badge: "ow-sidebar__badge",
  indicator: "ow-sidebar__indicator",
  trigger: "ow-sidebar__trigger",
} as const;

const join = (base: string, extra: string | undefined) => (extra ? `${base} ${extra}` : base);

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

export interface SidebarProviderProps extends useRender.ComponentProps<"div"> {
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
export const SidebarProvider: ForwardRefExoticComponent<
  Omit<SidebarProviderProps, "ref"> & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, Omit<SidebarProviderProps, "ref">>(function SidebarProvider(
  {
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
    ...props
  },
  ref,
) {
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
          ...props,
          className: join(cls.provider, className),
          "data-sidebar-state": shown ? "open" : "closed",
          "data-sidebar-mobile": mobile ? "" : undefined,
        },
      })}
    </SidebarContext.Provider>
  );
});

const isReact19 = Number.parseInt(version, 10) >= 19;

export type SidebarRootProps = useRender.ComponentProps<"nav">;

/**
 * The sidebar. On desktop a `nav` labelled "Sidebar" (set `aria-label` to rename it): closed, it
 * slides out, fades, turns `inert`, and leaves its box for the page to reclaim (see the Provider's
 * data attributes). On mobile it is a modal drawer (Base UI Dialog) from the inline start, with
 * a focus trap, Esc, a scrim, and a quiet scroll lock. Its width is its CSS `inline-size`
 * (default 248px), set it with a class or `style`.
 */
export const SidebarRoot: ForwardRefExoticComponent<
  Omit<SidebarRootProps, "ref"> & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, Omit<SidebarRootProps, "ref">>(function SidebarRoot(
  { className, render, children, "aria-label": label = "Sidebar", ...props },
  ref,
) {
  const sidebar = useSidebar() as InternalContext;
  if (sidebar.mobile) {
    return (
      <MobileDrawer
        open={sidebar.mobileOpen}
        onOpenChange={sidebar.setMobileOpen}
        id={sidebar.rootId}
        className={className}
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
});

function DesktopRoot({
  open,
  id,
  className,
  render,
  label,
  forwardedRef,
  rest,
  children,
}: {
  open: boolean;
  id: string;
  className: string | undefined;
  render: SidebarRootProps["render"];
  label: string;
  forwardedRef: Ref<HTMLElement>;
  rest: Record<string, unknown>;
  children: ReactNode;
}) {
  const inert = open ? {} : { inert: isReact19 ? true : "" };
  return useRender({
    defaultTagName: "nav",
    render,
    ref: forwardedRef,
    props: {
      id,
      "aria-label": label,
      ...rest,
      ...inert,
      className: join(cls.root, className),
      "data-state": open ? "open" : "closed",
      children,
    },
  });
}

function MobileDrawer({
  open,
  onOpenChange,
  id,
  className,
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
  render: SidebarRootProps["render"];
  label: string;
  forwardedRef: Ref<HTMLElement>;
  rest: Record<string, unknown>;
  children: ReactNode;
}) {
  const direction = useDirection();
  const [self, setSelf] = useState<HTMLElement | null>(null);
  const popup = useRef<HTMLElement | null>(null);
  useEffect(trackPointerType, []);
  useScrollLock(self, open);
  const setRef = useCallback(
    (el: HTMLElement | null) => {
      popup.current = el;
      setSelf(el);
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) (forwardedRef as RefObject<HTMLElement | null>).current = el;
    },
    [forwardedRef],
  );
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={cls.backdrop} forceRender />
        <BaseDialog.Popup
          {...(rest as object)}
          id={id}
          ref={setRef as never}
          dir={direction}
          // The drawer itself, so no row shows a focus ring at once; Tab goes to the first.
          initialFocus={() => popup.current}
          aria-label={label}
          className={join(cls.root, className)}
          data-mobile=""
          render={render as never}
        >
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export type SidebarHeaderProps = useRender.ComponentProps<"div">;

/** Fixed above the scrolling `Content`: a logo, a search field, a trigger. */
export const SidebarHeader: ForwardRefExoticComponent<
  Omit<SidebarHeaderProps, "ref"> & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, Omit<SidebarHeaderProps, "ref">>(function SidebarHeader(
  { className, render, ...props },
  ref,
) {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: { ...props, className: join(cls.header, className) },
  });
});

export type SidebarFooterProps = useRender.ComponentProps<"div">;

/** Fixed below the scrolling `Content`. */
export const SidebarFooter: ForwardRefExoticComponent<
  Omit<SidebarFooterProps, "ref"> & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, Omit<SidebarFooterProps, "ref">>(function SidebarFooter(
  { className, render, ...props },
  ref,
) {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: { ...props, className: join(cls.footer, className) },
  });
});

const ScrollerContext = createContext<RefObject<HTMLElement | null> | null>(null);
const GroupContext = createContext<string | undefined>(undefined);

export type SidebarContentProps = useRender.ComponentProps<"div">;

/**
 * The scrolling middle, which also holds the hover highlight (Glide) that slides between items and
 * stays off the active one. The active item scrolls into view in it, and the page never scrolls.
 */
export const SidebarContent: ForwardRefExoticComponent<
  Omit<SidebarContentProps, "ref"> & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, Omit<SidebarContentProps, "ref">>(function SidebarContent(
  { className, render, children, ...props },
  ref,
) {
  const glide = useGlide<HTMLDivElement>({
    items: `.${cls.link}`,
    skip: "[data-active], [data-disabled]",
    // Disabled rows keep their box, so the highlight fades over them, not onto a neighbor.
    isDisabled: () => false,
  });
  const scroller = useRef<HTMLElement | null>(null);
  const glideRef = glide.ref;
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
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      scroller.current = el;
      glideRef(el);
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [glideRef, ref],
  );
  return (
    <ScrollerContext.Provider value={scroller}>
      {useRender({
        defaultTagName: "div",
        render,
        ref: setRef,
        props: {
          ...props,
          className: join(cls.content, className),
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
});

export type SidebarIndicatorProps = useRender.ComponentProps<"span">;

/**
 * The marker of the current page: a tinted background behind the active `Item`, with a small dot
 * in the gutter at its start end. Render it once inside `Content`; it scrolls with the list. To a
 * new item the background shrinks into a drop, the drop drips there, lands with a small splat and
 * spreads out to fill the new background, in the same time near or far. A click on an item moves
 * it there at once, before the page catches up, and it returns if `active` does not change within
 * 3 seconds. Hidden while no item is active. It draws an SVG inside its `span`.
 */
export const SidebarIndicator: ForwardRefExoticComponent<
  Omit<SidebarIndicatorProps, "ref"> & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, Omit<SidebarIndicatorProps, "ref">>(function SidebarIndicator(
  { className, render, ...props },
  ref,
) {
  const scroller = useContext(ScrollerContext);
  const own = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const root = scroller?.current;
    const pill = own.current;
    if (!root || !pill) return;
    return createIndicator(root, pill).destroy;
  }, [scroller]);
  const setRef = useCallback(
    (el: HTMLSpanElement | null) => {
      own.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  return useRender({
    defaultTagName: "span",
    render,
    ref: setRef,
    props: { "aria-hidden": true, ...props, className: join(cls.indicator, className) },
  });
});

export type SidebarGroupProps = useRender.ComponentProps<"div">;

/** A labelled set of items; its `GroupLabel` names it. */
export const SidebarGroup: ForwardRefExoticComponent<
  Omit<SidebarGroupProps, "ref"> & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, Omit<SidebarGroupProps, "ref">>(function SidebarGroup(
  { className, render, ...props },
  ref,
) {
  const labelId = useId();
  return (
    <GroupContext.Provider value={labelId}>
      {useRender({
        defaultTagName: "div",
        render,
        ref,
        props: {
          role: "group",
          "aria-labelledby": labelId,
          ...props,
          className: join(cls.group, className),
        },
      })}
    </GroupContext.Provider>
  );
});

export type SidebarGroupLabelProps = useRender.ComponentProps<"div">;

/** The small uppercase heading of a group; `render` can make it a real heading. */
export const SidebarGroupLabel: ForwardRefExoticComponent<
  Omit<SidebarGroupLabelProps, "ref"> & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, Omit<SidebarGroupLabelProps, "ref">>(function SidebarGroupLabel(
  { className, render, ...props },
  ref,
) {
  const id = useContext(GroupContext);
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: { id, ...props, className: join(cls.groupLabel, className) },
  });
});

export type SidebarListProps = useRender.ComponentProps<"ul">;

/** The items of a group (`ul`). */
export const SidebarList: ForwardRefExoticComponent<
  Omit<SidebarListProps, "ref"> & RefAttributes<HTMLUListElement>
> = forwardRef<HTMLUListElement, Omit<SidebarListProps, "ref">>(function SidebarList(
  { className, render, ...props },
  ref,
) {
  return useRender({
    defaultTagName: "ul",
    render,
    ref,
    // Safari drops the list role from a list without bullets.
    props: { role: "list", ...props, className: join(cls.list, className) },
  });
});

/** Scrolls `el` into view inside `scroller` only, by the least distance. */
function reveal(scroller: HTMLElement, el: HTMLElement, smooth: boolean): void {
  const pad = 8;
  const box = scroller.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  let delta = 0;
  if (rect.top < box.top + pad) delta = rect.top - box.top - pad;
  else if (rect.bottom > box.bottom - pad) delta = rect.bottom - box.bottom + pad;
  if (!delta) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scroller.scrollTo({
    top: scroller.scrollTop + delta,
    behavior: smooth && !still ? "smooth" : "auto",
  });
}

const label = (children: ReactNode) =>
  Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className={cls.label}>{child}</span>
    ) : (
      child
    ),
  );

export interface SidebarItemProps extends useRender.ComponentProps<"a"> {
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
export const SidebarItem: ForwardRefExoticComponent<
  Omit<SidebarItemProps, "ref"> & RefAttributes<HTMLAnchorElement>
> = forwardRef<HTMLAnchorElement, Omit<SidebarItemProps, "ref">>(function SidebarItem(
  { className, render, active, disabled, children, onClick, href, ...props },
  ref,
) {
  const sidebar = useContext(SidebarContext);
  const scroller = useContext(ScrollerContext);
  const current = props["aria-current"];
  const isActive = active ?? (current !== undefined && current !== false && current !== "false");
  const link = useRef<HTMLAnchorElement | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const body = scroller?.current;
    if (isActive && body && link.current) reveal(body, link.current, !first.current);
    first.current = false;
  }, [isActive, scroller]);

  const setRef = useCallback(
    (el: HTMLAnchorElement | null) => {
      link.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
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
    <li className={cls.item} {...state}>
      {useRender({
        defaultTagName: "a",
        render,
        ref: setRef,
        props: {
          ...props,
          href: disabled ? undefined : href,
          className: join(cls.link, className),
          "aria-current": isActive ? "page" : current,
          "aria-disabled": disabled ? true : undefined,
          tabIndex: disabled ? -1 : props.tabIndex,
          onClick: handleClick,
          ...state,
          children: label(children),
        },
      })}
    </li>
  );
});

export type SidebarItemIconProps = ComponentPropsWithoutRef<"span">;

/** An optional leading icon, sized 1rem; decorative unless you set `aria-label`. */
export const SidebarItemIcon: ForwardRefExoticComponent<
  SidebarItemIconProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, SidebarItemIconProps>(function SidebarItemIcon(
  { className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
      className={join(cls.icon, className)}
    />
  );
});

export type SidebarItemBadgeProps = ComponentPropsWithoutRef<"span">;

/** A small tag at the end of an item, such as "New". */
export const SidebarItemBadge: ForwardRefExoticComponent<
  SidebarItemBadgeProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, SidebarItemBadgeProps>(function SidebarItemBadge(
  { className, ...props },
  ref,
) {
  return <span ref={ref} {...props} className={join(cls.badge, className)} />;
});

export type SidebarTriggerProps = useRender.ComponentProps<"button">;

/**
 * A button that toggles the sidebar of the current mode (the drawer on mobile). It can sit
 * anywhere under the Provider. Named "Toggle sidebar" unless you pass `aria-label` or children.
 */
export const SidebarTrigger: ForwardRefExoticComponent<
  Omit<SidebarTriggerProps, "ref"> & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, Omit<SidebarTriggerProps, "ref">>(function SidebarTrigger(
  { className, render, children, onClick, ...props },
  ref,
) {
  const sidebar = useSidebar() as InternalContext;
  const shown = sidebar.mobile ? sidebar.mobileOpen : sidebar.open;
  return useRender({
    defaultTagName: "button",
    render,
    ref,
    props: {
      type: "button",
      "aria-label": children ? undefined : "Toggle sidebar",
      "aria-expanded": shown,
      "aria-controls": !sidebar.mobile || sidebar.mobileOpen ? sidebar.rootId : undefined,
      ...props,
      className: join(cls.trigger, className),
      "data-state": shown ? "open" : "closed",
      "data-mobile": sidebar.mobile ? "" : undefined,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) sidebar.toggle();
      },
      children: children ?? <PanelLeftIcon />,
    },
  });
});

function PanelLeftIcon() {
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
