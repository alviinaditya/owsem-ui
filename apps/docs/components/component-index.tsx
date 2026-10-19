"use client";

import type { Route } from "next";
import Link from "next/link";
import { type ReactNode, useState } from "react";
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
  const shown = (family: Family) =>
    filter === "all" || family === filter || family === "base+owsem";
  return (
    <>
      <fieldset className="seg filter">
        <legend>{labels.legend}</legend>
        {FILTERS.map((value) => (
          <label key={value} className="seg-item" data-selected={filter === value ? "" : undefined}>
            <input
              type="radio"
              name="family"
              value={value}
              checked={filter === value}
              onChange={() => setFilter(value)}
            />
            {labels[value]}
          </label>
        ))}
      </fieldset>
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
