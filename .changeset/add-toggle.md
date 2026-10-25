---
"owsem-ui": minor
---

Add Toggle, a two-state button from `owsem-ui/base`. Off, it is flat with muted text and tinted
under the pointer; on, it is the raised key, a flat fill with crisp edges and text in `--ow-fg`.
While held down it takes the pressed material and goes in to 0.97 within 90 ms, then lets go on
the settle spring. It has Button's sizes (`sm`, `md`, `lg`) and spacing, `startIcon` and `endIcon`
sized to the font plus 2px, and becomes a square without children. It reads the theme tokens.
