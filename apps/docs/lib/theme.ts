export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "owsem-theme";
export const PANE_STORAGE_KEY = "owsem-lab-pane";
export const PACKAGE_MANAGER_STORAGE_KEY = "owsem-package-manager";
export const TOKEN_SETUP_STORAGE_KEY = "owsem-token-setup";

// Runs in <head> before first paint, so stored choices never flash. "system" means no
// data-theme attribute: owsem-ui tokens then follow prefers-color-scheme (TK-5). The Lab preview
// pane (narrow screens) starts folded when chosen, or on short windows such as a phone on its side.
export const themeScript = `try{var d=document.documentElement,t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")d.dataset.theme=t;var p=localStorage.getItem(${JSON.stringify(PANE_STORAGE_KEY)});if(p==="hidden"||(!p&&innerHeight<560))d.dataset.labPane="hidden"}catch(e){}`;

/**
 * The same as themeScript, from React: switching language swaps the root layout, and React clears
 * the attributes it does not own from <html>, so they are put back before the next paint.
 */
export function restoreRootState(): void {
  try {
    const root = document.documentElement;
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    if (theme === "light" || theme === "dark") root.dataset.theme = theme;
    const pane = localStorage.getItem(PANE_STORAGE_KEY);
    if (pane === "hidden" || (!pane && innerHeight < 560)) root.dataset.labPane = "hidden";
  } catch {
    // Storage blocked: the defaults apply.
  }
}
