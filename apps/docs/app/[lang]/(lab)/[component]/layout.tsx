import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getDictionary } from "@/lib/dictionaries";
import { isLang } from "@/lib/i18n";
import { labPageScenes } from "@/lib/lab-template";

// The sidebar lists the current component's scenes, so the layout reads them as the page does.
export default async function ComponentLayout({
  children,
  params,
}: LayoutProps<"/[lang]/[component]">) {
  const { lang, component } = await params;
  if (!isLang(lang)) notFound();
  return (
    <SiteShell
      lang={lang}
      current={component}
      scenes={labPageScenes(component, lang, getDictionary(lang).lab.overview)}
    >
      {children}
    </SiteShell>
  );
}
