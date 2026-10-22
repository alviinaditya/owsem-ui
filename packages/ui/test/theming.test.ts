import { describe, expect, test } from "vitest";

// TK-9: the theme tokens in tokens.css are the only public tokens, and component CSS takes every
// theming value (color, radius, font) from them. These tests read the stylesheets as text.

const sheets = import.meta.glob<string>("../src/**/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});
const TOKENS = "../src/core/tokens/tokens.css";
// Set by the app, never by OwsemUI (TK-7), so they keep a generic fallback.
const APP_TOKENS = ["--ow-font-sans", "--ow-font-mono"];
// Put this comment right before a declaration whose literal is not theming, with the reason.
const MARKER = "/* literal:";

interface Declaration {
  property: string;
  value: string;
  marked: boolean;
}

/** Declarations at any depth; quotes and parentheses never split one. */
function declarations(css: string): Declaration[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.startsWith(MARKER) ? "\u0000" : "",
  );
  const found: Declaration[] = [];
  let buffer = "";
  let depth = 0;
  let quote = "";
  const flush = () => {
    const marked = buffer.includes("\u0000");
    const chunk = buffer.replaceAll("\u0000", "").trim();
    buffer = "";
    const colon = chunk.indexOf(":");
    if (colon < 1 || chunk.startsWith("@")) return;
    const property = chunk.slice(0, colon).trim();
    if (!/^(--)?[a-z_][\w-]*$/i.test(property)) return;
    found.push({
      property,
      value: chunk
        .slice(colon + 1)
        .replace(/\s+/g, " ")
        .trim(),
      marked,
    });
  };
  for (const char of text) {
    if (quote) {
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    } else if (depth === 0 && (char === ";" || char === "{" || char === "}")) {
      if (char === ";" || char === "}") flush();
      else buffer = "";
      continue;
    }
    buffer += char;
  }
  return found;
}

const themeTokens = new Set(
  declarations(sheets[TOKENS] ?? "")
    .map((d) => d.property)
    .filter((p) => p.startsWith("--ow-")),
);
const components = Object.entries(sheets).filter(([path]) => path !== TOKENS);

const COLOR =
  /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|\b(?:white|black|gray|grey|silver)\b/i;
const LENGTH = /(?<![\w-])(?:\d*\.)?\d+(?:px|r?em)\b/;

describe("Theming (TK-9)", () => {
  test("tokens.css declares the theme tokens", () => {
    expect(themeTokens.size).toBeGreaterThan(20);
    expect(components.length).toBeGreaterThan(2);
  });

  test("component CSS reads only theme tokens, and declares none", () => {
    const problems: string[] = [];
    for (const [path, css] of components) {
      for (const name of new Set(css.match(/--ow-[a-z\d-]+/g))) {
        if (!themeTokens.has(name) && !APP_TOKENS.includes(name)) {
          problems.push(`${path}: ${name} is not a theme token`);
        }
      }
      for (const { property } of declarations(css)) {
        if (property.startsWith("--ow-")) problems.push(`${path}: declares ${property}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("theme tokens are read without fallbacks", () => {
    const problems: string[] = [];
    for (const [path, css] of components) {
      for (const [, name] of css.matchAll(/var\(\s*(--ow-[a-z\d-]+)\s*,/g)) {
        if (!APP_TOKENS.includes(name as string)) problems.push(`${path}: ${name} has a fallback`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("colors, radii, and fonts come from the tokens, not literals", () => {
    const problems: string[] = [];
    for (const [path, css] of components) {
      for (const { property, value, marked } of declarations(css)) {
        // Masks use colors for their alpha only.
        if (marked || property.startsWith("mask")) continue;
        const bad =
          COLOR.test(value) ||
          (property.includes("radius") && !value.includes("var(") && LENGTH.test(value)) ||
          (property === "font-family" && !value.includes("var(") && value !== "inherit");
        if (bad) problems.push(`${path}: ${property}: ${value}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
