/**
 * The files a component installs (CLI-6, DS-7): shared by the registry build and the docs' Manual
 * install. Node runs it too (build-registry.ts, type stripping): erasable TypeScript only.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, posix } from "node:path";

export type Flavor = "css" | "tailwind";

/** packages/ui/src; both callers run from apps/docs. */
export const defaultUiSrc = join(process.cwd(), "../../packages/ui/src");

export const baseUiVersion = (uiSrc = defaultUiSrc): string =>
  createRequire(join(uiSrc, "../package.json"))("@base-ui/react/package.json").version;

/** Shipped sources: not tests, and not the Tailwind class maps the Tailwind flavor is generated from. */
export const isSource = (file: string): boolean =>
  /\.(tsx?|css)$/.test(file) && !/\.(test|tailwind)\.tsx?$/.test(file);

/**
 * Comments for this repo, not for a copied file: the generator's "do not edit" header, and the
 * first paragraph of a Tailwind class map, which says whose twin it is.
 */
export const stripRepoHeader = (code: string): string =>
  code
    .replace(/^\/\/ Generated from [^\n]*\n/, "")
    .replace(/^\/\/ The Tailwind CSS v4 twin of (?:[^\n]+\n)(?:\/\/ [^\n]+\n)*(?:\/\/)?\n/, "");

/** Packages the app provides itself, so they are not installed with a component. */
const PEERS = new Set(["react", "react-dom"]);

/**
 * The npm packages a file imports, from its import specifiers: Base UI with the version this repo
 * uses, anything else by name (`cn`, `class-variance-authority`).
 */
export const npmDependencies = (code: string, uiSrc = defaultUiSrc): string[] => {
  const names = new Set<string>();
  for (const [, spec = ""] of code.matchAll(/(?:from |import )["']([^"'./][^"']*)["']/g)) {
    if (spec.startsWith("@/")) continue; // an install alias, not a package
    const parts = spec.split("/");
    const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? "");
    if (!PEERS.has(name) && !name.startsWith("node:")) names.add(name);
  }
  return [...names].map((name) =>
    name === "@base-ui/react" ? `${name}@~${baseUiVersion(uiSrc)}` : name,
  );
};

/** Core modules and their CSS keep their path under lib/owsem/. index.ts only re-exports. */
export function coreModules(uiSrc = defaultUiSrc): string[] {
  return readdirSync(join(uiSrc, "core"), { recursive: true, encoding: "utf8" })
    .filter((file) => isSource(file) && file !== "index.ts" && file !== "tokens/tokens.css")
    .map((file) => file.split("\\").join("/"));
}

/**
 * CLI-6: relative imports that leave a component folder become alias imports, which shadcn and
 * `owsem add` rewrite to the user's paths. Sources in packages/ui stay relative. Imported
 * components are added to `uses`. The Tailwind flavor's `../lib/` helpers install with Core.
 */
export function rewriteImports(
  name: string,
  code: string,
  uses: Set<string>,
  flavor: Flavor = "css",
): string {
  return code.replace(/(from |import )(["'])(\.\.\/[^"']+)\2/g, (_, keyword, quote, path) => {
    if (path.startsWith("../../core/")) {
      return `${keyword}${quote}@/lib/owsem/${path.slice("../../core/".length)}${quote}`;
    }
    if (flavor === "tailwind" && path.startsWith("../lib/")) {
      return `${keyword}${quote}@/lib/owsem/${path.slice("../lib/".length)}${quote}`;
    }
    const component = /^\.\.\/([a-z0-9-]+)\//.exec(path)?.[1];
    if (!component) throw new Error(`${name}: cannot rewrite import "${path}" for the registry.`);
    uses.add(`@owsem/${component}`);
    return `${keyword}${quote}@/components/owsem/${path.slice("../".length)}${quote}`;
  });
}

/** Whether the component has a Tailwind v4 flavor: a folder in src/tailwind/. */
export const hasTailwind = (name: string, uiSrc = defaultUiSrc): boolean =>
  existsSync(join(uiSrc, "tailwind", name)) && name !== "lib";

export interface InstallFile {
  /** Target path in the project, under the alias root: `components/owsem/…` or `lib/owsem/…`. */
  path: string;
  code: string;
}

export interface ComponentFiles {
  flavor: Flavor;
  /** npm packages for `add`, with versions where the registry pins one. */
  dependencies: string[];
  /** Components whose files are included, besides this one. */
  uses: string[];
  /** Theme setup, installed once for every component: tokens.css, and tailwind.css for Tailwind. */
  setup: InstallFile[];
  /** Lines for the app's global CSS, in order. */
  globalCss: string[];
  /** This component's files, the components it uses, and the Core modules they import. */
  files: InstallFile[];
}

const read = (path: string) => readFileSync(path, "utf8");

// A small CSS reader, enough for tokens.css and tailwind.css: nested blocks, declarations, and
// at-rule statements. Comments are dropped.
interface Decl {
  text: string;
  name: string;
  depth: number;
}
interface Block {
  head: string;
  depth: number;
  items: (Decl | Block)[];
}

const isBlock = (item: Decl | Block): item is Block => "items" in item;

function parseCss(css: string): Block {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let at = 0;
  const parseBody = (head: string, depth: number): Block => {
    const block: Block = { head, depth, items: [] };
    while (at < source.length) {
      let end = at;
      let parens = 0;
      while (end < source.length) {
        const char = source[end];
        if (char === "(") parens++;
        else if (char === ")") parens--;
        else if (parens === 0 && (char === "{" || char === ";" || char === "}")) break;
        end++;
      }
      const text = source.slice(at, end).trim();
      const char = source[end];
      at = end + 1;
      if (char === "{") {
        block.items.push(parseBody(text, depth + 1));
      } else {
        if (text) block.items.push({ text, name: text.split(":")[0]?.trim() ?? "", depth });
        if (char !== ";") break;
      }
    }
    return block;
  };
  return parseBody("", 0);
}

/** A declaration at its new depth: its continuation lines move with it. */
function showDecl(decl: Decl, depth: number): string {
  const pad = "  ".repeat(depth);
  const [first = "", ...rest] = decl.text.split("\n");
  const shifted = rest.map((line) => {
    const stripped = line.replace(new RegExp(`^ {0,${decl.depth * 2}}`), "");
    return stripped.trim() ? pad + stripped : "";
  });
  return `${[pad + first, ...shifted].join("\n")};`;
}

function showBlock(block: Block, depth: number): string {
  const pad = "  ".repeat(depth);
  const body = block.items.map((item) =>
    isBlock(item) ? showBlock(item, depth + 1) : showDecl(item, depth + 1),
  );
  // Nested blocks are told apart by a blank line, as in the sources.
  const parts: string[] = [];
  body.forEach((text, i) => {
    const item = block.items[i];
    const previous = block.items[i - 1];
    if (i > 0 && (isBlock(item as Decl | Block) || (previous && isBlock(previous)))) {
      parts.push("");
    }
    parts.push(text);
  });
  return `${pad}${block.head} {\n${parts.join("\n")}\n${pad}}`;
}

const tokenNames = (code: string): string[] => code.match(/--ow-[a-z0-9-]+/g) ?? [];

/**
 * tokens.css with only the tokens `used` reads, and the tokens those read in turn, in every
 * theme block. The layer statement and the wrappers stay; comments go.
 */
export function trimTokens(css: string, used: Iterable<string>): string {
  const root = parseCss(css);
  const values = new Map<string, string>();
  const collect = (block: Block) => {
    for (const item of block.items) {
      if (isBlock(item)) collect(item);
      else if (item.name.startsWith("--ow-")) {
        values.set(item.name, `${values.get(item.name) ?? ""} ${item.text}`);
      }
    }
  };
  collect(root);
  const needed = new Set<string>();
  const queue = [...used].filter((name) => values.has(name));
  while (queue.length > 0) {
    const name = queue.pop() as string;
    if (needed.has(name)) continue;
    needed.add(name);
    const value = values.get(name)?.split(":").slice(1).join(":") ?? "";
    for (const next of tokenNames(value)) if (values.has(next)) queue.push(next);
  }
  // Non-token declarations (color-scheme) stay in the blocks that keep a token.
  const prune = (block: Block): Block | undefined => {
    const items: (Decl | Block)[] = [];
    for (const item of block.items) {
      if (isBlock(item)) {
        const kept = prune(item);
        if (kept) items.push(kept);
      } else if (!item.name.startsWith("--ow-") || needed.has(item.name)) items.push(item);
    }
    return items.some((item) => isBlock(item) || item.name.startsWith("--ow-"))
      ? { ...block, items }
      : undefined;
  };
  const statements = root.items.filter((item): item is Decl => !isBlock(item));
  const blocks = root.items.filter(isBlock).flatMap((block) => prune(block) ?? []);
  return `${[
    ...statements.map((decl) => showDecl(decl, 0)),
    ...blocks.map((block) => showBlock(block, 0)),
  ].join("\n\n")}\n`;
}

/**
 * The Tailwind setup a component's classes need: the layer statement, the --animate-* theme
 * lines, their keyframes, the registered properties (@property) the classes name, and the custom
 * variants the classes use. Found at any depth in the bridge, written at the top level.
 */
export function trimTailwind(css: string, classes: string): string {
  const root = parseCss(css);
  const variants: (Decl | Block)[] = [];
  const keyframes = new Map<string, Block>();
  const properties = new Map<string, Block>();
  const animate: Decl[] = [];
  const layers: Decl[] = [];
  const walk = (block: Block, top: boolean) => {
    for (const item of block.items) {
      if (isBlock(item)) {
        if (item.head.startsWith("@custom-variant")) variants.push(item);
        else if (item.head.startsWith("@keyframes")) {
          keyframes.set(item.head.split(/\s+/)[1] ?? "", item);
        } else if (item.head.startsWith("@property")) {
          properties.set(item.head.split(/\s+/)[1] ?? "", item);
        } else walk(item, false);
      } else if (item.text.startsWith("@custom-variant")) variants.push(item);
      else if (item.name.startsWith("--animate-")) animate.push(item);
      else if (top && item.text.startsWith("@layer")) layers.push(item);
    }
  };
  walk(root, true);

  const parts = layers.map((decl) => showDecl(decl, 0));
  const usedAnimate = animate.filter((decl) =>
    new RegExp(`(?<![\\w-])animate-${decl.name.slice("--animate-".length)}(?![\\w-])`).test(
      classes,
    ),
  );
  if (usedAnimate.length > 0) {
    parts.push(
      showBlock(
        { head: "@theme", depth: 0, items: usedAnimate.map((decl) => ({ ...decl, depth: 1 })) },
        0,
      ),
    );
  }
  // Keyframes named by a used --animate-* line, or by an arbitrary `animate-[name_…]` class.
  const names = new Set([
    ...usedAnimate.flatMap((decl) => decl.text.split(":").slice(1).join(":").split(/\s+/)),
    ...[...classes.matchAll(/(?<![\w-])animate-\[([a-zA-Z0-9-]+)/g)].map((match) => match[1] ?? ""),
  ]);
  for (const [name, block] of keyframes) {
    if (names.has(name)) parts.push(showBlock({ ...block, depth: 0 }, 0));
  }
  // A registered property the classes name, such as the --_switch-travel a thumb transitions.
  for (const [name, block] of properties) {
    if (classes.includes(name)) parts.push(showBlock({ ...block, depth: 0 }, 0));
  }
  for (const item of variants) {
    const head = isBlock(item) ? item.head : item.text;
    const name = /^@custom-variant\s+([\w-]+)/.exec(head)?.[1] ?? "";
    // A variant stands alone or follows not-, has-, or in-; a longer name that ends the same
    // (ow-switch-held for held) is another variant, and `held: Type` in a script is not one.
    if (
      !new RegExp(`(?:(?<![\\w-])|(?<=(?:^|[^\\w-])(?:not|has|in)-))${name}:(?=\\S)`).test(classes)
    ) {
      continue;
    }
    parts.push(isBlock(item) ? showBlock(item, 0) : showDecl({ ...item, depth: 0 }, 0));
  }
  return `${parts.join("\n\n")}\n`;
}

/** An import's candidates, as install paths: `components/owsem/…` and `lib/owsem/…`. */
const IMPORT_SUFFIXES = ["", ".ts", ".tsx", "/index.ts"];

/** Every file of a component for one flavor; a missing Tailwind flavor falls back to CSS. */
export function componentFiles(
  name: string,
  requested: Flavor = "css",
  uiSrc = defaultUiSrc,
): ComponentFiles {
  const flavor = requested === "tailwind" && hasTailwind(name, uiSrc) ? "tailwind" : "css";
  const tailwind = flavor === "tailwind";

  // Install paths map to sources: a Tailwind component or lib file replaces the CSS one.
  const sourceOf = (path: string): { file: string; tailwind: boolean } | undefined => {
    const [, kind, rest] = /^(components|lib)\/owsem\/(.+)$/.exec(path) ?? [];
    if (!kind || !rest || !isSource(rest)) return undefined;
    const candidates: { file: string; tailwind: boolean }[] = [];
    if (kind === "components") {
      const folder = rest.split("/")[0] ?? "";
      if (tailwind && hasTailwind(folder, uiSrc)) {
        candidates.push({ file: join(uiSrc, "tailwind", rest), tailwind: true });
      } else candidates.push({ file: join(uiSrc, "components", rest), tailwind: false });
    } else {
      if (tailwind) candidates.push({ file: join(uiSrc, "tailwind/lib", rest), tailwind: true });
      candidates.push({ file: join(uiSrc, "core", rest), tailwind: false });
    }
    return candidates.find((candidate) => existsSync(candidate.file));
  };

  // The import a file makes, as an install path, or none for a package or a missing file.
  const resolve = (from: string, spec: string): string | undefined => {
    let base: string;
    if (spec.startsWith("../../core/")) base = `lib/owsem/${spec.slice("../../core/".length)}`;
    else if (tailwind && from.startsWith("components/") && spec.startsWith("../lib/")) {
      base = `lib/owsem/${spec.slice("../lib/".length)}`;
    } else base = posix.join(posix.dirname(from), spec);
    return IMPORT_SUFFIXES.map((suffix) => base + suffix).find((path) => sourceOf(path));
  };

  const dependencies = new Set<string>();
  const uses = new Set<string>();
  const reached = new Map<string, string>();
  const raw = new Map<string, string>();
  const queue = [`components/owsem/${name}/index.ts`];
  while (queue.length > 0) {
    const path = queue.pop() as string;
    if (reached.has(path)) continue;
    const source = sourceOf(path);
    if (!source) continue;
    const code = stripRepoHeader(read(source.file));
    raw.set(path, code);
    for (const dependency of npmDependencies(code, uiSrc)) dependencies.add(dependency);
    const component = /^components\/owsem\/([^/]+)\//.exec(path)?.[1];
    if (component && component !== name) uses.add(component);
    const found = new Set<string>();
    reached.set(
      path,
      // A lib file keeps its relative imports: its siblings and parents install beside it.
      path.endsWith(".css") || !component
        ? code
        : rewriteImports(component, code, found, source.tailwind ? "tailwind" : "css"),
    );
    const specs = path.endsWith(".css")
      ? [...code.matchAll(/@import\s+(?:url\()?["']?(\.{1,2}\/[^"')\s;]+)/g)]
      : [...code.matchAll(/(?:from |import )["'](\.{1,2}\/[^"']+)["']/g)];
    for (const [, spec] of specs) {
      const next = spec && resolve(path, spec);
      if (next) queue.push(next);
    }
  }

  // Components first (this one at the top), then the lib files.
  const order = (path: string) =>
    path.startsWith(`components/owsem/${name}/`) ? 0 : path.startsWith("components/") ? 1 : 2;
  const files = [...reached]
    .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
    .map(([path, code]) => ({ path, code }));

  // The tokens the files read, whatever the syntax: var(--ow-x), bg-(--ow-x), (color:--ow-x).
  const everything = [...raw.values()].join("\n");
  const tokens = trimTokens(read(join(uiSrc, "core/tokens/tokens.css")), tokenNames(everything));
  const setup: InstallFile[] = [];
  const globalCss = ['@import "./lib/owsem/tokens.css";'];
  if (tailwind) {
    setup.push({
      path: "lib/owsem/tailwind.css",
      code: trimTailwind(read(join(uiSrc, "tailwind.css")), everything),
    });
    globalCss.splice(
      0,
      1,
      '@import "./lib/owsem/tailwind.css";',
      '@import "tailwindcss";',
      '@import "./lib/owsem/tokens.css";',
    );
  }
  setup.push({ path: "lib/owsem/tokens.css", code: tokens });

  return { flavor, dependencies: [...dependencies], uses: [...uses], setup, globalCss, files };
}
