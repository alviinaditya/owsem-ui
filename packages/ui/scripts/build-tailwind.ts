/**
 * Writes the Tailwind CSS v4 version of the components to src/tailwind/ (see tailwind-files.ts).
 * Run directly by Node (type stripping), so only erasable TypeScript here and in its imports.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { generate, type Sources } from "./tailwind-files.ts";

const src = join(dirname(fileURLToPath(import.meta.url)), "../src");
const out = join(src, "tailwind");

/** The files under a folder of src/, by path under src/. */
const read = (dir: string): Sources =>
  Object.fromEntries(
    readdirSync(join(src, dir), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .map((path) => [relative(src, path), readFileSync(path, "utf8")]),
  );

const files = generate({ ...read("components"), ...read("core"), ...read("tailwind-src") });
rmSync(out, { recursive: true, force: true });
for (const [path, code] of Object.entries(files)) {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), code);
}
console.log(`Wrote ${Object.keys(files).length} files to src/tailwind/.`);
