"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Icon } from "./icons/icon";

// <html data-sidebar="open"> drives the narrow-screen sidebar (globals.css), so the toggle in
// the dock and the sidebar share it without a common React parent.
const listeners = new Set<() => void>();

const isOpen = () => document.documentElement.dataset.sidebar === "open";

export function setSidebarOpen(open: boolean): void {
  if (open === isOpen()) return;
  if (open) document.documentElement.dataset.sidebar = "open";
  else delete document.documentElement.dataset.sidebar;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const TOGGLE_ID = "site-menu-button";

/** Scrolls the sidebar, not the page, so the current page's link (and its scenes) is in view. */
export function revealCurrentLink(): HTMLElement | undefined {
  const sidebar = document.getElementById("site-sidebar-scroll");
  const link = sidebar?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!sidebar || !link) return undefined;
  const own = link.getBoundingClientRect();
  const box = sidebar.getBoundingClientRect();
  // Leave room below for the scene list of a Lab page.
  if (own.top < box.top || own.bottom > box.bottom - 160) {
    sidebar.scrollTop += own.top - box.top - box.height / 3;
  }
  return link;
}

/**
 * Below 1100 px the sidebar is a panel opened from the dock (bottom center; top left on a narrow
 * Lab). The open panel has its own close button, so the dock steps aside meanwhile.
 */
export function SidebarToggle({ label }: { label: string }) {
  const open = useSyncExternalStore(subscribe, isOpen, () => false);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: close after every navigation, Back included
  useEffect(() => setSidebarOpen(false), [pathname]);

  useEffect(() => {
    const panel = document.getElementById("site-sidebar");
    if (!open || !panel) return;
    // Focus moves into the panel, at the current page, so Tab continues there.
    requestAnimationFrame(() => {
      (revealCurrentLink() ?? panel.querySelector<HTMLElement>("a"))?.focus({
        preventScroll: true,
      });
    });
    const inside = (target: EventTarget | null) =>
      target instanceof Node && (panel.contains(target) || button.current?.contains(target));
    const close = (refocus: boolean) => {
      setSidebarOpen(false);
      if (refocus) button.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && inside(document.activeElement)) close(true);
    };
    const onPointer = (event: PointerEvent) => {
      if (!inside(event.target)) close(false);
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget && !inside(event.relatedTarget)) close(false);
    };
    // Any link closes it, a link to the current page included.
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    panel.addEventListener("focusout", onFocusOut);
    panel.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      panel.removeEventListener("focusout", onFocusOut);
      panel.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <button
      ref={button}
      id={TOGGLE_ID}
      type="button"
      className="dock-button"
      aria-expanded={open}
      aria-controls="site-sidebar"
      onClick={() => setSidebarOpen(!open)}
    >
      <Icon name="menu" size={18} />
      <span className="dock-label">{label}</span>
    </button>
  );
}

/** The open panel's own close button, in the sidebar's head; focus goes back to the dock. */
export function SidebarClose({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="sidebar-close"
      aria-label={label}
      title={label}
      onClick={() => {
        setSidebarOpen(false);
        requestAnimationFrame(() => document.getElementById(TOGGLE_ID)?.focus());
      }}
    >
      <Icon name="x" size={18} />
    </button>
  );
}
