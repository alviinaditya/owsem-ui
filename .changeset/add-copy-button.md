---
"owsem-ui": minor
---

Add Copy Button, an Owsem component exported from `owsem-ui/owsem`: a Button that copies text.
`value` is the text, or a function that returns it, read at the moment of the press. Once the
Clipboard API confirms the copy, the copy icon morphs into a check (Icon Morph) that draws its
stroke in, `onCopy` gets the text, and after `timeout` (1600 ms) it goes back. A refusal, or no
Clipboard API outside a secure context, calls `onError` and shows nothing copied.

It is an icon by default, named by its label through `aria-label`; `showLabel` adds the word beside
the icon, and both words share one cell, so the button never changes width. `labels` translates
Copy and Copied. A visually hidden status region announces the copy, and `data-copied` is set while
the check shows. It takes the Button's props (`variant`, `ghost` by default, `size`, and the rest)
and reads its tokens; the check is just there under reduced motion.
