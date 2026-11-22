---
"owsem-ui": minor
---

A soft look: a white page, generously rounded controls and containers, and a bright blue
accent. Shadow belongs only to wrappers, the containers that hold other content; a single control
has none. In dark, the surfaces are one step lighter than the page and a hairline top highlight
stands in for a wrapper's shadow.

New and changed tokens: `--ow-surface-shadow` (the resting shadow of a wrapper, with the Tailwind
`shadow-ow-surface` utility); `--ow-radius` is 16px; `--ow-accent` is `#2563eb` (light) and `#2f6fe8`
(dark), and `--ow-focus` follows in blue; `--ow-popup-shadow` is larger and softer, and
`--ow-primary-shadow` is only a thin light line inside the top edge, with no drop shadow and no
colored glow. Text on the accent and accent text on its 14% tint are at least 4.5:1 in both themes.

The panels of Toolbar, Code Block, and Color Picker are white wrappers with the surface shadow, and
floating layers keep the popup shadow. Single controls take their shape from a tint of the text
color instead, so they read on the page and on a white card alike: fields (Input, Select, Command
Menu trigger, Toolbar field, Color Picker fields and keys), the secondary Button, Kbd, the track of
Toggle Group and Tabs, and Checkbox, Radio, and Switch when off. The selected item of Toggle Group,
Tabs, and Code Block is a pill of accent tint with accent text, and a Toggle that is on takes the
same tint. Controls are a step taller: 40px by default (32px `sm`, 48px `lg`), and Checkbox, Radio,
and Switch are bigger, with a white Switch thumb. The Checkbox glyph is about 62% of its box, and the
Radio dot about 42% of its circle.

The sliding indicators are gooey. When the Toggle Group thumb, the Tabs indicator, and the Code
Block key travel, they stretch along the way (1.15 to 1.35 times by distance) and ease back to their size, from the
leading edge, with no squash or rebound; the Switch thumb stretches the same way mid-travel, and while held it
widens toward the side it will go and squashes in height. Only `transform` animates, the text stays
sharp, a new move picks up from the current stretch, and the amplitude follows `--ow-motion-scale`.
Under `prefers-reduced-motion: reduce` there is no stretch.
