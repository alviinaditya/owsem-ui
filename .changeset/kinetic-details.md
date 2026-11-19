---
"owsem-ui": minor
---

Copy Button, icon only, now sits in OwsemUI's Tooltip: it says the copy label on hover and keyboard
focus, turns to the copied label in place on a press, stays open while the check shows, and says the
copy label again as the icon turns back. While it shows the check it is busy: `aria-disabled="true"`, without the disabled look,
and a press does not copy again. `duration`, a CSS time such as `"300ms"`, sets how long the icon
swap and the check's draw take. Icon Morph takes `duration` too, for one swap, without changing the
settle spring that also times a button's press.

Checkbox's check draws its stroke in as it arrives (260 ms, ease-out), and the minus grows from its
middle; leaving, both only fade, and under reduced motion nothing draws or grows.

Select's `Item` with plain children puts its check at the row's end, in line with the trigger's
chevron, and written parts keep their order. Over the trigger, the popup covers the trigger at its
width and grows only for an item that would not fit; under it, it is at least as wide as the
trigger. Item text stays on one line, with an ellipsis. A pick's check fades and scales in on the
settle spring, and the popup leaves over 140 ms after a 60 ms beat, so the check lands first.

Popover, Menu, and Color Picker place their popup from the trigger's resting box, so it no longer
moves a device pixel after opening while a pressed trigger springs back.
