---
"owsem-ui": minor
---

Add Preview Card to `owsem-ui/base`: Base UI's `PreviewCard.Root`, `Trigger`, `Portal`,
`Positioner`, `Popup`, `Arrow`, `Backdrop`, `Viewport`, and `createHandle`. The trigger is a link in
the color of the text around it with a quiet underline; hover or focus opens the card after 600 ms,
touch does not. The card is Popover's cousin: the raised fill with the popup shadow, at most 20rem
wide, an optional arrow, 10px from the link. It grows from the link in 180 ms and leaves in 120 ms,
and under reduced motion it only fades. Both flavors, CSS and Tailwind.
