import { loader } from "fumadocs-core/source";
import { pageSchema } from "fumadocs-core/source/schema";
import { defineCollections, defineDocs } from "fumadocs-mdx/macro";
import { i18n } from "@/lib/i18n";

const docs = defineDocs({ dir: "content/docs" });

// The preview-first component pages (examples/); their Docs are sections, `## Title [#id]`.
const components = defineCollections({
  type: "doc",
  dir: "content/components",
  schema: pageSchema,
});

// Content lives in content/<collection>/<lang>/; URLs become /<lang>/docs/... and /<lang>/<component>.
export const source = loader({ baseUrl: "/docs", source: docs.toFumadocsSource(), i18n });
export const componentSource = loader({
  baseUrl: "/",
  source: components.toFumadocsSource(),
  i18n,
});
