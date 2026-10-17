import "owsem-ui/styles.css";
import "../globals.css";
import { NextProvider } from "fumadocs-core/framework/next";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getDictionary } from "@/lib/dictionaries";
import { i18n, isLang } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { themeScript } from "@/lib/theme";

export const dynamicParams = false;

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}

export async function generateMetadata(props: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!isLang(lang)) notFound();
  return {
    metadataBase: siteUrl,
    title: { default: "OwsemUI", template: "%s · OwsemUI" },
    description: getDictionary(lang).site.description,
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
};

// The root layout lives under [lang] so <html lang> matches the page language.
export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme script, no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextProvider>
          <div className="app-root">
            <header>
              <nav aria-label={dict.nav.main}>
                <Link href={`/${lang}`}>OwsemUI</Link>{" "}
                <Link href={`/${lang}/docs`}>{dict.nav.docs}</Link>
              </nav>
              <LanguageSwitcher lang={lang} label={dict.language.label} />
              <ThemeSwitcher labels={dict.theme} />
            </header>
            {children}
          </div>
        </NextProvider>
      </body>
    </html>
  );
}
