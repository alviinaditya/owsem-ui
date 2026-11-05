---
"owsem-ui": minor
---

Add Radio Group to `owsem-ui/base`: `RadioGroup`, `Radio.Root`, and `Radio.Indicator`, from Base UI's
radio group and radio. `<Radio.Root value="a" />` draws its indicator with no children, and children
replace it. Options are `<label>` rows with Button's heights in `size` `"sm"`, `"md"`, and `"lg"`, lit
on hover by Glide. Off, a radio is the well with a 1px edge at 3:1; on, it takes the accent with the
primary edges, and a dot scales in on the settle spring. A press goes in to 0.97, the press target
is 24px, and everything sizes from `em`. The group sets no width or margin, so one rule on
`className` lays its rows out in a row or a grid. It reads the theme tokens: `--ow-well-bg`,
`--ow-edge`, `--ow-accent`, `--ow-primary-shadow`, `--ow-on-accent`, `--ow-pressed-bg`, `--ow-fg`,
`--ow-muted`, `--ow-focus`, `--ow-hover`, and `--ow-radius`.
