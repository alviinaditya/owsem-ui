import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComponentMeta } from "@/components/component-header";
import { ComponentIndex } from "@/components/component-index";
import { PageMain } from "@/components/page-main";
import { CATEGORIES, catalog, FAMILIES, isAvailable } from "@/lib/catalog";
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
  // Base, then Owsem; in each, the categories that have a component, in PRD order.
  const families = FAMILIES.map((family) => ({
    id: family,
    label: dict.catalog.familyGroups[family],
    note: dict.catalog.familyNotes[family],
    groups: CATEGORIES.map((category) => ({
      id: `${family}-${category}`,
      label: dict.catalog.categories[category],
      items: catalog
        .filter((entry) => entry.family === family && entry.category === category)
        .map((entry) => ({
          name: entry.name,
          href: `/${lang}/${entry.name}`,
          title: entry.title,
          description: dict.components[entry.name],
          badges: <ComponentMeta entry={entry} dict={dict} />,
        })),
    })).filter((group) => group.items.length > 0),
  }));
  return (
    <PageMain className="page">
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
        families={families}
        labels={{
          legend: dict.catalog.filter,
          all: dict.catalog.all,
          base: dict.catalog.families.base,
          owsem: dict.catalog.families.owsem,
          view: dict.catalog.view,
          grid: dict.catalog.grid,
          list: dict.catalog.list,
          soon: dict.catalog.comingSoon,
        }}
        lang={lang}
      />
    </PageMain>
  );
}
