---
"owsem-ui": minor
---

Add Fieldset to `owsem-ui/base`: `Fieldset.Root` and `Fieldset.Legend` group fields under one name, and
`disabled` reaches every control inside. It has even gaps, an etched line under the legend, no frame,
and no outer margins. `gap` on the root and the legend's `::after` are plain CSS to override.
