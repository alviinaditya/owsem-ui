---
"owsem-ui": minor
---

Add Color Picker, an Owsem component exported from `owsem-ui/owsem`. `ColorPicker` is the panel: a
saturation and brightness area, hue and opacity sliders (Base UI Slider), an eye dropper where the
browser has the EyeDropper API, hex, RGB, and HSL fields behind a format switch, and swatches (a
Base UI Toggle Group). `ColorPickerPopover` opens it from a trigger, as a field with the color and
its value or as a square swatch, in `sm`, `md`, and `lg`; the popup scales out of its trigger and
keeps the trigger's theme and direction.

Use it controlled (`value`) or not (`defaultValue`); `onChange` follows every move and
`onChangeComplete` arrives when a drag, key, edit, or swatch is done. Values can be any CSS color
the browser reads, tokens such as `var(--ow-accent)` included; `format` sets the string you get
back. Every label is in `labels` for translation. Thumbs compact when pressed and spring back
(Tactile). Every part has a crisp 1px edge, with no soft or sunken shadow; only the popover floats.
Restyle it with `--ow-color-picker-bg`, `--ow-color-picker-checker`, `--ow-color-picker-thumb`,
`--ow-color-picker-width`, and `--ow-color-picker-area-height`. The color utilities are exported
too: `parseColor`, `formatColor`, and conversions between hex, RGB, HSL, and HSV.
