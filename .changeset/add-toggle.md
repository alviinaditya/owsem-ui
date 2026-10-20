---
"owsem-ui": minor
---

Add Toggle, a two-state button from `owsem-ui/base`. Off, it is flat and tinted under the pointer;
on, it sits in the pressed material. A press goes in to 0.97 within 90 ms and lets go on the settle
spring. It has Button's sizes (`sm`, `md`, `lg`) and spacing, `startIcon` and `endIcon` sized to
the font plus 2px, and becomes a square without children. Restyle it with `--ow-toggle-fg`,
`--ow-toggle-hover-bg`, `--ow-toggle-hover-fg`, `--ow-toggle-pressed-bg`,
`--ow-toggle-pressed-shadow`, and `--ow-toggle-pressed-fg`.
