---
"owsem-ui": minor
---

Icon Morph, Copy Button, Code Block, Command Menu, and Color Picker take `className` as a string
only, and every part carries `data-slot`. Command Menu's trigger and popup and Color Picker's
trigger get size and variant classes (`ow-command-menu__popup--lg`, `ow-color-picker__trigger--swatch`);
`data-size` and `data-variant` stay.
