---
"owsem-ui": minor
---

Add Popover to `owsem-ui/base`: Base UI's `Popover.Root`, `Trigger`, `Portal`, `Positioner`,
`Popup`, `Arrow`, `Title`, `Description`, `Close`, `Backdrop`, `Viewport`, and `createHandle`.
The popup is a dialog on the panel material with the popup shadow; the optional arrow shares its
surface and 1px edge, sits on its edge, and keeps clear of the rounded corners. The title names
the dialog and the description, muted, describes it. The positioner sits 10px from the trigger and
carries the text direction into the portal. The panel grows from its trigger in 180 ms and leaves
in 120 ms; opened from the keyboard it appears at once, and under reduced motion it only fades.
Restyle it with `--ow-popover-bg`, `--ow-popover-shadow`, `--ow-popover-edge` (the arrow's edge),
`--ow-popover-fg`, and `--ow-popover-muted`.
