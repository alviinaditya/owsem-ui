---
"owsem-ui": minor
---

A Field shows its error in place of its description: while a `Field.Error` is shown, the
description is hidden, and it comes back when the error goes. It stays in `aria-describedby`, so
a screen reader still reads what the field asks for, then why it failed. To show both, set
`.ow-field__description { display: block }` in your own CSS.
