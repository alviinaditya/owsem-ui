---
"owsem-ui": minor
---

Add `owsem-ui/tailwind.css` for Tailwind CSS v4 projects. Imported before `tailwindcss`, it sets
the layer order, so OwsemUI's CSS sits above preflight and below the utilities in `className`, and
it maps the theme tokens to Tailwind's theme: `bg-ow-panel`, `text-ow-muted`, `border-ow-line`,
`shadow-ow-raised`, `rounded-ow`, `ease-ow-out`, and the rest. The utilities read the `--ow-*`
tokens where they are used, so `data-theme` and tokens set on an element still apply. The
registry's `core` item adds it as `lib/owsem/tailwind.css`.
