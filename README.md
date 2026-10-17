# OwsemUI

React components in two families, **Base** and **Owsem**, built on [Base UI](https://base-ui.com).
Ships as an npm package (`owsem-ui`) and as a registry you copy from with the `owsem` CLI or
`shadcn`.

> Status: early (setup). No components have been released yet.

## Repository

| Folder | Contents |
| --- | --- |
| `packages/ui` | npm package `owsem-ui`: components, Core, tokens, and CSS |
| `packages/cli` | npm package `owsem`: the `init`, `add`, `diff`, `list`, `tokens` CLI |
| `apps/docs` | Docs site (Next.js + Fumadocs, Indonesian and English) and the registry at `/r` |

## Getting started

Requires Node.js 26 (see `.node-version`) and pnpm 12. The pnpm version is pinned in
`packageManager`.

```sh
pnpm install
pnpm --filter owsem-ui exec playwright install --only-shell chromium firefox   # once, for browser tests
pnpm dev          # docs + owsem-ui in watch mode
pnpm verify       # Biome, build, typecheck, test, size-limit, publint/attw
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

[MIT](./LICENSE)
