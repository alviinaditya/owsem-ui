---
"owsem-ui": minor
---

Scroll Area, Tabs, Toggle Group, and Toolbar take `className` as a string only, and every part
carries `data-slot`. Sizes become classes (`ow-tabs__list--sm`, `ow-toggle-group--lg`,
`ow-toolbar__button--sm`, and so on); `data-size` stays. Tab's `ref` is typed as a button.
