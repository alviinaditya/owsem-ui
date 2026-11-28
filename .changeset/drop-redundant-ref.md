---
"owsem-ui": patch
---

Toast parts, Tabs List, and Context Menu Positioner no longer take `ref` apart only to pass it
straight back. In React 19 `ref` is a normal prop and `{...props}` forwards it, so refs behave as
before.
