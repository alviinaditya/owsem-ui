---
"owsem-ui": minor
---

Add Progress, from `owsem-ui/base`. `Progress.Root` lays a `Progress.Label` at the start and a
`Progress.Value` at the end above a pill track (`size` `sm`, `md`, `lg`: 4, 8, 12 px); the track and
its fill draw themselves when left out. The fill moves with `translate` on the glide spring instead of
`width`. `value={null}` runs a segment along the track on a CSS animation, which stops when a value is
set; with reduced motion it sits still in the middle. Both flavors, CSS and Tailwind.
