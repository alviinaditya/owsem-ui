---
"owsem-ui": minor
---

Add Dialog to `owsem-ui/base`: Base UI's `Dialog.Root`, `Trigger`, `Portal`, `Backdrop`, `Viewport`,
`Popup`, `Title`, `Description`, `Close`, and `createHandle`. A modal window centered on the screen,
on the panel material with the popup shadow. `Dialog.Portal` draws the scrim on its own: write a
`Dialog.Backdrop` to replace it, or set `backdrop={false}` for none. The panel stays 16px inside the
screen, long content scrolls inside it, and a dialog too long to show whole opens at its start. It
fades in and grows from its middle in 250 ms and leaves in 200 ms; the scrim only fades, and under
reduced motion the panel only fades. A nested dialog sets its parent back and dims it. Trigger and
Close wear your button through `render`. Width, padding, a sheet, or a full screen are plain CSS on
`className`, and it reads the theme tokens.
