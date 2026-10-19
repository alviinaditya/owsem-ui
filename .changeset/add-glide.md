---
"owsem-ui": minor
---

Add Glide to Core: `useGlide` and `GlideHighlight` (or `createGlide` without React) draw one hover
highlight that glides to the item nearest the pointer. It skips disabled items, forwards clicks in
gaps to the lit item, never moves focus, moves by `transform` only, and only fades under reduced
motion. Restyle it with `--ow-glide-bg`, `--ow-glide-pressed-bg`, `--ow-glide-radius`, and
`--ow-glide-duration`.
