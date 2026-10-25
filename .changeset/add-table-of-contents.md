---
"owsem-ui": minor
---

Add Table of Contents, an Owsem component exported from `owsem-ui/owsem`: an "On this page" list
that marks the section being read. `TableOfContents.Link` points at a section by its hash
(`href="#install"`), and nested `TableOfContents.List`s hold sub-sections. The current section is
the last one whose top has crossed a reading line 30% down the scroll area, which is the sections'
nearest scrolling ancestor or the window; at the very end of the area the last section is current,
and a clicked link stays current until the visitor scrolls. The current link gets
`aria-current="location"` and `data-current`; nothing is current before hydration.

A 1px rail runs along the list, and a marker on it slides to the current link and matches its
height, two-line titles included. It moves by transform only, rests untransformed on the link's
box, jumps under reduced motion, and runs nothing while the page is still. It reads the theme
tokens of Tree Rail Nav's rail and trail: `--ow-line` for the rail and `--ow-accent` for the marker.
