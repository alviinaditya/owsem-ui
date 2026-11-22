"use client";

import { Sidebar } from "owsem-ui/owsem";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { SIDEBAR_STORAGE_KEY } from "@/lib/theme";

// The wide screen's choice to fold the sidebar away is kept across visits. It lives on
// <html data-sidebar-hidden>, which lib/theme.ts sets before the first paint, so the column is the
// right width from the start; the Provider follows it once React has hydrated.
const listeners = new Set<() => void>();
const isHidden = () => document.documentElement.dataset.sidebarHidden !== undefined;

function setHidden(hidden: boolean): void {
  if (hidden === isHidden()) return;
  if (hidden) document.documentElement.dataset.sidebarHidden = "";
  else delete document.documentElement.dataset.sidebarHidden;
  try {
    if (hidden) localStorage.setItem(SIDEBAR_STORAGE_KEY, "hidden");
    else localStorage.removeItem(SIDEBAR_STORAGE_KEY);
  } catch {
    // Storage blocked: it holds until the next page load.
  }
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Below 1280 px an open Docs panel (<html data-docs-open>, on a component page) takes a column
// beside the preview, so the sidebar steps aside as a drawer. This is only a layout mode: the
// visitor's folded-or-open choice above is not touched.
/** The column's fold-away (globals.css .site), before it hands over to the drawer. */
const FOLD_MS = 320;
const NARROW_QUERY = "(max-width: 767px)";
const DOCS_QUERY = "(max-width: 1279px)";
let previews = 0;
const stepListeners = new Set<() => void>();
const stepsAside = () =>
  previews > 0 &&
  document.documentElement.dataset.docsOpen !== undefined &&
  matchMedia(DOCS_QUERY).matches;

/** A component page calls this while it is mounted: its Docs panel can make the sidebar a drawer. */
export function registerPreviewPage(): () => void {
  previews++;
  for (const listener of stepListeners) listener();
  return () => {
    previews--;
    for (const listener of stepListeners) listener();
  };
}

const subscribeStep = (listener: () => void) => {
  stepListeners.add(listener);
  const media = matchMedia(DOCS_QUERY);
  media.addEventListener("change", listener);
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-docs-open"],
  });
  return () => {
    stepListeners.delete(listener);
    media.removeEventListener("change", listener);
    observer.disconnect();
  };
};

/**
 * The site's Sidebar state: open on a wide screen unless the visitor folded it, and a drawer on a
 * narrow one. Its `.site` box is the page's layout, which reads the Provider's data attributes.
 */
export function SiteSidebarProvider({ children }: { children: ReactNode }) {
  const hidden = useSyncExternalStore(subscribe, isHidden, () => false);
  // Transitions wait for the first paint, so a folded sidebar does not slide out on load.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const aside = useSyncExternalStore(subscribeStep, stepsAside, () => false);
  // The column folds away first (the library's own slide), then the sidebar becomes a drawer, so
  // opening the Docs reads as one move. Closing them brings the column straight back.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!aside) {
      setSettled(false);
      setDrawerOpen(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), FOLD_MS);
    return () => clearTimeout(timer);
  }, [aside]);
  const drawer = aside && settled;
  return (
    <Sidebar.Provider
      className="site"
      data-mounted={mounted ? "" : undefined}
      open={!hidden && !aside}
      onOpenChange={(open) => {
        if (!aside) setHidden(!open);
      }}
      mobileOpen={drawerOpen}
      onMobileOpenChange={setDrawerOpen}
      mobileQuery={drawer ? DOCS_QUERY : NARROW_QUERY}
    >
      {children}
    </Sidebar.Provider>
  );
}

/** At the end of the sidebar's head: folds it (wide), or shuts the drawer (narrow). */
export function SidebarCollapse({ label }: { label: string }) {
  return <Sidebar.Trigger className="sidebar-collapse" aria-label={label} title={label} />;
}

/**
 * Opens the sidebar from the page's top left. It only shows while the sidebar is folded or a
 * drawer (globals.css), so a preview carries one in its bar and the other pages float one.
 */
export function SidebarOpen({ label, className }: { label: string; className?: string }) {
  return (
    <Sidebar.Trigger
      className={className ? `sidebar-open ${className}` : "sidebar-open"}
      aria-label={label}
      title={label}
    />
  );
}
