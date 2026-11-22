import type { ReactNode } from "react";
import type { CodeFile, Localized, Part } from "@/components/component-page/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

/**
 * One way to use a component: what the preview shows and the code that writes it. Both live in
 * one object so they cannot drift apart; the e2e suite checks that the code names every
 * component in `uses` and that the preview renders them.
 */
export interface Example {
  /** Stable: the picker, the Docs list, and the page tests refer to it. */
  id: string;
  /** Short, since it is a segment of the picker. */
  title: Localized;
  /** One sentence for the Docs panel's Examples list. */
  description: Localized;
  /** Public names the demo renders and the code imports, e.g. `Button`. */
  uses: readonly string[];
  demo(lang: Lang): ReactNode;
  /** The files the Code drawer shows, in the visitor's token setup. */
  code(setup: TokenSetup, lang: Lang): CodeFile[];
}

/**
 * Everything component-specific on a preview-first component page (examples/<name>.tsx); the
 * Docs content lives in content/components/<lang>/<name>.mdx.
 */
export interface ComponentDefinition {
  /** The names to import, for the Install popover and the Installation section. */
  imports: readonly string[];
  /** The registry item name, for the source import (owsem CLI) and the install commands. */
  item: string;
  examples: readonly Example[];
  /** The parts Inspect outlines, in the anatomy table's order. */
  parts: readonly Part[];
  /**
   * What Inspect magnifies: one complete instance that renders every structural part (icons
   * included), whatever the active example shows. It is mounted inert in the preview.
   */
  anatomy?: { specimen(lang: Lang): ReactNode };
}

export const defineComponent = (definition: ComponentDefinition): ComponentDefinition => definition;

/** The import path of a component in the visitor's setup: the package, or the CLI's copy. */
export const importPath = (setup: TokenSetup, item: string): string =>
  isDefaultSetup(setup) ? "owsem-ui/base" : `@/components/owsem/${item}`;

/**
 * A TSX example file: the imports, then a component `name` whose hooks come first and whose JSX
 * body (one fragment) is `body`, a line per entry.
 */
export const exampleFile = (
  name: string,
  imports: string[],
  body: string[],
  hooks: string[] = [],
): CodeFile => ({
  name: `${name.replace(/[A-Z]/g, (c, i) => (i ? `-${c}` : c)).toLowerCase()}.tsx`,
  code: [
    ...imports,
    "",
    `export function ${name}() {`,
    ...hooks,
    "  return (",
    "    <>",
    ...body.map((line) => `      ${line}`),
    "    </>",
    "  );",
    "}",
  ].join("\n"),
});
