---
"owsem-ui": minor
---

Add Meter, from `owsem-ui/base`: Base UI's meter (`role="meter"`) with the parts and look of Progress.
`tone` is `accent` (default), `good`, `warning`, or `critical`, and picks the fill from `--ow-accent`,
`--ow-good`, `--ow-warning`, or `--ow-critical`, each at 3:1 against the track and the page in both
themes. In forced colors the fill is the system's highlight. Both flavors, CSS and Tailwind.

A Meter can also show the parts of a whole: `Meter.Segment`s in the track are pills in their own
colors with the unfilled rest after them, and `Meter.Legend` and `Meter.LegendItem` (with
`Meter.LegendValue`) name them as buttons, outside the meter. `Meter.Group` ties them together:
pressing an item picks its part and fades the others, and hovering shows a part too. Its function
child gets the part shown.
