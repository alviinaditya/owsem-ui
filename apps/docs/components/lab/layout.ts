// Sizes shared with globals.css; keep both in sync.

/** The stage sits beside the narrative from here; below, it is a pane under the top bar. */
export const SIDE_BY_SIDE = "(min-width: 960px)";

/** Stage width from which the controls are a side panel (`@container stage`), else a sheet. */
export const SIDE_PANEL_MIN = 720;

/** The side panel's width (.lab-controls). */
export const SIDE_PANEL_WIDTH = 280;

/** The open pane's height, as `--pane-open: clamp(280px, 46dvh, 520px)`. */
export const paneOpenHeight = (): number => Math.min(520, Math.max(280, innerHeight * 0.46));

/** The narrow pane's etched bottom line, below the stage (.lab-stage-frame). */
export const PANE_CHROME = 2;
