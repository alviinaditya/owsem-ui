---
"owsem-ui": patch
---

Visual consistency across the library.

- Disabled is one look: `opacity: 0.5` on every control and item (it was 0.45 on fields, menu and
  select items, Toggle, Toolbar, Menubar, and Navigation Menu, and a muted text color on Tabs, Toggle
  Group, Command Menu, Code Block tabs, and Radio and Checkbox Group rows). A disabled row dims once,
  its box or circle with it.
- Read-only fields (Input, OTP Field, Select, Combobox, Autocomplete, Number Field) keep their tint on
  hover; the Select and Combobox triggers show the default cursor.
- Menu's viewport and the Combobox and Autocomplete lists scroll with the thin, quiet scrollbar of
  Command Menu.
- Popup scales (Menu, Popover, Preview Card, Navigation Menu, Toast, Select, Combobox, Dialog, Alert
  Dialog, Drawer, Tooltip) follow `--ow-motion-scale`, as the presses of Toggle, Toolbar, and the Meter
  legend do. Fades use `--ow-ease-out` instead of `ease`.
- Navigation Menu's and Tree Rail Nav's chevrons turn their two strokes on the settle spring, as
  Accordion's does. Tree Rail Nav's chevron and Toast's close icon are the font size plus 2px.
- Menubar triggers are lit by Glide along the bar, and Menubar and Navigation Menu triggers press in
  like Toolbar's buttons.
- Color Picker's popup uses the raised fill and sits 10px from its trigger, as Popover does.
- Combobox's chip remove × is heavier, its chip and Toast's close button use the 2px focus offset, and
  Command Menu's group labels and empty text, and Combobox's empty text, share paddings. Command Menu
  opens and closes as a Dialog does.
- Checkbox, Radio, and Switch show an invalid state (a critical tint, a solid critical fill when on,
  and one shake or a blink under reduced motion).
