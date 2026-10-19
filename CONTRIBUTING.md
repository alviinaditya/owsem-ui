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
   | `<name>.css` | Layer order first, rules in `@layer owsem.components`, tokens read as component token, then theme token, then a literal |
   | `<name>.test.tsx` | Behavior, tokens in light and dark, forced colors, axe, and idle cost |
   | `index.ts` | Public exports |

2. Export it from `src/base.ts` or `src/owsem.ts`, import its CSS in `src/styles.css`, and add a
   size budget to `.size-limit.mjs` (Base 3 kB, Owsem 8 kB).
3. Build its Lab (see below), then set its `status` in the catalog to `prototype` and add a
   changeset.
4. Add it to "Components available now" in `skills/owsem-ui/SKILL.md`, the agent skill users
   install with `npx skills add` (documented on the docs Skills page).
5. If the docs have a hand-built stand-in for it (below), replace the stand-in with the component
   and delete its CSS from `apps/docs/app/globals.css`. The docs are the components' first real
   app.

### Docs stand-ins

Until a component exists, the docs build its job by hand, in the same depth material (sunken
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
| 2 | Collapsible | The folding preview pane (DS-10) |
| 2 | Combobox, Dialog | ⌘K search (DS-5), through Command Menu |
| 3 | Drawer | The sidebar as a menu panel below 1100 px |

When the depth material tokens land in `tokens.css` (TK-7), point `--docs-well`, `--docs-raised`,
and their shadows at them, so the docs and the library share one source.

The package and registry builds pick up the folder automatically. Registry copies rewrite imports
that leave the folder: Core to `@/lib/owsem/...` and other components to
`@/components/owsem/<name>/...` (CLI-6 in the PRD). The registry build does not support
`base+owsem` components (two items from one source) yet; that arrives with Button.

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
  the controls and the visitor's token setup, and per scene what the stage shows: `cfg`, `code`,
  `controls`, `theme`), and is
  registered in `labs/index.ts`. A scene borrows the stage: the visitor's own changes win and stay
  after the scene. Controls are `choice` (a segmented radio group) or `color` (a hex field and the
  browser's picker; `token` names the theme token the component uses until a color is chosen).

The token setup in the top bar (mode and prefix, DS-4) reaches every Lab: `code(cfg, setup)` writes
token names with `setup.prefix` and any setup but theme with `ow` imports from the owsem CLI's copy,
the install tab switches to the owsem CLI, and `--ow-` in the narrative's code is renamed in the
browser (`data-token-literal` keeps a name as written).

Code is highlighted by Shiki with one theme, `apps/docs/lib/code-theme.ts`, in MDX code blocks
and in the stage's live code alike; its colors are the `--tk-*` tokens in `globals.css`. The code
drawer ends with an Install tab built from the component's registry name.

Stage shortcuts (T, P, C, and H for the pane) work only while focus is on the stage. Play scene
and Replay appear only for scenes with an animation; scripted motion uses Motion
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
