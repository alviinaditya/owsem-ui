---
"owsem-ui": minor
---

Add Slider, from `owsem-ui/base`, with every part of Base UI's: `Root`, `Label`, `Value`, `Control`,
`Track`, `Indicator`, and `Thumb`. `Slider.Root` alone draws a control with one thumb for each value
(an array makes a range) and names the thumbs from `aria-label`. `size` `sm`, `md`, `lg` gives a 4,
6, 8 px track with a 16, 20, 24 px thumb; the thumb is a white key that grows a little under the
pointer and while dragged. It follows the pointer with no easing, upright it is 12rem tall, and a
Field's error turns the fill critical. Both flavors, CSS and Tailwind.
