---
"owsem-ui": patch
---

`owsem-ui/css/<component>.css` is now self-contained. Toast, Copy Button, Code Block, Command Menu,
Context Menu, Menubar, Table, Tabs, and Field import the CSS of the components they render (Button,
Icon Morph, Toggle Group, Kbd, Menu, Scroll Area, Input), so loading `tokens.css` plus one component
file styles the whole component. `styles.css` still holds each rule once.
