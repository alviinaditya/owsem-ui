---
"owsem-ui": minor
---

Add Command Menu, an Owsem component exported from `owsem-ui/owsem`: a command palette built from
Base UI's Dialog and Autocomplete. ⌘K or Ctrl K opens and closes it from anywhere (`shortcut`
picks another key, or `false` turns it off), and it appears and goes at once, with no animation.
Typing filters the grouped items, the first match is always highlighted, and Enter runs it; one
highlight glides to the item the arrows or the pointer pick (Glide). Focus returns to where it was.

Its panel is glass: the raised fill over a blur of the page, with the popup
shadow, opaque under `prefers-reduced-transparency`. Items lay out an icon, a label, a
description that gives way first, and shortcuts as small keycaps; the Trigger is a flat
search field (a tint of the text color), and hairlines set off the search row and the footer. Sizes
`sm`, `md`, and `lg`. `CommandMenu.createHandle()` opens it from a button outside Root. It reads
the theme tokens only, such as `--ow-raised-bg` for the glass and `--ow-backdrop` for the scrim; set
the Popup's `inline-size` to change its width.
