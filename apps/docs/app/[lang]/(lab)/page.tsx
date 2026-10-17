import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLang, localeAlternates } from "@/lib/i18n";
import { labSource } from "@/lib/source";

export async function generateMetadata(props: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!isLang(lang)) notFound();
  return { alternates: localeAlternates(lang, "") };
}

// DS-1: the component map is built from meta files later; for now, a plain list of Labs.
export default async function IndexPage(props: PageProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!isLang(lang)) notFound();
  return (
    <main>
      <h1>OwsemUI</h1>
      <p className="lead">{getDictionary(lang).site.description}</p>
      <ul className="component-list">
        {labSource.getPages(lang).map((page) => (
          <li key={page.url}>
            <Link href={page.url as Route}>{page.data.title}</Link>
            {page.data.description ? <p>{page.data.description}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
