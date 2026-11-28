---
"owsem-ui": patch
---

Table: `layout="auto"` decides from the Root's layout width, not its box on screen, so a table
inside a scaled ancestor (a zoom, a fitted preview) no longer stacks when it has room.
