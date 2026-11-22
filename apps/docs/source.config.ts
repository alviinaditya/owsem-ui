import { defineConfig } from "fumadocs-mdx/config";
import { CODE_THEME, codeTheme } from "./lib/code-theme";

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      // One theme in CSS variables for both site themes, the same as the examples' code.
      themes: { [CODE_THEME]: codeTheme },
      defaultColor: CODE_THEME,
      // Otherwise every <pre> gets an `icon` attribute holding raw SVG.
      icon: false,
      // The language picks a Code Block's icon and name (components/mdx.tsx).
      addLanguageClass: true,
    },
  },
});
