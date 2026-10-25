export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "owsem-theme";
export const PACKAGE_MANAGER_STORAGE_KEY = "owsem-package-manager";
export const TOKEN_SETUP_STORAGE_KEY = "owsem-token-setup";

// Runs in <head> before first paint, so a stored theme never flashes. "system" means no
// data-theme attribute: owsem-ui tokens then follow prefers-color-scheme (TK-5).
export const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

/**
 * The same as themeScript, from React: switching language swaps the root layout, and React clears
 * the attributes it does not own from <html>, so they are put back before the next paint.
 */
export function restoreRootState(): void {
  try {
    const root = document.documentElement;
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    if (theme === "light" || theme === "dark") root.dataset.theme = theme;
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
