---
"owsem-ui": minor
---

Menu and Select hold the page's scroll without setting `overflow` on it, so the page's text is no
longer drawn again while a modal popup is open. Outside the open popup, the wheel and the scroll
keys are held back and a dragged scrollbar springs back; inside it, they scroll as before. Opened
by touch, the page still scrolls, as in Base UI. `modal` stays `true` by default: the Portal draws a
clear Backdrop (`.ow-menu__backdrop`, `.ow-select__backdrop`), so an outside press only shuts the
popup. A menu opened by hover, and a submenu, never lock. A Select laid over its trigger holds the
page even when not modal, since the popup cannot follow a scroll there; Base UI's `overflow` lock
for it is put back before the page is drawn. Dialog, Command Menu, and a modal Popover (`modal`
set to `true`) hold the page the same way: they keep Base UI's modal behavior (focus trap, inert
page, outside press), and the `overflow` Base UI sets on the page is put back before it is drawn.
Opened by touch, Base UI's own lock stands.
