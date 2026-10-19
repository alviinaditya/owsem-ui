"use client";

import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import { THEME_STORAGE_KEY, THEMES, type Theme } from "@/lib/theme";
import { Icon, type IconName } from "./icons/icon";

const ICONS: Record<Theme, IconName> = { light: "sun", dark: "moon", system: "monitor" };

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

/**
 * Three radios. The raised thumb and the chosen icon's color follow <html data-theme> in CSS, not
 * the radios, so they are right from the first paint, before the stored choice reaches React.
 */
export function ThemeSwitcher({ labels }: { labels: Dictionary["theme"] }) {
  // The server renders "system"; the stored value is read after hydration without a mismatch.
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system" as const);
  return (
    <fieldset className="seg theme-switcher">
      <legend className="visually-hidden">{labels.label}</legend>
      {THEMES.map((value) => (
        <label key={value} className="seg-item" data-option={value} title={labels[value]}>
          <input
            type="radio"
            name="site-theme"
            value={value}
            checked={theme === value}
            onChange={() => setTheme(value)}
          />
          <Icon name={ICONS[value]} size={15} />
          <span className="visually-hidden">{labels[value]}</span>
        </label>
      ))}
    </fieldset>
  );
}
