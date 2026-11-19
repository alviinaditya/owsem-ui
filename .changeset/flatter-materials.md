---
"owsem-ui": minor
---

Edge-free materials: every surface has one fill and no edge. Controls and panels rest on one soft
shadow (`--ow-surface-shadow`); popups (menus, selects, popovers, dialogs) cast the larger
`--ow-popup-shadow`.

Separators, and the lines in Menu, Select, Toolbar, Command Menu, and Color Picker, are
one hairline in `--ow-line` instead of an etched groove. Code Block is one surface, the panel fill
with no edge, with the header and the code on it; its Copy is an icon, always in view, named by Copy
Button's Tooltip (`showLabel` adds the word).

One radius: every outer surface (controls, popups, tracks, panels, the toolbar, Code Block) takes
`--ow-radius`, now 16px by default, instead of its items' radius plus its padding. A part nested
inside a padded one takes `--ow-radius` less that padding: Menu and Select items, Toolbar buttons,
and Code Block tabs 4px less, Toggle Group and Tabs items and their thumbs 4px less, a Switch's key
3px less, and Command Menu items 6px less. Checkbox and Kbd keep half of it.

Removed tokens: `--ow-well-shadow`, `--ow-line-dark`, and `--ow-line-light`, with the Tailwind
`shadow-ow-well` utility and the `ow-line-dark` and `ow-line-light` colors. Use `--ow-line` for
lines.
