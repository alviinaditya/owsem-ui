import { defineCommand } from "citty";
import { notImplemented } from "./not-implemented.ts";

export const diff = defineCommand({
  meta: { name: "diff", description: "Compare local files with the latest registry version." },
  run: () => notImplemented("diff"),
});
