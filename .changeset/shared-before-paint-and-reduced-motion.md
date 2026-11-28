---
"owsem-ui": patch
---

The layout effect that falls back to an ordinary one on the server, and the reduced-motion check,
each live in one Core module (`core/use-before-paint.ts`, `core/reduced-motion.ts`) instead of being
written out in a dozen components. Behavior is unchanged; copied components pull the two modules in
with them.
