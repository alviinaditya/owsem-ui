---
"owsem-ui": minor
---

Add Menu to `owsem-ui/base`: Base UI's `Menu.Root`, `Trigger`, `Portal`, `Positioner`, `Popup`,
`Item`, `LinkItem`, `CheckboxItem` and `CheckboxItemIndicator`, `RadioGroup`, `RadioItem` and
`RadioItemIndicator`, `Group` and `GroupLabel`, `Separator`, `SubmenuRoot` and `SubmenuTrigger`,
`Viewport`, and `createHandle`. The popup sits on the panel material with the popup shadow, its
corners concentric with the items'. Items are flat: Glide lights the one nearest the pointer, and
the one the keyboard reaches. An `svg` first in an item is sized as its icon and a `kbd` last
becomes its shortcut, at the end and muted. Indicators draw a check or a dot and keep their room
while off, so labels stay in line; submenu triggers get a chevron, and separators are etched
grooves. `size` on the popup (`sm`, `md`, `lg`) follows Button's `--py` rule. The menu grows from
its trigger in 180 ms and leaves in 120 ms; opened from the keyboard it appears at once, and under
reduced motion it only fades. It reads the theme tokens; the highlight is `--ow-hover`.
