import type { ThemeRegistration } from "shiki/core";

// One Shiki theme for every code view: MDX code blocks (source.config.ts) and the Lab's live code
// (components/lab/live-code.tsx). Colors are the --tk-* tokens in globals.css, so they follow the
// site theme and a stage's own data-theme.
const tk = (name: string) => `var(--tk-${name})`;

export const CODE_THEME = "owsem";

export const codeTheme: ThemeRegistration = {
  name: CODE_THEME,
  type: "dark",
  colors: { "editor.foreground": tk("text"), "editor.background": tk("bg") },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: tk("com"), fontStyle: "italic" },
    },
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: tk("punct") },
    },
    {
      scope: [
        "keyword",
        "storage",
        "keyword.operator.new",
        "keyword.operator.expression",
        "variable.language",
        "punctuation.definition.keyword",
      ],
      settings: { foreground: tk("kw") },
    },
    {
      scope: ["string", "punctuation.definition.string"],
      settings: { foreground: tk("str") },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "constant.other.color",
        "constant.other.option",
        "keyword.other.unit",
        "punctuation.definition.constant",
      ],
      settings: { foreground: tk("num") },
    },
    // HTML tags, and CSS selectors.
    {
      scope: [
        "entity.name.tag",
        "entity.other.attribute-name.class.css",
        "entity.other.attribute-name.id.css",
        "entity.other.attribute-name.pseudo-class.css",
        "entity.other.attribute-name.pseudo-element.css",
        "punctuation.definition.entity.css",
      ],
      settings: { foreground: tk("tag") },
    },
    // Components and types.
    {
      scope: [
        "support.class.component",
        "entity.name.type",
        "entity.name.class",
        "entity.other.inherited-class",
        "support.type.primitive",
        "support.type.builtin",
      ],
      settings: { foreground: tk("type") },
    },
    {
      scope: [
        "entity.other.attribute-name",
        "support.type.property-name",
        "meta.object-literal.key",
      ],
      settings: { foreground: tk("attr") },
    },
    // Functions and commands, and custom properties: the token names a reader looks for.
    {
      scope: [
        "entity.name.function",
        "support.function",
        "entity.name.command",
        "variable.css",
        "variable.argument.css",
      ],
      settings: { foreground: tk("fn") },
    },
    {
      scope: [
        "string.unquoted.argument.shell",
        "meta.jsx.children",
        "variable.parameter.layer-name",
      ],
      settings: { foreground: tk("text") },
    },
  ],
};
