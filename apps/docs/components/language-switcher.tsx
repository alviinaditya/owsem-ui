"use client";

import { usePathname } from "next/navigation";
import { i18n, type Lang, languageNames } from "@/lib/i18n";

/**
 * Links to the current page in every language. Paths always start with /<lang> (proxy.ts).
 * Plain <a> on purpose: [lang] is the root layout, and a client-side switch would remount it,
 * dropping <html data-theme> and re-creating the inline theme script.
 */
export function LanguageSwitcher({ lang, label }: { lang: Lang; label: string }) {
  const rest = usePathname().split("/").slice(2).join("/");
  return (
    <nav aria-label={label} className="language-switcher">
      <ul className="seg">
        {i18n.languages.map((target) => (
          <li key={target}>
            <a
              className="seg-item"
              href={`/${target}${rest ? `/${rest}` : ""}`}
              hrefLang={target}
              lang={target}
              title={languageNames[target]}
              aria-current={target === lang ? "page" : undefined}
            >
              {target.toUpperCase()}
              <span className="visually-hidden"> {languageNames[target]}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
