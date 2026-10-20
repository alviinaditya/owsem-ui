// Sizes shared with globals.css; keep both in sync.

/** The stage sits beside the narrative from here; below, it fills the screen under a sheet. */
export const SIDE_BY_SIDE = "(min-width: 960px)";

/** Stage width from which the controls are a side panel (`@container stage`), else a sheet. */
export const SIDE_PANEL_MIN = 720;

/** The side panel's width (.lab-controls). */
export const SIDE_PANEL_WIDTH = 280;

/** The documentation sheet at half height, as a share of the screen (.lab[data-sheet="half"]). */
export const SHEET_HALF = 0.58;

/** At full height the sheet leaves this much of the stage, its toolbar, in view (px). */
export const SHEET_FULL_GAP = 64;

/** Stage width below which Inspect docks under the demo: part names in a row, then the card. */
export const INSPECT_COMPACT = 560;

/** Room Inspect keeps beside the demo for its part names (.lab-ichip). */
export const INSPECT_CHIPS = 128;

/** Room for Inspect's part card (.lab-part-card), on the other side, when the stage has it. */
export const INSPECT_CARD = 268;

/** Stage width from which the part card sits beside the demo; below it, under the demo. */
export const INSPECT_CARD_MIN = 680;

/** Space between the demo and the part card under it. */
export const INSPECT_CARD_GAP = 28;
