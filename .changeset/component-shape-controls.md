---
"owsem-ui": minor
---

Separator, Kbd, Toggle, Switch, Checkbox, Radio Group, Input, Field, Fieldset, and Form take
`className` as a string only, and every part carries `data-slot`. The sizes of Toggle, Switch,
Checkbox, Radio Group, and Input are now `ow-<name>--sm|md|lg` classes (`data-size` stays), and
`toggleVariants()` returns Toggle's.
