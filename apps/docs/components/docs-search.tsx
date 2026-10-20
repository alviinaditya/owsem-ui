"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { CommandMenu } from "owsem-ui/owsem";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { type Dictionary, format } from "@/lib/dictionaries";
import { type SearchEntry, type SearchGroup, searchGroups } from "@/lib/search";
import { Icon } from "./icons/icon";

/** Opens the search from outside its triggers, such as the dock's button. */
export const searchHandle = CommandMenu.createHandle();

const subscribe = () => () => {};
const apple = () => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

/** "⌘K" on Apple devices, "Ctrl K" elsewhere; nothing before hydration, so it never flips. */
function useShortcutKeys(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => (apple() ? "⌘K" : "Ctrl K"),
    () => null,
  );
}

/** Whether focus can land on `el`: in the page and shown (the narrow sidebar hides with it). */
const focusable = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement &&
  el.isConnected &&
  (el.checkVisibility?.({ visibilityProperty: true }) ?? el.getClientRects().length > 0);

interface DocsSearchProps {
  groups: SearchGroup[];
  labels: Dictionary["search"];
  families: Dictionary["catalog"]["families"];
  soon: string;
}

/**
 * The docs search (DS-5), a Command Menu over every page: ⌘K or Ctrl K anywhere, the sidebar's
 * origin, or the dock's button, which reach it through its handle. It wraps nothing, so the docs'
 * other dialogs (a Lab's demo) are not nested in it. Results come from the index built with the
 * page, matched as the visitor types.
 */
export function DocsSearch({ groups, labels, families, soon }: DocsSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchGroups(groups, query), [groups, query]);
  // Where focus was when the search opened; it goes back there, or to the menu button if the
  // narrow sidebar holding it has closed since.
  const opener = useRef<Element | null>(null);

  const go = (url: string) => {
    const [path, hash] = url.split("#");
    // On the same page a scene link is a hash change, which the Lab follows.
    if (hash && path === location.pathname) location.hash = hash;
    else router.push(url as Route);
  };

  return (
    <CommandMenu.Root
      handle={searchHandle}
      items={groups}
      filteredItems={results}
      value={query}
      onValueChange={setQuery}
      onOpenChange={(open) => {
        if (!open) return;
        opener.current = document.activeElement;
        setQuery("");
      }}
    >
      <CommandMenu.Popup
        aria-label={labels.dialog}
        closeLabel={labels.close}
        className="docs-search"
        finalFocus={() => {
          if (focusable(opener.current)) return opener.current;
          const menu = document.getElementById("site-menu-button");
          return focusable(menu) ? menu : true;
        }}
      >
        <CommandMenu.Input aria-label={labels.input} placeholder={labels.placeholder} />
        <CommandMenu.Empty>{query ? format(labels.empty, { query }) : null}</CommandMenu.Empty>
        <CommandMenu.List>
          {(group: SearchGroup) => (
            <CommandMenu.Group key={group.value} items={group.items}>
              <CommandMenu.GroupLabel>{group.label}</CommandMenu.GroupLabel>
              <CommandMenu.Collection>
                {(entry: SearchEntry) => (
                  <CommandMenu.Item key={entry.value} value={entry} onClick={() => go(entry.url)}>
                    <CommandMenu.ItemIcon>
                      <Icon name={entry.icon} />
                    </CommandMenu.ItemIcon>
                    <CommandMenu.ItemLabel>{entry.label}</CommandMenu.ItemLabel>
                    <CommandMenu.ItemDescription>{entry.description}</CommandMenu.ItemDescription>
                    {entry.family ? (
                      <span className="docs-search-tag" data-family={entry.family}>
                        {families[entry.family]}
                      </span>
                    ) : null}
                    {entry.planned ? <span className="soon">{soon}</span> : null}
                  </CommandMenu.Item>
                )}
              </CommandMenu.Collection>
            </CommandMenu.Group>
          )}
        </CommandMenu.List>
        {/* Keyboard hints for the eye; the combobox announces its own keys. */}
        <CommandMenu.Footer className="docs-search-foot" aria-hidden="true">
          <span>
            <CommandMenu.Shortcut>↑</CommandMenu.Shortcut>
            <CommandMenu.Shortcut>↓</CommandMenu.Shortcut>
            {labels.move}
          </span>
          <span>
            <CommandMenu.Shortcut>↵</CommandMenu.Shortcut>
            {labels.open}
          </span>
          <span>
            <CommandMenu.Shortcut>Esc</CommandMenu.Shortcut>
            {labels.dismiss}
          </span>
        </CommandMenu.Footer>
      </CommandMenu.Popup>
    </CommandMenu.Root>
  );
}

/** The sidebar's search, at the rail's origin: a sunken field that opens the search. */
export function SearchTrigger({ label }: { label: string }) {
  const keys = useShortcutKeys();
  return (
    <CommandMenu.Trigger
      handle={searchHandle}
      className="sidebar-search"
      aria-keyshortcuts="Meta+K Control+K"
    >
      <span className="sidebar-search-label">{label}</span>
      {keys ? <CommandMenu.Shortcut aria-hidden="true">{keys}</CommandMenu.Shortcut> : null}
    </CommandMenu.Trigger>
  );
}
