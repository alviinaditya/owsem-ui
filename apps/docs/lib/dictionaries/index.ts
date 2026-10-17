import type { Lang } from "@/lib/i18n";
import { en } from "./en";
import { type Dictionary, id } from "./id";

export type { Dictionary };

// Record<Lang, …> fails the type check until every language has a dictionary.
const dictionaries: Record<Lang, Dictionary> = { id, en };

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}

/** Fills "{name}" placeholders in a dictionary string. */
export function format(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
