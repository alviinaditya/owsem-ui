/**
 * The Tailwind CSS v4 version of the components: whole-file swaps. A component's
 * `<name>-variants.tailwind.ts` replaces its `<name>-variants.ts`, the component file loses its
 * CSS import, and `core/` files it imports are copied to lib/ (the Tailwind `cn` replaces the
 * plain one). Pure, so the freshness test runs it in the browser; the script build-tailwind.ts
 * writes the result to src/tailwind/.
 */

/**
 * Components with a `<name>-variants.tailwind.ts`. A component that imports another (Field uses
 * Input) needs it listed here too.
 */
export const components: string[] = [
  "button",
  "separator",
  "kbd",
  "toggle",
  "input",
  "field",
  "fieldset",
  "form",
];

const HEADER = "// Generated from";
const CORE = /"\.\.\/\.\.\/core\/([^"]+)"/g;
const SIBLING = /"\.\/([^"./]+)"/g;
// Another component's folder: "../input/input". The same path resolves in src/tailwind/.
const COMPONENT = /"\.\.\/([a-z][a-z0-9-]*)\/[^"]+"/g;

/** Source files by path under src/, for example "components/button/button.tsx". */
export type Sources = Record<string, string>;

/** Core modules the Tailwind flavor has its own copy of, by name under core/. */
const TAILWIND_CORE: Record<string, string> = { cn: "tailwind-src/cn.ts" };

/** The files of src/tailwind/, by path under src/tailwind/. */
export function generate(sources: Sources): Sources {
  const files: Sources = {};
  const lib = new Set<string>();
  const need = (path: string): string => {
    const code = sources[path];
    if (code === undefined) throw new Error(`Missing source: ${path}`);
    return code;
  };
  const header = (from: string) => `${HEADER} ${from} by scripts/build-tailwind.ts; do not edit.\n`;
  /** A core module a file imports: it moves to lib/, and is noted for copying. */
  const take = (file: string, core: string): void => {
    if (!sources[`core/${core}.ts`] && !TAILWIND_CORE[core]) {
      throw new Error(`${file}: core/${core} is not a module.`);
    }
    lib.add(core);
  };
  /** Imports of core/ move to lib/; another component must have a Tailwind flavor too. */
  const relink = (file: string, code: string, own: string): string =>
    code
      .replace(CORE, (_, core: string) => {
        take(file, core);
        return `"../lib/${core}"`;
      })
      .replace(COMPONENT, (match, other: string) => {
        if (other !== own && other !== "lib" && !components.includes(other)) {
          throw new Error(`${file}: imports ${other}, which has no Tailwind flavor yet.`);
        }
        return match;
      });

  for (const name of components) {
    const dir = `components/${name}/`;
    const variants = `${name}-variants`;
    const names = Object.keys(sources)
      .filter((path) => path.startsWith(dir) && /\.tsx?$/.test(path) && !path.includes("test."))
      .map((path) => path.slice(dir.length))
      .filter((file) => !file.includes("/") && !file.endsWith(".tailwind.ts"));
    if (!names.includes(`${variants}.ts`)) throw new Error(`${name}: no ${variants}.ts to swap.`);
    for (const file of names) {
      const source = file === `${variants}.ts` ? `${dir}${variants}.tailwind.ts` : dir + file;
      const code = need(source).replace(`import "./${name}.css";\n`, "");
      files[`${name}/${file}`] =
        header(`components/${name}`) + relink(`${name}/${file}`, code, name);
    }
  }
  // A core module may take its siblings, so this walks a set that grows.
  for (const core of lib) {
    const tailwind = TAILWIND_CORE[core];
    const from = tailwind ?? `core/${core}.ts`;
    // A core module imports its siblings as "./x"; they sit side by side in lib/ too.
    const code = need(from).replace(SIBLING, (match, next: string) => {
      if (!sources[`core/${next}.ts`]) return match;
      take(from, next);
      return match;
    });
    files[`lib/${core}.ts`] = header(from) + code;
  }
  return files;
}
