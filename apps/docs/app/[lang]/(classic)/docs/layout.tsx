import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { isLang } from "@/lib/i18n";

export default async function DocsLayout({ children, params }: LayoutProps<"/[lang]/docs">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <SiteShell lang={lang}>
      <div className="site-content">{children}</div>
    </SiteShell>
  );
}
