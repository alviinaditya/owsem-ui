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

Vitest in `packages/ui` has two projects:

| Project | Files | Engines |
| --- | --- | --- |
| `unit` | `*.test.tsx` | Chromium |
| `geometry` | `*.geometry.test.tsx` | `OWSEM_BROWSERS`, default `chromium,firefox`; CI uses `chromium,firefox,webkit` |

WebKit does not run on Arch; leave it to CI. Visual regression tests (a Chromium-only `vrt`
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

## Docs languages

The docs site is available in Indonesian (`id`, default) and English (`en`). Every page URL
starts with the language (`/id/docs`, `/en/docs`); `proxy.ts` redirects unprefixed URLs based on
`Accept-Language`. To add a language:

1. Add its code to `languages` and `languageNames` in `apps/docs/lib/i18n.ts`.
2. Add `apps/docs/lib/dictionaries/<code>.ts` and register it in `lib/dictionaries/index.ts`; the
   type check fails until every string exists.
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

Components live in `packages/ui/src/components/<component>/`, and the build (`tsdown.config.ts`)
picks up this folder automatically. With the **first** component:

- add the `./components/*` and `./css/*.css` subpaths to `exports` in `packages/ui/package.json`
  (publint rejects wildcard patterns that match no file);
- add per-component size budgets to `.size-limit.mjs` (Base 3 kB, Owsem 8 kB);
- extend `apps/docs/scripts/build-registry.ts` with component items (`<name>` and `<name>-owsem`),
  including rewriting Core imports to `@/lib/owsem` (CLI-6 in the PRD).

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

Both packages are versioned independently. Releases go through the `release.yml` workflow.

## Releases

`release.yml` opens a `chore(release): version packages` PR from the changesets, then publishes to
npm with trusted publishing (OIDC) once that PR is merged. One-time setup before the first CI
release:

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

PRs opened with `GITHUB_TOKEN` do not trigger CI. If CI checks are required on `main`, create a
GitHub App with contents and pull requests (write) permissions, then set the repository variable
`RELEASE_APP_ID` and secret `RELEASE_APP_PRIVATE_KEY`. Also enable "Allow GitHub Actions to create
and approve pull requests".
