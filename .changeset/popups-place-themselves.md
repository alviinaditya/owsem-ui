---
"owsem-ui": minor
---

Every popup now draws its own Portal and Positioner when you leave them out, as Select, Combobox,
and Autocomplete already did: Menu, Context Menu, Popover, Tooltip, Preview Card, and Navigation
Menu. A Dialog, Alert Dialog, or Drawer Popup without a Portal draws one, with the scrim. The
written-out form works as before.

`Menu.Root` and `ContextMenu.Root` take `size`, which reaches the popup and its submenus' popups,
as Select's does. In a Menubar the menus take the bar's `size`, so it is no longer repeated on each
Popup. A Popup's own `size` still overrides it.
