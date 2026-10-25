import { existsSync, readdirSync } from "node:fs";
import { Features } from "lightningcss";
import { defineConfig, type UserConfig } from "tsdown";

// NF-1: Baseline 2023, same as "browserslist" in package.json.
const target = ["chrome120", "edge120", "firefox121", "safari17.2", "ios17.2"];

const componentsDir = "src/components";
const components = existsSync(componentsDir)
  ? readdirSync(componentsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

// Sources import their CSS (for browser tests and registry copies), but npm JS must not
// (NF-4, NF-5); CSS ships through the CSS build below.
const stripCssImports = {
  name: "owsem:strip-css-imports",
  resolveId: {
    filter: { id: /\.css$/ },
    handler: (id: string) => ({ id, external: true, moduleSideEffects: false }),
  },
};

// FR-5: namespace objects must not live in "use client" files, or Server Components cannot read
// their members. Relies on rolldown's `__exportAll` helper name; recheck on tsdown upgrades.
const forbidClientNamespace = {
  name: "owsem:forbid-client-namespace",
  generateBundle(
    this: { error: (message: string) => never },
    _options: unknown,
    bundle: Record<string, { type: string; fileName: string; code?: string }>,
  ) {
    for (const file of Object.values(bundle)) {
      const code = file.type === "chunk" ? (file.code ?? "") : "";
      if (/^\s*["']use client["']/.test(code) && code.includes("__exportAll(")) {
        this.error(`${file.fileName}: namespace helper inside a "use client" file (FR-5).`);
      }
    }
  },
};

const shared = {
  platform: "neutral",
  target,
  root: "src",
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
  failOnWarn: "ci-only",
} satisfies UserConfig;

export default defineConfig([
  {
    ...shared,
    name: "owsem-ui:js",
    entry: [
      "src/index.ts",
      "src/base.ts",
      "src/owsem.ts",
      "src/core/index.ts",
      ...components.map((c) => `src/components/${c}/index.ts`),
    ],
    unbundle: true,
    dts: { generator: "oxc" },
    plugins: [stripCssImports, forbidClientNamespace],
    // "use client" is kept per output file, so rolldown's directive warning does not apply.
    checks: { moduleLevelDirective: false },
    // Runtime deps are React and Base UI only; anything else fails the build.
    deps: { onlyBundle: [], onlyImport: ["react", "react-dom", "@base-ui/react"] },
  },
  {
    ...shared,
    name: "owsem-ui:css",
    entry: {
      styles: "src/styles.css",
      tokens: "src/core/tokens/tokens.css",
      "css/glide": "src/core/glide/glide.css",
      ...Object.fromEntries(
        components
          .filter((c) => existsSync(`${componentsDir}/${c}/${c}.css`))
          .map((c) => [`css/${c}`, `${componentsDir}/${c}/${c}.css`]),
      ),
    },
    dts: false,
    // Copied as is: Lightning CSS would move its layer order statement after the @theme block.
    copy: "src/tailwind.css",
    css: {
      splitting: true,
      minify: false,
      // Otherwise Lightning CSS adds light-dark() polyfill variables to every color-scheme rule.
      lightningcss: { exclude: Features.LightDark },
    },
  },
]);
