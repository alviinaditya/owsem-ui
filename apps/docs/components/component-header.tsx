import { type CatalogEntry, isAvailable } from "@/lib/catalog";
import { type Dictionary, format } from "@/lib/dictionaries";

const EXPRESSION_LABELS = {
  lumen: "Lumen",
  kinetic: "Kinetic",
  tactile: "Tactile",
  surface: "Surface",
};

/**
 * The same facts as one quiet line: family · phase · expressions. Only a component that has not
 * shipped gets a badge, its status.
 */
export function ComponentMeta({ entry, dict }: { entry: CatalogEntry; dict: Dictionary }) {
  const parts = [
    dict.catalog.families[entry.family],
    entry.phase ? format(dict.catalog.phase, { phase: entry.phase }) : null,
    ...(entry.expressions?.map((expression) => EXPRESSION_LABELS[expression]) ?? []),
  ].filter(Boolean);
  return (
    <p className="meta" data-family={entry.family}>
      {isAvailable(entry) ? null : (
        <span className="badge" data-status="planned">
          {dict.catalog.comingSoon}
        </span>
      )}
      <span className="meta-text">{parts.join(" · ")}</span>
    </p>
  );
}
