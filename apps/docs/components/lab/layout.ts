// Sizes shared with globals.css; keep both in sync.

/** The stage sits beside the narrative from here; below, it is a pane at the top of the screen. */
export const SIDE_BY_SIDE = "(min-width: 960px)";

/** Stage width from which the controls are a side panel (`@container stage`), else a sheet. */
export const SIDE_PANEL_MIN = 720;

/** The side panel's width (.lab-controls). */
export const SIDE_PANEL_WIDTH = 280;

/** The open pane's height, as `--pane-open: clamp(280px, 46dvh, 520px)`. */
export const paneOpenHeight = (): number => Math.min(520, Math.max(280, innerHeight * 0.46));

/** The narrow pane's etched bottom line, below the stage (.lab-stage-frame). */
export const PANE_CHROME = 2;

/** Room Inspect keeps beside the demo for its part names (.lab-ichip). */
export const INSPECT_CHIPS = 128;

/** Room for Inspect's part card (.lab-part-card), on the other side, when the stage has it. */
export const INSPECT_CARD = 268;

/** Stage width from which the part card sits beside the demo; below it, under the demo. */
export const INSPECT_CARD_MIN = 680;

/** Space between the demo and the part card under it. */
export const INSPECT_CARD_GAP = 28;
