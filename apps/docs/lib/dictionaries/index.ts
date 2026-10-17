import type { Lang } from "@/lib/i18n";
import { en } from "./en";
import { type Dictionary, id } from "./id";

export type { Dictionary };

// Record<Lang, …> fails the type check until every language has a dictionary.
const dictionaries: Record<Lang, Dictionary> = { id, en };

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}
