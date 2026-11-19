---
"owsem-ui": minor
---

Add Input, a one-line text field from `owsem-ui/base`: a flat tint of the text color with no edge, a
focus ring, and an invalid tint in `--ow-critical` with one shake. It fills its parent and has Button's sizes (`sm`, `md`,
`lg`). `startIcon` and `endIcon` take any node, sized to the font plus 2px, and add a wrapper only
when given: `ref`, `className`, `style`, and every other prop always reach the `<input>`. `size` is
the type scale, in place of the native attribute. It reads the theme tokens.
