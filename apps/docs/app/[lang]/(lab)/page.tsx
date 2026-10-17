import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComponentBadges } from "@/components/component-header";
import { ComponentIndex } from "@/components/component-index";
import { CATEGORIES, catalog, isAvailable } from "@/lib/catalog";
import { format, getDictionary } from "@/lib/dictionaries";
import { isLang, localeAlternates } from "@/lib/i18n";

export async function generateMetadata(props: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!isLang(lang)) notFound();
  return { alternates: localeAlternates(lang, "") };
}

export default async function IndexPage(props: PageProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);
  const groups = CATEGORIES.map((category) => ({
    id: category,
    label: dict.catalog.categories[category],
    items: catalog
      .filter((entry) => entry.category === category)
      .map((entry) => ({
        name: entry.name,
        href: `/${lang}/${entry.name}`,
        title: entry.title,
        description: dict.components[entry.name],
        family: entry.family,
        badges: <ComponentBadges entry={entry} dict={dict} />,
      })),
  }));
  return (
    <main>
      <header className="page-header">
        <h1>OwsemUI</h1>
        <p className="lead">{dict.site.description}</p>
        <p>
          {format(dict.catalog.progress, {
            available: catalog.filter(isAvailable).length,
            total: catalog.length,
          })}
        </p>
      </header>
      <ComponentIndex
        groups={groups}
        labels={{
          legend: dict.catalog.filter,
          all: dict.catalog.all,
          base: dict.catalog.families.base,
          owsem: dict.catalog.families.owsem,
        }}
      />
    </main>
  );
}
