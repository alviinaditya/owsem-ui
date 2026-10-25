import "../layers.css";
import "owsem-ui/styles.css";
import "../globals.css";
import { NextProvider } from "fumadocs-core/framework/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { RootState } from "@/components/root-state";
import { SiteShell } from "@/components/site-shell";
import { ThemeScript } from "@/components/theme-script";
import { getDictionary } from "@/lib/dictionaries";
import { i18n, isLang } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export const dynamicParams = false;

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

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
    <html
      lang={lang}
      className={`${sans.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextProvider>
          <RootState />
          <div className="app-root">
            <a className="skip-link" href="#content">
              {dict.nav.skip}
            </a>
            <SiteShell lang={lang}>{children}</SiteShell>
          </div>
        </NextProvider>
      </body>
    </html>
  );
}
