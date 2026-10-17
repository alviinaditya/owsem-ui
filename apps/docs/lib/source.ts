import { loader } from "fumadocs-core/source";
import { pageSchema } from "fumadocs-core/source/schema";
import { defineCollections, defineDocs } from "fumadocs-mdx/macro";
import { i18n } from "@/lib/i18n";

const docs = defineDocs({ dir: "content/docs" });

// Lab frontmatter only holds the title Fumadocs needs; component data comes from lib/catalog.ts.
const labs = defineCollections({
  type: "doc",
  dir: "content/labs",
  schema: pageSchema,
});

// Content lives in content/<collection>/<lang>/; URLs become /<lang>/docs/... and /<lang>/<component>.
export const source = loader({ baseUrl: "/docs", source: docs.toFumadocsSource(), i18n });
export const labSource = loader({ baseUrl: "/", source: labs.toFumadocsSource(), i18n });
