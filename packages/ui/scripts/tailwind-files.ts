/**
 * The Tailwind CSS v4 version of the components: whole-file swaps. A component's
 * `<name>-variants.tailwind.ts` replaces its `<name>-variants.ts`, the component file loses its
 * CSS import, and `core/` files it imports are copied to lib/ (the Tailwind `cn` replaces the
 * plain one, and a core module has a `.tailwind.ts` twin the same way: Glide's classes). Pure, so
 * the freshness test runs it in the browser; the script build-tailwind.ts writes the result to
 * src/tailwind/.
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
  "switch",
  "checkbox",
  "icon-morph",
  "tooltip",
  "copy-button",
  "popover",
  "dialog",
  "scroll-area",
  "table",
  "radio-group",
  "toggle-group",
  "tabs",
  "menu",
  "select",
  "toolbar",
  "code-block",
  "command-menu",
  "color-picker",
  "table-of-contents",
  "tree-rail-nav",
  "sidebar",
  "avatar",
  "progress",
  "meter",
  "collapsible",
  "accordion",
  "checkbox-group",
  "number-field",
  "slider",
  "otp-field",
  "alert-dialog",
  "preview-card",
  "drawer",
  "toast",
  "context-menu",
  "menubar",
  "navigation-menu",
];

const HEADER = "// Generated from";
// A core module a component imports, such as "../../core/glide/use-glide".
const CORE = /"\.\.\/\.\.\/core\/([^"]+)"/g;
// What a core module imports: its siblings ("./glide") and its parents ("../cn").
const RELATIVE = /"(\.{1,2}\/[^"]+)"/g;
const CORE_CSS = /^import "\.\/[^"]+\.css";\n/m;
// Another component's folder: "../input/input". The same path resolves in src/tailwind/.
const COMPONENT = /"\.\.\/([a-z][a-z0-9-]*)\/[^"]+"/g;

/** Source files by path under src/, for example "components/button/button.tsx". */
export type Sources = Record<string, string>;

/** Core modules the Tailwind flavor has its own copy of, by name under core/. */
const TAILWIND_CORE: Record<string, string> = { cn: "tailwind-src/cn.ts" };

/** What an import (`spec`) in the folder `dir` of core/ points to, as a path under core/. */
const within = (dir: string, spec: string): string => {
  const parts = dir ? dir.split("/") : [];
  for (const part of spec.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
};

/** The files of src/tailwind/, by path under src/tailwind/. */
export function generate(sources: Sources): Sources {
  const files: Sources = {};
  // Core modules by their path under core/ without the extension ("glide/use-glide").
  const lib = new Set<string>();
  const need = (path: string): string => {
    const code = sources[path];
    if (code === undefined) throw new Error(`Missing source: ${path}`);
    return code;
  };
  const header = (from: string) => `${HEADER} ${from} by scripts/build-tailwind.ts; do not edit.\n`;
  /** The file a core module is copied from, and its extension: a Tailwind twin comes first. */
  const coreFile = (core: string): { from: string; ext: string } | undefined => {
    const twin = `core/${core}.tailwind.ts`;
    const own = TAILWIND_CORE[core];
    if (own) return { from: own, ext: ".ts" };
    if (sources[twin] !== undefined) return { from: twin, ext: ".ts" };
    const ext = [".ts", ".tsx"].find((end) => sources[`core/${core}${end}`] !== undefined);
    return ext ? { from: `core/${core}${ext}`, ext } : undefined;
  };
  /** A core module a file imports: it moves to lib/, and is noted for copying. */
  const take = (file: string, core: string): void => {
    if (!coreFile(core)) throw new Error(`${file}: core/${core} is not a module.`);
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
  // A core module may take its siblings and parents, so this walks a set that grows. They sit
  // side by side in lib/ as in core/, so their paths stay as written.
  for (const core of lib) {
    const { from, ext } = coreFile(core) as { from: string; ext: string };
    const dir = core.slice(0, Math.max(0, core.lastIndexOf("/")));
    const code = need(from)
      .replace(CORE_CSS, "")
      .replace(RELATIVE, (match, spec: string) => {
        const next = within(dir, spec);
        if (coreFile(next)) take(from, next);
        return match;
      });
    files[`lib/${core}${ext}`] = header(from) + code;
  }
  return files;
}
