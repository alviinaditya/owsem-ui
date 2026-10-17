import { defineCommand } from "citty";
import { notImplemented } from "./not-implemented.ts";

export const list = defineCommand({
  meta: { name: "list", description: "List every component with its family and status." },
  run: () => notImplemented("list"),
});
