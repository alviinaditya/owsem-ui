import { defineCommand } from "citty";
import { notImplemented } from "./not-implemented.ts";

export const add = defineCommand({
  meta: {
    name: "add",
    description: "Fetch registry items and write component files into the project.",
  },
  run: () => notImplemented("add"),
});
