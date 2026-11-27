---
"owsem-ui": minor
---

Add Combobox to `owsem-ui/base`: Base UI's `Combobox.Root`, `Label`, `Value`, `Input`, `InputGroup`,
`Trigger`, `Icon`, `Clear`, `Chips`, `Chip`, `ChipRemove`, `Portal`, `Backdrop`, `Positioner`,
`Popup`, `Arrow`, `List`, `Row`, `Item`, `ItemIndicator`, `Group`, `GroupLabel`, `Collection`,
`Separator`, `Status`, `Empty`, and the `useFilter`, `useFilteredItems`, and `createItems` helpers.
The group is the field, drawn as Input is, with `size="sm|md|lg"` and flat square buttons; multiple
selection shows chips inside it, 24px pills with a 24px remove target. The popup, items, group labels,
and separators are Select's, with Glide following the keyboard's highlight. Trigger, Clear, and
ChipRemove draw their own icons, ItemIndicator a check; Empty and Status show only with text. Both
flavors, CSS and Tailwind.
