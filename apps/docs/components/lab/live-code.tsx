"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { HighlighterCore, ThemedToken } from "shiki/core";
import { CODE_THEME, codeTheme } from "@/lib/code-theme";
import type { CodeFile } from "./types";

const LANGS = { tsx: "tsx", ts: "tsx", css: "css" } as const;

// Shiki loads on first use, in its own chunk; until then the code shows without color.
let loading: Promise<HighlighterCore> | undefined;
let ready: HighlighterCore | undefined;

function loadHighlighter(): Promise<HighlighterCore> {
  loading ??= Promise.all([import("shiki/core"), import("shiki/engine/javascript")])
    .then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
      createHighlighterCore({
        themes: [codeTheme],
        langs: [import("shiki/langs/tsx.mjs"), import("shiki/langs/css.mjs")],
        engine: createJavaScriptRegexEngine(),
      }),
    )
    .then((highlighter) => {
      ready = highlighter;
      return highlighter;
    });
  return loading;
}

function useHighlighter(): HighlighterCore | undefined {
  const [highlighter, setHighlighter] = useState(ready);
  useEffect(() => {
    let live = true;
    loadHighlighter().then((loaded) => live && setHighlighter(loaded));
    return () => {
      live = false;
    };
  }, []);
  return highlighter;
}

function tokenize(
  highlighter: HighlighterCore | undefined,
  file: CodeFile,
): ThemedToken[][] | undefined {
  const lang = LANGS[file.name.split(".").pop() as keyof typeof LANGS];
  if (!highlighter || !lang) return undefined;
  return highlighter.codeToTokensBase(file.code, { lang, theme: CODE_THEME });
}

function highlight(line: string, tokens: ThemedToken[] | undefined): ReactNode {
  if (!tokens) return line;
  return tokens.map((token, i) => (
    <span
      // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional and never reorder
      key={i}
      // Bit 1 is italic in Shiki's FontStyle.
      style={{ color: token.color, fontStyle: (token.fontStyle ?? 0) & 1 ? "italic" : undefined }}
    >
      {token.content}
    </span>
  ));
}

/** Indexes of the lines in `after` that are not in the longest common subsequence with `before`. */
function changedLines(before: string[], after: string[]): ReadonlySet<number> {
  const n = before.length;
  const m = after.length;
  const width = m + 1;
  const lcs = new Uint16Array((n + 1) * width);
  const at = (i: number, j: number) => lcs[i * width + j] ?? 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * width + j] =
        before[i] === after[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const changed = new Set<number>();
  for (let i = 0, j = 0; j < m; ) {
    if (i < n && before[i] === after[j]) {
      i++;
      j++;
    } else if (i < n && at(i + 1, j) >= at(i, j + 1)) {
      i++;
    } else {
      changed.add(j++);
    }
  }
  return changed;
}

/** Numbered, highlighted code; lines that changed since the last render flash once. */
export function LiveCode({ file }: { file: CodeFile }) {
  const lines = file.code.split("\n");
  const highlighter = useHighlighter();
  const tokens = useMemo(() => tokenize(highlighter, file), [highlighter, file]);
  const [shown, setShown] = useState({
    file,
    version: 0,
    changed: new Set<number>() as ReadonlySet<number>,
  });
  if (shown.file.code !== file.code || shown.file.name !== file.name) {
    // Switching files shows the new file without flashing it.
    const sameFile = shown.file.name === file.name;
    setShown({
      file,
      version: shown.version + 1,
      changed: sameFile ? changedLines(shown.file.code.split("\n"), lines) : new Set(),
    });
  }
  return (
    <pre className="live-code">
      <code>
        {lines.map((line, i) => {
          const changed = shown.changed.has(i);
          return (
            <span
              // A new key restarts the flash animation on changed lines only.
              key={changed ? `${i}-${shown.version}` : i}
              className="live-line"
              data-changed={changed ? "" : undefined}
            >
              {highlight(line, tokens?.[i])}
              {"\n"}
            </span>
          );
        })}
      </code>
    </pre>
  );
}
