import type { Node } from "fumadocs-core/page-tree";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLang } from "@/lib/i18n";
import { source } from "@/lib/source";

function TreeItems({ items }: { items: Node[] }) {
  return (
    <ul>
      {items.map((node) => (
        <li key={node.$id ?? (node.type === "page" ? node.url : String(node.name))}>
          {node.type === "page" ? (
            <Link href={node.url as Route}>{node.name}</Link>
          ) : node.type === "folder" ? (
            <>
              {node.name}
              <TreeItems items={node.children} />
            </>
          ) : (
            node.name
          )}
        </li>
      ))}
    </ul>
  );
}

// DS-6: Classic layout with a sidebar from the Fumadocs page tree.
export default async function DocsLayout({ children, params }: LayoutProps<"/[lang]/docs">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <div>
      <nav aria-label={getDictionary(lang).nav.docs}>
        <TreeItems items={source.getPageTree(lang).children} />
      </nav>
      {children}
    </div>
  );
}
