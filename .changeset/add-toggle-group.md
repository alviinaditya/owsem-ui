---
"owsem-ui": minor
---

Add Toggle Group, a Base component and the segmented control: `ToggleGroup.Root` and
`ToggleGroup.Item`, from Base UI's toggle group and toggle. A sunken track holds the items, and a
raised thumb slides to the pressed one with the travel spring; hold the pressed item and it presses
in, then springs back. The thumb appears in place on the first render and after hydration, so it
never sweeps in, and it moves by `transform` only. With `multiple`, each pressed item is raised on
its own. Items light up with Glide on hover, come in `size` `"sm"`, `"md"`, and `"lg"`, take the
same width with `equal`, and an item with only an icon is square. Restyle it with
`--ow-toggle-group-track`, `--ow-toggle-group-track-shadow`, `--ow-toggle-group-thumb`,
`--ow-toggle-group-thumb-shadow`, `--ow-toggle-group-fg`, and `--ow-toggle-group-muted`.
