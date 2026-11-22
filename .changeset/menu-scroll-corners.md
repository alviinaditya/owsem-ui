---
"owsem-ui": patch
---

Fix Menu losing its rounded corners when it scrolls: the popup now only clips, and its items scroll
in an inner `ow-menu__viewport`, so a classic scrollbar is cut to the popup's corners.
