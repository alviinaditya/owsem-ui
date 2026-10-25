"use client";

import type { Route } from "next";
import Link from "next/link";
import { ToggleGroup } from "owsem-ui/base";
import { type ReactNode, useId, useState } from "react";
import type { Family } from "@/lib/catalog";

const FILTERS = ["all", "base", "owsem"] as const;
type Filter = (typeof FILTERS)[number];

export interface IndexGroup {
  id: string;
  label: string;
  items: {
    name: string;
    href: string;
    title: string;
    description: string;
    family: Family;
    badges: ReactNode;
  }[];
}

/** DS-1 for now: components grouped by category, filterable by family (all shown without JS). */
export function ComponentIndex({
  groups,
  labels,
}: {
  groups: IndexGroup[];
  labels: Record<Filter, string> & { legend: string };
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const legend = useId();
  const shown = (family: Family) => filter === "all" || family === filter;
  return (
    <>
      {/* The group's name sits inside its track, before the choices. */}
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
      {groups.map((group) => {
        const items = group.items.filter((item) => shown(item.family));
        return items.length === 0 ? null : (
          <section key={group.id} aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`}>{group.label}</h2>
            <ul className="component-list">
              {items.map((item) => (
                <li key={item.name}>
                  <Link href={item.href as Route}>{item.title}</Link>
                  <p>{item.description}</p>
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
