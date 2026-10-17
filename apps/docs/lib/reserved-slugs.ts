// Component slugs must not clash with routes under [lang] (docs), paths proxy.ts skips (so the
// short link /<component> keeps working), or registry file names. Add new routes here.
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "api",
  "docs",
  "r",
  "registry",
  "index",
  "_next",
]);

export function assertNotReserved(slug: string): void {
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`Component slug "${slug}" clashes with a docs route. Rename the component.`);
  }
}
