---
"owsem-ui": minor
---

Add Switch, from `owsem-ui/base`. `<Switch.Root aria-label="Wi-Fi" />` draws its own thumb, and a
`Switch.Thumb` of your own replaces it, with an icon if you like. Off, the track is the well with a
3:1 edge; on, it is `--ow-accent` with the primary material's edges; the thumb is the raised key in
both. The thumb moves on the travel spring, turns back from where it is, and squashes toward its
travel while held. It rests on layout rather than on a `translate`, so its gaps stay even and its
edges crisp at a fractional zoom. Sizes `sm`, `md`, and `lg` follow Button's fonts. Everything comes
from `em`, so `font-size` scales the whole switch, and a width set with plain CSS carries the
thumb's travel with it.
