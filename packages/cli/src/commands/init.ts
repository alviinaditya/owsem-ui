import { defineCommand } from "citty";
import { notImplemented } from "./not-implemented.ts";

export const init = defineCommand({
  meta: {
    name: "init",
    description: "Choose the token mode and prefix, then write owsem.json and tokens.css.",
  },
  run: () => notImplemented("init"),
});
