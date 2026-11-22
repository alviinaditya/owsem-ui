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
  `--ow-radius` (16px), `--ow-surface-shadow`, and `--ow-popup-shadow`; read `tokens.css` for the
  current names. `--ow-panel-shadow`, `--ow-raised-shadow`, and `--ow-pressed-shadow` are removed. They are the only tokens: components
  have none of their own. A token that differs by theme must be set for every case `tokens.css`
  covers, or the override leaks into the other theme:

  ```css
  :root,
  [data-theme="light"] { --ow-bg: #ffffff; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ow-bg: #0b0b0e; } }
  [data-theme="dark"] { --ow-bg: #0b0b0e; }
  :root { --ow-accent: #c9b8f0; } /* one value for both themes */
  ```

  `--ow-line` is not derived from other tokens: when changing neutrals such as `--ow-bg`, set it
  per theme too, so hairlines stay visible.
- **Materials**: lines only separate content, they never draw a shape. The light page is white and
  the controls on it are tints: fields, keys, and tracks are tints of `--ow-fg`
  (`color-mix(in oklab, var(--ow-fg) 6%, transparent)` for a field, 9% on hover), so they read on
  the page and on a white card alike. Only a wrapper, a container that holds other content
  (Toolbar, Code Block, Table, Color Picker's panel), has `--ow-surface-shadow`; a single control
  has none. The selected item of Toggle Group, Tabs, and Code Block is an accent tint with accent
  text. Control heights are 32, 40, and 48px (`sm`, `md`, `lg`), and a group that wraps items in
  a track is as tall as one control of its size. A state
  changes the tone, or shows the 2px focus ring, never an edge. A control has no edge by default
  (DP-6); `--ow-edge` is used only under `@media (prefers-contrast: more)`, where fields, Checkbox,
  Radio, and Switch get an inset 1px edge and popups an extra 1px ring. Popups use
  `--ow-raised-bg` with `--ow-popup-shadow`; only hairlines (`--ow-line`) stay.
- **Invalid**: a tint (`--ow-critical` 12%), the message, and one shake when an Input or Select
  trigger becomes invalid (a short opacity blink under reduced motion). Form shakes the first
  invalid field again on a submit that still fails.
- **Corners**: `--ow-radius` (10px by default) is the radius of every surface: controls, popups,
  tracks, panels. A part nested inside a padded one (a menu item, a segmented thumb, a switch's
  key) takes it less that padding, and Checkbox and Kbd take half. Set only `--ow-radius`; do not
  give inner parts a radius of their own or add the padding to the outer one.
- **One component**: set a theme token on the component, or on an element around it, to restyle
  only what is inside: `.sidebar { --ow-line: #b8b8c4; }`. For what no token covers, style the
  part with `className`, or in CSS by its class and data attributes.
- **Class names**: the root part is `.ow-<component>` and every other part
  `.ow-<component>__<part>` (BEM elements), such as `.ow-tree-rail-nav__label`. Variants and states
  are data attributes, never classes: Base UI's (`data-orientation`, `data-highlighted`, and
  `data-pressed` for a toggle that is on) and OwsemUI's (`data-variant`, `data-size`, `data-held`
  while held down). Rely only on the classes and attributes in a component's Anatomy table.
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
  `shadow-ow-popup` (and primary), `rounded-ow`, and `ease-ow-out`
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
**Button**, **Checkbox**, **Dialog**, **Field**, **Fieldset**, **Form**, **Input**, **Kbd**,
**Menu**, **Popover**, **Radio Group**, **Scroll Area**, **Select**, **Separator**, **Switch**,
**Tabs**, **Toggle**, **Toggle Group**, **Toolbar**, and **Tooltip** (Base, from `owsem-ui/base`)
and **Code Block**, **Color Picker**, **Command Menu**, **Copy Button**, **Icon Morph**,
**Sidebar**, **Table**, **Table of Contents**, and **Tree Rail Nav** (Owsem, from
`owsem-ui/owsem`) are built. Base
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
- Look: flat fills, so every variant of a size is the same height (32, 40, 48px). `primary` and
  `destructive` are solid fills with a thin light line inside the top and no ring, `secondary` is
  an 8% tint of the text color (16% held), `ghost` is clear until hovered (`--ow-pressed-bg` held), and `soft` is a
  tint of the variant's tone. `outline` is the only variant with an edge, a quiet 1px line from the
  text color. There is no drop shadow and no socket; do not add a `box-shadow` around a button.
- Links: never render a link through Button. Spread `buttonStyles({ variant, size, soft,
  className })` on the `<a>` or router `Link`, and wrap icons in `ButtonIcon` (`side`). Pass icons
  as elements; their size is the font size plus 2px, so do not size them.
- Size: `--py` (padding above and below the text) sets any custom size, through `style` on the
  button itself: `style={{ "--py": "0.6em" }}`. Do not set `height` or `padding`.
- Reads `--ow-accent` with `--ow-on-accent` (primary; the link mixes the accent toward `--ow-fg`),
  `--ow-critical-solid` with `--ow-on-critical` (destructive; soft uses `--ow-critical`),
  `--ow-fg` (secondary's tint and text, outline's line), `--ow-primary-shadow` (the solid fills'
  top highlight), `--ow-pressed-bg` (held down), `--ow-hover`, `--ow-focus`, `--ow-radius`,
  and `--ow-motion-scale`.

### Checkbox

A box you tick. Registry item: `checkbox`.

```tsx
import { Checkbox } from "owsem-ui/base"; // or "@/components/owsem/checkbox"
<label>
  <Checkbox.Root /> Run the tests
</label>
<Checkbox.Root aria-label="Select row" checked={on} onCheckedChange={setOn} />
<Checkbox.Root aria-label="All tasks" checked={all} indeterminate={some && !all} onCheckedChange={setAll} />
```

- `Root` is Base UI's Checkbox: a `<span role="checkbox">` with a hidden `<input>` beside it, and
  `aria-checked` (`mixed` while indeterminate). States: `data-checked`, `data-unchecked`,
  `data-indeterminate`, `data-disabled`, `data-readonly`. Controlled with `checked` and
  `onCheckedChange(checked, eventDetails)`, or uncontrolled with `defaultChecked`. `name` and `value`
  submit it in a plain `<form>`. The ref goes to the span; `inputRef` to the input.
- It needs a name: a plain `<label>` around it is all it takes, and that label toggles, tints, and
  presses it. Otherwise, an `aria-label`. Space toggles it; Enter submits the form. Do not build a
  wrapper for the label, and use no Field for this.
- Without children, `Root` draws its `Indicator`, and the `Indicator` draws a check that draws its
  stroke in and a minus that grows from its middle; they crossfade, and leaving they only fade.
  Children replace either, with any node, and an svg fills the box. Mark a pair with
  `data-glyph="check"` and `data-glyph="minus"` to keep the crossfade.
- Props: `size` (`"sm"`, `"md"` default, `"lg"`: Button's fonts), plus Base UI's. The box is an icon,
  the font size plus 6px (19, 20, 22 px), in `em`: `font-size` on it scales the box and its glyphs,
  and `--icon` sets it directly. A pseudo-element extends the press target to 24 px without adding
  layout, so do not pad it. It has no margin.
- A parent box is your own state for now (`checked` for all, `indeterminate` for some); Checkbox Group
  is a later component.
- Off is a 10% tint of the text color with no edge (13% on hover of the box or its label, 16% held);
  on is the primary material, and the fill changes at once. Reads `--ow-fg`, `--ow-accent`,
  `--ow-primary-shadow`, `--ow-on-accent`, `--ow-hover`, `--ow-edge` (high contrast), `--ow-focus`, `--ow-radius` (half of it), and `--ow-motion-scale`. One class of
  yours beats any of its states; write `[data-checked]` on it to style one.

### Field

Ties a label, a control, and its messages together through Base UI's aria wiring, in one column with
even gaps. Label and Control are all a common field needs. Registry item: `field` (brings `input`).

```tsx
import { Field } from "owsem-ui/base"; // or "@/components/owsem/field"
<Field.Root>
  <Field.Label>Email</Field.Label>
  <Field.Control />
</Field.Root>
```

```tsx
<Field.Root validationMode="onChange" validate={(value) => (value === "admin" ? "Taken" : null)}>
  <Field.Label>Username</Field.Label>
  <Field.Control pattern="[a-z0-9]{3,}" size="sm" startIcon={<AtIcon />} />
  <Field.Description>Lowercase letters and numbers.</Field.Description>
  <Field.Error match="patternMismatch">Use lowercase letters and numbers.</Field.Error>
  <Field.Error match="customError" />
</Field.Root>
```

- Parts: `Root`, `Label`, `Control`, `Description`, `Error`, `Item` (an option in a checkbox or radio
  group), and `Validity` (a function of the validity state; draws nothing). All but `Validity` take
  `className`, `style`, `render`, and `ref`.
- `Field.Control` is Input: `size`, `startIcon`, `endIcon`, and the same rule that every prop reaches
  the `<input>`. `render` puts another control in the field, as `render={<textarea rows={3} />}`,
  and any Base UI control inside `Field.Root` is wired without it. With per-component CSS, load
  `owsem-ui/css/input.css` too.
- No ids to write: the control gets `aria-labelledby`, `aria-describedby` for the description and for
  the error while it shows, and `aria-invalid`.
- On `Root`: `name`, `invalid`, `disabled`, `validate(value, formValues)`, and `validationMode`
  (`"onSubmit"` default, `"onBlur"`, `"onChange"`). `Field.Error` without `match` shows on any failure,
  with its children or the browser's message; `match` picks one validity state, and `match` alone
  keeps it up for an `invalid` you control.
- It has no outer margins and fills its parent; `gap` on the root sets the space between parts.
- Reads `--ow-fg` (label), `--ow-muted` (description), and `--ow-critical` (error), plus Input's tokens
  on the control. A token on a part or an ancestor wins, and so does unlayered CSS on a `className`.

### Fieldset

Groups fields under one legend with even gaps, and `disabled` reaches them all. It has no frame and no
outer margins. Registry item: `fieldset`.

```tsx
import { Field, Fieldset } from "owsem-ui/base"; // or "@/components/owsem/fieldset", ".../field"
<Fieldset.Root>
  <Fieldset.Legend>Billing address</Fieldset.Legend>
  <Field.Root>
    <Field.Label>Street</Field.Label>
    <Field.Control />
  </Field.Root>
</Fieldset.Root>
```

- Parts: `Root` (a `<fieldset>`, role `group`, `data-disabled`) and `Legend` (a `<div>` that names it
  through `aria-labelledby`). Both take `className`, `style`, `render`, and `ref`. Any control works
  inside; Field is the usual one, and Fieldset does not import it.
- The space between its children is `gap` on the root (`1.25em`), one property on one class.
- A hairline sits under the legend, as its `::after`: `.my-legend::after { content: none; }`
  removes it.
- Reads `--ow-fg` (legend) and `--ow-line`. A token on the legend or an
  ancestor wins, and so does unlayered CSS on a `className`.

### Form

A native `<form>` that checks its Fields before it submits, takes server errors, and moves focus to the
first invalid field. A submit that still fails shakes that field again. It draws only the gap
between fields. Registry item: `form`.

```tsx
import { Button, Field, Form } from "owsem-ui/base"; // or "@/components/owsem/form", ...
<Form onFormSubmit={save}>
  <Field.Root name="email">
    <Field.Label>Email</Field.Label>
    <Field.Control type="email" required />
    <Field.Error />
  </Field.Root>
  <Button type="submit">Sign up</Button>
</Form>
```

- Props: `onFormSubmit(values, eventDetails)` (values by each Field's `name`), `errors`,
  `validationMode` (`"onSubmit"` default, `"onBlur"`, `"onChange"`), and `actionsRef`
  (`{ validate(name?) }`), plus `className`, `style`, `render`, and `ref`. Other props reach the
  `<form>`.
- Server errors: pass `errors`, keyed by Field `name`, such as `{ username: "That name is taken." }`.
  Each shows in its `Field.Error` and focus goes to the first. There is no `onClearErrors` in Base UI
  1.9: editing a field removes that field's error, and a new object replaces the old one.
- Checks reach only Fields and Base UI controls inside one, however deep they sit, so Fieldsets and
  your own layout elements are fine inside.
- The space between children is `gap` on the root (`1.25em`), one property on one class. It has no
  frame and no margins. A `<button>` directly inside keeps its own width.
- Reads no token itself; a token set on it reaches the Fields inside.

### Input

A one-line text field: a 6% tint of the text color with no edge (9% on hover), Button's heights,
and a focus ring. A name is all it needs, and it fills its parent. Registry
item: `input`.

```tsx
import { Input } from "owsem-ui/base"; // or "@/components/owsem/input"
<Input aria-label="Email" />
<Input aria-label="Search" placeholder="Search" startIcon={<SearchIcon />} />
<Input aria-label="Name" value={name} onValueChange={setName} />
```

- Renders an `<input>` with `data-size` and Base UI's `data-disabled`, `data-invalid`, `data-valid`,
  `data-filled`, `data-focused`, `data-dirty`, and `data-touched`. Controlled with `value` and
  `onValueChange(value, eventDetails)`, or uncontrolled with `defaultValue`. Inside a `Field`, Base
  UI wires its name and validity; use `Field.Control`, which is this Input.
- Props: `size` (`"sm"`, `"md"` default, `"lg"`: Button's heights; this replaces the native attribute,
  so set `inline-size` for a width), `startIcon` and `endIcon` (any node; sized to the font plus 2px,
  decorative), plus Base UI's `disabled`, `className`, `style`, and `render`.
- **`ref`, `className`, `style`, and every other prop always reach the `<input>`, with or without
  icons.** The input is always the field. An icon adds `span.ow-input__wrapper`, which has no look and
  only places it; custom properties and `fontSize` in `style` reach it too. Passing the first icon
  later remounts the input, so choose at the first render, and swap icons rather than passing `null`.
- It has no margins. It fills its parent; a width on the input narrows it. In a flex row, an Input
  with icons keeps its wrapper at the full width, so size `.ow-input__wrapper` or the parent there.
- A plain `aria-invalid` draws the invalid tint (`--ow-critical` 12%) and shakes it once, or blinks
  under reduced motion; a field invalid on first render stays still. `render={<textarea rows={3} />}` keeps the look
  and grows past one line.
- Height comes from `--py` (set it in `style`, never under a 24 px target), and `font-size` scales it.
- Reads `--ow-fg` (text and tint), `--ow-critical` (invalid tint), `--ow-muted` (placeholder and
  icons), `--ow-radius`, `--ow-focus`, and `--ow-edge` (high contrast). A token on the input or an
  ancestor wins, and so does any unlayered CSS or Tailwind utility on its `className`.

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
- `modal` (default `true`): the Portal draws a clear backdrop (`.ow-menu__backdrop`), so an outside
  press only shuts the menu, and the page's scroll is held without an `overflow` style, so its text
  is not drawn again. Wheel and scroll keys work inside the menu. Touch opens, hover opens, and
  submenus never lock. Do not add a backdrop or a scroll lock of your own; `modal={false}` for none.
- `Popup` takes `size` (`"sm"`, `"md"` default, `"lg"`), also on a submenu's Popup. `Positioner`
  sits 6px from the trigger's resting box (`side`, `align`, `sideOffset`), so a press does not shift
  it; a submenu lines its first item up with its trigger. The menu renders in a portal: set tokens
  on the Popup's class or on `:root`, and `data-theme` on the Positioner when the trigger sits in a
  themed subtree.
- Reads `--ow-raised-bg`, `--ow-popup-shadow`, `--ow-fg`, `--ow-muted`, `--ow-hover` (Glide),
  `--ow-line` (separators), `--ow-radius`, and `--ow-focus`.

### Dialog

A modal window centered on the screen, over a scrim. Registry item: `dialog`.

```tsx
import { Button, Dialog } from "owsem-ui/base"; // or "@/components/owsem/dialog" and ".../button"
<Dialog.Root>
  <Dialog.Trigger render={<Button />}>Share</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Popup>
      <Dialog.Title>Share the draft</Dialog.Title>
      <Dialog.Description>Anyone with the link can read it.</Dialog.Description>
      <Dialog.Close render={<Button />}>Done</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

- Focus, the scroll lock, Escape, outside presses, and ARIA come from Base UI; always give it a
  `Dialog.Title` and a `Dialog.Close`. There is no built-in close icon, and Trigger and Close have no
  look of their own: pass your button to `render`.
- `Portal` draws the scrim. Write a `Dialog.Backdrop` as its first child only to change it (it
  replaces the drawn one), and set `backdrop={false}` for none, as with `modal={false}`, where a scrim
  would cover the page you meant to keep usable. `container` picks where it renders.
- A modal dialog holds the page's scroll without an `overflow` style, so its text is not drawn
  again; opened by touch, Base UI's own lock stands. Do not add a scroll lock of your own.
- Long content scrolls inside the Popup, which stays 16px inside the screen; wrapped in
  `Dialog.Viewport`, the Popup keeps its full height and the Viewport scrolls. A dialog too long to
  show whole takes focus itself, so it opens at its start, unless `initialFocus` says otherwise.
- Nest by putting a `Dialog.Root` inside a Popup: the parent steps back through `--nested-dialogs` and
  `data-nested-dialog-open`, and the nested Portal's scrim dims it (`backdrop={false}` leaves it).
- Width and padding are plain CSS on the Popup's `className` (`inline-size` is 32em; `font-size`
  scales it). A sheet or a full screen is CSS too: override `inline-size`, `max-inline-size`,
  `block-size`, `max-block-size`, `margin-block`, and `border-radius`, and a rule on
  `[data-starting-style]` and `[data-ending-style]` replaces the growth. Do not add a positioner.
- The dialog renders in a portal: set tokens on `:root`, on the Popup's class, or on the Portal's
  class to reach the scrim too, and `data-theme` on the Portal when the trigger sits in a themed
  subtree.
- Reads `--ow-backdrop`, `--ow-raised-bg`, `--ow-popup-shadow`, `--ow-fg`, `--ow-muted`, `--ow-radius`,
  `--ow-focus`, and `--ow-ease-out`.

### Select

A value, or several, picked from a list in a popup. Registry item: `select`.

```tsx
import { Select } from "owsem-ui/base"; // or "@/components/owsem/select"
<Select.Root defaultValue="Cherry">
  <Select.Trigger aria-label="Fruit" />
  <Select.Popup>
    <Select.Item value="Apple">Apple</Select.Item>
    <Select.Item value="Cherry">Cherry</Select.Item>
  </Select.Popup>
</Select.Root>
```

That is the whole usage; the parts left out draw themselves, and a part you write replaces its
default:

- `Trigger` without children draws `Value` and `Icon` (its `placeholder` reaches that `Value`).
  `Icon` draws chevrons and `ItemIndicator` a check; children replace them.
- `Item` with plain children wraps them in `ItemText`, then an `ItemIndicator` at the row's end, in
  line with the trigger's chevron. Write either part to arrange the row yourself, such as an icon
  before `ItemText` or the check first; written parts keep your order.
- `Popup` without a `List` directly inside draws one, with `ScrollUpArrow` and `ScrollDownArrow`.
  Without a `Positioner` around it, it draws `Portal` and `Positioner`. Write those to set
  `container`, `side`, or `alignItemWithTrigger`.

Details:

- When values are not their labels, pass `items={[{ value, label }]}` to the Root, or the trigger
  shows the raw value. The only prop accessibility needs is a name: `aria-label` on the trigger, or
  a `Select.Label`.
- `size` on the Root (`"sm"`, `"md"` default, `"lg"`) sets the trigger and the popup together. The
  trigger has no width of its own and no margin: it fits its value, and `inline-size` stretches it.
- The popup opens over the trigger at its width, with the selected text on the trigger's text and
  the check at the row's end; it grows only for an item that would not fit, and item text stays on
  one line. Touch, the screen's edges, and `multiple` hang it 6px below instead, at least as wide as
  the trigger. It needs the screen's coordinates, so with a transformed ancestor set
  `alignItemWithTrigger={false}`. A pick's check fades and scales in, and the popup leaves after a
  60 ms beat.
- The trigger is a 6% tint of the text color with no edge, 9% on hover and while the popup is open.
- `multiple` on the Root is Base UI's: pass an array, and the trigger adds up the labels. `name`
  submits in a plain `<form>`. `aria-invalid` or Base UI's `Field` gives it the critical tint and one shake.
- Keyboard, focus, typeahead, and ARIA come from Base UI; do not add handlers. Do not style item
  hover or `data-highlighted`: Glide lights items (recolor it with `--ow-hover`).
- `modal` (default `true`): the Portal draws a clear `Select.Backdrop` (`.ow-select__backdrop`), so
  an outside press only shuts the popup, and the page's scroll is held without an `overflow` style;
  the list still scrolls. Touch opens do not lock. Over the trigger the page is held even with
  `modal={false}` (the popup cannot follow a scroll there), still without an `overflow` style. Do
  not add a Backdrop of your own; `modal={false}` for none.
- A plain rule on a `className` wins over the component's own. The popup renders in a portal: set
  tokens on the Popup's class or on `:root`, and `data-theme` on the Positioner when the trigger
  sits in a themed subtree.
- Reads `--ow-fg` (the trigger's text and tint), `--ow-critical`, `--ow-raised-bg`,
  `--ow-popup-shadow`, `--ow-muted`, `--ow-hover` (Glide), `--ow-line` (separators),
  `--ow-radius`, and `--ow-focus`.

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
  arrow); it measures from the trigger's resting box, so a pressed trigger springing back does not
  move it. `Arrow` is optional. `Popup`: `initialFocus` and `finalFocus`; `Root`: `modal` (`false`
  default), `open`, `onOpenChange`. With `modal` (`true`) the page's scroll is held without an
  `overflow` style; do not add a scroll lock of your own.
- One panel for several triggers: `const handle = Popover.createHandle()`, then
  `<Popover.Root handle={handle}>` and `<Popover.Trigger handle={handle} payload={...}>` anywhere;
  `handle.open(triggerId)` and `handle.close()` work from code.
- The panel renders in a portal: set tokens on the Popup's class or on `:root`, and `data-theme` on
  the Positioner when the trigger sits in a themed subtree. Long content scrolls in a container
  inside the popup (the popup itself has no overflow, so the arrow shows).
- Reads `--ow-raised-bg` and `--ow-popup-shadow` (the arrow takes both), `--ow-fg`, `--ow-muted`, and
  `--ow-radius`.

### Scroll Area

A scroller with a thin scrollbar of its own, the same in every browser, that floats over the content
and shows on hover and while scrolling. Registry item: `scroll-area`.

```tsx
import { ScrollArea } from "owsem-ui/base"; // or "@/components/owsem/scroll-area"
<ScrollArea.Root className="h-64">{content}</ScrollArea.Root>
<ScrollArea.Root className="h-64" fade>{content}</ScrollArea.Root>
```

- The component has no size: set a height or a max-height on the Root with CSS, or nothing scrolls.
  It fills its parent's width, and adds no width for the scrollbar.
- With only content inside, Root draws the other parts for both axes. To give a part its own props,
  write them out; a Viewport among Root's direct children turns the drawing off:

  ```tsx
  <ScrollArea.Root className="h-64">
    <ScrollArea.Viewport ref={viewport} id="list">{content}</ScrollArea.Viewport>
    <ScrollArea.Scrollbar />
    <ScrollArea.Scrollbar orientation="horizontal" />
    <ScrollArea.Corner />
  </ScrollArea.Root>
  ```

  Viewport draws Content and Scrollbar draws Thumb when left out; no Scrollbar means none shows. Do
  not wrap the Viewport in a component of your own, which hides it from Root: pass yours to its
  `render`. Content is as wide as its longest line (Base UI's `min-width: fit-content`); for text
  that truncates instead, write it out with `style={{ minWidth: 0 }}`.
- `fade` on the Root fades an edge while there is more to scroll that way; `--fade-size` on the Root
  or above sets how far (2em by default). A Viewport is a tab stop while its content overflows; set
  `tabIndex={-1}` on it when everything inside can already take focus.
- Restyle with plain CSS: `.list .ow-scroll-area__thumb { background-color: ... }`, and for the
  width `.list .ow-scroll-area__scrollbar[data-orientation="vertical"] { inline-size: 10px; }`.
  Give content room at the edge: the thumb's press area reaches 24px in while the scrollbar shows.
- The rule that hides native scrollbars is in the stylesheet. Base UI still adds a `<style>` for it
  unless the app is wrapped in `<CSPProvider disableStyleElements>`, which a strict CSP needs.
- Reads `--ow-muted` (the thumb, at 72%), `--ow-radius`, `--ow-focus`, and `--ow-ease-out`.

### Radio Group

One choice from a few options, all in view. Each option is a `<label>` row holding a round radio.
Registry item: `radio-group`.

```tsx
import { Radio, RadioGroup } from "owsem-ui/base"; // or "@/components/owsem/radio-group"
<RadioGroup aria-label="Delivery" defaultValue="standard">
  <label>
    <Radio.Root value="standard" />
    Standard
  </label>
  <label>
    <Radio.Root value="express" />
    Express
  </label>
</RadioGroup>
```

- `RadioGroup` is Base UI's: `value`, `defaultValue`, `onValueChange(value, eventDetails)`, `name`,
  `form`, `disabled`, `readOnly`, `required`, and `inputRef`. OwsemUI adds `size` (`"sm"`, `"md"`,
  the default, or `"lg"`: Button's fonts and heights). Name it with `aria-label` or
  `aria-labelledby`. In a `<form>`, `name` submits the value.
- `Radio.Root` draws its `Radio.Indicator` with no children; children replace it. The Indicator is
  mounted only while checked, unless `keepMounted`. Empty, it is the dot; a glyph as its children
  replaces the dot: `<Radio.Root value="a"><Radio.Indicator><Check /></Radio.Indicator></Radio.Root>`.
- A row is a `label` holding a radio, at any depth. A press on it picks the option, and Glide lights
  it on hover; do not add a hover style. A radio with no label row (including `<label htmlFor>`
  beside it) gets no row styling and no Glide: give it an `aria-label` or that label.
- The group has no width and no margin, and is a flex column. Lay it out with plain CSS or a utility
  on `className` (`flex-flow: row wrap`, or a grid); Glide follows, so do not add an orientation
  prop. Base UI's arrows already work in both directions and pick as they move; do not add your own.
- States: `data-checked`, `data-unchecked`, `data-disabled`, `data-readonly` on the radio and the
  Indicator; `data-size` and `data-disabled` on the group; `data-glide-active` on the lit row.
- Sizes are in `em`, so `font-size` scales it all. `--py` sets the rows' height, on the group or a
  row, and `--icon` the circle, on the radio, through `style`.
- Off is a 10% tint of the text color (13% on hover, 16% held), with no edge.
- Reads `--ow-fg` (the tint), `--ow-accent` and `--ow-primary-shadow` (on), `--ow-on-accent` (the
  dot), `--ow-muted`, `--ow-focus`, `--ow-edge` (high contrast),
  `--ow-hover` and `--ow-radius` (Glide).

### Separator

```tsx
import { Separator } from "owsem-ui/base"; // or "@/components/owsem/separator"
<Separator />
<Separator orientation="vertical" />
```

- Renders `<div role="separator">` with `aria-orientation`, `data-orientation`, and the
  `ow-separator` class: one 1 px hairline, a border in the line color. Not
  focusable, with no keyboard interaction. Use it instead of `<hr>` or a bordered `div`.
- Props: `orientation` (`"horizontal"`, the default, or `"vertical"`), `className` (a string or
  `(state) => string`), `style`, and `render`. Other props pass through to Base UI. The ref goes
  to the `div`.
- Reads `--ow-line`.

### Kbd

```tsx
import { Kbd } from "owsem-ui/base"; // or "@/components/owsem/kbd"
<p>Press <Kbd>⌘K</Kbd> to search.</p>
```

- Renders `<kbd class="ow-kbd">`: a small keycap, an 8% tint of the text color with no edge, 0.75 of the
  surrounding text size, so it fits a sentence, a field, or the end of a list row. Not focusable.
  Use it for any key or shortcut shown to people, instead of a styled `<kbd>`.
- Props: `className`, `style`, and `render`; other props pass through to the `kbd`, which gets the
  ref.
- Hide a purely visual hint with `aria-hidden` when the control names its shortcut with
  `aria-keyshortcuts`.
- Reads `--ow-fg` (the tint), `--ow-muted`, and `--ow-radius`.

### Tabs

One panel at a time, picked from a row of tabs: a flat list (a tint of the text color, no edge or
shadow) with an accent-tint key, the same as Toggle Group's thumb, that slides under the active tab,
whose text turns accent. Registry item: `tabs`.

```tsx
import { Tabs } from "owsem-ui/base"; // or "@/components/owsem/tabs"
<Tabs.Root defaultValue="overview">
  <Tabs.List aria-label="Project">
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="activity">Activity</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview">The project at a glance.</Tabs.Panel>
  <Tabs.Panel value="activity">What happened lately.</Tabs.Panel>
</Tabs.Root>
```

- `Root` takes Base UI's `value`, `defaultValue`, `onValueChange`, and `orientation`. Without
  `defaultValue`, the first enabled tab is picked once the page runs, so the server's HTML has no
  panel: set it on server-rendered pages.
- `List` takes `size` (`"sm"`, `"md"`, the default, or `"lg"`), `activateOnFocus` (arrows pick as they
  move; by default they only move focus, and Enter or Space picks), and `loopFocus`. It draws the
  indicator and Glide's highlight itself: Base UI's `Tabs.Indicator` is not exported, and nothing else
  needs wiring. Name it with `aria-label` or `aria-labelledby`.
- `List` fits its content, and scrolls sideways with no scrollbar when it does not fit. To stretch it,
  use plain CSS on a `className`; the key follows. Equal tabs are `.my-tabs .ow-tabs__list { inline-size:
  100%; }` and `.my-tabs .ow-tabs__tab { flex: 1; }`. There is no `equal` prop.
- `Tab` holds any node, such as an `svg` with text (sized to the font plus 2px); give one with only an
  icon an `aria-label`, and it is square. `render` makes it a link: `nativeButton={false}
  render={<a href="/docs" />}`.
- `Panel` has no padding or margin. Do not set `display` on a panel's own class, which would beat the
  `hidden` attribute that hides it: put your grid or flex on a child. It is a tab stop for scrolling;
  give it `tabIndex={-1}` if it starts with something focusable.
- Reads `--ow-fg` (the list's tint), `--ow-accent` and `--ow-raised-bg` (the indicator),
  `--ow-fg`, `--ow-muted`, `--ow-focus`, `--ow-hover` (Glide), and `--ow-radius`. Set
  them on the root, on one part, or around it. A tab's height is its own `--py`.

### Switch

An on/off setting that applies right away: a 10% tint of the text color while off (13% on hover),
the accent while on, and a white key with the surface shadow as its thumb, which moves on a
spring, stretches mid-travel, and squashes while held. Registry item: `switch`.

```tsx
import { Switch } from "owsem-ui/base"; // or "@/components/owsem/switch"
<Switch.Root aria-label="Wi-Fi" />
<label><Switch.Root defaultChecked /> Email alerts</label>
<Switch.Root checked={dark} onCheckedChange={setDark} aria-label="Dark mode">
  <Switch.Thumb>{dark ? <Moon aria-hidden /> : <Sun aria-hidden />}</Switch.Thumb>
</Switch.Root>
```

- `Root` is Base UI's Switch: a `<span role="switch">` with `aria-checked`, `data-checked` or
  `data-unchecked`, and a hidden input beside it. Controlled with `checked` and
  `onCheckedChange(checked, eventDetails)`, or uncontrolled with `defaultChecked`, plus `disabled`,
  `readOnly`, `required`, and, for a plain `<form>`, `name`, `value`, and `uncheckedValue`.
- Without children `Root` draws its `Thumb`; children replace it. Any icon in the thumb fills the key
  less 2px; it is decorative, so give it `aria-hidden`.
- It needs a name: a wrapping `<label>` or an `aria-label`. Keep it the same in both states.
- `size` is `"sm"`, `"md"` (default), or `"lg"`: Button's fonts, for 46 × 27, 48 × 28, or 52 × 30
  px. Sizes come from `em`, so `font-size` on the switch scales all of it. `inline-size` and
  `block-size` set with plain CSS or a utility also work: the thumb's size and travel follow the
  track. The press target stays at least 24 px.
- Reads `--ow-fg` (the off track and the icon), `--ow-accent` and `--ow-primary-shadow` (on),
  `--ow-on-accent` (the thumb) and `--ow-surface-shadow` (its shadow), `--ow-edge` (high contrast), `--ow-radius`,
  `--ow-motion-scale`, and `--ow-focus`.

### Toggle

A two-state button: flat with muted text while off, a 14% tint of the accent with accent text while
on (18% on hover, 22% held). Registry
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
- Reads `--ow-muted` (text while off), `--ow-hover`, `--ow-fg` (text, and the tint while on),
  `--ow-radius`, and `--ow-focus`.

### Toggle Group

Toggle buttons that work as one, and the segmented control: a flat track (a tint of the text
color), with a thumb (an accent tint, with accent text on the item) that slides to the pressed item. Registry item: `toggle-group`.

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
- Reads `--ow-fg` (the track's tint, which has no edge), `--ow-accent` and `--ow-raised-bg` (the thumb, and pressed items with `multiple`), `--ow-fg`, `--ow-muted`,
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
  passed to `render` keeps its own look: an accent tint while on.
- On/off items: pass a Toggle to `render` (`render={<Toggle pressed={on} onPressedChange={setOn} />}`)
  and keep the item's other props on `Toolbar.Button`. A Base UI popup trigger goes the same way
  (`render={<Menu.Trigger />}`).
- `Input` is a 6% tint of the text color with no edge (9% on hover), as tall as the buttons; put at most one, last, since arrows move its caret. Its `size` is the type scale, not a
  width: set `inline-size` in CSS.
- `Separator` is a hairline across the toolbar's direction; `Group` takes an `aria-label`.
- The bar is 32, 40, or 48px tall (`sm`, `md`, `lg`); its items are 24, 32, or 40px, inside a 4px
  padding.
- Reads `--ow-panel` and `--ow-surface-shadow` (the bar), `--ow-muted`, `--ow-fg` (text, and the field's
  tint), `--ow-hover`, `--ow-pressed-bg` (held buttons and links), `--ow-line` (separators), `--ow-radius`, and `--ow-focus`.

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
- Reads `--ow-panel` and `--ow-surface-shadow` (the panel, and the checkerboard behind translucent
  colors with `--ow-line`), `--ow-raised-bg` and `--ow-popup-shadow` (the popover), `--ow-fg` (the
  trigger's, fields', and keys' tints, 6% and 9%), `--ow-edge` (high contrast), `--ow-line` (over the swatches), `--ow-fg`, `--ow-muted`, `--ow-focus`, and
  `--ow-radius`. The popover's panel is
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
  `onValueChange` hold the query. Root also takes Dialog's `open`, `onOpenChange`, and `modal`. While
  it is open the page's scroll is held without an `overflow` style; do not add a scroll lock of your own.
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
- Reads `--ow-raised-bg` (the glass, at 80%), `--ow-popup-shadow`, `--ow-backdrop` (the scrim),
  `--ow-fg`, `--ow-muted`, `--ow-focus`, `--ow-hover` (the highlight), `--ow-radius`,
  `--ow-fg` (the Trigger's tint), and `--ow-line` (the hairlines over and under the list). The Popup renders in
  the body: set them on `:root` or on the Popup. Its width is `min(100%, 560px)`; set
  `inline-size` on the Popup to change it. The panel is glass with the popup shadow and no edge, the
  Trigger a flat tint; do not add edges, inset blurs, or glow.

### Sidebar

Site navigation: small uppercase group labels over one-line rows indented by a gutter, a pill in
the gutter marking the current page, and Glide's highlight between the others. Registry item: `sidebar`.

```tsx
import { Sidebar } from "owsem-ui/owsem"; // or "@/components/owsem/sidebar"
<Sidebar.Provider>
  <Sidebar.Root aria-label="Docs">
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Display</Sidebar.GroupLabel>
        <Sidebar.List>
          <Sidebar.Item href="/button" active>Button</Sidebar.Item>
          <Sidebar.Item href="/badge">Badge<Sidebar.ItemBadge>New</Sidebar.ItemBadge></Sidebar.Item>
          <Sidebar.Item disabled>Soon</Sidebar.Item>
        </Sidebar.List>
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar.Root>
  <main>
    <Sidebar.Trigger />
  </main>
</Sidebar.Provider>
```

- Parts: `Provider`, `Root` (`nav`), `Header`, `Content` (the scroller), `Footer`, `Group`,
  `GroupLabel`, `List`, `Item` (`li` with an `<a>`; every prop goes to the link, `render` swaps it
  for a router link; text children are truncated), `ItemIcon`, `ItemBadge`, `Indicator`, `Trigger`, and the
  `useSidebar()` hook (`open`, `setOpen`, `toggle`, `mobile`, `mobileOpen`, `setMobileOpen`).
- `Provider` takes `open`/`defaultOpen`/`onOpenChange` (desktop), `mobileOpen`/`defaultMobileOpen`/
  `onMobileOpenChange`, `mobileQuery` (default `(max-width: 767px)`, the drawer), and `shortcut`
  (Ctrl or Cmd with `b`; `false` turns it off). It renders a flex `div` with
  `data-sidebar-state="open|closed"` and `data-sidebar-mobile`: lay the page out from those.
- Desktop, closed: slides out, fades, and is `inert`, but keeps its box, so the page reclaims the
  space itself. Mobile: a modal drawer (Base UI Dialog) that closes on Esc, the scrim, and when an
  item is followed. Width is the Root's `inline-size` (default 248px).
- The current item (`active` or `aria-current="page"`) gets `data-active` and scrolls into view in
  `Content` only. Render `<Sidebar.Indicator />` once inside `Content`: a pill in the gutter that
  travels to the active item (stretching from its leading edge), jumps to a clicked item at once
  and returns after 3 s if `active` does not follow.
- Reads `--ow-fg`, `--ow-muted`, `--ow-hover`, `--ow-focus`, `--ow-radius`, `--ow-raised-bg`,
  `--ow-popup-shadow`, and `--ow-backdrop`.

### Table

A clean card for tabular data: muted header row on a faint tint, hairlines between rows, no vertical
lines. Registry item: `table`.

```tsx
import { Table } from "owsem-ui/owsem"; // or "@/components/owsem/table"
<Table.Root>
  <Table.Caption>Plans</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head>Plan</Table.Head>
      <Table.Head>Price</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Free</Table.Cell>
      <Table.Cell>$0</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>
```

- Parts: `Root` (the card, a `div`), `Caption`, `Header`, `Body`, `Footer`, `Row`, `Head` (`th`,
  `scope="col"` in the header, `"row"` elsewhere), `Cell`. Every part takes `className`, `style`,
  `ref`, and `render`; `Root` also takes `tableProps` for the inner `<table>`.
- `Caption` is a small title above the card (`visuallyHidden` keeps only the name). Stack tables
  with a Caption or a heading before each, so they do not read as one.
- Wider than the card, it scrolls inside with a hidden scrollbar and edge fades
  (`data-overflow-start`/`-end`) and is focusable then. `aria-label`/`aria-labelledby` on `Root`
  name that scroller (else the Caption does).
- `layout`: `"auto"` (default, stacks under `stackBelow`, 480 px, measured on the Root), `"table"`,
  or `"stack"`. Stacked: the first cell titles the row, the others show their column's `Head` text,
  and the header row stays for screen readers. `size="sm"` tightens the cells.
- Reads `--ow-panel`, `--ow-surface-shadow`, `--ow-radius`, `--ow-fg`, `--ow-muted`, `--ow-line`,
  and `--ow-focus`. It does not style `code` in cells; do that in your CSS.

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

### Code Block

Code on one surface: a header with one icon, a title or tabs, and Copy, over the code. Registry
item: `code-block` (installs Copy Button, Button, Icon Morph, and Tooltip too).

```tsx
import { CodeBlock } from "owsem-ui/owsem"; // or "@/components/owsem/code-block"
<CodeBlock.Root>
  <CodeBlock.Header>
    <CodeBlock.Title icon={<FileCode />}>greet.ts</CodeBlock.Title>
    <CodeBlock.Copy />
  </CodeBlock.Header>
  <CodeBlock.Panel>{highlightedPre}</CodeBlock.Panel>
</CodeBlock.Root>

<CodeBlock.Root defaultValue="tsx">
  <CodeBlock.Header>
    <CodeBlock.List aria-label="Files">
      <CodeBlock.Tab value="tsx" icon={<Atom />}>Button.tsx</CodeBlock.Tab>
      <CodeBlock.Tab value="css" icon={<Palette />}>button.css</CodeBlock.Tab>
    </CodeBlock.List>
    <CodeBlock.Copy />
  </CodeBlock.Header>
  <CodeBlock.Panel value="tsx">{tsx}</CodeBlock.Panel>
  <CodeBlock.Panel value="css">{css}</CodeBlock.Panel>
</CodeBlock.Root>
```

- It does not highlight code. Give each Panel a `<pre>` highlighted already (Shiki at build time,
  for example), with no background of its own, so the panel shows.
- `Root` is Base UI's Tabs root (`value`, `defaultValue`, `onValueChange`); `List` and `Tab` are
  Base UI's Tabs list and tab (arrow keys pick as they move; `activateOnFocus` defaults to true);
  `Panel` takes the tab's `value`, or none for a single snippet. Name the List with `aria-label`.
- One leading icon: `Title`'s `icon`, or the active `Tab`'s `icon`, which morphs into the next
  tab's (Icon Morph). Tabs whose icons share a `key` keep one icon still. Do not add icons inside
  the tabs.
- `Copy` is a Copy Button (`size="sm"`, icon only, always in view, named by its Tooltip) that copies
  the Panel on show; pass `value` for other text, such as a command without its prompt, and
  `showLabel` for the word beside the icon.
- Long lines scroll inside the Panel, never the page; a single Panel that overflows becomes a
  focusable region named by the Title. Code reads left to right on any page. Tabs that do not fit
  scroll sideways in the header.
- An accent-tint key slides under the active tab; the Panel has no fill of its own.
- Reads `--ow-panel` and `--ow-surface-shadow` (the surface, with no edge), `--ow-accent` (the key), `--ow-radius` (the block; tabs, the thumb, and Glide take it
  less 4px), `--ow-fg`, `--ow-muted`, `--ow-hover`, `--ow-focus`, and `--ow-font-mono` for the code.

### Copy Button

A Button that copies text: its copy icon morphs into a check that draws itself in, then back.
Registry item: `copy-button` (installs Button, Icon Morph, and Tooltip too).

```tsx
import { CopyButton } from "owsem-ui/owsem"; // or "@/components/owsem/copy-button"
<CopyButton value={url} />
<CopyButton value={() => editor.getValue()} showLabel variant="outline" size="sm" />
<CopyButton value={token} labels={{ copy: "Salin", copied: "Tersalin" }} onError={showFallback} />
```

- `value` (a string, or a function read at the moment of the press), `timeout` (ms the check shows,
  1600), `labels` (`copy`, `copied`; translate them), `showLabel` (the word beside the icon; both
  words hold the width), `duration` (a CSS time such as `"300ms"` for the icon swap and the check
  drawing in), `onCopy(text)`, `onError(error)`. Every Button prop passes through except
  `startIcon`, `endIcon`, `children`, and `loading`; `variant` defaults to `"ghost"`.
- Icon only by default, named by `labels.copy` through `aria-label`, inside OwsemUI's Tooltip: it
  says `labels.copy` on hover and keyboard focus, `labels.copied` after a press, stays open while
  the check shows, and closes when the icon is back. Do not wrap it in another Tooltip. A visually
  hidden `role="status"` after the button announces `labels.copied`; do not add a toast or change
  the name yourself. While it shows the check it sets `data-copied` and `aria-disabled="true"`, and
  a press does not copy again until `timeout` ends.
- It writes with `navigator.clipboard.writeText` and shows the check only once that succeeds. A
  refusal, or no Clipboard API (not a secure context), calls `onError` and shows nothing; there is
  no `execCommand` fallback. `preventDefault()` in `onClick` skips the copy.
- Reads the Button's tokens, plus `--ow-spring-settle` and its duration (the swap and the check
  drawing in; `duration` overrides it for one button), `--ow-motion-scale`, and the Tooltip's
  `--ow-tooltip-bg` and `--ow-tooltip-fg`.

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
- `duration` sets one swap's length as a CSS time, such as `"300ms"` (the spring keeps its curve);
  it lands as `--_duration` in the root's inline style, so the button around it keeps its press.
- Root is a `span` (`className`, `style`, ref, and other props pass through). In the icon slot of a
  Button, Toggle, or Toolbar item it fills the slot, so do not size the icons there; elsewhere each
  icon keeps its own size.
- It adds no role or name. Name the control after what it does now, or keep one name with
  `aria-pressed`; the leaving icon is `aria-hidden`. Announce a change such as a copy in a status
  region.
- Reads `--ow-motion-scale` (how far icons shrink and blur; 0 only fades), `--ow-spring-settle` and
  `--ow-spring-settle-duration` (the swap), and `--ow-ease-out` (the crossfade under reduced
  motion). Set them on `.ow-icon-morph` itself, or use `duration`: the settle spring also times
  button presses.

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
   forced colors. Do not replace borders with backgrounds or shadows. Controls have no edge by default; keep
   the `prefers-contrast: more` edges and the transparent outline that forced colors draws.
6. **Do not use what is not built.** The `owsem` CLI (`init`, `add`, `diff`), isolated token mode,
   and custom token prefixes are planned, not released. Registry copies keep the `--ow-` prefix.
