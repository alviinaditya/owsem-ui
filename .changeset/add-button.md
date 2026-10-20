---
"owsem-ui": minor
---

Add Button and IconButton to the Base family. Six variants (`primary`, `secondary`, `outline`,
`ghost`, `link`, `destructive`), a `soft` tint for the first three, and three sizes from one
number, `--py`: every variant of a size has the same height, and icons sit as far from the edge as
from the top. Raised variants sit in a socket; a press sinks the button and ripples from the press
point, with nothing running between presses. `loading` shows a spinner without changing the width
and keeps focus. Style a link as a button with `buttonStyles()` and `ButtonIcon`. Restyle it with
`--ow-button-*` tokens, such as `--ow-button-primary-bg` and `--ow-button-radius`.
