---
"owsem-ui": minor
---

Icon Morph, Copy Button, Code Block, Command Menu, Color Picker, Sidebar, Table, Table of
Contents, and Tree Rail Nav take `className` as a string only, and every part carries `data-slot`.
Command Menu's trigger and popup and Color Picker's trigger get size and variant classes
(`ow-command-menu__popup--lg`, `ow-color-picker__trigger--swatch`); Table's `size="sm"` adds
`ow-table--sm`. `data-size` and `data-variant` stay. Sidebar, Table of Contents, and Tree Rail Nav
find their parts by `data-slot` instead of by class.
