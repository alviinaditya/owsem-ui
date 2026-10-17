import type { Node } from "fumadocs-core/page-tree";
import { CATEGORIES, catalog, isAvailable } from "@/lib/catalog";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { source } from "@/lib/source";
import { NavLink } from "./nav-link";

function TreeItems({ items }: { items: Node[] }) {
  return (
    <ul>
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

/** Docs pages from the Fumadocs page tree, then every catalog component by category. */
export function Sidebar({ lang }: { lang: Lang }) {
  const dict = getDictionary(lang);
  return (
    <nav aria-label={dict.nav.sidebar} className="sidebar-nav">
      <TreeItems items={source.getPageTree(lang).children} />
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
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
