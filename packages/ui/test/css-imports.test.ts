import { expect, test } from "vitest";

// css/<component>.css must be self-contained: JS never imports CSS in the npm package, so a page
// that loads only css/toast.css gets Button's look for the Toast's buttons only if toast.css
// imports button.css. A component's CSS imports the CSS of each sibling its code uses.

const sheets = import.meta.glob<string>("../src/components/*/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});
const sources = import.meta.glob<string>(
  [
    "../src/components/*/*.{ts,tsx}",
    "!../src/components/*/*.{test,geometry.test,tailwind}.{ts,tsx}",
  ],
  { query: "?raw", import: "default", eager: true },
);

const folderOf = (path: string) => /components\/([^/]+)\//.exec(path)?.[1] ?? "";

/** The CSS files of each component folder, by folder name. */
const cssByFolder = new Map<string, string[]>();
for (const path of Object.keys(sheets)) {
  const folder = folderOf(path);
  cssByFolder.set(folder, [...(cssByFolder.get(folder) ?? []), path]);
}

/** Folders a file imports code from (type-only imports draw nothing). */
function siblingsUsed(code: string): Set<string> {
  const found = new Set<string>();
  const pattern = /^(?:import|export)\s+(?!type\b)[^;]*?from\s+["']\.\.\/([a-z0-9-]+)\//gm;
  for (const [, folder = ""] of code.matchAll(pattern)) found.add(folder);
  return found;
}

test("every component's CSS imports the CSS of the siblings its code uses", () => {
  const missing: string[] = [];
  for (const [folder, files] of cssByFolder) {
    const own = files.map((file) => sheets[file] ?? "").join("\n");
    const imported = new Set(
      [...own.matchAll(/@import\s+["']\.\.\/([a-z0-9-]+)\/[^"']+\.css["']/g)].map((m) => m[1]),
    );
    const used = new Set<string>();
    for (const [path, code] of Object.entries(sources)) {
      if (folderOf(path) === folder) for (const dep of siblingsUsed(code)) used.add(dep);
    }
    for (const dep of used) {
      if (dep !== folder && cssByFolder.has(dep) && !imported.has(dep)) {
        missing.push(`${folder}.css does not import ${dep}'s CSS`);
      }
    }
  }
  expect(missing).toEqual([]);
});

test("a CSS import names a file that exists", () => {
  const bad: string[] = [];
  for (const [path, css] of Object.entries(sheets)) {
    for (const [, target = ""] of css.matchAll(/@import\s+["'](\.{1,2}\/[^"']+)["']/g)) {
      const resolved = new URL(target, `file:///x/${path.replace("../", "")}`).pathname;
      if (!Object.keys(sheets).some((file) => resolved.endsWith(file.replace("..", "")))) {
        bad.push(`${path} imports ${target}`);
      }
    }
  }
  expect(bad).toEqual([]);
});
