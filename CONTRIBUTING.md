# Contributing

## Prerequisites

- **Node.js 26** (`.node-version`). Supported ranges are in the root `engines`, enforced by pnpm
  (`engineStrict`).
- **pnpm 12**, installed with the [pnpm installer](https://pnpm.io/installation). Node 25+ no
  longer bundles Corepack; pnpm switches to the version in `packageManager` by itself.
- **Browsers for tests.** Component tests run in real Chromium (Vitest browser mode), and geometry
  tests also run in Firefox:

  ```sh
  pnpm --filter owsem-ui exec playwright install --only-shell chromium firefox
  ```

  On distros Playwright does not support officially (e.g. Arch), skip `--with-deps`. As a
  fallback, use the system Chrome: `OWSEM_CHROMIUM_PATH=/usr/bin/google-chrome-stable pnpm test`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Docs (`next dev`) and `owsem-ui` (`tsdown --watch`) |
| `pnpm build` | Build every package and the docs |
| `pnpm lint` / `pnpm lint:fix` | Biome (lint and format) |
| `pnpm typecheck` | TypeScript 7 (`tsc`) per package |
| `pnpm test` | Vitest: components in the browser, the CLI in Node |
| `pnpm test:e2e` | Playwright Test for the docs |
| `pnpm size` | Size budgets (size-limit, gzip) |
| `pnpm lint:pkg` | publint and attw on the `pnpm pack` tarball |
| `pnpm registry:build` | shadcn registry into `apps/docs/public/r` |
| `pnpm verify` | Every CI check above except e2e |

Do not add a script named `ci`: `pnpm ci` always runs pnpm's built-in command.

## Tests

Vitest in `packages/ui` has three projects:

| Project | Files | Engines |
| --- | --- | --- |
| `unit` | `*.test.tsx` | Chromium |
| `react18` | `src/**/*.test.tsx` on React 18.2 (aliased `react-18`, `react-dom-18`), the lowest peer | Chromium |
| `geometry` | `*.geometry.test.tsx` | `OWSEM_BROWSERS`, default `chromium,firefox`; CI uses `chromium,firefox,webkit` |

WebKit does not run on Arch; leave it to CI. The first run after importing a new Base UI entry point
can fail with `Cannot read properties of null (reading 'useRef')`: Vite re-bundled dependencies
mid-run. Run the tests again. Visual regression tests (a Chromium-only `vrt`
project for `*.vrt.test.tsx`) arrive with the first visual test, together with the
`workflow_dispatch` job that updates the baselines in CI. Baselines are never created locally,
since rendering differs between machines.

## CSS

Biome checks CSS in `packages/ui` with `useLogicalProperties` (FR-16) and `useBaseline` for
Baseline 2023 (NF-1), both as errors. Features beyond Baseline 2023 are progressive enhancement
only, and each use is marked:

```css
/* biome-ignore lint/nursery/useBaseline: progressive enhancement (NF-1) */
```

## Themes

Tokens in `packages/ui/src/core/tokens/tokens.css` come in a light and a dark set. Without
`data-theme` the system preference applies; `data-theme="light"` or `"dark"` forces one on any
subtree. The dark set is written twice (media query and `[data-theme="dark"]`); a test fails if
they drift. The docs site stores the visitor's choice (light, dark, or system) in `localStorage`
and applies it from an inline `<head>` script before first paint.

The theme tokens are the only public tokens (TK-9). Component CSS reads them directly: no
component tokens such as `--ow-menu-bg`, and no fallbacks such as `var(--ow-panel, #fff)`, since
`tokens.css` always ships with the components. A value without a token is derived from one:
inner radii from `--ow-radius` (FR-10b), tints with `color-mix()` from `--ow-fg` or `--ow-accent`.
Add a theme token only for a theming value (color, radius, shadow, font, motion) that no token
gives and that more than one component needs. `test/theming.test.ts` fails on any other `--ow-*`
name, a fallback, or a literal color, radius, or font. A literal that is not theming, such as a
color picker's hue spectrum, takes a `/* literal: <reason> */` comment right before it.

## Class names and states

Class names follow BEM blocks and elements; modifiers are data attributes (FR-6b).

- The block is the component's folder name. The root part takes `.ow-<block>`, and every other
  part `.ow-<block>__<element>`, also when it renders outside the root (a portal) or is drawn by a
  script (an SVG rail). The element is the Base UI part name in kebab case where there is one
  (`__positioner`, `__group-label`); an element inside an element joins with a hyphen
  (`__item-label`), never a second `__`.
- A part is found by its class, in CSS and in scripts. No `--modifier` classes and no
  `data-part`: variants and states are data attributes, Base UI's own (`data-pressed` for a toggle
  that is on, `data-highlighted`, `data-side`) or OwsemUI's (`data-variant`, `data-size`).
- One meaning, one name: `data-held` while the pointer holds a control down (never
  `data-pressed`, which Base UI uses for on), `data-visible` while an indicator shows, and
  `data-instant` for a change without a transition.
- Keyframes are named after the block too: `ow-<block>-<name>`, such as
  `ow-tree-rail-nav-marquee`.
- The classes and the states in a Lab's parts table are public. Other data attributes are
  private, like `--_*` properties.

`test/naming.test.ts` fails on a class outside this pattern, a class in a folder that is not its
block, CSS for a class no component renders, keyframes named after another block, and
`data-part`.

## Icons

Icons come from [Lucide](https://lucide.dev) (ISC). Copy an icon's inner SVG elements into the
code under its Lucide name rather than adding a dependency; the docs keep theirs in
`apps/docs/components/icons/icon.tsx`, beside Lucide's `LICENSE`. Anything that ships Lucide
paths (the package, registry items) ships that notice too. Icons are `aria-hidden`; whatever
shows one also has a text name.

## Docs languages

The docs site is available in Indonesian (`id`, default) and English (`en`). Every page URL
starts with the language (`/id/docs`, `/en/docs`); `proxy.ts` redirects unprefixed URLs based on
`Accept-Language`. To add a language:

1. Add its code to `languages` and `languageNames` in `apps/docs/lib/i18n.ts`.
2. Add `apps/docs/lib/dictionaries/<code>.ts` and register it in `lib/dictionaries/index.ts`; the
   type check fails until every string exists, including each component's description.
3. Translate pages into `content/docs/<code>/` and `content/labs/<code>/`. Untranslated pages fall
   back to Indonesian.

## Dependencies

- Versions used by more than one package live once in `catalog` in `pnpm-workspace.yaml` and are
  referenced with `catalog:`.
- pnpm rejects releases younger than 24 hours (`minimumReleaseAge`), so a range's lower bound must
  be at least that old.
- Dependencies with build scripts must be listed in `allowBuilds`.
- Add a dependency in the change that first imports it.

## Adding components

Every v1.0 component is listed in `apps/docs/lib/catalog.ts` (name, family, category, phase,
status), and its one-line description is in each docs dictionary. Planned components get a Coming
soon page; the docs and registry builds fail if an available component lacks its folder or Lab.

To build one, use Separator as the reference:

1. Create `packages/ui/src/components/<name>/`:

   | File | Contents |
   | --- | --- |
   | `<name>.tsx` | Styled Base UI parts. Imports its own CSS; class names are constants (FR-6a) |
   | `<name>.css` | Layer order first, rules in `@layer owsem.components`, theme tokens read directly (TK-9) |
   | `<name>.test.tsx` | Behavior, tokens in light and dark, forced colors, axe, and idle cost |
   | `index.ts` | Public exports |

2. Export it from `src/base.ts` or `src/owsem.ts`, import its CSS in `src/styles.css`, and add a
   size budget to `.size-limit.mjs` (Base 3 kB, Owsem 8 kB; the Core it uses counts once, in the
   core entry).
3. Build its Lab (see below), then set its `status` in the catalog to `prototype` and add a
   changeset.
4. Add it to "Components available now" in `skills/owsem-ui/SKILL.md`, the agent skill users
   install with `npx skills add` (documented on the docs Skills page).
5. If the docs have a hand-built stand-in for it (below), replace the stand-in with the component
   and delete its CSS from `apps/docs/app/globals.css`. The docs are the components' first real
   app.

### Docs stand-ins

Until a component exists, the docs build its job by hand, in the same depth material (flat
`--docs-well`, raised `--docs-raised`, the `--docs-radius*` scale), so the swap is markup and
deleted CSS:

| Phase | Component | Replaces in the docs |
| --- | --- | --- |
| 1 | Button | Copy and Reset (`.ghost-button`), Previous and Next links |
| 1 | Tabs | The code drawer's file tabs (`.lab-tabs`) |
| 1 | Popover | The Token setup panel (`.token-setup`, a native `[popover]`) |
| 1 | Tooltip | `title` hints on icon buttons |
| 1 | Field, Input | The prefix field (`.prefix-field`) and the hex field (`.color-field`) |
| 1 | Scroll Area | `ScrollFade` (sidebar, controls, code drawer, commands) |
| 2 | Toggle Group | Segmented choices (`.seg`): theme, Orientation, Family filter, and the package manager picker (`.pm-picker`) |
| 2 | Toggle, Toolbar | The stage tools (`.lab-tool`) |
| 2 | Toast | The Copied status |
| 2 | Combobox, Dialog | ⌘K search (DS-5), through Command Menu |
| 3 | Drawer | The sidebar as a menu panel below 1100 px, and the Lab's docs, controls, and code sheets below 960 px (DS-10) |

The docs' `--docs-well`, `--docs-raised`, and their shadows point at the library's depth
materials (TK-7), so the docs and the library share one source.

Items in a list (menus, selects, tabs, toggle groups) are lit with Glide from
`src/core/glide/`, not a hover style of their own; a component that moves its highlight with the
keyboard calls `setActive()`.

The package and registry builds pick up the folder automatically. Registry copies rewrite imports
that leave the folder: Core to `@/lib/owsem/...` and other components to
`@/components/owsem/<name>/...` (CLI-6 in the PRD). Every component is one item, `<name>`.

### Materials and motion

Surfaces come from the materials in `tokens.css` (TK-7): `--ow-panel` and `--ow-popup-shadow` for
panels and popups, `--ow-raised-*` for buttons, thumbs, and on states, `--ow-well-*` for tracks and
fields, `--ow-pressed-*` while a control is held down, and `--ow-accent` with `--ow-on-accent` and
`--ow-primary-shadow` for the primary button.
Depth comes from flat fills and crisp 1px edges, drawn as inset shadows so they add no size; never
use soft, blurred, or sunken (inset blur) shadows, which read as neumorphism. Separators and layout
lines stay etched grooves (`--ow-line-dark` over `--ow-line-light`). Base never glows (DP-1).

Motion explains a state change (principle 4), with these rules:

- Ask first whether it should move at all. Anything opened or toggled from the keyboard many times
  a day (a command palette, shortcuts) changes instantly.
- Animate `transform` and `opacity` only (FR-18). Enter and exit with `data-starting-style` and
  `data-ending-style` and CSS transitions (FR-7); never from `scale(0)`, start at 0.95 or more.
- An element that transitions `transform`, `scale`, `translate`, or `rotate` declares `will-change`
  for it (NF-8). Otherwise Chrome draws it on a GPU layer only while it moves, and at a fractional
  zoom (110%) its content lands a device pixel away when the motion ends. `test/layers.test.ts`
  checks every stylesheet.
- Popups scale from their trigger (`transform-origin: var(--transform-origin)`); dialogs stay
  centered.
- Ease with `--ow-ease-out` for entering and leaving, `--ow-ease-in-out` for moving on screen, and
  never `ease-in`. Springs are `--ow-spring-travel`, `--ow-spring-settle` (a press releasing), and
  `--ow-spring-glide`, each with its `-duration` token.
- Keep UI motion short: 100 to 160 ms for a press, 125 to 200 ms for tooltips, 150 to 250 ms for
  menus and popovers, up to 300 ms for dialogs.
- Gate hover motion with `@media (hover: hover) and (pointer: fine)`, and give every animation a
  reduced-motion version without movement (FR-20).

A component has one type. **Base** is a Base UI component with OwsemUI's styling and small
improvements, exported from `src/base.ts` (`owsem-ui/base`). **Owsem** is OwsemUI's own component,
beyond Base UI, exported from `src/owsem.ts` (`owsem-ui/owsem`); Tree Rail Nav is the reference.
There is no `flavor` prop, and glow (Lumen) is for Owsem only.

## Labs

A component page is a Lab: the narrative scrolls beside (or, below 960 px, under) a live stage,
and the scene being read shapes the stage. The sidebar lists the page's scenes under the
component and marks the one being read. Separator is the reference. A Lab has two parts:

- **Narrative:** `apps/docs/content/labs/<lang>/<name>.mdx` for every language. The text before
  the first heading is the overview; each `## Title [#id]` starts a scene. The ids are the same in
  every language and follow one order, which the build checks: up to three signature scenes, then
  `anatomy`, `states`, `keyboard`, `customization` (only for components with tokens), and `ship`.
- **Stage:** `apps/docs/labs/<name>.tsx`, a client module whose default export renders
  `LabShell` with a `defineLab` definition (the demo, the controls, the code files generated from
  the controls and the visitor's token setup, the `parts` Inspect outlines, and per scene what the
  stage shows: `cfg`, `code`, `controls`, `theme`, `inspect`, a `play` script, and a `demo` of
  its own), and is
  registered in `labs/index.ts`. A scene borrows the stage: the visitor's own changes win and stay
  after the scene. Controls are `choice` (a segmented radio group) or `color` (a hex field and the
  browser's picker; `token` names the theme token the component uses until a color is chosen).

The token setup (the stage toolbar's Token button; mode and prefix, DS-4) reaches every Lab: `code(cfg, setup)` writes
token names with `setup.prefix` and any setup but theme with `ow` imports from the owsem CLI's copy,
the install tab switches to the owsem CLI, and `--ow-` in the narrative's code is renamed in the
browser (`data-token-literal` keeps a name as written).

Code is highlighted by Shiki with one theme, `apps/docs/lib/code-theme.ts`, in MDX code blocks
and in the stage's live code alike; its colors are the `--tk-*` tokens in `globals.css`. The code
drawer ends with an Install tab built from the component's registry name.

The docs CSS is unlayered, so docs chrome beats `@layer owsem.*`. Element defaults (`a`, `button`,
`:focus-visible`, headings, tables) are the exception: they sit in `@layer docs-base`, ordered
under owsem-ui by `app/layers.css`, so a component on the stage keeps its own colors and focus
ring. Style the docs by class; a new element default goes in `docs-base`.

The `states` scene compares rather than describes: its `demo` returns a `Matrix`
(`components/lab/matrix.tsx`) of live cells, such as variants by sizes or states by themes.

Each part in `parts` has a selector into the demo, a note, and the theme tokens it reads, each
mapped to the private property that holds the value in use.
In the anatomy table, `<Part name="Root" />` names a part and picks it on the stage.

A `play` script drives the demo through `ScriptStage`: `click` and `point` move a drawn pointer
that sends real pointer events (hover effects react; focus stays put), and `wait` pauses. It plays
once its scene settles, except under reduced motion, where it waits for Play scene or Replay. The
visitor's own press or key stops it where it is; Stop and a scene change remount the demo, so end
a script where it started.

Stage shortcuts (I, T, P, C, and R for Replay) work only while focus is on the
stage; a click anywhere on it puts focus there, and the page header names the ones a Lab has. Play scene and Replay appear only for scenes with an animation; scripted motion uses Motion
(`motion/react`), everything else CSS transitions, and never GSAP. Every animation follows
`prefers-reduced-motion`.

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), in English,
checked by commitlint in the `commit-msg` hook. The scope is optional; if set it must be one of
`ui`, `core`, `base`, `owsem`, `tokens`, `cli`, `registry`, `docs`, `deps`, `release`, `repo`. The
subject starts with a lowercase verb:

```text
feat(ui): add Switch
fix(cli): reject prefixes that start with a digit
```

The `pre-commit` hook runs Biome on staged files. PRs are squash-merged with the PR title as the
commit message on `main`, so CI lints the PR title rather than each commit.

## Changesets

Every change visible to users of `owsem-ui` or `owsem` needs a changeset:

```sh
pnpm changeset
```

Both packages are versioned independently. Releases go through the `release.yml` workflow. The
docs Changelog page reads the pending changesets and each package's `CHANGELOG.md` at build time,
so a changeset's summary is what users read there: write it for them.

## Releases

`release.yml` opens a `chore(release): version packages` PR from the changesets, then publishes to
npm with trusted publishing (OIDC) once that PR is merged. Both jobs are off until the setup below
turns them on, so pushes to `main` stay green before the first release. One-time setup:

1. Keep `repository` in `packages/ui/package.json` and `packages/cli/package.json` matching the
   GitHub repo (`alviinaditya/owsem-ui`) exactly; trusted publishing checks it.
2. Publish the first versions of `owsem-ui` and `owsem` by hand with 2FA. Trusted publishers can
   only be registered for packages that already exist.
3. Create the `npm` environment under Settings > Environments: deployment branch `main` only,
   required reviewers, and no admin bypass.
4. Register the trusted publishers right before the first CI release (unused configurations
   expire after 2 days). `--allow-publish` is required because new configurations only allow
   staged publishing by default, which Changesets does not support:

   ```sh
   npm trust github owsem-ui --repo alviinaditya/owsem-ui --file release.yml --env npm --allow-publish
   npm trust github owsem --repo alviinaditya/owsem-ui --file release.yml --env npm --allow-publish
   ```

5. Set the repository variable `NPM_TRUSTED_PUBLISHING` to `true`. Until then the pack and publish
   jobs are skipped.
6. In each npm package's settings, choose "Require two-factor authentication and disallow tokens".
7. Let the workflow open the version PR. Create a GitHub App with contents and pull requests (write)
   permissions, then set the repository variable `RELEASE_APP_ID` and secret
   `RELEASE_APP_PRIVATE_KEY`: PRs opened with `GITHUB_TOKEN` do not trigger CI, so required checks
   would never run on them. Without an App, enable "Allow GitHub Actions to create and approve pull
   requests" under Settings > Actions > General instead.
8. Set the repository variable `RELEASE_PR` to `true`. Until then the version job is skipped and no
   version PR opens. Merge that PR only when the release should go out: merging it bumps the
   versions.
