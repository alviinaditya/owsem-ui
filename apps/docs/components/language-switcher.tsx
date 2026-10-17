"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { i18n, type Lang, languageNames } from "@/lib/i18n";

/** Links to the current page in every language. Paths always start with /<lang> (proxy.ts). */
export function LanguageSwitcher({ lang, label }: { lang: Lang; label: string }) {
  const rest = usePathname().split("/").slice(2).join("/");
  return (
    <nav aria-label={label}>
      <ul>
        {i18n.languages.map((target) => (
          <li key={target}>
            <Link
              href={`/${target}${rest ? `/${rest}` : ""}` as Route}
              hrefLang={target}
              lang={target}
              aria-current={target === lang ? "page" : undefined}
            >
              {languageNames[target]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
