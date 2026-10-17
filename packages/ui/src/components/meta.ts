/**
 * Shape of `<component>/<component>.meta.ts`, read by the registry build and the docs. Meta
 * files are run by Node directly: erasable TypeScript only, and type-only imports.
 */
export interface ComponentMeta {
  title: string;
  description: string;
  /** "base+owsem" components get two registry items: `<name>` and `<name>-owsem`. */
  family: "base" | "owsem" | "base+owsem";
  status: "prototype" | "done";
}
