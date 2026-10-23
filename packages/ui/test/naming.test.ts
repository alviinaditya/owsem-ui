import { describe, expect, test } from "vitest";

// FR-6b: the root part is .ow-<block> and every other part .ow-<block>__<element>, where the block
// is the folder under components/ or core/. Variants and states are data attributes.

const sheets = import.meta.glob<string>("../src/**/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});
const sources = import.meta.glob<string>(["../src/**/*.{ts,tsx}", "!../src/**/*.test.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const NAME = "[a-z][a-z\\d]*(?:-[a-z\\d]+)*";
const CLASS = new RegExp(`^ow-(${NAME})(?:__(${NAME}))?$`);
// One meaning, one name.
const RENAMED: Record<string, string> = {
  "data-part": "a class",
  "data-shown": "data-visible",
};

const blockOf = (path: string) => /\/(?:components|core)\/([^/]+)\//.exec(path)?.[1];
const blocks = new Set(
  [...Object.keys(sheets), ...Object.keys(sources)].map(blockOf).filter(Boolean),
);
const uncomment = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Class names in a stylesheet's selectors. */
const cssClasses = (css: string) =>
  new Set([...uncomment(css).matchAll(/\.(ow-[\w-]+)/g)].map((m) => m[1] as string));
/** Class names a source file renders: string literals that start with ow-. */
const sourceClasses = (source: string) =>
  new Set([...uncomment(source).matchAll(/["'`](ow-[^"'`\s]*)/g)].map((m) => m[1] as string));

const rendered = new Set(Object.values(sources).flatMap((source) => [...sourceClasses(source)]));

describe("Class names (FR-6b)", () => {
  test("the stylesheets and the components name their parts", () => {
    expect(rendered.size).toBeGreaterThan(5);
    expect(blocks.has("glide")).toBe(true);
  });

  test("every class is .ow-<block> or .ow-<block>__<element>, of a block that exists", () => {
    const problems: string[] = [];
    const files = [
      ...Object.entries(sheets).map(([path, css]) => [path, cssClasses(css)] as const),
      ...Object.entries(sources).map(([path, source]) => [path, sourceClasses(source)] as const),
    ];
    for (const [path, classes] of files) {
      for (const name of classes) {
        const block = CLASS.exec(name)?.[1];
        if (!block) problems.push(`${path}: .${name} is not .ow-<block>__<element>`);
        else if (!blocks.has(block)) problems.push(`${path}: .${name} has no folder ${block}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("a component names only its own block's parts", () => {
    const problems: string[] = [];
    for (const [path, source] of Object.entries(sources)) {
      const own = blockOf(path);
      for (const name of sourceClasses(source)) {
        const block = CLASS.exec(name)?.[1];
        if (block && block !== own) problems.push(`${path}: .${name} belongs to ${block}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("CSS styles only classes a component renders", () => {
    const problems: string[] = [];
    for (const [path, css] of Object.entries(sheets)) {
      for (const name of cssClasses(css)) {
        if (!rendered.has(name)) problems.push(`${path}: nothing renders .${name}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("parts are classes, and a state has one name", () => {
    const problems: string[] = [];
    const files = { ...sheets, ...sources };
    for (const [path, text] of Object.entries(files)) {
      for (const [old, now] of Object.entries(RENAMED)) {
        if (new RegExp(`${old}(?![\\w-])`).test(uncomment(text))) {
          problems.push(`${path}: ${old}, use ${now}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
