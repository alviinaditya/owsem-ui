#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };

const main = defineCommand({
  meta: {
    name: "owsem",
    version: pkg.version,
    description: "Add OwsemUI components to your project from the registry.",
  },
  subCommands: {
    init: () => import("./commands/init.ts").then((m) => m.init),
    add: () => import("./commands/add.ts").then((m) => m.add),
    diff: () => import("./commands/diff.ts").then((m) => m.diff),
    list: () => import("./commands/list.ts").then((m) => m.list),
    tokens: () => import("./commands/tokens.ts").then((m) => m.tokens),
  },
});

await runMain(main);
