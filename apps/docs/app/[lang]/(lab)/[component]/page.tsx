import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComponentHeader } from "@/components/component-header";
import { getMDXComponents } from "@/components/mdx";
import { Toc } from "@/components/toc";
import { baseUiUrl, type CatalogEntry, catalog, isAvailable } from "@/lib/catalog";
import { type Dictionary, getDictionary } from "@/lib/dictionaries";
import { isLang, type Lang, localeAlternates } from "@/lib/i18n";
import { assertNotReserved } from "@/lib/reserved-slugs";
import { labSource } from "@/lib/source";

export const dynamicParams = false;

// Every catalog component gets a page; available ones must have a Lab, and every Lab an entry.
export function generateStaticParams({ params }: { params: { lang: string } }) {
  for (const page of labSource.getPages(params.lang)) {
    const entry = catalog.find((e) => e.name === page.slugs.join("/"));
    if (!entry || !isAvailable(entry)) {
      throw new Error(`Lab ${page.path} needs an available entry in lib/catalog.ts.`);
    }
  }
  return catalog.map((entry) => {
    assertNotReserved(entry.name);
    if (isAvailable(entry) && !labSource.getPage([entry.name], params.lang)) {
      throw new Error(
        `${entry.name} is available but has no content/labs/<lang>/${entry.name}.mdx.`,
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

export default async function ComponentPage(props: PageProps<"/[lang]/[component]">) {
  const { lang, entry, dict } = await resolve(props);
  return isAvailable(entry) ? (
    <LabPage lang={lang} entry={entry} dict={dict} />
  ) : (
    <ComingSoon entry={entry} dict={dict} />
  );
}

function LabPage({ lang, entry, dict }: { lang: Lang; entry: CatalogEntry; dict: Dictionary }) {
  const page = labSource.getPage([entry.name], lang);
  if (!page) notFound();
  const Mdx = page.data.body;
  return (
    <main className="with-toc">
      <article>
        <ComponentHeader entry={entry} description={describe(entry, dict)} dict={dict} />
        <Mdx components={getMDXComponents()} />
      </article>
      <Toc items={page.data.toc} label={dict.lab.toc} />
    </main>
  );
}

function ComingSoon({ entry, dict }: { entry: CatalogEntry; dict: Dictionary }) {
  const url = baseUiUrl(entry);
  const [before, after] = dict.comingSoon.baseUi.split("{link}");
  return (
    <main>
      <ComponentHeader entry={entry} description={describe(entry, dict)} dict={dict} />
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
    </main>
  );
}

const describe = (entry: CatalogEntry, dict: Dictionary) =>
  dict.components[entry.name as keyof Dictionary["components"]];

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
