---
"owsem-ui": minor
---

Surfaces are told apart by tone and one soft shadow, not by edges. Lines only separate content, so
a control or container is known by its fill, and a state changes the tone (or shows the 2px focus
ring) instead of an edge. Input, the Select trigger, the Toolbar field, the Command Menu trigger, and
the Color Picker fields and keys are `--ow-raised-bg` with `--ow-surface-shadow`, with a faint
`--ow-hover` tint on hover; the secondary Button, Kbd, and the Toolbar, Code Block, and Color Picker
panels use the same material. Checkbox, Radio, and Switch are 10% tints of `--ow-fg` while off
(13% on hover, 16% held on Checkbox and Radio). A Toggle that is on, the Toggle Group thumb, the Tabs
indicator, and the Code Block tab key are a 14% tint of `--ow-accent` with accent text, and `outline`
is the only bordered variant. Primary Button and Switch (on) keep a top highlight and gain a soft
drop in the accent's tone (`--ow-primary-shadow`). Menu, Select, Popover, Dialog, and Command Menu
popups use `--ow-raised-bg` with `--ow-popup-shadow`. Fieldset draws no line under its legend.

Removed tokens: `--ow-panel-shadow`, `--ow-raised-shadow`, and `--ow-pressed-shadow`, with the
Tailwind `shadow-ow-panel`, `shadow-ow-raised`, and `shadow-ow-pressed` utilities. Changed values:
the light `--ow-bg` is `#f3f4f6`, and `--ow-well-bg` and `--ow-pressed-bg` are one step darker; in
dark, `--ow-bg` is `#111113`, `--ow-panel` `#1b1b1f`, `--ow-raised-bg` `#232328`, `--ow-well-bg`
`#0c0c0e`, and `--ow-tooltip-bg` `#2b2b30`. `--ow-edge` stays, but only for high contrast.

An Input or Select trigger with `data-invalid` or `aria-invalid="true"` takes a 12% `--ow-critical`
tint and shakes once when it turns invalid, never on first render (an opacity blink under reduced
motion). A Form shakes the first invalid field again on a submit that still fails.

Under `@media (prefers-contrast: more)`, fields, Checkbox, Radio, and Switch draw a 1px `--ow-edge`,
and popups an extra 1px ring in it. By default no control has an edge (DP-6), which knowingly does
not meet WCAG 1.4.11 in the default mode.
