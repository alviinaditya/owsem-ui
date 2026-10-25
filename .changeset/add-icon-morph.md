---
"owsem-ui": minor
---

Add Icon Morph, an Owsem component exported from `owsem-ui/owsem`: it swaps one icon for another in
place. Give it one icon with a `key`, as in
`<IconMorph>{copied ? <Check key="check" /> : <Copy key="copy" />}</IconMorph>`; when the key
changes, the old icon shrinks, blurs, and fades out while the new one grows in, both in one grid
cell, so nothing around them moves. Nothing animates on the first render, and `null` shows no icon.

It is CSS transitions only, with no animation library: a change mid-swap turns both icons around
where they are, at most one icon leaves at a time, and nothing runs once a swap ends. The leaving
icon is `aria-hidden`. In the icon slot of a Button, Toggle, or Toolbar item it fills the slot as
one icon does. It moves on the settle spring (`--ow-spring-settle`, with its duration), shrinks and
blurs as far as `--ow-motion-scale` says, and only crossfades under reduced motion.
