/**
 * Stages the shadcn registry in apps/docs/.registry from packages/ui sources (DS-7).
 * `registry:build` then runs `shadcn registry validate` and `shadcn build` into public/r.
 * Run directly by Node (type stripping), so only erasable TypeScript here and in its imports.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Registry, RegistryItem } from "shadcn/schema";
import { RESERVED_SLUGS } from "../lib/reserved-slugs.ts";
import { siteUrl } from "../lib/site.ts";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const uiSrc = join(docsDir, "../../packages/ui/src");
const stageDir = join(docsDir, ".registry");
const outDir = join(docsDir, "public/r");

/** Copies a source file into the staging folder; shadcn only accepts paths inside it. */
function stage(item: string, from: string, to: string): string {
  const dest = join(stageDir, "src", item, to);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(uiSrc, from), dest);
  return `src/${item}/${to}`;
}

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

const items: RegistryItem[] = [
  {
    name: "core",
    type: "registry:lib",
    title: "Owsem Core",
    description: "Theme tokens with the --ow- prefix and the OwsemUI @layer order.",
    files: [
      {
        path: stage("core", "core/tokens/tokens.css", "tokens.css"),
        type: "registry:file",
        target: "@lib/owsem/tokens.css",
      },
    ],
    meta: { family: "core" },
    docs: "Import @/lib/owsem/tokens.css once in your app's CSS entry.",
  },
];

// Component items (<name> and <name>-owsem, Core imports rewritten per CLI-6) arrive with the
// first component.
const componentsDir = join(uiSrc, "components");
const components = existsSync(componentsDir)
  ? readdirSync(componentsDir, { withFileTypes: true }).filter((d) => d.isDirectory())
  : [];
if (components.length > 0) {
  throw new Error(
    `build-registry does not support components yet (${components.map((d) => d.name).join(", ")}).`,
  );
}

for (const item of items) assertValidItem(item);

mkdirSync(stageDir, { recursive: true });
const registry: Registry & { $schema: string } = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "owsem",
  homepage: siteUrl.href.replace(/\/$/, ""),
  items,
};
writeFileSync(join(stageDir, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);

console.log(`registry: staged ${items.length} item(s) in ${stageDir}`);
