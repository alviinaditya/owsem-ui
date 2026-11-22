---
"owsem-ui": minor
---

`buttonVariants()` replaces `buttonStyles()` and `ButtonIcon`: style a link with
`className={buttonVariants({ variant: "outline" })}`. Button's variant, size, and soft are now
`ow-button--*` classes, `className` is a string only, and the parts carry `data-slot`.
