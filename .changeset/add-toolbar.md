---
"owsem-ui": minor
---

Add Toolbar to `owsem-ui/base`: `Toolbar.Root`, `Group`, `Button`, `Link`, `Input`, and
`Separator`. The toolbar is one Tab stop, and arrow keys move between its items (Base UI). It sits
on the panel material. Buttons and links are quiet ghost buttons with Button's sizes and spacing,
`startIcon` and `endIcon`, and a square without a label, in the pressed material only while held.
The input is a flat well with a 3:1 edge, as tall as the buttons; separators are etched grooves.
`size` on the root sets every item's size. Pass a Toggle to a button's `render` for an on/off item:
item styles have no specificity, so the Toggle keeps its own look, the raised key while on. It
reads the theme tokens.
