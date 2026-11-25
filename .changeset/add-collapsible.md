---
"owsem-ui": minor
---

Add Collapsible, from `owsem-ui/base`. `Collapsible.Trigger` is a quiet button like a ghost Button
(`size` `sm`, `md`, `lg` on `Collapsible.Root`: 32, 40, 48 px; the panel's text and its side
padding follow, by context) with its label at the start and a chevron at the end that
turns through a flat line when the panel opens; `icon` replaces the chevron and `icon={null}` leaves
it out. `Collapsible.Panel` animates its height from Base UI's variable, with its padding in an inner
element and its height left at `auto` at rest. Reduced motion, or a motion scale of 0, opens it at
once. Both flavors, CSS and Tailwind.
