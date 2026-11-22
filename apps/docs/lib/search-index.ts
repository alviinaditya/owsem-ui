import { isValidElement, type ReactNode } from "react";
import { CATEGORY_ICONS, treePages } from "@/components/sidebar";
import { catalog, isAvailable } from "./catalog";
import { type Dictionary, format } from "./dictionaries";
import type { Lang } from "./i18n";
import type { SearchEntry, SearchGroup } from "./search";
import { componentSource, source } from "./source";

/** The plain text of a heading, which Fumadocs may hand over as elements. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/**
 * The search index for one language (DS-5), built with the page: the docs pages in sidebar order,
 * every catalog component (planned ones lead to their Coming soon page), and each component's Docs sections.
 */
export function buildSearchIndex(lang: Lang, dict: Dictionary): SearchGroup[] {
  const byUrl = new Map(source.getPages(lang).map((page) => [page.url, page]));
  const pages = treePages(source.getPageTree(lang).children).flatMap((node): SearchEntry[] => {
    const page = byUrl.get(node.url);
    if (!page) return [];
    return [
      {
        value: page.url,
        label: page.data.title,
        description: page.data.description ?? "",
        url: page.url,
        icon: "file-text",
        words: page.data.toc.map((item) => textOf(item.title)).join(" "),
      },
    ];
  });

  const components = catalog.map(
    (entry): SearchEntry => ({
      value: entry.name,
      label: entry.title,
      description: dict.components[entry.name],
      url: `/${lang}/${entry.name}`,
      icon: CATEGORY_ICONS[entry.category],
      family: entry.family,
      planned: !isAvailable(entry),
      words: [
        entry.name,
        dict.catalog.categories[entry.category],
        dict.catalog.families[entry.family],
        ...("expressions" in entry ? entry.expressions : []),
      ].join(" "),
    }),
  );

  // Each component's Docs sections, which the page opens from the hash.
  const sections = catalog.flatMap((entry) => {
    const page = isAvailable(entry) ? componentSource.getPage([entry.name], lang) : undefined;
    return (page?.data.toc ?? [])
      .filter((item) => item.depth === 2)
      .map((item): SearchEntry => {
        const id = item.url.replace(/^#/, "");
        const title = textOf(item.title);
        return {
          value: `${entry.name}#${id}`,
          label: title,
          description: format(dict.search.section, { component: entry.title, section: title }),
          url: `/${lang}/${entry.name}#${id}`,
          icon: "hash",
          words: `${entry.title} ${id}`,
        };
      });
  });

  return [
    { value: "pages", label: dict.search.groups.pages, items: pages },
    { value: "components", label: dict.search.groups.components, items: components },
    { value: "sections", label: dict.search.groups.sections, items: sections },
  ];
}
