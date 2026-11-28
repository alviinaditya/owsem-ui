"use client";

import { useSyncExternalStore } from "react";
import type { Flavor } from "@/lib/component-files";
import { INSTALL_FLAVOR_STORAGE_KEY } from "@/lib/theme";

const FLAVORS: readonly Flavor[] = ["css", "tailwind"];

// The visitor's flavor, kept across visits like the package manager.
const listeners = new Set<() => void>();

function readFlavor(): Flavor {
  try {
    const stored = localStorage.getItem(INSTALL_FLAVOR_STORAGE_KEY);
    return FLAVORS.find((flavor) => flavor === stored) ?? "css";
  } catch {
    return "css";
  }
}

export function chooseFlavor(flavor: Flavor): void {
  try {
    localStorage.setItem(INSTALL_FLAVOR_STORAGE_KEY, flavor);
  } catch {}
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === INSTALL_FLAVOR_STORAGE_KEY) listener();
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    removeEventListener("storage", onStorage);
  };
}

// The server cannot know the stored choice: null there, and CSS in the steps.
export const useStoredFlavor = () => useSyncExternalStore(subscribe, readFlavor, () => null);
