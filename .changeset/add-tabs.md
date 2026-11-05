---
"owsem-ui": minor
---

Add Tabs, from `owsem-ui/base`: `Tabs.Root`, `List`, `Tab`, and `Panel`, from Base UI's tabs. The
list is a flat well, and a raised key slides under the active tab with the travel spring, the same
look and motion as Toggle Group; the list draws it, and Glide's hover highlight, itself. The key
appears in place on the first render and after hydration, and moves by `transform` only. The list
fits its content and stretches with plain CSS, the key following; when it does not fit, it scrolls
sideways with no scrollbar. Tabs hold any node, come in `size` `"sm"`, `"md"`, and `"lg"` (set on the
list), and work horizontally and vertically. Panels change at once and add no padding. It reads the
theme tokens: the well and raised materials, `--ow-fg`, `--ow-muted`, `--ow-focus`, `--ow-hover`, and
`--ow-radius`.
