import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { isLang, localeAlternates } from "@/lib/i18n";
import { assertNotReserved } from "@/lib/reserved-slugs";
import { labSource } from "@/lib/source";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return labSource.getPages(params.lang).map((page) => {
    const [component, ...rest] = page.slugs;
    if (component === undefined || rest.length > 0) {
      throw new Error(
        `Lab ${page.path} must be content/labs/<lang>/<component>.mdx (one segment, no index or folder).`,
      );
    }
    assertNotReserved(component);
    return { component };
  });
}

export default async function LabPage(props: PageProps<"/[lang]/[component]">) {
  const { lang, component } = await props.params;
  const page = labSource.getPage([component], lang);
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

export async function generateMetadata(props: PageProps<"/[lang]/[component]">): Promise<Metadata> {
  const { lang, component } = await props.params;
  const page = labSource.getPage([component], lang);
  if (!page || !isLang(lang)) notFound();
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: localeAlternates(lang, `/${component}`),
  };
}
