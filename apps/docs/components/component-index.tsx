"use client";

import type { Route } from "next";
import Link from "next/link";
import { ToggleGroup } from "owsem-ui/base";
import { GlideHighlight, useGlide } from "owsem-ui/core";
import { type ReactNode, useId, useState, useSyncExternalStore } from "react";
import type { ComponentName, Family } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { INDEX_VIEW_STORAGE_KEY } from "@/lib/theme";
import { ComponentPreview } from "./component-previews";
import { Icon } from "./icons/icon";

const FILTERS = ["all", "base", "owsem"] as const;
type Filter = (typeof FILTERS)[number];

const VIEWS = ["grid", "list"] as const;
type View = (typeof VIEWS)[number];

// <html data-index-view> is the source of truth, set before first paint (lib/theme.ts), so the
// stored view lays the page out without a flash. No attribute means grid.
const listeners = new Set<() => void>();

const readView = (): View =>
  document.documentElement.dataset.indexView === "list" ? "list" : "grid";

function chooseView(view: View): void {
  try {
    if (view === "list") localStorage.setItem(INDEX_VIEW_STORAGE_KEY, view);
    else localStorage.removeItem(INDEX_VIEW_STORAGE_KEY);
  } catch {
    // Storage blocked: the view still applies until the next page load.
  }
  if (view === "list") document.documentElement.dataset.indexView = view;
  else delete document.documentElement.dataset.indexView;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export interface IndexFamily {
  id: Family;
  label: string;
  note: string;
  groups: IndexGroup[];
}

interface IndexGroup {
  id: string;
  label: string;
  items: IndexItem[];
}

interface IndexItem {
  name: ComponentName;
  href: string;
  title: string;
  description: string;
  badges: ReactNode;
}

/**
 * One category's cards, lit by Glide: the nearest card in the grid, the nearest row in the list.
 * The whole card is the link, so a click in a gap stays a gap.
 */
function Cards({
  items,
  lang,
  soon,
  view,
}: {
  items: IndexItem[];
  lang: Lang;
  soon: string;
  view: View | null;
}) {
  const glide = useGlide<HTMLDivElement>({
    items: ".component-card",
    axis: view === "list" ? "y" : "xy",
    // Only across the 8px between two cards' hover boxes; an empty grid cell lights nothing.
    maxDistance: 8,
    gapClick: false,
  });
  return (
    <div ref={glide.ref} className="component-index-glide">
      <GlideHighlight glide={glide} />
      <ul className="component-index">
        {items.map((item) => (
          <li key={item.name} className="component-card">
            <ComponentPreview name={item.name} lang={lang} soon={soon} />
            <div className="component-card-text">
              <Link href={item.href as Route}>{item.title}</Link>
              <p>{item.description}</p>
            </div>
            {item.badges}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * DS-1 for now: Base components, then Owsem's, each grouped by category and filterable by family
 * (all shown without JS), as a grid of cards with a preview each, or a list that reads straight down.
 */
export function ComponentIndex({
  families,
  labels,
  lang,
}: {
  families: IndexFamily[];
  labels: Record<Filter | View, string> & { legend: string; view: string; soon: string };
  lang: Lang;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  // None is pressed until hydration; CSS raises the stored view meanwhile.
  const view = useSyncExternalStore(subscribe, readView, () => null);
  const legend = useId();
  const viewLegend = useId();
  return (
    <>
      {/* Each group's name sits before its track. */}
      <div className="index-controls">
        <div className="index-control">
          <span id={legend} className="filter-legend">
            {labels.legend}
          </span>
          <ToggleGroup.Root
            aria-labelledby={legend}
            className="docs-choice filter"
            value={[filter]}
            onValueChange={([next]) => next && setFilter(next)}
          >
            {FILTERS.map((value) => (
              <ToggleGroup.Item key={value} value={value}>
                {labels[value]}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>
        <div className="index-control">
          <span id={viewLegend} className="filter-legend">
            {labels.view}
          </span>
          <ToggleGroup.Root
            aria-labelledby={viewLegend}
            className="docs-choice filter view-picker"
            value={view ? [view] : []}
            onValueChange={([next]) => next && chooseView(next)}
          >
            {VIEWS.map((value) => (
              <ToggleGroup.Item key={value} value={value} data-option={value}>
                <Icon name={value === "grid" ? "layout-grid" : "list"} size={14} />
                {labels[value]}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>
      </div>
      {families.map((family) =>
        filter === "all" || filter === family.id ? (
          <section key={family.id} className="index-family" aria-labelledby={`family-${family.id}`}>
            <h2 id={`family-${family.id}`}>{family.label}</h2>
            <p className="lead index-family-note">{family.note}</p>
            {family.groups.map((group) => (
              <section key={group.id} aria-labelledby={`group-${group.id}`}>
                <h3 id={`group-${group.id}`}>{group.label}</h3>
                <Cards items={group.items} lang={lang} soon={labels.soon} view={view} />
              </section>
            ))}
          </section>
        ) : null,
      )}
    </>
  );
}
