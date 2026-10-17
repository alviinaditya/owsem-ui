export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "owsem-theme";

// Runs in <head> before first paint, so a stored theme never flashes. "system" means no
// data-theme attribute: owsem-ui tokens then follow prefers-color-scheme (TK-5).
export const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
