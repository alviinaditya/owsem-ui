---
"owsem-ui": minor
---

Add Alert Dialog to `owsem-ui/base`: Base UI's `AlertDialog.Root`, `Trigger`, `Portal`, `Backdrop`,
`Viewport`, `Popup`, `Title`, `Description`, `Close`, and `createHandle`. It is Dialog's twin for a
question that needs an answer: always modal, no close icon, and a press on the scrim does not shut
it. The first focus goes to the first `AlertDialog.Close`, the safe answer, wherever it sits in the
markup, unless the Popup's `initialFocus` says otherwise. The look, sizes, and motion are Dialog's;
a nested alert sets its parent back. Trigger and Close wear your button through `render`. Both
flavors, CSS and Tailwind.
