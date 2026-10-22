---
"owsem-ui": minor
---

Add Toggle Group, a Base component and the segmented control: `ToggleGroup.Root` and
`ToggleGroup.Item`, from Base UI's toggle group and toggle. A flat track holds the items, and a
thumb with crisp edges (the raised key) slides to the pressed one with the travel spring; hold the
pressed item and it scales down, then springs back. The thumb appears in place on the first render
and after hydration, so it never sweeps in, and it moves by `transform` only. With `multiple`, each
pressed item is a key of its own, and a hovered one's fill shifts a little. Items light up with
Glide on hover, come in `size` `"sm"`, `"md"`, and `"lg"`, take the same width with `equal`, and an
item with only an icon is square. It reads the theme tokens: the well and raised materials,
`--ow-fg`, `--ow-muted`, `--ow-focus`, `--ow-hover`, and `--ow-radius`.
