"use client";

import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import type { HighlighterCore, ThemedToken } from "shiki/core";
import { CODE_THEME, codeTheme } from "@/lib/code-theme";
import type { Token } from "@/lib/highlight";
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

/** Highlighted code as a plain `<pre>`, such as a Code Block's in an example. */
export function Highlighted({ file }: { file: CodeFile }) {
  const highlighter = useHighlighter();
  const tokens = useMemo(() => tokenize(highlighter, file), [highlighter, file]);
  return (
    <pre>
      <code>
        {file.code.split("\n").map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional
          <Fragment key={i}>
            {i > 0 ? "\n" : ""}
            {highlight(line, tokens?.[i])}
          </Fragment>
        ))}
      </code>
    </pre>
  );
}

/** One line of code, highlighted inline, for a `<code>` such as an import line's. */
export function HighlightedLine({ code, lang }: { code: string; lang: "tsx" | "css" }) {
  const highlighter = useHighlighter();
  const tokens = useMemo(
    () => highlighter?.codeToTokensBase(code, { lang, theme: CODE_THEME })[0],
    [highlighter, code, lang],
  );
  return highlight(code, tokens);
}

/**
 * Code the server already highlighted: no Shiki on the client. `limit` renders only the first
 * lines, for a collapsed block.
 */
export function HighlightedLines({
  lines,
  limit,
}: {
  lines: Token[][];
  limit?: number | undefined;
}) {
  const shown = limit === undefined ? lines : lines.slice(0, limit);
  return (
    <pre>
      <code>
        {shown.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional
          <Fragment key={i}>
            {i > 0 ? "\n" : ""}
            {line.map(([text, color, italic], j) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional
                key={j}
                style={{ color: color || undefined, fontStyle: italic ? "italic" : undefined }}
              >
                {text}
              </span>
            ))}
          </Fragment>
        ))}
      </code>
    </pre>
  );
}
