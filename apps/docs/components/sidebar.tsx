import type { Node } from "fumadocs-core/page-tree";
import Link from "next/link";
import { Sidebar } from "owsem-ui/owsem";
import ui from "owsem-ui/package.json";
import { CATEGORIES, type Category, catalog, isAvailable } from "@/lib/catalog";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { source } from "@/lib/source";
import { SearchTrigger } from "./docs-search";
import type { IconName } from "./icons/icon";
import { Logo } from "./logo";
import { SidebarLink } from "./nav-link";
import { SidebarCollapse } from "./sidebar-toggle";

export const CATEGORY_ICONS: Record<Category, IconName> = {
  action: "mouse-pointer-click",
  form: "text-cursor-input",
  overlay: "layers",
  navigation: "compass",
  disclosure: "list-collapse",
  display: "layout-dashboard",
};

/** The docs pages in sidebar order (content/docs/<lang>/meta.json). */
export const treePages = (nodes: Node[]): Extract<Node, { type: "page" }>[] =>
  nodes.flatMap((node) =>
    node.type === "page" ? [node] : node.type === "folder" ? treePages(node.children) : [],
  );

/**
 * The site's sidebar (the library's Sidebar), for every page: the brand and the search at the top, a group for
 * the prose pages (content/docs/<lang>/meta.json), then one per catalog category. Components that
 * are not built yet stay on the index. Its state lives in the Provider (site-shell.tsx).
 */
export function SiteSidebar({ lang }: { lang: Lang }) {
  const dict = getDictionary(lang);
  // Nothing is published before the first release; package.json says 0.0.0 until then.
  const version = ui.version === "0.0.0" ? dict.nav.prerelease : `v${ui.version}`;
  return (
    <Sidebar.Root aria-label={dict.nav.sidebar} className="site-sidebar" id="site-sidebar">
      <Sidebar.Header className="site-sidebar-head">
        <div className="site-sidebar-brand">
          <Link href={`/${lang}`} className="sidebar-brand">
            <Logo size={40} />
            <span className="sidebar-brand-text">
              <span className="sidebar-brand-name">OwsemUI</span>
              <span className="sidebar-version">{version}</span>
            </span>
          </Link>
          <SidebarCollapse label={dict.cp.hideSidebar} />
        </div>
        <SearchTrigger label={dict.search.trigger} />
      </Sidebar.Header>
      <Sidebar.Content id="site-sidebar-scroll">
        <Sidebar.Indicator />
        <Sidebar.Group>
          <Sidebar.GroupLabel>{dict.nav.gettingStarted}</Sidebar.GroupLabel>
          <Sidebar.List>
            {treePages(source.getPageTree(lang).children).map((page) => (
              <SidebarLink key={page.url} href={page.url}>
                {page.name}
              </SidebarLink>
            ))}
          </Sidebar.List>
        </Sidebar.Group>
        {CATEGORIES.map((category) => {
          const entries = catalog.filter((e) => e.category === category && isAvailable(e));
          return entries.length ? (
            <Sidebar.Group key={category}>
              <Sidebar.GroupLabel>{dict.catalog.categories[category]}</Sidebar.GroupLabel>
              <Sidebar.List>
                {entries.map((entry) => (
                  <SidebarLink key={entry.name} href={`/${lang}/${entry.name}`}>
                    {entry.title}
                  </SidebarLink>
                ))}
              </Sidebar.List>
            </Sidebar.Group>
          ) : null;
        })}
      </Sidebar.Content>
    </Sidebar.Root>
  );
}
