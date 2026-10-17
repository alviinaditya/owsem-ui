"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

/** Below 900 px the sidebar collapses behind a Menu button (see globals.css). */
export function SidebarShell({ label, children }: { label: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Close after any navigation, including Back.
  const [shownOn, setShownOn] = useState(pathname);
  if (shownOn !== pathname) {
    setShownOn(pathname);
    setOpen(false);
  }
  return (
    <div className="sidebar" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="sidebar-toggle"
        aria-expanded={open}
        aria-controls="sidebar-panel"
        onClick={() => setOpen(!open)}
      >
        {label} <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      <div id="sidebar-panel" className="sidebar-panel">
        {children}
      </div>
    </div>
  );
}
