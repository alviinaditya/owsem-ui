import { defineI18n } from "fumadocs-core/i18n";

// To add a language: list it here and in `languageNames`, add lib/dictionaries/<code>.ts, and
// translate content/*/<code>/. Untranslated pages fall back to `defaultLanguage`.
export const i18n = defineI18n({
  languages: ["id", "en"],
  defaultLanguage: "id",
  parser: "dir",
});

export type Lang = (typeof i18n.languages)[number];

/** Each language's name in that language, for the language switcher. */
export const languageNames: Record<Lang, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

export function isLang(value: string): value is Lang {
  return (i18n.languages as readonly string[]).includes(value);
}

/** canonical and hreflang links. `path` has no language prefix, e.g. "/docs". */
export function localeAlternates(lang: Lang, path: string) {
  return {
    canonical: `/${lang}${path}`,
    languages: {
      ...Object.fromEntries(i18n.languages.map((l) => [l, `/${l}${path}`])),
      // The unprefixed URL negotiates the language in proxy.ts.
      "x-default": path || "/",
    },
  };
}
