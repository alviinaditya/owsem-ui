/**
 * The Tailwind CSS v4 version of the components: whole-file swaps. A component's
 * `<name>-variants.tailwind.ts` replaces its `<name>-variants.ts`, the component file loses its
 * CSS import, and `core/` files it imports are copied to lib/ (the Tailwind `cn` replaces the
 * plain one). Pure, so the freshness test runs it in the browser; the script build-tailwind.ts
 * writes the result to src/tailwind/.
 */

/** Components with a `<name>-variants.tailwind.ts`. */
export const components: string[] = ["button"];

const HEADER = "// Generated from";
const CORE = /"\.\.\/\.\.\/core\/([^"]+)"/g;

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
  /** Imports of core/ move to lib/, and are noted for copying. */
  const relink = (file: string, code: string, prefix = "../lib/"): string =>
    code.replace(CORE, (_, core: string) => {
      if (!sources[`core/${core}.ts`] && !TAILWIND_CORE[core]) {
        throw new Error(`${file}: core/${core} is not a module.`);
      }
      lib.add(core);
      return `"${prefix}${core}"`;
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
      files[`${name}/${file}`] = header(`components/${name}`) + relink(file, code);
    }
  }
  for (const core of [...lib].sort()) {
    const tailwind = TAILWIND_CORE[core];
    const from = tailwind ?? `core/${core}.ts`;
    files[`lib/${core}.ts`] = header(from) + relink(from, need(from), "./");
  }
  return files;
}
