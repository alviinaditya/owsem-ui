import type { TOCItemType } from "fumadocs-core/toc";

/** "On this page" links to the h2 sections; shown beside the content on wide screens. */
export function Toc({ items, label }: { items: TOCItemType[]; label: string }) {
  const sections = items.filter((item) => item.depth === 2);
  if (sections.length === 0) return null;
  return (
    <aside className="toc">
      <nav aria-label={label}>
        <p className="sidebar-heading">{label}</p>
        <ul>
          {sections.map((item) => (
            <li key={item.url}>
              <a href={item.url}>{item.title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
