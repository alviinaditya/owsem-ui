"use client";

import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import { THEME_STORAGE_KEY, THEMES, type Theme } from "@/lib/theme";

// <html data-theme> is the source of truth: set by themeScript before hydration, then here.
// No attribute means "system".
function getTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : "system";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  // Theme changed in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyTheme(event.newValue === "light" || event.newValue === "dark" ? event.newValue : "system");
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setTheme(theme: Theme): void {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked: the theme still applies until the next page load.
  }
  applyTheme(theme);
  for (const listener of listeners) listener();
}

export function ThemeSwitcher({ labels }: { labels: Dictionary["theme"] }) {
  // The server renders "system"; the stored value is read after hydration without a mismatch.
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system" as const);
  return (
    <label>
      {labels.label}{" "}
      <select value={theme} onChange={(event) => setTheme(event.currentTarget.value as Theme)}>
        {THEMES.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
