---
"owsem-ui": minor
---

Add Drawer to `owsem-ui/base`: Base UI's `Drawer.Provider`, `Root`, `Trigger`, `Portal`, `Backdrop`,
`Viewport`, `Popup`, `Content`, `Title`, `Description`, `Close`, `SwipeArea`, `Indent`,
`IndentBackground`, `VirtualKeyboardProvider`, and `createHandle`. A sheet that slides in from the
edge `swipeDirection` names (bottom by default), on the raised fill with the popup shadow and round
only where it faces the page, with a small grabber on a top or bottom sheet. It follows the finger
and settles on the Core drawer curve, supports snap points and nested drawers, and under reduced
motion it only fades. `Indent` makes the page recede while a drawer is open. The Popup draws the
Viewport Base UI needs around it. Both flavors, CSS and Tailwind.
