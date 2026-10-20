---
"owsem-ui": minor
---

Add Toolbar to `owsem-ui/base`: `Toolbar.Root`, `Group`, `Button`, `Link`, `Input`, and
`Separator`. The toolbar is one Tab stop, and arrow keys move between its items (Base UI). It sits
on the panel material; buttons and links are quiet ghost buttons with Button's sizes and spacing,
`startIcon` and `endIcon`, and a square without a label; the input is a sunken field as tall as
the buttons; separators are etched grooves. `size` on the root sets every item's size. Pass a
Toggle to a button's `render` for an on/off item: item styles have no specificity, so the Toggle
keeps its own look. Restyle it with `--ow-toolbar-bg`, `--ow-toolbar-shadow`, the
`--ow-toolbar-button-*` tokens, `--ow-toolbar-input-bg`, `--ow-toolbar-input-shadow`,
`--ow-toolbar-input-edge`, `--ow-toolbar-line-dark`, and `--ow-toolbar-line-light`.
