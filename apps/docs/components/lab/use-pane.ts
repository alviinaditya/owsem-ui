"use client";

import { useCallback, useSyncExternalStore } from "react";
import { PANE_STORAGE_KEY } from "@/lib/theme";

// <html data-lab-pane="hidden"> is the source of truth: set by themeScript before paint, then here.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const isHidden = () => document.documentElement.dataset.labPane === "hidden";

/** The narrow-screen preview pane: [hidden, toggle]. The server renders it shown. */
export function usePane(): [boolean, () => void] {
  const hidden = useSyncExternalStore(subscribe, isHidden, () => false);
  const toggle = useCallback(() => {
    const next = !isHidden();
    if (next) document.documentElement.dataset.labPane = "hidden";
    else delete document.documentElement.dataset.labPane;
    try {
      localStorage.setItem(PANE_STORAGE_KEY, next ? "hidden" : "shown");
    } catch {
      // Storage blocked: the choice still applies until the next page load.
    }
    for (const listener of listeners) listener();
  }, []);
  return [hidden, toggle];
}
