---
"owsem-ui": minor
---

Add Accordion, from `owsem-ui/base`. Items are separated by one hairline; each trigger is a
full-width row with the label at the start and a muted chevron at the end, and `size` on `Root`
(`sm`, `md`, `lg`) applies to every trigger and the panel's text. `Accordion.Trigger` draws its own `Accordion.Header` (an
`h3`) unless it is already inside one. Panels animate their height (their width, with
`orientation="horizontal"`) and stay at `auto` at rest. Both flavors, CSS and Tailwind.
