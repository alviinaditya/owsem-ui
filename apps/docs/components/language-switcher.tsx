"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { i18n, type Lang, languageNames } from "@/lib/i18n";

/**
 * Links to the current page in every language. Paths always start with /<lang> (proxy.ts), so each
 * language has its own URL for search and sharing. The switch is a client-side navigation that
 * keeps the scroll position; RootState puts the theme back on <html> after the root layout swaps.
 */
export function LanguageSwitcher({ lang, label }: { lang: Lang; label: string }) {
  const rest = usePathname().split("/").slice(2).join("/");
  return (
    <nav aria-label={label} className="language-switcher">
      <ul className="seg">
        {i18n.languages.map((target) => (
          <li key={target}>
            <Link
              className="seg-item"
              href={`/${target}${rest ? `/${rest}` : ""}` as Route}
              scroll={false}
              hrefLang={target}
              lang={target}
              title={languageNames[target]}
              aria-current={target === lang ? "page" : undefined}
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
