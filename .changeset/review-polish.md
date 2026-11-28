---
"owsem-ui": patch
---

Polish from a review of the library:

- Switch: an icon in the thumb is visible in dark mode. Its ink is the accent while on and
  `--ow-edge` while off, both at 3:1 or more on the white key; it was the text color, which turns
  near-white in dark.
- Menu, Context Menu, and Menubar: the check and the radio dot pop in and out like Select's check
  (opacity over 120 ms, scale from 0.6 on the settle spring) instead of appearing at once. The
  default check is Select's drawing, and the dot is a little larger.
- Radio, Checkbox, Select, and Menu marks match: the same pop (scale from 0.6, fade over 120 ms), and
  a check weighs the same everywhere. A Radio glyph is 80% of the circle with stroke 2 (it was 75%,
  and the glyph's own stroke), and Checkbox's check is drawn with the same stroke.
- Autocomplete keeps the list it showed until the popup has finished closing. Picking a suggestion no
  longer shrinks the list to that one item while the popup leaves.
- Drawer: the sheet's fill runs on past the edge it is attached to, so dragging it the wrong way shows
  no gap. The grabber has a larger target with a grab cursor, and the sheet shows grabbing while a
  swipe runs.
- Navigation Menu: the content slide between triggers is easier to read. Both contents travel the
  panel's whole 320 ms over 40% of their width on a symmetric curve, the one leaving fades first and
  the one arriving fades in after 60 ms.
