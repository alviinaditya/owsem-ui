import type { Node } from "fumadocs-core/page-tree";
import { CATEGORIES, catalog, isAvailable } from "@/lib/catalog";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { source } from "@/lib/source";
import { GlideNav } from "./glide-nav";
import type { SceneInfo } from "./lab/lab-shell";
import { SceneLinks } from "./lab/scene-links";
import { NavLink } from "./nav-link";

function TreeItems({ items, labelledBy }: { items: Node[]; labelledBy?: string }) {
  return (
    <ul aria-labelledby={labelledBy}>
      {items.map((node) => (
        <li key={node.$id ?? (node.type === "page" ? node.url : String(node.name))}>
          {node.type === "page" ? (
            <NavLink href={node.url}>{node.name}</NavLink>
          ) : node.type === "folder" ? (
            <>
              <p className="sidebar-heading">{node.name}</p>
              <TreeItems items={node.children} />
            </>
          ) : (
            <p className="sidebar-heading">{node.name}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Docs pages from the Fumadocs page tree (ordered by content/docs/<lang>/meta.json), then every
 * catalog component by category. On a Lab
 * page, the current component's scenes are listed under it.
 */
export function Sidebar({
  lang,
  current,
  scenes,
}: {
  lang: Lang;
  current?: string | undefined;
  scenes?: SceneInfo[] | undefined;
}) {
  const dict = getDictionary(lang);
  return (
    <GlideNav aria-label={dict.nav.sidebar} className="sidebar-nav">
      <p className="sidebar-heading" id="sidebar-docs">
        {dict.nav.docs}
      </p>
      <TreeItems items={source.getPageTree(lang).children} labelledBy="sidebar-docs" />
      {CATEGORIES.map((category) => (
        <div key={category}>
          <p className="sidebar-heading" id={`sidebar-${category}`}>
            {dict.catalog.categories[category]}
          </p>
          <ul aria-labelledby={`sidebar-${category}`}>
            {catalog
              .filter((entry) => entry.category === category)
              .map((entry) => (
                <li key={entry.name} data-planned={isAvailable(entry) ? undefined : ""}>
                  <NavLink href={`/${lang}/${entry.name}`}>
                    {entry.title}
                    {isAvailable(entry) ? null : (
                      <>
                        {" "}
                        <span className="soon">{dict.catalog.soon}</span>
                      </>
                    )}
                  </NavLink>
                  {entry.name === current && scenes ? (
                    <SceneLinks scenes={scenes} label={dict.lab.scenes} />
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </GlideNav>
  );
}
