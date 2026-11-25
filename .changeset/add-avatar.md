---
"owsem-ui": minor
---

Add Avatar, from `owsem-ui/base`. `Avatar.Root` is a circle on Button's heights (`size` `sm`, `md`,
`lg`: 32, 40, 48 px), a flat 10% tint of the text color, holding an `Avatar.Fallback` (initials or
an icon) that shows until the `Avatar.Image` has loaded; the image then fades in over the tint, as
Base UI renders the fallback only while the picture is not loaded. `Avatar.Group` overlaps its
avatars by an eighth, keeps the initials centered in each circle, and cuts each out of the one
before it with a mask, so it works on any surface; its `size` applies to the avatars in it. An
avatar rendered as a `button` or `a` looks like a span one, and shows whole in front of its
neighbors when focused or hovered; the avatar after it is then cut at its start where it sits, so
the gap stays. Compose it with Tooltip to show names. Both flavors, CSS and Tailwind.
