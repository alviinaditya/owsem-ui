import type { Node } from "fumadocs-core/page-tree";
import { TreeRailNav } from "owsem-ui/owsem";
import type { ReactNode } from "react";
import { CATEGORIES, type Category, catalog, isAvailable } from "@/lib/catalog";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { labPageScenes } from "@/lib/lab-template";
import { source } from "@/lib/source";
import { Icon, type IconName } from "./icons/icon";
import { NavLink } from "./nav-link";
import { SidebarLabNode } from "./sidebar-lab-node";

const CATEGORY_ICONS: Record<Category, IconName> = {
  action: "mouse-pointer-click",
  form: "text-cursor-input",
  overlay: "layers",
  navigation: "compass",
  disclosure: "list-collapse",
  display: "layout-dashboard",
};

/** A first-level group of the sidebar: open to start with, closable. */
function Group({ label, icon, children }: { label: string; icon: IconName; children: ReactNode }) {
  return (
    <TreeRailNav.Node defaultOpen>
      <TreeRailNav.Toggle>
        <TreeRailNav.Icon>
          <Icon name={icon} size={16} />
        </TreeRailNav.Icon>
        <TreeRailNav.Label>{label}</TreeRailNav.Label>
      </TreeRailNav.Toggle>
      <TreeRailNav.Panel>
        <TreeRailNav.List>{children}</TreeRailNav.List>
      </TreeRailNav.Panel>
    </TreeRailNav.Node>
  );
}

const pages = (nodes: Node[]): Extract<Node, { type: "page" }>[] =>
  nodes.flatMap((node) =>
    node.type === "page" ? [node] : node.type === "folder" ? pages(node.children) : [],
  );

/**
 * Every page on a Tree Rail Nav (DS-14), in the root layout: the docs pages (ordered by
 * content/docs/<lang>/meta.json), then the catalog by category. A component with a Lab carries its
 * scenes, shown while its page is open, so the trail runs on to the scene being read.
 */
export function Sidebar({ lang }: { lang: Lang }) {
  const dict = getDictionary(lang);
  return (
    <TreeRailNav.Root aria-label={dict.nav.sidebar} className="sidebar-nav">
      <TreeRailNav.List>
        <Group label={dict.nav.docs} icon="book-open">
          {pages(source.getPageTree(lang).children).map((page) => (
            <TreeRailNav.Node key={page.url}>
              <NavLink href={page.url}>
                <TreeRailNav.Label>{page.name}</TreeRailNav.Label>
              </NavLink>
            </TreeRailNav.Node>
          ))}
        </Group>
        {CATEGORIES.map((category) => (
          <Group
            key={category}
            label={dict.catalog.categories[category]}
            icon={CATEGORY_ICONS[category]}
          >
            {catalog
              .filter((entry) => entry.category === category)
              .map((entry) => {
                const href = `/${lang}/${entry.name}`;
                const link = (
                  <NavLink key={href} href={href}>
                    <TreeRailNav.Label>{entry.title}</TreeRailNav.Label>
                    {/* The space keeps "Button Soon" two words for screen readers. */}
                    {isAvailable(entry) ? null : (
                      <>
                        {" "}
                        <span className="soon">{dict.catalog.soon}</span>
                      </>
                    )}
                  </NavLink>
                );
                const scenes = labPageScenes(entry.name, lang, dict.lab.overview);
                return scenes ? (
                  <SidebarLabNode
                    key={entry.name}
                    href={href}
                    scenes={scenes}
                    label={dict.lab.scenes}
                  >
                    {link}
                  </SidebarLabNode>
                ) : (
                  <TreeRailNav.Node
                    key={entry.name}
                    data-planned={isAvailable(entry) ? undefined : ""}
                  >
                    {link}
                  </TreeRailNav.Node>
                );
              })}
          </Group>
        ))}
      </TreeRailNav.List>
    </TreeRailNav.Root>
  );
}
