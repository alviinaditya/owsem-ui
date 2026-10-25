"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlideHighlight, useGlide } from "owsem-ui/core";
import { i18n, type Lang, languageNames } from "@/lib/i18n";

/**
 * Links to the current page in every language. Paths always start with /<lang> (proxy.ts), so each
 * language has its own URL for search and sharing. The switch is a client-side navigation that
 * keeps the scroll position; RootState puts the theme back on <html> after the root layout swaps.
 * Navigation, not a choice, so these are links; they look like the theme's Toggle Group beside
 * them, Glide included.
 */
export function LanguageSwitcher({ lang, label }: { lang: Lang; label: string }) {
  const rest = usePathname().split("/").slice(2).join("/");
  const glide = useGlide<HTMLElement>({ axis: "x" });
  return (
    <nav ref={glide.ref} aria-label={label} className="language-switcher">
      <GlideHighlight glide={glide} />
      <ul>
        {i18n.languages.map((target) => (
          <li key={target}>
            <Link
              href={`/${target}${rest ? `/${rest}` : ""}` as Route}
              scroll={false}
              hrefLang={target}
              lang={target}
              title={languageNames[target]}
              aria-current={target === lang ? "page" : undefined}
              data-glide-item=""
            >
              {target.toUpperCase()}
              <span className="visually-hidden"> {languageNames[target]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
