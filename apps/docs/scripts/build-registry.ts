/**
 * Stages the shadcn registry in apps/docs/.registry from packages/ui sources (DS-7).
 * `registry:build` then runs `shadcn registry validate` and `shadcn build` into public/r.
 * Run directly by Node (type stripping), so only erasable TypeScript here and in its imports.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Registry, RegistryItem } from "shadcn/schema";
import { catalog, isAvailable } from "../lib/catalog.ts";
import { en } from "../lib/dictionaries/en.ts";
import { RESERVED_SLUGS } from "../lib/reserved-slugs.ts";
import { siteUrl } from "../lib/site.ts";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const uiSrc = join(docsDir, "../../packages/ui/src");
const stageDir = join(docsDir, ".registry");
const outDir = join(docsDir, "public/r");

const baseUiVersion: string = createRequire(join(uiSrc, "../package.json"))(
  "@base-ui/react/package.json",
).version;

/** Writes a registry copy of a packages/ui file; shadcn only accepts paths inside stageDir. */
function stage(item: string, from: string, to: string, transform = (code: string) => code) {
  const dest = join(stageDir, "src", item, to);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, transform(readFileSync(join(uiSrc, from), "utf8")));
  return `src/${item}/${to}`;
}

/**
 * CLI-6: relative imports that leave a component folder become alias imports, which shadcn and
 * `owsem add` rewrite to the user's paths. Sources in packages/ui stay relative. Imported
 * components are added to `uses`, so they are installed too.
 */
function rewriteImports(name: string, code: string, uses: Set<string>): string {
  return code.replace(/(from |import )(["'])(\.\.\/[^"']+)\2/g, (_, keyword, quote, path) => {
    if (path.startsWith("../../core/")) {
      return `${keyword}${quote}@/lib/owsem/${path.slice("../../core/".length)}${quote}`;
    }
    const component = /^\.\.\/([a-z0-9-]+)\//.exec(path)?.[1];
    if (!component) throw new Error(`${name}: cannot rewrite import "${path}" for the registry.`);
    uses.add(`@owsem/${component}`);
    return `${keyword}${quote}@/components/owsem/${path.slice("../".length)}${quote}`;
  });
}

const npmDependencies = (code: string): string[] =>
  code.includes('from "@base-ui/react') ? [`@base-ui/react@~${baseUiVersion}`] : [];

/** The line a Base + Owsem component's flavor defaults on; the -owsem item sets it to "owsem". */
const FLAVOR_DEFAULT = /^(const DEFAULT_FLAVOR: \w+ = )"base";$/m;

const isSource = (file: string) => /\.(tsx?|css)$/.test(file) && !/\.test\.tsx?$/.test(file);

function assertValidItem(item: RegistryItem): void {
  if (item.name.includes("/") || RESERVED_SLUGS.has(item.name)) {
    throw new Error(`Registry item "${item.name}" must be a flat, non-reserved name.`);
  }
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

// Core modules and their CSS keep their path under @lib/owsem/. index.ts only re-exports (Base UI
// providers for npm users); tokens.css is listed on its own.
const coreModules = readdirSync(join(uiSrc, "core"), { recursive: true, encoding: "utf8" }).filter(
  (file) => isSource(file) && file !== "index.ts" && file !== "tokens/tokens.css",
);

const items: RegistryItem[] = [
  {
    name: "core",
    type: "registry:lib",
    title: "Owsem Core",
    description:
      "Theme tokens with the --ow- prefix, the OwsemUI @layer order, Glide, and helpers.",
    files: [
      {
        path: stage("core", "core/tokens/tokens.css", "tokens.css"),
        type: "registry:file",
        target: "@lib/owsem/tokens.css",
      },
      ...coreModules.map((file) => ({
        path: stage("core", `core/${file}`, file),
        type: file.endsWith(".css") ? ("registry:file" as const) : ("registry:lib" as const),
        target: `@lib/owsem/${file}`,
      })),
    ],
    meta: { family: "core" },
    docs: "Import @/lib/owsem/tokens.css once in your app's CSS entry.",
  },
];

const componentNames = readdirSync(join(uiSrc, "components"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// The catalog is the source of truth: a folder needs an available entry and vice versa.
for (const entry of catalog.filter(isAvailable)) {
  if (!componentNames.includes(entry.name)) {
    throw new Error(`${entry.name} is available in lib/catalog.ts but has no packages/ui folder.`);
  }
}

for (const name of componentNames) {
  const entry = catalog.find((e) => e.name === name);
  if (!entry || !isAvailable(entry)) {
    throw new Error(
      `packages/ui/src/components/${name} needs an available entry in lib/catalog.ts.`,
    );
  }
  // Base + Owsem ship twice from one source: `<name>` defaults to flavor="base" and `<name>-owsem`
  // to flavor="owsem", by rewriting the DEFAULT_FLAVOR line. Both write the same files (PRD).
  const flavors =
    entry.family === "base+owsem" ? (["base", "owsem"] as const) : ([undefined] as const);
  for (const flavor of flavors) {
    const item = flavor === "owsem" ? `${name}-owsem` : name;
    let defaulted = flavor !== "owsem";
    const dependencies = new Set<string>();
    const uses = new Set(["@owsem/core"]);
    const files = readdirSync(join(uiSrc, "components", name))
      .filter(isSource)
      .map((file) => ({
        path: stage(item, `components/${name}/${file}`, file, (code) => {
          for (const dependency of npmDependencies(code)) dependencies.add(dependency);
          if (file.endsWith(".css")) return code;
          const out = rewriteImports(name, code, uses);
          if (flavor !== "owsem" || !FLAVOR_DEFAULT.test(out)) return out;
          defaulted = true;
          return out.replace(FLAVOR_DEFAULT, '$1"owsem";');
        }),
        type: file.endsWith(".css") ? ("registry:file" as const) : ("registry:ui" as const),
        target: `@components/owsem/${name}/${file}`,
      }));
    if (!defaulted) throw new Error(`${name}: no DEFAULT_FLAVOR line to set for ${item}.`);

    items.push({
      name: item,
      type: "registry:ui",
      title: flavor === "owsem" ? `${entry.title} (Owsem)` : entry.title,
      description: en.components[entry.name],
      dependencies: [...dependencies],
      registryDependencies: [...uses],
      files,
      meta: { family: entry.family, ...(flavor ? { flavor } : {}), status: entry.status },
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
