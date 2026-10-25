import { type CatalogEntry, isAvailable } from "@/lib/catalog";
import { type Dictionary, format } from "@/lib/dictionaries";

const EXPRESSION_LABELS = {
  lumen: "Lumen",
  kinetic: "Kinetic",
  tactile: "Tactile",
  surface: "Surface",
};

/** Status, family, phase, and Owsem expression labels for a component. */
export function ComponentBadges({ entry, dict }: { entry: CatalogEntry; dict: Dictionary }) {
  const available = isAvailable(entry);
  return (
    <ul className="badges">
      <li className="badge" data-status={available ? "available" : "planned"}>
        {available ? dict.catalog.available : dict.catalog.comingSoon}
      </li>
      <li className="badge" data-family={entry.family}>
        {dict.catalog.families[entry.family]}
      </li>
      {entry.phase ? (
        <li className="badge" data-phase={entry.phase}>
          {format(dict.catalog.phase, { phase: entry.phase })}
        </li>
      ) : null}
      {entry.expressions?.map((expression) => (
        <li key={expression} className="badge" data-expression={expression}>
          {EXPRESSION_LABELS[expression]}
        </li>
      ))}
    </ul>
  );
}
