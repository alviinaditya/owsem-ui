---
"owsem-ui": minor
---

Add Select to `owsem-ui/base`: Base UI's `Select.Root`, `Label`, `Trigger`, `Value`, `Icon`, `Portal`,
`Backdrop`, `Positioner`, `Popup`, `Arrow`, `List`, `Item`, `ItemText`, `ItemIndicator`, `Group`,
`GroupLabel`, `Separator`, `ScrollUpArrow`, and `ScrollDownArrow`. The shortest usage is a Root, a
Trigger with a name, a Popup, and its Items: the parts you leave out draw themselves, and a part you
write replaces its default. The trigger is a flat well with a 3:1 edge, as tall as a Button at `sm`,
`md`, and `lg`, with no width of its own, so it fits its value and stretches with plain CSS. The
popup opens with the selected item's text on the trigger's and ends where the trigger ends; on touch,
near the screen's edges, and with `multiple`, it hangs 6px below. Items are flat: Glide lights the
one nearest the pointer and the one the keyboard reaches, and the check keeps its room while
unselected. Long lists scroll, with an arrow at each end. Over the trigger it fades in 180 ms and
out in 120 ms; beside it, it also grows from the trigger; from the keyboard it changes at once, and
under reduced motion it only fades. It reads the theme
tokens; `aria-invalid` or Base UI's `Field` turns the edge `--ow-critical`.
