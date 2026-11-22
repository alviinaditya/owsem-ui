export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "owsem-theme";
export const PACKAGE_MANAGER_STORAGE_KEY = "owsem-package-manager";
export const TOKEN_SETUP_STORAGE_KEY = "owsem-token-setup";
export const INDEX_VIEW_STORAGE_KEY = "owsem-index-view";
export const SIDEBAR_STORAGE_KEY = "owsem-sidebar";
export const DOCS_PANEL_STORAGE_KEY = "owsem-docs-panel";

// Runs in <head> before first paint, so a stored theme never flashes. "system" means no
// data-theme attribute: owsem-ui tokens then follow prefers-color-scheme (TK-5). The index's
// list view, a hidden sidebar, and an open Docs panel are stored the same way
// (<html data-index-view="list">, data-sidebar-hidden, data-docs-open); the other states are no
// attribute.
export const themeScript = `try{var s=localStorage,r=document.documentElement,t=s.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")r.dataset.theme=t;if(s.getItem(${JSON.stringify(INDEX_VIEW_STORAGE_KEY)})==="list")r.dataset.indexView="list";if(s.getItem(${JSON.stringify(SIDEBAR_STORAGE_KEY)})==="hidden")r.dataset.sidebarHidden="";if(s.getItem(${JSON.stringify(DOCS_PANEL_STORAGE_KEY)})==="open")r.dataset.docsOpen=""}catch(e){}`;

/**
 * The same as themeScript, from React: switching language swaps the root layout, and React clears
 * the attributes it does not own from <html>, so they are put back before the next paint.
 */
export function restoreRootState(): void {
  try {
    const root = document.documentElement;
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    if (theme === "light" || theme === "dark") root.dataset.theme = theme;
    if (localStorage.getItem(INDEX_VIEW_STORAGE_KEY) === "list") root.dataset.indexView = "list";
    if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "hidden") root.dataset.sidebarHidden = "";
    if (localStorage.getItem(DOCS_PANEL_STORAGE_KEY) === "open") root.dataset.docsOpen = "";
  } catch {
    // Storage blocked: the defaults apply.
  }
}

/** The site's color scheme at this moment: <html data-theme>, else the system preference. */
export function siteScheme(): "light" | "dark" {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light" || theme === "dark") return theme;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
