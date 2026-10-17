import { defineConfig } from "fumadocs-mdx/config";

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: { light: "github-light", dark: "github-dark" },
      // Otherwise every <pre> gets an `icon` attribute holding raw SVG.
      icon: false,
    },
  },
});
