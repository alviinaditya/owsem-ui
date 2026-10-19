---
"owsem-ui": minor
---

Add Tree Rail Nav, a sidebar navigation in up to three levels and the first Base + Owsem
component. A rail runs down each level, and a trail runs from the top to the current row
(`current` on `TreeRailNav.Link`), lighting each level's dot on the way. `flavor="owsem"` makes
the trail travel to a new row and pulse on arrival, while the old row's tint folds away.
`TreeRailNav.Origin` labels the trail's starting point, and `TreeRailNav.Label` keeps a row on one
line: text that does not fit fades, and runs left in a loop while the row is hovered.
`TreeRailNav.Icon` sizes any icon to the row's font plus 2px.

Groups are Base UI Collapsibles; a panel clips only while it opens or closes, so focus rings are
never cut. Rows hover with Glide, and arrow keys move between rows and open, close, and climb
groups. Restyle it with `--ow-tree-rail-trail`, `--ow-tree-rail-rail`, `--ow-tree-rail-node`,
`--ow-tree-rail-surface`, and the rail positions `--ow-tree-rail-r0` to `--ow-tree-rail-r2`
(25px apart by default).
