import type { TOCItemType } from "fumadocs-core/toc";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "owsem-ui/base";
import { ComponentMeta } from "@/components/component-header";
import { Icon } from "@/components/icons/icon";
import { getMDXComponents } from "@/components/mdx";
import { PageMain } from "@/components/page-main";
import { examples } from "@/examples";
import {
  baseUiUrl,
  type CatalogEntry,
  type ComponentName,
  catalog,
  isAvailable,
  readingOrder,
} from "@/lib/catalog";
import { hasTailwind } from "@/lib/component-files";
import { type Dictionary, getDictionary } from "@/lib/dictionaries";
import { i18n, isLang, type Lang, localeAlternates } from "@/lib/i18n";
import { assertNotReserved } from "@/lib/reserved-slugs";
import { componentSource } from "@/lib/source";

export const dynamicParams = false;

/** The Docs sections of a preview-first page, in order; their ids are the hash links. */
const SECTIONS = [
  "installation",
  "usage",
  "examples",
  "anatomy",
  "api",
  "accessibility",
  "theming",
  "motion",
];

const docSections = (toc: TOCItemType[]) =>
  toc
    .filter((item) => item.depth === 2)
    .map((item) => ({ id: item.url.replace(/^#/, ""), title: item.title }));

// Every catalog component gets a page. Available ones need examples in apps/docs/examples and
// Docs in content/components, with the same sections in every language.
export function generateStaticParams({ params }: { params: { lang: string } }) {
  for (const page of componentSource.getPages(params.lang)) {
    if (!examples[page.slugs.join("/") as ComponentName]) {
      throw new Error(`${page.path} needs a module in apps/docs/examples.`);
    }
  }
  return catalog.map((entry) => {
    assertNotReserved(entry.name);
    if (!isAvailable(entry)) return { component: entry.name };
    if (!examples[entry.name as ComponentName]) {
      throw new Error(`${entry.name} is available but has no module in apps/docs/examples.`);
    }
    const sectionIds = (lang: Lang) => {
      const page = componentSource.getPage([entry.name], lang);
      if (!page) throw new Error(`${entry.name} has examples but no Docs in content/components/.`);
      return docSections(page.data.toc).map((section) => section.id);
    };
    const ids = sectionIds(params.lang as Lang);
    if (ids.join() !== SECTIONS.join() || ids.join() !== sectionIds(i18n.defaultLanguage).join()) {
      throw new Error(
        `${entry.name}: Docs sections in "${params.lang}" must be ${SECTIONS.join(", ")}, as in the default language.`,
      );
    }
    return { component: entry.name };
  });
}

async function resolve(props: PageProps<"/[lang]/[component]">) {
  const { lang, component } = await props.params;
  const entry = catalog.find((e) => e.name === component);
  if (!entry || !isLang(lang)) notFound();
  return { lang, entry, dict: getDictionary(lang) };
}

const describe = (entry: CatalogEntry, dict: Dictionary) =>
  dict.components[entry.name as keyof Dictionary["components"]];

export default async function ComponentPage(props: PageProps<"/[lang]/[component]">) {
  const { lang, entry, dict } = await resolve(props);
  if (!isAvailable(entry)) return <ComingSoon lang={lang} entry={entry} dict={dict} />;
  return <ExamplesPage lang={lang} entry={entry} dict={dict} />;
}

interface PageArgs {
  lang: Lang;
  entry: CatalogEntry;
  dict: Dictionary;
}

function Intro({ entry, dict }: PageArgs) {
  return (
    <header className="page-header">
      <h1>{entry.title}</h1>
      <p className="lead">{describe(entry, dict)}</p>
      <ComponentMeta entry={entry} dict={dict} />
    </header>
  );
}

function Neighbors({ lang, entry, dict }: PageArgs) {
  const i = readingOrder.findIndex((e) => e.name === entry.name);
  const links = [
    { target: readingOrder[i - 1], label: dict.common.previous, rel: "prev", icon: "arrow-left" },
    { target: readingOrder[i + 1], label: dict.common.next, rel: "next", icon: "arrow-right" },
  ] as const;
  // One line each, links styled as buttons; the direction is in the name for screen readers, the
  // arrow shows it.
  return (
    <nav className="neighbors" aria-label={dict.common.component}>
      {links.map(({ target, label, rel, icon }) => {
        if (!target) return null;
        const arrow = <Icon name={icon} />;
        return (
          <Link
            key={rel}
            href={`/${lang}/${target.name}` as Route}
            rel={rel}
            data-rel={rel}
            className={buttonVariants({ variant: "secondary" })}
          >
            {rel === "prev" ? arrow : null}
            <span className="visually-hidden">{label}: </span>
            <span className="neighbors-title">{target.title}</span>
            {rel === "next" ? arrow : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** A preview-first page: the component's examples, with its Docs in a panel. */
function ExamplesPage({ lang, entry, dict }: PageArgs) {
  const page = componentSource.getPage([entry.name], lang);
  const Examples = examples[entry.name as ComponentName];
  if (!page || !Examples) notFound();
  const Mdx = page.data.body;
  const install = { name: entry.name, tailwind: hasTailwind(entry.name) };
  return (
    <PageMain className="cp-main">
      <Examples
        title={entry.title}
        lang={lang}
        family={{ name: dict.catalog.families[entry.family], id: entry.family }}
        description={describe(entry, dict)}
        sections={docSections(page.data.toc)}
        labels={dict.cp}
        common={dict.common}
        install={install}
        footer={<Neighbors lang={lang} entry={entry} dict={dict} />}
      >
        <Mdx components={getMDXComponents(lang, undefined, entry)} />
      </Examples>
    </PageMain>
  );
}

function ComingSoon({ lang, entry, dict }: PageArgs) {
  const url = baseUiUrl(entry);
  const [before, after] = dict.comingSoon.baseUi.split("{link}");
  return (
    <PageMain className="page page-text">
      <Intro lang={lang} entry={entry} dict={dict} />
      <div className="coming-soon">
        <p>{dict.comingSoon.body}</p>
        <p>
          {url ? (
            <>
              {before}
              <a href={url}>{entry.title}</a>
              {after}
            </>
          ) : (
            dict.comingSoon.owsemOnly
          )}
        </p>
      </div>
      <Neighbors lang={lang} entry={entry} dict={dict} />
    </PageMain>
  );
}

export async function generateMetadata(props: PageProps<"/[lang]/[component]">): Promise<Metadata> {
  const { lang, entry, dict } = await resolve(props);
  return {
    title: entry.title,
    description: describe(entry, dict),
    alternates: localeAlternates(lang, `/${entry.name}`),
    // Thin placeholder pages stay out of search results until the component ships.
    ...(isAvailable(entry) ? {} : { robots: { index: false } }),
  };
}
