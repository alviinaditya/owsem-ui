import { isValidElement, type ReactNode } from "react";
import { CATEGORY_ICONS, treePages } from "@/components/sidebar";
import { catalog, isAvailable } from "./catalog";
import { type Dictionary, format } from "./dictionaries";
import type { Lang } from "./i18n";
import { labPageScenes } from "./lab-template";
import type { SearchEntry, SearchGroup } from "./search";
import { source } from "./source";

/** The plain text of a heading, which Fumadocs may hand over as elements. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/**
 * The search index for one language (DS-5), built with the page: the docs pages in sidebar order,
 * every catalog component (planned ones lead to their Coming soon page), and each Lab's scenes.
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

  const scenes = catalog.flatMap((entry) => {
    const list = labPageScenes(entry.name, lang, dict.lab.overview) ?? [];
    // The overview is the component's own entry.
    return list.slice(1).map(
      (scene, i): SearchEntry => ({
        value: `${entry.name}#${scene.id}`,
        label: textOf(scene.title),
        description: format(dict.search.scene, { component: entry.title, n: i + 1 }),
        url: `/${lang}/${entry.name}#scene-${scene.id}`,
        icon: "hash",
        words: `${entry.title} ${scene.id}`,
      }),
    );
  });

  return [
    { value: "pages", label: dict.search.groups.pages, items: pages },
    { value: "components", label: dict.search.groups.components, items: components },
    { value: "scenes", label: dict.search.groups.scenes, items: scenes },
  ];
}
