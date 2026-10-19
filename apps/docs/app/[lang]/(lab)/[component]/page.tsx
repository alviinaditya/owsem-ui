import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComponentBadges } from "@/components/component-header";
import { Icon } from "@/components/icons/icon";
import { InstallCommand } from "@/components/install";
import { Scene } from "@/components/lab/lab-shell";
import { getMDXComponents } from "@/components/mdx";
import { TokenChip } from "@/components/token-setup";
import { labs } from "@/labs";
import {
  baseUiUrl,
  type CatalogEntry,
  type ComponentName,
  catalog,
  isAvailable,
  readingOrder,
} from "@/lib/catalog";
import { type Dictionary, getDictionary } from "@/lib/dictionaries";
import { i18n, isLang, type Lang, localeAlternates } from "@/lib/i18n";
import { labPageScenes, labScenes } from "@/lib/lab-template";
import { assertNotReserved } from "@/lib/reserved-slugs";
import { labSource } from "@/lib/source";

export const dynamicParams = false;

// Every catalog component gets a page. Available ones need a Lab in the template order and a
// stage definition in apps/docs/labs; every Lab needs an available entry.
export function generateStaticParams({ params }: { params: { lang: string } }) {
  for (const page of labSource.getPages(params.lang)) {
    const entry = catalog.find((e) => e.name === page.slugs.join("/"));
    if (!entry || !isAvailable(entry)) {
      throw new Error(`Lab ${page.path} needs an available entry in lib/catalog.ts.`);
    }
  }
  return catalog.map((entry) => {
    assertNotReserved(entry.name);
    if (isAvailable(entry)) {
      const page = labSource.getPage([entry.name], params.lang);
      if (!page) throw new Error(`${entry.name} is available but has no Lab in content/labs/.`);
      if (!labs[entry.name]) throw new Error(`${entry.name} has no stage in apps/docs/labs.`);
      const ids = labScenes(entry.name, page.data.toc).map((scene) => scene.id);
      const base = labSource.getPage([entry.name], i18n.defaultLanguage);
      const baseIds = base ? labScenes(entry.name, base.data.toc).map((scene) => scene.id) : ids;
      if (ids.join() !== baseIds.join()) {
        throw new Error(
          `${entry.name}: Lab sections in "${params.lang}" differ from the default language.`,
        );
      }
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
  return isAvailable(entry) ? (
    <LabPage lang={lang} entry={entry} dict={dict} />
  ) : (
    <ComingSoon lang={lang} entry={entry} dict={dict} />
  );
}

interface PageArgs {
  lang: Lang;
  entry: CatalogEntry;
  dict: Dictionary;
}

function Intro({
  lang,
  entry,
  dict,
  install,
  shortcuts,
}: PageArgs & { install?: boolean; shortcuts?: boolean }) {
  return (
    <header className="page-header">
      <p className="eyebrow">{dict.catalog.categories[entry.category]}</p>
      <h1>{entry.title}</h1>
      <p className="lead">{describe(entry, dict)}</p>
      <ComponentBadges entry={entry} dict={dict} />
      {install ? (
        <>
          <InstallCommand item={entry.name} labels={dict.lab} />
          <TokenChip item={entry.name} lang={lang} />
        </>
      ) : null}
      {shortcuts ? (
        <p className="lab-hint">
          {dict.lab.shortcuts}
          {["T", "P", "C"].map((key) => (
            <kbd key={key}>{key}</kbd>
          ))}
        </p>
      ) : null}
    </header>
  );
}

function Neighbors({ lang, entry, dict }: PageArgs) {
  const i = readingOrder.findIndex((e) => e.name === entry.name);
  const links = [
    { target: readingOrder[i - 1], label: dict.lab.previous, rel: "prev", icon: "arrow-left" },
    { target: readingOrder[i + 1], label: dict.lab.next, rel: "next", icon: "arrow-right" },
  ] as const;
  // One line each; the direction is in the name for screen readers, the arrow shows it.
  return (
    <nav className="neighbors" aria-label={dict.lab.component}>
      {links.map(({ target, label, rel, icon }) =>
        target ? (
          <Link key={rel} href={`/${lang}/${target.name}` as Route} rel={rel} data-rel={rel}>
            <Icon name={icon} />
            <span className="visually-hidden">{label}: </span>
            <span className="neighbors-title">{target.title}</span>
          </Link>
        ) : null,
      )}
    </nav>
  );
}

function LabPage({ lang, entry, dict }: PageArgs) {
  const page = labSource.getPage([entry.name], lang);
  const Lab = labs[entry.name as ComponentName];
  if (!page || !Lab) notFound();
  const Mdx = page.data.body;
  const scenes = labPageScenes(entry.name, lang, dict.lab.overview) ?? [];
  return (
    <main className="lab-main">
      <Lab
        title={entry.title}
        lang={lang}
        scenes={scenes}
        intro={<Intro lang={lang} entry={entry} dict={dict} install shortcuts />}
        footer={<Neighbors lang={lang} entry={entry} dict={dict} />}
        labels={dict.lab}
        item={entry.name}
      >
        <Mdx components={getMDXComponents({ section: Scene })} />
      </Lab>
    </main>
  );
}

function ComingSoon({ lang, entry, dict }: PageArgs) {
  const url = baseUiUrl(entry);
  const [before, after] = dict.comingSoon.baseUi.split("{link}");
  return (
    <main className="page">
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
    </main>
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
