---
"owsem-ui": minor
---

Add Sidebar, an Owsem component exported from `owsem-ui/owsem`: quiet site navigation with small
uppercase group labels and one-line rows. Write `Sidebar.Provider` around the page, then
`Sidebar.Root` with `Header`, `Content`, `Footer`, and in `Content` any number of `Group`s, each a
`GroupLabel` and a `List` of `Item`s (`<Sidebar.Item href="/button">Button</Sidebar.Item>`).
`ItemIcon` and `ItemBadge` go inside an item. The current page (`active`, or `aria-current="page"`)
is bold and scrolled into view inside `Content`, never the page; items sit in a gutter, and a
`Sidebar.Indicator` rendered in `Content` draws a liquid background behind the current page with a
dot in the gutter. To a new page the background shrinks into a drop, the drop drips there on a neck
that snaps and lands with a small splat, and it spreads out to fill the new background, in the same
time near or far; a re-pick mid-way changes course. It jumps to a clicked item before the page's
`active` follows (and returns after 3 seconds if it does not), and only jumps under reduced motion or
`--ow-motion-scale: 0`; hovering the other items slides Glide's highlight between them. `Content` hides its scrollbar, leaves room below the last item, and fades the edge that has more to
scroll (`data-overflow-start`, `data-overflow-end`). Long labels are cut with an ellipsis, and `disabled` items are
muted and cannot be followed. Every part takes `className`, `style`, and `ref`, and `render` swaps
an element, such as `Item` for a router's `Link`.

`Sidebar.Provider` holds the state, so a `Sidebar.Trigger` can sit anywhere under it, and
`useSidebar()` reads and sets it. `open` (with `defaultOpen` and `onOpenChange`) is for desktop,
where a closed sidebar slides out, fades, and becomes inert. Under `mobileQuery` (default
`(max-width: 767px)`) the sidebar is a modal drawer from the inline start: `mobileOpen`
(`defaultMobileOpen`, `onMobileOpenChange`) opens it, and it closes on Esc, on the scrim, and when
an item is followed. Ctrl or Cmd with B toggles it; `shortcut` changes the key or turns it off.
The Provider's `data-sidebar-state` and `data-sidebar-mobile` let the page around it be laid out
from CSS. Motion is transform and opacity only, scaled by `--ow-motion-scale`, and under reduced
motion the sidebar only fades.
