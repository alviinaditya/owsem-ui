---
"owsem-ui": minor
---

Add Toast to `owsem-ui/base`: Base UI's `Toast.Provider`, `Portal`, `Viewport`, `Root`, `Content`,
`Title`, `Description`, `Action`, `Close`, `Positioner`, `Arrow`, `useToastManager`, and
`createToastManager`, plus `Toast.Mark`. A `Viewport` with no children draws every toast, with its
title, description, a small Button for `actionProps`, a mark for `success`, `error`, `warning`,
`info`, and `loading`, and a close button. A raised card at the bottom end of the window, newest in
front with older ones peeking behind, opening into a list on hover or focus, and swiped away down or
toward the end. Anchored toasts look like a Popover. Under reduced motion toasts fade in place. Both
flavors, CSS and Tailwind.
