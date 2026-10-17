import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { isLang, localeAlternates } from "@/lib/i18n";
import { source } from "@/lib/source";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return source.getPages(params.lang).map((page) => ({ slug: page.slugs }));
}

export default async function DocsPage(props: PageProps<"/[lang]/docs/[[...slug]]">) {
  const { lang, slug } = await props.params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();
  const Mdx = page.data.body;
  return (
    <main>
      <h1>{page.data.title}</h1>
      {page.data.description ? <p className="lead">{page.data.description}</p> : null}
      <Mdx components={getMDXComponents()} />
    </main>
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
