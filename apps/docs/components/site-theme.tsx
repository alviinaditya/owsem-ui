"use client";

import { Toolbar, Tooltip } from "owsem-ui/base";
import type { Dictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { siteScheme, THEME_STORAGE_KEY } from "@/lib/theme";
import { Icon } from "./icons/icon";
import { LanguageMenu } from "./language-link";
import { Tip } from "./tip";

// <html data-theme> is the source of truth: set by themeScript before hydration, then here. No
// attribute means "system", which stays until the first press of a Theme button.
function applyTheme(scheme: "light" | "dark" | null): void {
  const root = document.documentElement;
  if (scheme) root.dataset.theme = scheme;
  else delete root.dataset.theme;
}

/** Another tab chose a theme: follow it. */
export function followOtherTabs(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyTheme(event.newValue === "light" || event.newValue === "dark" ? event.newValue : null);
  };
  addEventListener("storage", onStorage);
  return () => removeEventListener("storage", onStorage);
}

/** Light becomes dark and dark becomes light, for the whole site, and the choice is kept. */
export function toggleSiteTheme(): void {
  const next = siteScheme() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage blocked: the theme still applies until the next page load.
  }
  applyTheme(next);
}

/**
 * The Theme and Language buttons of a page that has no preview toolbar (the index, the prose
 * pages): a small floating group at the top right, with the toolbar's look.
 */
export function SiteTools({
  lang,
  label,
  groupLabel,
}: {
  lang: Lang;
  label: Dictionary["cp"]["theme"];
  groupLabel: string;
}) {
  return (
    <div className="site-tools">
      <Tooltip.Provider>
        <Toolbar.Root className="cp-tools" aria-label={groupLabel}>
          <Tip
            trigger={
              <Toolbar.Button className="cp-tool" aria-label={label} onClick={toggleSiteTheme}>
                <Icon name="contrast" size={16} />
              </Toolbar.Button>
            }
            label={label}
          />
          <LanguageMenu lang={lang} />
        </Toolbar.Root>
      </Tooltip.Provider>
    </div>
  );
}
