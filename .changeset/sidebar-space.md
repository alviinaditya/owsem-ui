---
"owsem-ui": minor
---

`Sidebar.Root` gets a `space` prop. With `"release"`, a closed desktop sidebar gives its inline size back
to the page beside it while it slides out, and takes it again on open, over the same 300ms (at once under
reduced motion); the sidebar keeps its width, so its content does not rewrap. The default, `"keep"`, is
the behavior as before.
