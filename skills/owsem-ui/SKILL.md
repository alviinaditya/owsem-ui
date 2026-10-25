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
component. Other entry points: `owsem-ui/owsem` (Owsem family),
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
`@owsem/core` item, `lib/owsem/tokens.css`, `lib/owsem/tailwind.css` (for Tailwind projects), and
`lib/owsem/class-name.ts`. Import `lib/owsem/tokens.css` once in the app's CSS entry; each
component imports its own CSS. Import components from the copy, such as
`@/components/owsem/separator`. The registry ships no providers: import them from
`@base-ui/react/direction-provider` and `@base-ui/react/csp-provider`, the copy the copied
components use.

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
- **Tailwind CSS v4**: import `owsem-ui/tailwind.css` first in the global CSS, before Tailwind,
  and load OwsemUI's CSS from that file, not from JavaScript (registry projects import
  `lib/owsem/tailwind.css` and `lib/owsem/tokens.css` by relative path at the same spots):

  ```css
  @import "owsem-ui/tailwind.css"; /* the layer order and the theme */
  @import "tailwindcss";
  @import "owsem-ui/styles.css";
  ```

  Its first line, `@layer theme, base, owsem, components, utilities;`, puts OwsemUI above
  preflight and below utilities, so utilities in `className` win; imported after `tailwindcss` it
  comes too late. It maps the theme tokens to utilities that read `var(--ow-*)`: colors
  (`bg-ow-panel`, `text-ow-muted`, `border-ow-line`, `bg-ow-raised` for `--ow-raised-bg`),
  `shadow-ow-raised` (and panel, popup, well, pressed, primary), `rounded-ow`, and `ease-ow-out`
  (and in-out, drawer, spring-travel, spring-settle, spring-glide); spring durations go through
  `duration-(--ow-spring-glide-duration)`. Style states with data attribute variants such as
  `data-panel-open:` or `data-[orientation=vertical]:`, with no plugin. Set a token on one element
  with an arbitrary property: `[--ow-panel:var(--color-zinc-900)]`. OwsemUI needs no `cn()`, but
  the project's own `cn()` works in `className`. Tailwind's `dark:` ignores `data-theme` unless
  the project adds the `@custom-variant dark` from https://owsem.dev/en/docs#tailwind-css-v4.

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
**Button**, **Kbd**, **Menu**, **Popover**, **Separator**, **Toggle**, **Toggle Group**,
**Toolbar**, and **Tooltip** (Base, from `owsem-ui/base`) and **Color Picker**, **Command Menu**,
**Icon Morph**, **Table of Contents**, and **Tree Rail Nav** (Owsem, from `owsem-ui/owsem`) are
built. Base
components are Base UI components with OwsemUI's styling, and small primitives without a Base UI
part, such as Kbd; Owsem components are OwsemUI's own. No component has a `flavor` prop.

### Button

```tsx
import { Button, ButtonIcon, buttonStyles, IconButton } from "owsem-ui/base"; // or "@/components/owsem/button"
<Button onClick={save}>Save</Button>
<Button variant="secondary" size="sm" startIcon={<Plus />}>Add</Button>
<Button loading={saving}>Save</Button>
<IconButton icon={<Trash />} aria-label="Delete" variant="destructive" />
<a href="/docs" {...buttonStyles({ variant: "outline" })}>
  Docs
  <ButtonIcon side="end"><ArrowRight /></ButtonIcon>
</a>
```

- Base UI's Button: a native `<button type="button">` with the `ow-button` class. Props:
  `variant` (`"primary"`, the default, `"secondary"`, `"outline"`, `"ghost"`, `"link"`,
  `"destructive"`), `size` (`"sm"`, `"md"`, the default, `"lg"`), `soft` (a flat tint, for
  primary, secondary, and destructive), `loading`, `startIcon`, `endIcon`, and Base UI's
  `disabled`, `focusableWhenDisabled`, `nativeButton`, `className`, `style`, `render`. The ref
  goes to the button.
- `loading` keeps the width and focus, ignores presses, and sets `aria-busy` and `aria-disabled`.
  Keep the label the same while loading. Use a boolean (`loading={saving}`) on buttons that can
  load, so the spinner fades in.
- `IconButton`: `icon` and a required `aria-label`; square; `ghost` by default.
- Look: flat fills with crisp 1px edges drawn as inset shadows, so every variant of a size is the
  same height. `primary`, `secondary` (a neutral: grey in light, silver in dark), and
  `destructive` are solid fills with an edge darker than the fill, `outline` is a quiet 1px line
  from the text color, `ghost` is flat until hovered, and `soft` is a tint with no edge. There is
  no drop shadow and no socket; do not add a `box-shadow` around a button.
- Links: never render a link through Button. Spread `buttonStyles({ variant, size, soft,
  className })` on the `<a>` or router `Link`, and wrap icons in `ButtonIcon` (`side`). Pass icons
  as elements; their size is the font size plus 2px, so do not size them.
- Size: `--py` (padding above and below the text) sets any custom size, through `style` on the
  button itself: `style={{ "--py": "0.6em" }}`. Do not set `height` or `padding`.
- Reads `--ow-accent` with `--ow-on-accent` (primary; the link mixes the accent toward `--ow-fg`),
  `--ow-critical-solid` with `--ow-on-critical` (destructive; soft uses `--ow-critical`),
  `--ow-fg` and `--ow-bg` (secondary's fill and text, outline's line), `--ow-primary-shadow` (the
  solid fills' edges), `--ow-pressed-*` (held down), `--ow-hover`, `--ow-focus`, `--ow-radius`,
  and `--ow-motion-scale`.

### Menu

A dropdown list of actions from a button, with checks, choices, and submenus. Registry item: `menu`.

```tsx
import { Menu } from "owsem-ui/base"; // or "@/components/owsem/menu"
<Menu.Root>
  <Menu.Trigger render={<button type="button" />}>Edit</Menu.Trigger>
  <Menu.Portal>
    <Menu.Positioner>
      <Menu.Popup>
        <Menu.Item onClick={copy}>
          <CopyIcon />
          Copy
          <kbd>⌘C</kbd>
        </Menu.Item>
        <Menu.Separator />
        <Menu.CheckboxItem checked={wrap} onCheckedChange={setWrap}>
          <Menu.CheckboxItemIndicator />
          Word wrap
        </Menu.CheckboxItem>
        <Menu.Group>
          <Menu.GroupLabel>Theme</Menu.GroupLabel>
          <Menu.RadioGroup value={theme} onValueChange={setTheme}>
            <Menu.RadioItem value="light">
              <Menu.RadioItemIndicator />
              Light
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Group>
        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>{/* items */}</Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.SubmenuRoot>
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Portal>
</Menu.Root>
```

- Keyboard, focus, typeahead, and ARIA come from Base UI; do not add handlers. Inside a Toolbar,
  open it from an item: `<Toolbar.Button render={<Menu.Trigger />}>Edit</Toolbar.Button>`.
- Do not style item hover or `data-highlighted`: Glide lights items (recolor it with
  `--ow-hover`). An `svg` first in an item is its icon; a `kbd` last is its shortcut (the menu
  shows it, the app handles the keys).
- `Menu.CheckboxItemIndicator` and `Menu.RadioItemIndicator` draw a check and a dot by default and
  keep their room while off (`keepMounted`); put them first. Checkbox and radio items keep the menu
  open unless `closeOnClick`.
- `Popup` takes `size` (`"sm"`, `"md"` default, `"lg"`), also on a submenu's Popup. `Positioner`
  sits 6px from the trigger (`side`, `align`, `sideOffset`); a submenu lines its first item up with
  its trigger. The menu renders in a portal: set tokens on the Popup's class or on `:root`, and
  `data-theme` on the Positioner when the trigger sits in a themed subtree.
- Reads `--ow-panel`, `--ow-popup-shadow`, `--ow-fg`, `--ow-muted`, `--ow-hover` (Glide),
  `--ow-line-dark` and `--ow-line-light` (grooves), `--ow-radius`, and `--ow-focus`.

### Popover

A panel of content and controls opened from a button: a dialog, usable with touch and screen
readers. Registry item: `popover`.

```tsx
import { Popover } from "owsem-ui/base"; // or "@/components/owsem/popover"
<Popover.Root>
  <Popover.Trigger render={<button type="button" />}>Share</Popover.Trigger>
  <Popover.Portal>
    <Popover.Positioner>
      <Popover.Popup>
        <Popover.Arrow />
        <Popover.Title>Share the draft</Popover.Title>
        <Popover.Description>Anyone with the link can read it.</Popover.Description>
        {/* controls */}
        <Popover.Close render={<button type="button" />}>Done</Popover.Close>
      </Popover.Popup>
    </Popover.Positioner>
  </Popover.Portal>
</Popover.Root>
```

- Focus, Escape, outside clicks, and ARIA come from Base UI; always give the popup a
  `Popover.Title`. Use a Popover, not a Tooltip, for anything people must read or act on.
- `Positioner`: `side` (`"bottom"` default), `align`, `sideOffset` (10 by default, room for the
  arrow); `Arrow` is optional. `Popup`: `initialFocus` and `finalFocus`; `Root`: `modal` (`false`
  default), `open`, `onOpenChange`.
- One panel for several triggers: `const handle = Popover.createHandle()`, then
  `<Popover.Root handle={handle}>` and `<Popover.Trigger handle={handle} payload={...}>` anywhere;
  `handle.open(triggerId)` and `handle.close()` work from code.
- The panel renders in a portal: set tokens on the Popup's class or on `:root`, and `data-theme` on
  the Positioner when the trigger sits in a themed subtree. Long content scrolls in a container
  inside the popup (the popup itself has no overflow, so the arrow shows).
- Reads `--ow-panel` and `--ow-popup-shadow` (the arrow takes both), `--ow-fg`, `--ow-muted`, and
  `--ow-radius`.

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

### Toggle Group

Toggle buttons that work as one, and the segmented control: a flat track, with a thumb (the raised
key: a flat fill with crisp edges) that slides to the pressed item. Registry item: `toggle-group`.

```tsx
import { ToggleGroup } from "owsem-ui/base"; // or "@/components/owsem/toggle-group"
const [view, setView] = useState("list");
<ToggleGroup.Root
  aria-label="View"
  value={[view]}
  onValueChange={([next]) => next && setView(next)} // a segmented control keeps one choice
>
  <ToggleGroup.Item value="list">List</ToggleGroup.Item>
  <ToggleGroup.Item value="board" aria-label="Board"><BoardIcon /></ToggleGroup.Item>
</ToggleGroup.Root>
```

- `Root` is Base UI's ToggleGroup: `value` and `defaultValue` are arrays, `multiple` lets several
  items be pressed (each is a key of its own, with no thumb), plus `orientation`, `disabled`,
  and `loopFocus`. OwsemUI adds `size` (`"sm"`, `"md"`, the default, or `"lg"`) and `equal`
  (every item as wide as the widest; equal shares when the group is stretched).
- `Item` is Base UI's Toggle with a `value`. Give an item with only an icon an `aria-label`; it is
  square. Icons are any `svg`, sized to the font plus 2px.
- Never give an item an empty `value` (`""`): Base UI replaces it with a generated id, so that item
  never matches the group's value. Use a word such as `"off"` or `"none"`.
- A value read from storage: render `value={[]}` on the server and the stored one after
  hydration, so the thumb appears in place instead of sliding from a default.
- Name the group with `aria-label` or `aria-labelledby`. Arrows, Home, and End move focus, Space
  and Enter press; do not add your own.
- Reads `--ow-well-bg` and `--ow-well-shadow` (the track), `--ow-raised-bg` and
  `--ow-raised-shadow` (the thumb, and pressed items with `multiple`), `--ow-fg`, `--ow-muted`,
  `--ow-focus`, `--ow-hover` (Glide), and `--ow-radius`. An item's height is its own `--py`.

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
- Reads `--ow-tooltip-bg`, `--ow-tooltip-fg`, and `--ow-radius`.

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

### Color Picker

A color picker: a saturation and brightness area, hue and opacity sliders, an eye dropper where the
browser has one, hex, RGB, and HSL fields, and swatches. Registry item: `color-picker`.

```tsx
import { ColorPicker, ColorPickerPopover } from "owsem-ui/owsem"; // or "@/components/owsem/color-picker"
<ColorPicker value={color} onChange={setColor} onChangeComplete={save} />
<span id="brand-label">Brand color</span>
<ColorPickerPopover id="brand" aria-labelledby="brand-label brand" defaultValue="#7c6ab8" />
```

- `ColorPicker` is the panel (`div`); `ColorPickerPopover` is a trigger (`button`, Base UI
  `Popover.Trigger`) that opens the panel in a popover. Both take `value` or `defaultValue` (hex,
  `rgb()`, `hsl()`, or any CSS color the browser reads, such as `var(--ow-accent)`), `onChange`
  (every move) and `onChangeComplete` (when a drag, key, edit, or swatch is done), both called with
  `(value, { hex, rgb, hsl, hsv })`, `format` (`"hex"`, `"rgb"`, or `"hsl"`: the string returned),
  `alpha`, `inputs`, `eyeDropper` (booleans, default true), `swatches` (colors or
  `{ color, label }`, or `false`), and `labels` (every text, for translation).
- `ColorPickerPopover` adds `size` (`sm`, `md`, `lg`), `variant` (`"field"`: the color and its
  value; `"swatch"`: a square), `open`, `defaultOpen`, `onOpenChange`, `side`, `align`,
  `sideOffset`, and `disabled`; `children` replaces the trigger's content. A swatch trigger needs
  `aria-label`.
- Do not wrap it in another popover or add keyboard handling: the area, sliders, fields, and
  swatches have their own.
- Reads `--ow-panel` (the panel, and the checkerboard behind translucent colors with `--ow-line`),
  `--ow-panel-shadow` (`--ow-popup-shadow` in the popover), `--ow-well-bg` (fields and the trigger)
  with `--ow-edge` (fields) and `--ow-well-shadow` (the trigger), `--ow-raised-*` and
  `--ow-pressed-*` (the eye dropper and format keys), `--ow-line-dark` and `--ow-line-light` (over
  the swatches), `--ow-fg`, `--ow-muted`, `--ow-focus`, and `--ow-radius`. The popover's panel is
  portaled to the body: set its tokens on `:root` or `.ow-color-picker`, not on the trigger's
  parent.
- Width (256px) and area height (160px) are layout: set `inline-size` on the picker with
  `className` or `style`, and `block-size` on `.ow-color-picker__area` from your CSS.
- `parseColor`, `formatColor`, and the conversions (`hsvaToRgba`, `rgbaToHsva`, `hsvaToHsla`,
  `hslaToHsva`, `rgbaToHex`) are exported too.

### Command Menu

A command palette: a Base UI Dialog holding an Autocomplete. ⌘K or Ctrl K opens it; typing
filters grouped items; Enter runs the highlighted one. Registry item: `command-menu`.

```tsx
import { CommandMenu } from "owsem-ui/owsem"; // or "@/components/owsem/command-menu"
<CommandMenu.Root items={groups}>
  <CommandMenu.Trigger>
    Search…<CommandMenu.Shortcut aria-hidden>⌘K</CommandMenu.Shortcut>
  </CommandMenu.Trigger>
  <CommandMenu.Popup aria-label="Commands">
    <CommandMenu.Input aria-label="Search commands" placeholder="Search…" />
    <CommandMenu.Empty>No results</CommandMenu.Empty>
    <CommandMenu.List>
      {(group) => (
        <CommandMenu.Group key={group.value} items={group.items}>
          <CommandMenu.GroupLabel>{group.value}</CommandMenu.GroupLabel>
          <CommandMenu.Collection>
            {(item) => (
              <CommandMenu.Item key={item.value} value={item} onClick={item.run}>
                <CommandMenu.ItemLabel>{item.label}</CommandMenu.ItemLabel>
              </CommandMenu.Item>
            )}
          </CommandMenu.Collection>
        </CommandMenu.Group>
      )}
    </CommandMenu.List>
  </CommandMenu.Popup>
</CommandMenu.Root>
```

- Items are `{ value, label }` objects (Base UI matches the label), in groups of
  `{ value, items }` or a flat array. `filteredItems` takes your own ranking; `value` and
  `onValueChange` hold the query. Root also takes Dialog's `open`, `onOpenChange`, and `modal`.
- `shortcut`: the ⌘/Ctrl key, `"k"` by default; `false` for a second menu on the page. It skips
  keys something else already handled (`preventDefault`).
- `Item`: `onClick` runs on click and on Enter, then the menu closes (`closeOnClick={false}` keeps
  it open). Lay it out with `ItemIcon`, `ItemLabel`, `ItemDescription`, and `Shortcut` (a `kbd`).
  `Footer` holds key hints. Glide lights the highlighted item; do not style `[data-highlighted]`.
- `Popup`: `size` (`"sm"`, `"md"`, `"lg"`), `backdrop` (`"dim"`, or `"blur"` to blur the page
  too), `container` (default `document.body`), and `closeLabel` for the hidden close button
  (translate it). `Trigger` also takes `size`; outside Root, give it the Root's `handle` from
  `CommandMenu.createHandle()`.
- No open or close animation, by design: do not add one.
- Reads `--ow-panel` (the glass, at 80%), `--ow-popup-shadow`, `--ow-backdrop` (the scrim),
  `--ow-fg`, `--ow-muted`, `--ow-focus`, `--ow-hover` (the highlight), `--ow-radius`,
  `--ow-well-bg`, `--ow-well-shadow`, and `--ow-edge` (the Trigger), `--ow-raised-bg` and
  `--ow-raised-shadow` (keys), and `--ow-line-dark` with `--ow-line-light`. The Popup renders in
  the body: set them on `:root` or on the Popup. Its width is `min(100%, 560px)`; set
  `inline-size` on the Popup to change it. The panel is glass with the popup's crisp edge, the
  Trigger a flat well, the shortcuts crisp keys; do not add soft shadows, inset blurs, or glow.

### Table of Contents

An "On this page" list that marks the section being read: a rail along the list, and a marker that
slides along it to the current link. Registry item: `table-of-contents`.

```tsx
import { TableOfContents } from "owsem-ui/owsem"; // or "@/components/owsem/table-of-contents"
<TableOfContents.Root aria-label="On this page">
  <TableOfContents.List>
    <TableOfContents.Item>
      <TableOfContents.Link href="#install">Installation</TableOfContents.Link>
    </TableOfContents.Item>
    <TableOfContents.Item>
      <TableOfContents.Link href="#theming">Theming</TableOfContents.Link>
      <TableOfContents.List>
        <TableOfContents.Item>
          <TableOfContents.Link href="#dark">Dark mode</TableOfContents.Link>
        </TableOfContents.Item>
      </TableOfContents.List>
    </TableOfContents.Item>
  </TableOfContents.List>
</TableOfContents.Root>
```

- `Root` (`nav`; give it `aria-label`), `List` (`ul`, nested inside an `Item` for sub-sections,
  which indent), `Item` (`li`), and `Link` (`a`, `render` for a router link). No other props:
  everything else passes through.
- Tracking is built in; do not add an IntersectionObserver, scroll handlers, or `aria-current`. A
  link's target is the element whose id its hash names, so give every heading an id. The current
  link is the last whose target crossed a line 30% down the targets' nearest scrolling ancestor
  (or the window); at the very end it is the last link; a clicked link holds until the visitor
  scrolls. It gets `aria-current="location"`, and `data-current` to style it by.
- Links are plain anchors: the browser scrolls to the section. For a smooth scroll, set
  `scroll-behavior: smooth` on the scroll area inside `@media (prefers-reduced-motion:
  no-preference)` (in Next.js on `<html>`, add `data-scroll-behavior="smooth"` there too); under
  a sticky header, set `scroll-padding-top`. Do not handle the clicks instead.
- Reads `--ow-accent` (the marker), `--ow-line` (the rail), `--ow-fg` (current and hovered links),
  `--ow-muted` (other links), `--ow-focus`, and `--ow-radius`.

### Icon Morph

Swaps one icon for another in place: the old icon shrinks, blurs, and fades out as the new one grows
in, both in one grid cell. Registry item: `icon-morph`.

```tsx
import { IconMorph } from "owsem-ui/owsem"; // or "@/components/owsem/icon-morph"
<Button
  variant="outline"
  startIcon={<IconMorph>{copied ? <Check key="check" /> : <Copy key="copy" />}</IconMorph>}
>
  Copy
</Button>
```

- One child, an icon element with a `key`. A new key swaps it; the same key updates the icon in
  place; `null` shows none. Nothing animates on the first render. Do not wrap the icons in
  `AnimatePresence` or add transitions: CSS transitions are built in, a change mid-swap turns
  around, and nothing runs at rest.
- Root is a `span` (`className`, `style`, ref, and other props pass through). In the icon slot of a
  Button, Toggle, or Toolbar item it fills the slot, so do not size the icons there; elsewhere each
  icon keeps its own size.
- It adds no role or name. Name the control after what it does now, or keep one name with
  `aria-pressed`; the leaving icon is `aria-hidden`. Announce a change such as a copy in a status
  region.
- Reads `--ow-motion-scale` (how far icons shrink and blur; 0 only fades), `--ow-spring-settle`
  and `--ow-spring-settle-duration` (the swap), and `--ow-ease-out` (the crossfade under reduced
  motion). Set them on `.ow-icon-morph` itself: the settle spring also times button presses.

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
