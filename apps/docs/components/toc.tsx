import type { TOCItemType } from "fumadocs-core/toc";
import { TableOfContents } from "owsem-ui/owsem";

interface Section {
  item: TOCItemType;
  children: TOCItemType[];
}

/** The h2 sections, each with the h3 sub-sections after it. */
function sectionsOf(items: TOCItemType[]): Section[] {
  const sections: Section[] = [];
  for (const item of items) {
    if (item.depth === 2) sections.push({ item, children: [] });
    else if (item.depth === 3) sections.at(-1)?.children.push(item);
  }
  return sections;
}

const link = (item: TOCItemType) => (
  <TableOfContents.Link href={item.url}>{item.title}</TableOfContents.Link>
);

/**
 * "On this page": a Table of Contents (owsem-ui) of the h2 sections and their h3 sub-sections,
 * marking the one being read; shown beside the content on wide screens.
 */
export function Toc({ items, label }: { items: TOCItemType[]; label: string }) {
  const sections = sectionsOf(items);
  if (sections.length === 0) return null;
  return (
    <aside className="toc">
      <TableOfContents.Root aria-label={label} className="toc-nav">
        <p className="sidebar-heading">{label}</p>
        <TableOfContents.List>
          {sections.map(({ item, children }) => (
            <TableOfContents.Item key={item.url}>
              {link(item)}
              {children.length ? (
                <TableOfContents.List>
                  {children.map((child) => (
                    <TableOfContents.Item key={child.url}>{link(child)}</TableOfContents.Item>
                  ))}
                </TableOfContents.List>
              ) : null}
            </TableOfContents.Item>
          ))}
        </TableOfContents.List>
      </TableOfContents.Root>
    </aside>
  );
}
