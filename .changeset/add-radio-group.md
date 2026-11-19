---
"owsem-ui": minor
---

Add Radio Group to `owsem-ui/base`: `RadioGroup`, `Radio.Root`, and `Radio.Indicator`, from Base UI's
radio group and radio. `<Radio.Root value="a" />` draws its indicator with no children, and children
replace it. Options are `<label>` rows with Button's heights in `size` `"sm"`, `"md"`, and `"lg"`, lit
on hover by Glide. Off, a radio is a 10% tint of the text color, with no edge; on, it takes the accent, and a dot scales in on the settle spring. A press goes in to 0.97, the press target
is 24px, and everything sizes from `em`. The group sets no width or margin, so one rule on
`className` lays its rows out in a row or a grid. It reads the theme tokens: `--ow-accent`, `--ow-primary-shadow`, `--ow-on-accent`, `--ow-fg`,
`--ow-muted`, `--ow-focus`, `--ow-hover`, and `--ow-radius`.
