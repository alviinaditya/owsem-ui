---
"owsem-ui": minor
---

Add Button and IconButton to the Base family. Six variants (`primary`, `secondary`, `outline`,
`ghost`, `link`, `destructive`), a `soft` tint for the first three, and three sizes from one
number, `--py`: every variant of a size has the same height, and icons sit as far from the edge as
from the top. Faces are flat fills with crisp 1px edges drawn as inset shadows, with no drop
shadow: secondary is the raised key, and primary and destructive have an edge darker than the fill
and a thin light line inside its top. A press scales the button and ripples from the press point,
with nothing running between presses. `loading` shows a spinner without changing the width
and keeps focus. Style a link as a button with `buttonStyles()` and `ButtonIcon`. It reads the
theme tokens: primary is `--ow-accent` with `--ow-on-accent`, and destructive is `--ow-critical`
with `--ow-bg` as its text.
