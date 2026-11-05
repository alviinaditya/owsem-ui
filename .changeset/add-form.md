---
"owsem-ui": minor
---

Add Form to `owsem-ui/base`: a native form that checks its Fields before it submits, shows server
errors passed to `errors` on their fields, and moves focus to the first invalid one. `onFormSubmit`
gets the values by each Field's `name`. It draws only the gap between fields, which is one CSS
property to override, and has no margins or token of its own.
