"use client";

import { ToggleGroup } from "owsem-ui/base";
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
 * Three toggles, one always pressed (a Toggle Group). The server cannot know the stored theme, so
 * it renders none pressed; until hydration the theme in use is raised from <html data-theme> in
 * CSS, and then the thumb appears in place, without sliding from a default.
 */
export function ThemeSwitcher({ labels }: { labels: Dictionary["theme"] }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);
  return (
    <ToggleGroup.Root
      aria-label={labels.label}
      className="docs-choice theme-switcher"
      equal
      value={theme ? [theme] : []}
      onValueChange={([next]) => next && setTheme(next)}
    >
      {THEMES.map((value) => (
        <ToggleGroup.Item
          key={value}
          value={value}
          data-option={value}
          aria-label={labels[value]}
          title={labels[value]}
        >
          <Icon name={ICONS[value]} size={14} />
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
