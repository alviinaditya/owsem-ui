/**
 * Stages the shadcn registry in apps/docs/.registry from packages/ui sources (DS-7).
 * `registry:build` then runs `shadcn registry validate` and `shadcn build` into public/r.
 * Run directly by Node (type stripping), so only erasable TypeScript here and in its imports.
 *
 * What an item installs is what the Manual install shows (componentFiles), split so that nothing
 * comes along unasked:
 * - `<name>`: a component in the CSS flavor; `<name>-tailwind`: the same in the Tailwind flavor.
 * - `core-<module>`: one Core helper (cn, glide, scroll-lock, ...). A module whose Tailwind copy
 *   differs from the CSS one has a `core-<module>-tailwind` twin.
 * - `tokens`: tokens.css. `tailwind-setup`: tailwind.css, for the Tailwind flavor only.
 * - `core`, `core-tailwind`: meta items that list every module, for people who want all of Core.
 * A component lists only the modules, siblings, and setup its own files import.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import type { Registry, RegistryItem } from "shadcn/schema";
import { catalog, isAvailable } from "../lib/catalog.ts";
import {
  componentFiles,
  type Flavor,
  hasTailwind,
  isSource,
  npmDependencies,
  coreModules as readCoreModules,
  stripRepoHeader,
} from "../lib/component-files.ts";
import { en } from "../lib/dictionaries/en.ts";
import { RESERVED_SLUGS } from "../lib/reserved-slugs.ts";
import { siteUrl } from "../lib/site.ts";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const uiSrc = join(docsDir, "../../packages/ui/src");
const stageDir = join(docsDir, ".registry");
const outDir = join(docsDir, "public/r");

/** Writes a registry copy of a file; shadcn only accepts paths inside stageDir. */
function stage(item: string, to: string, code: string): string {
  const dest = join(stageDir, "src", item, to);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, code);
  return `src/${item}/${to}`;
}

const read = (path: string) => readFileSync(path, "utf8");

const itemNames = new Set<string>();
function assertValidItem(item: RegistryItem): void {
  if (item.name.includes("/") || RESERVED_SLUGS.has(item.name)) {
    throw new Error(`Registry item "${item.name}" must be a flat, non-reserved name.`);
  }
  if (itemNames.has(item.name)) throw new Error(`Registry item "${item.name}" is defined twice.`);
  itemNames.add(item.name);
  // Unnamespaced names resolve to shadcn's own registry.
  for (const dependency of item.registryDependencies ?? []) {
    if (!dependency.startsWith("@owsem/")) {
      throw new Error(
        `${item.name}: registryDependencies "${dependency}" must start with @owsem/.`,
      );
    }
  }
}

// shadcn build never deletes stale files, so start clean.
rmSync(stageDir, { recursive: true, force: true });
rmSync(outDir, { recursive: true, force: true });

const items: RegistryItem[] = [];
const owsem = (name: string) => `@owsem/${name}`;

// Core modules: a top-level file (cn.ts) or folder (glide/) of core/, or its Tailwind copy in
// tailwind/lib/. Files keep their path under lib/owsem/. index.ts only re-exports (Base UI
// providers for npm users); tokens.css and tailwind.css have items of their own.
interface ModuleFile {
  /** Path under lib/owsem/. */
  path: string;
  code: string;
}
const moduleOf = (path: string) => (path.split("/")[0] ?? "").replace(/\.[a-z]+$/, "");

function moduleFiles(flavor: Flavor): Map<string, ModuleFile[]> {
  const modules = new Map<string, ModuleFile[]>();
  const add = (root: string, only: (module: string) => boolean) => {
    const list =
      root === "core"
        ? readCoreModules(uiSrc)
        : readdirSync(join(uiSrc, "tailwind/lib"), { recursive: true, encoding: "utf8" })
            .filter(isSource)
            .map((file) => file.split("\\").join("/"));
    for (const path of list) {
      const module = moduleOf(path);
      if (!only(module)) continue;
      const code = stripRepoHeader(
        read(join(uiSrc, root === "core" ? "core" : "tailwind/lib", path)),
      );
      modules.set(module, [...(modules.get(module) ?? []), { path, code }]);
    }
  };
  if (flavor === "tailwind") add("tailwind", () => true);
  add("core", (module) => flavor === "css" || !modules.has(module));
  return modules;
}

const cssModules = moduleFiles("css");
const twModules = moduleFiles("tailwind");
const sameFiles = (a: ModuleFile[], b: ModuleFile[]) =>
  a.length === b.length &&
  a.every((file, i) => file.path === b[i]?.path && file.code === b[i]?.code);

/** The item that holds a module in a flavor: shared when both flavors have the same files. */
function moduleItem(flavor: Flavor, module: string): string {
  const css = cssModules.get(module);
  const tw = twModules.get(module);
  return flavor === "tailwind" && tw && !(css && sameFiles(css, tw))
    ? `core-${module}-tailwind`
    : `core-${module}`;
}

/** Modules a module's own files import, from their relative imports. */
function moduleImports(module: string, files: ModuleFile[]): Set<string> {
  const found = new Set<string>();
  for (const file of files) {
    for (const [, spec = ""] of file.code.matchAll(/(?:from |import )["'](\.{1,2}\/[^"']+)["']/g)) {
      const target = moduleOf(posix.join(posix.dirname(file.path), spec));
      if (target && target !== module && !target.startsWith("..")) found.add(target);
    }
  }
  return found;
}

const setupItem = (flavor: Flavor) => (flavor === "tailwind" ? "tailwind-setup" : "tokens");

items.push(
  {
    name: "tokens",
    type: "registry:lib",
    title: "Owsem Tokens",
    description: "Theme tokens with the --ow- prefix and the OwsemUI @layer order.",
    files: [
      {
        path: stage("tokens", "tokens.css", read(join(uiSrc, "core/tokens/tokens.css"))),
        type: "registry:file",
        target: "@lib/owsem/tokens.css",
      },
    ],
    meta: { family: "core" },
    docs: "Import @/lib/owsem/tokens.css once in your app's CSS entry.",
  },
  {
    name: "tailwind-setup",
    type: "registry:lib",
    title: "Owsem Tailwind CSS Setup",
    description: "The Tailwind CSS v4 theme the Tailwind flavor of OwsemUI components needs.",
    registryDependencies: [owsem("tokens")],
    // CLI-7: a plain file, not the item's cssVars or tailwind fields.
    files: [
      {
        path: stage("tailwind-setup", "tailwind.css", read(join(uiSrc, "tailwind.css"))),
        type: "registry:file",
        target: "@lib/owsem/tailwind.css",
      },
    ],
    meta: { family: "core" },
    docs: "Import @/lib/owsem/tailwind.css in your app's CSS entry before tailwindcss, then @/lib/owsem/tokens.css after it.",
  },
);

const coreMeta: Record<Flavor, string[]> = {
  css: [owsem("tokens")],
  tailwind: [owsem("tailwind-setup")],
};
for (const flavor of ["css", "tailwind"] as const) {
  for (const [module, files] of flavor === "css" ? cssModules : twModules) {
    const name = moduleItem(flavor, module);
    // The shared item is made once, from the CSS flavor.
    if (flavor === "tailwind" && !name.endsWith("-tailwind")) {
      coreMeta.tailwind.push(owsem(name));
      continue;
    }
    coreMeta[flavor].push(owsem(name));
    const code = files.map((file) => file.code).join("\n");
    items.push({
      name,
      type: "registry:lib",
      title: `Owsem Core: ${module}`,
      description: `The ${module} helper from OwsemUI Core${flavor === "tailwind" ? " (Tailwind flavor)" : ""}.`,
      dependencies: npmDependencies(code, uiSrc),
      registryDependencies: [...moduleImports(module, files)].map((m) =>
        owsem(moduleItem(flavor, m)),
      ),
      files: files.map((file) => ({
        path: stage(name, file.path, file.code),
        type: file.path.endsWith(".css") ? ("registry:file" as const) : ("registry:lib" as const),
        target: `@lib/owsem/${file.path}`,
      })),
      meta: { family: "core" },
    });
  }
}
for (const flavor of ["css", "tailwind"] as const) {
  items.push({
    name: flavor === "css" ? "core" : "core-tailwind",
    type: "registry:lib",
    title: flavor === "css" ? "Owsem Core" : "Owsem Core (Tailwind)",
    description:
      "Everything in OwsemUI Core at once: the theme setup and every helper. A component installs only what it uses.",
    registryDependencies: [...new Set(coreMeta[flavor])],
    meta: { family: "core" },
  });
}

const componentNames = readdirSync(join(uiSrc, "components"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// The catalog is the source of truth: a folder needs an available entry and vice versa.
for (const entry of catalog.filter(isAvailable)) {
  if (!componentNames.includes(entry.name)) {
    throw new Error(`${entry.name} is available in lib/catalog.ts but has no packages/ui folder.`);
  }
}

/** The item a component is installed as in a flavor. */
const componentItem = (name: string, flavor: Flavor) =>
  flavor === "tailwind" && hasTailwind(name, uiSrc) ? `${name}-tailwind` : name;

for (const name of componentNames) {
  const entry = catalog.find((e) => e.name === name);
  if (!entry || !isAvailable(entry)) {
    throw new Error(
      `packages/ui/src/components/${name} needs an available entry in lib/catalog.ts.`,
    );
  }
  for (const requested of ["css", "tailwind"] as const) {
    if (requested === "tailwind" && !hasTailwind(name, uiSrc)) continue;
    const { files: all } = componentFiles(name, requested, uiSrc);
    const own = all.filter((file) => file.path.startsWith(`components/owsem/${name}/`));
    const itemName = componentItem(name, requested);
    const code = own.map((file) => file.code).join("\n");
    // What the item's own files import: sibling components, Core modules, and the setup.
    const uses = new Set<string>();
    for (const [, sibling = ""] of code.matchAll(/@\/components\/owsem\/([a-z0-9-]+)\//g)) {
      if (sibling !== name) uses.add(owsem(componentItem(sibling, requested)));
    }
    for (const [, sibling = ""] of code.matchAll(/@import\s+"\.\.\/([a-z0-9-]+)\//g)) {
      if (sibling !== name) uses.add(owsem(componentItem(sibling, requested)));
    }
    for (const [, path = ""] of code.matchAll(/@\/lib\/owsem\/([a-z0-9/-]+)/g)) {
      uses.add(owsem(moduleItem(requested, moduleOf(path))));
    }
    uses.add(owsem(setupItem(requested)));

    items.push({
      name: itemName,
      type: "registry:ui",
      title: requested === "tailwind" ? `${entry.title} (Tailwind)` : entry.title,
      description: en.components[entry.name],
      dependencies: npmDependencies(code, uiSrc),
      registryDependencies: [...uses],
      files: own.map((file) => ({
        path: stage(itemName, file.path.slice(`components/owsem/${name}/`.length), file.code),
        type: file.path.endsWith(".css") ? ("registry:file" as const) : ("registry:ui" as const),
        target: `@components/${file.path.slice("components/".length)}`,
      })),
      meta: { family: entry.family, status: entry.status, flavor: requested },
    });
  }
}

for (const item of items) assertValidItem(item);

const registry: Registry & { $schema: string } = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "owsem",
  homepage: siteUrl.href.replace(/\/$/, ""),
  items,
};
writeFileSync(join(stageDir, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);

console.log(`registry: staged ${items.length} item(s) in ${stageDir}`);
