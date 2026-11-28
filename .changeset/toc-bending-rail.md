---
"owsem-ui": minor
---

Table of Contents: the rail now bends with the levels. It is one SVG path drawn from the links'
positions: a vertical run beside each link at its level, and where the level changes, a bend from
one run to the next in the shape of Tree Rail Nav's branches. The marker is the 2px accent stroke
on that path, and it travels along it, through the bends, when the current link changes. The path
is redrawn when the nav or its content changes size, mirrors for right to left, and a list with
no nesting is still a straight line. The marker span is replaced by an `svg` (`data-slot="table-of-contents-rail"`)
holding the rail and the marker paths (`data-slot="table-of-contents-marker"`); the parts and their API are the same.
