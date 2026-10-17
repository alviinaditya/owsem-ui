import type { Metadata } from "next";
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
  const pages = labSource.getPages(lang);
  return (
    <main>
      <h1>OwsemUI</h1>
      {pages.length === 0 ? (
        <p>{getDictionary(lang).lab.empty}</p>
      ) : (
        <ul>
          {pages.map((page) => (
            <li key={page.url}>{page.data.title}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
