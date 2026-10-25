"use client";

import type { Route } from "next";
import Link from "next/link";
import { ToggleGroup } from "owsem-ui/base";
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

export interface IndexGroup {
  id: string;
  label: string;
  items: {
    name: ComponentName;
    href: string;
    title: string;
    description: string;
    family: Family;
    badges: ReactNode;
  }[];
}

/**
 * DS-1 for now: components grouped by category, filterable by family (all shown without JS), as a
 * grid of cards with a preview each, or a list that reads straight down.
 */
export function ComponentIndex({
  groups,
  labels,
  lang,
}: {
  groups: IndexGroup[];
  labels: Record<Filter | View, string> & { legend: string; view: string; soon: string };
  lang: Lang;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  // None is pressed until hydration; CSS raises the stored view meanwhile.
  const view = useSyncExternalStore(subscribe, readView, () => null);
  const legend = useId();
  const viewLegend = useId();
  const shown = (family: Family) => filter === "all" || family === filter;
  return (
    <>
      {/* Each group's name sits inside its track, before the choices. */}
      <div className="index-controls">
        <ToggleGroup.Root
          aria-labelledby={legend}
          className="docs-choice filter"
          value={[filter]}
          onValueChange={([next]) => next && setFilter(next)}
        >
          <span id={legend} className="filter-legend">
            {labels.legend}
          </span>
          {FILTERS.map((value) => (
            <ToggleGroup.Item key={value} value={value}>
              {labels[value]}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
        <ToggleGroup.Root
          aria-labelledby={viewLegend}
          className="docs-choice filter view-picker"
          value={view ? [view] : []}
          onValueChange={([next]) => next && chooseView(next)}
        >
          <span id={viewLegend} className="filter-legend">
            {labels.view}
          </span>
          {VIEWS.map((value) => (
            <ToggleGroup.Item key={value} value={value} data-option={value}>
              <Icon name={value === "grid" ? "layout-grid" : "list"} size={14} />
              {labels[value]}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>
      {groups.map((group) => {
        const items = group.items.filter((item) => shown(item.family));
        return items.length === 0 ? null : (
          <section key={group.id} aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`}>{group.label}</h2>
            <ul className="component-index">
              {items.map((item) => (
                <li key={item.name} className="component-card">
                  <ComponentPreview name={item.name} lang={lang} soon={labels.soon} />
                  <div className="component-card-text">
                    <Link href={item.href as Route}>{item.title}</Link>
                    <p>{item.description}</p>
                  </div>
                  {item.badges}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
