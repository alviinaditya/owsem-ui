---
"owsem-ui": minor
---

Add Toolbar to `owsem-ui/base`: `Toolbar.Root`, `Group`, `Button`, `Link`, `Input`, and
`Separator`. The toolbar is one Tab stop, and arrow keys move between its items (Base UI). It sits
on the panel fill with the surface shadow, 32, 40, or 48px tall (`sm`, `md`, `lg`). Buttons and
links are quiet ghost buttons 24, 32, or 40px tall inside its padding, with `startIcon` and
`endIcon`, and a square without a label, with a deeper tint only while held.
The input is a flat tint of the text color, as tall as the buttons; separators are hairlines.
`size` on the root sets every item's size. Pass a Toggle to a button's `render` for an on/off item:
item styles have no specificity, so the Toggle keeps its own look, a tint while on. It
reads the theme tokens.
