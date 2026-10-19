/**
 * Reads the --ow-* tokens out of owsem-ui's tokens.css for the token table on the Theming page.
 * Run by Node too: erasable TypeScript only, no imports.
 */

export interface Token {
  name: string;
  light: string;
  /** Equals `light` when the dark theme does not override the token. */
  dark: string;
}

interface Rule {
  /** Preludes of the enclosing at-rules, outermost first. */
  context: string[];
  selector: string;
  declarations: [name: string, value: string][];
}

const squash = (text: string) => text.replace(/\s+/g, " ").trim();
const normalizeSelector = (selector: string) => squash(selector).replace(/\s*,\s*/g, ", ");

// The selectors TK-5 prescribes. The system dark copy must match [data-theme="dark"] (tested in
// packages/ui), so the table reads the explicit one.
const LIGHT = new Set([':root, [data-theme="light"]', ":root"]);
const DARK = '[data-theme="dark"]';
const SYSTEM_DARK = ':root:not([data-theme="light"])';
const SYSTEM_DARK_MEDIA = "@media (prefers-color-scheme: dark)";

/** Style rules with their own declarations; comments and strings never split a rule. */
function readRules(css: string): Rule[] {
  const rules: Rule[] = [];
  const stack: { prelude: string; declarations: [string, string][] }[] = [];
  let buffer = "";
  const flush = () => {
    const text = squash(buffer);
    buffer = "";
    const block = stack.at(-1);
    const colon = text.indexOf(":");
    if (!block || colon < 0 || text.startsWith("@")) return;
    block.declarations.push([text.slice(0, colon).trim(), text.slice(colon + 1).trim()]);
  };

  for (let i = 0; i < css.length; i++) {
    const char = css[i] as string;
    if (char === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end < 0 ? css.length : end + 1;
    } else if (char === '"' || char === "'") {
      let end = i + 1;
      while (end < css.length && css[end] !== char) end += css[end] === "\\" ? 2 : 1;
      buffer += css.slice(i, end + 1);
      i = end;
    } else if (char === "{") {
      stack.push({ prelude: squash(buffer), declarations: [] });
      buffer = "";
    } else if (char === "}") {
      flush();
      const block = stack.pop();
      if (block?.declarations.length) {
        rules.push({
          context: stack.map((parent) => parent.prelude),
          selector: normalizeSelector(block.prelude),
          declarations: block.declarations,
        });
      }
    } else if (char === ";") {
      flush();
    } else {
      buffer += char;
    }
  }
  return rules;
}

/** Every --ow-* token in tokens.css with its light and dark value, in source order. */
export function parseTokens(css: string): Token[] {
  const tokens = new Map<string, { light?: string; dark?: string }>();
  for (const rule of readRules(css)) {
    const own = rule.declarations.filter(([name]) => name.startsWith("--ow-"));
    if (own.length === 0) continue;
    const media = rule.context.filter((prelude) => prelude.startsWith("@media"));
    let theme: "light" | "dark" | undefined;
    if (media.length === 0 && LIGHT.has(rule.selector)) theme = "light";
    else if (media.length === 0 && rule.selector === DARK) theme = "dark";
    else if (rule.selector === SYSTEM_DARK && media.join() === SYSTEM_DARK_MEDIA) continue;
    else throw new Error(`tokens.css: no theme for tokens in "${rule.selector}".`);
    for (const [name, value] of own) {
      const token = tokens.get(name) ?? {};
      token[theme] = value;
      tokens.set(name, token);
    }
  }
  return [...tokens].map(([name, { light, dark }]) => {
    if (light === undefined) throw new Error(`tokens.css: ${name} has no light value.`);
    return { name, light, dark: dark ?? light };
  });
}

// Literal colors only: a value with var() resolves against the page's theme, not the column's.
const HEX = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const COLOR_FUNCTION = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)$/i;

/** True when a swatch can show the value as is. */
export const isColor = (value: string): boolean => HEX.test(value) || COLOR_FUNCTION.test(value);
