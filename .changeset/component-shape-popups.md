---
"owsem-ui": minor
---

Dialog, Popover, Tooltip, Menu, and Select take `className` as a string only, and every part
carries `data-slot`. Menu's popup and Select's trigger and popup get size classes
(`ow-menu__popup--sm`, `ow-select__trigger--lg`, and so on); `data-size` stays.
