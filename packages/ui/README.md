# owsem-ui

React components in the Base and Owsem families, built on [Base UI](https://base-ui.com).

> Status: early. No components have been released yet.

```sh
pnpm add owsem-ui
```

```ts
import "owsem-ui/styles.css";
```

The package is ESM-only. JavaScript never imports CSS: load `owsem-ui/styles.css` once, or
`owsem-ui/tokens.css` plus `owsem-ui/css/<component>.css`. Peers: `react` and `react-dom`
`^18.2.0 || ^19.0.0`.

## Themes

Light and dark ship with every token. Without `data-theme` the theme follows the system
(`prefers-color-scheme`); set `data-theme="light"` or `data-theme="dark"` on `<html>` or any
element to force one for that subtree.

## TypeScript

Next.js and Vite already declare `.css` imports. In other setups with TypeScript 6 or 7, add
`declare module "*.css";` to a `.d.ts` file so `import "owsem-ui/styles.css"` type-checks.

MIT license.
