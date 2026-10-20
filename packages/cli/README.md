# owsem

The OwsemUI CLI copies components from the registry into your project.

> Status: early. Commands are not implemented yet.

```sh
npx owsem init
npx owsem add button
```

| Command | Purpose |
| --- | --- |
| `owsem init` | Choose the token mode and prefix, then write `owsem.json` and `tokens.css` |
| `owsem add <name>` | Fetch a registry item and write the component files |
| `owsem diff [name]` | Compare local files with the latest registry version |
| `owsem list` | List every component with its family and status |
| `owsem tokens` | Rewrite `tokens.css` after changing the mode or prefix |

Requires Node.js 22.12 or later. MIT license.
