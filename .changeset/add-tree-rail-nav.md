---
"owsem-ui": minor
---

Add Tree Rail Nav, a sidebar navigation in up to three levels and the first Owsem component,
exported from `owsem-ui/owsem`. A rail runs down each level, and a trail runs from the top to the
current row (`current` on `TreeRailNav.Link`), lighting each level's dot on the way. The trail
travels to a new row and pulses on arrival, while the old row's tint folds away.
`TreeRailNav.Origin` labels the trail's starting point, and `TreeRailNav.Label` keeps a row on one
line: text that does not fit fades, and runs left in a loop while the row is hovered.
`TreeRailNav.Icon` sizes any icon to the row's font plus 2px.

Groups are Base UI Collapsibles; a panel clips only while it opens or closes, so focus rings are
never cut. Rows hover with Glide, and arrow keys move between rows and open, close, and climb
groups. It reads the theme tokens: `--ow-accent` for the trail, `--ow-line` for the rails, and
`--ow-bg` behind the dots; set them on the nav to restyle it.
