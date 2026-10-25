---
"owsem-ui": minor
---

The theme tokens are the full phase 1 set, on neutral grays: focus, control edge, hover, backdrop,
and status colors; the materials for light and dark (panel and popup, raised, well, pressed, the
primary edge, and tooltip), flat fills with crisp 1px edges; the control radius; and motion
easings with the Core springs (`--ow-spring-travel`, `--ow-spring-settle`, `--ow-spring-glide`)
as CSS easings with their durations.

They are the only tokens. Components read them without fallbacks, and setting one on an element
restyles only what is inside it.
