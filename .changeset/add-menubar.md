---
"owsem-ui": minor
---

Add Menubar to `owsem-ui/base`: `Menubar.Root`, a quiet panel in Toolbar's 32, 40, or 48px sizes, and
`Menubar.Trigger`, a ghost button that stays tinted while its menu is open. The menus inside are
Menu's: one `Menu.Root` per menu. Arrow keys and hover move between menus, as in Base UI. `Menu.Root`
now leaves `modal` and the backdrop to the bar when it sits in one. Both flavors, CSS and Tailwind.
