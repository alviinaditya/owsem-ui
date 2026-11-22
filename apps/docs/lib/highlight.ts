import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { CODE_THEME, codeTheme } from "./code-theme";

/** One token of a line: its text, its color, and 1 when italic. Compact: it crosses to the client. */
export type Token = [text: string, color: string, italic?: 1];

const LANGS = { tsx: "tsx", ts: "tsx", css: "css" } as const;

let highlighter: Promise<HighlighterCore> | undefined;

const load = () =>
  (highlighter ??= createHighlighterCore({
    themes: [codeTheme],
    langs: [import("shiki/langs/tsx.mjs"), import("shiki/langs/css.mjs")],
    engine: createJavaScriptRegexEngine(),
  }));

/** Tokens per line, with the colors `Highlighted` draws on the client (the same theme). */
export async function highlightLines(path: string, code: string): Promise<Token[][]> {
  const lang = LANGS[path.split(".").pop() as keyof typeof LANGS];
  const lines = code.split("\n");
  if (!lang) return lines.map((line) => [[line, ""]]);
  const tokens = (await load()).codeToTokensBase(code, { lang, theme: CODE_THEME });
  return tokens.map((line) =>
    line.map((token): Token => {
      const italic = ((token.fontStyle ?? 0) & 1) !== 0;
      return italic ? [token.content, token.color ?? "", 1] : [token.content, token.color ?? ""];
    }),
  );
}
