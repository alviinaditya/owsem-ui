---
"owsem-ui": minor
---

Add Code Block, an Owsem component exported from `owsem-ui/owsem`: code in nested cards. The outer
card is a flat well with a crisp 1px edge, holding the header; the code sits in an inner card, a
flat fill of the panel material, that reaches over the header's lower edge with the same corners.
The header has one icon, a `CodeBlock.Title` for one snippet or a `CodeBlock.List` of
`CodeBlock.Tab`s for several, and `CodeBlock.Copy` at the end; each snippet goes in a
`CodeBlock.Panel`.

Tabs are Base UI's Tabs (`value`, `defaultValue`, and `onValueChange` on Root; the arrow keys pick
as they move), a raised thumb slides under the active tab as in Toggle Group, and Glide lights the
hovered one. Each Tab's `icon` leads the header while it is active and morphs into the next tab's
(Icon Morph). Copy is a Copy Button that copies the panel on show, or its own `value`. Code Block
does not highlight code: give each panel a `<pre>` highlighted already. Long lines scroll inside the
panel, which the keyboard can then focus, and code reads left to right on any page. It reads the
theme tokens only: `--ow-well-bg` with its edge, `--ow-panel`, the raised material for the thumb,
and `--ow-font-mono` for the code.
