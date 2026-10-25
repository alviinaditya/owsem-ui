import type { IconName } from "@/components/icons/icon";
import type { Family } from "./catalog";

/**
 * The docs search (DS-5): an index built on the server with every page (lib/search-index.ts),
 * matched here in the browser. No network: the index travels with the page.
 */

export type SearchKind = "pages" | "components" | "scenes";

export interface SearchEntry {
  /** Unique across the index. */
  value: string;
  label: string;
  description: string;
  url: string;
  icon: IconName;
  /** Components only. */
  family?: Family;
  planned?: boolean;
  /** More text to match: headings, category, family. */
  words: string;
}

// A type, not an interface: Base UI's group type has an index signature.
export type SearchGroup = {
  value: SearchKind;
  label: string;
  items: SearchEntry[];
};

/** Lowercase without accents, so "categoria" finds "Categoría". */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** How tightly `term` appears in order inside `text`: 1 when adjacent, toward 0 when spread. */
function subsequence(term: string, text: string): number {
  let at = -1;
  let first = -1;
  for (const char of term) {
    at = text.indexOf(char, at + 1);
    if (at < 0) return 0;
    if (first < 0) first = at;
  }
  return term.length / (at - first + 1);
}

/** One query word against one entry; 0 means no match. Title matches beat the rest. */
function termScore(term: string, label: string, words: string, description: string): number {
  const labelWords = label.split(/[\s-]+/);
  if (label === term) return 100;
  if (label.startsWith(term)) return 60;
  if (labelWords.some((word) => word.startsWith(term))) return 45;
  if (term.length > 1 && labelWords.map((word) => word[0]).join("") === term) return 45;
  if (label.includes(term)) return 30;
  if (words.split(/\s+/).some((word) => word.startsWith(term))) return 15;
  if (description.includes(term) || words.includes(term)) return 10;
  // Fuzzy: the letters in order, such as "trnv" for Tree Rail Nav.
  if (term.length > 1) {
    const tight = subsequence(term, label);
    if (tight >= 0.3) return 2 + 8 * tight;
  }
  return 0;
}

function score(entry: SearchEntry, terms: string[]): number {
  const label = fold(entry.label);
  const words = fold(entry.words);
  const description = fold(entry.description);
  let total = 0;
  for (const term of terms) {
    const points = termScore(term, label, words, description);
    if (!points) return 0;
    total += points;
  }
  // Built components first among equals.
  return total + (entry.planned ? 0 : 1);
}

/**
 * The groups and items that match `query`, best first; every word of the query must match. An
 * empty query lists the pages and components, without the scenes.
 */
export function searchGroups(groups: readonly SearchGroup[], query: string): SearchGroup[] {
  const terms = fold(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return groups.filter((group) => group.value !== "scenes");
  return groups
    .map((group) => {
      const hits = group.items
        .map((entry, index) => ({ entry, index, score: score(entry, terms) }))
        .filter((hit) => hit.score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index);
      return { group, hits, best: hits[0]?.score ?? 0 };
    })
    .filter(({ hits }) => hits.length > 0)
    .sort((a, b) => b.best - a.best)
    .map(({ group, hits }) => ({ ...group, items: hits.map((hit) => hit.entry) }));
}
