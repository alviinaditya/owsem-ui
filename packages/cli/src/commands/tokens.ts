import { defineCommand } from "citty";
import { notImplemented } from "./not-implemented.ts";

export const tokens = defineCommand({
  meta: {
    name: "tokens",
    description: "Rewrite tokens.css after changing the mode or prefix.",
  },
  run: () => notImplemented("tokens"),
});
