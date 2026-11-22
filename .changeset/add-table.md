---
"owsem-ui": minor
---

Add Table, an Owsem component exported from `owsem-ui/owsem`: a clean card for tabular data. Write
`Table.Root` with an optional `Caption`, a `Header` of `Head` cells, a `Body` of `Row`s with `Cell`s,
and an optional `Footer`. The Root is a `div` with the panel fill, the surface shadow, and the
control radius; the header row is quiet muted text on a faint tint, rows are split by hairlines, and
there are no vertical lines. The `Caption` is a small title above the card (`visuallyHidden` keeps
it as the name only), so stacked tables read as separate ones. `size="sm"` tightens the cells.

Wider than the card, the table scrolls inside it with a hidden scrollbar and a fade on the sides that
have more (`data-overflow-start`, `data-overflow-end`), and the card becomes focusable and named by
the Caption, `aria-label`, or `aria-labelledby`, so a keyboard can scroll it. `layout` is `"auto"`
(default), `"table"`, or `"stack"`: stacked, each row is a block whose first cell is its title and
whose other cells carry their column's `Head` text, and the header row stays for screen readers.
`"auto"` stacks when the Root is narrower than `stackBelow` (default 480 px). Every part takes
`className`, `style`, `ref`, and `render`; `tableProps` reaches the inner `<table>`.
