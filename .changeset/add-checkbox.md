---
"owsem-ui": minor
---

Add Checkbox to `owsem-ui/base`. `<Checkbox.Root />` inside a plain `<label>` is all it takes: it
draws its own Indicator, with a check and a minus that crossfade, and children replace either with
any node. Off, the box is the well with a 3:1 edge; checked or indeterminate, it is the primary
material, and the fill changes at once. The box is the font size plus 2px, in `em`, so `font-size`
scales it (`size` gives Button's fonts: `sm`, `md`, `lg`), and a pseudo-element extends its press
target to 24 px without adding layout. It reads the theme tokens, and one class of yours beats any of
its states.
