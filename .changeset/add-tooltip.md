---
"owsem-ui": minor
---

Add Tooltip to `owsem-ui/base`: Base UI's `Tooltip.Provider`, `Root`, `Trigger`, `Portal`,
`Positioner`, `Popup`, `Arrow`, `Viewport`, and `createHandle`. The popup is a short label on a
solid dark surface, 24px tall for one line, with an optional arrow and a `kbd` shortcut after the
label. It grows from its trigger in 125 ms; inside a Provider, the first tooltip waits for the
delay and the next ones open at once, unanimated, as do tooltips opened by keyboard focus. Under
reduced motion it has no animation. The positioner sits 8px from the trigger by default and
carries the text direction into the portal. Restyle it with `--ow-tooltip-bg` and
`--ow-tooltip-fg`.
