---
name: owsem-ui
description: Use OwsemUI, React components on Base UI from the npm package owsem-ui or the shadcn registry @owsem. Load when a project imports owsem-ui, has components/owsem/ or lib/owsem/, uses --ow-* tokens or @owsem/* registry items, or when the user asks to install, theme, or style OwsemUI components or which ones exist.
---

# OwsemUI

OwsemUI is a React component library built on [Base UI](https://base-ui.com). Base UI provides
behavior and accessibility; OwsemUI adds the styling, through `ow-*` classes and `--ow-*` tokens.
Components come in two families: **Base**, calm components for dashboards, and **Owsem**, with
richer motion and effects.

The library is early: most components are planned, not built. Never assume a component, prop,
token, or command exists; check the sources below first. A release may not be published yet: if
`owsem-ui` cannot be installed or `owsem.dev` cannot be reached, tell the user. Do not install a
similarly named package or another library instead.

## Sources of truth

1. **Registry index**: https://owsem.dev/r/registry.json lists every built component (items with
   `"type": "registry:ui"`). `https://owsem.dev/r/<name>.json` holds one item's files.
2. **Docs**: https://owsem.dev/en/docs for setup and `/en/docs/theming` for themes and tokens.
   https://owsem.dev/en lists components, and `https://owsem.dev/en/<name>` covers one (anatomy,
   states, keyboard, tokens, props). A page that says "Coming soon" is a component not built yet.
3. **Installed code**: `node_modules/owsem-ui/dist`, or `components/owsem/` and `lib/owsem/`.

Props follow the Base UI component of the same name (`https://base-ui.com/react/components/<name>`),
but the props table on the OwsemUI page is the final word.

## Install from npm

Requires React 18.2 or 19 (`react` and `react-dom` are peers). The package is ESM only. Use the
project's package manager.

```sh
pnpm add owsem-ui
```

The package's JavaScript never imports CSS, so load it once in the app entry (outside Next.js and
Vite, TypeScript 6 or 7 also needs `declare module "*.css";` in a `.d.ts` file):

```tsx
import "owsem-ui/styles.css"; // tokens plus every component's CSS
import { Separator } from "owsem-ui/base";
```

To load only what is used, import `owsem-ui/tokens.css` plus `owsem-ui/css/<name>.css` for each
component. Other entry points: `owsem-ui/owsem` (Owsem family, empty today),
`owsem-ui/components/<name>`, and `owsem-ui/core` (`DirectionProvider`, `useDirection`,
`CSPProvider`). With the npm package, take those from `owsem-ui/core`, not from `@base-ui/react`,
so the app shares OwsemUI's copy of Base UI; React context does not cross copies.

## Install from the shadcn registry

The code is copied into the project and becomes the user's. Use the project's runner (`npx`,
`pnpm dlx`, `bunx --bun`).

```sh
npx shadcn registry add @owsem=https://owsem.dev/r/{name}.json   # once per project
npx shadcn add @owsem/separator
```

Component files land in `components/owsem/<name>/`; the first one also adds the shared
`@owsem/core` item, `lib/owsem/tokens.css` and `lib/owsem/class-name.ts`. Import
`lib/owsem/tokens.css` once in the app's CSS entry; each component imports its own CSS. Import
components from the copy, such as `@/components/owsem/separator`. The registry ships no providers:
import them from `@base-ui/react/direction-provider` and `@base-ui/react/csp-provider`, the copy
the copied components use.

Pick one path per project: if `components/owsem/` exists, import from there, not from `owsem-ui`.
To update a copy, preview with `npx shadcn add @owsem/<name> --diff` and keep the user's changes.

## Global setup

Base UI needs two global styles. Put them in the app's global CSS, on the app's real root element:

```css
.root { isolation: isolate; } /* portaled popups appear above the page */
body { position: relative; } /* backdrops in iOS Safari 26 and later */
```

## Theming

- **Themes**: without `data-theme`, the theme follows `prefers-color-scheme`. `data-theme="light"`
  or `data-theme="dark"` on `<html>` or any element forces a theme for that subtree.
- **Theme tokens**: every color, material, radius, and spring is an `--ow-*` theme token, such as
  `--ow-bg`, `--ow-fg`, `--ow-accent`, `--ow-hover`, `--ow-panel`, `--ow-raised-bg`, and
  `--ow-radius`; read `tokens.css` for the current names. They are the only tokens: components
  have none of their own. A token that differs by theme must be set for every case `tokens.css`
  covers, or the override leaks into the other theme:

  ```css
  :root,
  [data-theme="light"] { --ow-bg: #ffffff; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ow-bg: #0b0b0e; } }
  [data-theme="dark"] { --ow-bg: #0b0b0e; }
  :root { --ow-accent: #c9b8f0; } /* one value for both themes */
  ```

  `--ow-line-dark` and `--ow-line-light` are not derived from other tokens: when changing
  neutrals such as `--ow-bg`, set them per theme too, so etched lines stay visible.
- **One component**: set a theme token on the component, or on an element around it, to restyle
  only what is inside: `.sidebar { --ow-line-dark: #b8b8c4; }`. For what no token covers, style the
  part with `className`, or in CSS by its class and data attributes.
- **Class names**: the root part is `.ow-<component>` and every other part
  `.ow-<component>__<part>` (BEM elements), such as `.ow-tree-rail-nav__label`. Variants and states
  are data attributes, never classes: Base UI's (`data-orientation`, `data-highlighted`, and
  `data-pressed` for a toggle that is on) and OwsemUI's (`data-variant`, `data-size`, `data-held`
  while held down). Rely only on the classes and attributes in a Lab's parts table.
- **Layers**: tokens live in `@layer owsem.tokens` and component CSS in `@layer owsem.components`.
  Plain, unlayered app CSS always wins, so overrides need no `!important`.
- **Tailwind CSS v4**: the first stylesheet that names a layer fixes the order. Put this line
  first in the global CSS and load OwsemUI from that CSS, not from JavaScript (registry projects
  import `lib/owsem/tokens.css` at the same spot):

  ```css
  @layer theme, base, owsem, components, utilities;
  @import "tailwindcss";
  @import "owsem-ui/styles.css";
  ```

## Glide (Core)

`owsem-ui/core` also exports **Glide**: one hover highlight that glides to the item nearest the
pointer, for menus, lists, and rows of tabs. Registry projects have it in `lib/owsem/glide/`.

```tsx
import { GlideHighlight, useGlide } from "owsem-ui/core"; // or "@/lib/owsem/glide/use-glide"
const glide = useGlide<HTMLDivElement>({ axis: "y" }); // "x" for a row
<div ref={glide.ref}>
  <GlideHighlight glide={glide} />
  <button type="button" data-glide-item>Profile</button>
</div>
```

Glide never moves focus; for a keyboard highlight, call `glide.setActive(item)`. Its color is
`--ow-hover`: set it on the container to recolor one list's highlight.

## Components available now

Read the registry index or the docs, not a hard-coded list. As of this version of the skill,
**Kbd**, **Separator**, **Toggle**, **Toolbar**, and **Tooltip** (Base, from `owsem-ui/base`) and
**Tree Rail Nav** (Owsem, from `owsem-ui/owsem`) are built. Base components are Base UI components
with OwsemUI's styling, and small primitives without a Base UI part, such as Kbd; Owsem components
are OwsemUI's own. No component has a `flavor` prop.
OwsemUI's own. No component has a `flavor` prop.

### Separator

```tsx
import { Separator } from "owsem-ui/base"; // or "@/components/owsem/separator"
<Separator />
<Separator orientation="vertical" />
```

- Renders `<div role="separator">` with `aria-orientation`, `data-orientation`, and the
  `ow-separator` class: an etched line, a dark 1 px border with a light one beside it. Not
  focusable, with no keyboard interaction. Use it instead of `<hr>` or a bordered `div`.
- Props: `orientation` (`"horizontal"`, the default, or `"vertical"`), `className` (a string or
  `(state) => string`), `style`, and `render`. Other props pass through to Base UI. The ref goes
  to the `div`.
- Reads `--ow-line-dark` and `--ow-line-light`.

### Kbd

```tsx
import { Kbd } from "owsem-ui/base"; // or "@/components/owsem/kbd"
<p>Press <Kbd>⌘K</Kbd> to search.</p>
```

- Renders `<kbd class="ow-kbd">`: a small raised keycap with a crisp edge, 0.75 of the
  surrounding text size, so it fits a sentence, a field, or the end of a list row. Not focusable.
  Use it for any key or shortcut shown to people, instead of a styled `<kbd>`.
- Props: `className`, `style`, and `render`; other props pass through to the `kbd`, which gets the
  ref.
- Hide a purely visual hint with `aria-hidden` when the control names its shortcut with
  `aria-keyshortcuts`.
- Reads `--ow-raised-bg`, `--ow-raised-shadow`, `--ow-muted`, and `--ow-radius`.

### Toggle

A two-state button: flat with muted text while off, the raised key tinted 8% toward its text while
on (so it shows on a white panel too), and the pressed material only while held down. Registry
item: `toggle`.

```tsx
import { Toggle } from "owsem-ui/base"; // or "@/components/owsem/toggle"
<Toggle aria-label="Bold" startIcon={<BoldIcon />} />
<Toggle defaultPressed startIcon={<PinIcon />}>Pin</Toggle>
<Toggle pressed={wrap} onPressedChange={setWrap}>Wrap lines</Toggle>
```

- Renders a `<button>` with `aria-pressed`, `data-pressed` while on, and `data-disabled`.
  Controlled with `pressed` and `onPressedChange(pressed, eventDetails)`, or uncontrolled with
  `defaultPressed`. Keep its name the same in both states; the state is what changes.
- Props: `size` (`"sm"`, `"md"` default, `"lg"`: Button's heights), `startIcon` and `endIcon`
  (any icon; sized to the font plus 2px, no size props needed), plus Base UI's `disabled`,
  `value`, `className`, `style`, and `render`. Without children it is a square icon button: give
  it an `aria-label`. The ref goes to the `button`.
- Height comes from `--py` (set it in `style` on the toggle, never under a 24 px target).
- Reads `--ow-muted` (text while off), `--ow-hover`, `--ow-fg`, `--ow-raised-bg` and
  `--ow-raised-shadow` (on), `--ow-pressed-bg` and `--ow-pressed-shadow` (held down),
  `--ow-radius`, and `--ow-focus`.

### Toolbar

A row of buttons, toggles, links, and one field, with arrow-key navigation from Base UI. Registry
item: `toolbar`.

```tsx
import { Toggle, Toolbar } from "owsem-ui/base"; // or "@/components/owsem/toolbar" and ".../toggle"
<Toolbar.Root aria-label="Formatting">
  <Toolbar.Group aria-label="Text">
    <Toolbar.Button render={<Toggle defaultPressed />} aria-label="Bold" startIcon={<BoldIcon />} />
    <Toolbar.Button render={<Toggle />} aria-label="Italic" startIcon={<ItalicIcon />} />
  </Toolbar.Group>
  <Toolbar.Separator />
  <Toolbar.Button startIcon={<ShareIcon />}>Share</Toolbar.Button>
  <Toolbar.Link href="/help">Help</Toolbar.Link>
  <Toolbar.Input aria-label="Find" placeholder="Find" />
</Toolbar.Root>
```

- `Root` renders `role="toolbar"`: one Tab stop, then Left and Right (Up and Down when
  `orientation="vertical"`) move between items and wrap. Do not add key handlers or `tabIndex`.
  Give it an `aria-label`. `size` (`"sm"`, `"md"` default, `"lg"`) sets every item's size.
- `Button` and `Link` are quiet ghost buttons with `size`, `startIcon`, and `endIcon`; without a
  label they are square and need an `aria-label`. A disabled `Button` stays focusable. A Toggle
  passed to `render` keeps its own look: the raised key while on.
- On/off items: pass a Toggle to `render` (`render={<Toggle pressed={on} onPressedChange={setOn} />}`)
  and keep the item's other props on `Toolbar.Button`. A Base UI popup trigger goes the same way
  (`render={<Menu.Trigger />}`).
- `Input` is a flat well with a 3:1 edge, as tall as the buttons; put at most one, last, since
  arrows move its caret. Its `size` is the type scale, not a width: set `inline-size` in CSS.
- `Separator` is an etched groove across the toolbar's direction; `Group` takes an `aria-label`.
- Reads `--ow-panel` and `--ow-panel-shadow` (the bar), `--ow-muted`, `--ow-fg`, `--ow-hover`,
  `--ow-pressed-bg`, and `--ow-pressed-shadow` (buttons and links), `--ow-well-bg`,
  `--ow-well-shadow`, and `--ow-edge` (the field), `--ow-line-dark` and `--ow-line-light` (grooves),
  `--ow-radius`, and `--ow-focus`.

### Tooltip

A short visual label for a button, on hover or keyboard focus (touch shows none). Registry item:
`tooltip`.

```tsx
import { Toggle, Toolbar, Tooltip } from "owsem-ui/base"; // or "@/components/owsem/tooltip"
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger render={<Toolbar.Button render={<Toggle />} aria-label="Bold" startIcon={<BoldIcon />} />} />
    <Tooltip.Portal>
      <Tooltip.Positioner side="bottom">
        <Tooltip.Popup>
          <Tooltip.Arrow />
          Bold<kbd>⌘B</kbd>
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

- The trigger keeps its own accessible name (`aria-label` on an icon button); the tooltip only
  repeats it. Never put information a touch or screen reader user needs only in a tooltip.
- Pass the button to `Tooltip.Trigger`'s `render`; it can itself render a Toggle or a toolbar item.
- `Tooltip.Provider` around a group shares one `delay` (600 ms default): after the first, the next
  tooltips open at once. `Trigger` takes `delay`, `closeDelay`, and `closeOnClick`; `Root` takes
  `open`, `defaultOpen`, `onOpenChange`, and `disabled`.
- `Positioner`: `side` (`"top"` default, also `"inline-start"` and `"inline-end"`), `align`, and
  `sideOffset` (8 by default). `Arrow` is optional. A `kbd` inside the popup is styled as the
  shortcut.
- The popup renders in a portal on `body`: a `data-theme` or token set around the trigger does not
  reach it. Set tokens on `:root` or on the Popup's class, and pass `data-theme` to the Positioner
  when the trigger sits in a themed subtree. Wrap the app in `DirectionProvider` for right to left.
- Tokens: `--ow-tooltip-bg` and `--ow-tooltip-fg` (theme tokens, shared by every tooltip).

### Tree Rail Nav

A sidebar navigation in up to three levels: a rail per level and a trail from the top to the
current row: the trail travels to a new current row and pulses on arrival. Registry item:
`tree-rail-nav`.

```tsx
import { TreeRailNav } from "owsem-ui/owsem"; // or "@/components/owsem/tree-rail-nav"
<TreeRailNav.Root aria-label="Docs">
  <TreeRailNav.List>
    <TreeRailNav.Node>
      <TreeRailNav.Link href="/" current={path === "/"}>Home</TreeRailNav.Link>
    </TreeRailNav.Node>
    <TreeRailNav.Node defaultOpen>
      <TreeRailNav.Toggle>Guides</TreeRailNav.Toggle>
      <TreeRailNav.Panel>
        <TreeRailNav.List>{/* more Nodes */}</TreeRailNav.List>
      </TreeRailNav.Panel>
    </TreeRailNav.Node>
  </TreeRailNav.List>
</TreeRailNav.Root>
```

- Every row is a `Node` (`li`, a Base UI Collapsible root: `open`, `defaultOpen`,
  `onOpenChange`) holding a `Link` or a `Toggle`, plus a `Panel` with a nested `List` for a group.
  `TreeRailNav.Icon` wraps a row's icon and sizes it to the font plus 2px (no size props needed);
  `TreeRailNav.Label` keeps a row's text on one line (it
  fades when too long, and runs while hovered); `TreeRailNav.Origin`, before the first `List`, is
  an optional label the trail starts beside.
- `Link`: `current` (`true`, `"page"`, or `"step"`; the trail ends at the deepest current row),
  `disabled`, and `render` for a router link (`render={<Link href="/x" />}`).
- `Root`: arrow keys, Home, and End move between rows; do not add your own.
- Reads `--ow-accent` (the trail), `--ow-line` (rails), `--ow-fg`, `--ow-muted`, `--ow-bg` (behind
  the dots; match the nav's background), `--ow-hover`, and `--ow-radius`.

## Rules

1. **Check the docs first.** Before using a component, fetch its docs page or registry item. If
   it is missing from `registry.json` or its page says "Coming soon", tell the user it is not
   built and ask how to proceed. Never write a stand-in that looks like an OwsemUI component.
2. **Tokens over CSS overrides.** Change colors with theme tokens, on `:root` or on an element
   around the component. Use `className` for layout and for what no token covers.
3. **Leave behavior to Base UI.** Focus, keyboard, ARIA, and positioning come from Base UI. Do not
   add key handlers, `role`, `aria-*`, or focus management to replace them. Compose with `render`,
   and style states through the `data-*` attributes Base UI sets.
4. **Keep focus rings and reduced motion.** Never remove focus outlines. Added motion animates only
   `transform` and `opacity`, plus `clip-path` when needed, with a `prefers-reduced-motion` version.
5. **Keep forced colors working.** Separator draws its lines as borders so they stay visible in
   forced colors. Do not replace borders with backgrounds or shadows.
6. **Do not use what is not built.** The `owsem` CLI (`init`, `add`, `diff`), isolated token mode,
   and custom token prefixes are planned, not released. Registry copies keep the `--ow-` prefix.
