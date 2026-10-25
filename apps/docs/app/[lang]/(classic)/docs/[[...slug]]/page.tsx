import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { PageMain } from "@/components/page-main";
import { Toc } from "@/components/toc";
import { getDictionary } from "@/lib/dictionaries";
import { isLang, localeAlternates } from "@/lib/i18n";
import { source } from "@/lib/source";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return source.getPages(params.lang).map((page) => ({ slug: page.slugs }));
}

export default async function DocsPage(props: PageProps<"/[lang]/docs/[[...slug]]">) {
  const { lang, slug } = await props.params;
  const page = source.getPage(slug, lang);
  if (!page || !isLang(lang)) notFound();
  const Mdx = page.data.body;
  return (
    <PageMain className="site-content with-toc">
      <article>
        <header className="page-header">
          <h1>{page.data.title}</h1>
          {page.data.description ? <p className="lead">{page.data.description}</p> : null}
        </header>
        <Mdx components={getMDXComponents(lang)} />
      </article>
      <Toc items={page.data.toc} label={getDictionary(lang).lab.toc} />
    </PageMain>
  );
}

export async function generateMetadata(
  props: PageProps<"/[lang]/docs/[[...slug]]">,
): Promise<Metadata> {
  const { lang, slug } = await props.params;
  const page = source.getPage(slug, lang);
  if (!page || !isLang(lang)) notFound();
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: localeAlternates(lang, page.url.slice(lang.length + 1)),
  };
}
