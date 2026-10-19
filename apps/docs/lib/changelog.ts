import { frontmatter } from "fumadocs-core/content/md/frontmatter";

export type Bump = "major" | "minor" | "patch";

const BUMPS: readonly string[] = ["major", "minor", "patch"] satisfies Bump[];

/** Whether @changesets/read takes this .changeset/ file as a changeset. */
export const isChangesetFile = (file: string): boolean =>
  file.endsWith(".md") &&
  !file.startsWith(".") &&
  !/^(readme|agents|claude|gemini)\.md$/i.test(file);

export interface PendingPackage {
  name: string;
  /** The next release's bump: the largest its changesets ask for. */
  bump: Bump;
  /** Largest bump first; the summary is markdown. */
  changes: { file: string; bump: Bump; summary: string }[];
}

/**
 * Changesets waiting for the next release, by package (A to Z). Each file holds YAML such as
 * `"owsem-ui": minor`, then the summary.
 */
export function readChangesets(files: readonly { file: string; source: string }[]) {
  const byName = new Map<string, PendingPackage["changes"]>();
  for (const { file, source } of files) {
    const { data, content } = frontmatter(source);
    for (const [name, bump] of Object.entries(data as Record<string, unknown>)) {
      if (bump === "none") continue;
      if (typeof bump !== "string" || !BUMPS.includes(bump)) {
        throw new Error(`${file}: "${name}" asks for "${bump}"; use major, minor, patch, or none.`);
      }
      const change = { file, bump: bump as Bump, summary: content.trim() };
      byName.set(name, [...(byName.get(name) ?? []), change]);
    }
  }
  return [...byName]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, changes]): PendingPackage => {
      changes.sort((a, b) => BUMPS.indexOf(a.bump) - BUMPS.indexOf(b.bump));
      return { name, bump: changes[0]?.bump ?? "patch", changes };
    });
}
