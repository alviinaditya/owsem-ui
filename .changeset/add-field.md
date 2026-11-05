---
"owsem-ui": minor
---

Add Field to `owsem-ui/base`: `Field.Root`, `Label`, `Control`, `Description`, `Error`, `Validity`,
and `Item`. Base UI ties the label, description, and error to the control through aria, so there are
no ids to write. `Field.Control` is Input, with its sizes and icons, and its `render` puts any other
control in a field. Field draws even gaps and the type, has no outer margins, and reads `--ow-fg`,
`--ow-muted`, and `--ow-critical`.
